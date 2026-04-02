<?php

declare(strict_types=1);

namespace App\Application\Actions\Settings;

use App\Domain\Services\EmailSettingsService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class GetEmailSettingsAction
{
    public function __construct(
        private EmailSettingsService $emailSettingsService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $settings = $this->emailSettingsService->getSettings();
        $payload = ['success' => true, 'data' => $settings];

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
