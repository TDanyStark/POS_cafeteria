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
        $data = $this->reportService->getStockAlerts();

        $payload = ['success' => true, 'data' => $data];

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
