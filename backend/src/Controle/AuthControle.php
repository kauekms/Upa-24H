<?php
declare(strict_types=1);

namespace Upa\Controle;

use PDO;
use Upa\Core\Configuracao;
use Upa\Core\HttpException;
use Upa\Core\Requisicao;
use Upa\Core\Resposta;
use Upa\Repositorio\Catalogo;
use Upa\Repositorio\UsuarioRepositorio;
use Upa\Seguranca\Auditoria;
use Upa\Seguranca\Senha;
use Upa\Seguranca\Sessao;

/** Autenticação: login, logout e sessão atual. */
final class AuthControle
{
    private UsuarioRepositorio $usuarios;

    public function __construct(private PDO $pdo, private Auditoria $auditoria)
    {
        $this->usuarios = new UsuarioRepositorio($pdo, new Catalogo($pdo));
    }

    /** GET /status — a aplicação usa para saber se o banco está disponível. */
    public function status(Requisicao $req): void
    {
        $this->pdo->query('SELECT 1');
        Resposta::json([
            'success' => true,
            'banco' => true,
            'versao' => Configuracao::obter('versao'),
            'autenticado' => Sessao::usuario() !== null,
        ]);
    }

    /** POST /auth/login { identificador, senha } */
    public function login(Requisicao $req): void
    {
        $corpo = $req->corpo();
        $identificador = trim((string) ($corpo['identificador'] ?? ''));
        $senha = (string) ($corpo['senha'] ?? '');
        if ($identificador === '' || $senha === '') {
            throw new HttpException(400, 'Informe CPF (ou e-mail) e senha.');
        }

        $conta = $this->usuarios->buscarParaLogin($identificador);
        if ($conta === null || !Senha::verificar($senha, (string) $conta['senha_hash'])) {
            $this->auditoria->registrar('Aviso', 'AUTH', 'Falha de login',
                'Credenciais inválidas para o identificador ' . self::mascarar($identificador) . '.', null, $req->ip());
            throw new HttpException(401, 'CPF/e-mail ou senha inválidos.');
        }
        if (strcasecmp((string) $conta['status'], 'Ativo') !== 0) {
            $this->auditoria->registrar('Aviso', 'AUTH', 'Login bloqueado',
                "Conta com status \"{$conta['status']}\" tentou acessar.", $conta, $req->ip());
            throw new HttpException(403, 'Conta inativa. Procure a administração da unidade.');
        }

        $usuario = [
            'id' => (int) $conta['id'],
            'codigo' => $conta['codigo'],
            'nome' => $conta['nome'],
            'cpf' => $conta['cpf'],
            'perfil' => $conta['perfil'],
        ];
        Sessao::entrar($usuario);
        $this->auditoria->registrar('Acesso', 'AUTH', 'Login realizado',
            "Login de {$usuario['nome']} ({$usuario['perfil']}) validado no servidor.", $usuario, $req->ip());

        Resposta::json(['success' => true, 'user' => $usuario]);
    }

    /** POST /auth/logout */
    public function logout(Requisicao $req): void
    {
        $usuario = Sessao::usuario();
        if ($usuario !== null) {
            $this->auditoria->registrar('Acesso', 'AUTH', 'Logout', "{$usuario['nome']} saiu do sistema.", $usuario, $req->ip());
        }
        Sessao::sair();
        Resposta::json(['success' => true]);
    }

    /** GET /auth/me */
    public function me(Requisicao $req): void
    {
        Resposta::json(['success' => true, 'user' => Sessao::exigirLogin()]);
    }

    private static function mascarar(string $identificador): string
    {
        $d = preg_replace('/\D/', '', $identificador);
        if (strlen($d) === 11) {
            return substr($d, 0, 3) . '.***.***-' . substr($d, -2);
        }
        return preg_replace('/(?<=.).(?=[^@]*@)/', '*', $identificador) ?? '***';
    }
}
