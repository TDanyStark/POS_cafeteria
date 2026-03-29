<?php

declare(strict_types=1);

namespace App\Domain\Services;

use App\Domain\Repositories\CategoryRepositoryInterface;
use App\Domain\Repositories\ProductRepositoryInterface;

class ProductService
{
    public function __construct(
        private ProductRepositoryInterface $productRepository,
        private CategoryRepositoryInterface $categoryRepository
    ) {}

    public function getAll(int $page, int $perPage, ?int $categoryId, ?string $search, ?bool $active): array
    {
        $items = $this->productRepository->findAll($page, $perPage, $categoryId, $search, $active);
        $total = $this->productRepository->count($categoryId, $search, $active);

        return [
            'data'       => $items,
            'pagination' => [
                'total'       => $total,
                'page'        => $page,
                'per_page'    => $perPage,
                'total_pages' => (int) ceil($total / $perPage),
            ],
        ];
    }

    public function getById(int $id): ?array
    {
        return $this->productRepository->findById($id);
    }

    public function create(array $data): array
    {
        $this->validateProductData($data);

        $id = $this->productRepository->create($data);

        return $this->productRepository->findById($id);
    }

    public function update(int $id, array $data): array
    {
        $product = $this->productRepository->findById($id);
        if (!$product) {
            throw new \InvalidArgumentException('Producto no encontrado.');
        }

        $this->validateProductData($data);

        $this->productRepository->update($id, $data);

        return $this->productRepository->findById($id);
    }

    public function delete(int $id): void
    {
        $product = $this->productRepository->findById($id);
        if (!$product) {
            throw new \InvalidArgumentException('Producto no encontrado.');
        }

        $this->productRepository->delete($id);
    }

    public function updateStock(int $id, int $quantity): array
    {
        $product = $this->productRepository->findById($id);
        if (!$product) {
            throw new \InvalidArgumentException('Producto no encontrado.');
        }

        if ($quantity < 0) {
            throw new \InvalidArgumentException('El stock no puede ser negativo.');
        }

        $this->productRepository->updateStock($id, $quantity);

        return $this->productRepository->findById($id);
    }

    private function validateProductData(array $data): void
    {
        if (empty($data['name'])) {
            throw new \InvalidArgumentException('El nombre del producto es requerido.');
        }

        if (!isset($data['price']) || (float) $data['price'] <= 0) {
            throw new \InvalidArgumentException('El precio debe ser mayor a 0.');
        }

        if (!isset($data['category_id'])) {
            throw new \InvalidArgumentException('La categoría es requerida.');
        }

        $category = $this->categoryRepository->findById((int) $data['category_id']);
        if (!$category) {
            throw new \InvalidArgumentException('La categoría seleccionada no existe.');
        }

        if (isset($data['stock']) && (int) $data['stock'] < 0) {
            throw new \InvalidArgumentException('El stock no puede ser negativo.');
        }
    }
}
