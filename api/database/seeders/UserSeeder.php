<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

final class UserSeeder extends AbstractSeed
{
    public function run(): void
    {
        // Truncate to allow idempotent re-seeding
        $this->getAdapter()->execute('TRUNCATE TABLE users');

        $users = [
            [
                'name' => 'Administrador',
                'email' => 'admin@cafeteria.com',
                'password' => password_hash('admin123', PASSWORD_DEFAULT),
                'role' => 'admin',
                'active' => true,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ],
            [
                'name' => 'Cajero Juan',
                'email' => 'juan@cafeteria.com',
                'password' => password_hash('juan123', PASSWORD_DEFAULT),
                'role' => 'cashier',
                'active' => true,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ],
            [
                'name' => 'Cajero María',
                'email' => 'maria@cafeteria.com',
                'password' => password_hash('maria123', PASSWORD_DEFAULT),
                'role' => 'cashier',
                'active' => true,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ],
        ];

        $this->table('users')->insert($users)->saveData();
    }
}
