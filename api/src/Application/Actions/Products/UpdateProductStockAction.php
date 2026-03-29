<?php

declare(strict_types=1);

namespace App\Application\Actions\Products;

use App\Domain\Services\ProductService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class UpdateProductStockAction
{
    public function __construct(
        private ProductService $productService
    ) {}

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        $id   = (int) ($args['id'] ?? 0);
        $body = (array) $request->getParsedBody();

        if (!isset($body['quantity'])) {
            $payload = ['success' => false, 'message' => 'El campo quantity es requerido.', 'errors' => ['quantity' => 'Campo obligatorio']];
            $response->getBody()->write(json_encode($payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(422);
        }

        try {
            $product = $this->productService->updateStock($id, (int) $body['quantity']);
            $payload = ['success' => true, 'data' => $product];
            $status  = 200;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = 422;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
