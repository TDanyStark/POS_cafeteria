<?php

declare(strict_types=1);

namespace App\Domain\Services;

use App\Domain\Repositories\CategoryRepositoryInterface;

class CategoryService
{
    public function __construct(
        private CategoryRepositoryInterface $categoryRepository
    ) {}

    public function getAll(): array
    {
        return $this->categoryRepository->findAll();
    }

    public function getById(int $id): ?array
    {
        return $this->categoryRepository->findById($id);
    }

    public function create(string $name): array
    {
        $slug = $this->generateSlug($name);

        if ($this->categoryRepository->findBySlug($slug)) {
            throw new \InvalidArgumentException('Ya existe una categoría con ese nombre.');
        }

        $id = $this->categoryRepository->create(['name' => $name, 'slug' => $slug]);

        return $this->categoryRepository->findById($id);
    }

    public function update(int $id, string $name): array
    {
        $category = $this->categoryRepository->findById($id);
        if (!$category) {
            throw new \InvalidArgumentException('Categoría no encontrada.');
        }

        $slug = $this->generateSlug($name);

        $existing = $this->categoryRepository->findBySlug($slug);
        if ($existing && (int) $existing['id'] !== $id) {
            throw new \InvalidArgumentException('Ya existe una categoría con ese nombre.');
        }

        $this->categoryRepository->update($id, ['name' => $name, 'slug' => $slug]);

        return $this->categoryRepository->findById($id);
    }

    public function delete(int $id): void
    {
        $category = $this->categoryRepository->findById($id);
        if (!$category) {
            throw new \InvalidArgumentException('Categoría no encontrada.');
        }

        if ($this->categoryRepository->hasProducts($id)) {
            throw new \InvalidArgumentException('No se puede eliminar una categoría con productos asociados.');
        }

        $this->categoryRepository->delete($id);
    }

    private function generateSlug(string $name): string
    {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
        $slug = preg_replace('/[\s-]+/', '-', $slug);
        return trim($slug, '-');
    }
}
