<?php

declare(strict_types=1);

namespace App\Domain\Repositories;

interface CategoryRepositoryInterface
{
    public function findAll(): array;
    public function findById(int $id): ?array;
    public function findBySlug(string $slug): ?array;
    public function create(array $data): int;
    public function update(int $id, array $data): bool;
    public function delete(int $id): bool;
    public function hasProducts(int $id): bool;
}
