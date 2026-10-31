const test = require('node:test');
const assert = require('node:assert');
const { prepararAmbiente, carregar, loginComo, chamar, SEED } = require('./helpers/ambiente');

prepararAmbiente();
carregar('config/permissoes.js', 'api/http.js', 'api/crypto.js', 'api/usuarios.js', 'api/auth.js', 'api/auditoria.js', 'api/unidades.js');
window.AuthAPI.registrarInterceptor();

const valida = (extra = {}) => ({
  nome: `UPA Teste ${Math.random().toString(36).slice(2, 7)}`,
  endereco: 'Rua das Flores, 100 – Centro',
  telefone: '(11) 3333-4444',
  tipo: 'UPA',
  capacidade: 120,
  ...extra
});

test('Unidades: seed inicial tem unidades com capacidade numérica e tipo válido', () => {
  const todas = window.UnidadesAPI.getAll();
  assert.ok(todas.length >= 5);
  for (const u of todas) {
    assert.ok(Number.isInteger(u.capacidade) && u.capacidade > 0, `${u.nome} deveria ter capacidade inteira`);
    assert.ok(window.UnidadesAPI.TIPOS.includes(u.tipo));
  }
});

test('Unidades: cadastro válido retorna 201 com status Operacional e gera auditoria', async () => {
  const res = await window.UnidadesAPI.cadastrar(valida({ nome: 'UPA 24h Vila Esperança' }), 'Gestor Teste');
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.unidade.status, 'Operacional');
  assert.strictEqual(res.body.unidade.capacidade, 120);
  assert.ok(res.body.unidade.id);
  const logs = window.AuditoriaService.listar({ busca: 'Vila Esperança' });
  assert.strictEqual(logs.length, 1);
  assert.strictEqual(logs[0].usuario, 'Gestor Teste');
});

test('Unidades: cada campo obrigatório ausente gera 400 indicando o campo', async () => {
  for (const campo of ['nome', 'endereco', 'telefone', 'tipo', 'capacidade']) {
    const dados = valida();
    delete dados[campo];
    const res = await window.UnidadesAPI.cadastrar(dados);
    assert.strictEqual(res.status, 400, `sem ${campo} deveria falhar`);
    assert.strictEqual(res.body.campo, campo);
  }
});

test('Unidades: telefone precisa de DDD + 8 ou 9 dígitos', async () => {
  assert.strictEqual((await window.UnidadesAPI.cadastrar(valida({ telefone: '3333-4444' }))).status, 400);
  assert.strictEqual((await window.UnidadesAPI.cadastrar(valida({ telefone: '(11) 98765-4321' }))).status, 201);
  assert.strictEqual((await window.UnidadesAPI.cadastrar(valida({ telefone: '1133334444' }))).status, 201);
});

test('Unidades: tipo fora da lista e capacidade não inteira/negativa são recusados', async () => {
  const tipo = await window.UnidadesAPI.cadastrar(valida({ tipo: 'Farmácia' }));
  assert.strictEqual(tipo.status, 400);
  assert.strictEqual(tipo.body.campo, 'tipo');
  for (const capacidade of [0, -5, 12.5, 'muitos', 200001]) {
    const r = await window.UnidadesAPI.cadastrar(valida({ capacidade }));
    assert.strictEqual(r.status, 400, `capacidade ${capacidade} deveria falhar`);
    assert.strictEqual(r.body.campo, 'capacidade');
  }
  assert.strictEqual((await window.UnidadesAPI.cadastrar(valida({ capacidade: '80' }))).status, 201, 'string numérica é aceita');
});

test('Unidades: nome duplicado (ignorando maiúsculas/espaços) é recusado com 409', async () => {
  await window.UnidadesAPI.cadastrar(valida({ nome: 'UBS Jardim Primavera' }));
  const dup = await window.UnidadesAPI.cadastrar(valida({ nome: '  ubs jardim primavera ' }));
  assert.strictEqual(dup.status, 409);
});

