<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

final class ProductSeeder extends AbstractSeed
{
    public function getDependencies(): array
    {
        return ['CategorySeeder'];
    }

    public function run(): void
    {
        $this->getAdapter()->execute('SET FOREIGN_KEY_CHECKS=0');
        $this->getAdapter()->execute('TRUNCATE TABLE products');
        $this->getAdapter()->execute('SET FOREIGN_KEY_CHECKS=1');

        // Fetch category IDs dynamically
        $rows = $this->fetchAll('SELECT id, slug FROM categories');
        $catMap = [];
        foreach ($rows as $row) {
            $catMap[$row['slug']] = (int) $row['id'];
        }

        $now = date('Y-m-d H:i:s');

        $products = [
            // Bebidas
            ['category_id' => $catMap['bebidas'], 'name' => 'Café Americano',       'price' => 2500,  'stock' => 100, 'min_stock' => 10, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'Jugo de Naranja',      'price' => 3500,  'stock' => 50,  'min_stock' => 5,  'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'Agua Embotellada',     'price' => 1500,  'stock' => 80,  'min_stock' => 15, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            // Comidas
            ['category_id' => $catMap['comidas'], 'name' => 'Sandwich de Pollo',   'price' => 8000,  'stock' => 30,  'min_stock' => 5,  'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['comidas'], 'name' => 'Empanada de Carne',   'price' => 2500,  'stock' => 40,  'min_stock' => 8,  'active' => true, 'created_at' => $now, 'updated_at' => $now],
            // Snacks
            ['category_id' => $catMap['snacks'],  'name' => 'Papas Fritas',        'price' => 3000,  'stock' => 60,  'min_stock' => 10, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['snacks'],  'name' => 'Galletas de Avena',   'price' => 1500,  'stock' => 45,  'min_stock' => 10, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            // Postres
            ['category_id' => $catMap['postres'], 'name' => 'Brownie de Chocolate','price' => 4500,  'stock' => 20,  'min_stock' => 3,  'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['postres'], 'name' => 'Flan de Vainilla',    'price' => 3500,  'stock' => 15,  'min_stock' => 3,  'active' => true, 'created_at' => $now, 'updated_at' => $now],
            // Otros
            ['category_id' => $catMap['otros'],   'name' => 'Chicle Menta',        'price' => 500,   'stock' => 100, 'min_stock' => 20, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
        ];

        $this->table('products')->insert($products)->saveData();
    }
}
