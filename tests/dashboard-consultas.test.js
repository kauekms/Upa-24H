const test = require('node:test');
const assert = require('node:assert');
const { prepararAmbiente, carregar, loginComo, chamar, SEED } = require('./helpers/ambiente');

prepararAmbiente();
carregar(
  'config/permissoes.js', 'api/http.js', 'api/crypto.js', 'api/usuarios.js', 'api/auth.js', 'api/auditoria.js',
  'api/agendamentos.js', 'api/consultas.js', 'api/exames.js', 'api/unidades.js', 'api/vacinacao.js', 'api/dashboard.js'
);
window.AuthAPI.registrarInterceptor();

const pad = (n) => String(n).padStart(2, '0');
const br = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;

// ===========================================================================
// Consultas
// ===========================================================================

test('Consultas: tempo médio de espera = média de (início − chegada) das consultas iniciadas', () => {
  window.ConsultasAPI.persist([
    { id: 'CS-1', paciente: 'A', medico: 'Dr. A', especialidade: 'X', data: '01/01/2030', chegada: '08:00', inicio: '08:10', status: 'Concluída', duracao: '50 min' },
    { id: 'CS-2', paciente: 'B', medico: 'Dr. A', especialidade: 'X', data: '01/01/2030', chegada: '08:00', inicio: '08:30', status: 'Em Andamento', duracao: '—' },
    { id: 'CS-3', paciente: 'C', medico: 'Dr. A', especialidade: 'X', data: '01/01/2030', inicio: '09:00', status: 'Agendada', duracao: '—' }
  ]);
  const ind = window.ConsultasAPI.getIndicadores().indicadores;
  assert.strictEqual(ind.tempoMedioMinutos, 20, '(10 + 30) / 2 — a duração de 50 min não entra');
  assert.strictEqual(ind.tempoMedioEspera, '20 min');
});

test('Consultas: sem consultas iniciadas com chegada registrada, o tempo médio é 0 min', () => {
  window.ConsultasAPI.persist([{ id: 'CS-9', paciente: 'Z', medico: 'Dr. Z', especialidade: 'X', inicio: '10:00', status: 'Agendada' }]);
  assert.strictEqual(window.ConsultasAPI.getIndicadores().indicadores.tempoMedioEspera, '0 min');
});

test('Consultas: criar consulta no mesmo horário do mesmo profissional é recusado (409)', async () => {
  window.ConsultasAPI.persist([]);
  const base = { paciente: 'Paciente 1', especialidade: 'Clínica Geral', medico: 'Dr. Manoel Joaquim', inicio: '10:00', data: '05/12/2030' };
  const a = await window.ConsultasAPI.criar(base);
  assert.strictEqual(a.status, 200);
  const b = await window.ConsultasAPI.criar({ ...base, paciente: 'Paciente 2' });
  assert.strictEqual(b.status, 409);
  const outroHorario = await window.ConsultasAPI.criar({ ...base, paciente: 'Paciente 3', inicio: '10:30' });
  assert.strictEqual(outroHorario.status, 200);
  assert.notStrictEqual(a.body.consulta.id, outroHorario.body.consulta.id);
});

test('Consultas: IDs continuam únicos mesmo após remoção de registros', async () => {
  window.ConsultasAPI.persist([{ id: 'CS-105', paciente: 'X', medico: 'Dr. X', especialidade: 'Y', inicio: '07:00', status: 'Agendada' }]);
  const r = await window.ConsultasAPI.criar({ paciente: 'Novo', especialidade: 'Y', medico: 'Dr. Y', inicio: '07:00' });
  assert.strictEqual(r.body.consulta.id, 'CS-106');
});

test('Consultas: atualizarStatus recusa status fora da lista', async () => {
  window.ConsultasAPI.persist([{ id: 'CS-1', paciente: 'A', medico: 'Dr. A', especialidade: 'X', inicio: '08:00', status: 'Agendada' }]);
  assert.strictEqual((await window.ConsultasAPI.atualizarStatus('CS-1', 'Teleportada')).status, 400);
  assert.strictEqual((await window.ConsultasAPI.atualizarStatus('CS-1', 'Não Compareceu')).status, 200);
});

// ===========================================================================
// Dashboard — endpoint agregador
// ===========================================================================

test('Dashboard: agendamentos do dia contam só os de hoje e não cancelados', () => {
  const hoje = new Date(2030, 6, 10, 9, 0);
  const amanha = new Date(2030, 6, 11, 9, 0);
  window.AgendamentosAPI.persist([
    { id: '#1', paciente: 'A', cpf: '1', data: br(hoje), horario: '10:00', medico: 'Dr', unidade: 'U', status: 'Confirmado' },
    { id: '#2', paciente: 'B', cpf: '2', data: br(hoje), horario: '11:00', medico: 'Dr', unidade: 'U', status: 'Cancelado' },
    { id: '#3', paciente: 'C', cpf: '3', data: br(amanha), horario: '10:00', medico: 'Dr', unidade: 'U', status: 'Pendente' }
  ]);
  const ind = window.DashboardAPI.getIndicadores(hoje);
  assert.strictEqual(ind.agendamentosHoje, 1);
});

test('Dashboard: exames pendentes = todos os não concluídos', () => {
  window.ExamesAPI.persist([
    { id: '#EX-1', paciente: 'A', tipo: 'T', data: '01/07/2030', unidade: 'U', status: 'Solicitado' },
    { id: '#EX-2', paciente: 'B', tipo: 'T', data: '01/07/2030', unidade: 'U', status: 'Em andamento' },
    { id: '#EX-3', paciente: 'C', tipo: 'T', data: '01/07/2030', unidade: 'U', status: 'Concluído' }
  ]);
  assert.strictEqual(window.DashboardAPI.getIndicadores(new Date(2030, 6, 10)).examesPendentes, 2);
});

