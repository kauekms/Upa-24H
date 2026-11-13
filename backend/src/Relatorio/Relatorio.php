<?php
declare(strict_types=1);

namespace Upa\Relatorio;

use PDO;
use Upa\Core\HttpException;

/**
 * Base dos relatórios gerenciais. Cada relatório concreto define seus
 * filtros, a consulta SQL (com JOINs) e como desenhar o corpo do documento.
 */
abstract class Relatorio
{
    private const TIPOS = [
        RelatorioFichaCidadao::class,
        RelatorioAgendamentos::class,
        RelatorioEstoqueVacinas::class,
    ];

    public function __construct(protected PDO $pdo, protected array $filtros)
    {
    }

    abstract public static function tipo(): string;

    abstract public function titulo(): string;

    abstract public function descricao(): string;

    /** Executa as consultas e devolve os dados do relatório. */
    abstract public function gerar(): array;

    /** HTML do corpo (tabelas) a partir dos dados gerados. */
    abstract public function corpoHtml(array $dados): string;

    /** Filtros aplicados, em texto, para o cabeçalho do documento. */
    abstract public function filtrosDescritos(): array;

    public static function criar(string $tipo, PDO $pdo, array $filtros): self
    {
        foreach (self::TIPOS as $classe) {
            if ($classe::tipo() === $tipo) {
                return new $classe($pdo, $filtros);
            }
        }
        throw new HttpException(404, "Relatório desconhecido: $tipo");
    }

    /** Relatórios disponíveis (para a tela de Relatórios). */
    public static function disponiveis(PDO $pdo): array
    {
        return array_map(function (string $classe) use ($pdo) {
            $r = new $classe($pdo, []);
            return ['tipo' => $classe::tipo(), 'titulo' => $r->titulo(), 'descricao' => $r->descricao()];
        }, self::TIPOS);
    }

    // ------------------------------------------------------------------
    // Utilitários para as subclasses
    // ------------------------------------------------------------------

    protected function consultar(string $sql, array $parametros = []): array
    {
        $st = $this->pdo->prepare($sql);
        $st->execute($parametros);
        return $st->fetchAll();
    }

    protected function filtro(string $nome): ?string
    {
        $v = $this->filtros[$nome] ?? null;
        return is_string($v) && trim($v) !== '' ? trim($v) : null;
    }

    /** Filtro de data no formato AAAA-MM-DD (campo date do formulário). */
    protected function filtroData(string $nome): ?string
    {
        $v = $this->filtro($nome);
        return $v !== null && preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) ? $v : null;
    }

    protected static function e(mixed $valor): string
    {
        return htmlspecialchars((string) ($valor ?? ''), ENT_QUOTES, 'UTF-8');
    }

    protected static function data(?string $iso): string
    {
        return $iso ? date('d/m/Y', strtotime($iso)) : '—';
    }

    protected static function dataHora(?string $iso): string
    {
        return $iso ? date('d/m/Y H:i', strtotime($iso)) : '—';
    }

    protected static function hora(?string $hora): string
    {
        return $hora ? substr($hora, 0, 5) : '—';
    }

    /** Monta uma tabela HTML simples. $linhas já devem vir escapadas. */
    protected static function tabela(array $cabecalhos, array $linhas, string $vazio = 'Nenhum registro.'): string
    {
        $th = implode('', array_map(fn ($c) => '<th>' . self::e($c) . '</th>', $cabecalhos));
        if (!$linhas) {
            return '<table><thead><tr>' . $th . '</tr></thead><tbody><tr><td class="vazio" colspan="'
                . count($cabecalhos) . '">' . self::e($vazio) . '</td></tr></tbody></table>';
        }
        $tb = implode('', array_map(fn ($l) => '<tr>' . implode('', array_map(fn ($c) => "<td>$c</td>", $l)) . '</tr>', $linhas));
        return "<table><thead><tr>$th</tr></thead><tbody>$tb</tbody></table>";
    }
}
