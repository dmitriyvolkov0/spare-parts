<?php

namespace App\Helpers;

use PDO;

class Database
{
    private static $pdo;

    public static function connection()
    {
        if (self::$pdo) {
            return self::$pdo;
        }

        $config = require __DIR__ . '/../../config/database.php';
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $config['host'], $config['database'], $config['charset']);

        self::$pdo = new PDO($dsn, $config['user'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        return self::$pdo;
    }
}
