<?php
declare(strict_types=1);

namespace Upa\Repositorio;

use Upa\Modelo\Entidade;
use Upa\Modelo\LogAuditoria;
use Upa\Seguranca\ControleAcesso;

/**
 * Trilha de auditoria: os registros só são inseridos (INSERT IGNORE pela
 * assinatura do evento), nunca alterados ou apagados pela aplicação.
 */
final class LogRepositorio extends Repositorio
{
    private const LIMITE_LISTAGEM = 2000;

    public function chave(): string
    {
        return 'upa_logs';
    }

    protected function classeEntidade(): string
    {
        return LogAuditoria::class;
    }

    protected function criar(array $registro): Entidade
    {
        return new LogAuditoria($registro);
    }

    protected function consulta(): string
    {
        return 'SELECT x.* FROM logs_auditoria x';
    }

    /** Somente o Administrador lê a auditoria (tela "Logs de Sistema"). */
    public function listar(array $usuario): array
    {
        if (!ControleAcesso::ehAdministrador($usuario)) {
            return [];
        }
        $st = $this->pdo->query($this->consulta() . ' ORDER BY x.data_hora DESC, x.id DESC LIMIT ' . self::LIMITE_LISTAGEM);
        return array_map([LogAuditoria::class, 'paraApp'], $st->fetchAll());
    }

    /** Qualquer usuário logado registra as próprias ações. */
    protected function permitido(Entidade $entidade, array $usuario): bool
    {
        return true;
    }

    protected function gravar(array $colunas): int
    {
        $nomes = array_keys($colunas);
        $sql = sprintf(
            'INSERT IGNORE INTO logs_auditoria (%s) VALUES (%s)',
            implode(', ', $nomes),
            implode(', ', array_map(fn ($c) => ":$c", $nomes))
        );
        $this->pdo->prepare($sql)->execute($colunas);
        return (int) $this->pdo->lastInsertId();
    }
}
