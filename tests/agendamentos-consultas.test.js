const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// ==========================================
// Mocks para simular ambiente do navegador
// ==========================================
globalThis.window = globalThis;

class StorageMock {
  constructor() { this.store = {}; }
  getItem(k) { return this.store[k] || null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
  clear() { this.store = {}; }
}
globalThis.localStorage = new StorageMock();
globalThis.sessionStorage = new StorageMock();

// Mock do App para a API logar eventos
globalThis.App = {
  addLog: () => {},
  usuario: {
    nome: 'Dr. Roberto Admin',
    perfil: 'Administrador'
  }
};

// ==========================================
// Carregar módulos do sistema UPA 24H
// ==========================================
const AgendamentosAPI = require('../js/api/agendamentos');
const ConsultasAPI = require('../js/api/consultas');

globalThis.AgendamentosAPI = AgendamentosAPI;
globalThis.ConsultasAPI = ConsultasAPI;
window.AgendamentosAPI = AgendamentosAPI;
window.ConsultasAPI = ConsultasAPI;

// Data LOCAL no formato aaaa-mm-dd. Os testes antes usavam
// toISOString().slice(0, 10), que devolve a data em UTC, junto com a hora
// LOCAL (toTimeString). Em Brasília (UTC-3), entre 16h e 19h, "daqui a 5h"
// virava "amanhã" em UTC e o teste de RN01 falhava sem o código estar errado.
function dataLocal(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ==========================================
// SUÍTE DE TESTES: Agendamentos, Consultas, RN01, RN02, RN03
// ==========================================

test('1. AgendamentosAPI: RN01 - Bloquear solicitação com antecedência inferior a 24h', async (t) => {
  // Cria data para daqui a 5 horas
  const agora = new Date();
  const dataCurta = new Date(agora.getTime() + 5 * 3600 * 1000);
  const dataStr = dataLocal(dataCurta);
  const horaStr = dataCurta.toTimeString().slice(0, 5);

  const res = await window.AgendamentosAPI.solicitar({
    paciente: 'Carlos Teste RN01',
    cpf: '111.222.333-44',
    especialidade: 'Clínica Geral',
    medico: 'Dr. Teste RN01',
    unidade: 'Unidade Centro',
    data: dataStr,
    hora: horaStr,
    tipo: 'Consulta Eletiva'
  });

  assert.strictEqual(res.status, 400, 'Deve retornar HTTP 400 para agendamento com menos de 24h');
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.codigoRegra, 'RN01');
  assert.ok(res.body.error.includes('24 horas'), 'A mensagem de erro deve citar a regra de 24 horas');
});

test('2. AgendamentosAPI: RN01 - Permitir solicitação com antecedência mínima de 24h', async (t) => {
  // Cria data para daqui a 48 horas
  const agora = new Date();
  const dataValida = new Date(agora.getTime() + 48 * 3600 * 1000);
  const dataStr = dataLocal(dataValida);
  const horaStr = '10:00';

  const res = await window.AgendamentosAPI.solicitar({
    paciente: 'Mariana Teste RN01 Sucesso',
    cpf: '222.333.444-55',
    especialidade: 'Cardiologia',
    medico: 'Dr. Arnaldo Luiz',
    unidade: 'Unidade Centro',
    data: dataStr,
    hora: horaStr,
    tipo: 'Consulta Eletiva'
  });

  assert.strictEqual(res.status, 201, 'Deve retornar HTTP 201 no agendamento com antecedência válida');
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.agendamento.id, 'Deve gerar ID único para o agendamento');
  assert.strictEqual(res.body.agendamento.status, 'Pendente');
});

test('3. AgendamentosAPI: Conflito de Horário - Bloquear duplo agendamento para mesmo médico e horário', async (t) => {
  const agora = new Date();
  const dataValida = new Date(agora.getTime() + 72 * 3600 * 1000);
  const dataStr = dataLocal(dataValida);
  const horaStr = '14:30';
  const medico = 'Dr. Manoel Joaquim';

  // Primeiro agendamento: Sucesso
  const res1 = await window.AgendamentosAPI.solicitar({
    paciente: 'Paciente 1',
    cpf: '333.444.555-66',
    especialidade: 'Clínica Geral',
    medico: medico,
    unidade: 'Unidade Centro',
    data: dataStr,
    hora: horaStr
  });
  assert.strictEqual(res1.status, 201);

  // Segundo agendamento para o mesmo médico na mesma data e hora: Conflito (409)
  const res2 = await window.AgendamentosAPI.solicitar({
    paciente: 'Paciente 2',
    cpf: '444.555.666-77',
    especialidade: 'Clínica Geral',
    medico: medico,
    unidade: 'Unidade Julia',
    data: dataStr,
    hora: horaStr
  });
  assert.strictEqual(res2.status, 409, 'Deve retornar HTTP 409 ao tentar agendar horário já ocupado');
  assert.strictEqual(res2.body.success, false);
  assert.ok(res2.body.error.includes('Horário indisponível'));
});

