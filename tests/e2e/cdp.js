/**
 * Mini-cliente do Chrome DevTools Protocol, sem dependências externas.
 *
 * Usa o Chrome/Edge já instalado na máquina em modo headless e o WebSocket
 * nativo do Node (>= 22). Serve só para os testes E2E de fumaça
 * (tests/e2e/smoke.e2e.js) — não faz parte do sistema em produção.
 */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');

const CANDIDATOS_NAVEGADOR = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);

function localizarNavegador() {
  const achado = CANDIDATOS_NAVEGADOR.find(p => fs.existsSync(p));
  if (!achado) {
    throw new Error('Nenhum Chrome/Edge encontrado. Defina a variável CHROME_PATH.');
  }
  return achado;
}

const esperar = ms => new Promise(r => setTimeout(r, ms));

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let dados = '';
      res.on('data', c => { dados += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(dados)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

/** Servidor estático simples para servir a raiz do projeto. */
function iniciarServidorEstatico(raiz) {
  const tipos = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
  };
  const servidor = http.createServer((req, res) => {
    const caminhoUrl = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let arquivo = path.normalize(path.join(raiz, caminhoUrl));
    if (!arquivo.startsWith(path.normalize(raiz))) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(arquivo) && fs.statSync(arquivo).isDirectory()) arquivo = path.join(arquivo, 'index.html');
    if (!fs.existsSync(arquivo)) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': tipos[path.extname(arquivo)] || 'application/octet-stream' });
    fs.createReadStream(arquivo).pipe(res);
  });
  return new Promise(resolve => {
    servidor.listen(0, '127.0.0.1', () => resolve({
      url: `http://127.0.0.1:${servidor.address().port}`,
      fechar: () => new Promise(r => servidor.close(() => r()))
    }));
  });
}

class Pagina {
  constructor(ws) {
    this.ws = ws;
    this.seq = 0;
    this.pendentes = new Map();
    this.erros = [];
    this.consoleLog = [];
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pendentes.has(msg.id)) {
        const { resolve, reject } = this.pendentes.get(msg.id);
        this.pendentes.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
        return;
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params.exceptionDetails;
        this.erros.push(`EXCEÇÃO: ${d.exception?.description || d.text}`);
      } else if (msg.method === 'Runtime.consoleAPICalled') {
        const texto = msg.params.args.map(a => a.value ?? a.description ?? '').join(' ');
        this.consoleLog.push(`[${msg.params.type}] ${texto}`);
        if (msg.params.type === 'error') this.erros.push(`console.error: ${texto}`);
      } else if (msg.method === 'Log.entryAdded') {
        const e = msg.params.entry;
        if (e.level === 'error' && !/fonts\.(googleapis|gstatic)/.test(e.url || '')) {
          this.erros.push(`LOG: ${e.text} ${e.url || ''}`);
        }
      }
    });
  }

  enviar(method, params = {}) {
    const id = ++this.seq;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pendentes.set(id, { resolve, reject }));
  }

  async avaliar(expressao) {
    const r = await this.enviar('Runtime.evaluate', {
      expression: expressao, awaitPromise: true, returnByValue: true, userGesture: true
    });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    }
    return r.result.value;
  }

  async navegar(url) {
    await this.enviar('Page.navigate', { url });
    await this.aguardar('document.readyState === "complete"');
  }

  async aguardar(expressao, timeoutMs = 8000) {
    const inicio = Date.now();
    while (Date.now() - inicio < timeoutMs) {
      try {
        if (await this.avaliar(`!!(${expressao})`)) return true;
      } catch { /* página ainda carregando */ }
      await esperar(60);
    }
    throw new Error(`Timeout aguardando: ${expressao}`);
  }

  async capturarTela(arquivo, { largura = 1440, altura = 900, mobile = false } = {}) {
    await this.enviar('Emulation.setDeviceMetricsOverride', {
      width: largura, height: altura, deviceScaleFactor: 1, mobile
    });
    await esperar(250);
    const { data } = await this.enviar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
    fs.writeFileSync(arquivo, Buffer.from(data, 'base64'));
  }

  limparErros() {
    const e = this.erros;
    this.erros = [];
    return e;
  }
}

async function abrirNavegador() {
  const executavel = localizarNavegador();
  const perfilDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upa-e2e-'));
  const proc = spawn(executavel, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${perfilDir}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu',
    '--allow-file-access-from-files', '--window-size=1440,900', 'about:blank'
  ], { stdio: 'ignore' });

  const portaArquivo = path.join(perfilDir, 'DevToolsActivePort');
  const inicio = Date.now();
  while (!fs.existsSync(portaArquivo)) {
    if (Date.now() - inicio > 15000) throw new Error('Navegador não iniciou a tempo.');
    await esperar(100);
  }
  await esperar(150);
  const porta = fs.readFileSync(portaArquivo, 'utf8').split('\n')[0].trim();
  const alvos = await getJson(`http://127.0.0.1:${porta}/json/list`);
  const alvo = alvos.find(t => t.type === 'page');

  const ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  const pagina = new Pagina(ws);
  await pagina.enviar('Page.enable');
  await pagina.enviar('Runtime.enable');
  await pagina.enviar('Log.enable');

  return {
    pagina,
    async fechar() {
      try { ws.close(); } catch { /* ignora */ }
      proc.kill();
      await esperar(300);
      try { fs.rmSync(perfilDir, { recursive: true, force: true }); } catch { /* arquivo em uso no Windows */ }
    }
  };
}

module.exports = { abrirNavegador, iniciarServidorEstatico, esperar };
