<?php
declare(strict_types=1);

namespace Upa\Modelo;

use Upa\Repositorio\Catalogo;

/** Campanha de vacinação (tabela campanhas). */
final class Campanha extends Entidade
{
    public static function tabela(): string
    {
        return 'campanhas';
    }

    public function colunas(Catalogo $catalogo): ?array
    {
        $a = $this->atributos;
        $nome = self::texto($a['nome'] ?? null, 120);
        $vacina = $catalogo->vacina(self::texto($a['vacina'] ?? null, 80));
        if ($this->codigo() === null || $nome === null || $vacina === null) {
            return null;
        }
        return [
            'codigo'       => $this->codigo(),
            'nome'         => $nome,
            'vacina_id'    => $vacina,
            'publico_alvo' => self::texto($a['publicoAlvo'] ?? null, 150),
            'data_inicio'  => self::data($a['dataInicio'] ?? null),
            'data_fim'     => self::data($a['dataFim'] ?? null),
            'meta'         => self::inteiro($a['meta'] ?? null) ?? 0,
            'status'       => self::texto($a['status'] ?? null, 20) ?? 'Ativa',
            'dados'        => self::json($a),
        ];
    }

    public static function paraApp(array $linha): array
    {
        return self::mesclar($linha['dados'] ?? null, [
            'id'          => $linha['codigo'],
            'nome'        => $linha['nome'],
            'vacina'      => $linha['vacina_nome'],
            'publicoAlvo' => $linha['publico_alvo'],
            'dataInicio'  => self::dataParaApp($linha['data_inicio']),
            'dataFim'     => self::dataParaApp($linha['data_fim']),
            'meta'        => (int) $linha['meta'],
            'status'      => $linha['status'],
        ]);
    }
}
