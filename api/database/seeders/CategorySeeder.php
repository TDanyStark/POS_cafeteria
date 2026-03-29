<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

final class CategorySeeder extends AbstractSeed
{
    public function getDependencies(): array
    {
        return [];
    }

    public function run(): void
    {
        $this->getAdapter()->execute('SET FOREIGN_KEY_CHECKS=0');
        $this->getAdapter()->execute('TRUNCATE TABLE categories');
        $this->getAdapter()->execute('SET FOREIGN_KEY_CHECKS=1');

        $categories = [
            ['name' => 'Bebidas',  'slug' => 'bebidas',  'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
            ['name' => 'Comidas',  'slug' => 'comidas',  'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
            ['name' => 'Snacks',   'slug' => 'snacks',   'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
            ['name' => 'Postres',  'slug' => 'postres',  'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
            ['name' => 'Otros',    'slug' => 'otros',    'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s')],
        ];

        $this->table('categories')->insert($categories)->saveData();
    }
}
