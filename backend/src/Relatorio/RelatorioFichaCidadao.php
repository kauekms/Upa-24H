<?php
declare(strict_types=1);

namespace Upa\Relatorio;

/**
 * Relatório MESTRE-DETALHE: Ficha de atendimento do cidadão.
 *
 * Mestre ..: cidadaos (LEFT JOIN usuarios para a conta de autoatendimento)
 * Detalhes : agendamentos  JOIN profissionais, especialidades, unidades
 *            exames        JOIN tipos_exame, unidades, profissionais
 *            aplicacoes    JOIN lotes, vacinas, unidades, profissionais
 */
final class RelatorioFichaCidadao extends Relatorio
{
    private const LIMITE = 200;

    public static function tipo(): string
    {
        return 'ficha-cidadao';
    }

    public function titulo(): string
    {
        return 'Ficha de atendimento do cidadão';
    }

    public function descricao(): string
    {
        return 'Mestre-detalhe: dados do cidadão com seus agendamentos, exames e vacinas aplicadas.';
    }

    public function filtrosDescritos(): array
    {
        return array_filter([
            'CPF' => $this->filtro('cpf'),
            'Nome contém' => $this->filtro('nome'),
        ]);
    }

    public function gerar(): array
    {
        $onde = [];
        $p = [];
        if ($cpf = $this->filtro('cpf')) {
            $onde[] = "REPLACE(REPLACE(c.cpf, '.', ''), '-', '') = :cpf";
            $p['cpf'] = preg_replace('/\D/', '', $cpf);
        }
        if ($nome = $this->filtro('nome')) {
            $onde[] = 'c.nome LIKE :nome';
            $p['nome'] = '%' . $nome . '%';
        }

        $mestres = $this->consultar(
            'SELECT c.id, c.nome, c.cpf, c.data_nascimento, c.telefone, u.email AS conta_email,
                    (SELECT COUNT(*) FROM agendamentos a WHERE a.cidadao_id = c.id) AS qtd_agendamentos,
                    (SELECT COUNT(*) FROM exames x WHERE x.cidadao_id = c.id) AS qtd_exames,
                    (SELECT COUNT(*) FROM aplicacoes_vacina ap WHERE ap.cidadao_id = c.id) AS qtd_vacinas
             FROM cidadaos c
             LEFT JOIN usuarios u ON u.id = c.usuario_id'
            . ($onde ? ' WHERE ' . implode(' AND ', $onde) : '')
            . ' HAVING qtd_agendamentos + qtd_exames + qtd_vacinas > 0 OR :todos = 1
             ORDER BY c.nome LIMIT ' . self::LIMITE,
            $p + ['todos' => $onde ? 1 : 0]
        );

        $agendamentos = $this->pdo->prepare(
            'SELECT a.codigo, a.data, a.horario, e.nome AS especialidade, p.nome AS profissional, un.nome AS unidade, a.status
             FROM agendamentos a
             LEFT JOIN especialidades e ON e.id = a.especialidade_id
             LEFT JOIN profissionais p ON p.id = a.profissional_id
             LEFT JOIN unidades un ON un.id = a.unidade_id
             WHERE a.cidadao_id = ? ORDER BY a.data DESC, a.horario DESC'
        );
        $exames = $this->pdo->prepare(
            'SELECT x.codigo, t.nome AS tipo, x.data, x.prioridade, x.status, un.nome AS unidade, p.nome AS solicitante
             FROM exames x
             JOIN tipos_exame t ON t.id = x.tipo_exame_id
             LEFT JOIN unidades un ON un.id = x.unidade_id
             LEFT JOIN profissionais p ON p.id = x.solicitante_id
             WHERE x.cidadao_id = ? ORDER BY x.data DESC'
        );
        $vacinas = $this->pdo->prepare(
            'SELECT ap.data_hora, v.nome AS vacina, ap.dose, l.numero_lote, un.nome AS unidade, p.nome AS profissional
             FROM aplicacoes_vacina ap
             LEFT JOIN lotes l ON l.id = ap.lote_id
             LEFT JOIN vacinas v ON v.id = l.vacina_id
             LEFT JOIN unidades un ON un.id = ap.unidade_id
             LEFT JOIN profissionais p ON p.id = ap.profissional_id
             WHERE ap.cidadao_id = ? ORDER BY ap.data_hora DESC'
        );

        $fichas = [];
        foreach ($mestres as $c) {
            $agendamentos->execute([$c['id']]);
            $exames->execute([$c['id']]);
            $vacinas->execute([$c['id']]);
            $fichas[] = [
                'cidadao' => $c,
                'agendamentos' => $agendamentos->fetchAll(),
                'exames' => $exames->fetchAll(),
                'vacinas' => $vacinas->fetchAll(),
            ];
        }
        return ['fichas' => $fichas, 'total' => count($fichas)];
    }

    public function corpoHtml(array $dados): string
    {
        if (!$dados['fichas']) {
            return '<p class="vazio">Nenhum cidadão encontrado para os filtros informados.</p>';
        }
        $html = '<p class="resumo">' . $dados['total'] . ' cidadão(s) listado(s).</p>';
        foreach ($dados['fichas'] as $f) {
            $c = $f['cidadao'];
            $html .= '<section class="mestre">'
                . '<div class="mestre-cabecalho"><h2>' . self::e($c['nome']) . '</h2>'
                . '<dl>'
                . '<div><dt>CPF</dt><dd>' . self::e($c['cpf'] ?? 'não informado') . '</dd></div>'
                . '<div><dt>Nascimento</dt><dd>' . self::data($c['data_nascimento']) . '</dd></div>'
                . '<div><dt>Telefone</dt><dd>' . self::e($c['telefone'] ?? '—') . '</dd></div>'
                . '<div><dt>Conta</dt><dd>' . self::e($c['conta_email'] ?? 'sem autoatendimento') . '</dd></div>'
                . '</dl></div>';

            $html .= '<h3>Agendamentos (' . count($f['agendamentos']) . ')</h3>' . self::tabela(
                ['Nº', 'Data', 'Hora', 'Especialidade', 'Profissional', 'Unidade', 'Status'],
                array_map(fn ($a) => [self::e($a['codigo']), self::data($a['data']), self::hora($a['horario']),
                    self::e($a['especialidade']), self::e($a['profissional']), self::e($a['unidade']), self::e($a['status'])], $f['agendamentos']),
                'Sem agendamentos.'
            );
            $html .= '<h3>Exames (' . count($f['exames']) . ')</h3>' . self::tabela(
                ['Nº', 'Exame', 'Data', 'Prioridade', 'Solicitante', 'Unidade', 'Status'],
                array_map(fn ($x) => [self::e($x['codigo']), self::e($x['tipo']), self::data($x['data']), self::e($x['prioridade']),
                    self::e($x['solicitante']), self::e($x['unidade']), self::e($x['status'])], $f['exames']),
                'Sem exames.'
            );
            $html .= '<h3>Vacinas aplicadas (' . count($f['vacinas']) . ')</h3>' . self::tabela(
                ['Data/hora', 'Vacina', 'Dose', 'Lote', 'Unidade', 'Profissional'],
                array_map(fn ($v) => [self::dataHora($v['data_hora']), self::e($v['vacina']), self::e($v['dose']),
                    self::e($v['numero_lote']), self::e($v['unidade']), self::e($v['profissional'])], $f['vacinas']),
                'Sem vacinas registradas.'
            );
            $html .= '</section>';
        }
        return $html;
    }
}
