<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

final class CustomerSeeder extends AbstractSeed
{
    public function run(): void
    {
        $this->getAdapter()->execute('SET FOREIGN_KEY_CHECKS=0');
        $this->getAdapter()->execute('TRUNCATE TABLE customers');
        $this->getAdapter()->execute('SET FOREIGN_KEY_CHECKS=1');

        $now = date('Y-m-d H:i:s');

        $customers = [
            ['name' => 'Ana García',      'phone' => '300-111-2233', 'email' => 'ana@example.com',    'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Luis Martínez',   'phone' => '310-222-3344', 'email' => null,                  'created_at' => $now, 'updated_at' => $now],
            ['name' => 'María Torres',    'phone' => '320-333-4455', 'email' => 'maria@example.com',  'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Carlos Sánchez',  'phone' => '315-444-5566', 'email' => null,                  'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Laura Rodríguez', 'phone' => '305-555-6677', 'email' => 'laura@example.com',  'created_at' => $now, 'updated_at' => $now],
        ];

        $this->table('customers')->insert($customers)->saveData();
    }
}
