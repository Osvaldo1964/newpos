<?php
namespace App\Controllers;

use App\Models\User;
use Firebase\JWT\JWT;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AuthController
{
    private $db;
    private $secret_key = "antigravity_pos_secret_key_2026"; // En producción usar variables de entorno

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function login(Request $request, Response $response)
    {
        if (!$this->db) {
            $response->getBody()->write(json_encode(['error' => 'Error de conexión con la base de datos. Verifica que el script database.sql haya sido importado.']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }

        $data = json_decode($request->getBody(), true);

        if (!isset($data['email']) || !isset($data['password'])) {
            $response->getBody()->write(json_encode(['error' => 'Email y password requeridos']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $userModel = new User($this->db);
        $user = $userModel->findByEmail($data['email']);

        if ($user && password_verify($data['password'], $user['password'])) {
            $permissions = $userModel->getPermissions($user['role_id']);

            $payload = [
                'iat' => time() - 30, // 30s de margen
                'exp' => time() + (60 * 60), // 1 hora
                'sub' => $user['id'],
                'user' => [
                    'id' => $user['id'],
                    'nombre' => $user['nombre'],
                    'email' => $user['email'],
                    'role' => $user['role_name'],
                    'role_id' => $user['role_id'],
                    'permissions' => $permissions
                ]
            ];

            $jwt = JWT::encode($payload, $this->secret_key, 'HS256');

            $response->getBody()->write(json_encode([
                'token' => $jwt,
                'user' => $payload['user']
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }

        $response->getBody()->write(json_encode(['error' => 'Credenciales inválidas']));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
    }
}
