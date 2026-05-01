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
            ['category_id' => $catMap['bebidas'], 'name' => 'gaseosa postobon',        'price' => 5000,  'stock' => 999,  'min_stock' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'Gaseosa cocacola',         'price' => 5000,  'stock' => 999,  'min_stock' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'jugo del valle',           'price' => 5000,  'stock' => 999,  'min_stock' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'soda bretaña',             'price' => 5000,  'stock' => 999,  'min_stock' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'botella agua grande',      'price' => 3000,  'stock' => 999,  'min_stock' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'botella agua pequeña',     'price' => 1500,  'stock' => 999,  'min_stock' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'cafe filtrado',            'price' => 2500,  'stock' => 999,  'min_stock' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'latte pequeño',            'price' => 3000,  'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'soda saborizada',          'price' => 12000, 'stock' => 9999, 'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'soda + limon',             'price' => 6000,  'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'soda michelada y limon',   'price' => 7000,  'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'cafe americano',           'price' => 4000,  'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'latte grande',             'price' => 6000,  'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'aromatica',                'price' => 3000,  'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'agua saborizada postobon', 'price' => 3500,  'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'limonada de coco',         'price' => 11000, 'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'cafe frapuchino',          'price' => 13000, 'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['bebidas'], 'name' => 'gatorade',                 'price' => 6000,  'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            // Comidas
            ['category_id' => $catMap['comidas'], 'name' => 'arepa con queso',          'price' => 6500,  'stock' => 999,  'min_stock' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['comidas'], 'name' => 'sandwich de pollo',        'price' => 13000, 'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['comidas'], 'name' => 'sandwich de costilla',     'price' => 16000, 'stock' => 999,  'min_stock' => 2, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['comidas'], 'name' => 'hamburguesa + papas',      'price' => 23000, 'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            // Snacks
            ['category_id' => $catMap['snacks'],  'name' => 'snack paquete',            'price' => 3000,  'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['snacks'],  'name' => 'galleta oreo',             'price' => 2000,  'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            ['category_id' => $catMap['snacks'],  'name' => 'chicle',                   'price' => 3000,  'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
            // Postres
            ['category_id' => $catMap['postres'], 'name' => 'torta porcion',            'price' => 8000,  'stock' => 999,  'min_stock' => 5, 'active' => true, 'created_at' => $now, 'updated_at' => $now],
        ];

        $this->table('products')->insert($products)->saveData();
    }
}
