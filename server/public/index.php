<?php

use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';

$envPath = dirname(__DIR__, 2);
if (class_exists(\Dotenv\Dotenv::class) && file_exists($envPath . '/.env')) {
    \Dotenv\Dotenv::createUnsafeImmutable($envPath)->safeLoad();
}

$app = AppFactory::create();
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();

$app->add(function ($request, $handler) {
    if ($request->getMethod() === 'OPTIONS') {
        $response = new \Slim\Psr7\Response();
    } else {
        $response = $handler->handle($request);
    }

    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
});

$app->addErrorMiddleware(true, true, true);

require __DIR__ . '/../routes/api.php';

$app->run();
