<?php

declare(strict_types=1);

namespace App\Domain\Entities;

class CashMovement
{
    public function __construct(
        public readonly int $id,
        public readonly int $cashRegisterId,
        public readonly int $userId,
        public readonly string $type,
        public readonly int $amount,
        public readonly string $description,
        public readonly string $createdAt,
        public readonly string $updatedAt,
    ) {}
}
