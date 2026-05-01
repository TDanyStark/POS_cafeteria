<?php

declare(strict_types=1);

namespace App\Application\Actions\Debts;

use App\Domain\Services\DebtService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AddDebtPaymentAction
{
    public function __construct(
        private DebtService $debtService
    ) {}

    public function __invoke(Request $request, Response $response, array $args): Response
    {
        $user   = $request->getAttribute('user');
        $debtId = (int) ($args['id'] ?? 0);
        $body   = (array) $request->getParsedBody();

        try {
            $debt = $this->debtService->addPayment(
                $debtId,
                (int) $user['id'],
                (int) ($body['amount'] ?? 0),
                $body['payment_method'] ?? 'cash',
                $body['notes'] ?? null
            );

            $payload = ['success' => true, 'data' => $debt];
            $status  = 201;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = 422;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}