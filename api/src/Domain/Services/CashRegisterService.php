<?php

declare(strict_types=1);

namespace App\Domain\Services;

use App\Domain\Repositories\CashRegisterRepositoryInterface;

class CashRegisterService
{
    public function __construct(
        private CashRegisterRepositoryInterface $cashRegisterRepository
    ) {}

    /**
     * Open a new cash register for the given user.
     * Throws if there is already an open register for this user.
     */
    public function open(int $userId, float $initialAmount): array
    {
        if ($initialAmount < 0) {
            throw new \InvalidArgumentException('El monto inicial no puede ser negativo.');
        }

        $existing = $this->cashRegisterRepository->findLastOpenRegister($userId);

        if ($existing !== null) {
            throw new \RuntimeException(
                'Ya existe una caja abierta para este usuario. Debe cerrarla antes de abrir una nueva.',
                409
            );
        }

        $id = $this->cashRegisterRepository->create($userId, $initialAmount);

        return $this->cashRegisterRepository->findByIdWithMovements($id);
    }

    /**
     * Close a cash register.
     * Calculates: final_amount = initial_amount + sum(in) - sum(out)
     * Difference = declared_amount - final_amount
     */
    public function close(int $registerId, int $userId, float $declaredAmount): array
    {
        $register = $this->cashRegisterRepository->findById($registerId);

        if ($register === null) {
            throw new \InvalidArgumentException('Caja no encontrada.');
        }

        if ($register['status'] === 'closed') {
            throw new \InvalidArgumentException('Esta caja ya fue cerrada.');
        }

        if ((int) $register['user_id'] !== $userId) {
            throw new \RuntimeException('No tienes permiso para cerrar esta caja.', 403);
        }

        if ($declaredAmount < 0) {
            throw new \InvalidArgumentException('El monto declarado no puede ser negativo.');
        }

        $cashIn        = $this->cashRegisterRepository->sumCashIn($registerId);
        $cashOut       = $this->cashRegisterRepository->sumCashOut($registerId);
        $cashSales     = $this->cashRegisterRepository->sumCashSales($registerId);
        $finalAmount   = (float) $register['initial_amount'] + $cashIn - $cashOut + $cashSales;
        $difference    = $declaredAmount - $finalAmount;

        $this->cashRegisterRepository->close($registerId, $declaredAmount, $finalAmount, $difference);

        return $this->cashRegisterRepository->findByIdWithMovements($registerId);
    }

    /**
     * Get the active (open) cash register for the given user.
     */
    public function getActive(int $userId): ?array
    {
        $register = $this->cashRegisterRepository->findOpenByUserId($userId);

        if ($register === null) {
            return null;
        }

        return $this->cashRegisterRepository->findByIdWithMovements((int) $register['id']);
    }

    /**
     * Get a cash register by ID with all its movements.
     */
    public function getById(int $registerId): array
    {
        $register = $this->cashRegisterRepository->findByIdWithMovements($registerId);

        if ($register === null) {
            throw new \InvalidArgumentException('Caja no encontrada.');
        }

        return $register;
    }

    /**
     * Add a manual cash movement (in/out).
     */
    public function addMovement(int $registerId, int $userId, string $type, float $amount, string $description): array
    {
        $register = $this->cashRegisterRepository->findById($registerId);

        if ($register === null) {
            throw new \InvalidArgumentException('Caja no encontrada.');
        }

        if ($register['status'] === 'closed') {
            throw new \InvalidArgumentException('No se pueden agregar movimientos a una caja cerrada.');
        }

        if (!in_array($type, ['in', 'out'], true)) {
            throw new \InvalidArgumentException('El tipo de movimiento debe ser "in" o "out".');
        }

        if ($amount <= 0) {
            throw new \InvalidArgumentException('El monto del movimiento debe ser mayor a 0.');
        }

        if (empty(trim($description))) {
            throw new \InvalidArgumentException('La descripción del movimiento es requerida.');
        }

        $this->cashRegisterRepository->addMovement($registerId, $userId, $type, $amount, $description);

        return $this->cashRegisterRepository->findByIdWithMovements($registerId);
    }
}
