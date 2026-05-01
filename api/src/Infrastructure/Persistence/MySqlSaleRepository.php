<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Repositories\SaleRepositoryInterface;
use PDO;

class MySqlSaleRepository implements SaleRepositoryInterface
{
    public function __construct(
        private PDO $pdo
    ) {}

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('
             SELECT s.*,
                    u.name  AS cashier_name,
                    c.name  AS customer_name,
                    c.email AS customer_email,
                    c.phone AS customer_phone,
                    cr.opened_at AS register_opened_at
            FROM sales s
            INNER JOIN users u ON u.id = s.user_id
            LEFT  JOIN customers c ON c.id = s.customer_id
            INNER JOIN cash_registers cr ON cr.id = s.cash_register_id
            WHERE s.id = :id
        ');
        $stmt->execute(['id' => $id]);
        $sale = $stmt->fetch();

        if (!$sale) {
            return null;
        }

        $sale['items'] = $this->findItems($id);

        return $sale;
    }

    public function findAll(int $page, int $limit, array $filters = []): array
    {
        $offset = ($page - 1) * $limit;
        $params = [];
        $where  = [];

        if (!empty($filters['date_from'])) {
            $where[]              = 's.created_at >= :date_from';
            $params['date_from'] = $filters['date_from'] . ' 00:00:00';
        }

        if (!empty($filters['date_to'])) {
            $where[]            = 's.created_at <= :date_to';
            $params['date_to'] = $filters['date_to'] . ' 23:59:59';
        }

        if (!empty($filters['payment_method'])) {
            $where[]                    = 's.payment_method = :payment_method';
            $params['payment_method'] = $filters['payment_method'];
        }

        if (!empty($filters['user_id'])) {
            $where[]          = 's.user_id = :user_id';
            $params['user_id'] = (int) $filters['user_id'];
        }

        if (!empty($filters['cash_register_id'])) {
            $where[]                    = 's.cash_register_id = :cash_register_id';
            $params['cash_register_id'] = (int) $filters['cash_register_id'];
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "
            SELECT s.*,
                   u.name  AS cashier_name,
                   c.name  AS customer_name
            FROM sales s
            INNER JOIN users u ON u.id = s.user_id
            LEFT  JOIN customers c ON c.id = s.customer_id
            {$whereClause}
            ORDER BY s.created_at DESC
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

        return $stmt->fetchAll();
    }

    public function count(array $filters = []): int
    {
        $params = [];
        $where  = [];

        if (!empty($filters['date_from'])) {
            $where[]             = 's.created_at >= :date_from';
            $params['date_from'] = $filters['date_from'] . ' 00:00:00';
        }

        if (!empty($filters['date_to'])) {
            $where[]           = 's.created_at <= :date_to';
            $params['date_to'] = $filters['date_to'] . ' 23:59:59';
        }

        if (!empty($filters['payment_method'])) {
            $where[]                   = 's.payment_method = :payment_method';
            $params['payment_method'] = $filters['payment_method'];
        }

        if (!empty($filters['user_id'])) {
            $where[]           = 's.user_id = :user_id';
            $params['user_id'] = (int) $filters['user_id'];
        }

        if (!empty($filters['cash_register_id'])) {
            $where[]                    = 's.cash_register_id = :cash_register_id';
            $params['cash_register_id'] = (int) $filters['cash_register_id'];
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql         = "SELECT COUNT(*) FROM sales s {$whereClause}";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }

    public function create(
        int $cashRegisterId,
        int $userId,
        ?int $customerId,
        float $total,
        string $paymentMethod,
        float $amountPaid,
        float $changeAmount,
        ?string $notes
    ): int {
        $stmt = $this->pdo->prepare('
            INSERT INTO sales
                (cash_register_id, user_id, customer_id, total, payment_method, amount_paid, change_amount, notes, created_at, updated_at)
            VALUES
                (:cash_register_id, :user_id, :customer_id, :total, :payment_method, :amount_paid, :change_amount, :notes, NOW(), NOW())
        ');
        $stmt->execute([
            'cash_register_id' => $cashRegisterId,
            'user_id'          => $userId,
            'customer_id'      => $customerId,
            'total'            => $total,
            'payment_method'   => $paymentMethod,
            'amount_paid'      => $amountPaid,
            'change_amount'    => $changeAmount,
            'notes'            => $notes,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function createItem(int $saleId, int $productId, int $quantity, float $unitPrice, float $subtotal): int
    {
        $stmt = $this->pdo->prepare('
            INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal, created_at, updated_at)
            VALUES (:sale_id, :product_id, :quantity, :unit_price, :subtotal, NOW(), NOW())
        ');
        $stmt->execute([
            'sale_id'    => $saleId,
            'product_id' => $productId,
            'quantity'   => $quantity,
            'unit_price' => $unitPrice,
            'subtotal'   => $subtotal,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    private function findItems(int $saleId): array
    {
        $stmt = $this->pdo->prepare('
            SELECT si.*, p.name AS product_name, p.code AS product_code
            FROM sale_items si
            INNER JOIN products p ON p.id = si.product_id
            WHERE si.sale_id = :sale_id
            ORDER BY si.id ASC
        ');
        $stmt->execute(['sale_id' => $saleId]);
        return $stmt->fetchAll();
    }
}
