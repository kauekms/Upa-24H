<?php
declare(strict_types=1);

namespace Upa\Core;

/** Acesso de leitura às configurações de backend/config.php (carregadas uma única vez). */
final class Configuracao
{
    private static ?array $valores = null;

    public static function obter(string $caminho, mixed $padrao = null): mixed
    {
        self::$valores ??= require __DIR__ . '/../../config.php';
        $atual = self::$valores;
        foreach (explode('.', $caminho) as $parte) {
            if (!is_array($atual) || !array_key_exists($parte, $atual)) {
                return $padrao;
            }
            $atual = $atual[$parte];
        }
        return $atual;
    }
}
