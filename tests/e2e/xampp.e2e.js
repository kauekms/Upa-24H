#!/usr/bin/env node
/**
 * Teste de integração com o banco real (XAMPP: Apache + MySQL ligados).
 *   npm run test:xampp
 *
 * Pré-requisitos: banco criado com database/01_estrutura.sql e 02_dados.sql e
 * a pasta do projeto publicada no Apache como http://localhost/upa24h/
 * (ver README). Pode ser executado várias vezes: os dados criados usam
 * datas/horários aleatórios e nada é apagado.
 *
 * Verifica: login validado no MySQL, permissões por perfil no servidor,
 * gravação das telas nas tabelas, leitura do banco pela aplicação e os
 * três relatórios (incluindo os mestre-detalhe).
 */
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { abrirNavegador, esperar } = require('./cdp.js');

const BASE = (process.env.UPA_URL || 'http://localhost/upa24h').replace(/\/$/, '');
const API = `${BASE}/backend/api.php`;
const MYSQL = path.join(process.env.XAMPP_DIR || 'C:\\xampp', 'mysql', 'bin', 'mysql.exe');

let falhas = 0;
let total = 0;
function verificar(condicao, descricao, detalhe = '') {
  total++;
  if (condicao) console.log(`  ✔ ${descricao}`);
  else { falhas++; console.log(`  ✖ ${descricao}${detalhe ? `\n      ${detalhe}` : ''}`); }
}

/** Executa SQL no MySQL do XAMPP e devolve as linhas (colunas separadas por TAB). */
function sql(consulta) {
  const saida = execFileSync(MYSQL, ['-uroot', '-N', '--default-character-set=utf8mb4', 'upa24h', '-e', consulta], { encoding: 'utf8' });
  return saida.trim() ? saida.trim().split(/\r?\n/).map(l => l.split('\t')) : [];
}
const um = consulta => sql(consulta)[0]?.[0];

/** Cliente HTTP com cookie de sessão (um por perfil). */
function cliente() {
  let cookie = '';
  return async function req(rota, { method = 'GET', corpo, url } = {}) {
    const res = await fetch(url || `${API}${rota}`, {
      method,
      headers: { ...(cookie ? { Cookie: cookie } : {}), ...(corpo ? { 'Content-Type': 'application/json' } : {}) },
      body: corpo ? JSON.stringify(corpo) : undefined
    });
    // Após o login o PHP renova o id da sessão: vale o último cookie enviado.
    const cookies = res.headers.getSetCookie?.() || [];
    if (cookies.length) cookie = cookies[cookies.length - 1].split(';')[0];
    const texto = await res.text();
    let body = texto;
    try { body = JSON.parse(texto); } catch { /* HTML do relatório */ }
    return { status: res.status, body };
  };
}

async function testesApi() {
  console.log('\n=== API e permissões no servidor ===');
  const anon = cliente();
  const st = await anon('/status');
  verificar(st.body?.banco === true, 'backend responde e o banco MySQL está conectado');
  verificar((await anon('/sync')).status === 401, 'dados não são entregues sem login (401)');
  verificar((await anon('/auth/login', { method: 'POST', corpo: { identificador: '111.444.777-35', senha: 'errada' } })).status === 401,
    'senha incorreta é recusada pelo servidor (401)');
  verificar(Number(um("SELECT COUNT(*) FROM logs_auditoria WHERE acao = 'Falha de login'")) > 0, 'falha de login registrada na tabela logs_auditoria');

  // Cidadão: só os próprios dados, sem relatórios e sem trocar o próprio perfil
  const cid = cliente();
  const lc = await cid('/auth/login', { method: 'POST', corpo: { identificador: '33366699957', senha: 'paciente123' } });
  verificar(lc.status === 200 && lc.body.user?.perfil === 'Paciente', `cidadão autenticado no MySQL (perfil ${lc.body.user?.perfil})`);
  const dados = (await cid('/sync')).body.colecoes || {};
  const outros = (dados.upa_agendamentos || []).filter(a => a.cpf !== '333.666.999-57');
  verificar(outros.length === 0, `cidadão recebe só os próprios agendamentos (${(dados.upa_agendamentos || []).length} dele, ${outros.length} de outros)`);
  verificar((dados.upa_usuarios || []).length === 1 && (dados.upa_logs || []).length === 0 && (dados.upa_vacinacao_estoque || []).length === 0,
    'cidadão não recebe outras contas, logs nem estoque');
  verificar((await cid('/relatorios')).status === 403, 'cidadão não acessa relatórios gerenciais (403)');
  const proprio = dados.upa_usuarios[0];
  await cid('/sync/upa_usuarios', { method: 'PUT', corpo: { lista: [{ ...proprio, perfil: 'Administrador' }] } });
  verificar(um("SELECT p.nome FROM usuarios u JOIN perfis p ON p.id = u.perfil_id WHERE u.cpf = '333.666.999-57'") === 'Paciente',
    'cidadão não consegue se promover a Administrador');
  verificar((await cid('/sync/upa_vacinacao_estoque', { method: 'PUT', corpo: { lista: [] } })).status === 403,
    'cidadão não grava estoque de vacinas (403)');

  // Recepção: relatórios sim, parâmetros de estoque mínimo não
  const rec = cliente();
  await rec('/auth/login', { method: 'POST', corpo: { identificador: '444.777.000-83', senha: 'recep123' } });
  verificar((await rec('/relatorios')).status === 200, 'recepção acessa a lista de relatórios');
  verificar((await rec('/sync/upa_vacinacao_minimos', { method: 'PUT', corpo: { lista: {} } })).status === 403,
    'recepção não altera estoque mínimo (403, exclusivo do Administrador)');
  verificar(Number(um("SELECT COUNT(*) FROM logs_auditoria WHERE acao = 'Acesso negado'")) > 0, 'acessos negados ficam na auditoria');
}

