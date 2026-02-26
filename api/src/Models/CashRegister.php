<?php
namespace App\Models;

use PDO;

class CashRegister
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getAll()
    {
        $sql = "SELECT cr.*, s.nombre as sede_nombre 
                FROM cash_registers cr 
                JOIN sedes s ON cr.sede_id = s.id 
                ORDER BY cr.nombre ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getAllWithStatus()
    {
        $sql = "SELECT cr.*, s.nombre as sede_nombre, 
                       cs.id as active_session_id, cs.user_id as session_user_id,
                       u.nombre as session_user_name, cs.monto_apertura, cs.fecha_apertura
                FROM cash_registers cr 
                JOIN sedes s ON cr.sede_id = s.id 
                LEFT JOIN cash_sessions cs ON cr.id = cs.register_id AND cs.estado = 'ABIERTA'
                LEFT JOIN users u ON cs.user_id = u.id
                ORDER BY cr.nombre ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data)
    {
        $sql = "INSERT INTO cash_registers (nombre, sede_id, estado) VALUES (?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $data['nombre'],
            $data['sede_id'],
            $data['estado'] ?? 'ACTIVA'
        ]);
        return $this->db->lastInsertId();
    }

    public function update($id, $data)
    {
        $sql = "UPDATE cash_registers SET nombre = ?, sede_id = ?, estado = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            $data['nombre'],
            $data['sede_id'],
            $data['estado'],
            $id
        ]);
    }

    public function delete($id)
    {
        // Check if there are sessions associated
        $sql = "SELECT COUNT(*) FROM cash_sessions WHERE register_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        if ($stmt->fetchColumn() > 0) {
            return false;
        }

        $sql = "DELETE FROM cash_registers WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$id]);
    }

    public function findBySede($sedeId)
    {
        $sql = "SELECT * FROM cash_registers WHERE sede_id = ? AND estado = 'ACTIVA'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sedeId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
