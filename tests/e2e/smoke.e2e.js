#!/usr/bin/env node
/**
 * Teste E2E de fumaça — roda o sistema num Chrome/Edge headless de verdade.
 *
 *   npm run test:e2e
 *   SCREENSHOTS_DIR=./capturas npm run test:e2e   (salva capturas de tela)
 *
 * Verifica, nos modos HTTP e file:// (sem servidor):
 *   - login de cada perfil e abertura de todas as telas permitidas, sem erros
 *     de JavaScript no console;
 *   - bloqueio de telas não permitidas;
 *   - ações executadas uma única vez (sem listeners duplicados);
 *   - Cidadão só enxerga os próprios dados (lista, filtros e busca global);
 *   - fluxos principais: novo agendamento, emissão de laudo, exportação CSV;
 *   - dados digitados não executam código (proteção contra XSS).
 */
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { abrirNavegador, iniciarServidorEstatico, esperar } = require('./cdp.js');

const RAIZ = path.join(__dirname, '..', '..');
const CAPTURAS = process.env.SCREENSHOTS_DIR ? path.resolve(process.env.SCREENSHOTS_DIR) : null;

const PERFIS = [
  { nome: 'Administrador', usuario: '111.444.777-35', senha: 'admin',
    telas: ['dashboard', 'agendamentos', 'consultas', 'exames', 'vacinacao', 'unidades', 'relatorios', 'logs', 'cadastro-usuarios', 'configuracoes', 'perfil'] },
  { nome: 'Profissional', usuario: '222.555.888-46', senha: 'prof123',
    telas: ['dashboard', 'agendamentos', 'consultas', 'exames', 'vacinacao', 'unidades', 'relatorios', 'perfil'], negadas: ['logs', 'cadastro-usuarios'] },
  { nome: 'Recepção', usuario: '444.777.000-83', senha: 'recep123',
    telas: ['dashboard', 'agendamentos', 'consultas', 'exames', 'vacinacao', 'relatorios'], negadas: ['unidades', 'logs'] },
  { nome: 'Cidadão', usuario: '333.666.999-57', senha: 'paciente123',
    telas: ['agendamentos', 'consultas', 'exames', 'perfil'], negadas: ['dashboard', 'logs', 'relatorios'] }
];

let falhas = 0;
let total = 0;
function verificar(condicao, descricao, detalhe = '') {
  total++;
  if (condicao) {
    console.log(`  ✔ ${descricao}`);
  } else {
    falhas++;
    console.log(`  ✖ ${descricao}${detalhe ? `\n      ${detalhe}` : ''}`);
  }
}

async function login(p, usuario, senha) {
  await p.aguardar('document.getElementById("login-form-element")');
  await p.avaliar(`(() => {
    document.getElementById('login-username').value = ${JSON.stringify(usuario)};
    document.getElementById('login-password').value = ${JSON.stringify(senha)};
    document.getElementById('login-form-element').requestSubmit();
  })()`);
  await p.aguardar('App.usuario && !document.getElementById("login-overlay") && document.querySelector("#screen-container .page")', 15000);
  await esperar(250);
}

async function sair(p) {
  await p.avaliar('App.sair()');
  await p.aguardar('document.getElementById("login-overlay")');
}

async function abrir(p, tela) {
  await p.avaliar(`App.goTo(${JSON.stringify(tela)})`);
  await p.aguardar(`App.currentPage !== ${JSON.stringify(tela)} || document.querySelector('#page-${tela}') || document.querySelector('.estado-erro')`);
  await esperar(150);
}

async function capturar(p, nome, opcoes) {
  if (CAPTURAS) await p.capturarTela(path.join(CAPTURAS, `${nome}.png`), opcoes);
}

