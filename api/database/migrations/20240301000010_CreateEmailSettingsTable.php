<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateEmailSettingsTable extends AbstractMigration
{
    public function change(): void
    {
        $table = $this->table('email_settings');
        $table
            ->addColumn('smtp_host', 'string', ['limit' => 191, 'null' => true, 'default' => null])
            ->addColumn('smtp_port', 'integer', ['null' => true, 'default' => null])
            ->addColumn('smtp_user', 'string', ['limit' => 191, 'null' => true, 'default' => null])
            ->addColumn('smtp_pass', 'string', ['limit' => 191, 'null' => true, 'default' => null])
            ->addColumn('from_name', 'string', ['limit' => 150, 'null' => true, 'default' => null])
            ->addColumn('notification_email', 'string', ['limit' => 191, 'null' => true, 'default' => null])
            ->addColumn('active', 'boolean', ['default' => false])
            ->addColumn('created_at', 'datetime', ['null' => true])
            ->addColumn('updated_at', 'datetime', ['null' => true])
            ->addIndex(['active'])
            ->create();
    }
}
