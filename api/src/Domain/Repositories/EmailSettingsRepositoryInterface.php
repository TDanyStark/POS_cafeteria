<?php

declare(strict_types=1);

namespace App\Domain\Repositories;

interface EmailSettingsRepositoryInterface
{
    public function get(): ?array;

    public function create(array $data): int;

    public function update(int $id, array $data): void;
}
