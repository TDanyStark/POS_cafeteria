<?php

declare(strict_types=1);

namespace App\Domain\Services;

use App\Domain\Repositories\ReportRepositoryInterface;

class ReportService
{
    public function __construct(
        private ReportRepositoryInterface $reportRepository
    ) {}

    public function getTopSellers(int $page, int $perPage, array $filters = []): array
    {
        $page = max(1, $page);
        $perPage = max(1, min(100, $perPage));

        $items = $this->reportRepository->findTopSellers($page, $perPage, $filters);
        $total = $this->reportRepository->countTopSellers($filters);

        return [
            'data' => $items,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => (int) ceil($total / $perPage),
            ],
        ];
    }

    public function getSalesSummary(array $filters = []): array
    {
        return $this->reportRepository->findSalesSummary($filters);
    }

    public function getStockAlerts(int $page, int $perPage): array
    {
        $page = max(1, $page);
        $perPage = max(1, min(100, $perPage));

        $items = $this->reportRepository->findStockAlerts($page, $perPage);
        $total = $this->reportRepository->countStockAlerts();

        return [
            'data' => $items,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => (int) ceil($total / $perPage),
            ],
        ];
    }
}