async function testesNavegador() {
  console.log('\n=== Aplicação no navegador com o banco ===');
  const navegador = await abrirNavegador();
  const p = navegador.pagina;
  try {
    await p.navegar(`${BASE}/index.html`);
    await p.avaliar('localStorage.clear(); sessionStorage.clear(); location.reload()');
    await p.aguardar('document.getElementById("login-form-element")', 15000);
    verificar(await p.avaliar('Persistencia.online === true'), 'aplicação detecta o backend PHP + MySQL');

    await p.avaliar(`(() => {
      document.getElementById('login-username').value = '111.444.777-35';
      document.getElementById('login-password').value = 'admin';
      document.getElementById('login-form-element').requestSubmit();
    })()`);
    await p.aguardar('App.usuario && !document.getElementById("login-overlay")', 20000);
    await p.avaliar('Persistencia.enviarPendentes()');
    await esperar(800);
    verificar(/Banco MySQL conectado/.test(await p.avaliar('document.querySelector(".sidebar-versao").textContent')),
      'menu indica "Banco MySQL conectado"');

    const contagens = Object.fromEntries(['agendamentos', 'consultas', 'exames', 'lotes', 'campanhas', 'aplicacoes_vacina', 'cidadaos', 'logs_auditoria']
      .map(t => [t, Number(um(`SELECT COUNT(*) FROM ${t}`))]));
    verificar(Object.values(contagens).every(n => n > 0), `tabelas preenchidas pela aplicação ${JSON.stringify(contagens)}`);

    // Novo agendamento pela tela → linha na tabela agendamentos (com JOIN no cidadão)
    const dias = 10 + Math.floor(Math.random() * 300);
    const hora = `${String(7 + Math.floor(Math.random() * 10)).padStart(2, '0')}:${['00', '15', '30', '45'][Math.floor(Math.random() * 4)]}`;
    const antes = await p.avaliar('AgendamentosAPI.getAll().map(a => a.id)');
    await p.avaliar(`(() => {
      App.showNovoAgendamentoModal();
      const cpf = document.getElementById('ag-cpf');
      cpf.value = '33366699957';
      cpf.dispatchEvent(new Event('input', { bubbles: true }));
      document.getElementById('ag-data').value = Util.dataLocalISO(new Date(Date.now() + ${dias} * 86400000));
      document.getElementById('ag-horario').value = '${hora}';
      document.getElementById('modal-confirm-btn').click();
    })()`);
    await p.aguardar('!document.getElementById("app-modal").classList.contains("active")', 6000).catch(() => {});
    const novo = (await p.avaliar('AgendamentosAPI.getAll().map(a => a.id)')).find(id => !antes.includes(id));
    await p.avaliar('Persistencia.enviarPendentes()');
    await esperar(500);
    const linha = sql(`SELECT a.codigo, c.nome, u.nome FROM agendamentos a JOIN cidadaos c ON c.id = a.cidadao_id
                       LEFT JOIN unidades u ON u.id = a.unidade_id WHERE a.codigo = '${String(novo).replace(/'/g, '')}'`)[0];
    verificar(novo && linha?.[1] === 'Maria da Silva Santos', `agendamento ${novo} criado na tela foi gravado no MySQL (${linha?.join(' · ')})`);

    // Alteração feita direto no banco aparece na aplicação (o MySQL é a fonte dos dados)
    sql(`UPDATE agendamentos SET status = 'Confirmado' WHERE codigo = '${String(novo).replace(/'/g, '')}'`);
    await p.avaliar('location.reload()');
    await p.aguardar('App.usuario && document.querySelector("#screen-container .page")', 20000);
    const status = await p.avaliar(`AgendamentosAPI.getAll().find(a => a.id === ${JSON.stringify(novo)})?.status`);
    verificar(status === 'Confirmado', `alteração feita no banco aparece na aplicação após recarregar (status ${status})`);

    // Tela de relatórios e documentos gerados pelo servidor
    await p.avaliar('App.goTo("relatorios")');
    await p.aguardar('document.querySelector("#page-relatorios")');
    verificar(await p.avaliar('document.querySelector("[data-box=relatorios-offline]").hidden && !document.querySelector("form[data-relatorio] button").disabled'),
      'tela Relatórios habilitada com o banco conectado');
    const relatorio = async (tipo, filtros = {}) => p.avaliar(`fetch(Persistencia.urlRelatorio(${JSON.stringify(tipo)}, ${JSON.stringify(filtros)})).then(async r => ({ status: r.status, html: await r.text() }))`);
    const ficha = await relatorio('ficha-cidadao', { cpf: '333.666.999-57' });
    verificar(ficha.status === 200 && ficha.html.includes('Maria da Silva Santos') && ficha.html.includes(novo),
      'relatório mestre-detalhe "Ficha do cidadão" traz o cidadão e o agendamento criado');
    const ag = await relatorio('agendamentos', { unidade: 'Unidade Centro' });
    verificar(ag.status === 200 && ag.html.includes('Totais por unidade') && ag.html.includes('Unidade Centro'), 'relatório "Agendamentos por período" com filtros e totais');
    const est = await relatorio('estoque-vacinas');
    verificar(est.status === 200 && est.html.includes('Doses aplicadas deste lote') && /LOT-/.test(est.html), 'relatório mestre-detalhe "Estoque de vacinas por lote"');
    verificar(Number(um("SELECT COUNT(*) FROM logs_auditoria WHERE modulo = 'RELATORIOS'")) > 0, 'emissão de relatório registrada na auditoria');

    const erros = p.limparErros().filter(e => !/favicon/i.test(e));
    verificar(erros.length === 0, 'nenhum erro de JavaScript no navegador', erros.join(' | '));

    await p.avaliar('App.sair()');
    await p.aguardar('document.getElementById("login-overlay")');
    const me = await p.avaliar(`fetch('backend/api.php/auth/me').then(r => r.status)`);
    verificar(me === 401, 'logout encerra a sessão também no servidor');
  } finally {
    await navegador.fechar();
  }
}

