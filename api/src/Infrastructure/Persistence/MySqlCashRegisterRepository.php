<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Repositories\CashRegisterRepositoryInterface;
use PDO;

class MySqlCashRegisterRepository implements CashRegisterRepositoryInterface
{
    public function __construct(
        private PDO $pdo
    ) {}

    public function list(array $filters): array
    {
        $query = "
            SELECT cr.*, u.name AS user_name
            FROM cash_registers cr
            INNER JOIN users u ON u.id = cr.user_id
            WHERE 1=1
        ";
        $params = [];

        if (!empty($filters['from'])) {
            $query .= " AND DATE(cr.opened_at) >= :from";
            $params['from'] = $filters['from'];
        }

        if (!empty($filters['to'])) {
            $query .= " AND DATE(cr.opened_at) <= :to";
            $params['to'] = $filters['to'];
        }

        if (!empty($filters['user_id'])) {
            $query .= " AND cr.user_id = :user_id";
            $params['user_id'] = $filters['user_id'];
        }

        $query .= " ORDER BY cr.opened_at DESC";

        $stmt = $this->pdo->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function findOpenByUserId(int $userId): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT * FROM cash_registers
            WHERE user_id = :user_id AND status = 'open'
            ORDER BY opened_at DESC
            LIMIT 1
        ");
        $stmt->execute(['user_id' => $userId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findLastOpenRegister(int $userId): ?array
    {
        return $this->findOpenByUserId($userId);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare("
            SELECT cr.*, u.name AS user_name, u.email AS user_email
            FROM cash_registers cr
            INNER JOIN users u ON u.id = cr.user_id
            WHERE cr.id = :id
        ");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByIdWithMovements(int $id): ?array
    {
        $register = $this->findById($id);

        if ($register === null) {
            return null;
        }

        $register['movements']      = $this->getMovements($id);
        $register['manual_cash_in'] = $this->sumCashIn($id);
        $register['manual_cash_out']= $this->sumCashOut($id);
        $register['cash_sales']     = $this->sumCashSales($id);
        $register['transfer_sales'] = $this->sumTransferSales($id);

        $initialAmount = (float) $register['initial_amount'];
        $register['expected_amount'] = $initialAmount 
            + (float) $register['manual_cash_in'] 
            - (float) $register['manual_cash_out'] 
            + (float) $register['cash_sales'];

        return $register;
    }

    public function create(int $userId, float $initialAmount): int
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO cash_registers (user_id, initial_amount, status, opened_at, created_at, updated_at)
            VALUES (:user_id, :initial_amount, 'open', NOW(), NOW(), NOW())
        ");
        $stmt->execute([
            'user_id'        => $userId,
            'initial_amount' => $initialAmount,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function close(int $id, float $declaredAmount, float $finalAmount, float $difference): bool
    {
        $stmt = $this->pdo->prepare("
            UPDATE cash_registers
            SET status          = 'closed',
                closed_at       = NOW(),
                declared_amount = :declared_amount,
                final_amount    = :final_amount,
                difference      = :difference,
                updated_at      = NOW()
            WHERE id = :id
        ");
        return $stmt->execute([
            'id'              => $id,
            'declared_amount' => $declaredAmount,
            'final_amount'    => $finalAmount,
            'difference'      => $difference,
        ]);
    }

    public function addMovement(int $cashRegisterId, int $userId, string $type, float $amount, string $description): int
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO cash_movements (cash_register_id, user_id, type, amount, description, created_at, updated_at)
            VALUES (:cash_register_id, :user_id, :type, :amount, :description, NOW(), NOW())
        ");
        $stmt->execute([
            'cash_register_id' => $cashRegisterId,
            'user_id'          => $userId,
            'type'             => $type,
            'amount'           => $amount,
            'description'      => $description,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function getMovements(int $cashRegisterId): array
    {
        $stmt = $this->pdo->prepare("
            SELECT cm.*, u.name AS user_name
            FROM cash_movements cm
            INNER JOIN users u ON u.id = cm.user_id
            WHERE cm.cash_register_id = :cash_register_id
            ORDER BY cm.created_at ASC
        ");
        $stmt->execute(['cash_register_id' => $cashRegisterId]);
        return $stmt->fetchAll();
    }

    public function sumCashIn(int $cashRegisterId): float
    {
        $stmt = $this->pdo->prepare("
            SELECT COALESCE(SUM(amount), 0) FROM cash_movements
            WHERE cash_register_id = :id AND type = 'in'
        ");
        $stmt->execute(['id' => $cashRegisterId]);
        return (float) $stmt->fetchColumn();
    }

    public function sumCashOut(int $cashRegisterId): float
    {
        $stmt = $this->pdo->prepare("
            SELECT COALESCE(SUM(amount), 0) FROM cash_movements
            WHERE cash_register_id = :id AND type = 'out'
        ");
        $stmt->execute(['id' => $cashRegisterId]);
        return (float) $stmt->fetchColumn();
    }

    public function sumCashSales(int $cashRegisterId): float
    {
        $stmt = $this->pdo->prepare("
            SELECT COALESCE(SUM(total), 0) FROM sales
            WHERE cash_register_id = :id AND payment_method = 'cash'
        ");
        $stmt->execute(['id' => $cashRegisterId]);
        return (float) $stmt->fetchColumn();
    }

    public function sumTransferSales(int $cashRegisterId): float
    {
        $stmt = $this->pdo->prepare("
            SELECT COALESCE(SUM(total), 0) FROM sales
            WHERE cash_register_id = :id AND payment_method = 'transfer'
        ");
        $stmt->execute(['id' => $cashRegisterId]);
        return (float) $stmt->fetchColumn();
    }
}
