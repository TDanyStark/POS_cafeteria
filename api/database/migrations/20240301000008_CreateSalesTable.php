<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateSalesTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('sales');
        $table
            ->addColumn('cash_register_id', 'integer', ['signed' => false, 'null' => false])
            ->addColumn('user_id', 'integer', ['signed' => false, 'null' => false])
            ->addColumn('customer_id', 'integer', ['signed' => false, 'null' => true, 'default' => null])
            ->addColumn('total', 'biginteger', ['default' => 0])
            ->addColumn('payment_method', 'enum', ['values' => ['cash', 'transfer']])
            ->addColumn('amount_paid', 'biginteger', ['default' => 0])
            ->addColumn('change_amount', 'biginteger', ['default' => 0])
            ->addColumn('notes', 'text', ['null' => true, 'default' => null])
            ->addColumn('created_at', 'datetime', ['null' => true])
            ->addColumn('updated_at', 'datetime', ['null' => true])
            ->addForeignKey('cash_register_id', 'cash_registers', 'id', ['delete' => 'RESTRICT', 'update' => 'CASCADE'])
            ->addForeignKey('user_id', 'users', 'id', ['delete' => 'RESTRICT', 'update' => 'CASCADE'])
            ->addForeignKey('customer_id', 'customers', 'id', ['delete' => 'SET_NULL', 'update' => 'CASCADE'])
            ->addIndex(['cash_register_id'])
            ->addIndex(['user_id'])
            ->addIndex(['customer_id'])
            ->addIndex(['created_at'])
            ->create();
    }
}
