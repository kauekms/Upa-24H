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
  clear() { this.store = {}; }
}
globalThis.localStorage = new StorageMock();
globalThis.sessionStorage = new StorageMock();

// ==========================================
// Carregar módulos do sistema UPA 24H
// ==========================================
const basePath = path.join(__dirname, '..', 'js');

function loadScript(relPath) {
  const code = fs.readFileSync(path.join(basePath, relPath), 'utf8');
  eval(code);
}

loadScript('config/permissoes.js');
loadScript('config/unidades.js');
loadScript('api/mock-http.js');
loadScript('api/crypto.js');
loadScript('api/usuarios.js');
loadScript('api/auditoria.js');
loadScript('api/exames.js');
loadScript('api/auth.js');

const AuditoriaService = globalThis.AuditoriaService || window.AuditoriaService;
const ExamesAPI = globalThis.ExamesAPI || window.ExamesAPI;
const AuthAPI = globalThis.AuthAPI || window.AuthAPI;
const Permissoes = globalThis.Permissoes || window.Permissoes;

// Mock do App para integração de navegação e RBAC
globalThis.App = {
  usuario: null,
  currentPage: 'dashboard',
  data: {},
  toast: () => {},
  checkLogin(pageId) {
    const publicPages = ['login', 'esqueceu-senha', 'cadastro-usuarios'];
    if (publicPages.includes(pageId)) return true;

    if (!this.usuario) {
      if (['logs', 'cadastro-usuarios', 'unidades', 'configuracoes'].includes(pageId)) {
        AuditoriaService.registrar(
          'Anônimo',
          'Tentativa de Acesso Negado',
          `Tentativa de acesso não autenticado à área restrita "${pageId}".`,
          'Aviso',
          'SEGURANÇA'
        );
      }
      return false;
    }

    if (pageId === 'logs' || pageId === 'cadastro-usuarios') {
      const perfil = this.usuario?.perfil;
      if (perfil !== 'Administrador') {
        AuditoriaService.registrar(
          this.usuario?.nome || 'Usuário',
          'Acesso Negado à Área Administrativa',
          `Usuário com perfil "${perfil}" tentou acessar "${pageId}" sem permissão de Administrador.`,
          'Aviso',
          'SEGURANÇA'
        );
        return false;
      }
    }
    return true;
  }
};

// ==========================================
// SUÍTE DE TESTES: Auditoria, Segurança e Exames
// ==========================================

test('1. AuditoriaService: Registro centralizado (usuario, acao, dataHora, tipo, descricao)', (t) => {
  AuditoriaService.clear();
  const log = AuditoriaService.registrar(
    'Dr. Carlos Eduardo',
    'Solicitação de Exame Laboratorial',
    'Solicitado exame de Sangue para o paciente João Silva.',
    'Informação',
    'EXAMES'
  );

  assert.ok(log.id, 'O log deve ter um ID gerado');
  assert.strictEqual(log.usuario, 'Dr. Carlos Eduardo');
  assert.strictEqual(log.acao, 'Solicitação de Exame Laboratorial');
  assert.strictEqual(log.tipo, 'Informação');
  assert.strictEqual(log.modulo, 'EXAMES');
  assert.ok(log.dataHora, 'O log deve conter dataHora preenchida');
  assert.strictEqual(AuditoriaService.getAll().length, 1);
});

test('2. AuditoriaService: Normalização de tipos (Erro, Aviso, Informação, Acesso)', (t) => {
  AuditoriaService.clear();
  const l1 = AuditoriaService.registrar('Sistema', 'Falha DB', 'Erro de conexão', 'ERRO');
  const l2 = AuditoriaService.registrar('Sistema', 'Timeout', 'Alerta de latência', 'warning');
  const l3 = AuditoriaService.registrar('User1', 'Login', 'Login com sucesso', 'ACESSO');
  const l4 = AuditoriaService.registrar('User2', 'Consulta', 'Dados visualizados', 'INFO');

  assert.strictEqual(l1.tipo, 'Erro');
  assert.strictEqual(l2.tipo, 'Aviso');
  assert.strictEqual(l3.tipo, 'Acesso');
  assert.strictEqual(l4.tipo, 'Informação');
});

