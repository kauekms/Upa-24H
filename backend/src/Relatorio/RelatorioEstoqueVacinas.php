<?php
declare(strict_types=1);

namespace Upa\Relatorio;

/**
 * Relatório MESTRE-DETALHE: Estoque de vacinas por lote.
 *
 * Mestre ..: lotes JOIN vacinas, unidades (com COUNT das aplicações)
 * Detalhe .: aplicacoes_vacina JOIN cidadaos, profissionais (doses daquele lote)
 */
final class RelatorioEstoqueVacinas extends Relatorio
{
    public static function tipo(): string
    {
        return 'estoque-vacinas';
    }

    public function titulo(): string
    {
        return 'Estoque de vacinas por lote';
    }

    public function descricao(): string
    {
        return 'Mestre-detalhe: cada lote em estoque com a situação e as doses aplicadas dele.';
    }

    public function filtrosDescritos(): array
    {
        return array_filter([
            'Unidade' => $this->filtro('unidade'),
            'Vacina' => $this->filtro('vacina'),
        ]);
    }

    public function gerar(): array
    {
        $onde = [];
        $p = [];
        if ($v = $this->filtro('unidade')) {
            $onde[] = 'un.nome = :unidade';
            $p['unidade'] = $v;
        }
        if ($v = $this->filtro('vacina')) {
            $onde[] = 'v.nome = :vacina';
            $p['vacina'] = $v;
        }

        $lotes = $this->consultar(
            'SELECT l.id, l.numero_lote, v.nome AS vacina, un.nome AS unidade, l.quantidade,
                    GREATEST(l.estoque_minimo, v.estoque_minimo) AS minimo, l.validade,
                    COUNT(ap.id) AS doses_aplicadas
             FROM lotes l
             JOIN vacinas v ON v.id = l.vacina_id
             JOIN unidades un ON un.id = l.unidade_id
             LEFT JOIN aplicacoes_vacina ap ON ap.lote_id = l.id'
            . ($onde ? ' WHERE ' . implode(' AND ', $onde) : '')
            . ' GROUP BY l.id, l.numero_lote, v.nome, un.nome, l.quantidade, l.estoque_minimo, v.estoque_minimo, l.validade
               ORDER BY un.nome, v.nome, l.validade',
            $p
        );

        $detalhe = $this->pdo->prepare(
            'SELECT ap.data_hora, c.nome AS cidadao, c.cpf, ap.dose, p.nome AS profissional
             FROM aplicacoes_vacina ap
             JOIN cidadaos c ON c.id = ap.cidadao_id
             LEFT JOIN profissionais p ON p.id = ap.profissional_id
             WHERE ap.lote_id = ? ORDER BY ap.data_hora'
        );

        $hoje = date('Y-m-d');
        $resultado = [];
        foreach ($lotes as $l) {
            $detalhe->execute([$l['id']]);
            $l['situacao'] = match (true) {
                (int) $l['quantidade'] <= 0 => 'Esgotado',
                $l['validade'] !== null && $l['validade'] < $hoje => 'Vencido',
                (int) $l['quantidade'] <= (int) $l['minimo'] => 'Estoque baixo',
                default => 'Regular',
            };
            $resultado[] = ['lote' => $l, 'aplicacoes' => $detalhe->fetchAll()];
        }

        return [
            'lotes' => $resultado,
            'totalDoses' => array_sum(array_map(fn ($r) => max(0, (int) $r['lote']['quantidade']), $resultado)),
            'alertas' => count(array_filter($resultado, fn ($r) => $r['lote']['situacao'] !== 'Regular')),
        ];
    }

    public function corpoHtml(array $dados): string
    {
        $html = '<div class="totais">'
            . '<div><span>Lotes</span><strong>' . count($dados['lotes']) . '</strong></div>'
            . '<div><span>Doses em estoque</span><strong>' . (int) $dados['totalDoses'] . '</strong></div>'
            . '<div><span>Lotes com alerta</span><strong>' . (int) $dados['alertas'] . '</strong></div>'
            . '</div>';

        if (!$dados['lotes']) {
            return $html . '<p class="vazio">Nenhum lote encontrado para os filtros informados.</p>';
        }
        foreach ($dados['lotes'] as $r) {
            $l = $r['lote'];
            $classe = $l['situacao'] === 'Regular' ? 'ok' : 'alerta';
            $html .= '<section class="mestre">'
                . '<div class="mestre-cabecalho"><h2>' . self::e($l['vacina']) . ' · Lote ' . self::e($l['numero_lote']) . '</h2>'
                . '<dl>'
                . '<div><dt>Unidade</dt><dd>' . self::e($l['unidade']) . '</dd></div>'
                . '<div><dt>Em estoque</dt><dd>' . (int) $l['quantidade'] . ' dose(s)</dd></div>'
                . '<div><dt>Mínimo</dt><dd>' . (int) $l['minimo'] . '</dd></div>'
                . '<div><dt>Validade</dt><dd>' . self::data($l['validade']) . '</dd></div>'
                . '<div><dt>Situação</dt><dd class="' . $classe . '">' . self::e($l['situacao']) . '</dd></div>'
                . '</dl></div>'
                . '<h3>Doses aplicadas deste lote (' . count($r['aplicacoes']) . ')</h3>'
                . self::tabela(
                    ['Data/hora', 'Cidadão', 'CPF', 'Dose', 'Profissional'],
                    array_map(fn ($a) => [self::dataHora($a['data_hora']), self::e($a['cidadao']), self::e($a['cpf']),
                        self::e($a['dose']), self::e($a['profissional'])], $r['aplicacoes']),
                    'Nenhuma dose aplicada deste lote.'
                )
                . '</section>';
        }
        return $html;
    }
}
