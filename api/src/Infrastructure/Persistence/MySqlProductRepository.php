<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Repositories\ProductRepositoryInterface;
use PDO;

class MySqlProductRepository implements ProductRepositoryInterface
{
    public function __construct(
        private PDO $pdo
    ) {}

    public function findAll(int $page, int $perPage, ?int $categoryId, ?string $search, ?bool $active): array
    {
        $offset = ($page - 1) * $perPage;
        $params = [];
        $where  = [];

        if ($categoryId !== null) {
            $where[]               = 'p.category_id = :category_id';
            $params['category_id'] = $categoryId;
        }

        if ($search !== null && $search !== '') {
            // Search by name OR by exact code match
            $where[]          = '(p.name LIKE :search OR p.code = :code_exact)';
            $params['search']     = '%' . $search . '%';
            $params['code_exact'] = $search;
        }

        if ($active !== null) {
            $where[]          = 'p.active = :active';
            $params['active'] = $active ? 1 : 0;
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            {$whereClause}
            ORDER BY p.created_at DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->pdo->prepare($sql);

        if (isset($params['category_id'])) {
            $stmt->bindValue(':category_id', $params['category_id'], PDO::PARAM_INT);
        }
        if (isset($params['search'])) {
            $stmt->bindValue(':search', $params['search'], PDO::PARAM_STR);
            $stmt->bindValue(':code_exact', $params['code_exact'], PDO::PARAM_STR);
        }
        if (isset($params['active'])) {
            $stmt->bindValue(':active', $params['active'], PDO::PARAM_INT);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function count(?int $categoryId, ?string $search, ?bool $active): int
    {
        $params = [];
        $where  = [];

        if ($categoryId !== null) {
            $where[]               = 'category_id = :category_id';
            $params['category_id'] = $categoryId;
        }

        if ($search !== null && $search !== '') {
            $where[]              = '(name LIKE :search OR code = :code_exact)';
            $params['search']     = '%' . $search . '%';
            $params['code_exact'] = $search;
        }

        if ($active !== null) {
            $where[]          = 'active = :active';
            $params['active'] = $active ? 1 : 0;
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';
        $sql         = "SELECT COUNT(*) FROM products {$whereClause}";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.id = :id
        ');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByCode(string $code): ?array
    {
        $stmt = $this->pdo->prepare('
            SELECT p.*, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.code = :code
        ');
        $stmt->execute(['code' => $code]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare('
            INSERT INTO products (code, category_id, name, price, stock, min_stock, active, created_at, updated_at)
            VALUES (:code, :category_id, :name, :price, :stock, :min_stock, :active, NOW(), NOW())
        ');
        $stmt->execute([
            'code'        => isset($data['code']) && $data['code'] !== '' ? $data['code'] : null,
            'category_id' => $data['category_id'],
            'name'        => $data['name'],
            'price'       => $data['price'],
            'stock'       => $data['stock'] ?? 0,
            'min_stock'   => $data['min_stock'] ?? 5,
            'active'      => isset($data['active']) ? ($data['active'] ? 1 : 0) : 1,
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare('
            UPDATE products
            SET code = :code, category_id = :category_id, name = :name, price = :price,
                stock = :stock, min_stock = :min_stock, active = :active, updated_at = NOW()
            WHERE id = :id
        ');
        return $stmt->execute([
            'id'          => $id,
            'code'        => isset($data['code']) && $data['code'] !== '' ? $data['code'] : null,
            'category_id' => $data['category_id'],
            'name'        => $data['name'],
            'price'       => $data['price'],
            'stock'       => $data['stock'],
            'min_stock'   => $data['min_stock'],
            'active'      => $data['active'] ? 1 : 0,
        ]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM products WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    public function updateStock(int $id, int $quantity): bool
    {
        $stmt = $this->pdo->prepare('
            UPDATE products SET stock = :quantity, updated_at = NOW() WHERE id = :id
        ');
        return $stmt->execute(['id' => $id, 'quantity' => $quantity]);
    }

    public function decrementStock(int $id, int $amount): bool
    {
        $stmt = $this->pdo->prepare('
            UPDATE products SET stock = stock - :amount, updated_at = NOW() WHERE id = :id AND stock >= :min_amount
        ');
        $stmt->execute(['id' => $id, 'amount' => $amount, 'min_amount' => $amount]);
        return $stmt->rowCount() > 0;
    }
}
