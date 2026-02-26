<?php
namespace App\Controllers;

use App\Models\Role;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class RoleController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getRoles(Request $request, Response $response)
    {
        $roleModel = new Role($this->db);
        $roles = $roleModel->getAll();
        $response->getBody()->write(json_encode($roles));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function getModules(Request $request, Response $response)
    {
        $roleModel = new Role($this->db);
        $modules = $roleModel->getModules();
        $response->getBody()->write(json_encode($modules));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function getPermissions(Request $request, Response $response)
    {
        $roleModel = new Role($this->db);
        $permissions = $roleModel->getPermissions();
        $response->getBody()->write(json_encode($permissions));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function getRolePermissions(Request $request, Response $response, $args)
    {
        $roleId = $args['id'];
        $roleModel = new Role($this->db);
        $permissions = $roleModel->getRolePermissions($roleId);
        $response->getBody()->write(json_encode($permissions));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function updateRolePermissions(Request $request, Response $response, $args)
    {
        $roleId = $args['id'];
        $data = $request->getParsedBody();
        $roleModel = new Role($this->db);

        if ($roleModel->updatePermissions($roleId, $data['permissions'])) {
            $response->getBody()->write(json_encode(['message' => 'Permisos actualizados con éxito']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
        $response->getBody()->write(json_encode(['error' => 'Error al actualizar permisos']));
        return $response->withStatus(500);
    }
}
