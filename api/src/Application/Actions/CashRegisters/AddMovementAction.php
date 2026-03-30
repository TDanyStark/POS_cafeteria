<?php

declare(strict_types=1);

namespace App\Application\Actions\CashRegisters;

use App\Domain\Services\CashRegisterService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AddMovementAction
{
    public function __construct(
        private CashRegisterService $cashRegisterService
    ) {}

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        $user       = $request->getAttribute('user');
        $registerId = (int) ($args['id'] ?? 0);
        $body       = (array) $request->getParsedBody();

        try {
            $register = $this->cashRegisterService->addMovement(
                $registerId,
                (int) $user['id'],
                (string) ($body['type'] ?? ''),
                (float) ($body['amount'] ?? 0),
                (string) ($body['description'] ?? '')
            );
            $payload = ['success' => true, 'data' => $register];
            $status  = 201;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = 422;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
