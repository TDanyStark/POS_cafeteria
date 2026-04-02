<?php

declare(strict_types=1);

namespace App\Application\Actions\Customers;

use App\Domain\Services\CustomerService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class GetCustomerAction
{
    public function __construct(
        private CustomerService $customerService
    ) {}

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        try {
            $customer = $this->customerService->getById((int) $args['id']);
            $payload  = ['success' => true, 'data' => $customer];
            $status   = 200;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = 404;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
