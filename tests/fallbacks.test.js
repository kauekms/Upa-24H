const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');

// O sistema também abre via file:// (sem servidor). Nesse modo o fetch dos
// HTML/JSON falha e o app usa as cópias de js/fallbacks.js. Se elas não
// forem regeneradas depois de editar uma tela, o usuário vê a versão antiga.
test('Fallbacks: js/fallbacks.js está em sincronia com cada HTML/JSON (rode `npm run build:fallbacks`)', () => {
  const caminho = path.join(raiz, 'js', 'fallbacks.js');
  assert.ok(fs.existsSync(caminho), 'js/fallbacks.js não existe — rode npm run build:fallbacks');
  const sandbox = {};
  new Function('window', fs.readFileSync(caminho, 'utf8'))(sandbox);
  const fb = sandbox.APP_FALLBACKS;
  assert.ok(fb && typeof fb === 'object');

  const nav = JSON.parse(fs.readFileSync(path.join(raiz, 'json', 'navegacao.json'), 'utf8'));
  const esperados = ['partials/header.html', 'partials/sidebar.html', 'json/usuario.json', 'json/navegacao.json'];
  for (const item of nav.itens) esperados.push(item.arquivo, item.json);

  for (const rel of new Set(esperados)) {
    assert.ok(rel in fb, `fallback ausente para ${rel}`);
    const disco = fs.readFileSync(path.join(raiz, rel), 'utf8');
    if (rel.endsWith('.json')) assert.deepStrictEqual(fb[rel], JSON.parse(disco), `${rel} desatualizado`);
    else assert.strictEqual(fb[rel], disco, `${rel} desatualizado`);
  }
});

test('Fallbacks: app.js não embute mais cópias das telas', () => {
  const app = fs.readFileSync(path.join(raiz, 'js', 'app.js'), 'utf8');
  assert.ok(!app.includes("'dashboard.html': `"), 'app.js ainda contém HTML embutido');
});
