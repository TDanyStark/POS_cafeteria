<?php

declare(strict_types=1);

namespace App\Domain\Services;

use App\Domain\Entities\User;
use App\Domain\Repositories\UserRepositoryInterface;

class UserService
{
    public function __construct(
        private UserRepositoryInterface $userRepository
    ) {}

    public function listCashiers(int $page, int $perPage, ?string $search = null, ?bool $active = null): array
    {
        $page = max(1, $page);
        $perPage = max(1, min(100, $perPage));
        $search = $search !== null ? trim($search) : null;

        if ($search === '') {
            $search = null;
        }

        $users = $this->userRepository->findCashiers($page, $perPage, $search, $active);
        $total = $this->userRepository->countCashiers($search, $active);

        return [
            'data' => array_map(fn(User $user) => $user->toArray(), $users),
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => (int) ceil($total / $perPage),
            ],
        ];
    }

    public function createCashier(string $name, string $email, string $password, bool $active = true): array
    {
        $name = trim($name);
        $email = strtolower(trim($email));
        $password = trim($password);

        $this->validateName($name);
        $this->validateEmail($email);
        $this->validatePassword($password, true);

        if ($this->userRepository->emailExists($email)) {
            throw new \InvalidArgumentException('Ya existe un usuario con ese correo electrónico.');
        }

        $user = new User(
            null,
            $name,
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            'cashier',
            $active
        );

        $created = $this->userRepository->save($user);

        return $created->toArray();
    }

    public function updateCashier(int $id, string $name, string $email, ?string $password, bool $active): array
    {
        $name = trim($name);
        $email = strtolower(trim($email));
        $password = $password !== null ? trim($password) : null;

        $existing = $this->userRepository->findById($id);
        if ($existing === null || $existing->getRole() !== 'cashier') {
            throw new \InvalidArgumentException('Cajero no encontrado.');
        }

        $this->validateName($name);
        $this->validateEmail($email);
        $this->validatePassword($password, false);

        if ($this->userRepository->emailExists($email, $id)) {
            throw new \InvalidArgumentException('Ya existe un usuario con ese correo electrónico.');
        }

        $payload = [
            'name' => $name,
            'email' => $email,
            'active' => $active,
        ];

        if ($password !== null && $password !== '') {
            $payload['password'] = password_hash($password, PASSWORD_DEFAULT);
        }

        $updated = $this->userRepository->updateCashier($id, $payload);
        if ($updated === null) {
            throw new \InvalidArgumentException('Cajero no encontrado.');
        }

        return $updated->toArray();
    }

    public function deleteCashier(int $id): void
    {
        $existing = $this->userRepository->findById($id);
        if ($existing === null || $existing->getRole() !== 'cashier') {
            throw new \InvalidArgumentException('Cajero no encontrado.');
        }

        $this->userRepository->delete($id);
    }

    private function validateName(string $name): void
    {
        if ($name === '') {
            throw new \InvalidArgumentException('El nombre es requerido.');
        }
    }

    private function validateEmail(string $email): void
    {
        if ($email === '') {
            throw new \InvalidArgumentException('El correo electrónico es requerido.');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('El correo electrónico no es válido.');
        }
    }

    private function validatePassword(?string $password, bool $required): void
    {
        if ($required && ($password === null || $password === '')) {
            throw new \InvalidArgumentException('La contraseña es requerida.');
        }

        if ($password !== null && $password !== '' && strlen($password) < 6) {
            throw new \InvalidArgumentException('La contraseña debe tener al menos 6 caracteres.');
        }
    }
}
