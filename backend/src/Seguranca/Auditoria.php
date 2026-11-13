<?php
declare(strict_types=1);

namespace Upa\Seguranca;

use PDO;

/**
 * Registra no banco (tabela logs_auditoria) os eventos que acontecem no
 * servidor: login, falha de login, logout, acesso negado e emissão de relatórios.
 * O registro segue o mesmo formato exibido na tela "Logs de Sistema".
 */
final class Auditoria
{
    private const VISUAL = [
        'Erro'       => ['b-red', 'danger'],
        'Acesso'     => ['b-green', 'success'],
        'Aviso'      => ['b-yellow', 'warning'],
        'Informação' => ['b-blue', 'primary'],
    ];

    public function __construct(private PDO $pdo)
    {
    }

    public function registrar(string $tipo, string $modulo, string $acao, string $descricao, ?array $usuario, string $ip): void
    {
        $agora = new \DateTimeImmutable();
        $codigo = 'SRV-' . $agora->format('ymdHis') . '-' . bin2hex(random_bytes(2));
        $nome = $usuario['nome'] ?? 'anônimo';
        [$badge, $dot] = self::VISUAL[$tipo] ?? self::VISUAL['Informação'];

        $dados = [
            'id' => $codigo,
            'dataHora' => $agora->format('d/m/Y H:i:s'),
            'data' => $agora->format('d/m/Y'),
            'hora' => $agora->format('H:i:s'),
            'tipo' => $tipo,
            'acao' => $acao,
            'titulo' => $acao,
            'descricao' => $descricao,
            'usuario' => $nome,
            'modulo' => $modulo,
            'ip' => $ip,
            'badge' => $badge,
            'dot' => $dot,
            'meta' => "Módulo: {$modulo} · Usuário: {$nome} · IP: {$ip}",
            'origem' => 'servidor',
        ];

        $sql = 'INSERT INTO logs_auditoria (codigo, assinatura, usuario_id, usuario, tipo, modulo, acao, descricao, ip, data_hora, dados)
                VALUES (:codigo, :assinatura, :usuario_id, :usuario, :tipo, :modulo, :acao, :descricao, :ip, :data_hora, :dados)';
        $this->pdo->prepare($sql)->execute([
            'codigo' => $codigo,
            'assinatura' => sha1($codigo . '|' . $agora->format('c') . '|' . $acao),
            'usuario_id' => $usuario['id'] ?? null,
            'usuario' => $nome,
            'tipo' => $tipo,
            'modulo' => $modulo,
            'acao' => $acao,
            'descricao' => $descricao,
            'ip' => $ip,
            'data_hora' => $agora->format('Y-m-d H:i:s'),
            'dados' => json_encode($dados, JSON_UNESCAPED_UNICODE),
        ]);
    }
}
