#!/usr/bin/env node
/**
 * Gera js/fallbacks.js com cópias de todas as telas (HTML) e dados (JSON)
 * listados em json/navegacao.json, mais header/sidebar.
 *
 * Por que existe: aberto direto do disco (file://), o navegador bloqueia o
 * fetch dos arquivos e o app usa estas cópias. Elas ficavam escritas à mão
 * dentro de app.js e, em 30/10/2026, 18 de 22 estavam desatualizadas.
 *
 * Uso: npm run build:fallbacks   (o teste tests/fallbacks.test.js acusa se esquecer)
 */
const fs = require('node:fs');
const path = require('node:path');

const raiz = path.join(__dirname, '..');
const ler = (rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');

const nav = JSON.parse(ler('json/navegacao.json'));
const arquivos = ['partials/header.html', 'partials/sidebar.html', 'json/usuario.json', 'json/navegacao.json'];
for (const item of nav.itens) arquivos.push(item.arquivo, item.json);

const fallbacks = {};
for (const rel of new Set(arquivos)) {
  const conteudo = ler(rel);
  fallbacks[rel] = rel.endsWith('.json') ? JSON.parse(conteudo) : conteudo;
}

const saida = `/**
 * ARQUIVO GERADO — não edite à mão. Rode \`npm run build:fallbacks\`.
 * Cópias das telas usadas quando o sistema é aberto via file://.
 */
window.APP_FALLBACKS = ${JSON.stringify(fallbacks, null, 2)};
`;
fs.writeFileSync(path.join(raiz, 'js', 'fallbacks.js'), saida);
console.log(`js/fallbacks.js gerado com ${Object.keys(fallbacks).length} arquivos.`);