async function rodarCenarios(p, urlBase, modo) {
  console.log(`\n=== Modo ${modo} ===`);
  await p.navegar(urlBase);
  await p.avaliar('localStorage.clear(); sessionStorage.clear(); location.reload()');
  await p.aguardar('document.readyState === "complete" && document.getElementById("login-overlay")', 15000);
  if (modo === 'HTTP') await capturar(p, '00-login');
  p.limparErros();

  for (const perfil of PERFIS) {
    console.log(`\n[${perfil.nome}]`);
    await login(p, perfil.usuario, perfil.senha);
    verificar(true, `login realizado (${await p.avaliar('App.usuario.perfil')})`);

    for (const tela of perfil.telas) {
      await abrir(p, tela);
      const info = await p.avaliar(`(() => {
        const c = document.getElementById('screen-container');
        return {
          ok: !!c.querySelector('#page-${tela}'),
          erro: !!c.querySelector('.estado-erro'),
          linhas: c.querySelectorAll('tbody tr:not(.linha-vazia), .log-item, .user-row').length
        };
      })()`);
      const erros = p.limparErros();
      verificar(info.ok && !info.erro && erros.length === 0,
        `tela "${tela}" abre sem erros (${info.linhas} registro(s))`, erros.join(' | '));
      const listas = ['agendamentos', 'consultas', 'exames', 'vacinacao', 'unidades', 'logs', 'cadastro-usuarios'];
      if (perfil.nome !== 'Cidadão' && listas.includes(tela)) {
        verificar(info.linhas > 0, `tela "${tela}" exibe dados`);
      }
      if (modo === 'HTTP' && perfil.nome === 'Administrador') await capturar(p, `adm-${tela}`);
    }

    for (const tela of perfil.negadas || []) {
      await p.avaliar(`App.goTo(${JSON.stringify(tela)})`);
      await esperar(250);
      const atual = await p.avaliar('App.currentPage');
      verificar(atual !== tela, `acesso a "${tela}" é bloqueado (redirecionado para "${atual}")`);
      p.limparErros();
    }

    if (perfil.nome === 'Administrador') await cenariosAdministrador(p, modo);
    if (perfil.nome === 'Profissional') await cenariosProfissional(p);
    if (perfil.nome === 'Recepção') await cenariosRecepcao(p, modo);
    if (perfil.nome === 'Cidadão') await cenariosCidadao(p, modo);

    await sair(p);
  }
}

