<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Repositories\CustomerRepositoryInterface;
use PDO;

class MySqlCustomerRepository implements CustomerRepositoryInterface
{
    public function __construct(
        private PDO $pdo
    ) {}

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM customers WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByPhone(string $phone): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM customers WHERE phone = :phone LIMIT 1');
        $stmt->execute(['phone' => $phone]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findAll(int $page, int $limit, string $search = ''): array
    {
        $offset = ($page - 1) * $limit;
        $params = [];
        $where  = [];

        if ($search !== '') {
            $where[]          = '(name LIKE :search OR phone LIKE :search OR email LIKE :search)';
            $params['search'] = '%' . $search . '%';
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT * FROM customers {$whereClause} ORDER BY created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $this->pdo->prepare($sql);

        if (isset($params['search'])) {
            $stmt->bindValue(':search', $params['search'], PDO::PARAM_STR);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function count(string $search = ''): int
    {
        $params = [];
        $where  = [];

        if ($search !== '') {
            $where[]          = '(name LIKE :search OR phone LIKE :search OR email LIKE :search)';
            $params['search'] = '%' . $search . '%';
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql         = "SELECT COUNT(*) FROM customers {$whereClause}";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }

    public function create(string $name, ?string $phone, ?string $email): int
    {
        $stmt = $this->pdo->prepare('
            INSERT INTO customers (name, phone, email, created_at, updated_at)
            VALUES (:name, :phone, :email, NOW(), NOW())
        ');
        $stmt->execute([
            'name'  => $name,
            'phone' => $phone,
            'email' => $email,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function search(string $query, int $limit = 10): array
    {
        $stmt = $this->pdo->prepare('
            SELECT * FROM customers
            WHERE name LIKE :query OR phone LIKE :query OR email LIKE :query
            ORDER BY name ASC
            LIMIT :limit
        ');
        $stmt->bindValue(':query', '%' . $query . '%', PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
