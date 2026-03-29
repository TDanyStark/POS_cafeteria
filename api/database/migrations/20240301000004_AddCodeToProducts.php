<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddCodeToProducts extends AbstractMigration
{
    public function up(): void
    {
        $this->table('products')
             ->addColumn('code', 'string', [
                 'limit'   => 100,
                 'null'    => true,
                 'default' => null,
                 'after'   => 'id',
             ])
             ->addIndex(['code'], ['unique' => true, 'name' => 'idx_products_code'])
             ->update();
    }

    public function down(): void
    {
        $this->table('products')
             ->removeIndex(['code'])
             ->removeColumn('code')
             ->update();
    }
}
