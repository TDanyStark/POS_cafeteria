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
        $categories = $this->categoryService->getAll();

        $payload = ['success' => true, 'data' => $categories];
        $response->getBody()->write(json_encode($payload));

        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
