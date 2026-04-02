<?php

declare(strict_types=1);

use App\Application\Middleware\CashRegisterMiddleware;
use App\Application\Middleware\JwtMiddleware;
use App\Application\Settings\SettingsInterface;
use App\Domain\Repositories\CashRegisterRepositoryInterface;
use App\Domain\Repositories\CategoryRepositoryInterface;
use App\Domain\Repositories\CustomerRepositoryInterface;
use App\Domain\Repositories\ProductRepositoryInterface;
use App\Domain\Repositories\ReportRepositoryInterface;
use App\Domain\Repositories\SaleRepositoryInterface;
use App\Domain\Repositories\UserRepositoryInterface;
use App\Domain\Services\AuthService;
use App\Domain\Services\CashRegisterService;
use App\Domain\Services\CategoryService;
use App\Domain\Services\CustomerService;
use App\Domain\Services\ProductService;
use App\Domain\Services\ReportService;
use App\Domain\Services\SaleService;
use App\Infrastructure\Persistence\MySqlCashRegisterRepository;
use App\Infrastructure\Persistence\MySqlCategoryRepository;
use App\Infrastructure\Persistence\MySqlCustomerRepository;
use App\Infrastructure\Persistence\MySqlProductRepository;
use App\Infrastructure\Persistence\MySqlReportRepository;
use App\Infrastructure\Persistence\MySqlSaleRepository;
use App\Infrastructure\Persistence\MySqlUserRepository;
use DI\ContainerBuilder;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Monolog\Processor\UidProcessor;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;
use Slim\Psr7\Factory\ResponseFactory;

return function (ContainerBuilder $containerBuilder) {
    $containerBuilder->addDefinitions([
        LoggerInterface::class => function (ContainerInterface $c) {
            $settings = $c->get(SettingsInterface::class);

            $loggerSettings = $settings->get('logger');
            $logger = new Logger($loggerSettings['name']);

            $processor = new UidProcessor();
            $logger->pushProcessor($processor);

            $handler = new StreamHandler($loggerSettings['path'], $loggerSettings['level']);
            $logger->pushHandler($handler);

            return $logger;
        },

        PDO::class => function () {
            $host   = $_ENV['DB_HOST'];
            $port   = $_ENV['DB_PORT'];
            $dbname = $_ENV['DB_NAME'];
            $user   = $_ENV['DB_USER'];
            $pass   = $_ENV['DB_PASS'];

            $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

            return new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        },

        // User
        UserRepositoryInterface::class => function (ContainerInterface $c) {
            return new MySqlUserRepository($c->get(PDO::class));
        },

        AuthService::class => function (ContainerInterface $c) {
            return new AuthService($c->get(UserRepositoryInterface::class));
        },

        JwtMiddleware::class => function (ContainerInterface $c) {
            return new JwtMiddleware($c->get(AuthService::class));
        },

        // Category
        CategoryRepositoryInterface::class => function (ContainerInterface $c) {
            return new MySqlCategoryRepository($c->get(PDO::class));
        },

        CategoryService::class => function (ContainerInterface $c) {
            return new CategoryService($c->get(CategoryRepositoryInterface::class));
        },

        // Product
        ProductRepositoryInterface::class => function (ContainerInterface $c) {
            return new MySqlProductRepository($c->get(PDO::class));
        },

        ProductService::class => function (ContainerInterface $c) {
            return new ProductService(
                $c->get(ProductRepositoryInterface::class),
                $c->get(CategoryRepositoryInterface::class)
            );
        },

        // Cash Register
        CashRegisterRepositoryInterface::class => function (ContainerInterface $c) {
            return new MySqlCashRegisterRepository($c->get(PDO::class));
        },

        CashRegisterService::class => function (ContainerInterface $c) {
            return new CashRegisterService($c->get(CashRegisterRepositoryInterface::class));
        },

        CashRegisterMiddleware::class => function (ContainerInterface $c) {
            return new CashRegisterMiddleware(
                $c->get(CashRegisterRepositoryInterface::class),
                new ResponseFactory()
            );
        },

        // Customer
        CustomerRepositoryInterface::class => function (ContainerInterface $c) {
            return new MySqlCustomerRepository($c->get(PDO::class));
        },

        CustomerService::class => function (ContainerInterface $c) {
            return new CustomerService($c->get(CustomerRepositoryInterface::class));
        },

        // Sale
        SaleRepositoryInterface::class => function (ContainerInterface $c) {
            return new MySqlSaleRepository($c->get(PDO::class));
        },

        SaleService::class => function (ContainerInterface $c) {
            return new SaleService(
                $c->get(SaleRepositoryInterface::class),
                $c->get(ProductRepositoryInterface::class),
                $c->get(CashRegisterRepositoryInterface::class),
                $c->get(CustomerRepositoryInterface::class),
                $c->get(PDO::class)
            );
        },

        // Report
        ReportRepositoryInterface::class => function (ContainerInterface $c) {
            return new MySqlReportRepository($c->get(PDO::class));
        },

        ReportService::class => function (ContainerInterface $c) {
            return new ReportService($c->get(ReportRepositoryInterface::class));
        },
    ]);
};
