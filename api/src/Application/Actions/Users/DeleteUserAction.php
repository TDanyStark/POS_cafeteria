<?php

declare(strict_types=1);

namespace App\Application\Actions\Users;

use App\Domain\Services\UserService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class DeleteUserAction
{
    public function __construct(
        private UserService $userService
    ) {}

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        $id = (int) ($args['id'] ?? 0);

        try {
            $this->userService->deleteCashier($id);
            $payload = ['success' => true, 'message' => 'Cajero eliminado correctamente.'];
            $status = 200;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status = 404;
        } catch (\RuntimeException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status = $e->getCode() === 409 ? 409 : 500;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
