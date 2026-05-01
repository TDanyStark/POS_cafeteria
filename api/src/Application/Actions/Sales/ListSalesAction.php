<?php

declare(strict_types=1);

namespace App\Application\Actions\Sales;

use App\Domain\Services\SaleService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ListSalesAction
{
    public function __construct(
        private SaleService $saleService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $user   = $request->getAttribute('user');

        $page  = isset($params['page'])  ? (int) $params['page']  : 1;
        $limit = isset($params['limit']) ? (int) $params['limit'] : 20;

        $filters = [];

        if (!empty($params['date_from'])) {
            $filters['date_from'] = $params['date_from'];
        }

        if (!empty($params['date_to'])) {
            $filters['date_to'] = $params['date_to'];
        }

        if (!empty($params['payment_method'])) {
            $filters['payment_method'] = $params['payment_method'];
        }

        // Cashiers can only see their own sales
        if ($user['role'] === 'cashier') {
            $filters['user_id'] = (int) $user['id'];
        } elseif (!empty($params['user_id'])) {
            $filters['user_id'] = (int) $params['user_id'];
        }

        if (!empty($params['cash_register_id'])) {
            $filters['cash_register_id'] = (int) $params['cash_register_id'];
        }

        $result  = $this->saleService->list($page, $limit, $filters);
        $payload = ['success' => true, 'data' => $result['data'], 'pagination' => $result['pagination']];

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
