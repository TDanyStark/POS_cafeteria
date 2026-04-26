<?php

declare(strict_types=1);

namespace App\Domain\Repositories;

interface DebtPaymentRepositoryInterface
{
    public function findByDebtId(int $debtId): array;
    public function create(int $debtId, int $userId, ?int $cashRegisterId, float $amount, string $paymentMethod, ?string $notes): int;
}