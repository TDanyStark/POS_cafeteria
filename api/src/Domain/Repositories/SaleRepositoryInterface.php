<?php

declare(strict_types=1);

namespace App\Domain\Repositories;

interface SaleRepositoryInterface
{
    /**
     * Find a sale by ID with its items.
     */
    public function findById(int $id): ?array;

    /**
     * List sales with pagination and filters.
     */
    public function findAll(int $page, int $limit, array $filters = []): array;

    /**
     * Count sales matching filters.
     */
    public function count(array $filters = []): int;

    /**
     * Create a new sale and return its ID.
     */
    public function create(
        int $cashRegisterId,
        int $userId,
        ?int $customerId,
        int $total,
        string $paymentMethod,
        int $amountPaid,
        int $changeAmount,
        ?string $notes
    ): int;

    /**
     * Insert a sale item.
     */
    public function createItem(int $saleId, int $productId, int $quantity, int $unitPrice, int $subtotal): int;
}
