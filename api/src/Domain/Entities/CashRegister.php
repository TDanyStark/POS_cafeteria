<?php

declare(strict_types=1);

namespace App\Domain\Entities;

class CashRegister
{
    public function __construct(
        public readonly int $id,
        public readonly int $userId,
        public readonly string $openedAt,
        public readonly ?string $closedAt,
        public readonly ?int $closedByUserId,
        public readonly int $initialAmount,
        public readonly ?int $finalAmount,
        public readonly ?int $declaredAmount,
        public readonly ?int $difference,
        public readonly string $status,
        public readonly string $createdAt,
        public readonly string $updatedAt,
    ) {}
}
