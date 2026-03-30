<?php

declare(strict_types=1);

namespace App\Application\Middleware;

use App\Domain\Repositories\CashRegisterRepositoryInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Factory\ResponseFactory;

class CashRegisterMiddleware implements MiddlewareInterface
{
    public function __construct(
        private CashRegisterRepositoryInterface $cashRegisterRepository,
        private ResponseFactory $responseFactory
    ) {}

    public function process(Request $request, RequestHandlerInterface $handler): Response
    {
        $user   = $request->getAttribute('user');
        $userId = (int) ($user['id'] ?? 0);

        $register = $this->cashRegisterRepository->findOpenByUserId($userId);

        if ($register === null) {
            $payload = [
                'success' => false,
                'message' => 'No hay una caja abierta. Debe abrir una caja antes de realizar ventas.',
                'errors'  => [],
            ];

            $response = $this->responseFactory->createResponse(403);
            $response->getBody()->write(json_encode($payload));
            return $response->withHeader('Content-Type', 'application/json');
        }

        $request = $request->withAttribute('cashRegister', $register);

        return $handler->handle($request);
    }
}
