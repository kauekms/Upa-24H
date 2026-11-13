<?php
declare(strict_types=1);

namespace Upa\Seguranca;

/**
 * Hash de senha PBKDF2-SHA256, no mesmo formato gerado pelo navegador
 * (js/api/crypto.js): "pbkdf2:<iterações>:<salt base64>:<hash base64>".
 * Assim a mesma senha é aceita pelo servidor e pela aplicação.
 */
final class Senha
{
    private const PREFIXO = 'pbkdf2';
    private const ITERACOES = 100000;

    public static function ehHash(string $valor): bool
    {
        return (bool) preg_match('#^pbkdf2:\d+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$#', $valor);
    }

    public static function gerarHash(string $senha): string
    {
        $salt = random_bytes(16);
        $hash = hash_pbkdf2('sha256', $senha, $salt, self::ITERACOES, 32, true);
        return sprintf('%s:%d:%s:%s', self::PREFIXO, self::ITERACOES, base64_encode($salt), base64_encode($hash));
    }

    public static function verificar(string $senha, string $armazenado): bool
    {
        if (!self::ehHash($armazenado)) {
            return false; // o banco nunca aceita senha em texto puro
        }
        [, $iteracoes, $salt, $esperado] = explode(':', $armazenado);
        $calculado = hash_pbkdf2('sha256', $senha, (string) base64_decode($salt), (int) $iteracoes, 32, true);
        return hash_equals((string) base64_decode($esperado), $calculado);
    }

    /** Recebe o valor vindo da aplicação: mantém se já for hash, senão gera o hash. */
    public static function normalizar(?string $valor): ?string
    {
        if ($valor === null || $valor === '') {
            return null;
        }
        return self::ehHash($valor) ? $valor : self::gerarHash($valor);
    }
}
