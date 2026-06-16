<?php

namespace App\Controllers;

use App\Helpers\Database;
use App\Helpers\Response;

class PartController
{
    public function index($request, $response)
    {
        $rows = Database::connection()->query('SELECT * FROM spare_parts ORDER BY name')->fetchAll();
        return Response::json($response, $rows);
    }

    public function show($request, $response, $args)
    {
        $stmt = Database::connection()->prepare('SELECT * FROM spare_parts WHERE id = ?');
        $stmt->execute([$args['id']]);
        $row = $stmt->fetch();
        return $row ? Response::json($response, $row) : Response::json($response, ['message' => 'Деталь не найдена'], 404);
    }

    public function create($request, $response)
    {
        if (!$this->canCreateStock($request)) return Response::json($response, ['message' => 'Доступ запрещён'], 403);
        $data = $this->data($request);
        $sql = 'INSERT INTO spare_parts (article, name, unit, quantity, min_quantity, location, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())';
        Database::connection()->prepare($sql)->execute([$data['article'], $data['name'], $data['unit'], $data['quantity'], $data['min_quantity'], $data['location']]);
        return Response::json($response, ['id' => Database::connection()->lastInsertId()], 201);
    }

    public function update($request, $response, $args)
    {
        if (!$this->isAdmin($request)) return Response::json($response, ['message' => 'Доступ запрещён'], 403);
        $data = $this->data($request);
        $sql = 'UPDATE spare_parts SET article = ?, name = ?, unit = ?, quantity = ?, min_quantity = ?, location = ? WHERE id = ?';
        Database::connection()->prepare($sql)->execute([$data['article'], $data['name'], $data['unit'], $data['quantity'], $data['min_quantity'], $data['location'], $args['id']]);
        return Response::json($response, ['message' => 'Сохранено']);
    }

    public function delete($request, $response, $args)
    {
        if (!$this->canDeleteStock($request)) return Response::json($response, ['message' => 'Доступ запрещён'], 403);
        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT COUNT(*) FROM stock_movements WHERE part_id = ?');
        $stmt->execute([$args['id']]);
        if ((int)$stmt->fetchColumn() > 0) {
            return Response::json($response, ['message' => 'Нельзя удалить деталь с движениями склада'], 400);
        }
        $pdo->prepare('DELETE FROM spare_parts WHERE id = ?')->execute([$args['id']]);
        return Response::json($response, ['message' => 'Удалено']);
    }

    public function income($request, $response)
    {
        if (!$this->canRegisterIncome($request)) return Response::json($response, ['message' => 'Доступ запрещён'], 403);
        $data = (array)$request->getParsedBody();
        $user = $request->getAttribute('user');
        $pdo = Database::connection();
        $pdo->beginTransaction();
        try {
            $pdo->prepare('UPDATE spare_parts SET quantity = quantity + ? WHERE id = ?')->execute([(float)$data['quantity'], (int)$data['part_id']]);
            $pdo->prepare('INSERT INTO stock_movements (part_id, operation_type, quantity, comment, created_by, created_at) VALUES (?, "INCOME", ?, ?, ?, NOW())')->execute([(int)$data['part_id'], (float)$data['quantity'], $data['comment'] ?? '', $user->id]);
            $pdo->commit();
            return Response::json($response, ['message' => 'Поступление осуществлено'], 201);
        } catch (\Exception $exception) {
            $pdo->rollBack();
            return Response::json($response, ['message' => 'Ошибка сохранения поступления'], 400);
        }
    }

    public function movements($request, $response)
    {
        $sql = 'SELECT sm.*, sp.name AS part_name, u.full_name AS user_name FROM stock_movements sm JOIN spare_parts sp ON sp.id = sm.part_id LEFT JOIN users u ON u.id = sm.created_by ORDER BY sm.created_at DESC';
        return Response::json($response, Database::connection()->query($sql)->fetchAll());
    }

    private function data($request)
    {
        $data = (array)$request->getParsedBody();
        return [
            'article' => trim($data['article'] ?? ''),
            'name' => trim($data['name'] ?? ''),
            'unit' => trim($data['unit'] ?? ''),
            'quantity' => (float)($data['quantity'] ?? 0),
            'min_quantity' => (float)($data['min_quantity'] ?? 0),
            'location' => trim($data['location'] ?? ''),
        ];
    }

    private function isAdmin($request)
    {
        $user = $request->getAttribute('user');
        return $user && $user->role === 'admin';
    }

    private function canRegisterIncome($request)
    {
        $user = $request->getAttribute('user');
        return $user && in_array($user->role, ['admin', 'storekeeper'], true);
    }

    private function canCreateStock($request)
    {
        $user = $request->getAttribute('user');
        return $user && in_array($user->role, ['admin', 'storekeeper'], true);
    }

    private function canDeleteStock($request)
    {
        $user = $request->getAttribute('user');
        return $user && in_array($user->role, ['admin', 'storekeeper'], true);
    }
}
