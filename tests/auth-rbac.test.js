const test = require('node:test');
const assert = require('node:assert');
const { webcrypto } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// ==========================================
// Mocks para simular ambiente do navegador
// ==========================================
globalThis.crypto = webcrypto;
globalThis.window = globalThis;

class StorageMock {
  constructor() { this.store = {}; }
  getItem(k) { return this.store[k] || null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
}
globalThis.localStorage = new StorageMock();
globalThis.sessionStorage = new StorageMock();

// Mock do App para a API logar eventos
globalThis.App = {
  addLog: () => {}
};

// ==========================================
// Carregar módulos do sistema UPA 24H
// ==========================================
const basePath = path.join(__dirname, '..', 'js');

function loadScript(relPath) {
  const code = fs.readFileSync(path.join(basePath, relPath), 'utf8');
  eval(code); // Importar os scripts para o contexto global
}

loadScript('config/permissoes.js');
loadScript('config/unidades.js');
loadScript('api/mock-http.js');
loadScript('api/crypto.js');
loadScript('api/usuarios.js');
loadScript('api/auth.js');

// ==========================================
// SUÍTE DE TESTES (Autenticação e RBAC)
// ==========================================

test('1. Crypto: Hash de senha e verificação (PBKDF2-SHA256)', async (t) => {
  const senhaPlana = 'minhasenha123';
  const hash = await window.Crypto.hashSenha(senhaPlana);
  
  assert.ok(hash.startsWith('pbkdf2:'), 'O hash deve começar com pbkdf2:');
  
  const verificaSucesso = await window.Crypto.verificarSenha(senhaPlana, hash);
  assert.strictEqual(verificaSucesso, true, 'A verificação da senha correta deve retornar true');
  
  const verificaFalha = await window.Crypto.verificarSenha('senhaerrada', hash);
  assert.strictEqual(verificaFalha, false, 'A verificação da senha incorreta deve retornar false');
});

test('2. Crypto: Geração de Token de Sessão Seguro', (t) => {
  const token = window.Crypto.gerarToken();
  assert.ok(typeof token === 'string' && token.length > 20, 'O token gerado deve ser uma string longa');
});

test('3. AuthAPI: POST /auth/login - Credenciais Inválidas', async (t) => {
  const res = await window.AuthAPI.processarLogin({ identificador: '000.000.000-00', senha: 'wrong' });
  assert.strictEqual(res.status, 401, 'Deve retornar HTTP 401 para usuário inexistente');
  assert.strictEqual(res.body.success, false);
});

test('4. AuthAPI: POST /auth/login - Validação Correta e Migração de Senha Plana', async (t) => {
  const usuarios = window.UsuariosAPI.getAll();
  const admin = usuarios.find(u => u.perfil === 'Administrador');
  
  // Senha padrão em texto plano é "admin" no seedInicial
  const res = await window.AuthAPI.processarLogin({ identificador: admin.cpf, senha: 'admin' });
  
  assert.strictEqual(res.status, 200, 'Deve retornar HTTP 200 no login bem-sucedido');
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.token, 'A resposta deve gerar e retornar o token de sessão');
  
  // Verifica middleware
  const acesso = window.AuthAPI.verificarAcesso(res.body.token, { pagina: 'dashboard' });
  assert.strictEqual(acesso.permitido, true, 'O middleware deve liberar acesso após autenticação');
});

test('5. Permissoes: Regras de Restrição de Acesso por Perfil (RBAC)', (t) => {
  // Testando restrições do Cidadão e Paciente
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Cidadão', 'logs'), false, 'Cidadão não pode acessar Logs');
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Paciente', 'logs'), false, 'Paciente não pode acessar Logs');
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Cidadão', 'dashboard'), false, 'Cidadão não pode acessar Dashboard centralizado');
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Paciente', 'dashboard'), false, 'Paciente não pode acessar Dashboard centralizado');
  
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Cidadão', 'agendamentos'), true, 'Cidadão tem visão própria de Agendamentos');
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Paciente', 'agendamentos'), true, 'Paciente tem visão própria de Agendamentos');
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Paciente', 'consultas'), true, 'Paciente tem visão própria de Consultas');
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Paciente', 'exames'), true, 'Paciente tem visão própria de Exames');
  
  // Testando restrições da equipe
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Profissional da Saúde', 'logs'), false, 'Profissional não deve ver Logs de Sistema');
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Profissional da Saúde', 'cadastro-usuarios'), false, 'Profissional não deve ver Cadastro de Usuários');
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Profissional da Saúde', 'dashboard'), true, 'Profissional tem acesso ao Dashboard clínico');
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Administrador', 'logs'), true, 'Administrador tem acesso completo (Logs)');
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Administrador', 'cadastro-usuarios'), true, 'Administrador gerencia cadastro de usuários');
});

