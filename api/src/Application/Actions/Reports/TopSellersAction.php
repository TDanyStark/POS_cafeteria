<?php

declare(strict_types=1);

namespace App\Application\Actions\Reports;

use App\Domain\Services\ReportService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class TopSellersAction
{
    public function __construct(
        private ReportService $reportService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();

        $limit = isset($params['limit']) ? (int) $params['limit'] : 10;
        $limit = max(1, min(50, $limit));

        $filters = [];

        if (!empty($params['date_from'])) {
            $filters['date_from'] = $params['date_from'];
        }

        if (!empty($params['date_to'])) {
            $filters['date_to'] = $params['date_to'];
        }

        $data = $this->reportService->getTopSellers($limit, $filters);

        $payload = ['success' => true, 'data' => $data];

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
