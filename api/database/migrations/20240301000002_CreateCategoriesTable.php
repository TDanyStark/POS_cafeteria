<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateCategoriesTable extends AbstractMigration
{
    public function up(): void
    {
        $categories = $this->table('categories', ['id' => true, 'primary_key' => 'id']);
        $categories->addColumn('name', 'string', ['limit' => 100])
                   ->addColumn('slug', 'string', ['limit' => 100])
                   ->addColumn('created_at', 'timestamp', ['default' => 'CURRENT_TIMESTAMP'])
                   ->addColumn('updated_at', 'timestamp', [
                       'default' => 'CURRENT_TIMESTAMP',
                       'update' => 'CURRENT_TIMESTAMP',
                   ])
                   ->addIndex(['slug'], ['unique' => true])
                   ->create();
    }

    public function down(): void
    {
        $this->table('categories')->drop()->save();
    }
}
