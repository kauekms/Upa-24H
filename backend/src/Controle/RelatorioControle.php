<?php
declare(strict_types=1);

namespace Upa\Controle;

use PDO;
use Upa\Core\Requisicao;
use Upa\Core\Resposta;
use Upa\Relatorio\Relatorio;
use Upa\Seguranca\Auditoria;
use Upa\Seguranca\ControleAcesso;
use Upa\Seguranca\Sessao;

/** Relatórios gerenciais: lista, dados em JSON e documento HTML para impressão/PDF. */
final class RelatorioControle
{
    public function __construct(private PDO $pdo, private Auditoria $auditoria)
    {
    }

    /** GET /relatorios */
    public function listar(Requisicao $req): void
    {
        ControleAcesso::exigirRelatorios(Sessao::exigirLogin());
        Resposta::json(['success' => true, 'data' => Relatorio::disponiveis($this->pdo)]);
    }

    /** GET /relatorios/{tipo}?filtros... → dados em JSON */
    public function dados(Requisicao $req, array $parametros): void
    {
        $usuario = Sessao::exigirLogin();
        ControleAcesso::exigirRelatorios($usuario);
        $relatorio = Relatorio::criar($parametros['tipo'] ?? '', $this->pdo, $_GET);
        Resposta::json(['success' => true, 'titulo' => $relatorio->titulo(), 'data' => $relatorio->gerar()]);
    }

    /** Documento HTML completo (usado por backend/relatorio.php). */
    public function documento(string $tipo, array $filtros): string
    {
        $usuario = Sessao::exigirLogin();
        ControleAcesso::exigirRelatorios($usuario);
        $relatorio = Relatorio::criar($tipo, $this->pdo, $filtros);
        $dados = $relatorio->gerar();
        $this->auditoria->registrar('Informação', 'RELATORIOS', 'Relatório emitido',
            "{$usuario['nome']} emitiu \"{$relatorio->titulo()}\".", $usuario, (string) ($_SERVER['REMOTE_ADDR'] ?? 'local'));
        return PaginaRelatorio::renderizar($relatorio, $dados, $usuario);
    }
}
