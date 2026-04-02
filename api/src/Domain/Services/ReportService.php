<?php

declare(strict_types=1);

namespace App\Domain\Services;

use App\Domain\Repositories\ReportRepositoryInterface;

class ReportService
{
    public function __construct(
        private ReportRepositoryInterface $reportRepository
    ) {}

    public function getTopSellers(int $limit, array $filters = []): array
    {
        return $this->reportRepository->findTopSellers($limit, $filters);
    }

    public function getSalesSummary(array $filters = []): array
    {
        return $this->reportRepository->findSalesSummary($filters);
    }

    public function getStockAlerts(): array
    {
        return $this->reportRepository->findStockAlerts();
    }
}
