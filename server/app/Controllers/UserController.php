<?php

namespace App\Controllers;

use App\Helpers\Database;
use App\Helpers\Response;

class UserController
{
    public function index($request, $response) { if (!$this->isAdmin($request)) return Response::json($response, ['message' => 'Доступ запрещён'], 403); return Response::json($response, Database::connection()->query('SELECT id, full_name, login, role, created_at FROM users ORDER BY full_name')->fetchAll()); }

    public function create($request, $response)
    {
        if (!$this->isAdmin($request)) return Response::json($response, ['message' => 'Доступ запрещён'], 403);
        $d = (array)$request->getParsedBody();
        Database::connection()->prepare('INSERT INTO users (full_name, login, password, role, created_at) VALUES (?, ?, ?, ?, NOW())')->execute([$d['full_name'], $d['login'], password_hash($d['password'] ?: '123456', PASSWORD_DEFAULT), $d['role']]);
        return Response::json($response, ['id' => Database::connection()->lastInsertId()], 201);
    }

    public function update($request, $response, $args)
    {
        if (!$this->isAdmin($request)) return Response::json($response, ['message' => 'Доступ запрещён'], 403);
        $d = (array)$request->getParsedBody();
        if (!empty($d['password'])) {
            Database::connection()->prepare('UPDATE users SET full_name = ?, login = ?, password = ?, role = ? WHERE id = ?')->execute([$d['full_name'], $d['login'], password_hash($d['password'], PASSWORD_DEFAULT), $d['role'], $args['id']]);
        } else {
            Database::connection()->prepare('UPDATE users SET full_name = ?, login = ?, role = ? WHERE id = ?')->execute([$d['full_name'], $d['login'], $d['role'], $args['id']]);
        }
        return Response::json($response, ['message' => 'Сохранено']);
    }

    public function delete($request, $response, $args) { if (!$this->isAdmin($request)) return Response::json($response, ['message' => 'Доступ запрещён'], 403); Database::connection()->prepare('DELETE FROM users WHERE id = ?')->execute([$args['id']]); return Response::json($response, ['message' => 'Удалено']); }

    private function isAdmin($request)
    {
        $user = $request->getAttribute('user');
        return $user && $user->role === 'admin';
    }
}
