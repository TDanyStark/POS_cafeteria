<?php

declare(strict_types=1);

namespace App\Application\Actions\Settings;

use App\Infrastructure\Mail\EmailService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class SendTestEmailAction
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        try {
            $this->emailService->sendTestEmail();
            $payload = ['success' => true, 'message' => 'Correo de prueba enviado correctamente.'];
            $status = 200;
        } catch (\RuntimeException $e) {
            $status = $e->getCode() === 422 ? 422 : 500;
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
        } catch (\Throwable $e) {
            $payload = ['success' => false, 'message' => 'No fue posible enviar el correo de prueba.', 'errors' => []];
            $status = 500;
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
