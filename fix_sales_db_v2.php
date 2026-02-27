<?php
try {
    $pdo = new PDO("mysql:host=localhost;dbname=pos_system;charset=utf8mb4", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ATTR_ERRMODE_EXCEPTION);

    $pdo->exec("CREATE TABLE IF NOT EXISTS sale_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        metodo VARCHAR(50) NOT NULL,
        monto DECIMAL(12, 2) NOT NULL,
        referencia VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB");

    try {
        $pdo->exec("ALTER TABLE cash_movements ADD COLUMN metodo_pago VARCHAR(50) DEFAULT 'EFECTIVO' AFTER monto");
    } catch (Exception $e) {
        // Ignorar si ya existe
    }

    echo "DB Updated Successfully";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>