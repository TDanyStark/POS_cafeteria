<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence;

use App\Domain\Repositories\ReportRepositoryInterface;
use PDO;

class MySqlReportRepository implements ReportRepositoryInterface
{
    public function __construct(
        private PDO $pdo
    ) {}

    public function findTopSellers(int $limit, array $filters = []): array
    {
        $params = [];
        $where  = [];

        if (!empty($filters['date_from'])) {
            $where[]              = 's.created_at >= :date_from';
            $params['date_from'] = $filters['date_from'] . ' 00:00:00';
        }

        if (!empty($filters['date_to'])) {
            $where[]            = 's.created_at <= :date_to';
            $params['date_to']  = $filters['date_to'] . ' 23:59:59';
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "
            SELECT 
                p.id,
                p.name AS product_name,
                p.category_id,
                c.name AS category_name,
                SUM(si.quantity) AS total_quantity,
                SUM(si.subtotal) AS total_revenue
            FROM sale_items si
            INNER JOIN sales s ON s.id = si.sale_id
            INNER JOIN products p ON p.id = si.product_id
            LEFT JOIN categories c ON c.id = p.category_id
            {$whereClause}
            GROUP BY p.id, p.name, p.category_id, c.name
            ORDER BY total_quantity DESC
            LIMIT :limit
        ";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);

        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
        }

        $stmt->execute();
        $results = $stmt->fetchAll();

        $rank = 1;
        foreach ($results as &$row) {
            $row['rank'] = $rank++;
        }

        return $results;
    }

    public function findSalesSummary(array $filters = []): array
    {
        $params = [];
        $where  = [];

        if (!empty($filters['date_from'])) {
            $where[]              = 's.created_at >= :date_from';
            $params['date_from'] = $filters['date_from'] . ' 00:00:00';
        }

        if (!empty($filters['date_to'])) {
            $where[]            = 's.created_at <= :date_to';
            $params['date_to']  = $filters['date_to'] . ' 23:59:59';
        }

        $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

        $byMethodSql = "
            SELECT 
                payment_method,
                COUNT(*) AS total_sales,
                SUM(total) AS total_amount
            FROM sales s
            {$whereClause}
            GROUP BY payment_method
        ";

        $stmt = $this->pdo->prepare($byMethodSql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(':' . $key, $value, PDO::PARAM_STR);
        }
        $stmt->execute();
        $byMethod = $stmt->fetchAll();

        $totalSales    = 0;
        $totalCash     = 0.0;
        $totalTransfer = 0.0;

        foreach ($byMethod as $row) {
            $totalSales += (int) $row['total_sales'];
            if ($row['payment_method'] === 'cash') {
                $totalCash = (float) $row['total_amount'];
            } else {
                $totalTransfer = (float) $row['total_amount'];
            }
        }

        return [
            'total_sales'     => $totalSales,
            'total_amount'   => $totalCash + $totalTransfer,
            'total_cash'     => $totalCash,
            'total_transfer' => $totalTransfer,
            'by_method'       => $byMethod,
        ];
    }

    public function findStockAlerts(): array
    {
        $sql = "
            SELECT 
                p.id,
                p.name AS product_name,
                p.category_id,
                c.name AS category_name,
                p.stock,
                p.min_stock,
                p.price
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.active = 1 AND p.stock <= p.min_stock
            ORDER BY p.stock ASC
        ";

        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll();
    }
}
