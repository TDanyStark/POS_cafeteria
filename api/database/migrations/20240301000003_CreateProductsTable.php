<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateProductsTable extends AbstractMigration
{
    public function up(): void
    {
        $products = $this->table('products', ['id' => true, 'primary_key' => 'id']);
        $products->addColumn('category_id', 'integer', ['null' => false, 'signed' => false])
                 ->addColumn('name', 'string', ['limit' => 150])
                 ->addColumn('price', 'decimal', ['precision' => 10, 'scale' => 2])
                 ->addColumn('stock', 'integer', ['default' => 0])
                 ->addColumn('min_stock', 'integer', ['default' => 5])
                 ->addColumn('active', 'boolean', ['default' => true])
                 ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
                 ->addColumn('updated_at', 'timestamp', [
                     'default' => 'CURRENT_TIMESTAMP',
                     'update' => 'CURRENT_TIMESTAMP',
                 ])
                 ->addForeignKey('category_id', 'categories', 'id', [
                     'delete' => 'RESTRICT',
                     'update' => 'CASCADE',
                 ])
                 ->create();
    }

    public function down(): void
    {
        $this->table('products')->drop()->save();
    }
}
