/**
 * Testes de integridade estrutural do projeto: garantem que as peças que o
 * index.html, a navegação e o modo file:// esperam realmente existem e
 * estão sincronizadas.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { estaAtualizado } = require('../scripts/gerar-fallbacks.js');

const RAIZ = path.join(__dirname, '..');
const ler = rel => fs.readFileSync(path.join(RAIZ, rel), 'utf8');

test('Estrutura: js/generated/fallbacks.js está sincronizado com pages/, partials/ e json/', () => {
  assert.ok(estaAtualizado(), 'fallbacks.js desatualizado — rode "npm run build"');
});

test('Estrutura: todo <script>/<link> local do index.html aponta para um arquivo existente', () => {
  const html = ler('index.html');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map(m => m[1])
    .filter(r => !/^(https?:|data:|#)/.test(r));
  assert.ok(refs.length > 10, 'index.html deveria referenciar os scripts e estilos do sistema');
  for (const ref of refs) {
    assert.ok(fs.existsSync(path.join(RAIZ, ref)), `index.html referencia arquivo inexistente: ${ref}`);
  }
});

test('Estrutura: cada tela de json/navegacao.json tem HTML e JSON existentes', () => {
  const nav = JSON.parse(ler('json/navegacao.json'));
  for (const item of nav.itens) {
    assert.ok(fs.existsSync(path.join(RAIZ, item.arquivo)), `HTML ausente: ${item.arquivo}`);
    assert.ok(fs.existsSync(path.join(RAIZ, item.json)), `JSON ausente: ${item.json}`);
  }
});

test('Estrutura: todas as páginas com permissão por perfil existem na navegação', () => {
  global.window = global;
  const Permissoes = require('../js/config/permissoes.js');
  const nav = JSON.parse(ler('json/navegacao.json'));
  const ids = new Set(nav.itens.map(i => i.id));
  for (const [perfil, paginas] of Object.entries(Permissoes.PAGINAS_POR_PERFIL)) {
    for (const p of paginas) assert.ok(ids.has(p), `Perfil "${perfil}" referencia página inexistente "${p}"`);
  }
});

test('Mock HTTP: arquivos de dados (json/*.json) nunca são confundidos com rotas da API', () => {
  const MockHttp = require('../js/api/mock-http.js');
  assert.strictEqual(MockHttp.exata('json/agendamentos.json', '/agendamentos'), false);
  assert.strictEqual(MockHttp.exata('json/exames.json', '/exames'), false);
  assert.strictEqual(MockHttp.prefixo('json/exames.json', '/exames'), false);
  assert.strictEqual(MockHttp.exata('json/logs.json', '/logs'), false);
  assert.strictEqual(MockHttp.exata('/agendamentos?status=Pendente', '/agendamentos'), true);
  assert.strictEqual(MockHttp.prefixo('/exames/%23EX-1', '/exames'), true);
  assert.strictEqual(MockHttp.exata('http://localhost:8080/auth/login', '/auth/login'), true);
});

test('Util: escape de HTML neutraliza tags e aspas', () => {
  const Util = require('../js/core/utils.js');
  assert.strictEqual(Util.esc('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.strictEqual(Util.esc(null), '');
  assert.strictEqual(Util.esc(0), '0');
});

test('Util: datas locais e conversões BR/ISO', () => {
  const Util = require('../js/core/utils.js');
  assert.strictEqual(Util.dataLocalISO(new Date(2026, 10, 10, 23, 30)), '2026-11-10', 'deve usar a data LOCAL, não UTC');
  assert.strictEqual(Util.isoParaBR('2026-05-07'), '07/05/2026');
  assert.strictEqual(Util.brParaISO('7/5/2026'), '2026-05-07');
  assert.strictEqual(Util.calcularIdade('1988-12-31', new Date(2026, 10, 10)), 37, 'aniversário ainda não chegou no ano');
  assert.strictEqual(Util.mascararCPF('11144477735'), '111.444.777-35');
});

test('Util: CSV escapa aspas e usa ";" como separador', () => {
  const Util = require('../js/core/utils.js');
  const csv = Util.gerarCSV(['ID', 'Nome'], [['#10291', 'Ana "Paula"']]);
  assert.strictEqual(csv, '"ID";"Nome"\r\n"#10291";"Ana ""Paula"""');
});

test('Unidades: o sistema trabalha somente com "Unidade Centro" e "Unidade Julia"', () => {
  const Unidades = require('../js/config/unidades.js');
  assert.deepStrictEqual(Unidades.LISTA, ['Unidade Centro', 'Unidade Julia']);

  // Nomes antigos são migrados automaticamente
  assert.strictEqual(Unidades.normalizar('Unidade Central'), 'Unidade Centro');
  assert.strictEqual(Unidades.normalizar('UPA 24h Central'), 'Unidade Centro');
  assert.strictEqual(Unidades.normalizar('Unidade Sul'), 'Unidade Julia');
  assert.strictEqual(Unidades.normalizar('UBS Vila Nova'), 'Unidade Julia');
  assert.strictEqual(Unidades.normalizar('Todas'), 'Todas', 'valores que não são nomes antigos não mudam');

  // Nenhuma tela, JSON ou seed ainda usa nomes antigos
  const antigos = /Unidade (Central|Oeste|Sul|Norte|Leste)|UPA 24h (Central|Jardim Sul)|UBS (Vila Nova|Centro)|Hospital (Central Municipal|Regional Norte)/;
  const arquivos = [
    ...fs.readdirSync(path.join(RAIZ, 'pages')).map(f => `pages/${f}`),
    ...fs.readdirSync(path.join(RAIZ, 'json')).map(f => `json/${f}`),
    ...fs.readdirSync(path.join(RAIZ, 'js/api')).map(f => `js/api/${f}`),
    ...fs.readdirSync(path.join(RAIZ, 'js/ui')).map(f => `js/ui/${f}`),
    'js/config/catalogos.js'
  ];
  for (const f of arquivos) {
    assert.ok(!antigos.test(ler(f)), `${f} ainda usa um nome de unidade antigo`);
  }
  const unidadesJson = JSON.parse(ler('json/unidades.json')).boxes.lista.map(u => u.nome);
  assert.deepStrictEqual(unidadesJson, ['Unidade Centro', 'Unidade Julia']);
});

test('Permissões: laudo só por Profissional da Saúde e Administrador; Recepção registra vacinação', () => {
  global.window = global;
  const Permissoes = require('../js/config/permissoes.js');
  assert.strictEqual(Permissoes.podeEmitirLaudo('Profissional da Saúde'), true);
  assert.strictEqual(Permissoes.podeEmitirLaudo('Administrador'), true);
  assert.strictEqual(Permissoes.podeEmitirLaudo('Recepção'), false);
  assert.strictEqual(Permissoes.podeEmitirLaudo('Cidadão'), false);

  assert.strictEqual(Permissoes.perfilPodeAcessarPagina('Recepção', 'vacinacao'), true);
  assert.strictEqual(Permissoes.podeRegistrarVacinacao('Recepção'), true);
  assert.strictEqual(Permissoes.podeGerenciarEstoqueVacina('Recepção'), false);

  assert.strictEqual(Permissoes.podeGerenciarAtendimentos('Cidadão'), false, 'Cidadão nunca altera agendamentos');
  assert.strictEqual(Permissoes.podeGerenciarAtendimentos('Recepção'), true);
});
