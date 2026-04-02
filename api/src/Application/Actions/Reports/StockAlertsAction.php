<?php

declare(strict_types=1);

namespace App\Application\Actions\Reports;

use App\Domain\Services\ReportService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class StockAlertsAction
{
    public function __construct(
        private ReportService $reportService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();

        $page = max(1, (int) ($params['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($params['per_page'] ?? 20)));

        $result = $this->reportService->getStockAlerts($page, $perPage);

        $payload = [
            'success' => true,
            'data' => $result['data'],
            'pagination' => $result['pagination'],
        ];

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
