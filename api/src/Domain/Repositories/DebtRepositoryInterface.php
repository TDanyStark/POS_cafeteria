<?php

declare(strict_types=1);

namespace App\Domain\Repositories;

interface DebtRepositoryInterface
{
    public function findById(int $id): ?array;
    public function findByCustomerId(int $customerId): array;
    public function findBySaleId(int $saleId): ?array;
    public function findAll(int $page, int $limit, array $filters = []): array;
    public function count(array $filters = []): int;
    public function create(int $customerId, int $saleId, float $originalAmount, float $remainingAmount): int;
    public function update(int $id, float $paidAmount, float $remainingAmount, string $status): void;
}