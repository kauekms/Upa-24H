<?php
declare(strict_types=1);

namespace Upa\Modelo;

use Upa\Repositorio\Catalogo;

/** Registro da trilha de auditoria (tabela logs_auditoria). Nunca é alterado depois de gravado. */
final class LogAuditoria extends Entidade
{
    public static function tabela(): string
    {
        return 'logs_auditoria';
    }

    public function colunas(Catalogo $catalogo): ?array
    {
        $a = $this->atributos;
        $acao = self::texto($a['acao'] ?? $a['titulo'] ?? null, 200);
        if ($this->codigo() === null || $acao === null) {
            return null;
        }
        $usuario = self::texto($a['usuario'] ?? null, 120);
        $dataHora = self::dataHora($a['dataHora'] ?? null) ?? date('Y-m-d H:i:s');
        return [
            'codigo'     => $this->codigo(),
            'assinatura' => sha1(implode('|', [$this->codigo(), $a['dataHora'] ?? '', $acao, $usuario ?? ''])),
            'usuario_id' => $catalogo->usuarioPorNome($usuario),
            'usuario'    => $usuario,
            'tipo'       => self::texto($a['tipo'] ?? null, 20) ?? 'Informação',
            'modulo'     => self::texto($a['modulo'] ?? null, 40),
            'acao'       => $acao,
            'descricao'  => self::texto($a['descricao'] ?? null, 65000),
            'ip'         => self::texto($a['ip'] ?? null, 45),
            'data_hora'  => $dataHora,
            'dados'      => self::json($a),
        ];
    }

    public static function paraApp(array $linha): array
    {
        return self::mesclar($linha['dados'] ?? null, [
            'id'     => $linha['codigo'],
            'tipo'   => $linha['tipo'],
            'acao'   => $linha['acao'],
            'modulo' => $linha['modulo'],
        ]);
    }
}
