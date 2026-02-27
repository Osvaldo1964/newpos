<?php
namespace App\Models;

use PDO;

class WarehouseEntry
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getAll()
    {
        $sql = "SELECT e.*, t.nombre as tercero_nombre, w.nombre as warehouse_name, u.nombre as user_name 
                FROM compras_entradas e
                JOIN terceros t ON e.tercero_id = t.id
                JOIN warehouses w ON e.warehouse_id = w.id
                JOIN users u ON e.user_id = u.id
                ORDER BY e.fecha DESC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id)
    {
        $sql = "SELECT e.*, t.nombre as tercero_nombre, w.nombre as warehouse_name, u.nombre as user_name 
                FROM compras_entradas e
                JOIN terceros t ON e.tercero_id = t.id
                JOIN warehouses w ON e.warehouse_id = w.id
                JOIN users u ON e.user_id = u.id
                WHERE e.id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        $entry = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($entry) {
            $entry['items'] = $this->getItems($id);
        }

        return $entry;
    }

    public function getItems($entrada_id)
    {
        $sql = "SELECT d.*, p.nombre as product_name, p.sku 
                FROM compras_entradas_detalles d
                JOIN products p ON d.product_id = p.id
                WHERE d.entrada_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$entrada_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data)
    {
        try {
            $this->db->beginTransaction();

            $sql = "INSERT INTO compras_entradas (orden_id, tercero_id, warehouse_id, num_remision, fecha, observaciones, user_id) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $data['orden_id'] ?? null,
                $data['tercero_id'],
                $data['warehouse_id'],
                $data['num_remision'] ?? '',
                $data['fecha'] ?? date('Y-m-d H:i:s'),
                $data['observaciones'] ?? '',
                $data['user_id']
            ]);

            $entrada_id = $this->db->lastInsertId();

            foreach ($data['items'] as $item) {
                // 1. Insert detail
                $sqlItem = "INSERT INTO compras_entradas_detalles (entrada_id, product_id, cantidad) 
                            VALUES (?, ?, ?)";
                $stmtItem = $this->db->prepare($sqlItem);
                $stmtItem->execute([
                    $entrada_id,
                    $item['product_id'],
                    $item['cantidad']
                ]);

                // 2. Update Stock in Inventory
                $sqlStock = "INSERT INTO inventory (product_id, warehouse_id, stock_actual) 
                             VALUES (?, ?, ?) 
                             ON DUPLICATE KEY UPDATE stock_actual = stock_actual + ?";
                $stmtStock = $this->db->prepare($sqlStock);
                $stmtStock->execute([
                    $item['product_id'],
                    $data['warehouse_id'],
                    $item['cantidad'],
                    $item['cantidad']
                ]);

                // 3. Register Inventory Movement
                $sqlMov = "INSERT INTO inventory_movements (tipo, product_id, to_warehouse_id, cantidad, user_id, observaciones) 
                           VALUES ('COMPRA', ?, ?, ?, ?, ?)";
                $stmtMov = $this->db->prepare($sqlMov);
                $stmtMov->execute([
                    $item['product_id'],
                    $data['warehouse_id'],
                    $item['cantidad'],
                    $data['user_id'],
                    "Entrada por compra #" . $entrada_id . ($data['num_remision'] ? " - Remisión: " . $data['num_remision'] : "")
                ]);
            }

            // 4. Update Purchase Order if linked
            if (!empty($data['orden_id'])) {
                $poModel = new PurchaseOrder($this->db);
                $poModel->updateReceivedQuantities($data['orden_id'], $data['items']);
            }

            $this->db->commit();
            return $entrada_id;
        } catch (\Exception $e) {
            $this->db->rollBack();
            error_log("Error in WarehouseEntry::create: " . $e->getMessage());
            return false;
        }
    }

    public function update($id, $data)
    {
        try {
            $this->db->beginTransaction();

            $oldEntry = $this->getById($id);
            if (!$oldEntry) {
                throw new \Exception("Entrada no encontrada");
            }

            // Update Header
            $sql = "UPDATE compras_entradas SET num_remision = ?, fecha = ?, observaciones = ?, warehouse_id = ?, tercero_id = ? 
                    WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $data['num_remision'] ?? '',
                $data['fecha'] ?? date('Y-m-d H:i:s'),
                $data['observaciones'] ?? '',
                $data['warehouse_id'],
                $data['tercero_id'],
                $id
            ]);

            // For items, we'll handle each one to calculate differences
            foreach ($data['items'] as $newItem) {
                // Find old item to compare
                $oldItem = null;
                foreach ($oldEntry['items'] as $oi) {
                    if ($oi['product_id'] == $newItem['product_id']) {
                        $oldItem = $oi;
                        break;
                    }
                }

                $oldQty = $oldItem ? $oldItem['cantidad'] : 0;
                $newQty = $newItem['cantidad'];
                $diff = $newQty - $oldQty;

                if ($diff != 0) {
                    // 1. Adjust Stock
                    $sqlStock = "UPDATE inventory SET stock_actual = stock_actual + ? 
                                 WHERE product_id = ? AND warehouse_id = ?";
                    $stmtStock = $this->db->prepare($sqlStock);
                    $stmtStock->execute([$diff, $newItem['product_id'], $data['warehouse_id']]);

                    // 2. Adjust PO if linked
                    if (!empty($oldEntry['orden_id'])) {
                        $sqlPO = "UPDATE compras_ordenes_detalles 
                                 SET cantidad_recibida = cantidad_recibida + ? 
                                 WHERE orden_id = ? AND product_id = ?";
                        $stmtPO = $this->db->prepare($sqlPO);
                        $stmtPO->execute([$diff, $oldEntry['orden_id'], $newItem['product_id']]);
                    }

                    // 3. Register Adjustment Movement
                    $sqlMov = "INSERT INTO inventory_movements (tipo, product_id, to_warehouse_id, cantidad, user_id, observaciones) 
                               VALUES ('AJUSTE', ?, ?, ?, ?, ?)";
                    $stmtMov = $this->db->prepare($sqlMov);
                    $stmtMov->execute([
                        $newItem['product_id'],
                        $data['warehouse_id'],
                        $diff,
                        $data['user_id'] ?? $oldEntry['user_id'],
                        "Ajuste por edición de entrada #" . $id
                    ]);
                }
            }

            // Simple approach for detail table: clear and re-insert (already adjusted stock above)
            $this->db->prepare("DELETE FROM compras_entradas_detalles WHERE entrada_id = ?")->execute([$id]);
            foreach ($data['items'] as $item) {
                $sqlItem = "INSERT INTO compras_entradas_detalles (entrada_id, product_id, cantidad) 
                            VALUES (?, ?, ?)";
                $stmtItem = $this->db->prepare($sqlItem);
                $stmtItem->execute([$id, $item['product_id'], $item['cantidad']]);
            }

            // 4. Final recalculate PO status if linked
            if (!empty($oldEntry['orden_id'])) {
                $poModel = new PurchaseOrder($this->db);
                $poItems = $poModel->getItems($oldEntry['orden_id']);
                $anyReceived = false;
                $fullyReceived = true;
                foreach ($poItems as $pi) {
                    if ($pi['cantidad_recibida'] > 0)
                        $anyReceived = true;
                    if ($pi['cantidad_recibida'] < $pi['cantidad_pedida'])
                        $fullyReceived = false;
                }
                $newStatus = $fullyReceived ? 'COMPLETADA' : ($anyReceived ? 'PARCIAL' : 'PENDIENTE');
                $poModel->updateStatus($oldEntry['orden_id'], $newStatus);
            }

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            error_log("Error in WarehouseEntry::update: " . $e->getMessage());
            return false;
        }
    }

    public function delete($id)
    {
        try {
            $this->db->beginTransaction();

            $entry = $this->getById($id);
            if (!$entry) {
                throw new \Exception("Entrada no encontrada");
            }

            foreach ($entry['items'] as $item) {
                // 1. Revert Stock
                $sqlStock = "UPDATE inventory SET stock_actual = stock_actual - ? 
                             WHERE product_id = ? AND warehouse_id = ?";
                $stmtStock = $this->db->prepare($sqlStock);
                $stmtStock->execute([$item['cantidad'], $item['product_id'], $entry['warehouse_id']]);

                // 2. Register Reversal Movement
                $sqlMov = "INSERT INTO inventory_movements (tipo, product_id, from_warehouse_id, cantidad, user_id, observaciones) 
                           VALUES ('AJUSTE', ?, ?, ?, ?, ?)";
                $stmtMov = $this->db->prepare($sqlMov);
                $stmtMov->execute([
                    $item['product_id'],
                    $entry['warehouse_id'],
                    $item['cantidad'],
                    $entry['user_id'],
                    "Reversión de entrada #" . $id
                ]);
            }

            // 3. Update Purchase Order if linked
            if (!empty($entry['orden_id'])) {
                foreach ($entry['items'] as $item) {
                    $sqlPO = "UPDATE compras_ordenes_detalles 
                             SET cantidad_recibida = cantidad_recibida - ? 
                             WHERE orden_id = ? AND product_id = ?";
                    $stmtPO = $this->db->prepare($sqlPO);
                    $stmtPO->execute([$item['cantidad'], $entry['orden_id'], $item['product_id']]);
                }

                $poModel = new PurchaseOrder($this->db);
                $poItems = $poModel->getItems($entry['orden_id']);
                $anyReceived = false;
                $fullyReceived = true;
                foreach ($poItems as $pi) {
                    if ($pi['cantidad_recibida'] > 0)
                        $anyReceived = true;
                    if ($pi['cantidad_recibida'] < $pi['cantidad_pedida'])
                        $fullyReceived = false;
                }

                $newStatus = 'PENDIENTE';
                if ($fullyReceived)
                    $newStatus = 'COMPLETADA';
                elseif ($anyReceived)
                    $newStatus = 'PARCIAL';

                $poModel->updateStatus($entry['orden_id'], $newStatus);
            }

            $this->db->prepare("DELETE FROM compras_entradas_detalles WHERE entrada_id = ?")->execute([$id]);
            $this->db->prepare("DELETE FROM compras_entradas WHERE id = ?")->execute([$id]);

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
}
