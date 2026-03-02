<?php
require __DIR__ . '/api/vendor/autoload.php';
use App\Config\Database;

$db = (new Database())->getConnection();

function dumpTable($db, $table, $id = null)
{
    $where = $id ? "WHERE id = $id" : "ORDER BY id DESC LIMIT 5";
    $stmt = $db->query("SELECT * FROM $table $where");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

$data = [
    'online_orders' => dumpTable($db, 'online_orders'),
    'sales' => dumpTable($db, 'sales'),
    'sale_items' => $db->query("SELECT * FROM sale_items ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC),
    'sale_payments' => $db->query("SELECT * FROM sale_payments ORDER BY id DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC),
];

file_put_contents('c:/xampp/htdocs/newpos/db_dump.json', json_encode($data, JSON_PRETTY_PRINT));
echo "Dump saved to db_dump.json\n";
?>