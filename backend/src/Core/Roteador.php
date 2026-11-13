<?php
declare(strict_types=1);

namespace Upa\Core;

/**
 * Roteador simples: associa "MÉTODO /caminho/{parametro}" a uma ação.
 * Ex.: $r->registrar('PUT', '/sync/{chave}', [$controle, 'gravar']);
 */
final class Roteador
{
    /** @var array<int, array{metodo:string, regex:string, acao:callable}> */
    private array $rotas = [];

    public function registrar(string $metodo, string $padrao, callable $acao): void
    {
        $regex = '#^' . preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $padrao) . '$#';
        $this->rotas[] = ['metodo' => strtoupper($metodo), 'regex' => $regex, 'acao' => $acao];
    }

    public function despachar(Requisicao $req): void
    {
        $caminhoExiste = false;
        foreach ($this->rotas as $rota) {
            if (!preg_match($rota['regex'], $req->rota(), $m)) {
                continue;
            }
            $caminhoExiste = true;
            if ($rota['metodo'] !== $req->metodo()) {
                continue;
            }
            $parametros = array_map('rawurldecode', array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY));
            ($rota['acao'])($req, $parametros);
            return;
        }
        throw $caminhoExiste
            ? new HttpException(405, 'Método não permitido para esta rota.')
            : new HttpException(404, 'Rota não encontrada: ' . $req->rota());
    }
}
