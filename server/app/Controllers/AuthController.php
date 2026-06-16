<?php

namespace App\Controllers;

use App\Helpers\Database;
use App\Helpers\Jwt;
use App\Helpers\Response;

class AuthController
{
    public function login($request, $response)
    {
        $data = (array)$request->getParsedBody();
        $stmt = Database::connection()->prepare('SELECT * FROM users WHERE login = ? LIMIT 1');
        $stmt->execute([$data['login'] ?? '']);
        $user = $stmt->fetch();

        if (!$user || !password_verify($data['password'] ?? '', $user['password'])) {
            return Response::json($response, ['message' => 'Неверный логин или пароль'], 401);
        }

        $config = require __DIR__ . '/../../config/database.php';
        $payload = [
            'id' => (int)$user['id'],
            'login' => $user['login'],
            'role' => $user['role'],
            'iat' => time(),
            'exp' => time() + 86400,
        ];

        unset($user['password']);
        return Response::json($response, ['token' => Jwt::encode($payload, $config['jwt_secret']), 'user' => $user]);
    }
}
