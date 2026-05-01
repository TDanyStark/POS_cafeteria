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
    public function create(int $customerId, int $saleId, int $originalAmount, int $remainingAmount): int;
    public function update(int $id, int $paidAmount, int $remainingAmount, string $status): void;
}