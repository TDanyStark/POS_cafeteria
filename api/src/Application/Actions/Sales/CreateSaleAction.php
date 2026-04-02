<?php

declare(strict_types=1);

namespace App\Application\Actions\Sales;

use App\Domain\Services\SaleService;
use App\Infrastructure\Mail\EmailService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class CreateSaleAction
{
    public function __construct(
        private SaleService $saleService,
        private EmailService $emailService,
        private LoggerInterface $logger
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $body = (array) $request->getParsedBody();

        try {
            $sale    = $this->saleService->create((int) $user['id'], $body);

            $this->emailService->queueSaleReceipt($sale, function (\Throwable $emailError) use ($sale): void {
                $this->logger->warning('Error enviando comprobante de venta', [
                    'sale_id' => $sale['id'] ?? null,
                    'error' => $emailError->getMessage(),
                ]);
            });

            $payload = ['success' => true, 'data' => $sale];
            $status  = 201;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = 422;
        } catch (\RuntimeException $e) {
            $code    = in_array($e->getCode(), [403, 409, 422], true) ? $e->getCode() : 500;
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status  = $code;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
