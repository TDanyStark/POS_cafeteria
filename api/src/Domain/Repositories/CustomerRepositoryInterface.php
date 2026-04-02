<?php

declare(strict_types=1);

namespace App\Domain\Repositories;

interface CustomerRepositoryInterface
{
    /**
     * Find a customer by ID.
     */
    public function findById(int $id): ?array;

    /**
     * Find a customer by phone number.
     */
    public function findByPhone(string $phone): ?array;

    /**
     * List customers with pagination and optional search.
     */
    public function findAll(int $page, int $limit, string $search = ''): array;

    /**
     * Count all customers matching optional search.
     */
    public function count(string $search = ''): int;

    /**
     * Create a new customer and return its ID.
     */
    public function create(string $name, ?string $phone, ?string $email): int;

    /**
     * Search customers by name or phone (for autocomplete).
     */
    public function search(string $query, int $limit = 10): array;
}
