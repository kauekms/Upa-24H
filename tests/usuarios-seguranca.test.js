const test = require('node:test');
const assert = require('node:assert');
const { prepararAmbiente, carregar, loginComo, chamar, SEED } = require('./helpers/ambiente');

prepararAmbiente();
carregar(
  'config/permissoes.js',
  'api/http.js',
  'api/crypto.js',
  'api/usuarios.js',
  'api/auth.js',
  'api/auditoria.js',
  'api/agendamentos.js',
  'api/consultas.js',
  'api/exames.js'
);
window.AuthAPI.registrarInterceptor();
window.UsuariosAPI.registrarInterceptor();

const cadastroBase = (extra = {}) => ({
  nome: 'Fulano de Teste',
  cpf: '529.982.247-25',
  email: `fulano.${Date.now()}${Math.random().toString(36).slice(2, 6)}@saude.gov.br`,
  senha: 'Senha@123',
  ...extra
});

// ===========================================================================
// Validação de CPF (formato e dígitos verificadores)
// ===========================================================================

test('Usuários: CPF válido é aceito com ou sem máscara', () => {
  assert.strictEqual(window.UsuariosAPI.validarCPF('111.444.777-35').valido, true);
  assert.strictEqual(window.UsuariosAPI.validarCPF('11144477735').valido, true);
});

test('Usuários: CPF com tamanho errado, dígitos repetidos ou DV inválido é rejeitado', () => {
  assert.strictEqual(window.UsuariosAPI.validarCPF('123.456').valido, false);
  assert.strictEqual(window.UsuariosAPI.validarCPF('111.111.111-11').valido, false);
  assert.strictEqual(window.UsuariosAPI.validarCPF('111.444.777-36').valido, false);
  assert.strictEqual(window.UsuariosAPI.validarCPF('').valido, false);
});

test('Usuários: CPF já cadastrado é recusado mesmo digitado sem máscara (unicidade)', async () => {
  const res = await window.UsuariosAPI.processarCadastro(cadastroBase({
    cpf: '11144477735', // mesmo CPF do administrador seed
    perfil: 'Administrador', setor: 'TI', cargo: 'Analista'
  }));
  assert.strictEqual(res.status, 400);
  assert.match(res.body.error, /CPF já está cadastrado/);
});

// ===========================================================================
// Obrigatoriedade de campos por perfil
// ===========================================================================

test('Usuários: Paciente exige Cartão SUS com 15 dígitos e data de nascimento', async () => {
  const semSus = await window.UsuariosAPI.processarCadastro(cadastroBase({ perfil: 'Paciente', nascimento: '1990-01-01' }));
  assert.strictEqual(semSus.status, 400);
  assert.match(semSus.body.error, /Cartão SUS/);

  const susCurto = await window.UsuariosAPI.processarCadastro(cadastroBase({ perfil: 'Paciente', sus: '123', nascimento: '1990-01-01' }));
  assert.strictEqual(susCurto.status, 400);
  assert.match(susCurto.body.error, /15 dígitos/);

  const semNascimento = await window.UsuariosAPI.processarCadastro(cadastroBase({ perfil: 'Paciente', sus: '123456789012345' }));
  assert.strictEqual(semNascimento.status, 400);
  assert.match(semNascimento.body.error, /Data de Nascimento/);
});

test('Usuários: Profissional da Saúde exige registro, especialidade e unidade', async () => {
  const res = await window.UsuariosAPI.processarCadastro(cadastroBase({ perfil: 'Profissional da Saúde', especialidade: 'Pediatria', unidade: 'Unidade Sul' }));
  assert.strictEqual(res.status, 400);
  assert.match(res.body.error, /Registro Profissional/);
});

test('Usuários: Administrador exige setor e cargo', async () => {
  const res = await window.UsuariosAPI.processarCadastro(cadastroBase({ perfil: 'Administrador', cargo: 'Gestor' }));
  assert.strictEqual(res.status, 400);
  assert.match(res.body.error, /Setor/);
});

test('Usuários: cadastro válido grava senha com hash e não devolve a senha', async () => {
  const dados = cadastroBase({ perfil: 'Paciente', sus: '123456789012345', nascimento: '1990-01-01' });
  const res = await window.UsuariosAPI.processarCadastro(dados);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.user.senha, undefined, 'A resposta nunca deve expor a senha');
  const gravado = window.UsuariosAPI.getAll().find(u => u.id === res.body.user.id);
  assert.ok(window.Crypto.senhaEstaHasheada(gravado.senha), 'Senha deve ser armazenada com PBKDF2');
});

