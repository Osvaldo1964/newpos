<?php
namespace App\Controllers;

use App\Models\Sede;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ConfigController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getSedes(Request $request, Response $response)
    {
        $sedeModel = new Sede($this->db);
        $sedes = $sedeModel->getAll();
        $response->getBody()->write(json_encode($sedes));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function createSede(Request $request, Response $response)
    {
        $data = $request->getParsedBody();
        $sedeModel = new Sede($this->db);
        $id = $sedeModel->create($data);
        if ($id) {
            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Sede creada con éxito']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        }
        $response->getBody()->write(json_encode(['error' => 'Error al crear sede']));
        return $response->withStatus(500);
    }

    public function updateSede(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $sedeModel = new Sede($this->db);
        if ($sedeModel->update($id, $data)) {
            $response->getBody()->write(json_encode(['message' => 'Sede actualizada']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
        $response->getBody()->write(json_encode(['error' => 'Error al actualizar sede']));
        return $response->withStatus(500);
    }

    public function deleteSede(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $sedeModel = new Sede($this->db);
        $result = $sedeModel->delete($id);

        if ($result === true) {
            $response->getBody()->write(json_encode(['message' => 'Sede eliminada']));
            return $response->withStatus(200);
        } elseif ($result === "cannot_delete_has_dependencies") {
            $response->getBody()->write(json_encode(['error' => 'No se puede eliminar la sede porque tiene usuarios, bodegas o ventas asociadas']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $response->getBody()->write(json_encode(['error' => 'Error al eliminar sede']));
        return $response->withStatus(500);
    }
}
