<?php

namespace App\Controllers;

use App\Helpers\Database;
use App\Helpers\Response;

class AdminController
{
    public function resetDemo($request, $response)
    {
        $user = $request->getAttribute('user');
        if (!$user || $user->role !== 'admin') {
            return Response::json($response, ['message' => 'Доступ запрещён'], 403);
        }

        $pdo = Database::connection();
        $pdo->beginTransaction();

        try {
            $pdo->exec('DELETE FROM repair_parts');
            $pdo->exec('DELETE FROM stock_movements');
            $pdo->exec('DELETE FROM repairs');
            $pdo->exec('DELETE FROM spare_parts');
            $pdo->exec('DELETE FROM equipment');

            $this->resetAutoIncrement($pdo, ['repair_parts', 'stock_movements', 'repairs', 'spare_parts', 'equipment']);
            $this->seedEquipment($pdo);
            $this->seedParts($pdo, (int)$user->id);

            $pdo->commit();
            return Response::json($response, ['message' => 'Тестовые данные загружены']);
        } catch (\Exception $exception) {
            $pdo->rollBack();
            return Response::json($response, ['message' => 'Не удалось загрузить тестовые данные'], 400);
        }
    }

    private function resetAutoIncrement($pdo, $tables)
    {
        foreach ($tables as $table) {
            $pdo->exec('ALTER TABLE ' . $table . ' AUTO_INCREMENT = 1');
        }
    }

    private function seedEquipment($pdo)
    {
        $rows = [
            ['EQ-001', 'Компрессорная установка'],
            ['EQ-002', 'Насос центробежный НЦ-50'],
            ['EQ-003', 'Токарный станок 16К20'],
            ['EQ-004', 'Фрезерный станок 6Р12'],
            ['EQ-005', 'Конвейерная линия №1'],
            ['EQ-006', 'Вентиляционная установка ВУ-3'],
            ['EQ-007', 'Гидравлический пресс П6320'],
            ['EQ-008', 'Электродвигатель АИР112'],
            ['EQ-009', 'Редуктор цилиндрический РЦД-250'],
            ['EQ-010', 'Сварочный аппарат ВД-306'],
        ];

        $stmt = $pdo->prepare('INSERT INTO equipment (inventory_number, name) VALUES (?, ?)');
        foreach ($rows as $row) {
            $stmt->execute($row);
        }
    }

    private function seedParts($pdo, $userId)
    {
        $rows = [
            ['BRG-205', 'Подшипник 205', 'шт', 12, 3, 'Стеллаж A1'],
            ['BRG-306', 'Подшипник 306', 'шт', 7, 2, 'Стеллаж A1'],
            ['BLT-M8', 'Болт М8x30', 'шт', 120, 30, 'Ящик B2'],
            ['BLT-M10', 'Болт М10x40', 'шт', 85, 25, 'Ящик B2'],
            ['NUT-M8', 'Гайка М8', 'шт', 140, 40, 'Ящик B3'],
            ['WSH-8', 'Шайба 8 мм', 'шт', 200, 50, 'Ящик B3'],
            ['BELT-A1200', 'Ремень клиновой A-1200', 'шт', 5, 2, 'Стеллаж C1'],
            ['BELT-B1400', 'Ремень клиновой B-1400', 'шт', 2, 2, 'Стеллаж C1'],
            ['SEAL-25X40', 'Манжета 25x40', 'шт', 10, 3, 'Стеллаж C2'],
            ['SEAL-40X60', 'Манжета 40x60', 'шт', 4, 2, 'Стеллаж C2'],
            ['OIL-I40', 'Масло индустриальное И-40А', 'л', 60, 20, 'Склад ГСМ'],
            ['GREASE-LITOL', 'Смазка Литол-24', 'кг', 18, 5, 'Склад ГСМ'],
            ['FILTER-AIR-01', 'Фильтр воздушный', 'шт', 6, 2, 'Стеллаж D1'],
            ['FILTER-OIL-01', 'Фильтр масляный', 'шт', 4, 2, 'Стеллаж D1'],
            ['CHAIN-12A', 'Цепь приводная 12A', 'м', 8, 3, 'Стеллаж E1'],
            ['SPROCKET-20', 'Звёздочка Z20', 'шт', 3, 1, 'Стеллаж E1'],
            ['SENSOR-IND', 'Датчик индуктивный', 'шт', 5, 2, 'Шкаф F1'],
            ['FUSE-10A', 'Предохранитель 10А', 'шт', 25, 10, 'Шкаф F2'],
            ['CONTACT-KM25', 'Контактор КМ-25', 'шт', 3, 1, 'Шкаф F2'],
            ['HOSE-HYD-10', 'Рукав гидравлический 10 мм', 'м', 12, 4, 'Стеллаж H1'],
        ];

        $partStmt = $pdo->prepare('INSERT INTO spare_parts (article, name, unit, quantity, min_quantity, location, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())');
        $movementStmt = $pdo->prepare('INSERT INTO stock_movements (part_id, operation_type, quantity, comment, created_by, created_at) VALUES (?, "INCOME", ?, ?, ?, NOW())');

        foreach ($rows as $row) {
            $partStmt->execute($row);
            $movementStmt->execute([$pdo->lastInsertId(), $row[3], 'Начальная загрузка тестовых данных', $userId]);
        }
    }
}
