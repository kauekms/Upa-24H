#!/usr/bin/env node
/**
 * Gera js/generated/fallbacks.js a partir dos arquivos reais de pages/,
 * partials/ e json/.
 *
 * POR QUE ISTO EXISTE
 * Quando o sistema é aberto direto do disco (file://index.html), o navegador
 * bloqueia fetch() de arquivos locais. Para funcionar assim mesmo, o app usa
 * cópias embutidas do HTML/JSON de cada tela. Antes essas cópias eram
 * mantidas À MÃO dentro de app.js (~1.000 linhas) e 19 das 23 já estavam
 * diferentes dos arquivos reais — o sistema se comportava de um jeito via
 * servidor e de outro via file://.
 *
 * Agora as cópias são geradas automaticamente:
 *   npm run build          → regenera o arquivo
 *   npm test               → falha se o arquivo estiver desatualizado
 */
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const DESTINO = path.join(RAIZ, 'js', 'generated', 'fallbacks.js');
const PASTAS = [
  { dir: 'partials', ext: '.html' },
  { dir: 'pages', ext: '.html' },
  { dir: 'json', ext: '.json' }
];

function coletar() {
  const mapa = {};
  for (const { dir, ext } of PASTAS) {
    const abs = path.join(RAIZ, dir);
    if (!fs.existsSync(abs)) continue;
    for (const nome of fs.readdirSync(abs).sort()) {
      if (path.extname(nome) !== ext) continue;
      const chave = `${dir}/${nome}`;
      const texto = fs.readFileSync(path.join(abs, nome), 'utf8').replace(/\r\n/g, '\n');
      mapa[chave] = ext === '.json' ? JSON.parse(texto) : texto;
    }
  }
  return mapa;
}

function gerarConteudo() {
  const mapa = coletar();
  return `/**
 * ARQUIVO GERADO AUTOMATICAMENTE — NÃO EDITE À MÃO.
 * Origem: pages/, partials/ e json/. Para atualizar: npm run build
 *
 * Cópias embutidas usadas apenas quando o sistema é aberto via file://
 * (sem servidor HTTP), onde o navegador bloqueia fetch() de arquivos locais.
 */
window.UPA_FALLBACKS = ${JSON.stringify(mapa, null, 2)};
`;
}

function gerar() {
  fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
  fs.writeFileSync(DESTINO, gerarConteudo());
  return DESTINO;
}

function estaAtualizado() {
  if (!fs.existsSync(DESTINO)) return false;
  return fs.readFileSync(DESTINO, 'utf8').replace(/\r\n/g, '\n') === gerarConteudo();
}

if (require.main === module) {
  if (process.argv.includes('--check')) {
    if (!estaAtualizado()) {
      console.error('js/generated/fallbacks.js está desatualizado. Rode: npm run build');
      process.exit(1);
    }
    console.log('fallbacks.js está atualizado.');
  } else {
    console.log('Gerado:', path.relative(RAIZ, gerar()));
  }
}

module.exports = { gerar, gerarConteudo, estaAtualizado };