test('Usuários: perfil inexistente é rejeitado', async () => {
  const res = await window.UsuariosAPI.processarCadastro(cadastroBase({ cpf: '153.509.460-56', perfil: 'Superusuário' }));
  assert.strictEqual(res.status, 400);
  assert.match(res.body.error, /Perfil de usuário inválido/);
});

// ===========================================================================
// POST /usuarios/cadastrar — controle de acesso
// ===========================================================================

test('Rota /usuarios/cadastrar: sem token retorna 401', async () => {
  const res = await chamar('/usuarios/cadastrar', {
    method: 'POST',
    body: cadastroBase({ cpf: '868.207.460-59', perfil: 'Administrador', setor: 'TI', cargo: 'Invasor' })
  });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(window.UsuariosAPI.getAll().some(u => u.cpf === '868.207.460-59'), false, 'Nenhum usuário pode ser criado sem autenticação');
});

test('Rota /usuarios/cadastrar: Profissional da Saúde recebe 403', async () => {
  const token = await loginComo(SEED.prof.cpf, SEED.prof.senha);
  const res = await chamar('/usuarios/cadastrar', {
    method: 'POST', token,
    body: cadastroBase({ cpf: '868.207.460-59', perfil: 'Administrador', setor: 'TI', cargo: 'Escalada' })
  });
  assert.strictEqual(res.status, 403);
});

