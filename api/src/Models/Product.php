<?php
namespace App\Models;

use PDO;

class Product
{
    private $conn;
    private $table_name = "products";

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function getAll()
    {
        $query = "SELECT p.*, c.nombre as category_name, 
                  (SELECT url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
                  FROM " . $this->table_name . " p 
                  LEFT JOIN categories c ON p.category_id = c.id 
                  ORDER BY p.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id)
    {
        $query = "SELECT p.*, c.nombre as category_name FROM " . $this->table_name . " p 
                  LEFT JOIN categories c ON p.category_id = c.id 
                  WHERE p.id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($product) {
            $product['images'] = $this->getProductImages($id);
        }

        return $product;
    }

    public function create($data)
    {
        $query = "INSERT INTO " . $this->table_name . " 
                  (sku, nombre, descripcion, precio_base, iva, category_id) 
                  VALUES (:sku, :nombre, :descripcion, :precio_base, :iva, :category_id)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':sku', $data['sku']);
        $stmt->bindParam(':nombre', $data['nombre']);
        $stmt->bindParam(':descripcion', $data['descripcion']);
        $stmt->bindParam(':precio_base', $data['precio_base']);
        $stmt->bindParam(':iva', $data['iva']);
        $stmt->bindParam(':category_id', $data['category_id']);

        if ($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    public function update($id, $data)
    {
        $query = "UPDATE " . $this->table_name . " 
                  SET sku = :sku, nombre = :nombre, descripcion = :descripcion, 
                      precio_base = :precio_base, iva = :iva, category_id = :category_id 
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':sku', $data['sku']);
        $stmt->bindParam(':nombre', $data['nombre']);
        $stmt->bindParam(':descripcion', $data['descripcion']);
        $stmt->bindParam(':precio_base', $data['precio_base']);
        $stmt->bindParam(':iva', $data['iva']);
        $stmt->bindParam(':category_id', $data['category_id']);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    public function delete($id)
    {
        $query = "DELETE FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }

    // --- Image Methods ---
    public function addImage($productId, $url, $isMain = 0)
    {
        $query = "INSERT INTO product_images (product_id, url, is_main) VALUES (:product_id, :url, :is_main)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':product_id', $productId);
        $stmt->bindParam(':url', $url);
        $stmt->bindParam(':is_main', $isMain);
        return $stmt->execute();
    }

    public function getProductImages($productId)
    {
        $query = "SELECT * FROM product_images WHERE product_id = :product_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':product_id', $productId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function deleteImage($imageId)
    {
        $query = "DELETE FROM product_images WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $imageId);
        return $stmt->execute();
    }
}
