<?php
use Psr\Http\Message\ResponseInterface as Response;
date_default_timezone_set('America/Bogota');
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use App\Config\Database;
use App\Controllers\AuthController;
use App\Controllers\InventoryController;
use App\Controllers\CategoryController;
use App\Controllers\ConfigController;
use App\Controllers\UserController;
use App\Controllers\RoleController;
use App\Controllers\CashRegisterController;
use App\Controllers\CashController;
use App\Controllers\CashConceptController;
use App\Controllers\TerceroController;
use App\Controllers\PurchaseController;
use App\Controllers\StockTransferController;
use App\Controllers\SaleController;
use App\Middleware\JwtMiddleware;

require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();

// Detectar y establecer la ruta base correctamente para XAMPP
// SCRIPT_NAME suele ser /pos/api/public/index.php
$basePath = str_replace('/index.php', '', $_SERVER['SCRIPT_NAME']);
$app->setBasePath($basePath);

// Log de depuración para ver qué está pasando (puedes verlo en el error log de Apache)
error_log("POS API - BasePath: " . $basePath . " | Request URI: " . $_SERVER['REQUEST_URI']);

// 1. Force CORS Headers before any Slim logic if it's an OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
    header('Access-Control-Allow-Headers: X-Requested-With, Content-Type, Accept, Origin, Authorization');
    header('Access-Control-Max-Age: 86400');
    header('Content-Length: 0');
    header('Content-Type: text/plain');
    exit;
}

// 2. Add Standard Slim Middlewares
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();

// 3. Robust CORS Middleware for standard requests
$app->add(function (Request $request, $handler): Response {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Content-Type', 'application/json');
});

// 4. Custom Error Handling to ensure JSON + CORS on errors
$errorMiddleware = $app->addErrorMiddleware(true, true, true);
$errorMiddleware->setDefaultErrorHandler(function (Request $request, Throwable $exception, bool $displayErrorDetails) use ($app) {
    $response = $app->getResponseFactory()->createResponse();

    $status = 500;
    if ($exception instanceof \Slim\Exception\HttpNotFoundException)
        $status = 404;
    if ($exception instanceof \Slim\Exception\HttpBadRequestException)
        $status = 400;
    if ($exception instanceof \Slim\Exception\HttpMethodNotAllowedException)
        $status = 405;

    $payload = [
        'error' => $exception->getMessage(),
        'code' => $status
    ];

    $response->getBody()->write(json_encode($payload));

    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
        ->withHeader('Content-Type', 'application/json')
        ->withStatus($status);
});

// --- Routes ---

$app->get('/status', function (Request $request, Response $response) {
    $response->getBody()->write(json_encode(['status' => 'online', 'message' => 'POS API is running']));
    return $response;
});

$app->post('/login', function (Request $request, Response $response) {
    $db = (new Database())->getConnection();
    $controller = new AuthController($db);
    return $controller->login($request, $response);
});

// --- Inventory Routes ---
$app->group('/inventory', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new InventoryController($db);

    $group->get('/products', [$controller, 'getProducts']);
    $group->post('/products', [$controller, 'createProduct']);
    $group->put('/products/{id}', [$controller, 'updateProduct']);
    $group->delete('/products/{id}', [$controller, 'deleteProduct']);
    $group->get('/products/{id}/stock', [$controller, 'getProductStockBreakdown']);

    $group->get('/categories', [$controller, 'getCategories']);
    $group->get('/warehouses', [$controller, 'getWarehouses']);
    $group->post('/warehouses', [$controller, 'createWarehouse']);
    $group->put('/warehouses/{id}', [$controller, 'updateWarehouse']);
    $group->delete('/warehouses/{id}', [$controller, 'deleteWarehouse']);
    $group->get('/sedes', [$controller, 'getSedes']);
})->add(new JwtMiddleware());

// --- Traslados (Grupo Aislado para Depuración) ---
$app->group('/stock-transfers', function ($group) {
    $db = (new Database())->getConnection();
    $transferController = new \App\Controllers\StockTransferController($db);

    $group->get('', [$transferController, 'getTransfers']);
    $group->get('/{id}', [$transferController, 'getTransferDetails']);
    $group->post('', [$transferController, 'createTransfer']);
    $group->put('/{id}', [$transferController, 'updateTransfer']);
})->add(new JwtMiddleware());

// --- Ventas ---
$app->group('/sales', function ($group) {
    $db = (new App\Config\Database())->getConnection();
    $controller = new SaleController($db);

    $group->get('', [$controller, 'getSales']);
    $group->get('/{id}', [$controller, 'getSaleDetail']);
    $group->post('', [$controller, 'createSale']);
})->add(new App\Middleware\JwtMiddleware());

