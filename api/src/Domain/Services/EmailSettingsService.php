<?php

declare(strict_types=1);

namespace App\Domain\Services;

use App\Domain\Repositories\EmailSettingsRepositoryInterface;

class EmailSettingsService
{
    public function __construct(
        private EmailSettingsRepositoryInterface $emailSettingsRepository
    ) {}

    public function getSettings(): array
    {
        $settings = $this->emailSettingsRepository->get();

        if ($settings === null) {
            $id = $this->emailSettingsRepository->create($this->buildEmptySettings());
            $settings = $this->emailSettingsRepository->get();
            if ($settings === null) {
                throw new \RuntimeException('No fue posible inicializar la configuración de email.', 500);
            }
            $settings['id'] = $id;
        }

        return $this->sanitizeForResponse($settings);
    }

    public function updateSettings(array $data): array
    {
        $current = $this->emailSettingsRepository->get();
        $normalized = $this->normalize($data);

        if (($normalized['smtp_pass'] === null || $normalized['smtp_pass'] === '') && $current !== null) {
            $normalized['smtp_pass'] = $current['smtp_pass'];
        }

        $this->validate($normalized);

        if ($current === null) {
            $this->emailSettingsRepository->create($normalized);
        } else {
            $this->emailSettingsRepository->update((int) $current['id'], $normalized);
        }

        $updated = $this->emailSettingsRepository->get();
        if ($updated === null) {
            throw new \RuntimeException('No fue posible guardar la configuración de email.', 500);
        }

        return $this->sanitizeForResponse($updated);
    }

    public function getSettingsForMailer(): ?array
    {
        $settings = $this->emailSettingsRepository->get();
        if ($settings === null || !(bool) $settings['active']) {
            return null;
        }

        return $settings;
    }

    private function normalize(array $data): array
    {
        return [
            'smtp_host' => isset($data['smtp_host']) ? trim((string) $data['smtp_host']) : null,
            'smtp_port' => isset($data['smtp_port']) && $data['smtp_port'] !== '' ? (int) $data['smtp_port'] : null,
            'smtp_user' => isset($data['smtp_user']) ? trim((string) $data['smtp_user']) : null,
            'smtp_pass' => isset($data['smtp_pass']) ? trim((string) $data['smtp_pass']) : null,
            'from_name' => isset($data['from_name']) ? trim((string) $data['from_name']) : null,
            'notification_email' => isset($data['notification_email']) ? trim((string) $data['notification_email']) : null,
            'active' => isset($data['active']) ? (bool) $data['active'] : false,
        ];
    }

    private function validate(array $data): void
    {
        $requiredFields = [
            'smtp_host' => 'El host SMTP es requerido.',
            'smtp_port' => 'El puerto SMTP es requerido.',
            'smtp_user' => 'El usuario SMTP es requerido.',
            'smtp_pass' => 'La contraseña SMTP es requerida.',
            'from_name' => 'El nombre remitente es requerido.',
            'notification_email' => 'El correo destino es requerido.',
        ];

        foreach ($requiredFields as $field => $message) {
            if ($data[$field] === null || $data[$field] === '') {
                throw new \InvalidArgumentException($message);
            }
        }

        if ($data['smtp_port'] < 1 || $data['smtp_port'] > 65535) {
            throw new \InvalidArgumentException('El puerto SMTP debe estar entre 1 y 65535.');
        }

        if (!filter_var((string) $data['notification_email'], FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('El correo destino no tiene un formato válido.');
        }
    }

    private function sanitizeForResponse(array $settings): array
    {
        return [
            'id' => (int) $settings['id'],
            'smtp_host' => $settings['smtp_host'],
            'smtp_port' => $settings['smtp_port'] !== null ? (int) $settings['smtp_port'] : null,
            'smtp_user' => $settings['smtp_user'],
            'smtp_pass' => $settings['smtp_pass'] !== null && $settings['smtp_pass'] !== '' ? '********' : null,
            'from_name' => $settings['from_name'],
            'notification_email' => $settings['notification_email'],
            'active' => (bool) $settings['active'],
            'created_at' => $settings['created_at'],
            'updated_at' => $settings['updated_at'],
        ];
    }

    private function buildEmptySettings(): array
    {
        return [
            'smtp_host' => null,
            'smtp_port' => null,
            'smtp_user' => null,
            'smtp_pass' => null,
            'from_name' => null,
            'notification_email' => null,
            'active' => false,
        ];
    }
}
