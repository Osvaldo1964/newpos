<?php
namespace App\Models;

use PDO;

class CashSession
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getActiveSession($userId)
    {
        $sql = "SELECT cs.*, cr.nombre as register_name, s.nombre as sede_name 
                FROM cash_sessions cs
                JOIN cash_registers cr ON cs.register_id = cr.id
                JOIN sedes s ON cs.sede_id = s.id
                WHERE cs.user_id = ? AND cs.estado = 'ABIERTA'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function open($data)
    {
        $sql = "INSERT INTO cash_sessions (user_id, sede_id, register_id, monto_apertura, estado) 
                VALUES (?, ?, ?, ?, 'ABIERTA')";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $data['user_id'],
            $data['sede_id'],
            $data['register_id'],
            $data['monto_apertura']
        ]);
        return $this->db->lastInsertId();
    }

    public function close($id, $montoCierre)
    {
        $sql = "UPDATE cash_sessions SET monto_cierre = ?, estado = 'CERRADA', fecha_cierre = CURRENT_TIMESTAMP WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$montoCierre, $id]);
    }

    public function getSessionTotals($sessionId)
    {
        $sql = "SELECT 
                    SUM(CASE WHEN tipo = 'INGRESO' THEN monto ELSE 0 END) as total_ingresos,
                    SUM(CASE WHEN tipo IN ('GASTO', 'PAGO') THEN monto ELSE 0 END) as total_egresos
                FROM cash_movements 
                WHERE session_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sessionId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getAllSessions($sedeId = null)
    {
        $sql = "SELECT cs.*, u.nombre as user_name, cr.nombre as register_name, s.nombre as sede_name
                FROM cash_sessions cs
                JOIN users u ON cs.user_id = u.id
                JOIN cash_registers cr ON cs.register_id = cr.id
                JOIN sedes s ON cs.sede_id = s.id";

        if ($sedeId) {
            $sql .= " WHERE cs.sede_id = ?";
        }

        $sql .= " ORDER BY cs.fecha_apertura DESC";

        $stmt = $this->db->prepare($sql);
        if ($sedeId) {
            $stmt->execute([$sedeId]);
        } else {
            $stmt->execute();
        }
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
