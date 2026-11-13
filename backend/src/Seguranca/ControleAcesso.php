<?php
declare(strict_types=1);

namespace Upa\Seguranca;

use Upa\Core\HttpException;

/**
 * Regras de acesso por perfil validadas NO SERVIDOR (espelham
 * js/config/permissoes.js, que só controla a interface).
 */
final class ControleAcesso
{
    public const ADMINISTRADOR = 'Administrador';
    public const PROFISSIONAL = 'Profissional da Saúde';
    public const RECEPCAO = 'Recepção';
    public const CIDADAO = 'Cidadão';
    public const PACIENTE = 'Paciente';

    /** Equipe da unidade: perfis internos (não cidadãos). */
    private const EQUIPE = [self::ADMINISTRADOR, self::PROFISSIONAL, self::RECEPCAO];

    /**
     * Quem pode GRAVAR cada coleção. O Cidadão só grava os próprios
     * agendamentos (aceitar/recusar), o próprio cadastro e os logs das suas ações.
     */
    private const GRAVACAO = [
        'upa_usuarios'             => [self::ADMINISTRADOR, self::PROFISSIONAL, self::RECEPCAO, self::CIDADAO, self::PACIENTE],
        'upa_agendamentos'         => [self::ADMINISTRADOR, self::PROFISSIONAL, self::RECEPCAO, self::CIDADAO, self::PACIENTE],
        'upa_consultas'            => self::EQUIPE,
        'upa_exames'               => self::EQUIPE,
        'upa_vacinacao_campanhas'  => self::EQUIPE,
        'upa_vacinacao_estoque'    => self::EQUIPE,
        'upa_vacinacao_aplicacoes' => self::EQUIPE,
        'upa_vacinacao_minimos'    => [self::ADMINISTRADOR],
        'upa_logs'                 => [self::ADMINISTRADOR, self::PROFISSIONAL, self::RECEPCAO, self::CIDADAO, self::PACIENTE],
    ];

    /** Relatórios gerenciais: somente a equipe. */
    private const RELATORIOS = self::EQUIPE;

    public static function ehAdministrador(array $usuario): bool
    {
        return ($usuario['perfil'] ?? '') === self::ADMINISTRADOR;
    }

    public static function ehCidadao(array $usuario): bool
    {
        return in_array($usuario['perfil'] ?? '', [self::CIDADAO, self::PACIENTE], true);
    }

    public static function podeGravar(array $usuario, string $colecao): bool
    {
        return in_array($usuario['perfil'] ?? '', self::GRAVACAO[$colecao] ?? [], true);
    }

    public static function exigirGravacao(array $usuario, string $colecao): void
    {
        if (!self::podeGravar($usuario, $colecao)) {
            throw new HttpException(403, 'Seu perfil não tem permissão para alterar estes dados.');
        }
    }

    public static function exigirRelatorios(array $usuario): void
    {
        if (!in_array($usuario['perfil'] ?? '', self::RELATORIOS, true)) {
            throw new HttpException(403, 'Relatórios gerenciais são restritos à equipe da unidade.');
        }
    }
}
