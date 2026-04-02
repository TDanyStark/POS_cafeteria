<?php

declare(strict_types=1);

namespace App\Application\Actions\Users;

use App\Domain\Services\UserService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CreateUserAction
{
    public function __construct(
        private UserService $userService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $body = (array) $request->getParsedBody();

        try {
            $user = $this->userService->createCashier(
                (string) ($body['name'] ?? ''),
                (string) ($body['email'] ?? ''),
                (string) ($body['password'] ?? ''),
                isset($body['active']) ? (bool) $body['active'] : true
            );

            $payload = ['success' => true, 'data' => $user];
            $status = 201;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status = 422;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
