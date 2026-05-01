<?php

declare(strict_types=1);

namespace App\Domain\Services;

use App\Domain\Repositories\CashRegisterRepositoryInterface;
use App\Domain\Repositories\DebtRepositoryInterface;
use App\Domain\Repositories\DebtPaymentRepositoryInterface;
use App\Application\Settings\SettingsInterface;

class DebtService
{
    public function __construct(
        private DebtRepositoryInterface $debtRepository,
        private DebtPaymentRepositoryInterface $debtPaymentRepository,
        private CashRegisterRepositoryInterface $cashRegisterRepository,
        private SettingsInterface $settings
    ) {}

    private function isGlobalScope(): bool
    {
        return $this->settings->get('debtScope') === 'global';
    }

    private function isCashRegisterGlobalScope(): bool
    {
        return $this->settings->get('cashRegisterScope') === 'global';
    }

    public function createDebt(int $customerId, int $saleId, int $total, int $amountPaid): int
    {
        $remainingAmount = $total - $amountPaid;

        if ($remainingAmount <= 0) {
            throw new \InvalidArgumentException('No hay deuda pendiente. El monto pagado es mayor o igual al total.');
        }

        return $this->debtRepository->create($customerId, $saleId, $total, $remainingAmount);
    }

    public function addPayment(int $debtId, int $userId, int $amount, string $paymentMethod, ?string $notes = null): array
    {
        $debt = $this->debtRepository->findById($debtId);
        if ($debt === null) {
            throw new \InvalidArgumentException('Deuda no encontrada.');
        }

        if ($debt['status'] === 'paid') {
            throw new \InvalidArgumentException('Esta deuda ya está pagada completely.');
        }

        if ($amount <= 0) {
            throw new \InvalidArgumentException('El monto del abono debe ser mayor a 0.');
        }

        $newRemainingAmount = (int) $debt['remaining_amount'] - $amount;

        if ($newRemainingAmount < 0) {
            throw new \InvalidArgumentException(
                'El monto del abono excede lo pendiente. Pendiente actual: ' . $debt['remaining_amount']
            );
        }

        // paid_amount now correctly represents total paid (including initial payment)
        $totalPaidAfter = (int) $debt['paid_amount'] + $amount;
        if ($totalPaidAfter > (int) $debt['original_amount']) {
            throw new \InvalidArgumentException(
                'El monto del abono resultaría en un pago excesivo. Total pagado después del abono: ' . $totalPaidAfter . ', Original: ' . $debt['original_amount']
            );
        }

        $newStatus = $newRemainingAmount <= 0 ? 'paid' : 'partial';

        if ($this->isCashRegisterGlobalScope()) {
            $cashRegister = $this->cashRegisterRepository->findOpenGlobal();
        } else {
            $cashRegister = $this->cashRegisterRepository->findOpenByUserId($userId);
        }

        if ($cashRegister === null) {
            throw new \RuntimeException('No hay una caja abierta. Debes abrir caja antes de registrar abonos.', 403);
        }

        $cashRegisterId = (int) $cashRegister['id'];

        $this->debtPaymentRepository->create(
            $debtId,
            $userId,
            $cashRegisterId,
            $amount,
            $paymentMethod,
            $notes
        );

        if ($paymentMethod === 'cash') {
            $customerName = $debt['customer_name'] ?? 'Cliente';
            $description = sprintf('Abono deuda - %s', $customerName);
            if ($notes) {
                $description .= ' - ' . $notes;
            }
            $this->cashRegisterRepository->addMovement(
                $cashRegisterId,
                $userId,
                'in',
                $amount,
                $description
            );
        }

        // Now paid_amount in DB correctly stores total paid (initial + abonos)
        $newPaidAmount = (int) $debt['paid_amount'] + $amount;
        $newDbRemainingAmount = (int) $debt['original_amount'] - $newPaidAmount;

        if ($newDbRemainingAmount < 0) {
            $newDbRemainingAmount = 0;
        }

        $this->debtRepository->update(
            $debtId,
            $newPaidAmount,
            $newDbRemainingAmount,
            $newStatus
        );

        return $this->debtRepository->findById($debtId);
    }

    public function list(int $page, int $limit, array $filters = []): array
    {
        $page  = max(1, $page);
        $limit = max(1, min(100, $limit));

        $total = $this->debtRepository->count($filters);
        $items = $this->debtRepository->findAll($page, $limit, $filters);

        return [
            'data'       => $items,
            'pagination' => [
                'page'        => $page,
                'per_page'    => $limit,
                'total'      => $total,
                'total_pages' => (int) ceil($total / $limit),
            ],
        ];
    }

    public function getById(int $id): array
    {
        $debt = $this->debtRepository->findById($id);
        if ($debt === null) {
            throw new \InvalidArgumentException('Deuda no encontrada.');
        }
        return $debt;
    }

    public function getByCustomerId(int $customerId): array
    {
        return $this->debtRepository->findByCustomerId($customerId);
    }

    public function getPayments(int $debtId): array
    {
        return $this->debtPaymentRepository->findByDebtId($debtId);
    }
}