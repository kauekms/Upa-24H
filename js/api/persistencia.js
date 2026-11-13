/**
 * ============================================================================
 * Persistencia — liga a aplicação ao banco MySQL (backend PHP no XAMPP).
 * ============================================================================
 *
 * COMO FUNCIONA
 * - Ao abrir o sistema por http://localhost/upa24h/, o módulo consulta
 *   backend/api.php/status. Se o banco responder, passa a operar "online".
 * - O login é validado primeiro no servidor (tabela usuarios). Em seguida os
 *   dados permitidos ao perfil são carregados do MySQL (GET /sync) e usados
 *   pelas telas.
 * - Cada alteração salva pelos módulos de API (agendamentos, exames, vacinas,
 *   logs...) é enviada ao servidor (PUT /sync/{coleção}), que grava nas
 *   tabelas relacionais e valida as permissões do perfil.
 * - Sem backend (arquivo aberto direto do disco, ou servidor de testes do
 *   Node), o módulo fica "offline" e o sistema usa só o armazenamento local.
 * ============================================================================
 */
const Persistencia = (() => {
  const BASE = 'backend/api.php';
  const ESPERA_ENVIO_MS = 300;

  // Ordem de envio da primeira carga: dependências antes (lote/campanha antes de aplicação).
  const ORDEM = [
    'upa_usuarios', 'upa_vacinacao_minimos', 'upa_vacinacao_estoque', 'upa_vacinacao_campanhas',
    'upa_vacinacao_aplicacoes', 'upa_agendamentos', 'upa_consultas', 'upa_exames', 'upa_logs'
  ];

  // Como obter (e semear, se ainda não existir) cada coleção localmente.
  const LEITORES = {
    upa_usuarios: () => window.UsuariosAPI?.getAll(),
    upa_agendamentos: () => window.AgendamentosAPI?.getAll(),
    upa_consultas: () => window.ConsultasAPI?.getAll(),
    upa_exames: () => window.ExamesAPI?.getAll(),
    upa_logs: () => window.AuditoriaService?.getAll(),
    upa_vacinacao_campanhas: () => window.VacinacaoAPI?.getCampanhas(),
    upa_vacinacao_estoque: () => window.VacinacaoAPI?.getEstoque(),
    upa_vacinacao_aplicacoes: () => window.VacinacaoAPI?.getAplicacoes(),
    upa_vacinacao_minimos: () => window.VacinacaoAPI?.getMinimos()
  };

  const estado = {
    online: false,
    sessaoAtiva: false,
    aplicando: false,
    pendentes: {},
    timer: null,
    envioEmCurso: Promise.resolve()
  };

  async function requisitar(rota, { method = 'GET', corpo, keepalive = false, timeoutMs = 15000 } = {}) {
    const controle = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controle ? setTimeout(() => controle.abort(), timeoutMs) : null;
    try {
      const res = await fetch(`${BASE}${rota}`, {
        method,
        credentials: 'same-origin',
        keepalive,
        signal: controle?.signal,
        headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: corpo !== undefined ? JSON.stringify(corpo) : undefined
      });
      let body = {};
      try { body = await res.json(); } catch { body = { success: false, message: 'Resposta inválida do servidor.' }; }
      if (res.status === 401) estado.sessaoAtiva = false;
      return { ok: res.ok && body.success !== false, status: res.status, body };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /** Verifica se o backend PHP + MySQL está disponível. */
  async function iniciar() {
    estado.online = false;
    if (typeof location === 'undefined' || !/^https?:$/.test(location.protocol)) return false;
    try {
      const { ok, body } = await requisitar('/status', { timeoutMs: 2500 });
      estado.online = ok && body.banco === true;
      estado.sessaoAtiva = estado.online && body.autenticado === true;
    } catch {
      estado.online = false;
    }
    if (estado.online && typeof window !== 'undefined') {
      window.addEventListener('pagehide', () => enviarPendentes({ keepalive: true }));
    }
    return estado.online;
  }

  async function login(identificador, senha) {
    const r = await requisitar('/auth/login', { method: 'POST', corpo: { identificador, senha } });
    estado.sessaoAtiva = r.ok;
    return r;
  }

  async function logout() {
    if (!estado.online) return;
    await enviarPendentes();
    try { await requisitar('/auth/logout', { method: 'POST', corpo: {} }); } catch { /* rede */ }
    estado.sessaoAtiva = false;
  }

  /** Usuário da sessão no servidor, ou null se expirou. */
  async function me() {
    try {
      const r = await requisitar('/auth/me');
      estado.sessaoAtiva = r.ok;
      return r.ok ? r.body.user : null;
    } catch {
      return null;
    }
  }

  /**
   * Carrega do MySQL as coleções permitidas ao perfil e grava no armazenamento
   * local usado pelas telas. Tabelas ainda vazias recebem os dados iniciais.
   */
  async function carregar() {
    if (!estado.online || !estado.sessaoAtiva) return false;
    const r = await requisitar('/sync', { timeoutMs: 30000 });
    if (!r.ok) return false;
    const { colecoes = {}, vazias = [] } = r.body;

    estado.aplicando = true;
    try {
      for (const [chave, valor] of Object.entries(colecoes)) {
        if (vazias.includes(chave)) continue;
        localStorage.setItem(chave, JSON.stringify(valor));
      }
    } finally {
      estado.aplicando = false;
    }

    // Primeira execução: as tabelas vazias recebem os registros iniciais do sistema.
    for (const chave of ORDEM.filter(c => vazias.includes(c))) {
      try {
        LEITORES[chave]?.();
        const local = JSON.parse(localStorage.getItem(chave) || 'null');
        if (local) await enviar(chave, local);
      } catch (e) {
        console.warn(`Persistencia: não foi possível enviar a carga inicial de ${chave}.`, e);
      }
    }
    return true;
  }

  /** Chamado pelos módulos de API sempre que salvam uma coleção. */
  function registrar(chave, lista) {
    if (!estado.online || !estado.sessaoAtiva || estado.aplicando) return;
    estado.pendentes[chave] = lista;
    clearTimeout(estado.timer);
    estado.timer = setTimeout(() => enviarPendentes(), ESPERA_ENVIO_MS);
  }

  async function enviar(chave, lista, opcoes = {}) {
    const r = await requisitar(`/sync/${encodeURIComponent(chave)}`, { method: 'PUT', corpo: { lista }, ...opcoes });
    if (!r.ok && r.status !== 403) {
      console.warn(`Persistencia: falha ao gravar ${chave} no banco (HTTP ${r.status}).`, r.body?.message);
    }
    return r;
  }

  /** Envia tudo o que está pendente, na ordem das dependências. */
  function enviarPendentes({ keepalive = false } = {}) {
    clearTimeout(estado.timer);
    const lote = estado.pendentes;
    estado.pendentes = {};
    const chaves = ORDEM.filter(c => c in lote);
    if (!chaves.length) return estado.envioEmCurso;
    estado.envioEmCurso = estado.envioEmCurso.then(async () => {
      for (const chave of chaves) {
        // keepalive tem limite de ~64 KB: a trilha de logs segue no envio normal.
        const usarKeepalive = keepalive && chave !== 'upa_logs';
        try { await enviar(chave, lote[chave], { keepalive: usarKeepalive }); } catch (e) {
          console.warn(`Persistencia: erro de rede ao gravar ${chave}.`, e);
        }
      }
    });
    return estado.envioEmCurso;
  }

  function urlRelatorio(tipo, filtros = {}) {
    const q = new URLSearchParams({ tipo });
    Object.entries(filtros).forEach(([k, v]) => { if (v) q.set(k, v); });
    return `backend/relatorio.php?${q.toString()}`;
  }

  return {
    iniciar,
    login,
    logout,
    me,
    carregar,
    registrar,
    enviarPendentes,
    urlRelatorio,
    get online() { return estado.online; },
    get sessaoAtiva() { return estado.sessaoAtiva; }
  };
})();

if (typeof window !== 'undefined') window.Persistencia = Persistencia;
if (typeof module !== 'undefined' && module.exports) module.exports = Persistencia;
