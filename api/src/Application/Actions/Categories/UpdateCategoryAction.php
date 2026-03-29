<?php

declare(strict_types=1);

namespace App\Application\Actions\Categories;

use App\Domain\Services\CategoryService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class UpdateCategoryAction
{
    public function __construct(
        private CategoryService $categoryService
    ) {}

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        $id   = (int) ($args['id'] ?? 0);
        $body = (array) $request->getParsedBody();
        $name = trim($body['name'] ?? '');

        if ($name === '') {
            $payload = ['success' => false, 'message' => 'El nombre es requerido.', 'errors' => ['name' => 'Campo obligatorio']];
            $response->getBody()->write(json_encode($payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(422);
        }

        try {
            $category = $this->categoryService->update($id, $name);
            $payload  = ['success' => true, 'data' => $category];
            $status   = 200;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = 422;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
