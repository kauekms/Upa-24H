<?php
declare(strict_types=1);

namespace Upa\Controle;

use PDO;
use Upa\Core\HttpException;
use Upa\Core\Requisicao;
use Upa\Core\Resposta;
use Upa\Repositorio\Repositorios;
use Upa\Seguranca\ControleAcesso;
use Upa\Seguranca\Sessao;

/**
 * Persistência dos dados da aplicação no MySQL.
 *
 * GET /sync          → devolve todas as coleções que o perfil logado pode ver
 *                      (lidas das tabelas com JOIN) e quais tabelas estão vazias.
 * PUT /sync/{chave}  → grava a coleção enviada nas tabelas relacionais,
 *                      respeitando as permissões do perfil.
 */
final class SincronizacaoControle
{
    private array $repositorios;

    public function __construct(PDO $pdo)
    {
        $this->repositorios = Repositorios::todos($pdo);
    }

    public function carregar(Requisicao $req): void
    {
        $usuario = Sessao::exigirLogin();
        $colecoes = [];
        $vazias = [];
        foreach ($this->repositorios as $chave => $repositorio) {
            $colecoes[$chave] = $repositorio->listar($usuario);
            if (ControleAcesso::podeGravar($usuario, $chave) && !ControleAcesso::ehCidadao($usuario) && $repositorio->vazia()) {
                $vazias[] = $chave;
            }
        }
        Resposta::json(['success' => true, 'user' => $usuario, 'colecoes' => $colecoes, 'vazias' => $vazias]);
    }

    public function gravar(Requisicao $req, array $parametros): void
    {
        $usuario = Sessao::exigirLogin();
        $chave = $parametros['chave'] ?? '';
        $repositorio = $this->repositorios[$chave] ?? null;
        if ($repositorio === null) {
            throw new HttpException(404, "Coleção desconhecida: $chave");
        }
        ControleAcesso::exigirGravacao($usuario, $chave);

        $lista = $req->corpo()['lista'] ?? null;
        if (!is_array($lista)) {
            throw new HttpException(422, 'Envie a coleção no campo "lista".');
        }
        $gravados = $repositorio->sincronizar($lista, $usuario);
        Resposta::json(['success' => true, 'colecao' => $chave, 'gravados' => $gravados]);
    }
}