test('Unidades: listagem paginada informa página, total e total de páginas', () => {
  const total = window.UnidadesAPI.getAll().length;
  const p1 = window.UnidadesAPI.listar({ pagina: 1, porPagina: 3 });
  assert.strictEqual(p1.data.length, 3);
  assert.deepStrictEqual(p1.paginacao, { pagina: 1, porPagina: 3, total, totalPaginas: Math.ceil(total / 3) });
  const ultima = window.UnidadesAPI.listar({ pagina: p1.paginacao.totalPaginas, porPagina: 3 });
  assert.strictEqual(ultima.data.length, total - 3 * (p1.paginacao.totalPaginas - 1));
  const p2 = window.UnidadesAPI.listar({ pagina: 2, porPagina: 3 });
  assert.notStrictEqual(p1.data[0].id, p2.data[0].id, 'páginas não se repetem');
});

test('Unidades: paginação saneia parâmetros inválidos (página < 1, porPagina > 100)', () => {
  const r = window.UnidadesAPI.listar({ pagina: '-4', porPagina: '5000' });
  assert.strictEqual(r.paginacao.pagina, 1);
  assert.strictEqual(r.paginacao.porPagina, 100);
});

test('Unidades: filtros por tipo, status e busca combinam com a paginação', () => {
  const r = window.UnidadesAPI.listar({ tipo: 'Hospital', porPagina: 50 });
  assert.ok(r.data.length >= 1);
  assert.ok(r.data.every(u => u.tipo === 'Hospital'));
  assert.strictEqual(r.paginacao.total, r.data.length);
  const busca = window.UnidadesAPI.listar({ busca: 'palmeiras' });
  assert.ok(busca.data.every(u => `${u.nome} ${u.endereco}`.toLowerCase().includes('palmeiras')));
});

test('Unidades: indicadores (total, ativas, capacidade das ativas, por tipo) refletem os dados', async () => {
  const antes = window.UnidadesAPI.getIndicadores();
  const r = await window.UnidadesAPI.cadastrar(valida({ tipo: 'AME', capacidade: 70 }));
  const depois = window.UnidadesAPI.getIndicadores();
  assert.strictEqual(depois.total, antes.total + 1);
  assert.strictEqual(depois.ativas, antes.ativas + 1);
  assert.strictEqual(depois.capacidadeTotal, antes.capacidadeTotal + 70);
  assert.strictEqual(depois.porTipo.AME, (antes.porTipo.AME || 0) + 1);

  await window.UnidadesAPI.alterarStatus(r.body.unidade.id, 'Manutenção');
  const manut = window.UnidadesAPI.getIndicadores();
  assert.strictEqual(manut.ativas, antes.ativas, 'unidade em manutenção não conta como ativa');
  assert.strictEqual(manut.capacidadeTotal, antes.capacidadeTotal, 'nem soma capacidade');
});

test('Unidades: alterarStatus valida status e unidade existente', async () => {
  assert.strictEqual((await window.UnidadesAPI.alterarStatus('nao-existe', 'Inativa')).status, 404);
  const id = window.UnidadesAPI.getAll()[0].id;
  assert.strictEqual((await window.UnidadesAPI.alterarStatus(id, 'Explodida')).status, 400);
});

test('Rota POST /unidades/cadastrar: só Administrador (401 sem token, 403 Profissional, 201 Admin)', async () => {
  const body = valida();
  assert.strictEqual((await chamar('/unidades/cadastrar', { method: 'POST', body })).status, 401);
  const tProf = await loginComo(SEED.prof.cpf, SEED.prof.senha);
  assert.strictEqual((await chamar('/unidades/cadastrar', { method: 'POST', token: tProf, body })).status, 403);
  const tAdm = await loginComo(SEED.admin.cpf, SEED.admin.senha);
  const ok = await chamar('/unidades/cadastrar', { method: 'POST', token: tAdm, body });
  assert.strictEqual(ok.status, 201);
});

test('Rota GET /unidades: paginada para quem acessa a tela; Cidadão recebe 403', async () => {
  const tProf = await loginComo(SEED.prof.cpf, SEED.prof.senha);
  const res = await chamar('/unidades?pagina=1&porPagina=2', { token: tProf });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 2);
  assert.strictEqual(res.body.paginacao.porPagina, 2);
  const tPac = await loginComo(SEED.paciente.cpf, SEED.paciente.senha);
  assert.strictEqual((await chamar('/unidades', { token: tPac })).status, 403);
  const ind = await chamar('/unidades/indicadores', { token: tProf });
  assert.strictEqual(ind.status, 200);
  assert.ok(typeof ind.body.indicadores.capacidadeTotal === 'number');
});
