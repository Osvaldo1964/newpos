<?php
$host = 'localhost';
$db = 'pos_system';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE => PDO::ATTR_ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);

    // 1. Crear tabla sale_payments
    $sql = "CREATE TABLE IF NOT EXISTS sale_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        metodo VARCHAR(50) NOT NULL,
        monto DECIMAL(12, 2) NOT NULL,
        referencia VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (sale_id),
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    ) ENGINE=InnoDB";
    $pdo->exec($sql);
    echo "Tabla sale_payments creada o ya existe.\n";

    // 2. Agregar metodo_pago a cash_movements si no existe
    $result = $pdo->query("SHOW COLUMNS FROM cash_movements LIKE 'metodo_pago'");
    if ($result->rowCount() == 0) {
        $pdo->exec("ALTER TABLE cash_movements ADD COLUMN metodo_pago VARCHAR(50) DEFAULT 'EFECTIVO' AFTER monto");
        echo "Columna metodo_pago agregada a cash_movements.\n";
    } else {
        echo "Columna metodo_pago ya existe en cash_movements.\n";
    }

    echo "Base de datos actualizada exitosamente.\n";

} catch (\PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>