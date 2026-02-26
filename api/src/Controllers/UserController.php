<?php
namespace App\Controllers;

use App\Models\User;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class UserController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getUsers(Request $request, Response $response)
    {
        $userModel = new User($this->db);
        $users = $userModel->getAll();
        $response->getBody()->write(json_encode($users));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function createUser(Request $request, Response $response)
    {
        $data = $request->getParsedBody();
        $userModel = new User($this->db);

        // Basic validation
        if (empty($data['email']) || empty($data['password']) || empty($data['nombre'])) {
            $response->getBody()->write(json_encode(['error' => 'Faltan campos obligatorios']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $id = $userModel->create($data);
        if ($id) {
            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Usuario creado con éxito']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        }
        $response->getBody()->write(json_encode(['error' => 'Error al crear usuario. Posiblemente el email ya existe.']));
        return $response->withStatus(500);
    }

    public function updateUser(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $userModel = new User($this->db);

        if ($userModel->update($id, $data)) {
            $response->getBody()->write(json_encode(['message' => 'Usuario actualizado']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
        $response->getBody()->write(json_encode(['error' => 'Error al actualizar usuario']));
        return $response->withStatus(500);
    }

    public function deleteUser(Request $request, Response $response, $args)
    {
        $id = $args['id'];

        // Prevent deleting yourself
        $currentUser = $request->getAttribute('user');
        if ($currentUser && $currentUser->id == $id) {
            $response->getBody()->write(json_encode(['error' => 'No puedes eliminar tu propio usuario']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $userModel = new User($this->db);
        if ($userModel->delete($id)) {
            $response->getBody()->write(json_encode(['message' => 'Usuario eliminado']));
            return $response->withStatus(200);
        }
        $response->getBody()->write(json_encode(['error' => 'Error al eliminar usuario']));
        return $response->withStatus(500);
    }
}
