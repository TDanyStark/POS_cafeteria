<?php

declare(strict_types=1);

namespace App\Application\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class RoleMiddleware implements MiddlewareInterface
{
    private array $allowedRoles;

    public function __construct(array $allowedRoles)
    {
        $this->allowedRoles = $allowedRoles;
    }

    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        $user = $request->getAttribute('user');

        if (!$user || !isset($user['role'])) {
            $payload = [
                'success' => false,
                'message' => 'Acceso denegado',
                'errors' => [],
            ];

            $response = $handler->handle($request);
            $response->getBody()->write(json_encode($payload));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(403);
        }

        if (!in_array($user['role'], $this->allowedRoles, true)) {
            $payload = [
                'success' => false,
                'message' => 'No tienes permisos para acceder a este recurso',
                'errors' => [],
            ];

            $response = $handler->handle($request);
            $response->getBody()->write(json_encode($payload));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(403);
        }

        return $handler->handle($request);
    }
}
