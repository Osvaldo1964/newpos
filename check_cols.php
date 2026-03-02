<?php
require __DIR__ . '/api/vendor/autoload.php';
use App\Config\Database;

$db = (new Database())->getConnection();

$stmt = $db->query("SHOW COLUMNS FROM online_orders");
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "COLUMNS FOR online_orders:\n";
foreach ($cols as $col) {
    echo "{$col['Field']} | {$col['Type']} | {$col['Null']} | {$col['Key']} | {$col['Default']}\n";
}
?>