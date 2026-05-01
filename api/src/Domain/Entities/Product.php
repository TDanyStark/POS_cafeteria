<?php

declare(strict_types=1);

namespace App\Domain\Entities;

class Product
{
    public function __construct(
        private int $id,
        private int $categoryId,
        private string $name,
        private int $price,
        private int $stock,
        private int $minStock,
        private bool $active,
        private ?string $code = null,
        private ?string $categoryName = null,
        private ?string $createdAt = null,
        private ?string $updatedAt = null
    ) {}

    public function getId(): int { return $this->id; }
    public function getCategoryId(): int { return $this->categoryId; }
    public function getName(): string { return $this->name; }
    public function getPrice(): int { return $this->price; }
    public function getStock(): int { return $this->stock; }
    public function getMinStock(): int { return $this->minStock; }
    public function isActive(): bool { return $this->active; }
    public function getCode(): ?string { return $this->code; }
    public function getCategoryName(): ?string { return $this->categoryName; }
    public function getCreatedAt(): ?string { return $this->createdAt; }
    public function getUpdatedAt(): ?string { return $this->updatedAt; }

    public function toArray(): array
    {
        return [
            'id'            => $this->id,
            'code'          => $this->code,
            'category_id'   => $this->categoryId,
            'category_name' => $this->categoryName,
            'name'          => $this->name,
            'price'         => $this->price,
            'stock'         => $this->stock,
            'min_stock'     => $this->minStock,
            'active'        => $this->active,
            'created_at'    => $this->createdAt,
            'updated_at'    => $this->updatedAt,
        ];
    }
}
