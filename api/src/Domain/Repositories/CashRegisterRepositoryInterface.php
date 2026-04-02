<?php

declare(strict_types=1);

namespace App\Domain\Repositories;

interface CashRegisterRepositoryInterface
{
    /**
     * Find the currently open cash register for a given user.
     */
    public function findOpenByUserId(int $userId): ?array;

    /**
     * Find any open cash register regardless of user (to enforce one-at-a-time per user).
     */
    public function findLastOpenRegister(int $userId): ?array;

    /**
     * Find a cash register by its ID including movements summary.
     */
    public function findById(int $id): ?array;

    /**
     * Find a cash register by ID with all movements.
     */
    public function findByIdWithMovements(int $id): ?array;

    /**
     * Open a new cash register.
     */
    public function create(int $userId, float $initialAmount): int;

    /**
     * Close a cash register.
     */
    public function close(int $id, float $declaredAmount, float $finalAmount, float $difference): bool;

    /**
     * Add a movement to a cash register.
     */
    public function addMovement(int $cashRegisterId, int $userId, string $type, float $amount, string $description): int;

    /**
     * Get all movements for a cash register.
     */
    public function getMovements(int $cashRegisterId): array;

    /**
     * Sum of cash-in movements for a register.
     */
    public function sumCashIn(int $cashRegisterId): float;

    /**
     * Sum of cash-out movements for a register.
     */
    public function sumCashOut(int $cashRegisterId): float;

    /**
     * Sum of sales paid with cash for a register.
     */
    public function sumCashSales(int $cashRegisterId): float;

    /**
     * Sum of sales paid with transfer for a register.
     */
    public function sumTransferSales(int $cashRegisterId): float;
}
