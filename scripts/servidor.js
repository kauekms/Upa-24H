#!/usr/bin/env node
/**
 * Servidor HTTP estático para desenvolvimento local (sem dependências).
 *   npm start            → http://localhost:8080
 *   PORT=3000 npm start  → outra porta
 *
 * Abrir o index.html direto do disco também funciona (modo file://), mas via
 * servidor o navegador carrega os arquivos reais de pages/ e json/ em vez das
 * cópias embutidas — útil para ver alterações sem rodar "npm run build".
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.join(__dirname, '..');
const PORTA = Number(process.env.PORT) || 8080;
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let caminho;
  try {
    caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('Requisição inválida');
    return;
  }
  let arquivo = path.normalize(path.join(RAIZ, caminho));
  // O backend PHP só roda no Apache do XAMPP: aqui nunca servimos o código-fonte dele.
  if (/^/(backend|database)(/|$)/.test(caminho) || /.(php|sql)$/i.test(caminho)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
    return;
  }
  if (!arquivo.startsWith(RAIZ)) {
    res.writeHead(403).end('Acesso negado');
    return;
  }
  if (fs.existsSync(arquivo) && fs.statSync(arquivo).isDirectory()) arquivo = path.join(arquivo, 'index.html');
  if (!fs.existsSync(arquivo)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Não encontrado');
    return;
  }
  res.writeHead(200, {
    'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  fs.createReadStream(arquivo).pipe(res);
}).listen(PORTA, () => {
  console.log(`UPA 24H rodando em http://localhost:${PORTA}`);
});
