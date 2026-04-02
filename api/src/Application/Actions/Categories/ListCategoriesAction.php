<?php

declare(strict_types=1);

namespace App\Application\Actions\Categories;

use App\Domain\Services\CategoryService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ListCategoriesAction
{
    public function __construct(
        private CategoryService $categoryService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();

        $page = max(1, (int) ($params['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($params['per_page'] ?? 20)));
        $search = isset($params['search']) && $params['search'] !== ''
            ? (string) $params['search']
            : null;

        $result = $this->categoryService->getAll($page, $perPage, $search);

        $payload = [
            'success' => true,
            'data' => $result['data'],
            'pagination' => $result['pagination'],
        ];
        $response->getBody()->write(json_encode($payload));

        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
