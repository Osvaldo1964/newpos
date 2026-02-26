<?php
namespace App\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Warehouse;
use App\Models\Sede;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class InventoryController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    // --- Products ---
    public function getProducts(Request $request, Response $response)
    {
        $productModel = new Product($this->db);
        $products = $productModel->getAll();
        $response->getBody()->write(json_encode($products));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function createProduct(Request $request, Response $response)
    {
        $data = $request->getParsedBody();
        $files = $request->getUploadedFiles();

        $productModel = new Product($this->db);
        $productId = $productModel->create($data);

        if ($productId) {
            if (isset($files['images'])) {
                $images = is_array($files['images']) ? $files['images'] : [$files['images']];
                $uploadDir = __DIR__ . '/../../public/uploads/products/';

                foreach ($images as $index => $file) {
                    if ($file->getError() === UPLOAD_ERR_OK) {
                        $extension = pathinfo($file->getClientFilename(), PATHINFO_EXTENSION);
                        $filename = $productId . '_' . time() . '_' . $index . '.' . $extension;
                        $file->moveTo($uploadDir . $filename);

                        $url = 'uploads/products/' . $filename;
                        $isMain = ($index === 0) ? 1 : 0;
                        $productModel->addImage($productId, $url, $isMain);
                    }
                }
            }

            $response->getBody()->write(json_encode(['id' => $productId, 'message' => 'Producto creado con éxito']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        }

        $response->getBody()->write(json_encode(['error' => 'Error al crear producto']));
        return $response->withStatus(500);
    }

    public function updateProduct(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $files = $request->getUploadedFiles();

        $productModel = new Product($this->db);
        if ($productModel->update($id, $data)) {
            if (isset($files['images'])) {
                $images = is_array($files['images']) ? $files['images'] : [$files['images']];
                $uploadDir = __DIR__ . '/../../public/uploads/products/';

                foreach ($images as $index => $file) {
                    if ($file->getError() === UPLOAD_ERR_OK) {
                        $extension = pathinfo($file->getClientFilename(), PATHINFO_EXTENSION);
                        $filename = $id . '_' . time() . '_' . $index . '.' . $extension;
                        $file->moveTo($uploadDir . $filename);

                        $url = 'uploads/products/' . $filename;
                        $productModel->addImage($id, $url, 0);
                    }
                }
            }
            $response->getBody()->write(json_encode(['message' => 'Producto actualizado']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }

        $response->getBody()->write(json_encode(['error' => 'Error al actualizar producto']));
        return $response->withStatus(500);
    }

    public function deleteProduct(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $productModel = new Product($this->db);

        $images = $productModel->getProductImages($id);
        $uploadDir = __DIR__ . '/../../public/';
        foreach ($images as $img) {
            if (file_exists($uploadDir . $img['url'])) {
                unlink($uploadDir . $img['url']);
            }
        }

        if ($productModel->delete($id)) {
            $response->getBody()->write(json_encode(['message' => 'Producto eliminado']));
            return $response->withStatus(200);
        }
        $response->getBody()->write(json_encode(['error' => 'Error al eliminar producto']));
        return $response->withStatus(500);
    }

    // --- Categories ---
    public function getCategories(Request $request, Response $response)
    {
        $categoryModel = new Category($this->db);
        $categories = $categoryModel->getAll();
        $response->getBody()->write(json_encode($categories));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    // --- Warehouses ---
    public function getWarehouses(Request $request, Response $response)
    {
        $warehouseModel = new Warehouse($this->db);
        $warehouses = $warehouseModel->getAll();
        $response->getBody()->write(json_encode($warehouses));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function createWarehouse(Request $request, Response $response)
    {
        $data = $request->getParsedBody();
        $warehouseModel = new Warehouse($this->db);
        $id = $warehouseModel->create($data);
        if ($id) {
            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Bodega creada']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        }
        $response->getBody()->write(json_encode(['error' => 'Error al crear bodega']));
        return $response->withStatus(500);
    }

    public function updateWarehouse(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = $request->getParsedBody();
        $warehouseModel = new Warehouse($this->db);
        if ($warehouseModel->update($id, $data)) {
            $response->getBody()->write(json_encode(['message' => 'Bodega actualizada']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
        $response->getBody()->write(json_encode(['error' => 'Error al actualizar bodega']));
        return $response->withStatus(500);
    }

    public function deleteWarehouse(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $warehouseModel = new Warehouse($this->db);
        $result = $warehouseModel->delete($id);

        if ($result === true) {
            $response->getBody()->write(json_encode(['message' => 'Bodega eliminada']));
            return $response->withStatus(200);
        } elseif ($result === "cannot_delete_has_stock") {
            $response->getBody()->write(json_encode(['error' => 'No se puede eliminar la bodega porque tiene stock asociado']));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $response->getBody()->write(json_encode(['error' => 'Error al eliminar bodega']));
        return $response->withStatus(500);
    }

    // --- Sedes ---
    public function getSedes(Request $request, Response $response)
    {
        $sedeModel = new Sede($this->db);
        $sedes = $sedeModel->getAll();
        $response->getBody()->write(json_encode($sedes));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