test('3. AuditoriaService: Indicadores dinâmicos calculados corretamente', (t) => {
  AuditoriaService.clear();
  AuditoriaService.registrar('User1', 'Falha', 'Desc 1', 'Erro');
  AuditoriaService.registrar('User2', 'Alerta', 'Desc 2', 'Aviso');
  AuditoriaService.registrar('User3', 'Alerta 2', 'Desc 3', 'Aviso');
  AuditoriaService.registrar('User4', 'Login', 'Desc 4', 'Acesso');
  AuditoriaService.registrar('User5', 'Logout', 'Desc 5', 'Acesso');
  AuditoriaService.registrar('User6', 'Sync', 'Desc 6', 'Informação');

  const ind = AuditoriaService.getIndicadores();
  assert.strictEqual(ind.total, 6, 'Total de registros deve ser 6');
  assert.strictEqual(ind.erros, 1, 'Erros deve ser 1');
  assert.strictEqual(ind.avisos, 2, 'Avisos deve ser 2');
  assert.strictEqual(ind.acessos, 2, 'Acessos deve ser 2');
});

test('4. AuditoriaService: Filtros por tipo, período e usuário combináveis', (t) => {
  AuditoriaService.clear();
  AuditoriaService.registrar('Admin Carlos', 'Login', 'Acesso inicial', 'Acesso', 'AUTH');
  AuditoriaService.registrar('Dr. Silva', 'Prescrição', 'Receita emitida', 'Informação', 'CONSULTAS');
  AuditoriaService.registrar('Admin Carlos', 'Tentativa Bloqueada', 'Acesso sem senha', 'Aviso', 'SEGURANÇA');

  // Filtro por tipo
  const apenasAvisos = AuditoriaService.listar({ tipo: 'Aviso' });
  assert.strictEqual(apenasAvisos.length, 1);
  assert.strictEqual(apenasAvisos[0].tipo, 'Aviso');

  // Filtro por usuário
  const logsCarlos = AuditoriaService.listar({ usuario: 'Carlos' });
  assert.strictEqual(logsCarlos.length, 2);

  // Filtro combinado: usuário + tipo
  const combinado = AuditoriaService.listar({ usuario: 'Carlos', tipo: 'Aviso' });
  assert.strictEqual(combinado.length, 1);
  assert.strictEqual(combinado[0].acao, 'Tentativa Bloqueada');
});

test('5. Segurança: Acesso às áreas administrativas sem autenticação é bloqueado e gera log como Aviso', (t) => {
  AuditoriaService.clear();
  App.usuario = null; // Sem usuário logado

  const permitido = App.checkLogin('logs');
  assert.strictEqual(permitido, false, 'Acesso não autenticado à tela de logs deve ser bloqueado');

  const logs = AuditoriaService.getAll();
  assert.strictEqual(logs.length, 1, 'Deve ter gerado 1 log de auditoria');
  assert.strictEqual(logs[0].tipo, 'Aviso', 'O tipo do log deve ser Aviso');
  assert.strictEqual(logs[0].modulo, 'SEGURANÇA');
  assert.ok(logs[0].descricao.includes('logs'), 'A descrição deve mencionar a tela protegida');
});

