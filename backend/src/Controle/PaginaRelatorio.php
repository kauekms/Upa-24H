<?php
declare(strict_types=1);

namespace Upa\Controle;

use Upa\Relatorio\Relatorio;

/** Layout de impressão (A4) comum a todos os relatórios. */
final class PaginaRelatorio
{
    public static function renderizar(Relatorio $relatorio, array $dados, array $usuario): string
    {
        $e = fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
        $filtros = '';
        foreach ($relatorio->filtrosDescritos() as $rotulo => $valor) {
            $filtros .= '<span><b>' . $e($rotulo) . ':</b> ' . $e($valor) . '</span>';
        }
        $filtros = $filtros ?: '<span>Sem filtros (todos os registros)</span>';
        $emitido = date('d/m/Y \à\s H:i');

        return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
            . '<meta name="viewport" content="width=device-width, initial-scale=1">'
            . '<title>' . $e($relatorio->titulo()) . ' · UPA 24H</title>'
            . '<style>' . self::css() . '</style></head><body>'
            . '<div class="acoes"><button onclick="window.print()">Imprimir / salvar em PDF</button>'
            . '<button onclick="window.close()" class="sec">Fechar</button></div>'
            . '<main class="folha">'
            . '<header class="topo"><div><strong>UPA 24H</strong><span>Saúde Pública Digital</span></div>'
            . '<div class="emissao">Emitido em ' . $emitido . '<br>por ' . $e($usuario['nome']) . ' (' . $e($usuario['perfil']) . ')</div></header>'
            . '<h1>' . $e($relatorio->titulo()) . '</h1>'
            . '<p class="descricao">' . $e($relatorio->descricao()) . '</p>'
            . '<div class="filtros">' . $filtros . '</div>'
            . $relatorio->corpoHtml($dados)
            . '<footer>Documento gerado pelo sistema UPA 24H a partir do banco de dados. Uso interno.</footer>'
            . '</main></body></html>';
    }

    private static function css(): string
    {
        return <<<CSS
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Inter,'Segoe UI',Arial,sans-serif;font-size:12.5px;color:#18212d;background:#eef0f3;line-height:1.45}
        .acoes{max-width:900px;margin:16px auto 0;display:flex;gap:8px;justify-content:flex-end;padding:0 16px}
        .acoes button{font:inherit;font-weight:600;padding:8px 14px;border-radius:6px;border:1px solid #1f4e79;background:#1f4e79;color:#fff;cursor:pointer}
        .acoes button.sec{background:#fff;color:#374151;border-color:#c3c9d2}
        .folha{max-width:900px;margin:12px auto 32px;background:#fff;border:1px solid #dde1e7;padding:32px 36px}
        .topo{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1f4e79;padding-bottom:10px;margin-bottom:18px}
        .topo strong{display:block;font-size:16px;color:#1f4e79}
        .topo span{color:#5d6877;font-size:11.5px}
        .emissao{text-align:right;color:#5d6877;font-size:11px}
        h1{font-size:19px;margin-bottom:2px}
        .descricao{color:#5d6877;margin-bottom:10px}
        .filtros{display:flex;flex-wrap:wrap;gap:6px 16px;padding:8px 10px;background:#f8f9fb;border:1px solid #dde1e7;border-radius:4px;margin-bottom:16px;font-size:11.5px}
        h2{font-size:14px;color:#1f4e79}
        h3{font-size:11.5px;text-transform:uppercase;letter-spacing:.4px;color:#5d6877;margin:14px 0 6px}
        table{width:100%;border-collapse:collapse;margin-bottom:4px}
        th{text-align:left;background:#f3f4f6;border:1px solid #dde1e7;padding:5px 7px;font-size:10.5px;text-transform:uppercase;letter-spacing:.3px;color:#374151}
        td{border:1px solid #dde1e7;padding:5px 7px;vertical-align:top}
        td.vazio,p.vazio{color:#8b95a3;font-style:italic}
        .mestre{border:1px solid #c3c9d2;border-radius:4px;padding:12px 14px;margin-bottom:14px;page-break-inside:avoid}
        .mestre-cabecalho{border-bottom:1px solid #dde1e7;padding-bottom:8px}
        .mestre-cabecalho dl{display:flex;flex-wrap:wrap;gap:4px 22px;margin-top:6px}
        dt{font-size:10.5px;color:#5d6877;text-transform:uppercase;letter-spacing:.3px}
        dd{font-weight:600}
        dd.alerta{color:#b42318} dd.ok{color:#24603d}
        .totais{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px}
        .totais div{border:1px solid #dde1e7;border-radius:4px;padding:6px 12px;min-width:110px}
        .totais span{display:block;font-size:10.5px;color:#5d6877;text-transform:uppercase}
        .totais strong{font-size:17px}
        .resumo{color:#5d6877;margin-bottom:10px}
        footer{margin-top:22px;padding-top:8px;border-top:1px solid #dde1e7;color:#8b95a3;font-size:10.5px}
        @media print{body{background:#fff}.acoes{display:none}.folha{border:none;margin:0;max-width:none;padding:0}@page{size:A4;margin:14mm}}
        CSS;
    }
}
