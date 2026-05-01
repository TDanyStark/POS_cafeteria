<?php

declare(strict_types=1);

namespace App\Application\Actions\Auth;

use App\Domain\Services\AuthService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class LoginAction
{
    public function __construct(
        private AuthService $authService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();

        if (empty($data['email']) || empty($data['password'])) {
            $payload = [
                'success' => false,
                'message' => 'Email y contraseña son requeridos',
                'errors' => [
                    'email' => empty($data['email']) ? 'El email es requerido' : null,
                    'password' => empty($data['password']) ? 'La contraseña es requerida' : null,
                ],
            ];

            $response->getBody()->write(json_encode($payload));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(422);
        }

        try {
            $user = $this->authService->validateCredentials($data['email'], $data['password']);
        } catch (\RuntimeException $e) {
            $payload = [
                'success' => false,
                'message' => $e->getMessage(),
                'errors' => [],
            ];

            $response->getBody()->write(json_encode($payload));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus($e->getCode() === 403 ? 403 : 500);
        }

        if ($user === null) {
            $payload = [
                'success' => false,
                'message' => 'Credenciales inválidas',
                'errors' => [],
            ];

            $response->getBody()->write(json_encode($payload));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(401);
        }

        $token = $this->authService->generateToken($user);

        $payload = [
            'success' => true,
            'data' => [
                'token' => $token,
                'user' => $user->toPublicArray(),
            ],
        ];

        $response->getBody()->write(json_encode($payload));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(200);
    }
}