test('6. Segurança: Usuário sem perfil Administrador não acessa Log de Sistema e gera log como Aviso', (t) => {
  AuditoriaService.clear();
  // Simula usuário logado como Cidadão
  App.usuario = { nome: 'Maria Santos', perfil: 'Cidadão' };

  const permitidoCidadao = App.checkLogin('logs');
  assert.strictEqual(permitidoCidadao, false, 'Cidadão não pode acessar logs');

  // Simula usuário logado como Profissional da Saúde
  App.usuario = { nome: 'Dr. Roberto', perfil: 'Profissional da Saúde' };
  const permitidoProfissional = App.checkLogin('logs');
  assert.strictEqual(permitidoProfissional, false, 'Profissional da Saúde não pode acessar logs');

  const logs = AuditoriaService.getAll();
  assert.strictEqual(logs.length, 2, 'Devem ter sido gerados 2 logs de tentativa de acesso');
  assert.strictEqual(logs[0].tipo, 'Aviso');
  assert.strictEqual(logs[1].tipo, 'Aviso');
  assert.ok(logs[1].descricao.includes('Cidadão'));
  assert.ok(logs[0].descricao.includes('Profissional da Saúde'));

  // Administrador tem acesso liberado
  App.usuario = { nome: 'Denilson Gestor', perfil: 'Administrador' };
  const permitidoAdmin = App.checkLogin('logs');
  assert.strictEqual(permitidoAdmin, true, 'Administrador pode acessar logs');
});

test('7. ExamesAPI: POST /exames - Validação de campos obrigatórios retorna status 400', async (t) => {
  // Faltando paciente
  const r1 = await ExamesAPI.solicitar({ tipo: 'Hemograma', data: '10/05/2026', unidade: 'UPA Central' });
  assert.strictEqual(r1.status, 400);
  assert.strictEqual(r1.body.success, false);
  assert.ok(r1.body.error.includes('paciente'));

  // Faltando tipo
  const r2 = await ExamesAPI.solicitar({ paciente: 'Ana Paula', data: '10/05/2026', unidade: 'UPA Central' });
  assert.strictEqual(r2.status, 400);
  assert.ok(r2.body.error.includes('tipo'));

  // Faltando data
  const r3 = await ExamesAPI.solicitar({ paciente: 'Ana Paula', tipo: 'Hemograma', unidade: 'UPA Central' });
  assert.strictEqual(r3.status, 400);
  assert.ok(r3.body.error.includes('data'));

  // Faltando unidade
  const r4 = await ExamesAPI.solicitar({ paciente: 'Ana Paula', tipo: 'Hemograma', data: '10/05/2026' });
  assert.strictEqual(r4.status, 400);
  assert.ok(r4.body.error.includes('unidade'));
});

test('8. ExamesAPI: POST /exames - Sucesso retorna status 201 e gera log de auditoria', async (t) => {
  AuditoriaService.clear();
  ExamesAPI.persist([]);

  const res = await ExamesAPI.solicitar({
    paciente: 'Carlos Drummond',
    cpf: '123.456.789-00',
    tipo: 'Hemograma Completo',
    data: '15/06/2026',
    horario: '08:30',
    unidade: 'Unidade Centro',
    solicitante: 'Dr. Arnaldo Luiz'
  }, 'Dr. Roberto Admin');

  assert.strictEqual(res.status, 201, 'Status deve ser 201 Created');
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.id, 'O exame deve conter um ID gerado');
  assert.strictEqual(res.body.data.status, 'Solicitado');

  // Verifica geração de auditoria
  const logs = AuditoriaService.getAll();
  assert.strictEqual(logs.length, 1, 'Deve gerar log de auditoria da solicitação');
  assert.strictEqual(logs[0].usuario, 'Dr. Roberto Admin');
  assert.strictEqual(logs[0].acao, 'Solicitação de Exame');
  assert.strictEqual(logs[0].modulo, 'EXAMES');
  assert.ok(logs[0].descricao.includes('Carlos Drummond'));
});

test('9. ExamesAPI: POST /exames - Conflito de horário na mesma unidade é bloqueado com status 400', async (t) => {
  ExamesAPI.persist([]);

  // Primeiro agendamento
  const r1 = await ExamesAPI.solicitar({
    paciente: 'Paciente 1',
    tipo: 'Tomografia Crânio',
    data: '20/07/2026',
    horario: '10:00',
    unidade: 'Unidade Centro'
  });
  assert.strictEqual(r1.status, 201);

  // Tentativa de segundo exame no mesmo horário e mesma unidade com o mesmo tipo
  const r2 = await ExamesAPI.solicitar({
    paciente: 'Paciente 2',
    tipo: 'Tomografia Crânio',
    data: '20/07/2026',
    horario: '10:00',
    unidade: 'Unidade Centro'
  });
  assert.strictEqual(r2.status, 400, 'Deve retornar 400 por conflito de horário na unidade');
  assert.strictEqual(r2.body.success, false);
  assert.ok(r2.body.error.toLowerCase().includes('conflito') || r2.body.error.toLowerCase().includes('horário'));
});

