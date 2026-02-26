<?php
namespace App\Models;

use PDO;

class Role
{
    private $conn;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function getAll()
    {
        $query = "SELECT * FROM roles ORDER BY id ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getModules()
    {
        $query = "SELECT * FROM modules ORDER BY id ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPermissions()
    {
        $query = "SELECT * FROM permissions ORDER BY id ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getRolePermissions($roleId)
    {
        $query = "SELECT module_id, permission_id FROM role_permissions WHERE role_id = :role_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':role_id', $roleId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updatePermissions($roleId, $permissionsData)
    {
        try {
            $this->conn->beginTransaction();

            // Clear existing permissions for this role
            $deleteQuery = "DELETE FROM role_permissions WHERE role_id = :role_id";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->bindParam(':role_id', $roleId);
            $deleteStmt->execute();

            // Insert new permissions
            // permissionsData format: [['module_id' => 1, 'permission_id' => 1], ...]
            $insertQuery = "INSERT INTO role_permissions (role_id, module_id, permission_id) 
                            VALUES (:role_id, :module_id, :permission_id)";
            $insertStmt = $this->conn->prepare($insertQuery);

            foreach ($permissionsData as $perm) {
                $insertStmt->bindParam(':role_id', $roleId);
                $insertStmt->bindParam(':module_id', $perm['module_id']);
                $insertStmt->bindParam(':permission_id', $perm['permission_id']);
                $insertStmt->execute();
            }

            $this->conn->commit();
            return true;
        } catch (\Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }
}
