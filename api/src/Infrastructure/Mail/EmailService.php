<?php

declare(strict_types=1);

namespace App\Infrastructure\Mail;

use App\Domain\Services\EmailSettingsService;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

class EmailService
{
    public function __construct(
        private EmailSettingsService $emailSettingsService
    ) {}

    public function sendSaleReceipt(array $sale): void
    {
        $settings = $this->emailSettingsService->getSettingsForMailer();
        if ($settings === null) {
            return;
        }

        $mail = $this->buildMailer($settings);
        $mail->addAddress((string) $settings['notification_email']);

        if (!empty($sale['customer_email']) && filter_var($sale['customer_email'], FILTER_VALIDATE_EMAIL)) {
            $mail->addCC((string) $sale['customer_email']);
        }

        $saleId = (int) $sale['id'];
        $mail->Subject = "Comprobante de venta #{$saleId}";
        $mail->Body = $this->renderSaleReceiptHtml($sale);
        $mail->AltBody = $this->renderSaleReceiptText($sale);

        try {
            $mail->send();
        } catch (\Throwable $e) {
            throw new \RuntimeException('Error SMTP al enviar comprobante: ' . $e->getMessage(), 500);
        }
    }

    public function queueSaleReceipt(array $sale, callable $onError): void
    {
        register_shutdown_function(function () use ($sale, $onError): void {
            try {
                $this->sendSaleReceipt($sale);
            } catch (\Throwable $e) {
                $onError($e);
            }
        });
    }

    public function sendTestEmail(): void
    {
        $settings = $this->emailSettingsService->getSettingsForMailer();
        if ($settings === null) {
            throw new \RuntimeException('La configuración de email no está activa.', 422);
        }

        $mail = $this->buildMailer($settings);
        $mail->addAddress((string) $settings['notification_email']);
        $mail->Subject = 'Correo de prueba - POS Cafeteria';
        $mail->Body = '<h2>Correo de prueba</h2><p>La configuración SMTP está funcionando correctamente.</p>';
        $mail->AltBody = 'Correo de prueba: la configuración SMTP está funcionando correctamente.';
        try {
            $mail->send();
        } catch (\Throwable $e) {
            throw new \RuntimeException('Error SMTP al enviar correo de prueba: ' . $e->getMessage(), 422);
        }
    }

