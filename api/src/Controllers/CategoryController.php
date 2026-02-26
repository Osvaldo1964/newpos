<?php
namespace App\Controllers;

use App\Models\Category;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class CategoryController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function getCategories(Request $request, Response $response)
    {
        $categoryModel = new Category($this->db);
        $categories = $categoryModel->getAll();
        $response->getBody()->write(json_encode($categories));
        return $response->withStatus(200);
    }

    public function createCategory(Request $request, Response $response)
    {
        $data = json_decode($request->getBody(), true);
        if (!isset($data['nombre'])) {
            $response->getBody()->write(json_encode(['error' => 'Nombre es requerido']));
            return $response->withStatus(400);
        }

        $categoryModel = new Category($this->db);
        $id = $categoryModel->create($data['nombre']);
        if ($id) {
            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Categoría creada']));
            return $response->withStatus(201);
        }
        $response->getBody()->write(json_encode(['error' => 'Error al crear categoría']));
        return $response->withStatus(500);
    }

    public function updateCategory(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $data = json_decode($request->getBody(), true);
        if (!isset($data['nombre'])) {
            $response->getBody()->write(json_encode(['error' => 'Nombre es requerido']));
            return $response->withStatus(400);
        }

        $categoryModel = new Category($this->db);
        if ($categoryModel->update($id, $data['nombre'])) {
            $response->getBody()->write(json_encode(['message' => 'Categoría actualizada']));
            return $response->withStatus(200);
        }
        $response->getBody()->write(json_encode(['error' => 'Error al actualizar categoría']));
        return $response->withStatus(500);
    }

    public function deleteCategory(Request $request, Response $response, $args)
    {
        $id = $args['id'];
        $categoryModel = new Category($this->db);
        $result = $categoryModel->delete($id);

        if ($result === true) {
            $response->getBody()->write(json_encode(['message' => 'Categoría eliminada']));
            return $response->withStatus(200);
        } elseif ($result === "cannot_delete_has_products") {
            $response->getBody()->write(json_encode(['error' => 'No se puede eliminar una categoría que tiene productos asociados']));
            return $response->withStatus(400);
        }

        $response->getBody()->write(json_encode(['error' => 'Error al eliminar categoría']));
        return $response->withStatus(500);
    }
}
