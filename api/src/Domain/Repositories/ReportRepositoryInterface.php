<?php

declare(strict_types=1);

namespace App\Domain\Repositories;

interface ReportRepositoryInterface
{
    /**
     * Get top selling products with optional date filters.
     */
    public function findTopSellers(int $page, int $perPage, array $filters = []): array;

    /**
     * Count total products present in top sellers ranking result.
     */
    public function countTopSellers(array $filters = []): int;

    /**
     * Get sales summary aggregated by period and payment method.
     */
    public function findSalesSummary(array $filters = []): array;

    /**
     * Get products with stock <= min_stock.
     */
    public function findStockAlerts(int $page, int $perPage): array;

    /**
     * Count products with stock <= min_stock.
     */
    public function countStockAlerts(): int;
}
