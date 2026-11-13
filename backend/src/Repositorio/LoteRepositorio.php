<?php
declare(strict_types=1);

namespace Upa\Repositorio;

use Upa\Modelo\Entidade;
use Upa\Modelo\Lote;

/** Estoque de vacinas (coleção "upa_vacinacao_estoque" da aplicação). */
final class LoteRepositorio extends Repositorio
{
    public function chave(): string
    {
        return 'upa_vacinacao_estoque';
    }

    protected function classeEntidade(): string
    {
        return Lote::class;
    }

    protected function criar(array $registro): Entidade
    {
        return new Lote($registro);
    }

    protected function consulta(): string
    {
        return 'SELECT x.*, v.nome AS vacina_nome, u.nome AS unidade_nome
                FROM lotes x
                JOIN vacinas v ON v.id = x.vacina_id
                JOIN unidades u ON u.id = x.unidade_id';
    }

    /** Estoque é informação interna: não é enviado ao Cidadão. */
    protected function colunaCidadao(): ?string
    {
        return null;
    }
}
