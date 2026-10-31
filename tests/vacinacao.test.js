const test = require('node:test');
const assert = require('node:assert');
const { prepararAmbiente, carregar, loginComo, chamar, SEED } = require('./helpers/ambiente');

prepararAmbiente();
carregar('config/permissoes.js', 'api/http.js', 'api/crypto.js', 'api/usuarios.js', 'api/auth.js', 'api/auditoria.js', 'api/vacinacao.js');
window.AuthAPI.registrarInterceptor();

const V = () => window.VacinacaoAPI;
const vacina = (nome) => V().getEstoque().find(v => v.nome.startsWith(nome));
let seqCpf = 0;
// CPFs válidos distintos para cada aplicação
function cpfValido() {
  const base = String(100000000 + (seqCpf++ * 7919)).slice(0, 9);
  const dv = (s, n) => { let t = 0; for (let i = 0; i < s.length; i++) t += +s[i] * (n - i); const r = (t * 10) % 11; return r === 10 ? 0 : r; };
  const d1 = dv(base, 10);
  return base + d1 + dv(base + d1, 11);
}
const aplicacao = (extra = {}) => ({
  paciente: 'Paciente Vacina', cpf: cpfValido(), vacinaId: vacina('Influenza').id,
  dose: 'Dose única', unidade: 'Unidade Central', profissional: 'Enf. Cláudia', ...extra
});

test('Vacinação: registrar aplicação válida retorna 201 e baixa 1 dose do estoque', async () => {
  const antes = vacina('Influenza').estoque;
  const res = await V().registrarAplicacao(aplicacao(), 'Enf. Cláudia');
  assert.strictEqual(res.status, 201);
  assert.strictEqual(vacina('Influenza').estoque, antes - 1);
  assert.ok(res.body.aplicacao.dataHora, 'data/hora real da aplicação é registrada');
  assert.ok(!Number.isNaN(Date.parse(res.body.aplicacao.dataHora)));
});

test('Vacinação: campos obrigatórios (paciente, cpf, vacina, dose, unidade) geram 400', async () => {
  for (const campo of ['paciente', 'cpf', 'vacinaId', 'dose', 'unidade']) {
    const d = aplicacao();
    delete d[campo];
    const r = await V().registrarAplicacao(d);
    assert.strictEqual(r.status, 400, `sem ${campo}`);
  }
  assert.strictEqual((await V().registrarAplicacao(aplicacao({ cpf: '111.111.111-11' }))).status, 400, 'CPF inválido');
  assert.strictEqual((await V().registrarAplicacao(aplicacao({ dose: '7ª dose' }))).status, 400, 'dose inválida');
});

test('Vacinação: vacina inexistente retorna 404', async () => {
  assert.strictEqual((await V().registrarAplicacao(aplicacao({ vacinaId: 'VAC-999' }))).status, 404);
});

test('Vacinação: mesma dose da mesma vacina para o mesmo CPF é recusada (409)', async () => {
  const cpf = cpfValido();
  const id = vacina('Hepatite B').id;
  assert.strictEqual((await V().registrarAplicacao(aplicacao({ cpf, vacinaId: id, dose: '1ª dose' }))).status, 201);
  assert.strictEqual((await V().registrarAplicacao(aplicacao({ cpf, vacinaId: id, dose: '1ª dose' }))).status, 409);
  assert.strictEqual((await V().registrarAplicacao(aplicacao({ cpf, vacinaId: id, dose: '2ª dose' }))).status, 201);
});

test('Vacinação: estoque esgotado bloqueia a aplicação (409) sem ficar negativo', async () => {
  const id = vacina('Meningite').id;
  const lista = V().getEstoque();
  lista.find(v => v.id === id).estoque = 1;
  V().persistirVacinas(lista);
  assert.strictEqual((await V().registrarAplicacao(aplicacao({ vacinaId: id }))).status, 201);
  const r = await V().registrarAplicacao(aplicacao({ vacinaId: id }));
  assert.strictEqual(r.status, 409);
  assert.match(r.body.error, /esgotad/i);
  assert.strictEqual(vacina('Meningite').estoque, 0);
});

test('Vacinação: aplicação que deixa o estoque no mínimo devolve alerta e registra Aviso', async () => {
  const id = vacina('COVID').id;
  const lista = V().getEstoque();
  const alvo = lista.find(v => v.id === id);
  alvo.estoque = alvo.estoqueMinimo + 1;
  V().persistirVacinas(lista);
  const r = await V().registrarAplicacao(aplicacao({ vacinaId: id, dose: 'Reforço' }));
  assert.strictEqual(r.status, 201);
  assert.ok(r.body.alertaEstoque, 'resposta deve trazer o alerta de baixo estoque');
  assert.strictEqual(r.body.alertaEstoque.estoque, alvo.estoqueMinimo);
  const avisos = window.AuditoriaService.listar({ tipo: 'Aviso', busca: 'estoque' });
  assert.ok(avisos.some(l => l.descricao.includes(alvo.nome)));
});

