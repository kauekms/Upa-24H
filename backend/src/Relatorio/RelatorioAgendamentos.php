<?php
declare(strict_types=1);

namespace Upa\Relatorio;

/**
 * Agendamentos por período, unidade, profissional e status.
 * Junção: agendamentos JOIN cidadaos, profissionais, especialidades, unidades,
 * com totais agrupados (GROUP BY) por status e por unidade.
 */
final class RelatorioAgendamentos extends Relatorio
{
    public static function tipo(): string
    {
        return 'agendamentos';
    }

    public function titulo(): string
    {
        return 'Agendamentos por período';
    }

    public function descricao(): string
    {
        return 'Lista de agendamentos com cidadão, profissional e unidade, e totais por status e por unidade.';
    }

    public function filtrosDescritos(): array
    {
        $inicio = $this->filtroData('inicio');
        $fim = $this->filtroData('fim');
        return array_filter([
            'Período' => ($inicio || $fim) ? self::data($inicio) . ' a ' . self::data($fim) : null,
            'Unidade' => $this->filtro('unidade'),
            'Profissional' => $this->filtro('profissional'),
            'Status' => $this->filtro('status'),
        ]);
    }

    /** @return array{0:string,1:array} cláusula WHERE e parâmetros */
    private function condicoes(): array
    {
        $onde = [];
        $p = [];
        if ($v = $this->filtroData('inicio')) {
            $onde[] = 'a.data >= :inicio';
            $p['inicio'] = $v;
        }
        if ($v = $this->filtroData('fim')) {
            $onde[] = 'a.data <= :fim';
            $p['fim'] = $v;
        }
        if ($v = $this->filtro('unidade')) {
            $onde[] = 'un.nome = :unidade';
            $p['unidade'] = $v;
        }
        if ($v = $this->filtro('profissional')) {
            $onde[] = 'p.nome = :profissional';
            $p['profissional'] = $v;
        }
        if ($v = $this->filtro('status')) {
            $onde[] = 'a.status = :status';
            $p['status'] = $v;
        }
        return [$onde ? ' WHERE ' . implode(' AND ', $onde) : '', $p];
    }

    public function gerar(): array
    {
        [$where, $p] = $this->condicoes();
        $juncoes = ' FROM agendamentos a
                     JOIN cidadaos c ON c.id = a.cidadao_id
                     LEFT JOIN profissionais p ON p.id = a.profissional_id
                     LEFT JOIN especialidades e ON e.id = a.especialidade_id
                     LEFT JOIN unidades un ON un.id = a.unidade_id';

        return [
            'linhas' => $this->consultar(
                'SELECT a.codigo, a.data, a.horario, c.nome AS cidadao, c.cpf, p.nome AS profissional,
                        e.nome AS especialidade, un.nome AS unidade, a.status'
                . $juncoes . $where . ' ORDER BY a.data, a.horario',
                $p
            ),
            'porStatus' => $this->consultar(
                'SELECT a.status, COUNT(*) AS total' . $juncoes . $where . ' GROUP BY a.status ORDER BY total DESC',
                $p
            ),
            'porUnidade' => $this->consultar(
                "SELECT COALESCE(un.nome, 'Sem unidade') AS unidade, COUNT(*) AS total,
                        SUM(a.status = 'Confirmado') AS confirmados, SUM(a.status = 'Cancelado') AS cancelados"
                . $juncoes . $where . ' GROUP BY un.nome ORDER BY total DESC',
                $p
            ),
        ];
    }

    public function corpoHtml(array $dados): string
    {
        $total = count($dados['linhas']);
        $html = '<div class="totais">'
            . '<div><span>Total</span><strong>' . $total . '</strong></div>';
        foreach ($dados['porStatus'] as $s) {
            $html .= '<div><span>' . self::e($s['status']) . '</span><strong>' . (int) $s['total'] . '</strong></div>';
        }
        $html .= '</div>';

        $html .= '<h3>Totais por unidade</h3>' . self::tabela(
            ['Unidade', 'Agendamentos', 'Confirmados', 'Cancelados'],
            array_map(fn ($u) => [self::e($u['unidade']), (int) $u['total'], (int) $u['confirmados'], (int) $u['cancelados']], $dados['porUnidade'])
        );

        $html .= '<h3>Agendamentos (' . $total . ')</h3>' . self::tabela(
            ['Nº', 'Data', 'Hora', 'Cidadão', 'CPF', 'Especialidade', 'Profissional', 'Unidade', 'Status'],
            array_map(fn ($a) => [self::e($a['codigo']), self::data($a['data']), self::hora($a['horario']), self::e($a['cidadao']),
                self::e($a['cpf']), self::e($a['especialidade']), self::e($a['profissional']), self::e($a['unidade']), self::e($a['status'])],
                $dados['linhas']),
            'Nenhum agendamento para os filtros informados.'
        );
        return $html;
    }
}
