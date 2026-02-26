<?php
namespace App\Models;

use PDO;

class User
{
    private $conn;
    private $table_name = "users";

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function getAll()
    {
        $query = "SELECT u.id, u.nombre, u.email, u.status, u.created_at, r.nombre as role_name, s.nombre as sede_name, u.role_id, u.sede_id
                  FROM " . $this->table_name . " u
                  LEFT JOIN roles r ON u.role_id = r.id
                  LEFT JOIN sedes s ON u.sede_id = s.id
                  ORDER BY u.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data)
    {
        $query = "INSERT INTO " . $this->table_name . " 
                  (nombre, email, password, role_id, sede_id, status) 
                  VALUES (:nombre, :email, :password, :role_id, :sede_id, :status)";
        $stmt = $this->conn->prepare($query);

        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

        $stmt->bindParam(':nombre', $data['nombre']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->bindParam(':role_id', $data['role_id']);
        $stmt->bindParam(':sede_id', $data['sede_id']);
        $status = isset($data['status']) ? $data['status'] : 1;
        $stmt->bindParam(':status', $status);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function update($id, $data)
    {
        $updatePassword = !empty($data['password']);
        $query = "UPDATE " . $this->table_name . " 
                  SET nombre = :nombre, email = :email, role_id = :role_id, sede_id = :sede_id, status = :status";

        if ($updatePassword) {
            $query .= ", password = :password";
        }

        $query .= " WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre', $data['nombre']);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':role_id', $data['role_id']);
        $stmt->bindParam(':sede_id', $data['sede_id']);
        $stmt->bindParam(':status', $data['status']);
        $stmt->bindParam(':id', $id);

        if ($updatePassword) {
            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            $stmt->bindParam(':password', $hashedPassword);
        }

        return $stmt->execute();
    }

    public function delete($id)
    {
        // Don't delete the last admin or the admin logged in (handled in controller)
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    public function findByEmail($email)
    {
        $query = "SELECT u.*, r.nombre as role_name 
                  FROM " . $this->table_name . " u
                  JOIN roles r ON u.role_id = r.id
                  WHERE u.email = :email AND u.status = 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getPermissions($roleId)
    {
        $query = "SELECT m.slug as module, p.nombre as permission
                  FROM role_permissions rp
                  JOIN modules m ON rp.module_id = m.id
                  JOIN permissions p ON rp.permission_id = p.id
                  WHERE rp.role_id = :role_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':role_id', $roleId);
        $stmt->execute();

        $permissions = [];
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
            $permissions[$row['module']][] = $row['permission'];
        }
        return $permissions;
    }
}
