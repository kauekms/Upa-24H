<?php
declare(strict_types=1);

namespace Upa\Seguranca;

use Upa\Core\Configuracao;
use Upa\Core\HttpException;

/**
 * Sessão do usuário autenticado (cookie HttpOnly do PHP).
 * Expira após o tempo de inatividade definido em config.php.
 */
final class Sessao
{
    public static function iniciar(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        session_name((string) Configuracao::obter('sessao.nome', 'UPA24H_SESSAO'));
        session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'path' => '/']);
        session_start();

        $limite = (int) Configuracao::obter('sessao.expira_minutos', 60) * 60;
        if (isset($_SESSION['ultima_atividade']) && time() - (int) $_SESSION['ultima_atividade'] > $limite) {
            self::sair();
            session_start();
        }
        $_SESSION['ultima_atividade'] = time();
    }

    /** Dados do usuário logado: id, codigo, nome, cpf, perfil. */
    public static function usuario(): ?array
    {
        return $_SESSION['usuario'] ?? null;
    }

    public static function entrar(array $usuario): void
    {
        session_regenerate_id(true);
        $_SESSION['usuario'] = $usuario;
        $_SESSION['ultima_atividade'] = time();
    }

    public static function sair(): void
    {
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
    }

    /** Garante que há usuário logado; caso contrário responde 401. */
    public static function exigirLogin(): array
    {
        $usuario = self::usuario();
        if ($usuario === null) {
            throw new HttpException(401, 'Sessão expirada ou inexistente. Faça login novamente.');
        }
        return $usuario;
    }
}
