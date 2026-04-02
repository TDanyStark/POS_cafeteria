<?php

declare(strict_types=1);

namespace App\Domain\Repositories;

use App\Domain\Entities\User;

interface UserRepositoryInterface
{
    public function findById(int $id): ?User;
    public function findByEmail(string $email): ?User;
    public function findAll(): array;
    public function findCashiers(int $page, int $perPage, ?string $search = null, ?bool $active = null): array;
    public function countCashiers(?string $search = null, ?bool $active = null): int;
    public function emailExists(string $email, ?int $excludeId = null): bool;
    public function updateCashier(int $id, array $data): ?User;
    public function save(User $user): User;
    public function update(User $user): User;
    public function delete(int $id): bool;
}
