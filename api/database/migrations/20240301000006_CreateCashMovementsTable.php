<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateCashMovementsTable extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('cash_movements', ['id' => true, 'primary_key' => 'id']);
        $table->addColumn('cash_register_id', 'integer', ['signed' => false])
              ->addColumn('user_id', 'integer', ['signed' => false])
              ->addColumn('type', 'enum', ['values' => ['in', 'out']])
              ->addColumn('amount', 'biginteger', ['default' => 0])
              ->addColumn('description', 'string', ['limit' => 255])
              ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
              ->addColumn('updated_at', 'timestamp', [
                  'default' => 'CURRENT_TIMESTAMP',
                  'update'  => 'CURRENT_TIMESTAMP',
              ])
              ->addForeignKey('cash_register_id', 'cash_registers', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
              ->addForeignKey('user_id', 'users', 'id', ['delete' => 'RESTRICT', 'update' => 'CASCADE'])
              ->addIndex(['cash_register_id'])
              ->create();
    }

    public function down(): void
    {
        $this->table('cash_movements')->drop()->save();
    }
}
