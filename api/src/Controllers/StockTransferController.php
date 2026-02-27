<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\StockTransfer;
use PDO;

class StockTransferController
{
    private $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getTransfers(Request $request, Response $response)
    {
        $model = new StockTransfer($this->db);
        $data = $model->getAll();
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function getTransferDetails(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $model = new StockTransfer($this->db);
        $data = $model->getById($id);
        if (!$data) {
            return $response->withStatus(404);
        }
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function createTransfer(Request $request, Response $response)
    {
        $data = $request->getParsedBody();
        $model = new StockTransfer($this->db);

        try {
            $id = $model->create($data);
            $response->getBody()->write(json_encode(['message' => 'Traslado realizado con éxito', 'id' => $id]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }

    public function updateTransfer(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $model = new StockTransfer($this->db);

        try {
            $model->update($id, $data);
            $response->getBody()->write(json_encode(['message' => 'Traslado actualizado con éxito']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }
}
