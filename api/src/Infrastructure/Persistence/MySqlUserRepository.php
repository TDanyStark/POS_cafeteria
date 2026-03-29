<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Entities\User;
use App\Domain\Repositories\UserRepositoryInterface;
use PDO;

class MySqlUserRepository implements UserRepositoryInterface
{
    public function __construct(
        private PDO $pdo
    ) {}

    public function findById(int $id): ?User
    {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();

        return $row ? $this->hydrate($row) : null;
    }

    public function findByEmail(string $email): ?User
    {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE email = :email');
        $stmt->execute(['email' => $email]);
        $row = $stmt->fetch();

        return $row ? $this->hydrate($row) : null;
    }

    public function findAll(): array
    {
        $stmt = $this->pdo->query('SELECT * FROM users ORDER BY created_at DESC');
        $rows = $stmt->fetchAll();

        return array_map(fn($row) => $this->hydrate($row), $rows);
    }

    public function save(User $user): User
    {
        $stmt = $this->pdo->prepare('
            INSERT INTO users (name, email, password, role, active, created_at, updated_at)
            VALUES (:name, :email, :password, :role, :active, NOW(), NOW())
        ');

        $stmt->execute([
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'password' => $user->getPassword(),
            'role' => $user->getRole(),
            'active' => $user->isActive() ? 1 : 0,
        ]);

        $user = $this->findById((int) $this->pdo->lastInsertId());
        return $user;
    }

    public function update(User $user): User
    {
        $stmt = $this->pdo->prepare('
            UPDATE users SET name = :name, email = :email, role = :role, active = :active, updated_at = NOW()
            WHERE id = :id
        ');

        $stmt->execute([
            'id' => $user->getId(),
            'name' => $user->getName(),
            'email' => $user->getEmail(),
            'role' => $user->getRole(),
            'active' => $user->isActive() ? 1 : 0,
        ]);

        return $this->findById($user->getId());
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM users WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    private function hydrate(array $row): User
    {
        return new User(
            (int) $row['id'],
            $row['name'],
            $row['email'],
            $row['password'],
            $row['role'],
            (bool) $row['active'],
            $row['created_at'] ?? null,
            $row['updated_at'] ?? null
        );
    }
}
