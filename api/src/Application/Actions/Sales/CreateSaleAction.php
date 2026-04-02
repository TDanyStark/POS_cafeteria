<?php

declare(strict_types=1);

namespace App\Application\Actions\Sales;

use App\Domain\Services\SaleService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CreateSaleAction
{
    public function __construct(
        private SaleService $saleService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $body = (array) $request->getParsedBody();

        try {
            $sale    = $this->saleService->create((int) $user['id'], $body);
            $payload = ['success' => true, 'data' => $sale];
            $status  = 201;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = 422;
        } catch (\RuntimeException $e) {
            $code    = in_array($e->getCode(), [403, 409, 422], true) ? $e->getCode() : 500;
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = $code;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
