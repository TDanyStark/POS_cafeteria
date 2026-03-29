<?php

declare(strict_types=1);

use App\Application\Actions\Auth\LoginAction;
use App\Application\Actions\Auth\MeAction;
use App\Application\Actions\Categories\CreateCategoryAction;
use App\Application\Actions\Categories\DeleteCategoryAction;
use App\Application\Actions\Categories\ListCategoriesAction;
use App\Application\Actions\Categories\UpdateCategoryAction;
use App\Application\Actions\Products\CreateProductAction;
use App\Application\Actions\Products\DeleteProductAction;
use App\Application\Actions\Products\ListProductsAction;
use App\Application\Actions\Products\UpdateProductAction;
use App\Application\Actions\Products\UpdateProductStockAction;
use App\Application\Middleware\JwtMiddleware;
use App\Application\Middleware\RoleMiddleware;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;

return function (App $app) {
    $container = $app->getContainer();

    $app->options('/{routes:.*}', function (Request $request, Response $response) {
        return $response;
    });

    $app->group('/api/v1', function (\Slim\Interfaces\RouteCollectorProxyInterface $group) use ($container) {

        // Health check
        $group->get('/health', function (Request $request, Response $response) use ($container) {
            try {
                /** @var PDO $pdo */
                $pdo = $container->get(PDO::class);
                $pdo->query('SELECT 1');
                $data   = ['success' => true, 'message' => 'OK', 'database' => 'connected'];
                $status = 200;
            } catch (\Throwable $e) {
                $data   = ['success' => false, 'message' => 'Database connection failed'];
                $status = 503;
            }

            $response->getBody()->write(json_encode($data));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus($status);
        });

        // Auth
        $group->post('/auth/login', LoginAction::class);

        $group->get('/auth/me', MeAction::class)
            ->add(JwtMiddleware::class);

        // Categories (admin only for write, all auth for read)
        $group->get('/categories', ListCategoriesAction::class)
            ->add(JwtMiddleware::class);

        $group->post('/categories', CreateCategoryAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);

        $group->put('/categories/{id}', UpdateCategoryAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);

        $group->delete('/categories/{id}', DeleteCategoryAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);

        // Products (admin only for write, all auth for read)
        $group->get('/products', ListProductsAction::class)
            ->add(JwtMiddleware::class);

        $group->post('/products', CreateProductAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);

        $group->put('/products/{id}', UpdateProductAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);

        $group->delete('/products/{id}', DeleteProductAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);

        $group->patch('/products/{id}/stock', UpdateProductStockAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);
    });
};
