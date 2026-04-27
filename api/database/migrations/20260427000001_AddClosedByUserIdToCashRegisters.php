<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddClosedByUserIdToCashRegisters extends AbstractMigration
{
    public function up(): void
    {
        $this->table('cash_registers')
            ->addColumn('closed_by_user_id', 'integer', ['signed' => false, 'null' => true, 'default' => null])
            ->addForeignKey('closed_by_user_id', 'users', 'id', ['delete' => 'RESTRICT', 'update' => 'CASCADE'])
            ->update();
    }

    public function down(): void
    {
        $this->table('cash_registers')
            ->dropForeignKey('closed_by_user_id')
            ->removeColumn('closed_by_user_id')
            ->update();
    }
}