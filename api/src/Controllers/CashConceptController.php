<?php
namespace App\Controllers;

use App\Models\CashConcept;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CashConceptController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getAll(Request $request, Response $response)
    {
        $model = new CashConcept($this->db);
        $concepts = $model->getAll();
        $response->getBody()->write(json_encode($concepts));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function getByType(Request $request, Response $response, $args)
    {
        $tipo = $args['tipo'];
        $model = new CashConcept($this->db);
        $concepts = $model->getByType($tipo);
        $response->getBody()->write(json_encode($concepts));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function create(Request $request, Response $response)
    {
        $data = $request->getParsedBody();
        if (empty($data['nombre']) || empty($data['tipo'])) {
            $response->getBody()->write(json_encode(['error' => 'Faltan campos obligatorios']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $model = new CashConcept($this->db);
        $id = $model->create($data);
        if ($id) {
            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Concepto creado']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        }
        return $response->withStatus(500);
    }

    public function update(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $model = new CashConcept($this->db);

        if ($model->update($id, $data)) {
            $response->getBody()->write(json_encode(['message' => 'Concepto actualizado']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
        return $response->withStatus(500);
    }

    public function delete(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $model = new CashConcept($this->db);
        if ($model->delete($id)) {
            $response->getBody()->write(json_encode(['message' => 'Concepto eliminado']));
            return $response->withStatus(200);
        }
        $response->getBody()->write(json_encode(['error' => 'No se puede eliminar porque tiene movimientos asociados']));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
    }
}