// --- Categories CRUD ---
$app->group('/categories', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new CategoryController($db);

    $group->get('', [$controller, 'getCategories']);
    $group->post('', [$controller, 'createCategory']);
    $group->put('/{id}', [$controller, 'updateCategory']);
    $group->delete('/{id}', [$controller, 'deleteCategory']);
})->add(new JwtMiddleware());

// Wildcard for preflight if not handled by standard header()
$app->options('/{routes:.+}', function ($request, $response, $args) {
    return $response;
});

// --- Sedes CRUD ---
$app->group('/sedes', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new ConfigController($db);

    $group->get('', [$controller, 'getSedes']);
    $group->post('', [$controller, 'createSede']);
    $group->put('/{id}', [$controller, 'updateSede']);
    $group->delete('/{id}', [$controller, 'deleteSede']);
})->add(new JwtMiddleware());

// --- Users Management ---
$app->group('/users', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new UserController($db);
    $group->get('', [$controller, 'getUsers']);
    $group->post('', [$controller, 'createUser']);
    $group->put('/{id}', [$controller, 'updateUser']);
    $group->delete('/{id}', [$controller, 'deleteUser']);
})->add(new JwtMiddleware());

// --- Roles & Permissions ---
$app->group('/roles', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new RoleController($db);
    $group->get('', [$controller, 'getRoles']);
    $group->get('/modules', [$controller, 'getModules']);
    $group->get('/permissions', [$controller, 'getPermissions']);
    $group->get('/{id}/permissions', [$controller, 'getRolePermissions']);
    $group->put('/{id}/permissions', [$controller, 'updateRolePermissions']);
})->add(new JwtMiddleware());

// --- Cash Registers Management ---
$app->group('/cash-registers', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new CashRegisterController($db);
    $group->get('', [$controller, 'getRegisters']);
    $group->get('/status', [$controller, 'getRegistersWithStatus']);
    $group->post('', [$controller, 'createRegister']);
    $group->put('/{id}', [$controller, 'updateRegister']);
    $group->delete('/{id}', [$controller, 'deleteRegister']);
    $group->get('/sede/{sede_id}', [$controller, 'getRegistersBySede']);
})->add(new JwtMiddleware());

// --- Cash Sessions & Movements ---
$app->group('/cash', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new CashController($db);
    $group->get('/active', [$controller, 'checkActiveSession']);
    $group->post('/open', [$controller, 'openSession']);
    $group->put('/close/{id}', [$controller, 'closeSession']);
    $group->get('/session/{id}', [$controller, 'getSessionDetails']);
    $group->post('/movements', [$controller, 'addMovement']);
    $group->put('/movements/{id}', [$controller, 'updateMovement']);
    $group->delete('/movements/{id}', [$controller, 'deleteMovement']);
    $group->get('/audit', [$controller, 'getAuditLogs']);
})->add(new JwtMiddleware());

// --- Terceros (Clientes / Proveedores) ---
$app->group('/terceros', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new TerceroController($db);
    $group->get('', [$controller, 'getAll']);
    $group->get('/search', [$controller, 'search']);
    $group->post('', [$controller, 'create']);
    $group->put('/{id}', [$controller, 'update']);
    $group->delete('/{id}', [$controller, 'delete']);
})->add(new JwtMiddleware());

// --- Cash Concepts ---
$app->group('/cash-concepts', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new CashConceptController($db);
    $group->get('', [$controller, 'getAll']);
    $group->get('/tipo/{tipo}', [$controller, 'getByType']);
    $group->post('', [$controller, 'create']);
    $group->put('/{id}', [$controller, 'update']);
    $group->delete('/{id}', [$controller, 'delete']);
})->add(new JwtMiddleware());


// --- Compras (Órdenes y Entradas) ---
$app->group('/compras', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new PurchaseController($db);

    $group->get('/ordenes', [$controller, 'getOrders']);
    $group->post('/ordenes', [$controller, 'createOrder']);
    $group->get('/ordenes/{id}', [$controller, 'getOrderDetails']);
    $group->put('/ordenes/{id}', [$controller, 'updateOrder']);
    $group->delete('/ordenes/{id}', [$controller, 'deleteOrder']);

    $group->get('/entradas', [$controller, 'getEntries']);
    $group->post('/entradas', [$controller, 'createEntry']);
    $group->get('/entradas/{id}', [$controller, 'getEntryDetails']);
    $group->put('/entradas/{id}', [$controller, 'updateEntry']);
    $group->delete('/entradas/{id}', [$controller, 'deleteEntry']);
})->add(new JwtMiddleware());

$app->run();