test('Vacinação: situação do estoque classifica Normal / Atenção / Crítico / Esgotado', () => {
  const s = V().situacaoEstoque;
  assert.strictEqual(s({ estoque: 0, estoqueMinimo: 50 }), 'Esgotado');
  assert.strictEqual(s({ estoque: 50, estoqueMinimo: 50 }), 'Crítico');
  assert.strictEqual(s({ estoque: 100, estoqueMinimo: 50 }), 'Atenção');
  assert.strictEqual(s({ estoque: 101, estoqueMinimo: 50 }), 'Normal');
});

test('Vacinação: alertas listam as vacinas em Crítico ou Esgotado', () => {
  const alertas = V().getAlertas();
  assert.ok(alertas.length >= 1);
  assert.ok(alertas.every(a => ['Crítico', 'Esgotado'].includes(a.situacao)));
  assert.ok(alertas.some(a => a.nome.startsWith('Febre Amarela')), 'Febre Amarela começa abaixo do mínimo no seed');
});

test('Vacinação: entrada de estoque soma doses e exige quantidade inteira positiva', async () => {
  const id = vacina('Febre Amarela').id;
  const antes = vacina('Febre Amarela').estoque;
  assert.strictEqual((await V().registrarEntradaEstoque({ vacinaId: id, quantidade: 0 })).status, 400);
  assert.strictEqual((await V().registrarEntradaEstoque({ vacinaId: id, quantidade: 2.5 })).status, 400);
  const ok = await V().registrarEntradaEstoque({ vacinaId: id, quantidade: 500, lote: 'FA-2026-11' }, 'Gestor');
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(vacina('Febre Amarela').estoque, antes + 500);
});

test('Vacinação: indicadores — doses hoje/mês, cobertura e estoque crítico', async () => {
  const agora = new Date(2031, 2, 15, 10, 0); // data isolada dos demais testes
  const ind0 = V().getIndicadores(agora);
  assert.strictEqual(ind0.dosesHoje, 0);
  await V().registrarAplicacao(aplicacao(), 'Enf.', agora);
  await V().registrarAplicacao(aplicacao(), 'Enf.', new Date(2031, 2, 2, 9, 0));
  const ind = V().getIndicadores(agora);
  assert.strictEqual(ind.dosesHoje, 1);
  assert.strictEqual(ind.dosesMes, 2);
  assert.ok(ind.coberturaVacinal > 0 && ind.coberturaVacinal <= 100);
  assert.strictEqual(ind.estoqueCritico, V().getAlertas().length);
});

test('Vacinação: cobertura = doses aplicadas ÷ população-alvo', () => {
  const vac = V().getEstoque();
  const esperado = Number(((vac.reduce((s, v) => s + v.aplicadas, 0) / vac.reduce((s, v) => s + v.populacaoAlvo, 0)) * 100).toFixed(1));
  assert.strictEqual(V().getIndicadores().coberturaVacinal, esperado);
});

test('Rota POST /vacinacao/registrar-aplicacao: Profissional registra, Recepção recebe 403, sem token 401', async () => {
  const body = aplicacao();
  assert.strictEqual((await chamar('/vacinacao/registrar-aplicacao', { method: 'POST', body })).status, 401);
  const tRecep = await loginComo(SEED.recepcao.cpf, SEED.recepcao.senha);
  assert.strictEqual((await chamar('/vacinacao/registrar-aplicacao', { method: 'POST', token: tRecep, body })).status, 403);
  const tProf = await loginComo(SEED.prof.cpf, SEED.prof.senha);
  const ok = await chamar('/vacinacao/registrar-aplicacao', { method: 'POST', token: tProf, body });
  assert.strictEqual(ok.status, 201);
  assert.strictEqual(ok.body.aplicacao.registradoPor, 'Dr. Carlos Eduardo Mendes', 'autor vem da sessão');
});

test('Rota POST /vacinacao/estoque/entrada: exclusiva do Administrador', async () => {
  const body = { vacinaId: vacina('Influenza').id, quantidade: 10 };
  const tProf = await loginComo(SEED.prof.cpf, SEED.prof.senha);
  assert.strictEqual((await chamar('/vacinacao/estoque/entrada', { method: 'POST', token: tProf, body })).status, 403);
  const tAdm = await loginComo(SEED.admin.cpf, SEED.admin.senha);
  assert.strictEqual((await chamar('/vacinacao/estoque/entrada', { method: 'POST', token: tAdm, body })).status, 200);
});

test('Rota GET /vacinacao/indicadores: disponível para a equipe com acesso à tela', async () => {
  const tProf = await loginComo(SEED.prof.cpf, SEED.prof.senha);
  const r = await chamar('/vacinacao/indicadores', { token: tProf });
  assert.strictEqual(r.status, 200);
  assert.ok(typeof r.body.indicadores.coberturaVacinal === 'number');
  const tPac = await loginComo(SEED.paciente.cpf, SEED.paciente.senha);
  assert.strictEqual((await chamar('/vacinacao/indicadores', { token: tPac })).status, 403);
});