test('6. AuthAPI Middleware: Restrição de Ações Privilegiadas (gerenciar_atendimentos)', async (t) => {
  const usuarios = window.UsuariosAPI.getAll();
  
  // Testa Acesso do Profissional da Saúde
  const prof = usuarios.find(u => u.perfil === 'Profissional da Saúde');
  const loginProf = await window.AuthAPI.processarLogin({ identificador: prof.cpf, senha: 'prof123' });
  const acessoProf = window.AuthAPI.verificarAcesso(loginProf.body.token, { acao: 'gerenciar_atendimentos' });
  
  assert.strictEqual(acessoProf.permitido, false, 'Profissional de Saúde não agenda, apenas atende');
  assert.strictEqual(acessoProf.status, 403, 'Acesso restrito deve retornar 403');
  
  // Testa Acesso do Administrador
  const adm = usuarios.find(u => u.perfil === 'Administrador');
  const loginAdm = await window.AuthAPI.processarLogin({ identificador: adm.cpf, senha: 'admin' });
  const acessoAdm = window.AuthAPI.verificarAcesso(loginAdm.body.token, { acao: 'gerenciar_atendimentos' });
  
  assert.strictEqual(acessoAdm.permitido, true, 'Administrador pode gerenciar agendamentos');
  assert.strictEqual(acessoAdm.status, 200);
});

test('7. AuthAPI: Login de Paciente e Restrição Rigorosa de Páginas (RBAC)', async (t) => {
  const usuarios = window.UsuariosAPI.getAll();
  const paciente = usuarios.find(u => u.perfil === 'Paciente' || u.perfil === 'Cidadão');
  assert.ok(paciente, 'Deve existir usuário de teste do perfil Paciente');

  const loginPac = await window.AuthAPI.processarLogin({ identificador: paciente.cpf, senha: 'paciente123' });
  assert.strictEqual(loginPac.status, 200, 'Login do Paciente deve ser bem-sucedido');
  const token = loginPac.body.token;

  // Telas permitidas
  assert.strictEqual(window.AuthAPI.verificarAcesso(token, { pagina: 'agendamentos' }).permitido, true);
  assert.strictEqual(window.AuthAPI.verificarAcesso(token, { pagina: 'consultas' }).permitido, true);
  assert.strictEqual(window.AuthAPI.verificarAcesso(token, { pagina: 'exames' }).permitido, true);

  // Telas estritamente restritas
  const acessoDash = window.AuthAPI.verificarAcesso(token, { pagina: 'dashboard' });
  assert.strictEqual(acessoDash.permitido, false, 'Paciente não pode ver Dashboard geral');
  assert.strictEqual(acessoDash.status, 403);

  const acessoLogs = window.AuthAPI.verificarAcesso(token, { pagina: 'logs' });
  assert.strictEqual(acessoLogs.permitido, false, 'Paciente não pode acessar Logs');
  assert.strictEqual(acessoLogs.status, 403);

  const acessoCad = window.AuthAPI.verificarAcesso(token, { pagina: 'cadastro-usuarios' });
  assert.strictEqual(acessoCad.permitido, false, 'Paciente não pode acessar Cadastro de Usuários');
  assert.strictEqual(acessoCad.status, 403);

  const acessoUnidades = window.AuthAPI.verificarAcesso(token, { pagina: 'unidades' });
  assert.strictEqual(acessoUnidades.permitido, false, 'Paciente não acessa gestão de Unidades');
  assert.strictEqual(acessoUnidades.status, 403);
});

test('8. AuthAPI: Login de Profissional da Saúde e Restrições de Acesso', async (t) => {
  const usuarios = window.UsuariosAPI.getAll();
  const prof = usuarios.find(u => u.perfil === 'Profissional da Saúde');
  assert.ok(prof, 'Deve existir usuário de teste Profissional da Saúde');

  const loginProf = await window.AuthAPI.processarLogin({ identificador: prof.cpf, senha: 'prof123' });
  assert.strictEqual(loginProf.status, 200);
  const token = loginProf.body.token;

  // Telas clínicas permitidas
  assert.strictEqual(window.AuthAPI.verificarAcesso(token, { pagina: 'dashboard' }).permitido, true);
  assert.strictEqual(window.AuthAPI.verificarAcesso(token, { pagina: 'consultas' }).permitido, true);
  assert.strictEqual(window.AuthAPI.verificarAcesso(token, { pagina: 'exames' }).permitido, true);
  assert.strictEqual(window.AuthAPI.verificarAcesso(token, { pagina: 'unidades' }).permitido, true);

  // Telas administrativas restritas
  assert.strictEqual(window.AuthAPI.verificarAcesso(token, { pagina: 'logs' }).permitido, false);
  assert.strictEqual(window.AuthAPI.verificarAcesso(token, { pagina: 'logs' }).status, 403);
  assert.strictEqual(window.AuthAPI.verificarAcesso(token, { pagina: 'cadastro-usuarios' }).permitido, false);
  assert.strictEqual(window.AuthAPI.verificarAcesso(token, { pagina: 'cadastro-usuarios' }).status, 403);
});

