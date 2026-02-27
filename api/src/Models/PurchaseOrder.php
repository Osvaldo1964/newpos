<?php
namespace App\Models;

use PDO;

class PurchaseOrder
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getAll($filters = [])
    {
        $sql = "SELECT o.*, t.nombre as tercero_nombre, u.nombre as user_name 
                FROM compras_ordenes o
                JOIN terceros t ON o.tercero_id = t.id
                JOIN users u ON o.user_id = u.id";

        $where = [];
        $params = [];

        if (isset($filters['estado'])) {
            $estados = explode(',', $filters['estado']);
            $placeholders = implode(',', array_fill(0, count($estados), '?'));
            $where[] = "o.estado IN ($placeholders)";
            foreach ($estados as $e) {
                $params[] = $e;
            }
        }

        if (isset($filters['tercero_id'])) {
            $where[] = "o.tercero_id = ?";
            $params[] = $filters['tercero_id'];
        }

        if (!empty($where)) {
            $sql .= " WHERE " . implode(" AND ", $where);
        }

        $sql .= " ORDER BY o.fecha DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id)
    {
        $sql = "SELECT o.*, t.nombre as tercero_nombre, u.nombre as user_name 
                FROM compras_ordenes o
                JOIN terceros t ON o.tercero_id = t.id
                JOIN users u ON o.user_id = u.id
                WHERE o.id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($order) {
            $order['items'] = $this->getItems($id);
        }

        return $order;
    }

    public function getItems($order_id)
    {
        $sql = "SELECT d.*, p.nombre as product_name, p.sku 
                FROM compras_ordenes_detalles d
                JOIN products p ON d.product_id = p.id
                WHERE d.orden_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$order_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data)
    {
        try {
            $this->db->beginTransaction();

            $sql = "INSERT INTO compras_ordenes (tercero_id, sede_id, user_id, fecha, total, observaciones, estado) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $data['tercero_id'],
                $data['sede_id'],
                $data['user_id'],
                $data['fecha'] ?? date('Y-m-d H:i:s'),
                $data['total'],
                $data['observaciones'] ?? '',
                $data['estado'] ?? 'PENDIENTE'
            ]);

            $order_id = $this->db->lastInsertId();

            foreach ($data['items'] as $item) {
                $sqlItem = "INSERT INTO compras_ordenes_detalles (orden_id, product_id, cantidad_pedida, precio_unitario) 
                            VALUES (?, ?, ?, ?)";
                $stmtItem = $this->db->prepare($sqlItem);
                $stmtItem->execute([
                    $order_id,
                    $item['product_id'],
                    $item['cantidad_pedida'],
                    $item['precio_unitario']
                ]);
            }

            $this->db->commit();
            return $order_id;
        } catch (\Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    public function update($id, $data)
    {
        try {
            $this->db->beginTransaction();

            // Check if editable
            $current = $this->getById($id);
            if (!$current || $current['estado'] === 'COMPLETADA') {
                throw new \Exception("No se puede editar una orden completada");
            }

            $sql = "UPDATE compras_ordenes SET tercero_id = ?, sede_id = ?, total = ?, observaciones = ? WHERE id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $data['tercero_id'],
                $data['sede_id'],
                $data['total'],
                $data['observaciones'] ?? '',
                $id
            ]);

            // Simple approach: delete old items and insert new ones
            // But we must preserve cantidad_recibida for items that remain
            $sqlDelete = "DELETE FROM compras_ordenes_detalles WHERE orden_id = ?";
            $stmtDelete = $this->db->prepare($sqlDelete);
            $stmtDelete->execute([$id]);

            foreach ($data['items'] as $item) {
                $sqlItem = "INSERT INTO compras_ordenes_detalles (orden_id, product_id, cantidad_pedida, cantidad_recibida, precio_unitario) 
                            VALUES (?, ?, ?, ?, ?)";
                $stmtItem = $this->db->prepare($sqlItem);
                $stmtItem->execute([
                    $id,
                    $item['product_id'],
                    $item['cantidad_pedida'],
                    $item['cantidad_recibida'] ?? 0,
                    $item['precio_unitario']
                ]);
            }

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    public function delete($id)
    {
        $current = $this->getById($id);
        if (!$current || $current['estado'] !== 'PENDIENTE') {
            return false; // Only pending orders without any receipt can be deleted
        }

        try {
            $this->db->beginTransaction();

            $this->db->prepare("DELETE FROM compras_ordenes_detalles WHERE orden_id = ?")->execute([$id]);
            $this->db->prepare("DELETE FROM compras_ordenes WHERE id = ?")->execute([$id]);

            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }

    public function updateStatus($id, $estado)
    {
        $sql = "UPDATE compras_ordenes SET estado = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$estado, $id]);
    }

    public function updateReceivedQuantities($order_id, $items)
    {
        $allCompleted = true;
        foreach ($items as $item) {
            // item should have product_id and cantidad_recibida (the increment)
            $sql = "UPDATE compras_ordenes_detalles 
                    SET cantidad_recibida = cantidad_recibida + ? 
                    WHERE orden_id = ? AND product_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$item['cantidad'], $order_id, $item['product_id']]);
        }

        // Check if now all items are completed
        $details = $this->getItems($order_id);
        $anyReceived = false;
        $fullyReceived = true;

        foreach ($details as $d) {
            if ($d['cantidad_recibida'] > 0)
                $anyReceived = true;
            if ($d['cantidad_recibida'] < $d['cantidad_pedida'])
                $fullyReceived = false;
        }

        $newStatus = 'PENDIENTE';
        if ($fullyReceived) {
            $newStatus = 'COMPLETADA';
        } elseif ($anyReceived) {
            $newStatus = 'PARCIAL';
        }

        $this->updateStatus($order_id, $newStatus);
    }
}
