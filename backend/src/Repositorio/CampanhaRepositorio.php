<?php
declare(strict_types=1);

namespace Upa\Repositorio;

use Upa\Modelo\Campanha;
use Upa\Modelo\Entidade;

final class CampanhaRepositorio extends Repositorio
{
    public function chave(): string
    {
        return 'upa_vacinacao_campanhas';
    }

    protected function classeEntidade(): string
    {
        return Campanha::class;
    }

    protected function criar(array $registro): Entidade
    {
        return new Campanha($registro);
    }

    protected function consulta(): string
    {
        return 'SELECT x.*, v.nome AS vacina_nome FROM campanhas x JOIN vacinas v ON v.id = x.vacina_id';
    }

    /** Campanhas são públicas: o Cidadão também as recebe. */
    public function listar(array $usuario): array
    {
        $st = $this->pdo->query($this->consulta() . ' ' . $this->ordem());
        return array_map([Campanha::class, 'paraApp'], $st->fetchAll());
    }

    /** Campanha nova é municipal: participa de todas as unidades (N:N campanha x unidade). */
    protected function aposGravar(Entidade $entidade, array $colunas, int $id): void
    {
        $existe = $this->pdo->prepare('SELECT COUNT(*) FROM campanha_unidade WHERE campanha_id = ?');
        $existe->execute([$id]);
        if ((int) $existe->fetchColumn() > 0) {
            return;
        }
        foreach ($this->pdo->query('SELECT id FROM unidades')->fetchAll() as $u) {
            $this->catalogo->vincular('campanha_unidade', 'campanha_id', $id, 'unidade_id', (int) $u['id']);
        }
    }
}
