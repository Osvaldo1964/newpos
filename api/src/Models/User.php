<?php
namespace App\Models;

use PDO;

class User
{
    private $conn;
    private $table_name = "users";

    public $id;
    public $nombre;
    public $email;
    public $password;
    public $role_id;
    public $sede_id;

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function findByEmail($email)
    {
        $query = "SELECT u.id, u.nombre, u.email, u.password, u.role_id, u.sede_id, r.nombre as role_name 
                  FROM " . $this->table_name . " u
                  LEFT JOIN roles r ON u.role_id = r.id
                  WHERE u.email = ? LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $email);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getPermissions($role_id)
    {
        $query = "SELECT m.slug as module, p.nombre as permission
                  FROM role_permissions rp
                  JOIN modules m ON rp.module_id = m.id
                  JOIN permissions p ON rp.permission_id = p.id
                  WHERE rp.role_id = ?";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $role_id);
        $stmt->execute();

        $permissions = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $permissions[$row['module']][] = $row['permission'];
        }
        return $permissions;
    }
}
