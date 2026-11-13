<?php
declare(strict_types=1);

namespace Upa\Modelo;

use Upa\Repositorio\Catalogo;
use Upa\Seguranca\Senha;

/** Conta de acesso ao sistema (tabela usuarios). */
final class Usuario extends Entidade
{
    public static function tabela(): string
    {
        return 'usuarios';
    }

    public function perfil(): string
    {
        return self::texto($this->atributos['perfil'] ?? null) ?? 'Cidadão';
    }

    public function cpf(): ?string
    {
        return self::texto($this->atributos['cpf'] ?? null, 14);
    }

    public function colunas(Catalogo $catalogo): ?array
    {
        $codigo = $this->codigo();
        $cpf = $this->cpf();
        $nome = self::texto($this->atributos['nome'] ?? null, 120);
        if ($codigo === null || $cpf === null || $nome === null) {
            return null;
        }
        $complementares = $this->atributos;
        unset($complementares['senha']); // a senha fica só na coluna senha_hash

        $colunas = [
            'codigo'     => $codigo,
            'nome'       => $nome,
            'cpf'        => $cpf,
            'email'      => self::texto($this->atributos['email'] ?? null, 120),
            'telefone'   => self::texto($this->atributos['telefone'] ?? null, 20),
            'perfil_id'  => $catalogo->perfil($this->perfil()),
            'unidade_id' => $catalogo->unidade(self::texto($this->atributos['unidade'] ?? null)),
            'cargo'      => self::texto($this->atributos['cargo'] ?? null, 80),
            'status'     => self::texto($this->atributos['status'] ?? null, 20) ?? 'Ativo',
            'dados'      => self::json($complementares),
        ];
        $senha = Senha::normalizar(self::texto($this->atributos['senha'] ?? null, 255));
        if ($senha !== null) {
            $colunas['senha_hash'] = $senha;
        }
        return $colunas;
    }

    public static function paraApp(array $linha): array
    {
        return self::mesclar($linha['dados'] ?? null, [
            'id'       => $linha['codigo'],
            'nome'     => $linha['nome'],
            'cpf'      => $linha['cpf'],
            'email'    => $linha['email'],
            'telefone' => $linha['telefone'],
            'senha'    => $linha['senha_hash'],
            'perfil'   => $linha['perfil_nome'],
            'unidade'  => $linha['unidade_nome'],
            'cargo'    => $linha['cargo'],
        ]);
    }
}
