<?php
declare(strict_types=1);

namespace Upa\Modelo;

use Upa\Repositorio\Catalogo;

/** Lote de vacina em estoque numa unidade (tabela lotes). */
final class Lote extends Entidade
{
    public static function tabela(): string
    {
        return 'lotes';
    }

    public function colunas(Catalogo $catalogo): ?array
    {
        $a = $this->atributos;
        $numero = self::texto($a['lote'] ?? null, 40);
        $vacina = $catalogo->vacina(self::texto($a['vacina'] ?? null, 80));
        $unidade = $catalogo->unidade(self::texto($a['unidade'] ?? null));
        if ($this->codigo() === null || $numero === null || $vacina === null || $unidade === null) {
            return null;
        }
        return [
            'codigo'         => $this->codigo(),
            'numero_lote'    => $numero,
            'vacina_id'      => $vacina,
            'unidade_id'     => $unidade,
            'quantidade'     => (int) ($a['quantidade'] ?? 0),
            'estoque_minimo' => max(0, (int) ($a['estoqueMinimo'] ?? 0)),
            'validade'       => self::data($a['validade'] ?? null),
            'dados'          => self::json($a),
        ];
    }

    public static function paraApp(array $linha): array
    {
        return self::mesclar($linha['dados'] ?? null, [
            'id'            => $linha['codigo'],
            'lote'          => $linha['numero_lote'],
            'vacina'        => $linha['vacina_nome'],
            'unidade'       => $linha['unidade_nome'],
            'quantidade'    => (int) $linha['quantidade'],
            'estoqueMinimo' => (int) $linha['estoque_minimo'],
            'validade'      => self::dataParaApp($linha['validade']),
        ]);
    }
}
