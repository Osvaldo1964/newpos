<?php
namespace App\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Models\Sale;

class OnlineOrderController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    // GET /online-orders
    public function index(Request $request, Response $response)
    {
        $params = $request->getQueryParams();
        $estado = $params['estado'] ?? null;

        $where = '';
        $bind = [];
        if ($estado) {
            $where = 'WHERE o.estado = :estado';
            $bind[':estado'] = $estado;
        }

        $stmt = $this->db->prepare(
            "SELECT o.*, COUNT(oi.id) AS num_items
             FROM online_orders o
             LEFT JOIN online_order_items oi ON oi.order_id = o.id
             $where
             GROUP BY o.id
             ORDER BY o.created_at DESC"
        );
        $stmt->execute($bind);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response->getBody()->write(json_encode($orders));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // GET /online-orders/{id}
    public function show(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $stmt = $this->db->prepare("SELECT * FROM online_orders WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            $response->getBody()->write(json_encode(['error' => 'Not found']));
            return $response->withStatus(404);
        }

        $stmt = $this->db->prepare(
            "SELECT oi.*, p.imagen FROM online_order_items oi
             LEFT JOIN products p ON p.id = oi.product_id
             WHERE oi.order_id = :oid"
        );
        $stmt->execute([':oid' => $id]);
        $order['items'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response->getBody()->write(json_encode($order));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // PUT /online-orders/{id}/status
    public function updateStatus(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        if (!$data) {
            $data = json_decode($request->getBody(), true);
        }
        $estado = $data['estado'] ?? null;
        $userAttr = $request->getAttribute('user'); // Extract user from JWT Middleware

        $valid = ['PENDIENTE', 'PAGADO', 'DESPACHADO', 'COMPLETADO', 'CANCELADO'];
        if (!in_array($estado, $valid)) {
            $response->getBody()->write(json_encode(['error' => 'Estado inválido']));
            return $response->withStatus(400);
        }

        $this->db->prepare(
            "UPDATE online_orders SET estado = :estado,
             metodo_pago = COALESCE(:metodo, metodo_pago)
             WHERE id = :id"
        )->execute([
                    ':estado' => $estado,
                    ':metodo' => $data['metodo_pago'] ?? null,
                    ':id' => $id,
                ]);

        // IF status is PAGADO or COMPLETADO, create a real SALE if not already created
        if (in_array($estado, ['PAGADO', 'COMPLETADO'])) {
            $stmt = $this->db->prepare("SELECT sale_id FROM online_orders WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $currentSaleId = $stmt->fetchColumn();

            if (!$currentSaleId) {
                try {
                    // Fetch order details
                    $stmt = $this->db->prepare("SELECT * FROM online_orders WHERE id = :id");
                    $stmt->execute([':id' => $id]);
                    $order = $stmt->fetch(PDO::FETCH_ASSOC);

                    $stmt = $this->db->prepare("SELECT * FROM online_order_items WHERE order_id = :id");
                    $stmt->execute([':id' => $id]);
                    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

                    // Determine User, Sede and Cash Session
                    $userId = $userAttr ? $userAttr->id : 1;
                    $sedeId = $userAttr ? $userAttr->sede_id : 1;

                    $sessionModel = new \App\Models\CashSession($this->db);
                    $activeSession = $sessionModel->getActiveSession($userId);
                    $sessionId = $activeSession ? $activeSession['id'] : null;

                    $saleModel = new Sale($this->db);
                    $saleData = [
                        'user_id' => $userId,
                        'customer_id' => $order['tercero_id'],
                        'sede_id' => $sedeId,
                        'warehouse_id' => 1, // Default warehouse
                        'cash_session_id' => $sessionId,
                        'subtotal' => $order['subtotal'],
                        'iva_total' => $order['iva_total'],
                        'total' => $order['total'],
                        'items' => array_map(function ($i) {
                            return [
                                'product_id' => $i['product_id'],
                                'cantidad' => $i['cantidad'],
                                'precio_unitario' => $i['precio_unitario'],
                                'descuento' => 0,
                                'subtotal' => $i['cantidad'] * $i['precio_unitario']
                            ];
                        }, $items),
                        'payments' => [
                            [
                                'metodo' => $order['metodo_pago'] ?: 'ONLINE',
                                'monto' => $order['total'],
                                'referencia' => $order['referencia_pago'] ?: "Pedido #$id"
                            ]
                        ]
                    ];

                    $newSaleId = $saleModel->create($saleData);

                    // Link sale back to order
                    $this->db->prepare("UPDATE online_orders SET sale_id = :sid WHERE id = :id")
                        ->execute([':sid' => $newSaleId, ':id' => $id]);

                } catch (\Exception $e) {
                    // Log error but allow order status update to finish
                    error_log("Error creating sale for order $id: " . $e->getMessage());
                }
            }
        }

        $response->getBody()->write(json_encode(['success' => true]));
        return $response->withHeader('Content-Type', 'application/json');
    }

    // GET /online-orders/pending-count (for dashboard badge)
    public function pendingCount(Request $request, Response $response)
    {
        $stmt = $this->db->query(
            "SELECT COUNT(*) as total FROM online_orders WHERE estado = 'PENDIENTE'"
        );
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $response->getBody()->write(json_encode($row));
        return $response->withHeader('Content-Type', 'application/json');
    }
}
