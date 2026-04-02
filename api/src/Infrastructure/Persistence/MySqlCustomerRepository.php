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
            $where[] = '(name LIKE :search1 OR phone LIKE :search2 OR email LIKE :search3)';
            $params['search'] = '%' . $search . '%';
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT * FROM customers {$whereClause} ORDER BY created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $this->pdo->prepare($sql);

        if (isset($params['search'])) {
            $stmt->bindValue(':search1', $params['search'], PDO::PARAM_STR);
            $stmt->bindValue(':search2', $params['search'], PDO::PARAM_STR);
            $stmt->bindValue(':search3', $params['search'], PDO::PARAM_STR);
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
            $where[] = '(name LIKE :search1 OR phone LIKE :search2 OR email LIKE :search3)';
            $params  = [
                'search1' => '%' . $search . '%',
                'search2' => '%' . $search . '%',
                'search3' => '%' . $search . '%',
            ];
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

    public function update(int $id, string $name, ?string $phone, ?string $email): bool
    {
        $stmt = $this->pdo->prepare('
            UPDATE customers
            SET name = :name, phone = :phone, email = :email, updated_at = NOW()
            WHERE id = :id
        ');
        return $stmt->execute([
            'id'    => $id,
            'name'  => $name,
            'phone' => $phone,
            'email' => $email,
        ]);
    }

    public function search(string $query, int $limit = 10): array
    {
        $stmt = $this->pdo->prepare('
            SELECT * FROM customers
            WHERE name LIKE :q1 OR phone LIKE :q2 OR email LIKE :q3
            ORDER BY name ASC
            LIMIT :limit
        ');
        $q = '%' . $query . '%';
        $stmt->bindValue(':q1', $q, PDO::PARAM_STR);
        $stmt->bindValue(':q2', $q, PDO::PARAM_STR);
        $stmt->bindValue(':q3', $q, PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
