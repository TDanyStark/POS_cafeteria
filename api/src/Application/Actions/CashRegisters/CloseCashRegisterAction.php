<?php

declare(strict_types=1);

namespace App\Application\Actions\CashRegisters;

use App\Domain\Services\CashRegisterService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CloseCashRegisterAction
{
    public function __construct(
        private CashRegisterService $cashRegisterService
    ) {}

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        $user       = $request->getAttribute('user');
        $registerId = (int) ($args['id'] ?? 0);
        $body       = (array) $request->getParsedBody();

        if (!isset($body['declared_amount']) || !is_numeric($body['declared_amount'])) {
            $payload = ['success' => false, 'message' => 'El monto declarado es requerido y debe ser numérico.', 'errors' => []];
            $response->getBody()->write(json_encode($payload));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(422);
        }

        try {
            $register = $this->cashRegisterService->close(
                $registerId,
                (int) $user['id'],
                (float) $body['declared_amount']
            );
            $payload = ['success' => true, 'data' => $register];
            $status  = 200;
        } catch (\RuntimeException $e) {
            $code    = $e->getCode() === 403 ? 403 : 500;
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = $code;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = 422;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
