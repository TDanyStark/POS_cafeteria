<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ChangeMoneyColumnsToInteger extends AbstractMigration
{
    public function up(): void
    {
        // products.price
        $this->execute('ALTER TABLE `products` MODIFY `price` BIGINT UNSIGNED NOT NULL DEFAULT 0');

        // cash_registers
        $this->execute('ALTER TABLE `cash_registers`
            MODIFY `initial_amount` BIGINT NOT NULL DEFAULT 0,
            MODIFY `final_amount` BIGINT NULL DEFAULT NULL,
            MODIFY `declared_amount` BIGINT NULL DEFAULT NULL,
            MODIFY `difference` BIGINT NULL DEFAULT NULL
        ');

        // cash_movements.amount
        $this->execute('ALTER TABLE `cash_movements` MODIFY `amount` BIGINT NOT NULL DEFAULT 0');

        // sales
        $this->execute('ALTER TABLE `sales`
            MODIFY `total` BIGINT NOT NULL DEFAULT 0,
            MODIFY `amount_paid` BIGINT NOT NULL DEFAULT 0,
            MODIFY `change_amount` BIGINT NOT NULL DEFAULT 0
        ');

        // sale_items
        $this->execute('ALTER TABLE `sale_items`
            MODIFY `unit_price` BIGINT NOT NULL DEFAULT 0,
            MODIFY `subtotal` BIGINT NOT NULL DEFAULT 0
        ');

        // customer_debts
        $this->execute('ALTER TABLE `customer_debts`
            MODIFY `original_amount` BIGINT NOT NULL DEFAULT 0,
            MODIFY `paid_amount` BIGINT NOT NULL DEFAULT 0,
            MODIFY `remaining_amount` BIGINT NOT NULL DEFAULT 0
        ');

        // debt_payments.amount
        $this->execute('ALTER TABLE `debt_payments` MODIFY `amount` BIGINT NOT NULL DEFAULT 0');
    }

    public function down(): void
    {
        $this->execute('ALTER TABLE `products` MODIFY `price` DECIMAL(10,2) NOT NULL');

        $this->execute('ALTER TABLE `cash_registers`
            MODIFY `initial_amount` DECIMAL(12,2) NOT NULL,
            MODIFY `final_amount` DECIMAL(12,2) NULL DEFAULT NULL,
            MODIFY `declared_amount` DECIMAL(12,2) NULL DEFAULT NULL,
            MODIFY `difference` DECIMAL(12,2) NULL DEFAULT NULL
        ');

        $this->execute('ALTER TABLE `cash_movements` MODIFY `amount` DECIMAL(12,2) NOT NULL');

        $this->execute('ALTER TABLE `sales`
            MODIFY `total` DECIMAL(10,2) NOT NULL,
            MODIFY `amount_paid` DECIMAL(10,2) NOT NULL,
            MODIFY `change_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00
        ');

        $this->execute('ALTER TABLE `sale_items`
            MODIFY `unit_price` DECIMAL(10,2) NOT NULL,
            MODIFY `subtotal` DECIMAL(10,2) NOT NULL
        ');

        $this->execute('ALTER TABLE `customer_debts`
            MODIFY `original_amount` DECIMAL(10,2) NOT NULL,
            MODIFY `paid_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            MODIFY `remaining_amount` DECIMAL(10,2) NOT NULL
        ');

        $this->execute('ALTER TABLE `debt_payments` MODIFY `amount` DECIMAL(10,2) NOT NULL');
    }
}
