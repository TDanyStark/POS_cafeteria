<?php

declare(strict_types=1);

namespace App\Application\Actions\Users;

use App\Domain\Services\UserService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ListUsersAction
{
    public function __construct(
        private UserService $userService
    ) {}

    public function __invoke(Request $request, Response $response): Response
    {
        $params = $request->getQueryParams();
        $page = max(1, (int) ($params['page'] ?? 1));
        $perPage = min(100, max(1, (int) ($params['per_page'] ?? 15)));
        $search = isset($params['search']) && $params['search'] !== '' ? $params['search'] : null;
        $active = isset($params['active']) && $params['active'] !== ''
            ? ($params['active'] === '1' || $params['active'] === 'true')
            : null;

        $result = $this->userService->listCashiers($page, $perPage, $search, $active);
        $payload = [
            'success' => true,
            'data' => $result['data'],
            'pagination' => $result['pagination'],
        ];

        $response->getBody()->write(json_encode($payload));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
