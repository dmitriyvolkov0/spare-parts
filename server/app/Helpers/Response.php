<?php

namespace App\Helpers;

use Psr\Http\Message\ResponseInterface;

class Response
{
    public static function json(ResponseInterface $response, $data, $status = 200)
    {
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
