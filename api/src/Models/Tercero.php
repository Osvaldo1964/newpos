<?php
namespace App\Models;

use PDO;

class Tercero
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getAll()
    {
        $sql = "SELECT * FROM terceros ORDER BY nombre ASC";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getById($id)
    {
        $sql = "SELECT * FROM terceros WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($data)
    {
        $sql = "INSERT INTO terceros (documento, tipo_documento, tipo_persona, nombre, razon_social, email, direccion, telefono, es_cliente, es_proveedor) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $data['documento'],
            $data['tipo_documento'],
            $data['tipo_persona'],
            $data['nombre'],
            $data['razon_social'] ?? null,
            $data['email'] ?? null,
            $data['direccion'] ?? null,
            $data['telefono'] ?? null,
            $data['es_cliente'] ? 1 : 0,
            $data['es_proveedor'] ? 1 : 0
        ]);
        return $this->db->lastInsertId();
    }

    public function update($id, $data)
    {
        $sql = "UPDATE terceros SET 
                documento = ?, 
                tipo_documento = ?, 
                tipo_persona = ?, 
                nombre = ?, 
                razon_social = ?, 
                email = ?, 
                direccion = ?, 
                telefono = ?, 
                es_cliente = ?, 
                es_proveedor = ? 
                WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            $data['documento'],
            $data['tipo_documento'],
            $data['tipo_persona'],
            $data['nombre'],
            $data['razon_social'] ?? null,
            $data['email'] ?? null,
            $data['direccion'] ?? null,
            $data['telefono'] ?? null,
            $data['es_cliente'] ? 1 : 0,
            $data['es_proveedor'] ? 1 : 0,
            $id
        ]);
    }

    public function delete($id)
    {
        // Revisar si tiene ventas o compras asociadas antes de borrar (en el futuro)
        $sql = "DELETE FROM terceros WHERE id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$id]);
    }

    public function searchByDocumento($doc)
    {
        $sql = "SELECT * FROM terceros WHERE documento = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$doc]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
