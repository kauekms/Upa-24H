<?php
declare(strict_types=1);

namespace Upa\Repositorio;

use Upa\Modelo\AplicacaoVacina;
use Upa\Modelo\Entidade;

final class AplicacaoRepositorio extends Repositorio
{
    public function chave(): string
    {
        return 'upa_vacinacao_aplicacoes';
    }

    protected function classeEntidade(): string
    {
        return AplicacaoVacina::class;
    }

    protected function criar(array $registro): Entidade
    {
        return new AplicacaoVacina($registro);
    }

    protected function consulta(): string
    {
        return 'SELECT x.*, c.nome AS cidadao_nome, c.cpf AS cidadao_cpf, l.numero_lote, v.nome AS vacina_nome,
                       cp.nome AS campanha_nome, p.nome AS profissional_nome, u.nome AS unidade_nome
                FROM aplicacoes_vacina x
                JOIN cidadaos c ON c.id = x.cidadao_id
                LEFT JOIN lotes l ON l.id = x.lote_id
                LEFT JOIN vacinas v ON v.id = l.vacina_id
                LEFT JOIN campanhas cp ON cp.id = x.campanha_id
                LEFT JOIN profissionais p ON p.id = x.profissional_id
                LEFT JOIN unidades u ON u.id = x.unidade_id';
    }

    protected function aposGravar(Entidade $entidade, array $colunas, int $id): void
    {
        $this->catalogo->vincular('profissional_unidade', 'profissional_id', $colunas['profissional_id'], 'unidade_id', $colunas['unidade_id']);
        $this->catalogo->vincular('campanha_unidade', 'campanha_id', $colunas['campanha_id'], 'unidade_id', $colunas['unidade_id']);
    }
}