test('4. AgendamentosAPI: Confirmar Agendamento', async (t) => {
  const agora = new Date();
  const dataValida = new Date(agora.getTime() + 96 * 3600 * 1000);
  const dataStr = dataLocal(dataValida);

  const criacao = await window.AgendamentosAPI.solicitar({
    paciente: 'Paciente Confirmar',
    cpf: '555.666.777-88',
    especialidade: 'Pediatria',
    medico: 'Dra. Camila Torres',
    unidade: 'Unidade Centro',
    data: dataStr,
    hora: '11:00'
  });

  const agId = criacao.body.agendamento.id;
  const resConf = await window.AgendamentosAPI.confirmar({ id: agId });

  assert.strictEqual(resConf.status, 200, 'Deve retornar 200 ao confirmar agendamento');
  assert.strictEqual(resConf.body.success, true);
  assert.strictEqual(resConf.body.agendamento.status, 'Confirmado');
});

test('5. AgendamentosAPI: Cidadão NUNCA altera agendamento (403) — só aceita ou recusa', async (t) => {
  const agora = new Date();
  const dataValida = new Date(agora.getTime() + 72 * 3600 * 1000);
  const criacao = await window.AgendamentosAPI.solicitar({
    paciente: 'Cidadão Sem Alteração',
    cpf: '666.777.888-99',
    especialidade: 'Ortopedia',
    medico: 'Dr. Carlos Mendes',
    unidade: 'Unidade Centro',
    data: dataLocal(dataValida),
    hora: '08:00'
  });
  const agId = criacao.body.agendamento.id;

  const novaData = new Date(agora.getTime() + 120 * 3600 * 1000);
  const resAlt = await window.AgendamentosAPI.alterar({
    id: agId,
    novaData: dataLocal(novaData),
    novaHora: '09:00',
    perfilSolicitante: 'Cidadão'
  });
  assert.strictEqual(resAlt.status, 403, 'Cidadão não pode alterar agendamento');
  assert.strictEqual(resAlt.body.success, false);

  // Aceitar = confirmar
  const resAceite = await window.AgendamentosAPI.confirmar({ id: agId });
  assert.strictEqual(resAceite.status, 200);
  assert.strictEqual(resAceite.body.agendamento.status, 'Confirmado');

  // Recusar = cancelamento pelo cidadão (com 24h de antecedência)
  const resRecusa = await window.AgendamentosAPI.cancelar({ id: agId, tipo: 'CIDADAO', perfilSolicitante: 'Cidadão' });
  assert.strictEqual(resRecusa.status, 200);
  assert.strictEqual(resRecusa.body.agendamento.status, 'Cancelado');
  assert.strictEqual(resRecusa.body.agendamento.tipoCancelamento, 'CIDADAO');
});

test('6. AgendamentosAPI: Recepção altera/remarca agendamento com sucesso', async (t) => {
  const agora = new Date();
  const dataInicial = new Date(agora.getTime() + 72 * 3600 * 1000);
  const criacao = await window.AgendamentosAPI.solicitar({
    paciente: 'Cidadão Remarcado',
    cpf: '777.888.999-00',
    especialidade: 'Dermatologia',
    medico: 'Dra. Patrícia Souza',
    unidade: 'Unidade Julia',
    data: dataLocal(dataInicial),
    hora: '15:00'
  });
  const agId = criacao.body.agendamento.id;

  const novaData = new Date(agora.getTime() + 96 * 3600 * 1000);
  const resAlt = await window.AgendamentosAPI.alterar({
    id: agId,
    novaData: dataLocal(novaData),
    novaHora: '16:00',
    perfilSolicitante: 'Recepção'
  });

  assert.strictEqual(resAlt.status, 200, 'Recepção deve conseguir alterar o agendamento');
  assert.strictEqual(resAlt.body.success, true);
  assert.strictEqual(resAlt.body.agendamento.status, 'Remarcado');
  assert.strictEqual(resAlt.body.agendamento.hora, '16:00');
});

