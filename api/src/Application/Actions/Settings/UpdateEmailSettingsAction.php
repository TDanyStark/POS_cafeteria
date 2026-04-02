<?php

declare(strict_types=1);

namespace App\Application\Actions\Settings;

use App\Domain\Services\EmailSettingsService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class UpdateEmailSettingsAction
{
    public function __construct(
        private EmailSettingsService $emailSettingsService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $body = (array) $request->getParsedBody();

        try {
            $settings = $this->emailSettingsService->updateSettings($body);
            $payload = ['success' => true, 'data' => $settings];
            $status = 200;
        } catch (\InvalidArgumentException $e) {
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
            $status = 422;
        } catch (\RuntimeException $e) {
            $code = $e->getCode();
            $status = in_array($code, [422, 500], true) ? $code : 500;
            $payload = ['success' => false, 'message' => $e->getMessage(), 'errors' => []];
        }

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
