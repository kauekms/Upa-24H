<?php
declare(strict_types=1);

namespace Upa\Repositorio;

use Upa\Modelo\Consulta;
use Upa\Modelo\Entidade;

final class ConsultaRepositorio extends Repositorio
{
    public function chave(): string
    {
        return 'upa_consultas';
    }

    protected function classeEntidade(): string
    {
        return Consulta::class;
    }

    protected function criar(array $registro): Entidade
    {
        return new Consulta($registro);
    }

    protected function consulta(): string
    {
        return 'SELECT x.*, c.nome AS cidadao_nome, p.nome AS profissional_nome, e.nome AS especialidade_nome
                FROM consultas x
                JOIN cidadaos c ON c.id = x.cidadao_id
                LEFT JOIN profissionais p ON p.id = x.profissional_id
                LEFT JOIN especialidades e ON e.id = x.especialidade_id';
    }
}
