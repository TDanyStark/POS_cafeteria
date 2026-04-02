<?php

declare(strict_types=1);

use Phinx\Seed\AbstractSeed;

final class EmailSettingsSeeder extends AbstractSeed
{
    public function run(): void
    {
        $this->getAdapter()->execute('TRUNCATE TABLE email_settings');

        $now = date('Y-m-d H:i:s');

        $this->table('email_settings')->insert([
            [
                'smtp_host' => null,
                'smtp_port' => null,
                'smtp_user' => null,
                'smtp_pass' => null,
                'from_name' => null,
                'notification_email' => null,
                'active' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ])->saveData();
    }
}
