<?php

declare(strict_types=1);

namespace App\Application\Actions\Sales;

use App\Domain\Services\SaleService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class GetSaleAction
{
    public function __construct(
        private SaleService $saleService
    ) {}

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        try {
            $sale    = $this->saleService->getById((int) $args['id']);
            $payload = ['success' => true, 'data' => $sale];
            $status  = 200;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = 404;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
