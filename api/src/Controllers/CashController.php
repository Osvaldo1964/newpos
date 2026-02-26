<?php
namespace App\Controllers;

use App\Models\CashSession;
use App\Models\CashMovement;
use App\Models\CashRegister;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CashController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function checkActiveSession(Request $request, Response $response)
    {
        $user = $request->getAttribute('user'); // From JwtMiddleware
        $model = new CashSession($this->db);
        $session = $model->getActiveSession($user->id);

        $response->getBody()->write(json_encode($session ?: null));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function openSession(Request $request, Response $response)
    {
        $user = $request->getAttribute('user');
        $data = $request->getParsedBody();

        if (empty($data['register_id']) || !isset($data['monto_apertura'])) {
            $response->getBody()->write(json_encode(['error' => 'Faltan datos para la apertura']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $sessionModel = new CashSession($this->db);
        // Check if already has an active session
        if ($sessionModel->getActiveSession($user->id)) {
            $response->getBody()->write(json_encode(['error' => 'Ya tienes una sesión de caja abierta']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $id = $sessionModel->open([
            'user_id' => $user->id,
            'sede_id' => $data['sede_id'],
            'register_id' => $data['register_id'],
            'monto_apertura' => $data['monto_apertura']
        ]);

        if ($id) {
            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Caja abierta con éxito']));
            return $response->withStatus(201);
        }
        return $response->withStatus(500);
    }

    public function closeSession(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $montoCierre = $data['monto_cierre'];

        $sessionModel = new CashSession($this->db);
        if ($sessionModel->close($id, $montoCierre)) {
            $response->getBody()->write(json_encode(['message' => 'Caja cerrada correctamente']));
            return $response->withStatus(200);
        }
        return $response->withStatus(500);
    }

    public function getSessionDetails(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $sessionModel = new CashSession($this->db);
        $movementModel = new CashMovement($this->db);

        $totals = $sessionModel->getSessionTotals($id);
        $movements = $movementModel->getBySession($id);

        $response->getBody()->write(json_encode([
            'totals' => $totals,
            'movements' => $movements
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function addMovement(Request $request, Response $response)
    {
        $data = $request->getParsedBody();
        $movementModel = new CashMovement($this->db);

        if ($movementModel->create($data)) {
            $response->getBody()->write(json_encode(['message' => 'Movimiento registrado']));
            return $response->withStatus(201);
        }
        return $response->withStatus(500);
    }

    public function getAuditLogs(Request $request, Response $response)
    {
        $queryParams = $request->getQueryParams();
        $sedeId = $queryParams['sede_id'] ?? null;

        $sessionModel = new CashSession($this->db);
        $sessions = $sessionModel->getAllSessions($sedeId);

        $response->getBody()->write(json_encode($sessions));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