async function cenariosAdministrador(p, modo) {
  // 1. Ações não se acumulam após várias navegações
  for (let i = 0; i < 4; i++) { await abrir(p, 'dashboard'); await abrir(p, 'agendamentos'); }
  const chamadas = await p.avaliar(`(() => {
    let n = 0; const original = App.showAgendamentoModal;
    App.showAgendamentoModal = () => { n++; };
    document.querySelector('[data-action="view-agendamento"]')?.click();
    App.showAgendamentoModal = original;
    return n;
  })()`);
  verificar(chamadas === 1, `um clique dispara a ação 1 vez após 8 navegações (disparou ${chamadas})`);

  // 2. Novo agendamento pelo modal
  const antes = await p.avaliar('AgendamentosAPI.getAll().length');
  await p.avaliar(`(() => {
    App.showNovoAgendamentoModal();
    const cpf = document.getElementById('ag-cpf');
    cpf.value = '33366699957';
    cpf.dispatchEvent(new Event('input', { bubbles: true }));
    const d = new Date(Date.now() + 5 * 86400000);
    document.getElementById('ag-data').value = Util.dataLocalISO(d);
    document.getElementById('ag-horario').value = '10:${modo === 'HTTP' ? '15' : '45'}';
    document.getElementById('modal-confirm-btn').click();
  })()`);
  await p.aguardar('!document.getElementById("app-modal").classList.contains("active")', 5000).catch(() => {});
  const depois = await p.avaliar('AgendamentosAPI.getAll().length');
  verificar(depois === antes + 1, `novo agendamento criado pelo modal (${antes} → ${depois})`);
  if (modo === 'HTTP') {
    await abrir(p, 'agendamentos');
    await p.avaliar('App.showNovoAgendamentoModal()');
    await capturar(p, 'modal-novo-agendamento');
    await p.avaliar('App.closeModal()');
  }

  // 3. Emissão de laudo persiste na API
  const idExame = await p.avaliar(`ExamesAPI.getAll().find(e => !/concl|laudo/i.test(e.status))?.id`);
  await p.avaliar(`(() => {
    App.showLaudoExameModal(${JSON.stringify(idExame)});
    document.getElementById('txt-laudo').value = 'Sem alterações significativas.';
    document.getElementById('modal-confirm-btn').click();
  })()`);
  await esperar(300);
  const exame = await p.avaliar(`ExamesAPI.getAll().find(e => e.id === ${JSON.stringify(idExame)})`);
  verificar(exame?.status === 'Concluído' && exame?.laudo, `laudo do exame ${idExame} emitido e salvo`);

  // 4. Exportação CSV completa (antes era cortada no primeiro "#")
  const csv = await p.avaliar(`(() => {
    let conteudo = '';
    const original = Util.baixarArquivo;
    Util.baixarArquivo = (nome, c) => { conteudo = c; };
    App.exportTableToCSV('agendamentos');
    Util.baixarArquivo = original;
    return conteudo;
  })()`);
  verificar(csv.includes('#10291') && csv.split('\r\n').length > 5, `CSV de agendamentos completo (${csv.split('\r\n').length} linhas)`);

  // 5. Proteção contra XSS em dados digitados
  const statusXss = await p.avaliar(`(async () => {
    window.__xss = 0;
    const lote = VacinacaoAPI.listarEstoque().data.find(e => !e.vencido && e.quantidade > 0);
    const res = await fetch('/vacinacao/registrar-aplicacao', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cidadao: '<img src=x onerror="window.__xss=1">', cpf: '', vacina: lote.vacina, lote: lote.lote,
        dose: 'Reforço', unidade: lote.unidade, profissional: 'Teste', dataHora: Util.dataHoraLocalISO() }) });
    return res.status;
  })()`);
  verificar(statusXss === 201, `aplicação de teste registrada (HTTP ${statusXss})`);
  await abrir(p, 'vacinacao');
  await esperar(300);
  const xss = await p.avaliar('window.__xss');
  const textoVisivel = await p.avaliar(`document.getElementById('screen-container').innerText.includes('<img src=x')`);
  verificar(xss === 0 && textoVisivel, 'nome com HTML malicioso é exibido como texto (sem executar)');

  // 6. Unidades: só "Unidade Centro" e "Unidade Julia"; nomes antigos são migrados
  const unidades = await p.avaliar(`(() => {
    const lista = JSON.parse(localStorage.getItem('upa_agendamentos'));
    lista[0].unidade = 'Unidade Sul';
    localStorage.setItem('upa_agendamentos', JSON.stringify(lista));
    const migrado = AgendamentosAPI.getAll()[0].unidade;
    const todas = new Set([
      ...AgendamentosAPI.getAll(), ...ExamesAPI.getAll(), ...VacinacaoAPI.getEstoque(), ...UsuariosAPI.getAll()
    ].map(r => r.unidade).filter(Boolean));
    return { migrado, todas: [...todas].sort() };
  })()`);
  verificar(unidades.migrado === 'Unidade Julia' && unidades.todas.every(u => ['Unidade Centro', 'Unidade Julia'].includes(u)),
    `unidades padronizadas e migradas (${unidades.todas.join(', ')})`);

  // 7. Logs: detalhe abre o registro clicado mesmo com filtro ativo
  await abrir(p, 'logs');
  await p.avaliar(`(() => { const s = document.getElementById('filter-logs-tipo'); s.value = 'Acesso'; s.dispatchEvent(new Event('change')); })()`);
  await esperar(200);
  const logOk = await p.avaliar(`(() => {
    const item = document.querySelector('.log-item');
    if (!item) return false;
    item.click();
    const titulo = document.querySelector('#app-modal .detalhe-lista')?.innerText || '';
    App.closeModal();
    return titulo.includes(item.dataset.id);
  })()`);
  verificar(logOk, 'detalhe do log abre o registro correto com filtro aplicado');

  if (modo === 'HTTP' && CAPTURAS) {
    await abrir(p, 'dashboard');
    await capturar(p, 'mobile-dashboard', { largura: 390, altura: 844, mobile: true });
    await p.avaliar('document.body.classList.add("sidebar-aberta")');
    await capturar(p, 'mobile-menu', { largura: 390, altura: 844, mobile: true });
    await p.avaliar('document.body.classList.remove("sidebar-aberta")');
    await p.capturarTela(path.join(CAPTURAS, '_reset.png'));
  }
  p.limparErros();
}

async function cenariosProfissional(p) {
  await abrir(p, 'exames');
  const botoes = await p.avaliar(`document.querySelectorAll('[data-action="laudo-exame"]').length`);
  verificar(botoes > 0, `Profissional da Saúde vê "Emitir laudo" (${botoes} exame(s))`);
  p.limparErros();
}

async function cenariosRecepcao(p, modo) {
  await abrir(p, 'exames');
  const laudos = await p.avaliar(`document.querySelectorAll('[data-action="laudo-exame"]').length`);
  verificar(laudos === 0, 'Recepção não vê "Emitir laudo"');

  await abrir(p, 'vacinacao');
  const visivel = await p.avaliar(`!document.getElementById('btn-registrar-vacinacao').hidden`);
  verificar(visivel, 'Recepção vê "Registrar aplicação" na Vacinação');
  const antes = await p.avaliar('VacinacaoAPI.listarAplicacoes().data.length');
  await p.avaliar(`(() => {
    App.showRegistrarVacinaModal();
    document.getElementById('vax-paciente').value = 'Cidadão Recepção ${modo}';
    document.getElementById('vax-prof').value = 'Enf. Cláudia';
    document.getElementById('modal-confirm-btn').click();
  })()`);
  await esperar(500);
  const depois = await p.avaliar('VacinacaoAPI.listarAplicacoes().data.length');
  verificar(depois === antes + 1, `Recepção registra aplicação sem senha extra (${antes} → ${depois})`);
  if (modo === 'HTTP') await capturar(p, 'recepcao-vacinacao');
  p.limparErros();
}