    private function buildMailer(array $settings): PHPMailer
    {
        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = (string) $settings['smtp_host'];
            $mail->Port = (int) $settings['smtp_port'];
            $mail->SMTPAuth = true;
            $mail->Username = (string) $settings['smtp_user'];
            $mail->Password = (string) $settings['smtp_pass'];
            $mail->SMTPSecure = ((int) $settings['smtp_port'] === 465)
                ? PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->setFrom((string) $settings['smtp_user'], (string) ($settings['from_name'] ?? 'POS Cafeteria'));
            $mail->isHTML(true);
            $mail->CharSet = 'UTF-8';

            return $mail;
        } catch (Exception $e) {
            throw new \RuntimeException('No fue posible inicializar el envío de correo: ' . $e->getMessage(), 500);
        }
    }

    private function renderSaleReceiptHtml(array $sale): string
    {
        $cashier = htmlspecialchars((string) ($sale['cashier_name'] ?? 'N/A'), ENT_QUOTES, 'UTF-8');
        $customer = htmlspecialchars((string) ($sale['customer_name'] ?? 'Venta anónima'), ENT_QUOTES, 'UTF-8');
        $paymentMethod = $sale['payment_method'] === 'cash' ? 'Efectivo' : 'Transferencia';
        $paymentMethod = htmlspecialchars($paymentMethod, ENT_QUOTES, 'UTF-8');
        $date = htmlspecialchars((string) ($sale['created_at'] ?? ''), ENT_QUOTES, 'UTF-8');

        $itemsRows = '';
        foreach (($sale['items'] ?? []) as $item) {
            $name = htmlspecialchars((string) ($item['product_name'] ?? ''), ENT_QUOTES, 'UTF-8');
            $qty = (int) ($item['quantity'] ?? 0);
            $price = number_format((int) ($item['unit_price'] ?? 0), 0, ',', '.');
            $subtotal = number_format((int) ($item['subtotal'] ?? 0), 0, ',', '.');

            $itemsRows .= "<tr>\n"
                . "<td style='padding:8px;border-bottom:1px solid #e5e7eb;'>{$name}</td>\n"
                . "<td style='padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;'>{$qty}</td>\n"
                . "<td style='padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;'>$ {$price}</td>\n"
                . "<td style='padding:8px;border-bottom:1px solid #e5e7eb;text-align:right;'>$ {$subtotal}</td>\n"
                . "</tr>";
        }

        $total = number_format((int) ($sale['total'] ?? 0), 0, ',', '.');
        $paid = number_format((int) ($sale['amount_paid'] ?? 0), 0, ',', '.');
        $change = number_format((int) ($sale['change_amount'] ?? 0), 0, ',', '.');
        $saleId = (int) ($sale['id'] ?? 0);

        return "
            <div style='font-family:Arial,sans-serif;max-width:700px;margin:0 auto;color:#111827;'>
                <h2 style='margin-bottom:8px;'>Comprobante de Venta #{$saleId}</h2>
                <p style='margin:0 0 16px 0;color:#4b5563;'>Fecha: {$date}</p>
                <p style='margin:0;'>Cajero: <strong>{$cashier}</strong></p>
                <p style='margin:0;'>Cliente: <strong>{$customer}</strong></p>
                <p style='margin:0 0 16px 0;'>Método de pago: <strong>{$paymentMethod}</strong></p>

                <table style='width:100%;border-collapse:collapse;font-size:14px;'>
                    <thead>
                        <tr style='background:#f3f4f6;'>
                            <th style='padding:8px;text-align:left;'>Producto</th>
                            <th style='padding:8px;text-align:right;'>Cant.</th>
                            <th style='padding:8px;text-align:right;'>Precio</th>
                            <th style='padding:8px;text-align:right;'>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {$itemsRows}
                    </tbody>
                </table>

                <div style='margin-top:16px;text-align:right;'>
                    <p style='margin:4px 0;'>Total: <strong>$ {$total}</strong></p>
                    <p style='margin:4px 0;'>Pagado: <strong>$ {$paid}</strong></p>
                    <p style='margin:4px 0;'>Cambio: <strong>$ {$change}</strong></p>
                </div>
            </div>
        ";
    }

    private function renderSaleReceiptText(array $sale): string
    {
        $lines = [];
        $lines[] = 'Comprobante de Venta #' . (int) ($sale['id'] ?? 0);
        $lines[] = 'Fecha: ' . ($sale['created_at'] ?? '');
        $lines[] = 'Cajero: ' . ($sale['cashier_name'] ?? 'N/A');
        $lines[] = 'Cliente: ' . ($sale['customer_name'] ?? 'Venta anónima');
        $lines[] = 'Metodo de pago: ' . (($sale['payment_method'] ?? '') === 'cash' ? 'Efectivo' : 'Transferencia');
        $lines[] = '';
        $lines[] = 'Items:';

        foreach (($sale['items'] ?? []) as $item) {
            $lines[] = sprintf(
                '- %s x%d = $ %s',
                (string) ($item['product_name'] ?? ''),
                (int) ($item['quantity'] ?? 0),
                number_format((int) ($item['subtotal'] ?? 0), 0, ',', '.')
            );
        }

        $lines[] = '';
        $lines[] = 'Total: $ ' . number_format((int) ($sale['total'] ?? 0), 0, ',', '.');
        $lines[] = 'Pagado: $ ' . number_format((int) ($sale['amount_paid'] ?? 0), 0, ',', '.');
        $lines[] = 'Cambio: $ ' . number_format((int) ($sale['change_amount'] ?? 0), 0, ',', '.');

        return implode("\n", $lines);
    }
}
