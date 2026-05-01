<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

final class UserSeeder extends AbstractSeed
{
    public function run(): void
    {
        $this->getAdapter()->execute('SET FOREIGN_KEY_CHECKS=0');
        $this->getAdapter()->execute('TRUNCATE TABLE users');
        $this->getAdapter()->execute('SET FOREIGN_KEY_CHECKS=1');

        $now = date('Y-m-d H:i:s');

        $users = [
            [
                'name'       => 'Administrador',
                'email'      => 'admin@cafeteria.com',
                // password: admin123
                'password'   => '$2y$10$mGDtfpHF34Zo8iiN6FNFv.kBUK.LuBQE3TK1bXCokGV.lFn8WZh.i',
                'role'       => 'admin',
                'active'     => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name'       => 'lina cespedes',
                'email'      => 'lina@gmail.com',
                'password'   => '$2y$10$ozu9ccTLXPUnzVVZ80oEmOoDaVpUfeetX.vY6CEBhbg63d7KtgfVq',
                'role'       => 'cashier',
                'active'     => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name'       => 'Carolina grisales',
                'email'      => 'carolina@gmail.com',
                'password'   => '$2y$10$rF7dkwNgPFguGgzLrp2GHebERtOoyBKLJDdQxRDSpDPpI83oAjA7G',
                'role'       => 'cashier',
                'active'     => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        $this->table('users')->insert($users)->saveData();
    }
}
