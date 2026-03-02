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
use App\Controllers\PromotionController;
use App\Controllers\ReportController;
use App\Controllers\StoreConfigController;
use App\Controllers\PublicController;
use App\Controllers\PublicAuthController;
use App\Controllers\OnlineOrderController;
use App\Middleware\JwtMiddleware;

require __DIR__ . '/../vendor/autoload.php';

$app = AppFactory::create();

// Detectar y establecer la ruta base correctamente para XAMPP
$basePath = str_replace('/index.php', '', $_SERVER['SCRIPT_NAME']);
$app->setBasePath($basePath);

// Standard Slim Middlewares
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();

// Robust CORS Middleware
$app->add(function (Request $request, $handler): Response {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization');
});

// Wildcard for preflight
$app->options('/{routes:.+}', function ($request, $response) {
    return $response;
});

// 1. Auth Pública y Login Admin (Rutas sin Middleware JWT)
$app->post('/login', [AuthController::class, 'login']);

$app->get('/status', function (Request $request, Response $response) {
    $response->getBody()->write(json_encode(['status' => 'online', 'message' => 'POS API is running']));
    return $response->withHeader('Content-Type', 'application/json');
});

// --- API PÚBLICA (Storefront) ---
$app->group('/p', function ($group) {
    $db = (new Database())->getConnection();
    $publicCtrl = new PublicController($db);
    $authCtrl = new PublicAuthController($db);

    $group->get('/store-info', [$publicCtrl, 'storeInfo']);
    $group->get('/categories', [$publicCtrl, 'categories']);
    $group->get('/products', [$publicCtrl, 'products']);
    $group->get('/products/{id}', [$publicCtrl, 'productDetail']);
    $group->post('/orders', [$publicCtrl, 'createOrder']);

    $group->post('/auth/register', [$authCtrl, 'register']);
    $group->post('/auth/login', [$authCtrl, 'login']);
    $group->post('/auth/google', [$authCtrl, 'googleLogin']);
    $group->put('/auth/profile', [$authCtrl, 'updateProfile']);
});

// --- API PRIVADA (Admin Dashboard) ---
// Todo lo que sigue requiere Token JWT

$app->group('/inventory', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new InventoryController($db);
    $group->get('/products', [$controller, 'getProducts']);
    $group->post('/products', [$controller, 'createProduct']);
    $group->put('/products/{id}', [$controller, 'updateProduct']);
    $group->delete('/products/{id}', [$controller, 'deleteProduct']);
    $group->get('/categories', [$controller, 'getCategories']);
    $group->get('/warehouses', [$controller, 'getWarehouses']);
    $group->get('/sedes', [$controller, 'getSedes']);
})->add(new JwtMiddleware());

$app->group('/categories', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new CategoryController($db);
    $group->get('', [$controller, 'getCategories']);
    $group->post('', [$controller, 'createCategory']);
    $group->put('/{id}', [$controller, 'updateCategory']);
    $group->delete('/{id}', [$controller, 'deleteCategory']);
})->add(new JwtMiddleware());

$app->group('/stock-transfers', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new StockTransferController($db);
    $group->get('', [$controller, 'getTransfers']);
    $group->get('/{id}', [$controller, 'getTransferDetails']);
    $group->post('', [$controller, 'createTransfer']);
    $group->put('/{id}', [$controller, 'updateTransfer']);
})->add(new JwtMiddleware());

$app->group('/sales', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new SaleController($db);
    $group->get('', [$controller, 'getSales']);
    $group->get('/{id}', [$controller, 'getSaleDetail']);
    $group->post('', [$controller, 'createSale']);
})->add(new JwtMiddleware());

$app->group('/sedes', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new ConfigController($db);
    $group->get('', [$controller, 'getSedes']);
    $group->post('', [$controller, 'createSede']);
    $group->put('/{id}', [$controller, 'updateSede']);
    $group->delete('/{id}', [$controller, 'deleteSede']);
})->add(new JwtMiddleware());

$app->group('/users', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new UserController($db);
    $group->get('', [$controller, 'getUsers']);
    $group->post('', [$controller, 'createUser']);
    $group->put('/{id}', [$controller, 'updateUser']);
})->add(new JwtMiddleware());

$app->group('/roles', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new RoleController($db);
    $group->get('', [$controller, 'getRoles']);
    $group->get('/modules', [$controller, 'getModules']);
    $group->get('/permissions', [$controller, 'getPermissions']);
})->add(new JwtMiddleware());

$app->group('/cash-registers', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new CashRegisterController($db);
    $group->get('', [$controller, 'getRegisters']);
    $group->get('/status', [$controller, 'getRegistersWithStatus']);
    $group->post('', [$controller, 'createRegister']);
    $group->put('/{id}', [$controller, 'updateRegister']);
    $group->get('/sede/{sede_id}', [$controller, 'getRegistersBySede']);
})->add(new JwtMiddleware());

$app->group('/cash', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new CashController($db);
    $group->get('/active', [$controller, 'checkActiveSession']);
    $group->post('/open', [$controller, 'openSession']);
    $group->put('/close/{id}', [$controller, 'closeSession']);
    $group->get('/session/{id}', [$controller, 'getSessionDetails']);
    $group->post('/movements', [$controller, 'addMovement']);
    $group->get('/audit', [$controller, 'getAuditLogs']);
})->add(new JwtMiddleware());

$app->group('/terceros', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new TerceroController($db);
    $group->get('', [$controller, 'getAll']);
    $group->get('/search', [$controller, 'search']);
    $group->post('', [$controller, 'create']);
    $group->put('/{id}', [$controller, 'update']);
})->add(new JwtMiddleware());

$app->group('/cash-concepts', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new CashConceptController($db);
    $group->get('', [$controller, 'getAll']);
    $group->post('', [$controller, 'create']);
    $group->put('/{id}', [$controller, 'update']);
})->add(new JwtMiddleware());

$app->group('/promotions', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new PromotionController($db);
    $group->get('', [$controller, 'getAll']);
    $group->get('/active', [$controller, 'getActive']);
    $group->post('', [$controller, 'create']);
})->add(new JwtMiddleware());

$app->group('/compras', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new PurchaseController($db);
    $group->get('/ordenes', [$controller, 'getOrders']);
    $group->post('/ordenes', [$controller, 'createOrder']);
    $group->get('/entradas', [$controller, 'getEntries']);
    $group->post('/entradas', [$controller, 'createEntry']);
})->add(new JwtMiddleware());

$app->group('/reports', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new ReportController($db);
    $group->get('/sales-by-day', [$controller, 'salesByDay']);
    $group->get('/sales-by-sede', [$controller, 'salesBySede']);
    $group->get('/physical-inventory', [$controller, 'physicalInventory']);
})->add(new JwtMiddleware());

$app->group('/store-config', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new StoreConfigController($db);
    $group->get('', [$controller, 'get']);
    $group->put('', [$controller, 'update']);
    $group->post('/logo', [$controller, 'uploadLogo']);
})->add(new JwtMiddleware());

$app->group('/online-orders', function ($group) {
    $db = (new Database())->getConnection();
    $controller = new OnlineOrderController($db);
    $group->get('', [$controller, 'index']);
    $group->get('/pending-count', [$controller, 'pendingCount']);
    $group->get('/{id}', [$controller, 'show']);
    $group->put('/{id}/status', [$controller, 'updateStatus']);
})->add(new JwtMiddleware());

$app->run();