test('10. ExamesAPI: PUT /exames/:id - Exames concluídos não podem ser alterados (status 400)', async (t) => {
  ExamesAPI.persist([
    {
      id: 'EX-CONCLUIDO-1',
      paciente: 'Helena Silva',
      tipo: 'ECG',
      data: '01/04/2026',
      unidade: 'Unidade Centro',
      status: 'Concluído'
    }
  ]);

  const res = await ExamesAPI.alterar('EX-CONCLUIDO-1', {
    horario: '09:00'
  }, 'Dr. Arnaldo');

  assert.strictEqual(res.status, 400, 'Alterar exame concluído deve retornar status 400');
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.error.toLowerCase().includes('concluído'));
});

test('11. ExamesAPI: PUT /exames/:id - Exame inexistente retorna status 404', async (t) => {
  ExamesAPI.persist([]);
  const res = await ExamesAPI.alterar('EX-NAO-EXISTE', { prioridade: 'Urgente' });
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.success, false);
});

test('12. ExamesAPI: PUT /exames/:id - Alteração válida retorna status 200 e gera log de auditoria', async (t) => {
  AuditoriaService.clear();
  ExamesAPI.persist([
    {
      id: 'EX-PENDENTE-1',
      paciente: 'Rodrigo Lima',
      tipo: 'Urina Tipo I',
      data: '25/08/2026',
      horario: '07:30',
      unidade: 'Unidade Julia',
      status: 'Solicitado'
    }
  ]);

  const res = await ExamesAPI.alterar('EX-PENDENTE-1', {
    status: 'Em andamento',
    unidade: 'Unidade Centro'
  }, 'Enf. Juliana');

  assert.strictEqual(res.status, 200, 'Status deve ser 200 OK');
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.status, 'Em andamento');
  assert.strictEqual(res.body.data.unidade, 'Unidade Centro');

  const logs = AuditoriaService.getAll();
  assert.strictEqual(logs.length, 1);
  assert.strictEqual(logs[0].usuario, 'Enf. Juliana');
  assert.strictEqual(logs[0].acao, 'Alteração de Exame');
  assert.ok(logs[0].descricao.includes('EX-PENDENTE-1'));
});

test('13. ExamesAPI: Indicadores dinâmicos (Solicitados, Em andamento, Concluídos, Atrasados)', (t) => {
  ExamesAPI.persist([
    { id: '1', paciente: 'P1', tipo: 'T1', data: '01/01/2026', unidade: 'U1', status: 'Solicitado', dataPrevista: '2099-12-31' },
    { id: '2', paciente: 'P2', tipo: 'T2', data: '01/01/2026', unidade: 'U1', status: 'Em andamento', dataPrevista: '2099-12-31' },
    { id: '3', paciente: 'P3', tipo: 'T3', data: '01/01/2026', unidade: 'U1', status: 'Concluído', dataPrevista: '2020-01-01' },
    { id: '4', paciente: 'P4', tipo: 'T4', data: '01/01/2026', unidade: 'U1', status: 'Solicitado', dataPrevista: '2020-01-01' } // Atrasado!
  ]);

  const ind = ExamesAPI.getIndicadores();
  assert.strictEqual(ind.solicitados, 2, 'Solicitados deve ser 2');
  assert.strictEqual(ind.emAndamento, 1, 'Em andamento deve ser 1');
  assert.strictEqual(ind.concluidos, 1, 'Concluídos deve ser 1');
  assert.strictEqual(ind.atrasados, 1, 'Atrasados deve ser 1 (data prevista passada e status != Concluído)');
});

