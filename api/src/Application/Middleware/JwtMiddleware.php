<?php

declare(strict_types=1);

namespace App\Application\Middleware;

use App\Domain\Services\AuthService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class JwtMiddleware implements MiddlewareInterface
{
    public function __construct(
        private AuthService $authService
    ) {}

    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader)) {
            $payload = [
                'success' => false,
                'message' => 'Token de autorización requerido',
                'errors' => [],
            ];

            $response = $handler->handle($request);
            $response->getBody()->write(json_encode($payload));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(401);
        }

        if (!str_starts_with($authHeader, 'Bearer ')) {
            $payload = [
                'success' => false,
                'message' => 'Formato de token inválido',
                'errors' => [],
            ];

            $response = $handler->handle($request);
            $response->getBody()->write(json_encode($payload));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(401);
        }

        $token = substr($authHeader, 7);
        $payload = $this->authService->verifyToken($token);

        if ($payload === null) {
            $payload = [
                'success' => false,
                'message' => 'Token inválido o expirado',
                'errors' => [],
            ];

            $response = $handler->handle($request);
            $response->getBody()->write(json_encode($payload));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(401);
        }

        $request = $request->withAttribute('user', $payload['data']);
        $request = $request->withAttribute('tokenPayload', $payload);

        return $handler->handle($request);
    }
}
