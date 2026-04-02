<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateCustomersTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('customers');
        $table
            ->addColumn('name', 'string', ['limit' => 150])
            ->addColumn('phone', 'string', ['limit' => 30])
            ->addColumn('email', 'string', ['limit' => 150, 'null' => true, 'default' => null])
            ->addColumn('created_at', 'datetime', ['null' => true])
            ->addColumn('updated_at', 'datetime', ['null' => true])
            ->addIndex(['phone'])
            ->create();
    }
}
