<?php
/**
 * Documento de relatório para impressão / PDF.
 * Uso: backend/relatorio.php?tipo=ficha-cidadao&cpf=...
 *      tipos: ficha-cidadao | agendamentos | estoque-vacinas
 * Exige sessão iniciada pelo login do sistema e perfil da equipe.
 */
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Upa\Controle\RelatorioControle;
use Upa\Core\BancoDeDados;
use Upa\Core\HttpException;
use Upa\Seguranca\Auditoria;
use Upa\Seguranca\Sessao;

Sessao::iniciar();
header('Content-Type: text/html; charset=utf-8');

try {
    $pdo = BancoDeDados::conexao();
    $controle = new RelatorioControle($pdo, new Auditoria($pdo));
    echo $controle->documento((string) ($_GET['tipo'] ?? ''), $_GET);
} catch (HttpException $e) {
    http_response_code($e->status());
    $msg = htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8');
    echo "<!doctype html><meta charset='utf-8'><title>Relatório indisponível</title>"
        . "<body style=\"font-family:Segoe UI,Arial,sans-serif;padding:40px;color:#18212d\">"
        . "<h1 style='font-size:20px'>Relatório indisponível</h1><p style='margin-top:8px'>$msg</p>"
        . "<p style='margin-top:16px;color:#5d6877'>Entre no sistema com um perfil da equipe e gere o relatório pela tela <b>Relatórios</b>.</p>";
} catch (Throwable $e) {
    error_log('[UPA24H] ' . $e);
    http_response_code(500);
    echo 'Erro ao gerar o relatório: ' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8');
}
