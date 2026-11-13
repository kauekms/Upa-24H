<?php
declare(strict_types=1);

namespace Upa\Modelo;

use Upa\Repositorio\Catalogo;

/** Agendamento de atendimento (tabela agendamentos). */
final class Agendamento extends Entidade
{
    public static function tabela(): string
    {
        return 'agendamentos';
    }

    public function colunas(Catalogo $catalogo): ?array
    {
        $a = $this->atributos;
        $cidadao = $catalogo->cidadao(self::texto($a['paciente'] ?? null, 120), self::texto($a['cpf'] ?? null, 14));
        if ($this->codigo() === null || $cidadao === null) {
            return null;
        }
        $especialidade = self::texto($a['especialidade'] ?? null);
        return [
            'codigo'           => $this->codigo(),
            'cidadao_id'       => $cidadao,
            'profissional_id'  => $catalogo->profissional(self::texto($a['medico'] ?? null), $especialidade),
            'especialidade_id' => $catalogo->especialidade($especialidade),
            'unidade_id'       => $catalogo->unidade(self::texto($a['unidade'] ?? null)),
            'data'             => self::data($a['data'] ?? null),
            'horario'          => self::hora($a['horario'] ?? null),
            'status'           => self::texto($a['status'] ?? null, 30) ?? 'Pendente',
            'dados'            => self::json($a),
        ];
    }

    public static function paraApp(array $linha): array
    {
        return self::mesclar($linha['dados'] ?? null, [
            'id'            => $linha['codigo'],
            'paciente'      => $linha['cidadao_nome'],
            'cpf'           => $linha['cidadao_cpf'],
            'data'          => self::dataParaApp($linha['data']),
            'horario'       => self::horaParaApp($linha['horario']),
            'especialidade' => $linha['especialidade_nome'],
            'medico'        => $linha['profissional_nome'],
            'unidade'       => $linha['unidade_nome'],
            'status'        => $linha['status'],
        ]);
    }
}
