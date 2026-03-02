<?php
namespace App\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

/**
 * Public controller — no authentication required.
 * Serves data for the public e-commerce storefront.
 */
class PublicController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    // GET /public/store-info
    public function storeInfo(Request $request, Response $response)
    {
        $stmt = $this->db->query(
            "SELECT nombre, slogan, logo_url, direccion, telefono, email, ciudad,
                    google_client_id, wompi_public_key, payu_merchant_id,
                    payu_account_id, payu_test, mercadopago_public_key
             FROM store_config WHERE id = 1"
        );
        $config = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        $response->getBody()->write(json_encode($config));
        return $response->withHeader('Content-Type', 'application/json')
            ->withHeader('Access-Control-Allow-Origin', '*');
    }

    // GET /public/categories
    public function categories(Request $request, Response $response)
    {
        $stmt = $this->db->query(
            "SELECT c.id, c.nombre,
                    COUNT(CASE WHEN p.activo_ecommerce = 1 THEN 1 END) AS total_productos
             FROM categories c
             LEFT JOIN products p ON p.category_id = c.id
             GROUP BY c.id, c.nombre
             HAVING total_productos > 0
             ORDER BY c.nombre"
        );
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $response->getBody()->write(json_encode($rows));
        return $response->withHeader('Content-Type', 'application/json')
            ->withHeader('Access-Control-Allow-Origin', '*');
    }

    // GET /public/products?category_id=&q=
    public function products(Request $request, Response $response)
    {
        $params = $request->getQueryParams();
        $categoryId = $params['category_id'] ?? null;
        $q = $params['q'] ?? null;

        $where = ["p.activo_ecommerce = 1"];
        $bind = [];

        if ($categoryId) {
            $where[] = "p.category_id = :cat";
            $bind[':cat'] = $categoryId;
        }
        if ($q) {
            $where[] = "(p.nombre LIKE :q OR p.descripcion LIKE :q)";
            $bind[':q'] = "%$q%";
        }

        $sql = "SELECT p.id, p.sku, p.nombre, p.descripcion, p.descripcion_publica,
                       p.precio_base, p.iva, p.imagen, p.category_id,
                       c.nombre AS categoria,
                       COALESCE(SUM(inv.stock_actual), 0) AS stock_total
                FROM products p
                LEFT JOIN categories c ON c.id = p.category_id
                LEFT JOIN inventory inv ON inv.product_id = p.id
                WHERE " . implode(' AND ', $where) . "
                GROUP BY p.id
                ORDER BY p.nombre";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($bind);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Enrich with image gallery
        foreach ($rows as &$row) {
            $imgStmt = $this->db->prepare(
                "SELECT url FROM product_images WHERE product_id = :pid ORDER BY id LIMIT 5"
            );
            $imgStmt->execute([':pid' => $row['id']]);
            $imgs = $imgStmt->fetchAll(PDO::FETCH_COLUMN);
            $row['imagenes'] = $imgs;
            // Primary image fallback
            if (!$row['imagen'] && !empty($imgs)) {
                $row['imagen'] = $imgs[0];
            }
        }

        $response->getBody()->write(json_encode($rows));
        return $response->withHeader('Content-Type', 'application/json')
            ->withHeader('Access-Control-Allow-Origin', '*');
    }

    // GET /public/products/{id}
    public function productDetail(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $stmt = $this->db->prepare(
            "SELECT p.*, c.nombre AS categoria,
                    COALESCE(SUM(inv.stock_actual), 0) AS stock_total
             FROM products p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN inventory inv ON inv.product_id = p.id
             WHERE p.id = :id AND p.activo_ecommerce = 1
             GROUP BY p.id"
        );
        $stmt->execute([':id' => $id]);
        $product = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$product) {
            $response->getBody()->write(json_encode(['error' => 'Product not found']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }

        $imgStmt = $this->db->prepare(
            "SELECT url FROM product_images WHERE product_id = :pid ORDER BY id"
        );
        $imgStmt->execute([':pid' => $id]);
        $product['imagenes'] = $imgStmt->fetchAll(PDO::FETCH_COLUMN);

        $response->getBody()->write(json_encode($product));
        return $response->withHeader('Content-Type', 'application/json')
            ->withHeader('Access-Control-Allow-Origin', '*');
    }

    // POST /public/orders
    public function createOrder(Request $request, Response $response)
    {
        $data = json_decode($request->getBody(), true);

        if (empty($data['items']) || empty($data['customer_name'])) {
            $response->getBody()->write(json_encode(['error' => 'Datos incompletos']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // Calculate totals
        $subtotal = 0;
        $iva_total = 0;
        $enrichedItems = [];

        foreach ($data['items'] as $item) {
            $stmt = $this->db->prepare(
                "SELECT id, nombre, precio_base, iva FROM products WHERE id = :id AND activo_ecommerce = 1"
            );
            $stmt->execute([':id' => $item['product_id']]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$product)
                continue;

            $qty = max(1, (int) $item['cantidad']);
            $price = (float) $product['precio_base'];
            $ivaRate = (float) $product['iva'] / 100;
            $lineSubtotal = $price * $qty;
            $lineIva = $lineSubtotal * $ivaRate;

            $subtotal += $lineSubtotal;
            $iva_total += $lineIva;
            $enrichedItems[] = [
                'product_id' => $product['id'],
                'nombre_producto' => $product['nombre'],
                'cantidad' => $qty,
                'precio_unitario' => $price,
                'iva' => $product['iva'],
                'subtotal' => $lineSubtotal,
            ];
        }

        $total = $subtotal + $iva_total;

        $stmt = $this->db->prepare(
            "INSERT INTO online_orders
             (tercero_id, customer_name, customer_email, customer_phone,
              customer_address, customer_documento, subtotal, iva_total, total, 
              notas, metodo_pago, referencia_pago, estado)
             VALUES (:tid, :name, :email, :phone, :addr, :doc, :sub, :iva, :total, 
                     :notas, :metodo, :ref, 'PENDIENTE')"
        );
        $stmt->execute([
            ':tid' => $data['tercero_id'] ?? null,
            ':name' => $data['customer_name'],
            ':email' => $data['customer_email'] ?? null,
            ':phone' => $data['customer_phone'] ?? null,
            ':addr' => $data['customer_address'] ?? null,
            ':doc' => $data['customer_documento'] ?? null,
            ':sub' => $subtotal,
            ':iva' => $iva_total,
            ':total' => $total,
            ':notas' => $data['notas'] ?? null,
            ':metodo' => $data['metodo_pago'] ?? 'TRANSFERENCIA',
            ':ref' => $data['referencia_pago'] ?? '',
        ]);
        $orderId = $this->db->lastInsertId();

        // Insert items
        foreach ($enrichedItems as $item) {
            $stmt = $this->db->prepare(
                "INSERT INTO online_order_items
                 (order_id, product_id, nombre_producto, cantidad, precio_unitario, iva, subtotal)
                 VALUES (:oid, :pid, :nombre, :qty, :price, :iva, :sub)"
            );
            $stmt->execute([
                ':oid' => $orderId,
                ':pid' => $item['product_id'],
                ':nombre' => $item['nombre_producto'],
                ':qty' => $item['cantidad'],
                ':price' => $item['precio_unitario'],
                ':iva' => $item['iva'],
                ':sub' => $item['subtotal'],
            ]);
        }

        $response->getBody()->write(json_encode([
            'success' => true,
            'order_id' => $orderId,
            'total' => $total,
        ]));
        return $response->withHeader('Content-Type', 'application/json')
            ->withHeader('Access-Control-Allow-Origin', '*')
            ->withStatus(201);
    }

    // GET /public/orders/count — pending count for dashboard badge
    public function pendingCount(Request $request, Response $response)
    {
        $stmt = $this->db->query(
            "SELECT COUNT(*) as total FROM online_orders WHERE estado = 'PENDIENTE'"
        );
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $response->getBody()->write(json_encode($row));
        return $response->withHeader('Content-Type', 'application/json')
            ->withHeader('Access-Control-Allow-Origin', '*');
    }
}
