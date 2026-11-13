<?php
declare(strict_types=1);

namespace Upa\Core;

use PDO;

/**
 * Conexão única (Singleton) com o MySQL via PDO.
 * Todas as consultas do sistema usam prepared statements a partir daqui.
 */
final class BancoDeDados
{
    private static ?PDO $conexao = null;

    private function __construct()
    {
    }

    public static function conexao(): PDO
    {
        if (self::$conexao === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
                Configuracao::obter('db.host'),
                Configuracao::obter('db.porta'),
                Configuracao::obter('db.banco')
            );
            self::$conexao = new PDO($dsn, Configuracao::obter('db.usuario'), Configuracao::obter('db.senha'), [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        }
        return self::$conexao;
    }
}
