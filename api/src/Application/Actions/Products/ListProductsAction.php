<?php

declare(strict_types=1);

namespace App\Application\Actions\Products;

use App\Domain\Services\ProductService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ListProductsAction
{
    public function __construct(
        private ProductService $productService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $params     = $request->getQueryParams();
        $page       = max(1, (int) ($params['page'] ?? 1));
        $perPage    = min(100, max(1, (int) ($params['per_page'] ?? 15)));
        $categoryId = isset($params['category_id']) && $params['category_id'] !== '' ? (int) $params['category_id'] : null;
        $search     = isset($params['search']) && $params['search'] !== '' ? $params['search'] : null;
        $active     = isset($params['active']) && $params['active'] !== '' ? ($params['active'] === '1' || $params['active'] === 'true') : null;

        $result  = $this->productService->getAll($page, $perPage, $categoryId, $search, $active);
        $payload = ['success' => true, 'data' => $result['data'], 'pagination' => $result['pagination']];

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