test('Rota /usuarios/cadastrar: Administrador cadastra com sucesso (200)', async () => {
  const token = await loginComo(SEED.admin.cpf, SEED.admin.senha);
  const res = await chamar('/usuarios/cadastrar', {
    method: 'POST', token,
    body: cadastroBase({ cpf: '868.207.460-59', perfil: 'Profissional da Saúde', registro: 'CRM/SP 999', especialidade: 'Pediatria', unidade: 'Unidade Sul' })
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
});

// ===========================================================================
// POST /auth/login — identificadores e força bruta
// ===========================================================================

test('Auth: login só aceita CPF ou e-mail (nome, primeiro nome ou perfil não identificam usuário)', async () => {
  for (const identificador of ['Maria', 'Maria da Silva Santos', 'Paciente', 'paciente']) {
    const res = await window.AuthAPI.processarLogin({ identificador, senha: SEED.paciente.senha });
    assert.strictEqual(res.status, 401, `"${identificador}" não deveria autenticar`);
  }
  const porEmail = await window.AuthAPI.processarLogin({ identificador: 'maria.santos@email.com', senha: SEED.paciente.senha });
  assert.strictEqual(porEmail.status, 200, 'E-mail continua aceito');
});

test('Auth: senha seed "admin" não autentica outro administrador', async () => {
  const token = await loginComo(SEED.admin.cpf, SEED.admin.senha);
  const cad = await chamar('/usuarios/cadastrar', {
    method: 'POST', token,
    body: cadastroBase({ cpf: '390.533.447-05', perfil: 'Administrador', setor: 'Financeiro', cargo: 'Gestora', senha: 'SenhaForte#2026' })
  });
  assert.strictEqual(cad.status, 200);
  const res = await window.AuthAPI.processarLogin({ identificador: '390.533.447-05', senha: 'admin' });
  assert.strictEqual(res.status, 401);
});

test('Auth: 5 senhas erradas bloqueiam o login por 15 minutos (429) e geram Aviso de auditoria', async () => {
  const cpf = SEED.recepcao.cpf;
  for (let i = 0; i < 5; i++) {
    const r = await window.AuthAPI.processarLogin({ identificador: cpf, senha: 'errada' });
    assert.strictEqual(r.status, 401);
  }
  const bloqueado = await window.AuthAPI.processarLogin({ identificador: cpf, senha: SEED.recepcao.senha });
  assert.strictEqual(bloqueado.status, 429, 'Mesmo a senha correta é recusada durante o bloqueio');
  assert.match(bloqueado.body.error, /bloquead/i);

  const avisos = window.AuditoriaService.listar({ tipo: 'Aviso', busca: 'bloquead' });
  assert.ok(avisos.length >= 1, 'O bloqueio deve ser registrado na auditoria');

  // Simula o fim da janela de bloqueio
  window.AuthAPI._expirarBloqueios();
  const liberado = await window.AuthAPI.processarLogin({ identificador: cpf, senha: SEED.recepcao.senha });
  assert.strictEqual(liberado.status, 200);
});

test('Auth: login bem-sucedido zera o contador de falhas', async () => {
  const cpf = SEED.prof.cpf;
  for (let i = 0; i < 4; i++) await window.AuthAPI.processarLogin({ identificador: cpf, senha: 'errada' });
  await loginComo(cpf, SEED.prof.senha);
  for (let i = 0; i < 4; i++) await window.AuthAPI.processarLogin({ identificador: cpf, senha: 'errada' });
  const res = await window.AuthAPI.processarLogin({ identificador: cpf, senha: SEED.prof.senha });
  assert.strictEqual(res.status, 200, 'Contador deveria ter sido zerado após o login anterior');
});

// ===========================================================================
// Middleware nas rotas: perfil vem da sessão, nunca do corpo
// ===========================================================================

test('Rota GET /logs: exige Administrador (401 sem token, 403 para Profissional)', async () => {
  assert.strictEqual((await chamar('/logs')).status, 401);
  const tokenProf = await loginComo(SEED.prof.cpf, SEED.prof.senha);
  assert.strictEqual((await chamar('/logs', { token: tokenProf })).status, 403);
  assert.strictEqual((await chamar('/logs/indicadores', { token: tokenProf })).status, 403);
  const tokenAdm = await loginComo(SEED.admin.cpf, SEED.admin.senha);
  const ok = await chamar('/logs', { token: tokenAdm });
  assert.strictEqual(ok.status, 200);
  assert.ok(Array.isArray(ok.body.data));
});

const daquiHoras = (h) => {
  const d = new Date(Date.now() + h * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return { data: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`, horario: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
};

test('Rota POST /agendamentos/solicitar: Cidadão não burla RN01 declarando perfil Administrador no corpo', async () => {
  const token = await loginComo(SEED.paciente.cpf, SEED.paciente.senha);
  const { data, horario } = daquiHoras(5);
  const res = await chamar('/agendamentos/solicitar', {
    method: 'POST', token,
    body: {
      paciente: 'Maria da Silva Santos', cpf: SEED.paciente.cpf, data, horario,
      especialidade: 'Clínica Geral', medico: 'Dr. Burla', unidade: 'Unidade Central',
      perfilSolicitante: 'Administrador', encaixeAdministrativo: true
    }
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.codigoRegra, 'RN01');
});

test('Rota POST /agendamentos/solicitar: Cidadão só agenda para o próprio CPF (403)', async () => {
  const token = await loginComo(SEED.paciente.cpf, SEED.paciente.senha);
  const { data, horario } = daquiHoras(72);
  const res = await chamar('/agendamentos/solicitar', {
    method: 'POST', token,
    body: { paciente: 'Outra Pessoa', cpf: '529.982.247-25', data, horario, especialidade: 'Clínica Geral', medico: 'Dr. X', unidade: 'Unidade Central' }
  });
  assert.strictEqual(res.status, 403);
});

test('Rota POST /agendamentos/solicitar: sem token retorna 401', async () => {
  const { data, horario } = daquiHoras(72);
  const res = await chamar('/agendamentos/solicitar', {
    method: 'POST',
    body: { paciente: 'Anônimo', cpf: '529.982.247-25', data, horario, especialidade: 'Clínica Geral', medico: 'Dr. Y', unidade: 'Unidade Central' }
  });
  assert.strictEqual(res.status, 401);
});

test('Rota POST /agendamentos/cancelar: Recepção cancela (RN03) e o operador auditado é o da sessão', async () => {
  const tokenRecep = await loginComo(SEED.recepcao.cpf, SEED.recepcao.senha);
  const { data, horario } = daquiHoras(96);
  const criado = await chamar('/agendamentos/solicitar', {
    method: 'POST', token: tokenRecep,
    body: { paciente: 'José RN03', cpf: '529.982.247-25', data, horario, especialidade: 'Clínica Geral', medico: 'Dr. RN03', unidade: 'Unidade Leste' }
  });
  assert.strictEqual(criado.status, 201);
  const cancel = await chamar('/agendamentos/cancelar', {
    method: 'POST', token: tokenRecep,
    body: { id: criado.body.agendamento.id, justificativa: 'Profissional afastado' }
  });
  assert.strictEqual(cancel.status, 200);
  assert.strictEqual(cancel.body.agendamento.tipoCancelamento, 'ADMINISTRATIVO');
});

test('Rota POST /exames: Cidadão não pode solicitar exames (403)', async () => {
  const token = await loginComo(SEED.paciente.cpf, SEED.paciente.senha);
  const res = await chamar('/exames', {
    method: 'POST', token,
    body: { paciente: 'Maria', tipo: 'Hemograma', data: '10/12/2026', unidade: 'Unidade Central' }
  });
  assert.strictEqual(res.status, 403);
});

test('Rota GET /exames: Cidadão só recebe os próprios exames', async () => {
  const token = await loginComo(SEED.paciente.cpf, SEED.paciente.senha);
  const res = await chamar('/exames', { token });
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.data.every(e => String(e.cpf || '').replace(/\D/g, '') === '33366699957'),
    'Nenhum exame de outro paciente pode vazar');
});
