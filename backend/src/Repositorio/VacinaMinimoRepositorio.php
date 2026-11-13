<?php
declare(strict_types=1);

namespace Upa\Repositorio;

use PDO;
use Upa\Seguranca\ControleAcesso;

/**
 * Estoque mínimo por vacina. A aplicação guarda um mapa
 * { "Influenza": 10, ... }; no banco ele é a coluna vacinas.estoque_minimo.
 */
final class VacinaMinimoRepositorio
{
    public function __construct(private PDO $pdo, private Catalogo $catalogo)
    {
    }

    public function chave(): string
    {
        return 'upa_vacinacao_minimos';
    }

    public function vazia(): bool
    {
        return (int) $this->pdo->query('SELECT COUNT(*) FROM vacinas')->fetchColumn() === 0;
    }

    public function listar(array $usuario): array
    {
        $mapa = [];
        foreach ($this->pdo->query('SELECT nome, estoque_minimo FROM vacinas ORDER BY id')->fetchAll() as $v) {
            $mapa[$v['nome']] = (int) $v['estoque_minimo'];
        }
        return $mapa;
    }

    public function sincronizar(array $mapa, array $usuario): int
    {
        if (!ControleAcesso::ehAdministrador($usuario)) {
            return 0;
        }
        $st = $this->pdo->prepare('UPDATE vacinas SET estoque_minimo = ? WHERE id = ?');
        $n = 0;
        foreach ($mapa as $nome => $minimo) {
            if (!is_string($nome) || !is_numeric($minimo)) {
                continue;
            }
            $st->execute([max(0, (int) $minimo), $this->catalogo->vacina(trim($nome))]);
            $n++;
        }
        return $n;
    }
}
