<?php

declare(strict_types=1);

use App\Application\Actions\Auth\LoginAction;
use App\Application\Actions\Auth\MeAction;
use App\Application\Actions\CashRegisters\AddMovementAction;
use App\Application\Actions\CashRegisters\CloseCashRegisterAction;
use App\Application\Actions\CashRegisters\GetActiveCashRegisterAction;
use App\Application\Actions\CashRegisters\GetCashRegisterAction;
use App\Application\Actions\CashRegisters\ListCashRegistersAction;
use App\Application\Actions\CashRegisters\OpenCashRegisterAction;
use App\Application\Actions\Categories\CreateCategoryAction;
use App\Application\Actions\Categories\DeleteCategoryAction;
use App\Application\Actions\Categories\ListCategoriesAction;
use App\Application\Actions\Categories\UpdateCategoryAction;
use App\Application\Actions\Customers\CreateCustomerAction;
use App\Application\Actions\Customers\GetCustomerAction;
use App\Application\Actions\Customers\ListCustomersAction;
use App\Application\Actions\Customers\UpdateCustomerAction;
use App\Application\Actions\Products\CreateProductAction;
use App\Application\Actions\Products\DeleteProductAction;
use App\Application\Actions\Products\ListProductsAction;
use App\Application\Actions\Products\UpdateProductAction;
use App\Application\Actions\Products\UpdateProductStockAction;
use App\Application\Actions\Reports\SalesSummaryAction;
use App\Application\Actions\Reports\StockAlertsAction;
use App\Application\Actions\Reports\TopSellersAction;
use App\Application\Actions\Sales\CreateSaleAction;
use App\Application\Actions\Sales\GetSaleAction;
use App\Application\Actions\Sales\ListSalesAction;
use App\Application\Actions\Settings\GetEmailSettingsAction;
use App\Application\Actions\Settings\SendTestEmailAction;
use App\Application\Actions\Settings\UpdateEmailSettingsAction;
use App\Application\Actions\Users\CreateUserAction;
use App\Application\Actions\Users\DeleteUserAction;
use App\Application\Actions\Users\ListUsersAction;
use App\Application\Actions\Users\UpdateUserAction;
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

        // Cash Registers (admin + cashier)
        $group->post('/cash-registers/open', OpenCashRegisterAction::class)
            ->add(JwtMiddleware::class);

        $group->get('/cash-registers', ListCashRegistersAction::class)
            ->add(JwtMiddleware::class);

        $group->post('/cash-registers/{id}/close', CloseCashRegisterAction::class)
            ->add(JwtMiddleware::class);

        $group->get('/cash-registers/active', GetActiveCashRegisterAction::class)
            ->add(JwtMiddleware::class);

        $group->get('/cash-registers/{id}', GetCashRegisterAction::class)
            ->add(JwtMiddleware::class);

        $group->post('/cash-registers/{id}/movements', AddMovementAction::class)
            ->add(JwtMiddleware::class);

        // Sales (admin + cashier)
        $group->post('/sales', CreateSaleAction::class)
            ->add(JwtMiddleware::class);

        $group->get('/sales', ListSalesAction::class)
            ->add(JwtMiddleware::class);

        $group->get('/sales/{id}', GetSaleAction::class)
            ->add(JwtMiddleware::class);

        // Customers (admin + cashier read/create)
        $group->get('/customers', ListCustomersAction::class)
            ->add(JwtMiddleware::class);

        $group->post('/customers', CreateCustomerAction::class)
            ->add(JwtMiddleware::class);

        $group->put('/customers/{id}', UpdateCustomerAction::class)
            ->add(JwtMiddleware::class);

        $group->get('/customers/{id}', GetCustomerAction::class)
            ->add(JwtMiddleware::class);

        // Reports (admin only)
        $group->get('/reports/top-sellers', TopSellersAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);

        $group->get('/reports/sales-summary', SalesSummaryAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);

        $group->get('/reports/stock-alerts', StockAlertsAction::class)
            ->add(JwtMiddleware::class);

        // Settings (admin only)
        $group->get('/settings/email', GetEmailSettingsAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);

        $group->put('/settings/email', UpdateEmailSettingsAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);

        $group->post('/settings/email/test', SendTestEmailAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);

        // Users (admin only)
        $group->get('/users', ListUsersAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);

        $group->post('/users', CreateUserAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);

        $group->put('/users/{id}', UpdateUserAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);

        $group->delete('/users/{id}', DeleteUserAction::class)
            ->add(new RoleMiddleware(['admin']))
            ->add(JwtMiddleware::class);
    });
};
