<?php
declare(strict_types=1);

namespace Upa\Repositorio;

use Upa\Modelo\Entidade;
use Upa\Modelo\Usuario;
use Upa\Seguranca\ControleAcesso;

/**
 * Contas de acesso. Somente o Administrador cadastra ou altera outras contas;
 * os demais perfis só atualizam o próprio cadastro e nunca o próprio perfil.
 */
final class UsuarioRepositorio extends Repositorio
{
    public function chave(): string
    {
        return 'upa_usuarios';
    }

    protected function classeEntidade(): string
    {
        return Usuario::class;
    }

    protected function criar(array $registro): Entidade
    {
        return new Usuario($registro);
    }

    protected function consulta(): string
    {
        return 'SELECT x.*, p.nome AS perfil_nome, un.nome AS unidade_nome
                FROM usuarios x
                JOIN perfis p ON p.id = x.perfil_id
                LEFT JOIN unidades un ON un.id = x.unidade_id';
    }

    /** Administrador vê todas as contas; os demais, apenas a própria. */
    public function listar(array $usuario): array
    {
        $sql = $this->consulta();
        $parametros = [];
        if (!ControleAcesso::ehAdministrador($usuario)) {
            $sql .= ' WHERE x.id = :id';
            $parametros['id'] = $usuario['id'];
        }
        $st = $this->pdo->prepare($sql . ' ORDER BY x.id');
        $st->execute($parametros);
        return array_map([Usuario::class, 'paraApp'], $st->fetchAll());
    }

    /** Busca a conta para login, por CPF (com ou sem pontuação) ou e-mail. */
    public function buscarParaLogin(string $identificador): ?array
    {
        $digitos = self::digitos($identificador);
        $st = $this->pdo->prepare(
            "SELECT x.id, x.codigo, x.nome, x.cpf, x.email, x.senha_hash, x.status, p.nome AS perfil
             FROM usuarios x JOIN perfis p ON p.id = x.perfil_id
             WHERE (:digitos <> '' AND REPLACE(REPLACE(x.cpf, '.', ''), '-', '') = :digitos2)
                OR LOWER(x.email) = LOWER(:email)
             LIMIT 1"
        );
        $st->execute(['digitos' => $digitos, 'digitos2' => $digitos, 'email' => trim($identificador)]);
        $linha = $st->fetch();
        return $linha === false ? null : $linha;
    }

    protected function permitido(Entidade $entidade, array $usuario): bool
    {
        return ControleAcesso::ehAdministrador($usuario) || $entidade->codigo() === ($usuario['codigo'] ?? null);
    }

    protected function ajustar(array $colunas, array $usuario): array
    {
        if (!ControleAcesso::ehAdministrador($usuario)) {
            $colunas['perfil_id'] = $this->catalogo->perfil((string) $usuario['perfil']);
        }
        return $colunas;
    }

    protected function gravar(array $colunas): int
    {
        // Conta nova sem senha não pode ser criada (senha_hash é obrigatória).
        if (!isset($colunas['senha_hash'])) {
            $st = $this->pdo->prepare('SELECT id FROM usuarios WHERE codigo = ? OR cpf = ?');
            $st->execute([$colunas['codigo'], $colunas['cpf']]);
            if ($st->fetchColumn() === false) {
                return 0;
            }
        }
        return parent::gravar($colunas);
    }

    /** Liga a conta ao cadastro de cidadão ou de profissional correspondente. */
    protected function aposGravar(Entidade $entidade, array $colunas, int $id): void
    {
        if ($id === 0 || !$entidade instanceof Usuario) {
            return;
        }
        $perfil = $entidade->perfil();
        if (in_array($perfil, [ControleAcesso::CIDADAO, ControleAcesso::PACIENTE], true)) {
            $cidadao = $this->catalogo->cidadao($colunas['nome'], $colunas['cpf']);
            $nascimento = $entidade->atributo('nascimento');
            $this->pdo->prepare(
                'UPDATE cidadaos SET usuario_id = ?, telefone = COALESCE(?, telefone),
                        data_nascimento = COALESCE(?, data_nascimento)
                 WHERE id = ? AND (usuario_id IS NULL OR usuario_id = ?)'
            )->execute([$id, $colunas['telefone'], is_string($nascimento) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $nascimento) ? $nascimento : null, $cidadao, $id]);
        } elseif ($perfil === ControleAcesso::PROFISSIONAL) {
            $profissional = $this->catalogo->profissional($colunas['nome'], $entidade->atributo('especialidade'));
            $this->pdo->prepare(
                'UPDATE profissionais SET usuario_id = ?, registro = COALESCE(?, registro) WHERE id = ? AND (usuario_id IS NULL OR usuario_id = ?)'
            )->execute([$id, $entidade->atributo('registro'), $profissional, $id]);
            $unidade = $colunas['unidade_id'] ?? null;
            $this->catalogo->vincular('profissional_unidade', 'profissional_id', $profissional, 'unidade_id', $unidade);
        }
    }
}
