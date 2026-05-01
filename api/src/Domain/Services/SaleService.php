<?php

declare(strict_types=1);

namespace App\Domain\Services;

use App\Domain\Repositories\CashRegisterRepositoryInterface;
use App\Domain\Repositories\CustomerRepositoryInterface;
use App\Domain\Repositories\ProductRepositoryInterface;
use App\Domain\Repositories\SaleRepositoryInterface;
use App\Domain\Repositories\DebtRepositoryInterface;
use App\Application\Settings\SettingsInterface;
use PDO;

class SaleService
{
    public function __construct(
        private SaleRepositoryInterface $saleRepository,
        private ProductRepositoryInterface $productRepository,
        private CashRegisterRepositoryInterface $cashRegisterRepository,
        private CustomerRepositoryInterface $customerRepository,
        private DebtRepositoryInterface $debtRepository,
        private SettingsInterface $settings,
        private PDO $pdo
    ) {}

    private function isGlobalScope(): bool
    {
        return $this->settings->get('cashRegisterScope') === 'global';
    }

    /**
     * Create a new sale.
     * - Verifies open cash register (global or user-specific based on setting).
     * - Deducts stock in a DB transaction (rejects full sale if insufficient stock).
     * - Registers the sale with items.
     * - In global mode: uses the single open register regardless of user.
     * - In personal mode: uses the user's open register.
     */
    public function create(int $userId, array $data): array
    {
        if ($this->isGlobalScope()) {
            $cashRegister = $this->cashRegisterRepository->findOpenGlobal();
        } else {
            $cashRegister = $this->cashRegisterRepository->findOpenByUserId($userId);
        }

        if ($cashRegister === null) {
            throw new \RuntimeException('No hay una caja abierta. Debes abrir caja antes de realizar ventas.', 403);
        }

        // Validate items
        if (empty($data['items']) || !is_array($data['items'])) {
            throw new \InvalidArgumentException('La venta debe incluir al menos un producto.');
        }

        $paymentMethod = $data['payment_method'] ?? '';
        if (!in_array($paymentMethod, ['cash', 'transfer'], true)) {
            throw new \InvalidArgumentException('El método de pago debe ser "cash" o "transfer".');
        }

        $amountPaid = isset($data['amount_paid']) ? (int) $data['amount_paid'] : 0;
        $createDebt = !empty($data['create_debt']);

        if ($amountPaid <= 0 && !$createDebt) {
            throw new \InvalidArgumentException('El monto pagado debe ser mayor a 0.');
        }

        // Validate and resolve customer
        $customerId = null;
        if (!empty($data['customer_id'])) {
            $customer = $this->customerRepository->findById((int) $data['customer_id']);
            if ($customer === null) {
                throw new \InvalidArgumentException('El cliente especificado no existe.');
            }
            $customerId = (int) $data['customer_id'];
        }

        // If creating debt, customer is required
        if ($createDebt && $customerId === null) {
            throw new \InvalidArgumentException('Debes seleccionar un cliente para crear una deuda.');
        }

        // Resolve and validate items
        $resolvedItems = [];
        $total         = 0;

        foreach ($data['items'] as $item) {
            $productId = isset($item['product_id']) ? (int) $item['product_id'] : null;
            $quantity  = isset($item['quantity'])   ? (int) $item['quantity']   : 0;

            if (!$productId || $quantity <= 0) {
                throw new \InvalidArgumentException('Cada item debe tener product_id y quantity mayor a 0.');
            }

            $product = $this->productRepository->findById($productId);
            if ($product === null || !(bool) $product['active']) {
                throw new \InvalidArgumentException("Producto ID {$productId} no encontrado o inactivo.");
            }

            if ((int) $product['stock'] < $quantity) {
                throw new \RuntimeException(
                    "Stock insuficiente para \"{$product['name']}\". Disponible: {$product['stock']}, solicitado: {$quantity}.",
                    422
                );
            }

            $unitPrice = (int) $product['price'];
            $subtotal  = $unitPrice * $quantity;
            $total    += $subtotal;

            $resolvedItems[] = [
                'product_id' => $productId,
                'quantity'   => $quantity,
                'unit_price' => $unitPrice,
                'subtotal'   => $subtotal,
                'stock'      => (int) $product['stock'],
            ];
        }

        // Validate amount paid covers total (unless creating debt)
        if (!$createDebt && $amountPaid < $total) {
            throw new \InvalidArgumentException(
                "El monto pagado ({$amountPaid}) es insuficiente para cubrir el total ({$total})."
            );
        }

        // If creating debt, amount_paid can be 0 or partial
        if ($createDebt && $amountPaid < 0) {
            throw new \InvalidArgumentException('El monto pagado no puede ser negativo.');
        }

        $changeAmount = $paymentMethod === 'cash' ? max(0, $amountPaid - $total) : 0;
        $notes        = isset($data['notes']) ? trim((string) $data['notes']) : null;

        // Execute in a transaction
        $this->pdo->beginTransaction();

        try {
            // Create sale
            $saleId = $this->saleRepository->create(
                (int) $cashRegister['id'],
                $userId,
                $customerId,
                $total,
                $paymentMethod,
                $amountPaid,
                $changeAmount,
                $notes ?: null
            );

            // Create items and deduct stock
            foreach ($resolvedItems as $item) {
                $this->saleRepository->createItem(
                    $saleId,
                    $item['product_id'],
                    $item['quantity'],
                    $item['unit_price'],
                    $item['subtotal']
                );

                $this->productRepository->decrementStock(
                    $item['product_id'],
                    $item['quantity']
                );
            }

            // Create debt if requested
            $debtId = null;
            if ($createDebt && $customerId !== null && $amountPaid < $total) {
                $debtId = $this->debtRepository->create(
                    $customerId,
                    $saleId,
                    $total,
                    $total - $amountPaid
                );
            }

            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        return $this->saleRepository->findById($saleId);
    }

    /**
     * List sales with pagination and filters.
     */
    public function list(int $page, int $limit, array $filters = []): array
    {
        $page  = max(1, $page);
        $limit = max(1, min(100, $limit));

        $total = $this->saleRepository->count($filters);
        $items = $this->saleRepository->findAll($page, $limit, $filters);

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
     * Get a sale by ID, including debt info if it exists.
     */
    public function getById(int $id): array
    {
        $sale = $this->saleRepository->findById($id);

        if ($sale === null) {
            throw new \InvalidArgumentException('Venta no encontrada.');
        }

        $debt = $this->debtRepository->findBySaleId($id);
        if ($debt !== null) {
            $sale['debt'] = [
                'id'               => (int) $debt['id'],
                'original_amount'  => (int) $debt['original_amount'],
                'paid_amount'      => (int) $debt['paid_amount'],
                'remaining_amount' => (int) $debt['remaining_amount'],
                'status'           => $debt['status'],
            ];
        } else {
            $sale['debt'] = null;
        }

        return $sale;
    }
}
