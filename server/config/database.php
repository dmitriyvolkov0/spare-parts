<?php

return [
    'host' => getenv('DB_HOST') ?: '127.0.0.1',
    'database' => getenv('DB_NAME') ?: 'auto_spare',
    'user' => getenv('DB_USER') ?: 'root',
    'password' => getenv('DB_PASSWORD') ?: '',
    'charset' => 'utf8mb4',
    'jwt_secret' => getenv('JWT_SECRET') ?: 'change_this_secret',
];
