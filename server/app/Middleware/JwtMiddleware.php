<?php

namespace App\Middleware;

use App\Helpers\Response;
use App\Helpers\Jwt;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class JwtMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $header = $request->getHeaderLine('Authorization');

        if (!preg_match('/Bearer\s+(.*)$/i', $header, $matches)) {
            return Response::json(new \Slim\Psr7\Response(), ['message' => 'Требуется авторизация'], 401);
        }

        try {
            $config = require __DIR__ . '/../../config/database.php';
            $payload = Jwt::decode($matches[1], $config['jwt_secret']);
            return $handler->handle($request->withAttribute('user', $payload));
        } catch (\Exception $exception) {
            return Response::json(new \Slim\Psr7\Response(), ['message' => 'Недействительный токен'], 401);
        }
    }
}
