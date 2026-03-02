<?php
namespace App\Controllers;

use PDO;
use Firebase\JWT\JWT;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class PublicAuthController
{
    private $db;
    private $secret = 'pos_store_secret_2026';

    public function __construct($db)
    {
        $this->db = $db;
    }

    private function jsonResponse($response, $data, $status = 200)
    {
        $response->getBody()->write(json_encode($data));
        return $response->withHeader('Content-Type', 'application/json')
            ->withHeader('Access-Control-Allow-Origin', '*')
            ->withStatus($status);
    }

    private function generateToken($terceroId)
    {
        return JWT::encode([
            'iat' => time(),
            'exp' => time() + 86400 * 7, // 7 days
            'sub' => $terceroId,
            'store' => true,
        ], $this->secret, 'HS256');
    }

    // POST /public/auth/register
    public function register(Request $request, Response $response)
    {
        $data = json_decode($request->getBody(), true);

        $required = ['nombre', 'email', 'password'];
        foreach ($required as $f) {
            if (empty($data[$f])) {
                return $this->jsonResponse($response, ['error' => "Campo requerido: $f"], 400);
            }
        }

        // Check duplicate email
        $stmt = $this->db->prepare(
            "SELECT id FROM terceros WHERE email = :email LIMIT 1"
        );
        $stmt->execute([':email' => $data['email']]);
        if ($stmt->fetch()) {
            return $this->jsonResponse($response, ['error' => 'El correo ya está registrado'], 409);
        }

        // Concatenate names if both provided
        $fullName = trim(($data['nombre'] ?? '') . ' ' . ($data['apellido'] ?? ''));

        // Insert tercero
        $stmt = $this->db->prepare(
            "INSERT INTO terceros (nombre, documento, tipo_documento, tipo_persona,
                                   email, telefono, direccion, password_hash, 
                                   es_cliente, es_proveedor, google_id)
             VALUES (:nombre, :doc, :tipo_doc, 'Natural',
                     :email, :telefono, :direccion, :password, 
                     1, 0, NULL)"
        );
        $stmt->execute([
            ':nombre' => $fullName,
            ':doc' => $data['documento'] ?? null,
            ':tipo_doc' => $data['tipo_documento'] ?? 'CC',
            ':email' => $data['email'],
            ':telefono' => $data['telefono'] ?? null,
            ':direccion' => $data['direccion'] ?? null,
            ':password' => password_hash($data['password'], PASSWORD_DEFAULT),
        ]);
        $id = $this->db->lastInsertId();

        $token = $this->generateToken($id);
        $tercero = $this->getTercero($id);

        return $this->jsonResponse($response, ['token' => $token, 'user' => $tercero], 201);
    }

    // POST /public/auth/login
    public function login(Request $request, Response $response)
    {
        $data = json_decode($request->getBody(), true);

        if (empty($data['email']) || empty($data['password'])) {
            return $this->jsonResponse($response, ['error' => 'Email y contraseña requeridos'], 400);
        }

        $stmt = $this->db->prepare(
            "SELECT id, password_hash FROM terceros WHERE email = :email LIMIT 1"
        );
        $stmt->execute([':email' => $data['email']]);
        $tercero = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$tercero || !password_verify($data['password'], $tercero['password_hash'] ?? '')) {
            return $this->jsonResponse($response, ['error' => 'Credenciales inválidas'], 401);
        }

        $token = $this->generateToken($tercero['id']);
        return $this->jsonResponse($response, [
            'token' => $token,
            'user' => $this->getTercero($tercero['id'])
        ]);
    }

    // POST /public/auth/google
    public function googleLogin(Request $request, Response $response)
    {
        $data = json_decode($request->getBody(), true);
        $googleId = $data['google_id'] ?? null;
        $email = $data['email'] ?? null;
        $nombre = $data['nombre'] ?? null;

        if (!$googleId || !$email) {
            return $this->jsonResponse($response, ['error' => 'Google data incompleta'], 400);
        }

        // Check existing by google_id or email
        $stmt = $this->db->prepare(
            "SELECT id FROM terceros WHERE google_id = :gid OR email = :email LIMIT 1"
        );
        $stmt->execute([':gid' => $googleId, ':email' => $email]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            // Link google_id if not yet set
            $this->db->prepare(
                "UPDATE terceros SET google_id = :gid WHERE id = :id"
            )->execute([':gid' => $googleId, ':id' => $existing['id']]);
            $id = $existing['id'];
        } else {
            // Create new tercero
            $stmt = $this->db->prepare(
                "INSERT INTO terceros (nombre, email, google_id, tipo_persona, es_cliente, es_proveedor)
                 VALUES (:nombre, :email, :gid, 'Natural', 1, 0)"
            );
            $stmt->execute([':nombre' => $nombre, ':email' => $email, ':gid' => $googleId]);
            $id = $this->db->lastInsertId();
        }

        $user = $this->getTercero($id);
        $needsCompletion = empty($user['documento']) || empty($user['telefono']);

        $token = $this->generateToken($id);
        return $this->jsonResponse($response, [
            'token' => $token,
            'user' => $user,
            'needs_completion' => $needsCompletion,
        ]);
    }

    // PUT /public/auth/profile
    public function updateProfile(Request $request, Response $response)
    {
        // Extract tercero_id from JWT in Authorization header
        $auth = $request->getHeaderLine('Authorization');
        $token = str_replace('Bearer ', '', $auth);
        try {
            $decoded = JWT::decode($token, new \Firebase\JWT\Key($this->secret, 'HS256'));
            $id = $decoded->sub;
        } catch (\Exception $e) {
            return $this->jsonResponse($response, ['error' => 'Token inválido'], 401);
        }

        $data = json_decode($request->getBody(), true);

        // Handle names concatenation for profile update as well if needed
        $nameSql = "";
        $params = [':id' => $id];

        if (isset($data['nombre'])) {
            $fullName = trim($data['nombre'] . ' ' . ($data['apellido'] ?? ''));
            $nameSql = "nombre = :nombre,";
            $params[':nombre'] = $fullName;
        }

        $this->db->prepare(
            "UPDATE terceros SET
                $nameSql
                documento = COALESCE(:doc, documento),
                tipo_documento = COALESCE(:tipo_doc, tipo_documento),
                telefono = COALESCE(:telefono, telefono),
                direccion = COALESCE(:direccion, direccion)
             WHERE id = :id"
        )->execute(array_merge($params, [
                        ':doc' => $data['documento'] ?? null,
                        ':tipo_doc' => $data['tipo_documento'] ?? null,
                        ':telefono' => $data['telefono'] ?? null,
                        ':direccion' => $data['direccion'] ?? null,
                    ]));

        return $this->jsonResponse($response, ['user' => $this->getTercero($id)]);
    }

    private function getTercero($id)
    {
        $stmt = $this->db->prepare(
            "SELECT id, nombre, documento, tipo_documento,
                    email, telefono, direccion, google_id, tipo_persona, es_cliente
             FROM terceros WHERE id = :id"
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
