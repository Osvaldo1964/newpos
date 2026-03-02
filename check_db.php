<?php
require __DIR__ . '/api/vendor/autoload.php';
use App\Config\Database;

$db = (new Database())->getConnection();

echo "--- Online Orders ---\n";
$stmt = $db->query("SELECT id, customer_name, estado, sale_id, total FROM online_orders ORDER BY id DESC LIMIT 5");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    print_r($row);
}

echo "\n--- Recent Sales ---\n";
$stmt = $db->query("SELECT id, total, created_at FROM sales ORDER BY id DESC LIMIT 5");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    print_r($row);
}

echo "\n--- Inventory Check (Product 1) ---\n";
$stmt = $db->query("SELECT * FROM inventory WHERE product_id = 1");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    print_r($row);
}
?>