<?php
declare(strict_types=1);

namespace Upa\Repositorio;

use PDO;

/**
 * Resolve nomes usados pela aplicação ("Unidade Centro", "Dr. Manoel Joaquim",
 * CPF do cidadão...) para as chaves primárias das tabelas relacionadas,
 * criando o registro quando ele ainda não existe. Mantém um cache por requisição.
 */
final class Catalogo
{
    private array $cache = [];

    public function __construct(private PDO $pdo)
    {
    }

    public function perfil(string $nome): int
    {
        return $this->lembrar("perfil|$nome", function () use ($nome) {
            $id = $this->valor('SELECT id FROM perfis WHERE nome = ?', [$nome]);
            return $id ?? (int) $this->valor("SELECT id FROM perfis WHERE nome = 'Cidadão'", []);
        });
    }

    public function unidade(?string $nome): ?int
    {
        if ($nome === null) {
            return null;
        }
        return $this->lembrar("unidade|$nome", function () use ($nome) {
            $id = $this->valor('SELECT id FROM unidades WHERE nome = ?', [$nome]);
            if ($id !== null) {
                return $id;
            }
            $proximo = (int) $this->valor('SELECT COALESCE(MAX(id), 0) + 1 FROM unidades', []);
            $this->pdo->prepare('INSERT INTO unidades (codigo, nome) VALUES (?, ?)')
                ->execute([sprintf('UN-%03d', $proximo), $nome]);
            return (int) $this->pdo->lastInsertId();
        });
    }

    public function especialidade(?string $nome): ?int
    {
        return $nome === null ? null : $this->buscarOuCriar('especialidades', $nome);
    }

    public function tipoExame(?string $nome): ?int
    {
        return $nome === null ? null : $this->buscarOuCriar('tipos_exame', $nome);
    }

    public function vacina(?string $nome): ?int
    {
        return $nome === null ? null : $this->buscarOuCriar('vacinas', $nome);
    }

    /** Médico ou enfermeiro pelo nome; "Enf." no início indica equipe de enfermagem. */
    public function profissional(?string $nome, ?string $especialidade = null): ?int
    {
        if ($nome === null) {
            return null;
        }
        return $this->lembrar("profissional|$nome", function () use ($nome, $especialidade) {
            $id = $this->valor('SELECT id FROM profissionais WHERE nome = ?', [$nome]);
            if ($id !== null) {
                return $id;
            }
            $tipo = preg_match('/^enf/i', $nome) ? 'Enfermagem' : 'Médico';
            $this->pdo->prepare('INSERT INTO profissionais (nome, tipo, especialidade_id) VALUES (?, ?, ?)')
                ->execute([$nome, $tipo, $this->especialidade($especialidade)]);
            return (int) $this->pdo->lastInsertId();
        });
    }

    /**
     * Cidadão pelo CPF (preferencial) ou pelo nome. Se o CPF informado já
     * pertence a outra pessoa, o registro é ligado ao cidadão pelo nome, sem
     * CPF, para não atribuir o atendimento à pessoa errada.
     */
    public function cidadao(?string $nome, ?string $cpf): ?int
    {
        if ($nome === null && $cpf === null) {
            return null;
        }
        return $this->lembrar("cidadao|$nome|$cpf", function () use ($nome, $cpf) {
            if ($cpf !== null) {
                $linha = $this->linha('SELECT id, nome FROM cidadaos WHERE cpf = ?', [$cpf]);
                if ($linha !== null) {
                    if ($nome === null || mb_strtolower(trim($linha['nome'])) === mb_strtolower($nome)) {
                        return (int) $linha['id'];
                    }
                    $cpf = null;
                }
            }
            if ($nome === null) {
                return null;
            }
            $semCpf = $this->valor('SELECT id FROM cidadaos WHERE nome = ? AND cpf IS NULL LIMIT 1', [$nome]);
            if ($cpf === null) {
                $qualquer = $semCpf ?? $this->valor('SELECT id FROM cidadaos WHERE nome = ? LIMIT 1', [$nome]);
                if ($qualquer !== null) {
                    return $qualquer;
                }
            } elseif ($semCpf !== null) {
                $this->pdo->prepare('UPDATE cidadaos SET cpf = ? WHERE id = ?')->execute([$cpf, $semCpf]);
                return $semCpf;
            }
            $this->pdo->prepare('INSERT INTO cidadaos (nome, cpf) VALUES (?, ?)')->execute([$nome, $cpf]);
            return (int) $this->pdo->lastInsertId();
        });
    }

    /** Cidadão ligado à conta logada (pela conta ou pelo CPF). */
    public function cidadaoDoUsuario(array $usuario): ?int
    {
        return $this->valor(
            'SELECT id FROM cidadaos WHERE usuario_id = ? OR cpf = ? ORDER BY usuario_id IS NULL LIMIT 1',
            [$usuario['id'] ?? 0, $usuario['cpf'] ?? '']
        );
    }

    public function campanha(?string $nome): ?int
    {
        return $nome === null ? null : $this->valor('SELECT id FROM campanhas WHERE nome = ? LIMIT 1', [$nome]);
    }

    public function lote(?string $numero, ?int $unidade): ?int
    {
        if ($numero === null) {
            return null;
        }
        return $this->valor(
            'SELECT id FROM lotes WHERE numero_lote = ? ORDER BY unidade_id = ? DESC LIMIT 1',
            [$numero, $unidade ?? 0]
        );
    }

    public function usuarioPorNome(?string $nome): ?int
    {
        if ($nome === null) {
            return null;
        }
        return $this->lembrar("usuario|$nome", fn () => $this->valor('SELECT id FROM usuarios WHERE nome = ? LIMIT 1', [$nome]));
    }

    /** Insere o par numa tabela associativa N:N (ignora se já existir). */
    public function vincular(string $tabela, string $colunaA, ?int $a, string $colunaB, ?int $b): void
    {
        if ($a === null || $b === null) {
            return;
        }
        $permitidas = ['profissional_unidade', 'campanha_unidade'];
        if (!in_array($tabela, $permitidas, true)) {
            throw new \InvalidArgumentException("Tabela associativa inválida: $tabela");
        }
        $this->pdo->prepare("INSERT IGNORE INTO $tabela ($colunaA, $colunaB) VALUES (?, ?)")->execute([$a, $b]);
    }

    // ------------------------------------------------------------------

    private function buscarOuCriar(string $tabela, string $nome): int
    {
        return $this->lembrar("$tabela|$nome", function () use ($tabela, $nome) {
            $id = $this->valor("SELECT id FROM $tabela WHERE nome = ?", [$nome]);
            if ($id !== null) {
                return $id;
            }
            $this->pdo->prepare("INSERT INTO $tabela (nome) VALUES (?)")->execute([$nome]);
            return (int) $this->pdo->lastInsertId();
        });
    }

    private function lembrar(string $chave, callable $obter): ?int
    {
        if (!array_key_exists($chave, $this->cache)) {
            $this->cache[$chave] = $obter();
        }
        return $this->cache[$chave];
    }

    private function valor(string $sql, array $parametros): ?int
    {
        $st = $this->pdo->prepare($sql);
        $st->execute($parametros);
        $v = $st->fetchColumn();
        return $v === false || $v === null ? null : (int) $v;
    }

    private function linha(string $sql, array $parametros): ?array
    {
        $st = $this->pdo->prepare($sql);
        $st->execute($parametros);
        $l = $st->fetch();
        return $l === false ? null : $l;
    }
}
