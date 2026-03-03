<?php
// Quick connection test — delete this file after use
$host = "localhost";
$db_name = "pos_system";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->exec("set names utf8");
    $stmt = $conn->query("SELECT COUNT(*) as total FROM users");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    echo json_encode(['status' => 'ok', 'users' => $row['total'], 'host' => $host, 'db' => $db_name]);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage(), 'code' => $e->getCode()]);
}
?>