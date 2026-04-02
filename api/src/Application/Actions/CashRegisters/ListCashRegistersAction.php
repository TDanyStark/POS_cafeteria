<?php

declare(strict_types=1);

namespace App\Application\Actions\CashRegisters;

use App\Domain\Services\CashRegisterService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ListCashRegistersAction
{
    public function __construct(
        private CashRegisterService $cashRegisterService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $user   = $request->getAttribute('user');

        $filters = [];

        if (!empty($params['from'])) {
            $filters['from'] = $params['from'];
        }

        if (!empty($params['to'])) {
            $filters['to'] = $params['to'];
        }

        // Cashiers can only see their own registers history
        if ($user['role'] === 'cashier') {
            $filters['user_id'] = (int) $user['id'];
        } elseif (!empty($params['user_id'])) {
            $filters['user_id'] = (int) $params['user_id'];
        }

        $result = $this->cashRegisterService->list($filters);

        $response->getBody()->write(json_encode([
            'success' => true,
            'data'    => $result
        ]));

        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
