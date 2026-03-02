<?php
namespace App\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class StoreConfigController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function get(Request $request, Response $response)
    {
        $stmt = $this->db->query("SELECT * FROM store_config WHERE id = 1");
        $config = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$config) {
            $this->db->exec("INSERT INTO store_config (id, nombre) VALUES (1, 'Mi Tienda')");
            $stmt = $this->db->query("SELECT * FROM store_config WHERE id = 1");
            $config = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        $response->getBody()->write(json_encode($config));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function update(Request $request, Response $response)
    {
        $data = json_decode($request->getBody(), true);

        $fields = [
            'nombre',
            'slogan',
            'logo_url',
            'direccion',
            'telefono',
            'email',
            'nit',
            'ciudad',
            'google_client_id',
            'wompi_public_key',
            'payu_merchant_id',
            'payu_account_id',
            'payu_api_key',
            'payu_test',
            'mercadopago_public_key'
        ];

        $sets = [];
        $params = [];
        foreach ($fields as $f) {
            if (array_key_exists($f, $data)) {
                $sets[] = "$f = :$f";
                $params[":$f"] = $data[$f];
            }
        }

        if (empty($sets)) {
            $response->getBody()->write(json_encode(['error' => 'No data to update']));
            return $response->withStatus(400);
        }

        $sql = "UPDATE store_config SET " . implode(', ', $sets) . " WHERE id = 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $response->getBody()->write(json_encode(['success' => true]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function uploadLogo(Request $request, Response $response)
    {
        $uploadDir = __DIR__ . '/../../public/uploads/store/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $files = $request->getUploadedFiles();
        if (empty($files['logo'])) {
            $response->getBody()->write(json_encode(['error' => 'No file uploaded']));
            return $response->withStatus(400);
        }

        $file = $files['logo'];
        $ext = pathinfo($file->getClientFilename(), PATHINFO_EXTENSION);
        $filename = 'logo.' . strtolower($ext);
        $file->moveTo($uploadDir . $filename);

        $url = '/newpos/api/public/uploads/store/' . $filename . '?t=' . time();
        $this->db->exec("UPDATE store_config SET logo_url = '$url' WHERE id = 1");

        $response->getBody()->write(json_encode(['logo_url' => $url]));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
