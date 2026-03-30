<?php

declare(strict_types=1);

namespace App\Application\Actions\CashRegisters;

use App\Domain\Services\CashRegisterService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class GetActiveCashRegisterAction
{
    public function __construct(
        private CashRegisterService $cashRegisterService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $user     = $request->getAttribute('user');
        $register = $this->cashRegisterService->getActive((int) $user['id']);

        if ($register === null) {
            $payload = ['success' => true, 'data' => null];
            $status  = 200;
        } else {
            $payload = ['success' => true, 'data' => $register];
            $status  = 200;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
