<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateUsersTable extends AbstractMigration
{
    public function up(): void
    {
        $users = $this->table('users', ['id' => true, 'primary_key' => 'id']);
        $users->addColumn('name', 'string', ['limit' => 100])
              ->addColumn('email', 'string', ['limit' => 150])
              ->addColumn('password', 'string', ['limit' => 255])
              ->addColumn('role', 'enum', ['values' => ['admin', 'cashier']])
              ->addColumn('active', 'boolean', ['default' => true])
              ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
              ->addColumn('updated_at', 'timestamp', [
                  'default' => 'CURRENT_TIMESTAMP',
                  'update' => 'CURRENT_TIMESTAMP'
              ])
              ->addIndex(['email'], ['unique' => true])
              ->create();
    }

    public function down(): void
    {
        $this->table('users')->drop()->save();
    }
}
