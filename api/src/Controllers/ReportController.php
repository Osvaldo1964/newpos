<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use PDO;

class ReportController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /** GET /reports/sales-by-day?from=&to= */
    public function salesByDay(Request $req, Response $res): Response
    {
        $params = $req->getQueryParams();
        $from = $params['from'] ?? date('Y-m-01');
        $to = $params['to'] ?? date('Y-m-d');

        $sql = "
            SELECT
                DATE(s.created_at)          AS fecha,
                COUNT(s.id)                 AS num_ventas,
                SUM(s.subtotal)             AS subtotal,
                SUM(s.iva_total)            AS iva,
                SUM(s.total)                AS total,
                SUM(CASE WHEN sp.metodo='EFECTIVO'    THEN sp.monto ELSE 0 END) AS efectivo,
                SUM(CASE WHEN sp.metodo='TARJETA'     THEN sp.monto ELSE 0 END) AS tarjeta,
                SUM(CASE WHEN sp.metodo='TRANSFERENCIA' THEN sp.monto ELSE 0 END) AS transferencia,
                SUM(CASE WHEN sp.metodo='NEQUI'       THEN sp.monto ELSE 0 END) AS nequi,
                GROUP_CONCAT(DISTINCT u.nombre ORDER BY u.nombre SEPARATOR ', ') AS cajeros
            FROM sales s
            LEFT JOIN sale_payments sp ON sp.sale_id = s.id
            LEFT JOIN users u ON u.id = s.user_id
            WHERE DATE(s.created_at) BETWEEN :from AND :to
              AND s.estado = 'PAGADA'
            GROUP BY DATE(s.created_at)
            ORDER BY fecha ASC
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':from', $from);
        $stmt->bindValue(':to', $to);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Totals
        $totals = [
            'num_ventas' => array_sum(array_column($rows, 'num_ventas')),
            'subtotal' => array_sum(array_column($rows, 'subtotal')),
            'iva' => array_sum(array_column($rows, 'iva')),
            'total' => array_sum(array_column($rows, 'total')),
            'efectivo' => array_sum(array_column($rows, 'efectivo')),
            'tarjeta' => array_sum(array_column($rows, 'tarjeta')),
            'transferencia' => array_sum(array_column($rows, 'transferencia')),
            'nequi' => array_sum(array_column($rows, 'nequi')),
        ];

        $res->getBody()->write(json_encode(['rows' => $rows, 'totals' => $totals]));
        return $res;
    }

    /** GET /reports/sales-by-sede?from=&to= */
    public function salesBySede(Request $req, Response $res): Response
    {
        $params = $req->getQueryParams();
        $from = $params['from'] ?? date('Y-m-01');
        $to = $params['to'] ?? date('Y-m-d');

        $sql = "
            SELECT
                COALESCE(sd.nombre, 'Sin Sede') AS sede,
                COUNT(s.id)                      AS num_ventas,
                SUM(s.subtotal)                  AS subtotal,
                SUM(s.iva_total)                 AS iva,
                SUM(s.total)                     AS total,
                MIN(DATE(s.created_at))          AS desde,
                MAX(DATE(s.created_at))          AS hasta
            FROM sales s
            LEFT JOIN sedes sd ON sd.id = s.sede_id
            WHERE DATE(s.created_at) BETWEEN :from AND :to
              AND s.estado = 'PAGADA'
            GROUP BY s.sede_id, sd.nombre
            ORDER BY total DESC
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':from', $from);
        $stmt->bindValue(':to', $to);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $grandTotal = array_sum(array_column($rows, 'total'));
        foreach ($rows as &$row) {
            $row['porcentaje'] = $grandTotal > 0
                ? round($row['total'] / $grandTotal * 100, 1)
                : 0;
        }

        $totals = [
            'num_ventas' => array_sum(array_column($rows, 'num_ventas')),
            'subtotal' => array_sum(array_column($rows, 'subtotal')),
            'iva' => array_sum(array_column($rows, 'iva')),
            'total' => $grandTotal,
        ];

        $res->getBody()->write(json_encode(['rows' => $rows, 'totals' => $totals]));
        return $res;
    }

    /** GET /reports/top-products?from=&to=&limit= */
    public function topProducts(Request $req, Response $res): Response
    {
        $p = $req->getQueryParams();
        $from = $p['from'] ?? date('Y-m-01');
        $to = $p['to'] ?? date('Y-m-d');
        $limit = (int) ($p['limit'] ?? 20);

        $sql = "
            SELECT
                pr.sku, pr.nombre,
                SUM(si.cantidad)             AS unidades,
                AVG(si.precio_unitario)      AS precio_promedio,
                SUM(si.subtotal)             AS total_ventas,
                COUNT(DISTINCT si.sale_id)   AS num_facturas
            FROM sale_items si
            JOIN products pr ON pr.id = si.product_id
            JOIN sales s ON s.id = si.sale_id
            WHERE DATE(s.created_at) BETWEEN :from AND :to
              AND s.estado = 'PAGADA'
            GROUP BY si.product_id, pr.sku, pr.nombre
            ORDER BY total_ventas DESC
            LIMIT :lim
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':from', $from);
        $stmt->bindValue(':to', $to);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $res->getBody()->write(json_encode($rows));
        return $res;
    }

    /** GET /reports/top-customers?from=&to=&limit= */
    public function topCustomers(Request $req, Response $res): Response
    {
        $p = $req->getQueryParams();
        $from = $p['from'] ?? date('Y-m-01');
        $to = $p['to'] ?? date('Y-m-d');
        $limit = (int) ($p['limit'] ?? 20);

        $sql = "
            SELECT
                COALESCE(t.nombre, 'Consumidor Final') AS cliente,
                t.documento,
                COUNT(s.id)                            AS num_compras,
                SUM(s.total)                           AS total_comprado,
                MAX(DATE(s.created_at))                AS ultima_compra
            FROM sales s
            LEFT JOIN terceros t ON t.id = s.tercero_id
            WHERE DATE(s.created_at) BETWEEN :from AND :to
              AND s.estado = 'PAGADA'
            GROUP BY s.tercero_id, t.nombre, t.documento
            ORDER BY total_comprado DESC
            LIMIT :lim
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':from', $from);
        $stmt->bindValue(':to', $to);
        $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $res->getBody()->write(json_encode($rows));
        return $res;
    }

    /** GET /reports/physical-inventory?warehouse_id= */
    public function physicalInventory(Request $req, Response $res): Response
    {
        $warehouseId = $req->getQueryParams()['warehouse_id'] ?? null;

        $where = $warehouseId ? 'WHERE inv.warehouse_id = :wid' : '';
        $sql = "
            SELECT
                w.nombre                AS bodega,
                c.nombre                AS categoria,
                p.sku,
                p.nombre                AS producto,
                COALESCE(inv.stock_actual, 0) AS stock_sistema,
                0                       AS stock_fisico,
                p.precio_base,
                COALESCE(inv.stock_actual, 0) * p.precio_base AS valor_inventario
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            LEFT JOIN inventory inv ON inv.product_id = p.id
            LEFT JOIN warehouses w ON w.id = inv.warehouse_id
            $where
            ORDER BY w.nombre, c.nombre, p.nombre
        ";
        $stmt = $this->db->prepare($sql);
        if ($warehouseId) {
            $stmt->bindValue(':wid', $warehouseId, PDO::PARAM_INT);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Group by warehouse
        $grouped = [];
        foreach ($rows as $row) {
            $bodega = $row['bodega'] ?? 'Sin Bodega';
            $grouped[$bodega][] = $row;
        }

        $res->getBody()->write(json_encode($grouped));
        return $res;
    }
}
