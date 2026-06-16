<?php

use App\Controllers\AuthController;
use App\Controllers\AdminController;
use App\Controllers\AiController;
use App\Controllers\DashboardController;
use App\Controllers\EquipmentController;
use App\Controllers\PartController;
use App\Controllers\RepairController;
use App\Controllers\UserController;
use App\Middleware\JwtMiddleware;
use Slim\Routing\RouteCollectorProxy;

$app->group('/api', function (RouteCollectorProxy $group) {
    $group->post('/auth/login', [AuthController::class, 'login']);

    $group->group('', function (RouteCollectorProxy $api) {
        $api->get('/dashboard', [DashboardController::class, 'index']);
        $api->post('/admin/reset-demo', [AdminController::class, 'resetDemo']);
        $api->post('/ai/repair-description', [AiController::class, 'repairDescription']);
        $api->get('/parts', [PartController::class, 'index']);
        $api->get('/parts/{id}', [PartController::class, 'show']);
        $api->post('/parts', [PartController::class, 'create']);
        $api->put('/parts/{id}', [PartController::class, 'update']);
        $api->delete('/parts/{id}', [PartController::class, 'delete']);
        $api->post('/stock/income', [PartController::class, 'income']);
        $api->get('/stock/movements', [PartController::class, 'movements']);
        $api->get('/equipment', [EquipmentController::class, 'index']);
        $api->post('/equipment', [EquipmentController::class, 'create']);
        $api->put('/equipment/{id}', [EquipmentController::class, 'update']);
        $api->delete('/equipment/{id}', [EquipmentController::class, 'delete']);
        $api->get('/repairs', [RepairController::class, 'index']);
        $api->get('/repairs/{id}', [RepairController::class, 'show']);
        $api->post('/repairs', [RepairController::class, 'create']);
        $api->put('/repairs/{id}', [RepairController::class, 'update']);
        $api->get('/users', [UserController::class, 'index']);
        $api->post('/users', [UserController::class, 'create']);
        $api->put('/users/{id}', [UserController::class, 'update']);
        $api->delete('/users/{id}', [UserController::class, 'delete']);
    })->add(new JwtMiddleware());
});
