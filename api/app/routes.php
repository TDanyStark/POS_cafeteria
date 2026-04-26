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
use App\Application\Actions\Debts\AddDebtPaymentAction;
use App\Application\Actions\Debts\GetDebtAction;
use App\Application\Actions\Debts\ListDebtsAction;
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
use Slim\Interfaces\RouteCollectorProxyInterface as Group;

return function (App $app) {
    $container = $app->getContainer();

    $app->options('/{routes:.*}', function (Request $request, Response $response) {
        return $response;
    });

    $app->group('/api/v1', function (Group $group) use ($container) {

        // Health check (público)
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
            return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
        });

        // Auth (público)
        $group->post('/auth/login', LoginAction::class);

        // Rutas autenticadas (JWT requerido)
        $group->group('', function (Group $auth) {

            $auth->get('/auth/me', MeAction::class);

            // Categories
            $auth->get('/categories', ListCategoriesAction::class);

            // Products
            $auth->get('/products', ListProductsAction::class);

            // Cash Registers (admin + cajero)
            $auth->group('/cash-registers', function (Group $cashReg) {
                $cashReg->get('', ListCashRegistersAction::class);
                $cashReg->post('/open', OpenCashRegisterAction::class);
                $cashReg->get('/active', GetActiveCashRegisterAction::class);
                $cashReg->get('/{id}', GetCashRegisterAction::class);
                $cashReg->post('/{id}/close', CloseCashRegisterAction::class);
                $cashReg->post('/{id}/movements', AddMovementAction::class);
            });

            // Sales (admin + cajero)
            $auth->group('/sales', function (Group $sales) {
                $sales->post('', CreateSaleAction::class);
                $sales->get('', ListSalesAction::class);
                $sales->get('/{id}', GetSaleAction::class);
            });

            // Customers (admin + cajero)
            $auth->group('/customers', function (Group $customers) {
                $customers->get('', ListCustomersAction::class);
                $customers->post('', CreateCustomerAction::class);
                $customers->get('/{id}', GetCustomerAction::class);
                $customers->put('/{id}', UpdateCustomerAction::class);
            });

            // Debts (admin + cajero)
            $auth->group('/debts', function (Group $debts) {
                $debts->get('', ListDebtsAction::class);
                $debts->get('/{id}', GetDebtAction::class);
                $debts->post('/{id}/payments', AddDebtPaymentAction::class);
            });

            // Stock alerts (admin + cajero)
            $auth->get('/reports/stock-alerts', StockAlertsAction::class);

            // Rutas solo para admin
            $auth->group('', function (Group $admin) {

                // Categories (escritura)
                $admin->post('/categories', CreateCategoryAction::class);
                $admin->put('/categories/{id}', UpdateCategoryAction::class);
                $admin->delete('/categories/{id}', DeleteCategoryAction::class);

                // Products (escritura)
                $admin->post('/products', CreateProductAction::class);
                $admin->put('/products/{id}', UpdateProductAction::class);
                $admin->delete('/products/{id}', DeleteProductAction::class);
                $admin->patch('/products/{id}/stock', UpdateProductStockAction::class);

                // Reports
                $admin->get('/reports/top-sellers', TopSellersAction::class);
                $admin->get('/reports/sales-summary', SalesSummaryAction::class);

                // Settings
                $admin->group('/settings', function (Group $settings) {
                    $settings->get('/email', GetEmailSettingsAction::class);
                    $settings->put('/email', UpdateEmailSettingsAction::class);
                    $settings->post('/email/test', SendTestEmailAction::class);
                });

                // Users
                $admin->group('/users', function (Group $users) {
                    $users->get('', ListUsersAction::class);
                    $users->post('', CreateUserAction::class);
                    $users->put('/{id}', UpdateUserAction::class);
                    $users->delete('/{id}', DeleteUserAction::class);
                });

            })->add(new RoleMiddleware(['admin']));

        })->add(JwtMiddleware::class);
    });
};
