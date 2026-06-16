<?php

namespace App\Controllers;

use App\Helpers\Response;

class AiController
{
    public function repairDescription($request, $response)
    {
        $user = $request->getAttribute('user');
        if (!$user || !in_array($user->role, ['admin', 'technician'], true)) {
            return Response::json($response, ['message' => 'Доступ запрещён'], 403);
        }

        $data = (array)$request->getParsedBody();
        if (!$this->hasContext($data)) {
            return Response::json($response, ['message' => 'Укажите данные ремонта для генерации описания'], 400);
        }

        $prompt = $this->buildPrompt($data);

        $errors = [];

        try {
            $description = $this->callQwen($prompt);
            error_log('AI repair description provider: Qwen');
        } catch (\Exception $exception) {
            $errors[] = 'Qwen: ' . $exception->getMessage();
            error_log('AI repair description provider Qwen failed: ' . $exception->getMessage());
            try {
                $description = $this->callJimmy($prompt);
                error_log('AI repair description provider: ChatJimmy');
            } catch (\Exception $fallbackException) {
                $errors[] = 'ChatJimmy: ' . $fallbackException->getMessage();
                error_log('AI repair description provider ChatJimmy failed: ' . $fallbackException->getMessage());
                return Response::json($response, ['message' => 'Не удалось сгенерировать описание. ' . implode(' ', $errors)], 400);
            }
        }

        return Response::json($response, ['description' => $this->normalizeDescription($description)]);
    }

    private function hasContext($data)
    {
        return !empty($data['equipment_name']) || !empty($data['repair_date']) || !empty($data['description']) || !empty($data['parts']);
    }

    private function buildPrompt($data)
    {
        $parts = isset($data['parts']) && is_array($data['parts']) ? $data['parts'] : [];
        $partLines = [];

        foreach ($parts as $part) {
            if (empty($part['name']) && empty($part['article'])) {
                continue;
            }
            $partLines[] = sprintf(
                '- %s%s, количество: %s %s',
                !empty($part['article']) ? $part['article'] . ' ' : '',
                $part['name'] ?? '',
                $part['quantity'] ?? '',
                $part['unit'] ?? ''
            );
        }

        return "Сформируй описание выполненного ремонта производственного оборудования в стиле записей ремонтного журнала.\n" .
            "Ответ должен состоять строго из 3 коротких строк без нумерации, заголовков и markdown.\n" .
            "Строка 1: обнаруженная неисправность или причина ремонта. Если точная причина не указана, сформулируй нейтрально: 'В ходе осмотра выявлена необходимость обслуживания оборудования.'.\n" .
            "Строка 2: выполненные работы и заменённые комплектующие. Используй только переданные комплектующие.\n" .
            "Строка 3: итог ремонта, например восстановление работоспособности или пробный запуск.\n" .
            "Не добавляй лишние подробности, которых нет во входных данных.\n\n" .
            "Примеры хорошего стиля:\n" .
            "Обнаружен износ приводного ремня.\nПроизведена замена ремня A-1250.\nРаботоспособность оборудования восстановлена.\n\n" .
            "Во время работы станка появился посторонний шум в области шпинделя.\nВыполнена замена двух подшипников SKF 6205.\nПосле ремонта проведён пробный запуск.\n\n" .
            "Оборудование: " . ($data['equipment_name'] ?? 'не указано') . "\n" .
            "Дата ремонта: " . ($data['repair_date'] ?? 'не указана') . "\n" .
            "Черновик пользователя: " . ($data['description'] ?? 'не указан') . "\n" .
            "Использованные комплектующие:\n" . (!empty($partLines) ? implode("\n", $partLines) : 'не указаны');
    }

    private function normalizeDescription($description)
    {
        $description = trim(str_replace(["\r\n", "\r"], "\n", $description));
        $description = trim($description, " \t\n\r\0\x0B\"'`“”«»");
        $lines = array_filter(array_map(function ($line) {
            $line = preg_replace('/^[-*\d.)\s]+/u', '', trim($line));
            return trim($line);
        }, explode("\n", $description)));

        return implode("\n", array_slice($lines, 0, 3));
    }

    private function callQwen($prompt)
    {
        $token = getenv('QWEN_API_TOKEN') ?: '';
        if ($token === '') {
            throw new \RuntimeException('Qwen token is not configured');
        }

        return $this->chatCompletion(
            getenv('QWEN_API_URL') ?: 'https://qwen.aikit.club/v1/chat/completions',
            $token,
            getenv('QWEN_MODEL') ?: 'qwen-max-latest',
            $prompt
        );
    }

    private function callJimmy($prompt)
    {
        $token = getenv('JIMMY_API_TOKEN') ?: 'tarun-spare-parts';

        return $this->chatCompletion(
            getenv('JIMMY_API_URL') ?: 'https://jimmy.aikit.club/v1/chat/completions',
            $token,
            getenv('JIMMY_MODEL') ?: 'llama3.1-8B',
            $prompt
        );
    }

    private function chatCompletion($url, $token, $model, $prompt)
    {
        $body = json_encode([
            'model' => $model,
            'messages' => [
                ['role' => 'system', 'content' => 'Ты помощник ремонтного подразделения. Пиши только готовое описание ремонта на русском языке, без пояснений, markdown и списков.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'stream' => false,
        ], JSON_UNESCAPED_UNICODE);

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/json\r\nAuthorization: Bearer " . $token . "\r\n",
                'content' => $body,
                'timeout' => 30,
                'ignore_errors' => true,
            ],
        ]);

        $raw = @file_get_contents($url, false, $context);
        $statusLine = isset($http_response_header[0]) ? $http_response_header[0] : '';
        $statusCode = 0;
        if (preg_match('/\s(\d{3})\s/', $statusLine, $matches)) {
            $statusCode = (int)$matches[1];
        }

        if ($raw === false) {
            throw new \RuntimeException('запрос к провайдеру не выполнен');
        }

        $json = json_decode($raw, true);
        if ($statusCode >= 400) {
            $message = $json['error']['message'] ?? $json['message'] ?? ('HTTP ' . $statusCode);
            throw new \RuntimeException($message);
        }

        $content = $json['choices'][0]['message']['content'] ?? '';
        if (trim($content) === '') {
            $message = $json['error']['message'] ?? $json['message'] ?? 'пустой ответ провайдера';
            throw new \RuntimeException($message);
        }

        return $content;
    }
}
