<?php
declare(strict_types=1);

namespace Upa\Repositorio;

use PDO;
use Throwable;
use Upa\Modelo\Entidade;
use Upa\Seguranca\ControleAcesso;

/**
 * Repositório base: grava e lê uma coleção da aplicação nas tabelas relacionais.
 *
 * - sincronizar(): recebe a lista enviada pela aplicação e faz "upsert" de
 *   cada registro (INSERT ... ON DUPLICATE KEY UPDATE), numa transação.
 *   Registros nunca são apagados por sincronização.
 * - listar(): SELECT com JOINs devolvendo os registros no formato da aplicação,
 *   filtrados conforme o perfil (o Cidadão só recebe os próprios dados).
 */
abstract class Repositorio
{
    public function __construct(protected PDO $pdo, protected Catalogo $catalogo)
    {
    }

    /** Chave da coleção usada pela aplicação (ex.: "upa_agendamentos"). */
    abstract public function chave(): string;

    /** Cria a entidade a partir de um registro da aplicação. */
    abstract protected function criar(array $registro): Entidade;

    /** Classe da entidade (para tabela() e paraApp()). */
    abstract protected function classeEntidade(): string;

    /** SELECT com os JOINs da listagem, sem WHERE nem ORDER BY. */
    abstract protected function consulta(): string;

    protected function ordem(): string
    {
        return 'ORDER BY x.id';
    }

    /** Coluna que liga o registro ao cidadão (null = coleção não visível ao Cidadão). */
    protected function colunaCidadao(): ?string
    {
        return 'x.cidadao_id';
    }

    public function vazia(): bool
    {
        $tabela = ($this->classeEntidade())::tabela();
        return (int) $this->pdo->query("SELECT COUNT(*) FROM $tabela")->fetchColumn() === 0;
    }

    public function listar(array $usuario): array
    {
        $sql = $this->consulta();
        $parametros = [];
        if (ControleAcesso::ehCidadao($usuario)) {
            $coluna = $this->colunaCidadao();
            $cidadao = $this->catalogo->cidadaoDoUsuario($usuario);
            if ($coluna === null || $cidadao === null) {
                return [];
            }
            $sql .= " WHERE $coluna = :cidadao";
            $parametros['cidadao'] = $cidadao;
        }
        $st = $this->pdo->prepare($sql . ' ' . $this->ordem());
        $st->execute($parametros);
        $classe = $this->classeEntidade();
        return array_map([$classe, 'paraApp'], $st->fetchAll());
    }

    /** @return int quantidade de registros gravados */
    public function sincronizar(array $lista, array $usuario): int
    {
        $gravados = 0;
        $this->pdo->beginTransaction();
        try {
            foreach ($lista as $registro) {
                if (!is_array($registro)) {
                    continue;
                }
                $entidade = $this->criar($registro);
                if (!$this->permitido($entidade, $usuario)) {
                    continue;
                }
                $colunas = $entidade->colunas($this->catalogo);
                if ($colunas === null) {
                    continue;
                }
                $colunas = $this->ajustar($colunas, $usuario);
                $id = $this->gravar($colunas);
                $this->aposGravar($entidade, $colunas, $id);
                $gravados++;
            }
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
        return $gravados;
    }

    /** O usuário pode gravar este registro? (o Cidadão, por exemplo, só os próprios) */
    protected function permitido(Entidade $entidade, array $usuario): bool
    {
        return !ControleAcesso::ehCidadao($usuario);
    }

    /** Ajuste final das colunas conforme quem grava (ex.: impedir troca de perfil). */
    protected function ajustar(array $colunas, array $usuario): array
    {
        return $colunas;
    }

    /** Upsert pela chave única "codigo"; devolve o id da linha. */
    protected function gravar(array $colunas): int
    {
        $tabela = ($this->classeEntidade())::tabela();
        $nomes = array_keys($colunas);
        $atualizar = implode(', ', array_map(fn ($c) => "$c = VALUES($c)", $nomes));
        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s) ON DUPLICATE KEY UPDATE %s, id = LAST_INSERT_ID(id)',
            $tabela,
            implode(', ', $nomes),
            implode(', ', array_map(fn ($c) => ":$c", $nomes)),
            $atualizar
        );
        $this->pdo->prepare($sql)->execute($colunas);
        return (int) $this->pdo->lastInsertId();
    }

    /** Gancho para manter tabelas associativas (N:N) após gravar. */
    protected function aposGravar(Entidade $entidade, array $colunas, int $id): void
    {
    }

    protected static function digitos(?string $valor): string
    {
        return preg_replace('/\D/', '', (string) $valor);
    }
}
