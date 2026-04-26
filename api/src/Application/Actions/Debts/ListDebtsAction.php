<?php

declare(strict_types=1);

namespace App\Application\Actions\Debts;

use App\Domain\Services\DebtService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ListDebtsAction
{
    public function __construct(
        private DebtService $debtService
    ) {}

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        $queryParams = $request->getQueryParams();
        $page      = isset($queryParams['page']) ? (int) $queryParams['page'] : 1;
        $limit     = isset($queryParams['limit']) ? (int) $queryParams['limit'] : 15;

        $filters = [];
        if (!empty($queryParams['status'])) {
            $filters['status'] = $queryParams['status'];
        }
        if (!empty($queryParams['customer_id'])) {
            $filters['customer_id'] = (int) $queryParams['customer_id'];
        }
        if (!empty($queryParams['customer_name'])) {
            $filters['customer_name'] = $queryParams['customer_name'];
        }

        $result = $this->debtService->list($page, $limit, $filters);

        $payload = ['success' => true, 'data' => $result['data'], 'pagination' => $result['pagination']];
        $status  = 200;

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}