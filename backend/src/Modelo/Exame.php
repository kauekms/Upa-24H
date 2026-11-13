<?php
declare(strict_types=1);

namespace Upa\Modelo;

use Upa\Repositorio\Catalogo;

/** Exame solicitado e seu laudo (tabela exames). */
final class Exame extends Entidade
{
    public static function tabela(): string
    {
        return 'exames';
    }

    public function colunas(Catalogo $catalogo): ?array
    {
        $a = $this->atributos;
        $cidadao = $catalogo->cidadao(self::texto($a['paciente'] ?? null, 120), self::texto($a['cpf'] ?? null, 14));
        $tipo = $catalogo->tipoExame(self::texto($a['tipo'] ?? null, 100));
        if ($this->codigo() === null || $cidadao === null || $tipo === null) {
            return null;
        }
        $laudo = $a['laudo'] ?? null;
        if (is_array($laudo)) {
            $laudo = $laudo['texto'] ?? $laudo['conteudo'] ?? self::json($laudo);
        }
        return [
            'codigo'         => $this->codigo(),
            'cidadao_id'     => $cidadao,
            'tipo_exame_id'  => $tipo,
            'unidade_id'     => $catalogo->unidade(self::texto($a['unidade'] ?? null)),
            'solicitante_id' => $catalogo->profissional(self::texto($a['solicitante'] ?? null)),
            'data'           => self::data($a['data'] ?? null),
            'horario'        => self::hora($a['horario'] ?? null),
            'data_prevista'  => self::data($a['dataPrevista'] ?? null),
            'prioridade'     => self::texto($a['prioridade'] ?? null, 20) ?? 'Normal',
            'status'         => self::texto($a['status'] ?? null, 30) ?? 'Solicitado',
            'laudo'          => self::texto($laudo, 65000),
            'dados'          => self::json($a),
        ];
    }

    public static function paraApp(array $linha): array
    {
        return self::mesclar($linha['dados'] ?? null, [
            'id'          => $linha['codigo'],
            'paciente'    => $linha['cidadao_nome'],
            'cpf'         => $linha['cidadao_cpf'],
            'tipo'        => $linha['tipo_nome'],
            'solicitante' => $linha['solicitante_nome'],
            'unidade'     => $linha['unidade_nome'],
            'data'        => self::dataParaApp($linha['data']),
            'horario'     => self::horaParaApp($linha['horario']),
            'dataPrevista'=> self::dataParaApp($linha['data_prevista']),
            'prioridade'  => $linha['prioridade'],
            'status'      => $linha['status'],
        ]);
    }
}