function testesEstrutura() {
  console.log('\n=== Estrutura do banco ===');
  const tabelas = Number(um("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'upa24h'"));
  verificar(tabelas >= 6, `banco relacional com ${tabelas} tabelas (mínimo 6)`);
  const fks = Number(um("SELECT COUNT(*) FROM information_schema.referential_constraints WHERE constraint_schema = 'upa24h'"));
  verificar(fks > 0, `${fks} chaves estrangeiras (relacionamentos 1:N)`);
  verificar(Number(um('SELECT COUNT(*) FROM profissional_unidade')) > 0 && Number(um('SELECT COUNT(*) FROM campanha_unidade')) > 0,
    'tabelas associativas N:N preenchidas (profissional_unidade, campanha_unidade)');
  verificar(Number(um("SELECT COUNT(*) FROM usuarios WHERE senha_hash NOT LIKE 'pbkdf2:%'")) === 0, 'nenhuma senha em texto puro no banco');
}

(async () => {
  try {
    await testesApi();
    await testesNavegador();
    testesEstrutura();
  } catch (err) {
    falhas++;
    console.error('\nFalha inesperada:', err.message);
    if (/ECONNREFUSED|fetch failed/i.test(err.message)) console.error('O Apache do XAMPP está ligado e o projeto publicado em', BASE, '?');
  }
  console.log(`\n${total - falhas}/${total} verificações passaram.`);
  process.exit(falhas ? 1 : 0);
})();
