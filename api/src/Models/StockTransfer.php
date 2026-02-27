<?php
namespace App\Models;

use PDO;

class StockTransfer
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getAll()
    {
        $sql = "SELECT t.*, w1.nombre as from_warehouse_name, w2.nombre as to_warehouse_name, u.nombre as user_name 
                FROM stock_transfers t
                JOIN warehouses w1 ON t.from_warehouse_id = w1.id
                JOIN warehouses w2 ON t.to_warehouse_id = w2.id
                JOIN users u ON t.user_id = u.id
                ORDER BY t.fecha DESC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id)
    {
        $sql = "SELECT t.*, w1.nombre as from_warehouse_name, w2.nombre as to_warehouse_name, u.nombre as user_name 
                FROM stock_transfers t
                JOIN warehouses w1 ON t.from_warehouse_id = w1.id
                JOIN warehouses w2 ON t.to_warehouse_id = w2.id
                JOIN users u ON t.user_id = u.id
                WHERE t.id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        $transfer = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($transfer) {
            $transfer['items'] = $this->getItems($id);
        }

        return $transfer;
    }

    public function getItems($transfer_id)
    {
        $sql = "SELECT d.*, p.nombre as product_name, p.sku 
                FROM stock_transfer_items d
                JOIN products p ON d.product_id = p.id
                WHERE d.transfer_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$transfer_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data)
    {
        try {
            $this->db->beginTransaction();

            $sql = "INSERT INTO stock_transfers (from_warehouse_id, to_warehouse_id, fecha, observaciones, user_id) 
                    VALUES (?, ?, ?, ?, ?)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $data['from_warehouse_id'],
                $data['to_warehouse_id'],
                $data['fecha'] ?? date('Y-m-d H:i:s'),
                $data['observaciones'] ?? '',
                $data['user_id']
            ]);

            $transfer_id = $this->db->lastInsertId();

            foreach ($data['items'] as $item) {
                // 1. Check stock in source
                $sqlCheck = "SELECT stock_actual FROM inventory WHERE product_id = ? AND warehouse_id = ?";
                $stmtCheck = $this->db->prepare($sqlCheck);
                $stmtCheck->execute([$item['product_id'], $data['from_warehouse_id']]);
                $currentStock = $stmtCheck->fetchColumn() ?: 0;

                if ($currentStock < $item['cantidad']) {
                    $prodName = $item['nombre'] ?? 'Producto ID: ' . $item['product_id'];
                    throw new \Exception("Stock insuficiente en bodega origen para el producto: " . $prodName);
                }

                // 2. Insert detail
                $sqlItem = "INSERT INTO stock_transfer_items (transfer_id, product_id, cantidad) 
                            VALUES (?, ?, ?)";
                $stmtItem = $this->db->prepare($sqlItem);
                $stmtItem->execute([
                    $transfer_id,
                    $item['product_id'],
                    $item['cantidad']
                ]);

                // 3. Subtract from source
                $sqlSub = "UPDATE inventory SET stock_actual = stock_actual - ? 
                           WHERE product_id = ? AND warehouse_id = ?";
                $stmtSub = $this->db->prepare($sqlSub);
                $stmtSub->execute([$item['cantidad'], $item['product_id'], $data['from_warehouse_id']]);

                // 4. Add to destination
                $sqlAdd = "INSERT INTO inventory (product_id, warehouse_id, stock_actual) 
                           VALUES (?, ?, ?) 
                           ON DUPLICATE KEY UPDATE stock_actual = stock_actual + ?";
                $stmtAdd = $this->db->prepare($sqlAdd);
                $stmtAdd->execute([
                    $item['product_id'],
                    $data['to_warehouse_id'],
                    $item['cantidad'],
                    $item['cantidad']
                ]);

                // 5. Register Movement (double entry for audit?) 
                // Better one record linked to from/to
                $sqlMov = "INSERT INTO inventory_movements (tipo, product_id, from_warehouse_id, to_warehouse_id, cantidad, user_id, observaciones) 
                           VALUES ('TRASLADO', ?, ?, ?, ?, ?, ?)";
                $stmtMov = $this->db->prepare($sqlMov);
                $stmtMov->execute([
                    $item['product_id'],
                    $data['from_warehouse_id'],
                    $data['to_warehouse_id'],
                    $item['cantidad'],
                    $data['user_id'],
                    "Traslado #" . $transfer_id . " - " . ($data['observaciones'] ?? '')
                ]);
            }

            $this->db->commit();
            return $transfer_id;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function update($id, $data)
    {
        try {
            $this->db->beginTransaction();

            // 1. Get old data to revert
            $oldDetails = $this->getById($id);
            if (!$oldDetails) throw new \Exception("Traslado no encontrado");

            // 2. Revert old items stock
            foreach ($oldDetails['items'] as $item) {
                // Return to source
                $sqlAdd = "UPDATE inventory SET stock_actual = stock_actual + ? 
                           WHERE product_id = ? AND warehouse_id = ?";
                $stmtAdd = $this->db->prepare($sqlAdd);
                $stmtAdd->execute([$item['cantidad'], $item['product_id'], $oldDetails['from_warehouse_id']]);

                // Subtract from destination
                $sqlSub = "UPDATE inventory SET stock_actual = stock_actual - ? 
                           WHERE product_id = ? AND warehouse_id = ?";
                $stmtSub = $this->db->prepare($sqlSub);
                $stmtSub->execute([$item['cantidad'], $item['product_id'], $oldDetails['to_warehouse_id']]);
            }

            // 3. Delete old items
            $sqlDel = "DELETE FROM stock_transfer_items WHERE transfer_id = ?";
            $stmtDel = $this->db->prepare($sqlDel);
            $stmtDel->execute([$id]);

            // 4. Update header
            $sqlUpd = "UPDATE stock_transfers SET from_warehouse_id = ?, to_warehouse_id = ?, observaciones = ? 
                       WHERE id = ?";
            $stmtUpd = $this->db->prepare($sqlUpd);
            $stmtUpd->execute([
                $data['from_warehouse_id'],
                $data['to_warehouse_id'],
                $data['observaciones'] ?? '',
                $id
            ]);

            // 5. Apply new items (copy logic from create)
            foreach ($data['items'] as $item) {
                // Check stock in new source
                $sqlCheck = "SELECT stock_actual FROM inventory WHERE product_id = ? AND warehouse_id = ?";
                $stmtCheck = $this->db->prepare($sqlCheck);
                $stmtCheck->execute([$item['product_id'], $data['from_warehouse_id']]);
                $currentStock = $stmtCheck->fetchColumn() ?: 0;

                if ($currentStock < $item['cantidad']) {
                    $prodName = $item['nombre'] ?? 'Producto ID: ' . $item['product_id'];
                    throw new \Exception("Stock insuficiente en bodega origen para el producto: " . $prodName);
                }

                // Insert detail
                $sqlItem = "INSERT INTO stock_transfer_items (transfer_id, product_id, cantidad) 
                            VALUES (?, ?, ?)";
                $stmtItem = $this->db->prepare($sqlItem);
                $stmtItem->execute([$id, $item['product_id'], $item['cantidad']]);

                // Subtract from source
                $sqlSub = "UPDATE inventory SET stock_actual = stock_actual - ? 
                           WHERE product_id = ? AND warehouse_id = ?";
                $stmtSub = $this->db->prepare($sqlSub);
                $stmtSub->execute([$item['cantidad'], $item['product_id'], $data['from_warehouse_id']]);

                // Add to destination
                $sqlAdd = "INSERT INTO inventory (product_id, warehouse_id, stock_actual) 
                           VALUES (?, ?, ?) 
                           ON DUPLICATE KEY UPDATE stock_actual = stock_actual + ?";
                $stmtAdd = $this->db->prepare($sqlAdd);
                $stmtAdd->execute([
                    $item['product_id'],
                    $data['to_warehouse_id'],
                    $item['cantidad'],
                    $item['cantidad']
                ]);

                // Register Movement
                $sqlMov = "INSERT INTO inventory_movements (tipo, product_id, from_warehouse_id, to_warehouse_id, cantidad, user_id, observaciones) 
                           VALUES ('TRASLADO', ?, ?, ?, ?, ?, ?)";
                $stmtMov = $this->db->prepare($sqlMov);
                $stmtMov->execute([
                    $item['product_id'],
                    $data['from_warehouse_id'],
                    $data['to_warehouse_id'],
                    $item['cantidad'],
                    $data['user_id'] ?? $oldDetails['user_id'],
                    "Traslado Editado #" . $id . " - " . ($data['observaciones'] ?? '')
                ]);
            }

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
