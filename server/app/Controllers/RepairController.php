<?php

namespace App\Controllers;

use App\Helpers\Database;
use App\Helpers\Response;

class RepairController
{
    public function index($request, $response)
    {
        $sql = 'SELECT r.*, e.name AS equipment_name, u.full_name AS mechanic_full_name, u.login AS mechanic_login FROM repairs r JOIN equipment e ON e.id = r.equipment_id JOIN users u ON u.id = r.created_by ORDER BY r.repair_date DESC, r.id DESC';
        return Response::json($response, Database::connection()->query($sql)->fetchAll());
    }

    public function show($request, $response, $args)
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare('SELECT r.*, e.name AS equipment_name, u.full_name AS mechanic_full_name, u.login AS mechanic_login FROM repairs r JOIN equipment e ON e.id = r.equipment_id JOIN users u ON u.id = r.created_by WHERE r.id = ?');
        $stmt->execute([$args['id']]);
        $repair = $stmt->fetch();
        if (!$repair) return Response::json($response, ['message' => 'Ремонт не найден'], 404);
        $stmt = $pdo->prepare('SELECT rp.*, sp.article AS part_article, sp.name AS part_name, sp.unit AS part_unit FROM repair_parts rp JOIN spare_parts sp ON sp.id = rp.part_id WHERE rp.repair_id = ?');
        $stmt->execute([$args['id']]);
        $repair['parts'] = $stmt->fetchAll();
        return Response::json($response, $repair);
    }

    public function create($request, $response)
    {
        if (!$this->canCreateRepair($request)) return Response::json($response, ['message' => 'Доступ запрещён'], 403);

        $data = (array)$request->getParsedBody();
        $parts = isset($data['parts']) && is_array($data['parts']) ? $data['parts'] : [];
        $user = $request->getAttribute('user');
        $pdo = Database::connection();
        $pdo->beginTransaction();

        try {
            foreach ($parts as $part) {
                $stmt = $pdo->prepare('SELECT quantity FROM spare_parts WHERE id = ? FOR UPDATE');
                $stmt->execute([(int)$part['part_id']]);
                $available = $stmt->fetchColumn();
                if ($available === false || (float)$available < (float)$part['quantity']) {
                    $pdo->rollBack();
                    return Response::json($response, ['message' => 'Недостаточно деталей на складе'], 400);
                }
            }

            $pdo->prepare('INSERT INTO repairs (equipment_id, repair_date, description, created_by, created_at) VALUES (?, ?, ?, ?, NOW())')->execute([(int)$data['equipment_id'], $data['repair_date'], $data['description'] ?? '', $user->id]);
            $repairId = $pdo->lastInsertId();

            foreach ($parts as $part) {
                $partId = (int)$part['part_id'];
                $quantity = (float)$part['quantity'];
                $pdo->prepare('INSERT INTO repair_parts (repair_id, part_id, quantity) VALUES (?, ?, ?)')->execute([$repairId, $partId, $quantity]);
                $pdo->prepare('UPDATE spare_parts SET quantity = quantity - ? WHERE id = ?')->execute([$quantity, $partId]);
                $pdo->prepare('INSERT INTO stock_movements (part_id, operation_type, quantity, comment, created_by, created_at) VALUES (?, "EXPENSE", ?, ?, ?, NOW())')->execute([$partId, $quantity, 'Списание по ремонту #' . $repairId, $user->id]);
            }

            $pdo->commit();
            return Response::json($response, ['id' => $repairId], 201);
        } catch (\Exception $exception) {
            $pdo->rollBack();
            return Response::json($response, ['message' => 'Ошибка сохранения ремонта'], 400);
        }
    }

    public function update($request, $response, $args)
    {
        if (!$this->canCreateRepair($request)) return Response::json($response, ['message' => 'Доступ запрещён'], 403);

        $data = (array)$request->getParsedBody();
        $parts = isset($data['parts']) && is_array($data['parts']) ? $data['parts'] : [];
        $user = $request->getAttribute('user');
        $repairId = (int)$args['id'];
        $pdo = Database::connection();
        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare('SELECT id FROM repairs WHERE id = ? FOR UPDATE');
            $stmt->execute([$repairId]);
            if (!$stmt->fetch()) {
                $pdo->rollBack();
                return Response::json($response, ['message' => 'Ремонт не найден'], 404);
            }

            $stmt = $pdo->prepare('SELECT part_id, quantity FROM repair_parts WHERE repair_id = ?');
            $stmt->execute([$repairId]);
            $oldParts = $stmt->fetchAll();

            foreach ($oldParts as $part) {
                $pdo->prepare('UPDATE spare_parts SET quantity = quantity + ? WHERE id = ?')->execute([(float)$part['quantity'], (int)$part['part_id']]);
            }

            foreach ($parts as $part) {
                $stmt = $pdo->prepare('SELECT quantity FROM spare_parts WHERE id = ? FOR UPDATE');
                $stmt->execute([(int)$part['part_id']]);
                $available = $stmt->fetchColumn();
                if ($available === false || (float)$available < (float)$part['quantity']) {
                    $pdo->rollBack();
                    return Response::json($response, ['message' => 'Недостаточно деталей на складе'], 400);
                }
            }

            $pdo->prepare('DELETE FROM repair_parts WHERE repair_id = ?')->execute([$repairId]);
            $pdo->prepare('DELETE FROM stock_movements WHERE operation_type = "EXPENSE" AND comment = ?')->execute(['Списание по ремонту #' . $repairId]);
            $pdo->prepare('UPDATE repairs SET equipment_id = ?, repair_date = ?, description = ? WHERE id = ?')->execute([(int)$data['equipment_id'], $data['repair_date'], $data['description'] ?? '', $repairId]);

            foreach ($parts as $part) {
                $partId = (int)$part['part_id'];
                $quantity = (float)$part['quantity'];
                $pdo->prepare('INSERT INTO repair_parts (repair_id, part_id, quantity) VALUES (?, ?, ?)')->execute([$repairId, $partId, $quantity]);
                $pdo->prepare('UPDATE spare_parts SET quantity = quantity - ? WHERE id = ?')->execute([$quantity, $partId]);
                $pdo->prepare('INSERT INTO stock_movements (part_id, operation_type, quantity, comment, created_by, created_at) VALUES (?, "EXPENSE", ?, ?, ?, NOW())')->execute([$partId, $quantity, 'Списание по ремонту #' . $repairId, $user->id]);
            }

            $pdo->commit();
            return Response::json($response, ['message' => 'Ремонт сохранён']);
        } catch (\Exception $exception) {
            $pdo->rollBack();
            return Response::json($response, ['message' => 'Ошибка сохранения ремонта'], 400);
        }
    }

    private function canCreateRepair($request)
    {
        $user = $request->getAttribute('user');
        return $user && in_array($user->role, ['admin', 'technician'], true);
    }
}
