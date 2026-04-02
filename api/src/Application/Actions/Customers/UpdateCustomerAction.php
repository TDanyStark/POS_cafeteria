<?php

declare(strict_types=1);

namespace App\Application\Actions\Customers;

use App\Domain\Services\CustomerService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class UpdateCustomerAction
{
    public function __construct(
        private CustomerService $customerService
    ) {}

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        $id = (int) $args['id'];
        $body = (array) $request->getParsedBody();

        try {
            $customer = $this->customerService->update(
                $id,
                $body['name']  ?? '',
                isset($body['phone']) && $body['phone'] !== '' ? $body['phone'] : null,
                isset($body['email']) && $body['email'] !== '' ? $body['email'] : null
            );
            $payload = ['success' => true, 'data' => $customer];
            $status  = 200;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = 400;
        } catch (\RuntimeException $e) {
            $code    = $e->getCode() === 409 ? 409 : 500;
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = $code;
        } catch (\Throwable $e) {
            $payload = ['success' => false, 'message' => 'Error interno del servidor', 'errors' => []];
            $status  = 500;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
