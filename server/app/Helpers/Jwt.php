<?php

namespace App\Helpers;

class Jwt
{
    public static function encode(array $payload, $secret)
    {
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $segments = [self::base64Url(json_encode($header)), self::base64Url(json_encode($payload))];
        $signature = hash_hmac('sha256', implode('.', $segments), $secret, true);
        $segments[] = self::base64Url($signature);
        return implode('.', $segments);
    }

    public static function decode($token, $secret)
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            throw new \RuntimeException('Invalid token');
        }

        list($header, $payload, $signature) = $parts;
        $expected = self::base64Url(hash_hmac('sha256', $header . '.' . $payload, $secret, true));
        if (!hash_equals($expected, $signature)) {
            throw new \RuntimeException('Invalid signature');
        }

        $data = json_decode(self::base64UrlDecode($payload));
        if (!$data || (isset($data->exp) && $data->exp < time())) {
            throw new \RuntimeException('Token expired');
        }

        return $data;
    }

    private static function base64Url($value)
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private static function base64UrlDecode($value)
    {
        return base64_decode(strtr($value, '-_', '+/'));
    }
}
