const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Mock do ambiente de navegador (localStorage + window + fetch)
const storageMap = new Map();
global.localStorage = {
  getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
  setItem: (k, v) => storageMap.set(k, String(v)),
  removeItem: (k) => storageMap.delete(k),
  clear: () => storageMap.clear()
};

global.window = global;
global.Response = global.Response || class Response {
  constructor(body, init = {}) {
    this._body = body;
    this.status = init.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = init.headers || {};
  }
  async json() {
    return JSON.parse(this._body);
  }
  async text() {
    return String(this._body);
  }
};

global.fetch = async () => new global.Response(JSON.stringify({}), { status: 404 });

const Permissoes = require('../js/config/permissoes.js');
const AuditoriaService = require('../js/api/auditoria.js');
const VacinacaoAPI = require('../js/api/vacinacao.js');

global.Permissoes = Permissoes;
global.AuditoriaService = AuditoriaService;
global.VacinacaoAPI = VacinacaoAPI;

describe('Campanha de Vacinação — Indicadores, Aplicação de Doses, Estoque e Alertas', () => {
  beforeEach(() => {
    storageMap.clear();
    global.App = {
      usuario: {
        nome: 'Dra. Ana Beatriz Souza',
        cpf: '222.555.888-46',
        perfil: 'Profissional da Saúde',
        unidade: 'Unidade Centro'
      },
      data: {}
    };
    VacinacaoAPI.resetarParaSeed();
    VacinacaoAPI.registrarInterceptor();
  });

  it('1. Calcula indicadores iniciais (doses aplicadas, cobertura vacinal, estoque e alertas) a partir dos dados mock', () => {
    const ind = VacinacaoAPI.getIndicadores();

    assert.equal(ind.dosesAplicadasTotal, 8);
    assert.equal(ind.populacaoAlvoTotal, 40);
    assert.equal(ind.coberturaVacinal, 20); // 8 / 40 * 100 = 20%
    assert.equal(ind.estoqueTotal, 65);
    assert.equal(ind.estoqueValidoTotal, 53);
    assert.equal(ind.alertasAtivos, 3); // 1 crítico (LOT-MEN-ZERO) + 2 atenção (LOT-FA-2026D, LOT-MEN-2026E)
    assert.equal(ind.alertasCriticos, 1);
    assert.equal(ind.alertasAtencao, 2);
    assert.ok(ind.dosesPorVacina['COVID-19 (Bivalente)'] === 3);
    assert.ok(ind.estoquePorLote['LOT-COV-2026A'].quantidade === 25);
  });

  it('2. POST /vacinacao/registrar-aplicacao (201) grava aplicação, baixa 1 dose do estoque, atualiza indicadores e gera log de auditoria', async () => {
    const res = await global.fetch('/vacinacao/registrar-aplicacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cidadao: 'Carlos Eduardo',
        cpf: '111.222.333-44',
        vacina: 'COVID-19 (Bivalente)',
        lote: 'LOT-COV-2026A',
        dose: '1ª Dose',
        unidade: 'Unidade Centro',
        profissional: 'Enf. Cláudia',
        dataHora: '2026-11-09T14:30'
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.estoqueAtual.quantidade, 24); // baixou de 25 para 24
    assert.equal(body.indicadores.dosesAplicadasTotal, 9); // subiu de 8 para 9
    assert.equal(body.indicadores.coberturaVacinal, 22.5); // 9 / 40 * 100 = 22.5%

    // Verifica registro no Log de Sistema (AuditoriaService)
    const logs = AuditoriaService.getAll();
    const logAplicacao = logs.find(l => l.acao === 'Registro de Aplicação de Vacina' && l.descricao.includes('Carlos Eduardo'));
    assert.ok(logAplicacao, 'Deve registrar a aplicação no Log de Sistema');
    assert.equal(logAplicacao.usuario, 'Dra. Ana Beatriz Souza');
  });

  it('3. Gera alerta de Baixo Estoque (Atenção) quando o lote atinge o estoque mínimo e registra no Log de Sistema', async () => {
    // LOT-HEP-2026C começa com 6 doses e estoqueMinimo = 5
    const res = await VacinacaoAPI.registrarAplicacao({
      cidadao: 'Juliana Paes',
      vacina: 'Hepatite B',
      lote: 'LOT-HEP-2026C',
      dose: '2ª Dose',
      unidade: 'Unidade Centro',
      profissional: 'Enf. Cláudia',
      dataHora: '09/11/2026 10:00'
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.estoqueAtual.quantidade, 5);
    assert.ok(res.body.alertaGerado);
    assert.equal(res.body.alertaGerado.nivel, 'atencao');

    const logs = AuditoriaService.getAll();
    const logAlerta = logs.find(l => l.acao.includes('Alerta de Baixo Estoque (Atenção)') && l.acao.includes('LOT-HEP-2026C'));
    assert.ok(logAlerta, 'Deve registrar a geração do alerta de baixo estoque no Log de Sistema');
  });

  it('4. Gera alerta de Estoque Esgotado (Crítico) quando o lote chega a zero e registra no Log de Sistema', async () => {
    // LOT-MEN-2026E começa com 1 dose na Unidade Julia
    const res = await VacinacaoAPI.registrarAplicacao({
      cidadao: 'Gabriel Barbosa',
      vacina: 'Meningite ACWY',
      lote: 'LOT-MEN-2026E',
      dose: 'Dose Única',
      unidade: 'Unidade Julia',
      profissional: 'Enf. Juliana',
      dataHora: '09/11/2026 11:00'
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.estoqueAtual.quantidade, 0);
    assert.ok(res.body.alertaGerado);
    assert.equal(res.body.alertaGerado.nivel, 'critico');

    const logs = AuditoriaService.getAll();
    const logCritico = logs.find(l => l.acao.includes('Alerta de Estoque Esgotado (Crítico)') && l.acao.includes('LOT-MEN-2026E'));
    assert.ok(logCritico, 'Deve registrar a geração do alerta crítico de estoque esgotado no Log de Sistema');
  });

  it('5. Retorna 409 Conflict ao tentar registrar dose duplicada para o mesmo cidadão', async () => {
    // Paulo Henrique já possui 2ª Dose de COVID-19 (Bivalente) no seed
    const res = await global.fetch('/vacinacao/registrar-aplicacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cidadao: 'Paulo Henrique',
        vacina: 'COVID-19 (Bivalente)',
        lote: 'LOT-COV-2026A',
        dose: '2ª dose',
        unidade: 'Unidade Centro',
        profissional: 'Enf. Cláudia',
        dataHora: '09/11/2026 15:00'
      })
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /duplicada/i);
  });

  it('6. Retorna 422 Unprocessable Entity para lote vencido ou estoque zerado', async () => {
    // Lote vencido: LOT-FA-VENC (validade 10/01/2026)
    const resVencido = await global.fetch('/vacinacao/registrar-aplicacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cidadao: 'Novo Cidadão Teste',
        vacina: 'Febre Amarela',
        lote: 'LOT-FA-VENC',
        dose: 'Dose Única',
        unidade: 'Unidade Centro',
        profissional: 'Enf. Marcos',
        dataHora: '09/11/2026 15:30'
      })
    });
    assert.equal(resVencido.status, 422);
    const bodyVencido = await resVencido.json();
    assert.match(bodyVencido.error, /vencido/i);

    // Estoque zerado: LOT-MEN-ZERO (0 doses)
    const resZero = await global.fetch('/vacinacao/registrar-aplicacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cidadao: 'Novo Cidadão Teste',
        vacina: 'Meningite ACWY',
        lote: 'LOT-MEN-ZERO',
        dose: 'Dose Única',
        unidade: 'Unidade Centro',
        profissional: 'Enf. Cláudia',
        dataHora: '09/11/2026 15:35'
      })
    });
    assert.equal(resZero.status, 422);
    const bodyZero = await resZero.json();
    assert.match(bodyZero.error, /esgotado|insuficiente/i);
  });

  it('7. Retorna 400 Bad Request para campos obrigatórios ausentes ou lote inexistente', async () => {
    const resFaltando = await VacinacaoAPI.registrarAplicacao({
      cidadao: '',
      vacina: 'Influenza'
    });
    assert.equal(resFaltando.status, 400);

    const resLoteInvalido = await VacinacaoAPI.registrarAplicacao({
      cidadao: 'Pedro Rocha',
      vacina: 'Influenza',
      lote: 'LOTE-NAO-EXISTE',
      dose: 'Dose Única',
      unidade: 'Unidade Julia',
      profissional: 'Enf. Rodrigo',
      dataHora: '09/11/2026 16:00'
    });
    assert.equal(resLoteInvalido.status, 400);
  });

  it('8. Retorna 401 se não autenticado, 403 para o Cidadão e 201 para a Recepção (sem senha extra)', async () => {
    // Recepção registra aplicação normalmente (alinhamento de 10/11/2026)
    global.App.usuario = { nome: 'Carla Recepção', perfil: 'Recepção' };
    const res201 = await global.fetch('/vacinacao/registrar-aplicacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cidadao: 'Cidadão Atendido Pela Recepção',
        vacina: 'COVID-19 (Bivalente)',
        lote: 'LOT-COV-2026A',
        dose: '1ª Dose',
        unidade: 'Unidade Centro',
        profissional: 'Enf. Cláudia',
        dataHora: '09/11/2026 16:10'
      })
    });
    assert.equal(res201.status, 201);

    // 403 para o Cidadão
    global.App.usuario = { nome: 'Maria Cidadã', perfil: 'Cidadão' };
    const res403 = await global.fetch('/vacinacao/registrar-aplicacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cidadao: 'Cidadão X',
        vacina: 'COVID-19 (Bivalente)',
        lote: 'LOT-COV-2026A',
        dose: '1ª Dose',
        unidade: 'Unidade Centro',
        profissional: 'Enf. Cláudia',
        dataHora: '09/11/2026 16:10'
      })
    });
    assert.equal(res403.status, 403);

    // 401 sem usuário autenticado
    global.App.usuario = null;
    const res401 = await global.fetch('/vacinacao/registrar-aplicacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cidadao: 'Cidadão X',
        vacina: 'COVID-19 (Bivalente)',
        lote: 'LOT-COV-2026A',
        dose: '1ª Dose',
        unidade: 'Unidade Centro',
        profissional: 'Enf. Cláudia',
        dataHora: '09/11/2026 16:10'
      })
    });
    assert.equal(res401.status, 401);
  });

  it('9. Endpoints auxiliares: GET /vacinacao/estoque, GET /vacinacao/alertas e POST /vacinacao/estoque/entrada (restrito a Administrador)', async () => {
    // GET /vacinacao/estoque com filtro
    const resEst = await global.fetch('/vacinacao/estoque?unidade=Unidade%20Centro');
    assert.equal(resEst.status, 200);
    const bodyEst = await resEst.json();
    assert.equal(bodyEst.success, true);
    assert.ok(bodyEst.data.every(i => i.unidade === 'Unidade Centro'));

    // GET /vacinacao/alertas
    const resAl = await global.fetch('/vacinacao/alertas');
    assert.equal(resAl.status, 200);
    const bodyAl = await resAl.json();
    assert.equal(bodyAl.success, true);
    assert.equal(bodyAl.total, 3);
    assert.equal(bodyAl.criticos, 1);
    assert.equal(bodyAl.atencao, 2);

    // POST /vacinacao/estoque/entrada bloqueado (403) para Profissional da Saúde
    const resNegado = await global.fetch('/vacinacao/estoque/entrada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vacina: 'Meningite ACWY',
        lote: 'LOT-MEN-ZERO',
        validade: '01/12/2027',
        quantidade: 15,
        unidade: 'Unidade Centro'
      })
    });
    assert.equal(resNegado.status, 403);

    // POST /vacinacao/estoque/entrada permitido (201) para Administrador
    global.App.usuario = { nome: 'Denilson Barrios', perfil: 'Administrador' };
    const resAdmin = await global.fetch('/vacinacao/estoque/entrada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vacina: 'Meningite ACWY',
        lote: 'LOT-MEN-ZERO',
        validade: '01/12/2027',
        quantidade: 15,
        unidade: 'Unidade Centro'
      })
    });
    assert.equal(resAdmin.status, 201);
    const bodyAdmin = await resAdmin.json();
    assert.equal(bodyAdmin.lote.quantidade, 15);
    assert.equal(bodyAdmin.alertas.length, 2); // O lote LOT-MEN-ZERO deixou de estar esgotado!
  });
});

