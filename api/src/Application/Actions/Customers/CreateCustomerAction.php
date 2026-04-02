<?php

declare(strict_types=1);

namespace App\Application\Actions\Customers;

use App\Domain\Services\CustomerService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CreateCustomerAction
{
    public function __construct(
        private CustomerService $customerService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $body = (array) $request->getParsedBody();

        try {
            $customer = $this->customerService->create(
                $body['name']  ?? '',
                isset($body['phone']) && $body['phone'] !== '' ? $body['phone'] : null,
                isset($body['email']) && $body['email'] !== '' ? $body['email'] : null
            );
            $payload = ['success' => true, 'data' => $customer];
            $status  = 201;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = 422;
        } catch (\RuntimeException $e) {
            $code    = $e->getCode() === 409 ? 409 : 500;
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = $code;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
