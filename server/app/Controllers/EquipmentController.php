<?php

namespace App\Controllers;

use App\Helpers\Database;
use App\Helpers\Response;

class EquipmentController
{
    public function index($request, $response) { return Response::json($response, Database::connection()->query('SELECT * FROM equipment ORDER BY name')->fetchAll()); }
    public function create($request, $response) { if (!$this->isAdmin($request)) return Response::json($response, ['message' => 'Доступ запрещён'], 403); $d = (array)$request->getParsedBody(); Database::connection()->prepare('INSERT INTO equipment (inventory_number, name) VALUES (?, ?)')->execute([$d['inventory_number'], $d['name']]); return Response::json($response, ['id' => Database::connection()->lastInsertId()], 201); }
    public function update($request, $response, $args) { if (!$this->isAdmin($request)) return Response::json($response, ['message' => 'Доступ запрещён'], 403); $d = (array)$request->getParsedBody(); Database::connection()->prepare('UPDATE equipment SET inventory_number = ?, name = ? WHERE id = ?')->execute([$d['inventory_number'], $d['name'], $args['id']]); return Response::json($response, ['message' => 'Сохранено']); }
    public function delete($request, $response, $args) { if (!$this->isAdmin($request)) return Response::json($response, ['message' => 'Доступ запрещён'], 403); Database::connection()->prepare('DELETE FROM equipment WHERE id = ?')->execute([$args['id']]); return Response::json($response, ['message' => 'Удалено']); }

    private function isAdmin($request)
    {
        $user = $request->getAttribute('user');
        return $user && $user->role === 'admin';
    }
}