test('9. AuthAPI: Ação Privilegiada cadastrar_usuarios (Exclusivo Administrador)', async (t) => {
  const usuarios = window.UsuariosAPI.getAll();
  
  // Paciente
  const pac = usuarios.find(u => u.perfil === 'Paciente' || u.perfil === 'Cidadão');
  const loginPac = await window.AuthAPI.processarLogin({ identificador: pac.cpf, senha: 'paciente123' });
  const acessoCadPac = window.AuthAPI.verificarAcesso(loginPac.body.token, { acao: 'cadastrar_usuarios' });
  assert.strictEqual(acessoCadPac.permitido, false, 'Paciente não pode cadastrar usuários');
  assert.strictEqual(acessoCadPac.status, 403);

  // Profissional da Saúde
  const prof = usuarios.find(u => u.perfil === 'Profissional da Saúde');
  const loginProf = await window.AuthAPI.processarLogin({ identificador: prof.cpf, senha: 'prof123' });
  const acessoCadProf = window.AuthAPI.verificarAcesso(loginProf.body.token, { acao: 'cadastrar_usuarios' });
  assert.strictEqual(acessoCadProf.permitido, false, 'Profissional não pode cadastrar usuários');
  assert.strictEqual(acessoCadProf.status, 403);

  // Administrador
  const adm = usuarios.find(u => u.perfil === 'Administrador');
  const loginAdm = await window.AuthAPI.processarLogin({ identificador: adm.cpf, senha: 'admin' });
  const acessoCadAdm = window.AuthAPI.verificarAcesso(loginAdm.body.token, { acao: 'cadastrar_usuarios' });
  assert.strictEqual(acessoCadAdm.permitido, true, 'Administrador pode cadastrar usuários');
  assert.strictEqual(acessoCadAdm.status, 200);
});

test('10. AuthAPI Middleware: Sessão Expirada ou Token Inválido', (t) => {
  // Token inexistente
  const acessoInvalido = window.AuthAPI.verificarAcesso('token-falso-xyz', { pagina: 'dashboard' });
  assert.strictEqual(acessoInvalido.permitido, false);
  assert.strictEqual(acessoInvalido.status, 401);

  // Token nulo
  const acessoNulo = window.AuthAPI.verificarAcesso(null, { pagina: 'dashboard' });
  assert.strictEqual(acessoNulo.permitido, false);
  assert.strictEqual(acessoNulo.status, 401);
});

test('11. AuthAPI: Logout e Invalidação da Sessão', async (t) => {
  const usuarios = window.UsuariosAPI.getAll();
  const admin = usuarios.find(u => u.perfil === 'Administrador');
  const loginRes = await window.AuthAPI.processarLogin({ identificador: admin.cpf, senha: 'admin' });
  const token = loginRes.body.token;

  // Sessão válida antes do logout
  const antes = window.AuthAPI.verificarAcesso(token, { pagina: 'dashboard' });
  assert.strictEqual(antes.permitido, true);

  // Executa logout
  const logoutRes = window.AuthAPI.processarLogout(token);
  assert.strictEqual(logoutRes.status, 200);

  // Sessão deve estar invalidada
  const depois = window.AuthAPI.verificarAcesso(token, { pagina: 'dashboard' });
  assert.strictEqual(depois.permitido, false);
  assert.strictEqual(depois.status, 401);
});

test('12. Crypto/AuthAPI: Resiliência contra hash corrompido ou Base64 inválido (sem erro de atob)', async (t) => {
  // 1. Deve tratar string com Base64 corrompido sem disparar exceção uncaught
  const resultado = await window.Crypto.verificarSenha('admin', 'pbkdf2:100000:admin:invalido');
  assert.strictEqual(resultado, false, 'Hash corrompido deve retornar false de forma segura');

  // 2. Simula usuário com hash corrompido no banco de dados local
  const usuarios = window.UsuariosAPI.getAll();
  const adm = usuarios.find(u => u.perfil === 'Administrador' || u.cpf === '111.444.777-35');
  adm.senha = 'pbkdf2:100000:invalido-salt:invalido-hash';
  window.UsuariosAPI.persist(usuarios);

  // 3. O login do Administrador deve auto-recuperar e ter sucesso com HTTP 200
  const loginRes = await window.AuthAPI.processarLogin({ identificador: adm.cpf, senha: 'admin' });
  assert.strictEqual(loginRes.status, 200, 'Login do Administrador deve ter sucesso');
  assert.strictEqual(loginRes.body.success, true);
  assert.ok(loginRes.body.token, 'Token de sessão gerado com sucesso');
  assert.ok(window.Crypto.senhaEstaHasheada(adm.senha), 'Senha deve ter sido devidamente re-hasheada');
});
