<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateCashRegistersTable extends AbstractMigration
{
    public function up(): void
    {
        $table = $this->table('cash_registers', ['id' => true, 'primary_key' => 'id']);
        $table->addColumn('user_id', 'integer', ['signed' => false])
              ->addColumn('opened_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
              ->addColumn('closed_at', 'timestamp', ['null' => true, 'default' => null])
              ->addColumn('initial_amount', 'biginteger', ['default' => 0])
              ->addColumn('final_amount', 'biginteger', ['null' => true, 'default' => null])
              ->addColumn('declared_amount', 'biginteger', ['null' => true, 'default' => null])
              ->addColumn('difference', 'biginteger', ['null' => true, 'default' => null])
              ->addColumn('status', 'enum', ['values' => ['open', 'closed'], 'default' => 'open'])
              ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
              ->addColumn('updated_at', 'timestamp', [
                  'default' => 'CURRENT_TIMESTAMP',
                  'update'  => 'CURRENT_TIMESTAMP',
              ])
              ->addForeignKey('user_id', 'users', 'id', ['delete' => 'RESTRICT', 'update' => 'CASCADE'])
              ->addIndex(['status'])
              ->addIndex(['user_id', 'status'])
              ->create();
    }

    public function down(): void
    {
        $this->table('cash_registers')->drop()->save();
    }
}
