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
        $sql = "INSERT INTO cash_movements (session_id, concept_id, tipo, monto, descripcion) VALUES (?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $data['session_id'],
            $data['concept_id'] ?? null,
            $data['tipo'], // INGRESO, GASTO, PAGO
            $data['monto'],
            $data['descripcion']
        ]);
        return $this->db->lastInsertId();
    }

    public function getBySession($sessionId)
    {
        $sql = "SELECT m.*, c.nombre as concept_name 
                FROM cash_movements m 
                LEFT JOIN cash_concepts c ON m.concept_id = c.id 
                WHERE m.session_id = ? 
                ORDER BY m.created_at DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$sessionId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function update($id, $data)
    {
        $sql = "UPDATE cash_movements SET concept_id = ?, monto = ?, descripcion = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            $data['concept_id'] ?? null,
            $data['monto'],
            $data['descripcion'],
            $id
        ]);
    }

    public function delete($id)
    {
        $sql = "DELETE FROM cash_movements WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$id]);
    }
}
