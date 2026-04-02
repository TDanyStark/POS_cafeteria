<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateSaleItemsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('sale_items');
        $table
            ->addColumn('sale_id', 'integer', ['signed' => false, 'null' => false])
            ->addColumn('product_id', 'integer', ['signed' => false, 'null' => false])
            ->addColumn('quantity', 'integer', ['null' => false])
            ->addColumn('unit_price', 'decimal', ['precision' => 10, 'scale' => 2])
            ->addColumn('subtotal', 'decimal', ['precision' => 10, 'scale' => 2])
            ->addColumn('created_at', 'datetime', ['null' => true])
            ->addColumn('updated_at', 'datetime', ['null' => true])
            ->addForeignKey('sale_id', 'sales', 'id', ['delete' => 'CASCADE', 'update' => 'CASCADE'])
            ->addForeignKey('product_id', 'products', 'id', ['delete' => 'RESTRICT', 'update' => 'CASCADE'])
            ->addIndex(['sale_id'])
            ->addIndex(['product_id'])
            ->create();
    }
}
