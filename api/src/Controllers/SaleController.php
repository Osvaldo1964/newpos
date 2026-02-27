<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Sale;

class SaleController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getSales(Request $request, Response $response)
    {
        $saleModel = new Sale($this->db);
        $sales = $saleModel->getAll();
        $response->getBody()->write(json_encode($sales));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function getSaleDetail(Request $request, Response $response, array $args)
    {
        $id = $args['id'];
        $saleModel = new Sale($this->db);
        $sale = $saleModel->getById($id);

        if (!$sale) {
            $response->getBody()->write(json_encode(['error' => 'Venta no encontrada']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }

        $response->getBody()->write(json_encode($sale));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function createSale(Request $request, Response $response)
    {
        $data = $request->getParsedBody();
        $saleModel = new Sale($this->db);

        try {
            $saleId = $saleModel->create($data);
            $response->getBody()->write(json_encode([
                'message' => 'Venta registrada con éxito',
                'sale_id' => $saleId
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
    }
}
