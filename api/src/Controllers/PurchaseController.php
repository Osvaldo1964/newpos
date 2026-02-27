<?php
namespace App\Controllers;

use App\Models\PurchaseOrder;
use App\Models\WarehouseEntry;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class PurchaseController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    // --- Purchase Orders ---
    public function getOrders(Request $request, Response $response)
    {
        $queryParams = $request->getQueryParams();
        $model = new PurchaseOrder($this->db);
        $orders = $model->getAll($queryParams);
        $response->getBody()->write(json_encode($orders));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function getOrderDetails(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $model = new PurchaseOrder($this->db);
        $order = $model->getById($id);
        if (!$order) {
            return $response->withStatus(404);
        }
        $response->getBody()->write(json_encode($order));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function createOrder(Request $request, Response $response)
    {
        $user = $request->getAttribute('user');
        $data = $request->getParsedBody();
        $data['user_id'] = $user->id;

        if (empty($data['tercero_id']) || empty($data['items'])) {
            $response->getBody()->write(json_encode(['error' => 'Faltan datos obligatorios']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $model = new PurchaseOrder($this->db);
        $id = $model->create($data);

        if ($id) {
            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Orden de compra creada']));
            return $response->withStatus(201);
        }
        return $response->withStatus(500);
    }

    public function updateOrder(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $model = new PurchaseOrder($this->db);

        $success = $model->update($id, $data);
        if ($success) {
            $response->getBody()->write(json_encode(['message' => 'Orden de compra actualizada']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
        $response->getBody()->write(json_encode(['error' => 'No se pudo actualizar la orden']));
        return $response->withStatus(400);
    }

    public function deleteOrder(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $model = new PurchaseOrder($this->db);

        $success = $model->delete($id);
        if ($success) {
            $response->getBody()->write(json_encode(['message' => 'Orden de compra eliminada']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
        $response->getBody()->write(json_encode(['error' => 'No se puede eliminar una orden con recepciones']));
        return $response->withStatus(400);
    }

    // --- Warehouse Entries ---
    public function getEntries(Request $request, Response $response)
    {
        $model = new WarehouseEntry($this->db);
        $entries = $model->getAll();
        $response->getBody()->write(json_encode($entries));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function getEntryDetails(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $model = new WarehouseEntry($this->db);
        $entry = $model->getById($id);
        if (!$entry) {
            return $response->withStatus(404);
        }
        $response->getBody()->write(json_encode($entry));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function createEntry(Request $request, Response $response)
    {
        $user = $request->getAttribute('user');
        $data = $request->getParsedBody();
        $data['user_id'] = $user->id;

        if (empty($data['tercero_id']) || empty($data['warehouse_id']) || empty($data['items'])) {
            $response->getBody()->write(json_encode(['error' => 'Faltan datos obligatorios']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $model = new WarehouseEntry($this->db);
        $id = $model->create($data);

        if ($id) {
            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Entrada a bodega registrada']));
            return $response->withStatus(201);
        }
        return $response->withStatus(500);
    }

    public function deleteEntry(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $model = new WarehouseEntry($this->db);

        $success = $model->delete($id);
        if ($success) {
            $response->getBody()->write(json_encode(['message' => 'Entrada eliminada y stock revertido']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
        return $response->withStatus(500);
    }

    public function updateEntry(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $model = new WarehouseEntry($this->db);

        $success = $model->update($id, $data);
        if ($success) {
            $response->getBody()->write(json_encode(['message' => 'Entrada a bodega actualizada']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
        $response->getBody()->write(json_encode(['error' => 'No se pudo actualizar la entrada']));
        return $response->withStatus(400);
    }
}
