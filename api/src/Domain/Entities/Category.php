<?php

declare(strict_types=1);

namespace App\Domain\Entities;

class Category
{
    public function __construct(
        private int $id,
        private string $name,
        private string $slug,
        private ?string $createdAt = null,
        private ?string $updatedAt = null
    ) {}

    public function getId(): int { return $this->id; }
    public function getName(): string { return $this->name; }
    public function getSlug(): string { return $this->slug; }
    public function getCreatedAt(): ?string { return $this->createdAt; }
    public function getUpdatedAt(): ?string { return $this->updatedAt; }

    public function toArray(): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'slug'       => $this->slug,
            'created_at' => $this->createdAt,
            'updated_at' => $this->updatedAt,
        ];
    }
}
