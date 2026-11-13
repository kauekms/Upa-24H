<?php
declare(strict_types=1);

namespace Upa\Repositorio;

use Upa\Modelo\Agendamento;
use Upa\Modelo\Entidade;
use Upa\Seguranca\ControleAcesso;

final class AgendamentoRepositorio extends Repositorio
{
    public function chave(): string
    {
        return 'upa_agendamentos';
    }

    protected function classeEntidade(): string
    {
        return Agendamento::class;
    }

    protected function criar(array $registro): Entidade
    {
        return new Agendamento($registro);
    }

    protected function consulta(): string
    {
        return 'SELECT x.*, c.nome AS cidadao_nome, c.cpf AS cidadao_cpf, p.nome AS profissional_nome,
                       e.nome AS especialidade_nome, u.nome AS unidade_nome
                FROM agendamentos x
                JOIN cidadaos c ON c.id = x.cidadao_id
                LEFT JOIN profissionais p ON p.id = x.profissional_id
                LEFT JOIN especialidades e ON e.id = x.especialidade_id
                LEFT JOIN unidades u ON u.id = x.unidade_id';
    }

    /** O Cidadão só grava (aceita/recusa) agendamentos do próprio CPF. */
    protected function permitido(Entidade $entidade, array $usuario): bool
    {
        if (!ControleAcesso::ehCidadao($usuario)) {
            return true;
        }
        $cpf = self::digitos((string) $entidade->atributo('cpf'));
        return $cpf !== '' && $cpf === self::digitos($usuario['cpf'] ?? '');
    }

    /** Alimenta a associação N:N profissional x unidade com os atendimentos reais. */
    protected function aposGravar(Entidade $entidade, array $colunas, int $id): void
    {
        $this->catalogo->vincular('profissional_unidade', 'profissional_id', $colunas['profissional_id'], 'unidade_id', $colunas['unidade_id']);
    }
}
