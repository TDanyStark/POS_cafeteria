<?php

declare(strict_types=1);

namespace App\Domain\Repositories;

interface ProductRepositoryInterface
{
    public function findAll(int $page, int $perPage, ?int $categoryId, ?string $search, ?bool $active): array;
    public function count(?int $categoryId, ?string $search, ?bool $active): int;
    public function findById(int $id): ?array;
    public function create(array $data): int;
    public function update(int $id, array $data): bool;
    public function delete(int $id): bool;
    public function updateStock(int $id, int $quantity): bool;
}