test('14. ExamesAPI: isAtrasado - Exame é atrasado se data prevista passou e status não é Concluído', (t) => {
  // Passou da data e está Solicitado -> Atrasado
  assert.strictEqual(ExamesAPI.isAtrasado({ status: 'Solicitado', dataPrevista: '01/01/2020' }), true);
  // Passou da data e está Em andamento -> Atrasado
  assert.strictEqual(ExamesAPI.isAtrasado({ status: 'Em andamento', dataPrevista: '01/01/2020' }), true);
  // Passou da data mas está Concluído -> NÃO é atrasado
  assert.strictEqual(ExamesAPI.isAtrasado({ status: 'Concluído', dataPrevista: '01/01/2020' }), false);
  // Passou da data mas tem Laudo Emitido -> NÃO é atrasado
  assert.strictEqual(ExamesAPI.isAtrasado({ status: 'Laudo Emitido', dataPrevista: '01/01/2020' }), false);
  // Data futura -> NÃO é atrasado
  assert.strictEqual(ExamesAPI.isAtrasado({ status: 'Solicitado', dataPrevista: '31/12/2099' }), false);
});

test('15. ExamesAPI: Histórico do paciente retorna todos os exames realizados pelo paciente', (t) => {
  ExamesAPI.persist([
    { id: 'EX-1', paciente: 'Lucas Andrade', cpf: '111.111.111-11', tipo: 'Hemograma Completo', data: '10/01/2026', unidade: 'U1', status: 'Concluído' },
    { id: 'EX-2', paciente: 'Lucas Andrade', cpf: '111.111.111-11', tipo: 'Glicemia', data: '15/02/2026', unidade: 'U1', status: 'Solicitado' },
    { id: 'EX-3', paciente: 'Outro Cidadão', cpf: '222.222.222-22', tipo: 'Raio-X', data: '20/02/2026', unidade: 'U1', status: 'Concluído' }
  ]);

  const histPorNome = ExamesAPI.getHistoricoPaciente('Lucas Andrade');
  assert.strictEqual(histPorNome.length, 2);
  assert.strictEqual(histPorNome[0].paciente, 'Lucas Andrade');

  const histPorCpf = ExamesAPI.getHistoricoPaciente('111.111.111-11');
  assert.strictEqual(histPorCpf.length, 2);

  const histPorId = ExamesAPI.getHistoricoPaciente('EX-1');
  assert.strictEqual(histPorId.length, 2, 'Localizar por ID do exame deve retornar todos os exames do mesmo paciente');
});

test('16. ExamesAPI: Listagem com filtros combinados (status, busca e período)', (t) => {
  ExamesAPI.persist([
    { id: 'EX-1', paciente: 'Bruna Lima', tipo: 'Hemograma', data: '05/03/2026', unidade: 'Unidade Centro', status: 'Solicitado', dataPrevista: '2099-01-01' },
    { id: 'EX-2', paciente: 'Bruna Lima', tipo: 'Raio-X', data: '10/03/2026', unidade: 'Unidade Centro', status: 'Concluído', dataPrevista: '2020-01-01' },
    { id: 'EX-3', paciente: 'Marcos Silva', tipo: 'ECG', data: '12/03/2026', unidade: 'Unidade Julia', status: 'Solicitado', dataPrevista: '2020-01-01' } // Atrasado
  ]);

  // Filtro por status Concluído
  const concluidos = ExamesAPI.listar({ status: 'Concluído' });
  assert.strictEqual(concluidos.length, 1);
  assert.strictEqual(concluidos[0].id, 'EX-2');

  // Filtro por status Atrasado
  const atrasados = ExamesAPI.listar({ status: 'Atrasado' });
  assert.strictEqual(atrasados.length, 1);
  assert.strictEqual(atrasados[0].id, 'EX-3');

  // Filtro por busca textual
  const buscaBruna = ExamesAPI.listar({ q: 'Bruna' });
  assert.strictEqual(buscaBruna.length, 2);

  // Filtro por período
  const periodo = ExamesAPI.listar({ dataInicio: '2026-03-01', dataFim: '2026-03-08' });
  assert.strictEqual(periodo.length, 1);
  assert.strictEqual(periodo[0].id, 'EX-1');
});
