<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Repositories\EmailSettingsRepositoryInterface;
use PDO;

class MySqlEmailSettingsRepository implements EmailSettingsRepositoryInterface
{
    public function __construct(
        private PDO $pdo
    ) {}

    public function get(): ?array
    {
        $stmt = $this->pdo->query('SELECT * FROM email_settings ORDER BY id ASC LIMIT 1');
        $row  = $stmt->fetch();

        return $row ?: null;
    }

    public function create(array $data): int
    {
        $stmt = $this->pdo->prepare(' 
            INSERT INTO email_settings
                (smtp_host, smtp_port, smtp_user, smtp_pass, from_name, notification_email, active, created_at, updated_at)
            VALUES
                (:smtp_host, :smtp_port, :smtp_user, :smtp_pass, :from_name, :notification_email, :active, NOW(), NOW())
        ');

        $stmt->execute([
            'smtp_host' => $data['smtp_host'],
            'smtp_port' => $data['smtp_port'],
            'smtp_user' => $data['smtp_user'],
            'smtp_pass' => $data['smtp_pass'],
            'from_name' => $data['from_name'],
            'notification_email' => $data['notification_email'],
            'active' => $data['active'] ? 1 : 0,
        ]);

        return (int) $this->pdo->lastInsertId();
    }

    public function update(int $id, array $data): void
    {
        $stmt = $this->pdo->prepare(' 
            UPDATE email_settings
            SET smtp_host = :smtp_host,
                smtp_port = :smtp_port,
                smtp_user = :smtp_user,
                smtp_pass = :smtp_pass,
                from_name = :from_name,
                notification_email = :notification_email,
                active = :active,
                updated_at = NOW()
            WHERE id = :id
        ');

        $stmt->execute([
            'id' => $id,
            'smtp_host' => $data['smtp_host'],
            'smtp_port' => $data['smtp_port'],
            'smtp_user' => $data['smtp_user'],
            'smtp_pass' => $data['smtp_pass'],
            'from_name' => $data['from_name'],
            'notification_email' => $data['notification_email'],
            'active' => $data['active'] ? 1 : 0,
        ]);
    }
}
