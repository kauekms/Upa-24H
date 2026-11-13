<?php
/**
 * API do UPA 24H (ponto de entrada único).
 * As rotas vêm depois de "api.php", ex.: backend/api.php/auth/login
 *
 *   GET  /status            disponibilidade do banco
 *   POST /auth/login        login validado no MySQL
 *   POST /auth/logout
 *   GET  /auth/me           usuário da sessão
 *   GET  /sync              carrega os dados permitidos ao perfil
 *   PUT  /sync/{colecao}    grava uma coleção nas tabelas
 *   GET  /relatorios        relatórios disponíveis
 *   GET  /relatorios/{tipo} dados de um relatório (JSON)
 */
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

use Upa\Controle\AuthControle;
use Upa\Controle\RelatorioControle;
use Upa\Controle\SincronizacaoControle;
use Upa\Core\BancoDeDados;
use Upa\Core\HttpException;
use Upa\Core\Requisicao;
use Upa\Core\Resposta;
use Upa\Core\Roteador;
use Upa\Seguranca\Auditoria;
use Upa\Seguranca\Sessao;

Sessao::iniciar();
$requisicao = Requisicao::atual();

try {
    try {
        $pdo = BancoDeDados::conexao();
    } catch (PDOException $e) {
        if ($requisicao->rota() === '/status') {
            Resposta::json(['success' => true, 'banco' => false, 'message' => 'Banco de dados indisponível: ' . $e->getMessage()]);
            exit;
        }
        throw new HttpException(503, 'Banco de dados indisponível. Verifique se o MySQL do XAMPP está ligado.');
    }

    $auditoria = new Auditoria($pdo);
    $auth = new AuthControle($pdo, $auditoria);
    $sync = new SincronizacaoControle($pdo);
    $relatorios = new RelatorioControle($pdo, $auditoria);

    $rotas = new Roteador();
    $rotas->registrar('GET', '/status', [$auth, 'status']);
    $rotas->registrar('POST', '/auth/login', [$auth, 'login']);
    $rotas->registrar('POST', '/auth/logout', [$auth, 'logout']);
    $rotas->registrar('GET', '/auth/me', [$auth, 'me']);
    $rotas->registrar('GET', '/sync', [$sync, 'carregar']);
    $rotas->registrar('PUT', '/sync/{chave}', [$sync, 'gravar']);
    $rotas->registrar('GET', '/relatorios', [$relatorios, 'listar']);
    $rotas->registrar('GET', '/relatorios/{tipo}', [$relatorios, 'dados']);
    $rotas->despachar($requisicao);
} catch (HttpException $e) {
    if ($e->status() === 403 && isset($pdo) && Sessao::usuario() !== null) {
        (new Auditoria($pdo))->registrar('Aviso', 'SEGURANCA', 'Acesso negado',
            $e->getMessage() . ' Rota: ' . $requisicao->metodo() . ' ' . $requisicao->rota(), Sessao::usuario(), $requisicao->ip());
    }
    Resposta::erro($e->getMessage(), $e->status());
} catch (Throwable $e) {
    error_log('[UPA24H] ' . $e);
    Resposta::erro('Erro interno no servidor: ' . $e->getMessage(), 500);
}
