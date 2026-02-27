<?php
namespace App\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response as SlimResponse;

class JwtMiddleware
{
    private $secret_key = "antigravity_pos_secret_key_2026";

    public function __invoke(Request $request, Handler $handler): Response
    {
        JWT::$leeway = 60; // Allow 60s clock skew
        $authHeader = $request->getHeaderLine('Authorization');

        if (!$authHeader) {
            $response = new SlimResponse();
            $response->getBody()->write(json_encode(['error' => 'Token no proporcionado']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }

        $token = str_replace('Bearer ', '', $authHeader);

        try {
            $decoded = JWT::decode($token, new Key($this->secret_key, 'HS256'));
            // Add decoded user data to request attributes
            $request = $request->withAttribute('user', $decoded->user);
            return $handler->handle($request);
        } catch (\Exception $e) {
            $response = new SlimResponse();
            $response->getBody()->write(json_encode([
                'error' => 'Token inválido o expirado',
                'debug' => $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }
    }
}
