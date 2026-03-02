<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Promotion;

class PromotionController {
    private $model;

    public function __construct($db) {
        $this->model = new Promotion($db);
    }

    /** GET /promotions */
    public function getAll(Request $req, Response $res): Response {
        $data = $this->model->getAll();
        $res->getBody()->write(json_encode($data));
        return $res;
    }

    /** GET /promotions/active */
    public function getActive(Request $req, Response $res): Response {
        $data = $this->model->getActive();
        $res->getBody()->write(json_encode($data));
        return $res;
    }

    /** POST /promotions */
    public function create(Request $req, Response $res): Response {
        $body    = $req->getParsedBody();
        $targets = $body['targets'] ?? [];
        unset($body['targets']);

        if (empty($body['nombre']) || empty($body['tipo']) || !isset($body['valor'])) {
            $res->getBody()->write(json_encode(['error' => 'nombre, tipo y valor son requeridos']));
            return $res->withStatus(400);
        }

        try {
            $id = $this->model->create($body, $targets);
            $res->getBody()->write(json_encode(['success' => true, 'id' => $id]));
            return $res->withStatus(201);
        } catch (\Exception $e) {
            $res->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $res->withStatus(500);
        }
    }

    /** PUT /promotions/{id} */
    public function update(Request $req, Response $res, array $args): Response {
        $body    = $req->getParsedBody();
        $targets = $body['targets'] ?? [];
        unset($body['targets']);

        try {
            $this->model->update($args['id'], $body, $targets);
            $res->getBody()->write(json_encode(['success' => true]));
            return $res;
        } catch (\Exception $e) {
            $res->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $res->withStatus(500);
        }
    }

    /** DELETE /promotions/{id} */
    public function delete(Request $req, Response $res, array $args): Response {
        $this->model->delete($args['id']);
        $res->getBody()->write(json_encode(['success' => true]));
        return $res;
    }
}
