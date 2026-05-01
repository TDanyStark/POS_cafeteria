<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Repositories\DebtRepositoryInterface;
use PDO;

class MySqlDebtRepository implements DebtRepositoryInterface
{
    public function __construct(
        private PDO $pdo
    ) {}

    private function mapDebt(array &$debt): void
    {
        $originalAmount = (int) $debt['original_amount'];
        // paid_amount in DB is the canonical total paid (set on create from amount_paid, updated on each payment)
        $paidAmount = (int) $debt['paid_amount'];
        $debt['paid_amount'] = $paidAmount;
        $debt['remaining_amount'] = max(0, $originalAmount - $paidAmount);
        // expose initial payment as informational only — never add to paid_amount again
        $debt['initial_payment_amount'] = (int) $debt['amount_paid'];
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('
            SELECT cd.*,
                   c.name AS customer_name,
                   c.phone AS customer_phone,
                   c.email AS customer_email,
                   s.total AS sale_total,
                   s.payment_method,
                   s.amount_paid,
                   s.created_at AS sale_created_at,
                   s.user_id AS sale_user_id,
                   u.name AS sale_user_name
            FROM customer_debts cd
            INNER JOIN customers c ON c.id = cd.customer_id
            INNER JOIN sales s ON s.id = cd.sale_id
            LEFT JOIN users u ON u.id = s.user_id
            WHERE cd.id = :id
        ');
        $stmt->execute(['id' => $id]);
        $debt = $stmt->fetch();
        if ($debt) {
            $this->mapDebt($debt);
        }
        return $debt ?: null;
    }

    public function findByCustomerId(int $customerId): array
    {
        $stmt = $this->pdo->prepare('
            SELECT cd.*,
                   s.total AS sale_total,
                   s.payment_method,
                   s.amount_paid,
                   s.created_at AS sale_created_at
            FROM customer_debts cd
            INNER JOIN sales s ON s.id = cd.sale_id
            WHERE cd.customer_id = :customer_id
            ORDER BY cd.created_at DESC
        ');
        $stmt->execute(['customer_id' => $customerId]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$debt) {
            $this->mapDebt($debt);
        }
        return $rows;
    }

    public function findBySaleId(int $saleId): ?array
    {
        $stmt = $this->pdo->prepare('
            SELECT cd.*,
                   c.name AS customer_name,
                   c.phone AS customer_phone,
                   c.email AS customer_email,
                   s.total AS sale_total,
                   s.payment_method,
                   s.amount_paid,
                   s.created_at AS sale_created_at,
                   s.user_id AS sale_user_id,
                   u.name AS sale_user_name
            FROM customer_debts cd
            INNER JOIN customers c ON c.id = cd.customer_id
            INNER JOIN sales s ON s.id = cd.sale_id
            LEFT JOIN users u ON u.id = s.user_id
            WHERE cd.sale_id = :sale_id
        ');
        $stmt->execute(['sale_id' => $saleId]);
        $debt = $stmt->fetch();
        if ($debt) {
            $this->mapDebt($debt);
        }
        return $debt ?: null;
    }

    public function findAll(int $page, int $limit, array $filters = []): array
    {
        $offset = ($page - 1) * $limit;
        $params = [];
        $where  = [];

        if (!empty($filters['customer_id'])) {
            $where[]                = 'cd.customer_id = :customer_id';
            $params['customer_id'] = (int) $filters['customer_id'];
        }

        if (!empty($filters['status'])) {
            $where[]          = 'cd.status = :status';
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['customer_name'])) {
            $where[]                   = 'c.name LIKE :customer_name';
            $params['customer_name'] = '%' . $filters['customer_name'] . '%';
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "
            SELECT cd.*,
                   c.name AS customer_name,
                   c.phone AS customer_phone,
                   c.email AS customer_email,
                   s.total AS sale_total,
                   s.payment_method,
                   s.amount_paid,
                   s.created_at AS sale_created_at,
                   s.user_id AS sale_user_id,
                   u.name AS sale_user_name
            FROM customer_debts cd
            INNER JOIN customers c ON c.id = cd.customer_id
            INNER JOIN sales s ON s.id = cd.sale_id
            LEFT JOIN users u ON u.id = s.user_id
            {$whereClause}
            ORDER BY cd.created_at DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->pdo->prepare($sql);

        foreach ($params as $key => $value) {
            if (is_int($value)) {
                $stmt->bindValue(':' . $key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
            }
        }

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        foreach ($rows as &$debt) {
            $this->mapDebt($debt);
        }
        return $rows;
    }

    public function count(array $filters = []): int
    {
        $params = [];
        $where  = [];

        if (!empty($filters['customer_id'])) {
            $where[]                = 'cd.customer_id = :customer_id';
            $params['customer_id'] = (int) $filters['customer_id'];
        }

        if (!empty($filters['status'])) {
            $where[]          = 'cd.status = :status';
            $params['status'] = $filters['status'];
        }

        if (!empty($filters['customer_name'])) {
            $where[]                   = 'c.name LIKE :customer_name';
            $params['customer_name'] = '%' . $filters['customer_name'] . '%';
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql         = "SELECT COUNT(*) FROM customer_debts cd INNER JOIN customers c ON c.id = cd.customer_id {$whereClause}";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }

    public function create(int $customerId, int $saleId, int $originalAmount, int $remainingAmount): int
    {
        $paidAmount = $originalAmount - $remainingAmount;

        // status correcto según bizant: partial si hay abono, pending si no, paid si saldo 0
        if ($remainingAmount <= 0) {
            $status = 'paid';
        } elseif ($paidAmount > 0) {
            $status = 'partial';
        } else {
            $status = 'pending';
        }

        $stmt = $this->pdo->prepare('
            INSERT INTO customer_debts
                (customer_id, sale_id, original_amount, paid_amount, remaining_amount, status, created_at, updated_at)
            VALUES
                (:customer_id, :sale_id, :original_amount, :paid_amount, :remaining_amount, :status, NOW(), NOW())
        ');
        $stmt->execute([
            'customer_id'     => $customerId,
            'sale_id'         => $saleId,
            'original_amount' => $originalAmount,
            'paid_amount'     => $paidAmount,
            'remaining_amount' => $remainingAmount,
            'status'          => $status,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, int $paidAmount, int $remainingAmount, string $status): void
    {
        $stmt = $this->pdo->prepare('
            UPDATE customer_debts
            SET paid_amount = :paid_amount,
                remaining_amount = :remaining_amount,
                status = :status,
                updated_at = NOW()
            WHERE id = :id
        ');
        $stmt->execute([
            'id'               => $id,
            'paid_amount'      => $paidAmount,
            'remaining_amount' => $remainingAmount,
            'status'         => $status,
        ]);
    }
}