<?php

declare(strict_types=1);

namespace App\Application\Actions\Users;

use App\Domain\Services\UserService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class UpdateUserAction
{
    public function __construct(
        private UserService $userService
    ) {}

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        $id = (int) ($args['id'] ?? 0);
        $body = (array) $request->getParsedBody();

        try {
            $user = $this->userService->updateCashier(
                $id,
                (string) ($body['name'] ?? ''),
                (string) ($body['email'] ?? ''),
                isset($body['password']) ? (string) $body['password'] : null,
                isset($body['active']) ? (bool) $body['active'] : true
            );

            $payload = ['success' => true, 'data' => $user];
            $status = 200;
        } catch (\InvalidArgumentException $e) {
            $notFound = $e->getMessage() === 'Cajero no encontrado.';
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status = $notFound ? 404 : 422;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