test('Dashboard: taxa de comparecimento = compareceram ÷ (compareceram + faltaram)', () => {
  window.ConsultasAPI.persist([
    { id: 'C1', paciente: 'A', medico: 'D', especialidade: 'E', inicio: '08:00', status: 'Concluída' },
    { id: 'C2', paciente: 'B', medico: 'D', especialidade: 'E', inicio: '08:30', status: 'Em Andamento' },
    { id: 'C3', paciente: 'C', medico: 'D', especialidade: 'E', inicio: '09:00', status: 'Aguardando' },
    { id: 'C4', paciente: 'D', medico: 'D', especialidade: 'E', inicio: '09:30', status: 'Não Compareceu' },
    { id: 'C5', paciente: 'E', medico: 'D', especialidade: 'E', inicio: '10:00', status: 'Agendada' },
    { id: 'C6', paciente: 'F', medico: 'D', especialidade: 'E', inicio: '10:30', status: 'Cancelada' }
  ]);
  const ind = window.DashboardAPI.getIndicadores();
  assert.strictEqual(ind.taxaComparecimento, 75, '3 de 4 — agendadas e canceladas não entram');
});

test('Dashboard: sem base para cálculo, a taxa de comparecimento é null (não inventa 100%)', () => {
  window.ConsultasAPI.persist([{ id: 'C1', paciente: 'A', medico: 'D', especialidade: 'E', inicio: '08:00', status: 'Agendada' }]);
  assert.strictEqual(window.DashboardAPI.getIndicadores().taxaComparecimento, null);
});

test('Dashboard: alertas importantes reúnem estoque de vacinas, exames atrasados e unidades fora de operação', () => {
  window.ExamesAPI.persist([{ id: '#EX-9', paciente: 'A', tipo: 'T', data: '01/01/2020', dataPrevista: '02/01/2020', unidade: 'U', status: 'Em andamento' }]);
  const alertas = window.DashboardAPI.getAlertas(new Date(2030, 0, 1));
  const origens = alertas.map(a => a.origem);
  assert.ok(origens.includes('vacinacao'), 'seed de vacinas tem estoque crítico');
  assert.ok(origens.includes('exames'), 'existe exame atrasado');
  assert.ok(origens.includes('unidades'), 'UBS Vila Nova está em manutenção');
  const niveis = alertas.map(a => a.nivel);
  assert.deepStrictEqual(niveis, [...niveis].sort((a, b) => (a === 'red' ? 0 : 1) - (b === 'red' ? 0 : 1)), 'críticos primeiro');
});

test('Dashboard: calendário do mês conta agendamentos ativos por dia', () => {
  window.AgendamentosAPI.persist([
    { id: '#1', data: '10/07/2030', horario: '10:00', status: 'Confirmado' },
    { id: '#2', data: '10/07/2030', horario: '11:00', status: 'Pendente' },
    { id: '#3', data: '10/07/2030', horario: '12:00', status: 'Cancelado' },
    { id: '#4', data: '15/07/2030', horario: '12:00', status: 'Remarcado' },
    { id: '#5', data: '01/08/2030', horario: '12:00', status: 'Pendente' }
  ]);
  assert.deepStrictEqual(window.DashboardAPI.getCalendario(2030, 6), { '2030-07-10': 2, '2030-07-15': 1 });
});

test('Dashboard: próximos atendimentos são futuros, ordenados e sem cancelados', () => {
  const agora = new Date(2030, 6, 10, 10, 30);
  window.AgendamentosAPI.persist([
    { id: '#1', paciente: 'Passado', data: '10/07/2030', horario: '09:00', medico: 'Dr A', especialidade: 'E', unidade: 'U', status: 'Confirmado' },
    { id: '#2', paciente: 'Depois', data: '11/07/2030', horario: '08:00', medico: 'Dr B', especialidade: 'E', unidade: 'U', status: 'Pendente' },
    { id: '#3', paciente: 'Logo', data: '10/07/2030', horario: '11:00', medico: 'Dr C', especialidade: 'E', unidade: 'U', status: 'Confirmado' },
    { id: '#4', paciente: 'Cancelado', data: '10/07/2030', horario: '12:00', medico: 'Dr D', especialidade: 'E', unidade: 'U', status: 'Cancelado' }
  ]);
  const prox = window.DashboardAPI.getProximosAtendimentos(agora);
  assert.deepStrictEqual(prox.map(p => p.id), ['#3', '#2']);
  assert.strictEqual(prox[0].periodo, 'HOJE');
  assert.strictEqual(prox[1].periodo, 'AMANHÃ');
});

test('Rota GET /dashboard/indicadores: equipe recebe o agregado; Cidadão recebe 403', async () => {
  const tRecep = await loginComo(SEED.recepcao.cpf, SEED.recepcao.senha);
  const r = await chamar('/dashboard/indicadores', { token: tRecep });
  assert.strictEqual(r.status, 200);
  for (const k of ['agendamentosHoje', 'examesPendentes', 'taxaComparecimento', 'alertas', 'calendario', 'proximosAtendimentos']) {
    assert.ok(k in r.body.indicadores, `faltou ${k}`);
  }
  const tPac = await loginComo(SEED.paciente.cpf, SEED.paciente.senha);
  assert.strictEqual((await chamar('/dashboard/indicadores', { token: tPac })).status, 403);
});
