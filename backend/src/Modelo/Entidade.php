<?php
declare(strict_types=1);

namespace Upa\Modelo;

use Upa\Repositorio\Catalogo;

/**
 * Classe base das entidades do domínio.
 *
 * Cada entidade recebe o registro no formato usado pela aplicação
 * (ex.: data "07/05/2026", médico pelo nome) e sabe convertê-lo para as
 * colunas relacionais da sua tabela (datas ISO, chaves estrangeiras) e
 * de volta (paraApp). É o mapeamento objeto-relacional do sistema.
 */
abstract class Entidade
{
    public function __construct(protected array $atributos)
    {
    }

    /** Nome da tabela no banco. */
    abstract public static function tabela(): string;

    /**
     * Colunas a gravar, já com as chaves estrangeiras resolvidas.
     * Retorna null quando o registro não tem os dados mínimos para ser salvo.
     */
    abstract public function colunas(Catalogo $catalogo): ?array;

    /** Converte uma linha do SELECT (com JOINs) para o formato da aplicação. */
    abstract public static function paraApp(array $linha): array;

    public function codigo(): ?string
    {
        return self::texto($this->atributos['id'] ?? null);
    }

    public function atributo(string $nome): mixed
    {
        return $this->atributos[$nome] ?? null;
    }

    // ------------------------------------------------------------------
    // Conversões compartilhadas
    // ------------------------------------------------------------------

    protected static function texto(mixed $valor, int $max = 255): ?string
    {
        if ($valor === null || is_array($valor)) {
            return null;
        }
        $t = trim((string) $valor);
        if ($t === '' || $t === '—' || $t === '-') {
            return null;
        }
        return mb_substr($t, 0, $max);
    }

    protected static function inteiro(mixed $valor): ?int
    {
        if ($valor === null || $valor === '') {
            return null;
        }
        if (is_numeric($valor)) {
            return (int) $valor;
        }
        $digitos = preg_replace('/\D/', '', (string) $valor);
        return $digitos === '' ? null : (int) $digitos;
    }

    /** "07/05/2026" ou "2026-05-07" → "2026-05-07". */
    protected static function data(mixed $valor): ?string
    {
        $t = self::texto($valor);
        if ($t === null) {
            return null;
        }
        if (preg_match('#^(\d{1,2})/(\d{1,2})/(\d{4})#', $t, $m)) {
            return checkdate((int) $m[2], (int) $m[1], (int) $m[3]) ? sprintf('%04d-%02d-%02d', $m[3], $m[2], $m[1]) : null;
        }
        if (preg_match('#^(\d{4})-(\d{2})-(\d{2})#', $t, $m)) {
            return checkdate((int) $m[2], (int) $m[3], (int) $m[1]) ? "{$m[1]}-{$m[2]}-{$m[3]}" : null;
        }
        return null;
    }

    /** "13:20" → "13:20:00". */
    protected static function hora(mixed $valor): ?string
    {
        $t = self::texto($valor);
        if ($t !== null && preg_match('#(\d{1,2}):(\d{2})(?::(\d{2}))?#', $t, $m)) {
            return sprintf('%02d:%02d:%02d', $m[1], $m[2], $m[3] ?? 0);
        }
        return null;
    }

    /** "07/05/2026 12:14" → "2026-05-07 12:14:00". */
    protected static function dataHora(mixed $valor): ?string
    {
        $data = self::data($valor);
        if ($data === null) {
            return null;
        }
        $resto = preg_replace('#^\S+\s*#', '', (string) $valor);
        return $data . ' ' . (self::hora($resto) ?? '00:00:00');
    }

    protected static function dataParaApp(?string $iso): ?string
    {
        return $iso ? date('d/m/Y', strtotime($iso)) : null;
    }

    protected static function horaParaApp(?string $hora): ?string
    {
        return $hora ? substr($hora, 0, 5) : null;
    }

    protected static function json(array $dados): string
    {
        return json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    /** Decodifica a coluna "dados" e sobrepõe os valores vindos das colunas relacionais. */
    protected static function mesclar(?string $dadosJson, array $colunas): array
    {
        $base = $dadosJson ? (json_decode($dadosJson, true) ?: []) : [];
        foreach ($colunas as $chave => $valor) {
            if ($valor !== null) {
                $base[$chave] = $valor;
            }
        }
        return $base;
    }
}
