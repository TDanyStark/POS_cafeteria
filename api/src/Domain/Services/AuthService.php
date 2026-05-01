<?php

declare(strict_types=1);

namespace App\Domain\Services;

use App\Domain\Entities\User;
use App\Domain\Repositories\UserRepositoryInterface;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthService
{
    private string $jwtSecret;

    public function __construct(
        private UserRepositoryInterface $userRepository
    ) {
        $this->jwtSecret = $_ENV['JWT_SECRET'] ?? throw new \RuntimeException('JWT_SECRET not configured');
    }

    public function validateCredentials(string $email, string $password): ?User
    {
        $user = $this->userRepository->findByEmail($email);

        if ($user === null) {
            return null;
        }

        if (!password_verify($password, $user->getPassword())) {
            return null;
        }

        if (!$user->isActive()) {
            throw new \RuntimeException('Tu cuenta está inactiva. Contacta al administrador para solicitar la activación.', 403);
        }

        return $user;
    }

    public function generateToken(User $user): string
    {
        $payload = [
            'iat' => time(),
            'exp' => time() + (60 * 60 * 24),
            'sub' => $user->getId(),
            'data' => [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'email' => $user->getEmail(),
                'role' => $user->getRole(),
            ],
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }

    public function verifyToken(string $token): ?array
    {
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            return json_decode(json_encode($decoded), true);
        } catch (\Exception $e) {
            return null;
        }
    }
}
