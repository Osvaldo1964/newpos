<?php
namespace App\Models;

use PDO;
use Exception;

class Sale
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function create($data)
    {
        try {
            $this->db->beginTransaction();

            // 1. Insertar Cabecera de Venta
            $sql = "INSERT INTO sales (user_id, tercero_id, sede_id, tipo, subtotal, iva_total, total, estado) 
                    VALUES (?, ?, ?, 'POS', ?, ?, ?, 'PAGADA')";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $data['user_id'],
                $data['customer_id'] ?? null,
                $data['sede_id'] ?? null,
                $data['subtotal'],
                $data['iva_total'],
                $data['total']
            ]);
            $saleId = $this->db->lastInsertId();

            // 2. Insertar Detalle e Inventario
            foreach ($data['items'] as $item) {
                // Registrar detalle
                $sqlItem = "INSERT INTO sale_items (sale_id, product_id, cantidad, precio_unitario, descuento, subtotal) 
                            VALUES (?, ?, ?, ?, ?, ?)";
                $stmtItem = $this->db->prepare($sqlItem);
                $stmtItem->execute([
                    $saleId,
                    $item['product_id'],
                    $item['cantidad'],
                    $item['precio_unitario'],
                    $item['descuento'] ?? 0,
                    $item['subtotal']
                ]);

                // Descontar inventario
                $warehouseId = $data['warehouse_id'];

                // Verificar stock
                $sqlCheck = "SELECT stock_actual FROM inventory WHERE product_id = ? AND warehouse_id = ? FOR UPDATE";
                $stmtCheck = $this->db->prepare($sqlCheck);
                $stmtCheck->execute([$item['product_id'], $warehouseId]);
                $stock = $stmtCheck->fetchColumn();

                if ($stock < $item['cantidad']) {
                    throw new Exception("Stock insuficiente para el producto ID: " . $item['product_id']);
                }

                $sqlUpdateStock = "UPDATE inventory SET stock_actual = stock_actual - ? 
                                    WHERE product_id = ? AND warehouse_id = ?";
                $this->db->prepare($sqlUpdateStock)->execute([$item['cantidad'], $item['product_id'], $warehouseId]);

                // Registrar movimiento de inventario
                $sqlMov = "INSERT INTO inventory_movements (tipo, product_id, from_warehouse_id, cantidad, user_id, observaciones) 
                           VALUES ('VENTA', ?, ?, ?, ?, ?)";
                $this->db->prepare($sqlMov)->execute([
                    $item['product_id'],
                    $warehouseId,
                    $item['cantidad'],
                    $data['user_id'],
                    "Venta POS #" . $saleId
                ]);
            }

            // 3. Registrar Pagos y Movimientos de Caja
            foreach ($data['payments'] as $payment) {
                $sqlPay = "INSERT INTO sale_payments (sale_id, metodo, monto, referencia) VALUES (?, ?, ?, ?)";
                $this->db->prepare($sqlPay)->execute([
                    $saleId,
                    $payment['metodo'],
                    $payment['monto'],
                    $payment['referencia'] ?? null
                ]);

                if (!empty($data['cash_session_id'])) {
                    $sqlCash = "INSERT INTO cash_movements (session_id, tipo, monto, metodo_pago, descripcion) 
                                VALUES (?, 'INGRESO', ?, ?, ?)";
                    $this->db->prepare($sqlCash)->execute([
                        $data['cash_session_id'],
                        $payment['monto'],
                        $payment['metodo'],
                        "Pago Venta POS #" . $saleId
                    ]);
                }
            }

            $this->db->commit();
            return $saleId;

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function getAll()
    {
        $sql = "SELECT s.*, u.nombre as user_name, t.nombre as customer_name 
                FROM sales s 
                LEFT JOIN users u ON s.user_id = u.id 
                LEFT JOIN terceros t ON s.customer_id = t.id 
                ORDER BY s.created_at DESC";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id)
    {
        $sql = "SELECT s.*, u.nombre as user_name, t.nombre as customer_name 
                FROM sales s 
                LEFT JOIN users u ON s.user_id = u.id 
                LEFT JOIN terceros t ON s.customer_id = t.id 
                WHERE s.id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        $sale = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($sale) {
            $sale['items'] = $this->getItems($id);
            $sale['payments'] = $this->getPayments($id);
        }

        return $sale;
    }

    private function getItems($saleId)
    {
        $sql = "SELECT si.*, p.nombre as product_name, p.sku 
                FROM sale_items si 
                JOIN products p ON si.product_id = p.id 
                WHERE si.sale_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$saleId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    private function getPayments($saleId)
    {
        $sql = "SELECT * FROM sale_payments WHERE sale_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$saleId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
