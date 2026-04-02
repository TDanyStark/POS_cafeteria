<?php

declare(strict_types=1);

namespace App\Domain\Repositories;

interface ReportRepositoryInterface
{
    /**
     * Get top selling products with optional date filters.
     */
    public function findTopSellers(int $limit, array $filters = []): array;

    /**
     * Get sales summary aggregated by period and payment method.
     */
    public function findSalesSummary(array $filters = []): array;

    /**
     * Get products with stock <= min_stock.
     */
    public function findStockAlerts(): array;
}
