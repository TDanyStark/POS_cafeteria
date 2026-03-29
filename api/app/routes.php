<?php

declare(strict_types=1);

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;

return function (App $app) {
    // CORS Pre-Flight OPTIONS Request Handler
    $app->options('/{routes:.*}', function (Request $request, Response $response) {
        return $response;
    });

    // API v1 group
    $app->group('/api/v1', function (\Slim\Interfaces\RouteCollectorProxyInterface $group) {

        // Health check — validates DB connection
        $group->get('/health', function (Request $request, Response $response) {
            $container = \Slim\Factory\AppFactory::getContainer();

            try {
                /** @var PDO $pdo */
                $pdo = $container->get(PDO::class);
                $pdo->query('SELECT 1');
                $data = ['success' => true, 'message' => 'OK', 'database' => 'connected'];
                $status = 200;
            } catch (\Throwable $e) {
                $data = ['success' => false, 'message' => 'Database connection failed'];
                $status = 503;
            }

            $response->getBody()->write(json_encode($data));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus($status);
        });
    });
};
