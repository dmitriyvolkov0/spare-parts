<?php

namespace App\Controllers;

use App\Helpers\Database;
use App\Helpers\Response;

class DashboardController
{
    public function index($request, $response)
    {
        $pdo = Database::connection();
        $params = $request->getQueryParams();
        $limit = max(10, min(100, (int)($params['movements_limit'] ?? 10)));
        $stmt = $pdo->prepare('SELECT sm.*, sp.name AS part_name FROM stock_movements sm JOIN spare_parts sp ON sp.id = sm.part_id ORDER BY sm.created_at DESC LIMIT ?');
        $stmt->bindValue(1, $limit, \PDO::PARAM_INT);
        $stmt->execute();
        $movements = $stmt->fetchAll();
        $movementsTotal = (int)$pdo->query('SELECT COUNT(*) FROM stock_movements')->fetchColumn();

        return Response::json($response, [
            'parts_count' => (int)$pdo->query('SELECT COUNT(*) FROM spare_parts')->fetchColumn(),
            'equipment_count' => (int)$pdo->query('SELECT COUNT(*) FROM equipment')->fetchColumn(),
            'repairs_count' => (int)$pdo->query('SELECT COUNT(*) FROM repairs')->fetchColumn(),
            'low_stock_count' => (int)$pdo->query('SELECT COUNT(*) FROM spare_parts WHERE quantity <= min_quantity')->fetchColumn(),
            'movements' => $movements,
            'movements_total' => $movementsTotal,
        ]);
    }
}
