<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateCustomerDebtsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('customer_debts');
        $table
            ->addColumn('customer_id', 'integer', ['signed' => false, 'null' => false])
            ->addColumn('sale_id', 'integer', ['signed' => false, 'null' => false])
            ->addColumn('original_amount', 'decimal', ['precision' => 10, 'scale' => 2])
            ->addColumn('paid_amount', 'decimal', ['precision' => 10, 'scale' => 2, 'default' => '0.00'])
            ->addColumn('remaining_amount', 'decimal', ['precision' => 10, 'scale' => 2])
            ->addColumn('status', 'enum', ['values' => ['pending', 'partial', 'paid'], 'default' => 'pending'])
            ->addColumn('created_at', 'datetime', ['null' => true])
            ->addColumn('updated_at', 'datetime', ['null' => true])
            ->addForeignKey('customer_id', 'customers', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('sale_id', 'sales', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addIndex(['customer_id'])
            ->addIndex(['sale_id'])
            ->addIndex(['status'])
            ->addIndex(['created_at'])
            ->create();
    }
}