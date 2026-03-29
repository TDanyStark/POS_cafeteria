<?php

declare(strict_types=1);

namespace App\Application\Actions\Auth;

use App\Domain\Entities\User;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class MeAction
{
    public function __invoke(Request $request, Response $response): Response
    {
        $userData = $request->getAttribute('user');

        if (!$userData) {
            $payload = [
                'success' => false,
                'message' => 'No autenticado',
                'errors' => [],
            ];

            $response->getBody()->write(json_encode($payload));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(401);
        }

        $user = new User(
            $userData['id'],
            $userData['name'],
            $userData['email'],
            '',
            $userData['role'],
            true
        );

        $payload = [
            'success' => true,
            'data' => $user->toPublicArray(),
        ];

        $response->getBody()->write(json_encode($payload));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(200);
    }
}
