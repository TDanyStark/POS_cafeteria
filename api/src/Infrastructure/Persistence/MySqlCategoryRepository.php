<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Repositories\CategoryRepositoryInterface;
use PDO;

class MySqlCategoryRepository implements CategoryRepositoryInterface
{
    public function __construct(
        private PDO $pdo
    ) {}

    public function findAll(int $page, int $perPage, ?string $search = null): array
    {
        $page = max(1, $page);
        $perPage = max(1, min(100, $perPage));
        $offset = ($page - 1) * $perPage;

        $where = '';
        $params = [];

        if ($search !== null && trim($search) !== '') {
            $where = 'WHERE name LIKE :search OR slug LIKE :search';
            $params['search'] = '%' . trim($search) . '%';
        }

        $sql = "SELECT * FROM categories {$where} ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->pdo->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
        }

        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function count(?string $search = null): int
    {
        $where = '';
        $params = [];

        if ($search !== null && trim($search) !== '') {
            $where = 'WHERE name LIKE :search OR slug LIKE :search';
            $params['search'] = '%' . trim($search) . '%';
        }

        $sql = "SELECT COUNT(*) FROM categories {$where}";
        $stmt = $this->pdo->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
        }

        $stmt->execute();

        return (int) $stmt->fetchColumn();
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM categories WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findBySlug(string $slug): ?array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM categories WHERE slug = :slug');
        $stmt->execute(['slug' => $slug]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare('
            INSERT INTO categories (name, slug, created_at, updated_at)
            VALUES (:name, :slug, NOW(), NOW())
        ');
        $stmt->execute([
            'name' => $data['name'],
            'slug' => $data['slug'],
        ]);
        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->pdo->prepare('
            UPDATE categories SET name = :name, slug = :slug, updated_at = NOW()
            WHERE id = :id
        ');
        return $stmt->execute([
            'id'   => $id,
            'name' => $data['name'],
            'slug' => $data['slug'],
        ]);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->pdo->prepare('DELETE FROM categories WHERE id = :id');
        return $stmt->execute(['id' => $id]);
    }

    public function hasProducts(int $id): bool
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM products WHERE category_id = :id');
        $stmt->execute(['id' => $id]);
        return (int) $stmt->fetchColumn() > 0;
    }
}
