<?php
namespace App\Models;

use PDO;

class CashMovement
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function create($data)
    {
        $sql = "INSERT INTO cash_movements (session_id, tipo, monto, descripcion) VALUES (?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $data['session_id'],
            $data['tipo'], // INGRESO, GASTO, PAGO
            $data['monto'],
            $data['descripcion']
        ]);
        return $this->db->lastInsertId();
    }

    public function getBySession($sessionId)
    {
        $sql = "SELECT * FROM cash_movements WHERE session_id = ? ORDER BY created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sessionId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
