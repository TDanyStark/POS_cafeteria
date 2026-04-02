<?php

declare(strict_types=1);

namespace App\Domain\Services;

use App\Domain\Repositories\CustomerRepositoryInterface;

class CustomerService
{
    public function __construct(
        private CustomerRepositoryInterface $customerRepository
    ) {}

    /**
     * List customers with pagination and optional search.
     */
    public function list(int $page, int $limit, string $search = ''): array
    {
        $page  = max(1, $page);
        $limit = max(1, min(100, $limit));

        $total = $this->customerRepository->count($search);
        $items = $this->customerRepository->findAll($page, $limit, $search);

        return [
            'data'       => $items,
            'pagination' => [
                'page'        => $page,
                'per_page'    => $limit,
                'total'       => $total,
                'total_pages' => (int) ceil($total / $limit),
            ],
        ];
    }

    /**
     * Get a customer by ID.
     */
    public function getById(int $id): array
    {
        $customer = $this->customerRepository->findById($id);

        if ($customer === null) {
            throw new \InvalidArgumentException('Cliente no encontrado.');
        }

        return $customer;
    }

    /**
     * Create a new customer.
     */
    public function create(string $name, ?string $phone, ?string $email): array
    {
        $name  = trim($name);
        $phone = $phone ? trim($phone) : null;
        $email = $email ? trim($email) : null;

        if (empty($name)) {
            throw new \InvalidArgumentException('El nombre del cliente es requerido.');
        }

        if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('El correo electrónico no es válido.');
        }

        if (!empty($phone)) {
            $existing = $this->customerRepository->findByPhone($phone);
            if ($existing !== null) {
                throw new \RuntimeException('Ya existe un cliente con ese número de teléfono.', 409);
            }
        }

        $id = $this->customerRepository->create($name, $phone, $email);

        return $this->customerRepository->findById($id);
    }

    /**
     * Update an existing customer.
     */
    public function update(int $id, string $name, ?string $phone, ?string $email): array
    {
        $customer = $this->customerRepository->findById($id);
        if ($customer === null) {
            throw new \InvalidArgumentException('Cliente no encontrado.');
        }

        $name  = trim($name);
        $phone = $phone ? trim($phone) : null;
        $email = $email ? trim($email) : null;

        if (empty($name)) {
            throw new \InvalidArgumentException('El nombre del cliente es requerido.');
        }

        if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('El correo electrónico no es válido.');
        }

        // Check if another customer already has this phone
        if (!empty($phone)) {
            $existing = $this->customerRepository->findByPhone($phone);
            if ($existing !== null && (int)$existing['id'] !== $id) {
                throw new \RuntimeException('Ya existe otro cliente con ese número de teléfono.', 409);
            }
        }

        $this->customerRepository->update($id, $name, $phone, $email);

        return $this->customerRepository->findById($id);
    }

    /**
     * Search customers by name or phone.
     */
    public function search(string $query, int $limit = 10): array
    {
        $query = trim($query);

        if (empty($query)) {
            return [];
        }

        return $this->customerRepository->search($query, $limit);
    }
}
