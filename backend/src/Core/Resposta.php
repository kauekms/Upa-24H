<?php
declare(strict_types=1);

namespace Upa\Core;

/** Envia respostas JSON padronizadas: { success, ... }. */
final class Resposta
{
    public static function json(array $corpo, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        echo json_encode($corpo, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public static function erro(string $mensagem, int $status): void
    {
        self::json(['success' => false, 'message' => $mensagem, 'error' => $mensagem], $status);
    }
}
