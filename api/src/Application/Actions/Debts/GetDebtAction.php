<?php

declare(strict_types=1);

namespace App\Application\Actions\Debts;

use App\Domain\Services\DebtService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class GetDebtAction
{
    public function __construct(
        private DebtService $debtService
    ) {}

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        $debtId = (int) ($args['id'] ?? 0);

        try {
            $debt = $this->debtService->getById($debtId);
            $payments = $this->debtService->getPayments($debtId);

            $payload = [
                'success' => true,
                'data' => [
                    'debt'     => $debt,
                    'payments' => $payments,
                ],
            ];
            $status = 200;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status = 404;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}