async function cenariosCidadao(p, modo) {
  const dados = await p.avaliar(`(() => {
    const cpf = Util.somenteDigitos(App.usuario.cpf);
    App.goTo('agendamentos');
    return true;
  })()`);
  await esperar(300);
  const linhasDeOutros = await p.avaliar(`(() => {
    const cpf = Util.somenteDigitos(App.usuario.cpf);
    return [...document.querySelectorAll('#screen-container tbody tr:not(.linha-vazia)')]
      .filter(tr => !Util.somenteDigitos(tr.innerText).includes(cpf)).length;
  })()`);
  verificar(dados && linhasDeOutros === 0, 'lista de agendamentos mostra apenas os do próprio cidadão');

  await p.avaliar(`(() => { const i = document.getElementById('filter-agendamentos-busca'); i.value = 'a'; i.dispatchEvent(new Event('input')); })()`);
  await esperar(400);
  const aposFiltro = await p.avaliar(`(() => {
    const cpf = Util.somenteDigitos(App.usuario.cpf);
    return [...document.querySelectorAll('#screen-container tbody tr:not(.linha-vazia)')]
      .filter(tr => !Util.somenteDigitos(tr.innerText).includes(cpf)).length;
  })()`);
  verificar(aposFiltro === 0, 'filtros não expõem agendamentos de outros cidadãos');

  const botoes = await p.avaliar(`({
    alterar: document.querySelectorAll('#screen-container [data-action="edit-agendamento"]').length,
    aceitar: [...document.querySelectorAll('#screen-container [data-action="confirm-agendamento"]')].filter(b => b.textContent.trim() === 'Aceitar').length,
    recusar: [...document.querySelectorAll('#screen-container [data-action="cancel-agendamento"]')].filter(b => b.textContent.trim() === 'Recusar').length
  })`);
  verificar(botoes.alterar === 0 && botoes.aceitar > 0 && botoes.recusar > 0,
    `Cidadão vê só Aceitar/Recusar, nunca Alterar (${JSON.stringify(botoes)})`);

  const api403 = await p.avaliar(`(async () => {
    const meu = AgendamentosAPI.getAll().find(a => App.pertenceAoCidadao(a));
    return (await AgendamentosAPI.alterar({ id: meu.id, horario: '11:00', perfilOperador: App.usuario.perfil })).status;
  })()`);
  verificar(api403 === 403, `API recusa alteração feita pelo cidadão (HTTP ${api403})`);

  await p.avaliar(`document.querySelector('#screen-container [data-action="confirm-agendamento"]').click()`);
  await esperar(500);
  const status = await p.avaliar(`AgendamentosAPI.getAll().find(a => App.pertenceAoCidadao(a)).status`);
  verificar(status === 'Confirmado', `Cidadão aceita o agendamento (status: ${status})`);

  await p.avaliar(`App.handleGlobalSearch('Luciana')`);
  const busca = await p.avaliar(`document.getElementById('search-results-dropdown').innerText`);
  verificar(!busca.includes('Luciana Ferreira'), 'busca global não retorna dados de outros cidadãos');
  p.limparErros();
  if (modo === 'HTTP') await capturar(p, 'cidadao-agendamentos');
}

(async () => {
  const servidor = await iniciarServidorEstatico(RAIZ);
  const navegador = await abrirNavegador();
  const p = navegador.pagina;
  try {
    await rodarCenarios(p, `${servidor.url}/index.html`, 'HTTP');
    await rodarCenarios(p, pathToFileURL(path.join(RAIZ, 'index.html')).href, 'file://');
  } catch (err) {
    falhas++;
    console.error('\nFalha inesperada no teste E2E:', err.message);
    console.error(p.limparErros().join('\n'));
  } finally {
    await navegador.fechar();
    await servidor.fechar();
  }
  console.log(`\n${total - falhas}/${total} verificações passaram.`);
  process.exit(falhas ? 1 : 0);
})();
