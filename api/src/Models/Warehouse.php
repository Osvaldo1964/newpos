<?php
namespace App\Models;

use PDO;

class Warehouse
{
    private $conn;
    private $table_name = "warehouses";

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function getAll()
    {
        $query = "SELECT w.*, s.nombre as sede_name 
                  FROM " . $this->table_name . " w
                  LEFT JOIN sedes s ON w.sede_id = s.id
                  ORDER BY w.nombre ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data)
    {
        $query = "INSERT INTO " . $this->table_name . " (nombre, sede_id) VALUES (:nombre, :sede_id)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre', $data['nombre']);
        $stmt->bindParam(':sede_id', $data['sede_id']);
        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function update($id, $data)
    {
        $query = "UPDATE " . $this->table_name . " 
                  SET nombre = :nombre, sede_id = :sede_id 
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre', $data['nombre']);
        $stmt->bindParam(':sede_id', $data['sede_id']);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    public function delete($id)
    {
        // Check if warehouse has stock before deleting
        $checkQuery = "SELECT COUNT(*) FROM inventory WHERE warehouse_id = :id AND stock_actual > 0";
        $checkStmt = $this->conn->prepare($checkQuery);
        $checkStmt->bindParam(':id', $id);
        $checkStmt->execute();
        if ($checkStmt->fetchColumn() > 0) {
            return "cannot_delete_has_stock";
        }

        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
}
