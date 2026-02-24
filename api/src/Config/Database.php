<?php
namespace App\Config;

use PDO;
use PDOException;

class Database
{
    private $host = "localhost";
    private $db_name = "pos_system";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection()
    {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
        } catch (PDOException $exception) {
            // No hacer echo aquí para no romper los headers HTTP/CORS
            error_log("Error de conexión: " . $exception->getMessage());
        }
        return $this->conn;
    }
}
