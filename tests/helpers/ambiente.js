/**
 * Ambiente mínimo de navegador para os testes (window, localStorage,
 * sessionStorage, crypto) e carregamento dos scripts do sistema no escopo
 * global, na mesma ordem do index.html.
 */
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto } = require('node:crypto');

class StorageMock {
  constructor() { this.store = {}; }
  getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
  clear() { this.store = {}; }
}

function prepararAmbiente() {
  if (!globalThis.crypto) globalThis.crypto = webcrypto;
  globalThis.window = globalThis;
  globalThis.localStorage = new StorageMock();
  globalThis.sessionStorage = new StorageMock();
  if (!globalThis.App) globalThis.App = { addLog: () => {}, usuario: null };
}

const basePath = path.join(__dirname, '..', '..', 'js');

function carregar(...scripts) {
  for (const rel of scripts) {
    const code = fs.readFileSync(path.join(basePath, rel), 'utf8');
    // Executa no escopo global (equivalente a uma <script> no navegador).
    (0, eval)(code);
  }
}

async function loginComo(cpf, senha) {
  const res = await window.AuthAPI.processarLogin({ identificador: cpf, senha });
  if (res.status !== 200) throw new Error(`Login falhou para ${cpf}: ${res.status} ${res.body.error}`);
  return res.body.token;
}

// Credenciais do seed de demonstração (js/api/usuarios.js)
const SEED = {
  admin: { cpf: '111.444.777-35', senha: 'admin' },
  prof: { cpf: '222.555.888-46', senha: 'prof123' },
  paciente: { cpf: '333.666.999-57', senha: 'paciente123' },
  recepcao: { cpf: '444.777.000-83', senha: 'recep123' }
};

async function chamar(url, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await window.fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json() };
}

module.exports = { prepararAmbiente, carregar, loginComo, chamar, SEED, StorageMock };
