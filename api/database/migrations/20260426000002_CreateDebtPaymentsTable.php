<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateDebtPaymentsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('debt_payments');
        $table
            ->addColumn('debt_id', 'integer', ['signed' => false, 'null' => false])
            ->addColumn('user_id', 'integer', ['signed' => false, 'null' => false])
            ->addColumn('cash_register_id', 'integer', ['signed' => false, 'null' => true])
            ->addColumn('amount', 'biginteger', ['default' => 0])
            ->addColumn('payment_method', 'enum', ['values' => ['cash', 'transfer']])
            ->addColumn('notes', 'text', ['null' => true, 'default' => null])
            ->addColumn('created_at', 'datetime', ['null' => true])
            ->addColumn('updated_at', 'datetime', ['null' => true])
            ->addForeignKey('debt_id', 'customer_debts', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('user_id', 'users', 'id', ['delete' => 'RESTRICT', 'update' => 'CASCADE'])
            ->addForeignKey('cash_register_id', 'cash_registers', 'id', ['delete' => 'SET_NULL', 'update' => 'CASCADE'])
            ->addIndex(['debt_id'])
            ->addIndex(['user_id'])
            ->addIndex(['cash_register_id'])
            ->addIndex(['created_at'])
            ->create();
    }
}