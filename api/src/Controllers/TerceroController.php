<?php
namespace App\Controllers;

use App\Models\Tercero;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class TerceroController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getAll(Request $request, Response $response)
    {
        $model = new Tercero($this->db);
        $data = $model->getAll();
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function create(Request $request, Response $response)
    {
        $data = $request->getParsedBody();
        $model = new Tercero($this->db);

        // Validar documento único
        if ($model->searchByDocumento($data['documento'])) {
            $response->getBody()->write(json_encode(['error' => 'El documento ya está registrado']));
            return $response->withStatus(400);
        }

        $id = $model->create($data);
        if ($id) {
            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Tercero creado con éxito']));
            return $response->withStatus(201);
        }
        return $response->withStatus(500);
    }

    public function update(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $model = new Tercero($this->db);

        if ($model->update($id, $data)) {
            $response->getBody()->write(json_encode(['message' => 'Tercero actualizado']));
            return $response->withStatus(200);
        }
        return $response->withStatus(500);
    }

    public function delete(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $model = new Tercero($this->db);

        if ($model->delete($id)) {
            $response->getBody()->write(json_encode(['message' => 'Tercero eliminado']));
            return $response->withStatus(200);
        }
        return $response->withStatus(500);
    }

    public function search(Request $request, Response $response)
    {
        $doc = $request->getQueryParams()['documento'] ?? '';
        $model = new Tercero($this->db);
        $tercero = $model->searchByDocumento($doc);

        $response->getBody()->write(json_encode($tercero ?: null));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
