<?php

declare(strict_types=1);

use Slim\App;
use Slim\Middleware\ContentLengthMiddleware;

return function (App $app) {
    // CORS Middleware
    $app->add(function ($request, $handler) {
        $response = $handler->handle($request);

        return $response
            ->withHeader('Access-Control-Allow-Origin', $_ENV['APP_ENV'] === 'development' ? 'http://localhost:5173' : '')
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Credentials', 'true');
    });
};
