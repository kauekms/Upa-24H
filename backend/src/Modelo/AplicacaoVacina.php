<?php
declare(strict_types=1);

namespace Upa\Modelo;

use Upa\Repositorio\Catalogo;

/** Dose de vacina aplicada num cidadão (tabela aplicacoes_vacina). */
final class AplicacaoVacina extends Entidade
{
    public static function tabela(): string
    {
        return 'aplicacoes_vacina';
    }

    public function colunas(Catalogo $catalogo): ?array
    {
        $a = $this->atributos;
        $nome = self::texto($a['cidadao'] ?? $a['paciente'] ?? null, 120);
        $cidadao = $catalogo->cidadao($nome, self::texto($a['cpf'] ?? null, 14));
        if ($this->codigo() === null || $cidadao === null) {
            return null;
        }
        $unidade = $catalogo->unidade(self::texto($a['unidade'] ?? null));
        return [
            'codigo'          => $this->codigo(),
            'cidadao_id'      => $cidadao,
            'lote_id'         => $catalogo->lote(self::texto($a['lote'] ?? null, 40), $unidade),
            'campanha_id'     => $catalogo->campanha(self::texto($a['campanha'] ?? null, 120)),
            'profissional_id' => $catalogo->profissional(self::texto($a['profissional'] ?? null)),
            'unidade_id'      => $unidade,
            'dose'            => self::texto($a['dose'] ?? null, 30),
            'data_hora'       => self::dataHora($a['dataHora'] ?? (($a['data'] ?? '') . ' ' . ($a['hora'] ?? ''))),
            'dados'           => self::json($a),
        ];
    }

    public static function paraApp(array $linha): array
    {
        return self::mesclar($linha['dados'] ?? null, [
            'id'           => $linha['codigo'],
            'cidadao'      => $linha['cidadao_nome'],
            'paciente'     => $linha['cidadao_nome'],
            'cpf'          => $linha['cidadao_cpf'],
            'lote'         => $linha['numero_lote'],
            'vacina'       => $linha['vacina_nome'],
            'campanha'     => $linha['campanha_nome'],
            'profissional' => $linha['profissional_nome'],
            'unidade'      => $linha['unidade_nome'],
            'dose'         => $linha['dose'],
        ]);
    }
}
