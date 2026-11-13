<?php
declare(strict_types=1);

namespace Upa\Repositorio;

use Upa\Modelo\Entidade;
use Upa\Modelo\Exame;

final class ExameRepositorio extends Repositorio
{
    public function chave(): string
    {
        return 'upa_exames';
    }

    protected function classeEntidade(): string
    {
        return Exame::class;
    }

    protected function criar(array $registro): Entidade
    {
        return new Exame($registro);
    }

    protected function consulta(): string
    {
        return 'SELECT x.*, c.nome AS cidadao_nome, c.cpf AS cidadao_cpf, t.nome AS tipo_nome,
                       u.nome AS unidade_nome, p.nome AS solicitante_nome
                FROM exames x
                JOIN cidadaos c ON c.id = x.cidadao_id
                JOIN tipos_exame t ON t.id = x.tipo_exame_id
                LEFT JOIN unidades u ON u.id = x.unidade_id
                LEFT JOIN profissionais p ON p.id = x.solicitante_id';
    }
}
