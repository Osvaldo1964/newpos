<?php
namespace App\Controllers;

use App\Models\CashRegister;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CashRegisterController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getRegisters(Request $request, Response $response)
    {
        $model = new CashRegister($this->db);
        $registers = $model->getAll();
        $response->getBody()->write(json_encode($registers));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function getRegistersWithStatus(Request $request, Response $response)
    {
        $model = new CashRegister($this->db);
        $registers = $model->getAllWithStatus();
        $response->getBody()->write(json_encode($registers));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function createRegister(Request $request, Response $response)
    {
        $data = $request->getParsedBody();
        if (empty($data['nombre']) || empty($data['sede_id'])) {
            $response->getBody()->write(json_encode(['error' => 'Faltan campos obligatorios']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $model = new CashRegister($this->db);
        $id = $model->create($data);
        if ($id) {
            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Caja creada con éxito']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        }
        $response->getBody()->write(json_encode(['error' => 'Error al crear la caja']));
        return $response->withStatus(500);
    }

    public function updateRegister(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $model = new CashRegister($this->db);

        if ($model->update($id, $data)) {
            $response->getBody()->write(json_encode(['message' => 'Caja actualizada']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
        $response->getBody()->write(json_encode(['error' => 'Error al actualizar la caja']));
        return $response->withStatus(500);
    }

    public function deleteRegister(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $model = new CashRegister($this->db);
        if ($model->delete($id)) {
            $response->getBody()->write(json_encode(['message' => 'Caja eliminada']));
            return $response->withStatus(200);
        }
        $response->getBody()->write(json_encode(['error' => 'No se puede eliminar la caja porque tiene sesiones asociadas']));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
    }

    public function getRegistersBySede(Request $request, Response $response, $args)
    {
        $sedeId = $args['sede_id'];
        $model = new CashRegister($this->db);
        $registers = $model->findBySede($sedeId);
        $response->getBody()->write(json_encode($registers));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
