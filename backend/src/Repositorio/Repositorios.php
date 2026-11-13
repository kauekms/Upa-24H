<?php
declare(strict_types=1);

namespace Upa\Repositorio;

use PDO;

/**
 * Fábrica dos repositórios, indexados pela chave da coleção na aplicação.
 * A ordem importa na primeira carga: estoque e campanhas antes das aplicações
 * (que referenciam lote e campanha), usuários antes dos logs.
 */
final class Repositorios
{
    /** @return array<string, Repositorio|VacinaMinimoRepositorio> */
    public static function todos(PDO $pdo): array
    {
        $catalogo = new Catalogo($pdo);
        $lista = [
            new UsuarioRepositorio($pdo, $catalogo),
            new AgendamentoRepositorio($pdo, $catalogo),
            new ConsultaRepositorio($pdo, $catalogo),
            new ExameRepositorio($pdo, $catalogo),
            new VacinaMinimoRepositorio($pdo, $catalogo),
            new LoteRepositorio($pdo, $catalogo),
            new CampanhaRepositorio($pdo, $catalogo),
            new AplicacaoRepositorio($pdo, $catalogo),
            new LogRepositorio($pdo, $catalogo),
        ];
        $mapa = [];
        foreach ($lista as $repositorio) {
            $mapa[$repositorio->chave()] = $repositorio;
        }
        return $mapa;
    }
}
