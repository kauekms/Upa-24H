<?php
declare(strict_types=1);

namespace Upa\Modelo;

use Upa\Repositorio\Catalogo;

/** Consulta realizada (tabela consultas). */
final class Consulta extends Entidade
{
    public static function tabela(): string
    {
        return 'consultas';
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
            'data'             => self::data($a['data'] ?? null),
            'inicio'           => self::hora($a['inicio'] ?? null),
            'status'           => self::texto($a['status'] ?? null, 30) ?? 'Agendada',
            'cid'              => self::texto($a['cid'] ?? null, 10),
            'dados'            => self::json($a),
        ];
    }

    public static function paraApp(array $linha): array
    {
        return self::mesclar($linha['dados'] ?? null, [
            'id'            => $linha['codigo'],
            'paciente'      => $linha['cidadao_nome'],
            'data'          => self::dataParaApp($linha['data']),
            'inicio'        => self::horaParaApp($linha['inicio']),
            'especialidade' => $linha['especialidade_nome'],
            'medico'        => $linha['profissional_nome'],
            'status'        => $linha['status'],
        ]);
    }
}
