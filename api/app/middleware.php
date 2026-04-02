<?php

declare(strict_types=1);

use Slim\App;
use Slim\Middleware\ContentLengthMiddleware;

return function (App $app) {
    // CORS Middleware
    $app->add(function ($request, $handler) {
        $origin = $request->getHeaderLine('Origin');
        $method = strtoupper($request->getMethod());

        $appEnv = (string) ($_ENV['APP_ENV'] ?? 'development');
        $allowedOrigins = array_values(array_filter(array_map('trim', explode(',', (string) ($_ENV['CORS_ALLOWED_ORIGINS'] ?? '')))));

        if (empty($allowedOrigins) && $appEnv === 'development') {
            $allowedOrigins = ['http://localhost:5173'];
        }

        $allowAnyOrigin = in_array('*', $allowedOrigins, true);
        $isOriginAllowed = $origin !== '' && ($allowAnyOrigin || in_array($origin, $allowedOrigins, true));

        if ($method === 'OPTIONS') {
            $response = $app->getResponseFactory()->createResponse(204);
        } else {
            $response = $handler->handle($request);
        }

        if ($isOriginAllowed) {
            $response = $response
                ->withHeader('Access-Control-Allow-Origin', $allowAnyOrigin ? '*' : $origin)
                ->withHeader('Vary', 'Origin')
                ->withHeader('Access-Control-Allow-Credentials', $allowAnyOrigin ? 'false' : 'true');
        }

        return $response
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    });
};
