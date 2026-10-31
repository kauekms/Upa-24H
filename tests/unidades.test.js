const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// ==========================================
// Mocks para simular ambiente do navegador
// ==========================================
globalThis.window = globalThis;

class MockElement {
  constructor(tagName = 'div') {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this._innerHTML = '';
    this.textContent = '';
    this.dataset = {};
    this.style = {};
    this.classList = {
      classes: new Set(),
      add(c) { this.classes.add(c); },
      remove(c) { this.classes.delete(c); },
      toggle(c, force) {
        if (force === true) this.classes.add(c);
        else if (force === false) this.classes.delete(c);
        else if (this.classes.has(c)) this.classes.delete(c);
        else this.classes.add(c);
      },
      has(c) { return this.classes.has(c); }
    };
    this.attributes = {};
    this.eventListeners = {};
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = String(val);
  }

  querySelector(selector) {
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      if (this.id === id) return this;
    }
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      if (this.classList.has(cls)) return this;
    }
    if (selector.includes('data-box="')) {
      const box = selector.match(/data-box="([^"]+)"/)?.[1];
      if (this.dataset?.box === box) return this;
    }
    return new MockElement('div');
  }

  querySelectorAll(selector) {
    return [];
  }

  addEventListener(event, handler) {
    this.eventListeners[event] = handler;
  }
}

globalThis.document = {
  getElementById: (id) => new MockElement('div'),
  querySelector: (sel) => new MockElement('div'),
  querySelectorAll: (sel) => []
};

// ==========================================
// Carregar módulos do sistema UPA 24H
// ==========================================
const basePath = path.join(__dirname, '..', 'js');
function loadScript(relPath) {
  const code = fs.readFileSync(path.join(basePath, relPath), 'utf8');
  eval(code);
}

loadScript('config/permissoes.js');
loadScript('render.js');

// ==========================================
// SUÍTE DE TESTES — TELA DE UNIDADES DE SAÚDE
// ==========================================

test('1. Permissões RBAC: Perfis autorizados a acessar a tela "unidades"', () => {
  // Administrador e Profissional da Saúde DEVEM ter acesso
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Administrador', 'unidades'), true);
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Profissional da Saúde', 'unidades'), true);

  // Recepção, Cidadão e Paciente NÃO DEVEM ter acesso
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Recepção', 'unidades'), false);
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Cidadão', 'unidades'), false);
  assert.strictEqual(window.Permissoes.perfilPodeAcessarPagina('Paciente', 'unidades'), false);
});

test('2. Render: renderUnidades existe e é uma função no objeto Render', () => {
  assert.strictEqual(typeof window.Render.renderUnidades, 'function', 'Render.renderUnidades deve ser uma função');
});

test('3. Render: renderUnidades renderiza linhas na tabela corretamente', () => {
  const root = new MockElement('div');
  const tbody = new MockElement('tbody');
  tbody.dataset = { box: 'unidades-tbody' };

  root.querySelector = (sel) => {
    if (sel.includes('unidades-tbody')) return tbody;
    return new MockElement('div');
  };

  const dadosUnidades = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'json', 'unidades.json'), 'utf8'));
  window.Render.resetarPaginacao('unidades');
  window.Render.renderUnidades(root, dadosUnidades);

  assert.ok(tbody.innerHTML.length > 0, 'O tbody deve conter o HTML das unidades renderizadas');
  assert.ok(tbody.innerHTML.includes('Hospital Central Municipal'), 'Deve conter o Hospital Central Municipal');
  assert.ok(tbody.innerHTML.includes('data-action="view-unidade"'), 'Deve conter botão de ver unidade');
  assert.ok(tbody.innerHTML.includes('data-action="edit-unidade"'), 'Deve conter botão de editar unidade');
});

test('4. Render: renderUnidades trata lista vazia sem quebrar', () => {
  const root = new MockElement('div');
  const tbody = new MockElement('tbody');
  tbody.dataset = { box: 'unidades-tbody' };

  root.querySelector = (sel) => {
    if (sel.includes('unidades-tbody')) return tbody;
    return new MockElement('div');
  };

  window.Render.renderUnidades(root, { boxes: { lista: [] } });
  assert.ok(tbody.innerHTML.includes('Nenhuma unidade de saúde encontrada'), 'Deve exibir mensagem amigável de lista vazia');
});

test('5. Render: renderPage("unidades") chama renderUnidades sem lançar exceção', () => {
  assert.doesNotThrow(() => {
    const root = new MockElement('div');
    globalThis.document.getElementById = () => root;
    const dados = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'json', 'unidades.json'), 'utf8'));
    window.Render.renderPage('unidades', dados, { nome: 'Dra. Luiza', perfil: 'Administrador' });
  }, 'Render.renderPage("unidades") não deve disparar erro de função indefinida');
});
