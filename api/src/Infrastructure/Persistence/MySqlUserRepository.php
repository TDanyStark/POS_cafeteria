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

    public function findCashiers(int $page, int $perPage, ?string $search = null, ?bool $active = null): array
    {
        $offset = ($page - 1) * $perPage;
        $where = ['role = :role'];
        $params = ['role' => 'cashier'];

        if ($search !== null && trim($search) !== '') {
            $where[] = '(name LIKE :search OR email LIKE :search)';
            $params['search'] = '%' . trim($search) . '%';
        }

        if ($active !== null) {
            $where[] = 'active = :active';
            $params['active'] = $active ? 1 : 0;
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $sql = "SELECT * FROM users {$whereClause} ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->pdo->prepare($sql);

        foreach ($params as $key => $value) {
            $type = is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue(':' . $key, $value, $type);
        }

        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        return array_map(fn($row) => $this->hydrate($row), $rows);
    }

    public function countCashiers(?string $search = null, ?bool $active = null): int
    {
        $where = ['role = :role'];
        $params = ['role' => 'cashier'];

        if ($search !== null && trim($search) !== '') {
            $where[] = '(name LIKE :search OR email LIKE :search)';
            $params['search'] = '%' . trim($search) . '%';
        }

        if ($active !== null) {
            $where[] = 'active = :active';
            $params['active'] = $active ? 1 : 0;
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM users {$whereClause}");
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    public function emailExists(string $email, ?int $excludeId = null): bool
    {
        $sql = 'SELECT COUNT(*) FROM users WHERE email = :email';
        $params = ['email' => $email];

        if ($excludeId !== null) {
            $sql .= ' AND id != :exclude_id';
            $params['exclude_id'] = $excludeId;
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn() > 0;
    }

    public function updateCashier(int $id, array $data): ?User
    {
        $fields = [];
        $params = ['id' => $id];

        if (array_key_exists('name', $data)) {
            $fields[] = 'name = :name';
            $params['name'] = $data['name'];
        }

        if (array_key_exists('email', $data)) {
            $fields[] = 'email = :email';
            $params['email'] = $data['email'];
        }

        if (array_key_exists('active', $data)) {
            $fields[] = 'active = :active';
            $params['active'] = $data['active'] ? 1 : 0;
        }

        if (array_key_exists('password', $data) && $data['password'] !== null) {
            $fields[] = 'password = :password';
            $params['password'] = $data['password'];
        }

        if (empty($fields)) {
            return $this->findById($id);
        }

        $fields[] = 'updated_at = NOW()';
        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id AND role = :role';
        $params['role'] = 'cashier';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        if ($stmt->rowCount() === 0) {
            $existing = $this->findById($id);
            if ($existing === null || $existing->getRole() !== 'cashier') {
                return null;
            }
        }

        return $this->findById($id);
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
