<?php
require __DIR__ . '/api/vendor/autoload.php';
use App\Config\Database;

$db = (new Database())->getConnection();

$data = [];

$data['orders'] = $db->query("SELECT * FROM online_orders ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
$data['sales'] = $db->query("SELECT * FROM sales ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
$data['items'] = $db->query("SELECT * FROM online_order_items WHERE order_id = 1")->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($data, JSON_PRETTY_PRINT);
?>