<?php
namespace App\Models;

use PDO;

class CashConcept
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getAll()
    {
        $sql = "SELECT * FROM cash_concepts ORDER BY tipo, nombre ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByType($tipo)
    {
        $sql = "SELECT * FROM cash_concepts WHERE tipo = ? ORDER BY nombre ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$tipo]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data)
    {
        $sql = "INSERT INTO cash_concepts (nombre, tipo) VALUES (?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $data['nombre'],
            $data['tipo']
        ]);
        return $this->db->lastInsertId();
    }

    public function update($id, $data)
    {
        $sql = "UPDATE cash_concepts SET nombre = ?, tipo = ? WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            $data['nombre'],
            $data['tipo'],
            $id
        ]);
    }

    public function delete($id)
    {
        // Check if used in movements
        $sql = "SELECT COUNT(*) FROM cash_movements WHERE concept_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        if ($stmt->fetchColumn() > 0) {
            return false;
        }

        $sql = "DELETE FROM cash_concepts WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$id]);
    }
}