test('7. AgendamentosAPI: RN03 - Cancelamento Administrativo exige justificativa obrigatória', async (t) => {
  const agora = new Date();
  const dataValida = new Date(agora.getTime() + 48 * 3600 * 1000);
  const criacao = await window.AgendamentosAPI.solicitar({
    paciente: 'Paciente RN03',
    cpf: '888.999.000-11',
    especialidade: 'Clínica Geral',
    medico: 'Dr. Manoel Joaquim',
    unidade: 'Unidade Centro',
    data: dataLocal(dataValida),
    hora: '09:00'
  });
  const agId = criacao.body.agendamento.id;

  // Tentativa de cancelamento administrativo sem justificativa
  const resSemMotivo = await window.AgendamentosAPI.cancelar({
    id: agId,
    perfilSolicitante: 'Administrador',
    motivo: '   ' // Vazio
  });
  assert.strictEqual(resSemMotivo.status, 400, 'RN03 exige justificativa para cancelamento administrativo');
  assert.strictEqual(resSemMotivo.body.codigoRegra, 'RN03');
  assert.strictEqual(resSemMotivo.body.success, false);

  // Cancelamento administrativo COM justificativa (a qualquer momento)
  const resComMotivo = await window.AgendamentosAPI.cancelar({
    id: agId,
    perfilSolicitante: 'Administrador',
    motivo: 'Manutenção preventiva da sala de atendimento de teleconsultas'
  });
  assert.strictEqual(resComMotivo.status, 200, 'Cancelamento administrativo com justificativa deve ser aceito');
  assert.strictEqual(resComMotivo.body.success, true);
  assert.strictEqual(resComMotivo.body.agendamento.status, 'Cancelado');
  assert.strictEqual(resComMotivo.body.agendamento.cancelamentoAdministrativo, true);
  assert.ok(resComMotivo.body.agendamento.motivoCancelamento.includes('Manutenção preventiva'));
});

test('8. AgendamentosAPI: Listagem com Filtros (status, unidade, período)', async (t) => {
  // Lista todos os agendamentos
  const todos = window.AgendamentosAPI.listar();
  assert.ok(todos.success && todos.total > 0, 'Deve retornar lista com sucesso');

  // Filtro por status
  const confirmados = window.AgendamentosAPI.listar({ status: 'Confirmado' });
  confirmados.data.forEach(item => {
    assert.strictEqual(item.status, 'Confirmado');
  });

  // Filtro por unidade
  const unidadeSul = window.AgendamentosAPI.listar({ unidade: 'Unidade Julia' });
  unidadeSul.data.forEach(item => {
    assert.ok(item.unidade.includes('Julia'));
  });

  // Indicadores
  const indicadores = window.AgendamentosAPI.getIndicadores();
  assert.strictEqual(indicadores.success, true);
  assert.ok(typeof indicadores.indicadores.confirmados === 'number');
  assert.ok(typeof indicadores.indicadores.cancelados === 'number');
});

test('9. ConsultasAPI: Indicadores obrigatórios (agendadas, canceladas, tempo médio de espera)', (t) => {
  const res = window.ConsultasAPI.getIndicadores();
  assert.strictEqual(res.success, true);

  const ind = res.indicadores;
  assert.ok(typeof ind.agendadas === 'number', 'Deve possuir indicador de consultas agendadas');
  assert.ok(typeof ind.canceladas === 'number', 'Deve possuir indicador de consultas canceladas');
  assert.ok(typeof ind.tempoMedioEspera === 'string', 'Deve possuir indicador de tempo médio de espera');
  assert.ok(ind.tempoMedioEspera.includes('min'), 'O tempo médio deve ser formatado em minutos');
});

test('10. ConsultasAPI: Listagem com Filtros (médico, especialidade, status)', (t) => {
  // Filtro por médico
  const filtroMed = window.ConsultasAPI.listar({ medico: 'Manoel' });
  assert.strictEqual(filtroMed.success, true);
  filtroMed.data.forEach(c => {
    assert.ok(c.medico.toLowerCase().includes('manoel'), 'Consulta deve pertencer ao médico filtrado');
  });

  // Filtro por especialidade
  const filtroEsp = window.ConsultasAPI.listar({ especialidade: 'Cardiologia' });
  assert.strictEqual(filtroEsp.success, true);
  filtroEsp.data.forEach(c => {
    assert.strictEqual(c.especialidade, 'Cardiologia');
  });

  // Filtro por status
  const filtroStatus = window.ConsultasAPI.listar({ status: 'Concluída' });
  assert.strictEqual(filtroStatus.success, true);
  filtroStatus.data.forEach(c => {
    assert.strictEqual(c.status, 'Concluída');
  });
});

test('11. ConsultasAPI: Endpoint /consultas/agenda vinculado à agenda do profissional', (t) => {
  const agenda = window.ConsultasAPI.getAgendaProfissional('Dr. Manoel Joaquim');
  assert.strictEqual(agenda.success, true);
  assert.ok(agenda.agenda, 'Deve conter o objeto agenda do profissional');
  assert.strictEqual(agenda.agenda.medico, 'Dr. Manoel Joaquim');
  assert.ok(Array.isArray(agenda.agenda.consultasHoje), 'Deve conter a lista de consultas do dia');
  assert.ok(Array.isArray(agenda.agenda.filaEspera), 'Deve conter a fila de espera');
  assert.ok(agenda.agenda.indicadores.tempoMedioEspera, 'Deve calcular indicadores da agenda do médico');
});
