<?php

declare(strict_types=1);

use App\Application\Middleware\JwtMiddleware;
use App\Application\Settings\SettingsInterface;
use App\Domain\Repositories\UserRepositoryInterface;
use App\Domain\Services\AuthService;
use App\Infrastructure\Persistence\MySqlUserRepository;
use DI\ContainerBuilder;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Monolog\Processor\UidProcessor;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

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

        UserRepositoryInterface::class => function (ContainerInterface $c) {
            return new MySqlUserRepository($c->get(PDO::class));
        },

        AuthService::class => function (ContainerInterface $c) {
            return new AuthService($c->get(UserRepositoryInterface::class));
        },

        JwtMiddleware::class => function (ContainerInterface $c) {
            return new JwtMiddleware($c->get(AuthService::class));
        },
    ]);
};
