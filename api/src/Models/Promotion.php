<?php
namespace App\Models;

class Promotion
{
    private $conn;
    private $table = 'promotions';

    public function __construct($db)
    {
        $this->conn = $db;
    }

    /** Obtiene todas las promociones con sus targets */
    public function getAll()
    {
        $sql = "
            SELECT p.*,
                GROUP_CONCAT(
                    CASE WHEN pt.target_type = 'PRODUCT' THEN pt.target_id END
                ) AS product_ids,
                GROUP_CONCAT(
                    CASE WHEN pt.target_type = 'CATEGORY' THEN pt.target_id END
                ) AS category_ids,
                GROUP_CONCAT(
                    CASE WHEN pt.target_type = 'PRODUCT' THEN pr.nombre END
                    ORDER BY pr.nombre SEPARATOR ', '
                ) AS product_names,
                GROUP_CONCAT(
                    CASE WHEN pt.target_type = 'CATEGORY' THEN c.nombre END
                    ORDER BY c.nombre SEPARATOR ', '
                ) AS category_names
            FROM {$this->table} p
            LEFT JOIN promotion_targets pt ON pt.promotion_id = p.id
            LEFT JOIN products pr ON pr.id = pt.target_id AND pt.target_type = 'PRODUCT'
            LEFT JOIN categories c ON c.id = pt.target_id AND pt.target_type = 'CATEGORY'
            GROUP BY p.id
            ORDER BY p.id DESC
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Normalise CSV lists to arrays
        foreach ($rows as &$row) {
            $row['product_ids'] = $row['product_ids'] ? array_map('intval', explode(',', $row['product_ids'])) : [];
            $row['category_ids'] = $row['category_ids'] ? array_map('intval', explode(',', $row['category_ids'])) : [];
            $row['product_names'] = $row['product_names'] ? $row['product_names'] : '';
            $row['category_names'] = $row['category_names'] ? $row['category_names'] : '';
        }
        return $rows;
    }

    /**
     * Promotion active: status=1 AND fecha_inicio <= today AND (fecha_fin IS NULL OR fecha_fin >= today)
     * Returns each promotion with its targets expanded so the POS can match them.
     */
    public function getActive()
    {
        $today = date('Y-m-d');
        $sql = "
            SELECT p.*,
                GROUP_CONCAT(
                    CASE WHEN pt.target_type = 'PRODUCT' THEN pt.target_id END
                ) AS product_ids,
                GROUP_CONCAT(
                    CASE WHEN pt.target_type = 'CATEGORY' THEN pt.target_id END
                ) AS category_ids
            FROM {$this->table} p
            LEFT JOIN promotion_targets pt ON pt.promotion_id = p.id
            WHERE p.status = 1
              AND (p.fecha_inicio IS NULL OR p.fecha_inicio <= :today)
              AND (p.fecha_fin   IS NULL OR p.fecha_fin   >= :today2)
            GROUP BY p.id
            ORDER BY p.nombre
        ";
        $stmt = $this->conn->prepare($sql);
        $stmt->bindParam(':today', $today);
        $stmt->bindParam(':today2', $today);
        $stmt->execute();
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        foreach ($rows as &$row) {
            $row['product_ids'] = $row['product_ids'] ? array_map('intval', explode(',', $row['product_ids'])) : [];
            $row['category_ids'] = $row['category_ids'] ? array_map('intval', explode(',', $row['category_ids'])) : [];
        }
        return $rows;
    }

    /** Crea una promoción junto con sus targets en una transacción */
    public function create($data, $targets = [])
    {
        $this->conn->beginTransaction();
        try {
            $sql = "INSERT INTO {$this->table} (nombre, tipo, valor, fecha_inicio, fecha_fin, status)
                    VALUES (:nombre, :tipo, :valor, :fecha_inicio, :fecha_fin, :status)";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':nombre', $data['nombre']);
            $stmt->bindValue(':tipo', $data['tipo']);
            $stmt->bindValue(':valor', $data['valor']);
            $stmt->bindValue(':fecha_inicio', $data['fecha_inicio'] ?? null);
            $stmt->bindValue(':fecha_fin', $data['fecha_fin'] ?? null);
            $stmt->bindValue(':status', $data['status'] ?? 1);
            $stmt->execute();

            $id = $this->conn->lastInsertId();
            $this->saveTargets($id, $targets);

            $this->conn->commit();
            return $id;
        } catch (\Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    /** Actualiza la promoción y reemplaza sus targets */
    public function update($id, $data, $targets = [])
    {
        $this->conn->beginTransaction();
        try {
            $sql = "UPDATE {$this->table}
                    SET nombre=:nombre, tipo=:tipo, valor=:valor,
                        fecha_inicio=:fecha_inicio, fecha_fin=:fecha_fin, status=:status
                    WHERE id=:id";
            $stmt = $this->conn->prepare($sql);
            $stmt->bindValue(':nombre', $data['nombre']);
            $stmt->bindValue(':tipo', $data['tipo']);
            $stmt->bindValue(':valor', $data['valor']);
            $stmt->bindValue(':fecha_inicio', $data['fecha_inicio'] ?? null);
            $stmt->bindValue(':fecha_fin', $data['fecha_fin'] ?? null);
            $stmt->bindValue(':status', $data['status'] ?? 1);
            $stmt->bindValue(':id', $id);
            $stmt->execute();

            // Replace targets
            $this->conn->prepare("DELETE FROM promotion_targets WHERE promotion_id=?")->execute([$id]);
            $this->saveTargets($id, $targets);

            $this->conn->commit();
            return true;
        } catch (\Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function delete($id)
    {
        // ON DELETE CASCADE handles promotion_targets
        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id=?");
        return $stmt->execute([$id]);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private function saveTargets($promotionId, $targets)
    {
        if (empty($targets))
            return;
        $sql = "INSERT IGNORE INTO promotion_targets (promotion_id, target_type, target_id) VALUES (?,?,?)";
        $stmt = $this->conn->prepare($sql);
        foreach ($targets as $t) {
            $stmt->execute([$promotionId, $t['type'], $t['id']]);
        }
    }
}
