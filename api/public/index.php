<?php
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use App\Config\Database;
use App\Controllers\AuthController;

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

// Wildcard for preflight if not handled by standard header()
$app->options('/{routes:.+}', function ($request, $response, $args) {
    return $response;
});

$app->run();
