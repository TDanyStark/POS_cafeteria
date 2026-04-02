<?php

declare(strict_types=1);

namespace App\Application\Actions\Customers;

use App\Domain\Services\CustomerService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ListCustomersAction
{
    public function __construct(
        private CustomerService $customerService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();

        $page   = isset($params['page'])   ? (int) $params['page']   : 1;
        $limit  = isset($params['limit'])  ? (int) $params['limit']  : 20;
        $search = $params['search'] ?? '';

        // Handle autocomplete search
        if (!empty($params['q'])) {
            $customers = $this->customerService->search($params['q'], 10);
            $payload   = ['success' => true, 'data' => $customers];
            $response->getBody()->write(json_encode($payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }

        $result  = $this->customerService->list($page, $limit, $search);
        $payload = ['success' => true, 'data' => $result['data'], 'pagination' => $result['pagination']];

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
