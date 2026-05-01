<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Repositories\DebtPaymentRepositoryInterface;
use PDO;

class MySqlDebtPaymentRepository implements DebtPaymentRepositoryInterface
{
    public function __construct(
        private PDO $pdo
    ) {}

    public function findByDebtId(int $debtId): array
    {
        $stmt = $this->pdo->prepare('
            SELECT dp.*,
                   u.name AS user_name,
                   cr.opened_at AS register_opened_at
            FROM debt_payments dp
            INNER JOIN users u ON u.id = dp.user_id
            LEFT JOIN cash_registers cr ON cr.id = dp.cash_register_id
            WHERE dp.debt_id = :debt_id
            ORDER BY dp.created_at DESC
        ');
        $stmt->execute(['debt_id' => $debtId]);
        return $stmt->fetchAll();
    }

    public function create(int $debtId, int $userId, ?int $cashRegisterId, int $amount, string $paymentMethod, ?string $notes): int
    {
        $stmt = $this->pdo->prepare('
            INSERT INTO debt_payments
                (debt_id, user_id, cash_register_id, amount, payment_method, notes, created_at, updated_at)
            VALUES
                (:debt_id, :user_id, :cash_register_id, :amount, :payment_method, :notes, NOW(), NOW())
        ');
        $stmt->execute([
            'debt_id'          => $debtId,
            'user_id'          => $userId,
            'cash_register_id'  => $cashRegisterId,
            'amount'         => $amount,
            'payment_method'   => $paymentMethod,
            'notes'         => $notes,
        ]);
        return (int) $this->pdo->lastInsertId();
    }
}