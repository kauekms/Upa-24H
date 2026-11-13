/**
 * ============================================================================
 * UPA 24H — núcleo da aplicação (SPA sem framework).
 * ============================================================================
 *
 * Responsabilidades deste arquivo:
 *   - inicialização, sessão e navegação entre telas (goTo);
 *   - sincronização dos dados das telas com as APIs (fonte única da verdade);
 *   - infraestrutura de UI: modal, toast, busca global, notificações;
 *   - ações das telas (delegação de eventos registrada UMA única vez).
 *
 * Os modais de cada domínio ficam em js/ui/modais-*.js e a tela de login em
 * js/ui/login.js — todos anexados a este mesmo objeto via Object.assign.
 * O desenho das tabelas/cards fica em js/ui/render.js.
 *
 * Funciona via servidor HTTP e também abrindo index.html direto do disco
 * (file://): nesse caso o HTML/JSON das telas vem de js/generated/fallbacks.js.
 * ============================================================================
 */
const App = {
  currentPage: null,
  usuario: null,
  navegacao: null,
  data: {},
  _navSeq: 0,
  _ultimaAtividade: Date.now(),

  // Versão do formato salvo em localStorage (upa_data_cache). Versões
  // anteriores salvavam respostas da "API" no lugar dos dados das telas
  // (bug do interceptor de fetch), então caches antigos são descartados.
  VERSAO_CACHE: 3, // 3: unidades padronizadas (Unidade Centro / Unidade Julia)

  settings: {
    notificacoes: { email: true, push: true, estoque: true, manutencao: false },
    itensPorPagina: 10,
    sessaoTimeoutMin: 30
  },

  get fallbacks() {
    return (typeof window !== 'undefined' && window.UPA_FALLBACKS) || {};
  },

  // Atalho mantido por compatibilidade: vários pontos buscam a lista de
  // usuários (login, busca de cidadão por CPF nos formulários etc).
  initUsuariosDB() {
    return window.UsuariosAPI ? window.UsuariosAPI.getAll() : [];
  },

  // ==========================================================================
  // Inicialização e sessão
  // ==========================================================================
  async init() {
    try {
      window.AuthAPI?.registrarInterceptor();
      window.UsuariosAPI?.registrarInterceptor();
      window.VacinacaoAPI?.registrarInterceptor();
      // Backend PHP + MySQL (XAMPP) disponível? Se sim, login e dados passam pelo banco.
      const bancoOnline = await window.Persistencia?.iniciar?.();
      await this.loadPartials();
      const versao = document.querySelector('.sidebar-versao');
      if (versao) versao.textContent += bancoOnline ? ' · Banco MySQL conectado' : ' · Modo local (sem banco)';

      this.navegacao = await this.fetchJson('json/navegacao.json');
      this.carregarCache();

      const savedSettings = localStorage.getItem('upa_settings');
      if (savedSettings) {
        try {
          const s = JSON.parse(savedSettings);
          this.settings = {
            ...this.settings,
            ...s,
            notificacoes: { ...this.settings.notificacoes, ...(s.notificacoes || {}) }
          };
        } catch { /* preferências corrompidas: mantém padrão */ }
      }
      this.applySettings();

      // Eventos globais e delegação das ações das telas: registrados UMA vez.
      this.bindNavigation();
      this.bindGlobalActions();
      this.bindAcoesDasTelas();
      this.iniciarMonitorInatividade();

      const sessao = await window.AuthAPI?.restaurarSessao?.();
      if (sessao && window.Permissoes?.perfilTemLoginWeb(sessao.perfil)) {
        await this.entrarNoSistema(sessao, { boasVindas: false });
      } else {
        this.usuario = null;
        window.AuthAPI?.setTokenLocal(null);
        this.showLoginOverlay();
      }
    } catch (err) {
      console.error('Erro na inicialização:', err);
      const c = document.getElementById('screen-container');
      if (c) c.innerHTML = this.telaErro('Erro ao iniciar o sistema UPA 24H.', err);
    }
  },

  /** Chamado após login bem-sucedido ou sessão restaurada. */
  async entrarNoSistema(usuario, { boasVindas = true } = {}) {
    this.usuario = usuario;
    this._ultimaAtividade = Date.now();
    document.body.classList.add('autenticado');
    this.applyUsuario();
    this.buildSidebar();
    this.atualizarBadgeNotificacoes();
    if (boasVindas) this.toast(`Bem-vindo(a), ${usuario.nome}!`, 'success');
    const pedida = decodeURIComponent(location.hash.slice(1));
    const inicial = window.Permissoes?.paginaInicial(usuario.perfil) || 'dashboard';
    const destino = pedida && window.Permissoes?.perfilPodeAcessarPagina(usuario.perfil, pedida) ? pedida : inicial;
    await this.goTo(destino);
  },

  async sair({ motivo = 'Sessão encerrada com sucesso.', tipo = 'info' } = {}) {
    await window.AuthAPI?.logout();
    this.usuario = null;
    this.currentPage = null;
    document.body.classList.remove('autenticado', 'sidebar-aberta');
    this.closeModal();
    const c = document.getElementById('screen-container');
    if (c) c.innerHTML = '';
    history.replaceState(null, '', location.pathname + location.search);
    this.toast(motivo, tipo);
    this.showLoginOverlay();
  },

  checkLogin(pageId = '') {
    if (this.usuario) return true;
    if (pageId === 'logs' || pageId === 'cadastro-usuarios') {
      window.AuditoriaService?.registrar({
        usuario: 'Não autenticado',
        acao: 'Tentativa de Acesso Negado',
        tipo: 'Aviso',
        modulo: 'SEGURANÇA',
        descricao: `Tentativa de acesso não autenticado à área administrativa "${pageId}".`
      });
    }
    this.showLoginOverlay();
    return false;
  },

  /** Encerra a sessão após o tempo de inatividade configurado. */
  iniciarMonitorInatividade() {
    const registrar = () => { this._ultimaAtividade = Date.now(); };
    ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(ev =>
      document.addEventListener(ev, registrar, { passive: true })
    );
    setInterval(() => {
      const limiteMin = Number(this.settings.sessaoTimeoutMin) || 0;
      if (!this.usuario || limiteMin <= 0) return;
      if (Date.now() - this._ultimaAtividade > limiteMin * 60 * 1000) {
        window.AuditoriaService?.registrar({
          usuario: this.usuario.nome,
          acao: 'Sessão encerrada por inatividade',
          tipo: 'Acesso',
          modulo: 'AUTH',
          descricao: `Sessão encerrada após ${limiteMin} min sem atividade.`
        });
        this.sair({ motivo: `Sessão encerrada após ${limiteMin} minutos de inatividade.`, tipo: 'warning' });
      }
    }, 30 * 1000);
  },

  // ==========================================================================
  // Carregamento de arquivos (com fallback embutido para file://)
  // ==========================================================================
  async fetchJson(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (this.fallbacks[url]) return JSON.parse(JSON.stringify(this.fallbacks[url]));
      throw err;
    }
  },

  async fetchText(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (this.fallbacks[url]) return this.fallbacks[url];
      throw err;
    }
  },

  async loadPartials() {
    const [header, sidebar] = await Promise.all([
      this.fetchText('partials/header.html'),
      this.fetchText('partials/sidebar.html')
    ]);
    document.getElementById('header-slot').innerHTML = header;
    document.getElementById('sidebar-slot').innerHTML = sidebar;
  },

  // ==========================================================================
  // Estado persistido
  // ==========================================================================
  carregarCache() {
    try {
      const salvo = JSON.parse(localStorage.getItem('upa_data_cache') || 'null');
      this.data = (salvo && salvo._versao === this.VERSAO_CACHE && salvo.telas) ? salvo.telas : {};
    } catch {
      this.data = {};
    }
  },

  saveState() {
    try {
      localStorage.setItem('upa_settings', JSON.stringify(this.settings));
      localStorage.setItem('upa_data_cache', JSON.stringify({ _versao: this.VERSAO_CACHE, telas: this.data }));
    } catch (err) {
      console.warn('Não foi possível salvar o estado local:', err);
    }
  },

  applySettings() {
    // Tema escuro e alto contraste foram removidos do sistema (a pedido):
    // limpa as classes caso alguma preferência antiga ainda esteja salva.
    document.body.classList.remove('dark-theme', 'high-contrast');
    window.Render?.definirItensPorPagina?.(this.settings.itensPorPagina);
  },

  applyUsuario() {
    const u = this.usuario;
    if (!u) return;
    const ini = u.iniciais || Util.iniciais(u.nome);
    const map = {
      '#user-nome': u.nome,
      '#user-cargo': u.cargo || u.perfil,
      '#user-avatar': ini,
      '#dropdown-user-nome': u.nome,
      '#dropdown-user-email': u.email,
      '#dropdown-user-perfil': u.perfil
    };
    Object.entries(map).forEach(([sel, val]) => {
      const el = document.querySelector(sel);
      if (el && val) el.textContent = val;
    });

    ['#user-avatar', '#perfil-avatar-big'].forEach(sel => {
      const el = document.querySelector(sel);
      if (!el) return;
      if (u.avatarUrl) {
        el.style.backgroundImage = `url("${String(u.avatarUrl).replace(/"/g, '%22')}")`;
        el.classList.add('com-foto');
      } else {
        el.style.backgroundImage = '';
        el.classList.remove('com-foto');
      }
    });
  },

  /** Salva dados do próprio usuário na base (sobrevive ao recarregar a página). */
  salvarDadosUsuario(campos) {
    if (!this.usuario) return false;
    const res = window.UsuariosAPI?.atualizarDados(this.usuario.id, campos);
    if (!res || !res.body.success) {
      this.toast(res?.body?.error || 'Não foi possível salvar os dados.', 'warning');
      return false;
    }
    this.usuario = { ...this.usuario, ...res.body.user };
    this.applyUsuario();
    window.AuditoriaService?.registrar({
      usuario: this.usuario.nome,
      acao: 'Dados cadastrais atualizados',
      tipo: 'Informação',
      modulo: 'PERFIL',
      descricao: `Campos enviados: ${Object.keys(campos).filter(k => campos[k] !== undefined && k !== 'avatarUrl').join(', ') || 'foto de perfil'}.`
    });
    return true;
  },

  // ==========================================================================
  // Dados das telas: a API é a fonte da verdade
  // ==========================================================================
  /**
   * Copia as listas atuais das APIs para this.data antes de desenhar a tela.
   * Antes, cada tela usava uma cópia carregada de json/*.json que só era
   * sincronizada com a API depois de alguma ação — o dashboard, por exemplo,
   * mostrava agendamentos antigos e contadores zerados.
   */
  sincronizarDados(pageId) {
    const garantir = id => {
      if (!this.data[id] || typeof this.data[id] !== 'object') this.data[id] = {};
      if (!this.data[id].boxes) this.data[id].boxes = {};
      return this.data[id].boxes;
    };
    const precisa = ids => ids.includes(pageId);

    if (precisa(['agendamentos', 'dashboard']) && window.AgendamentosAPI) {
      garantir('agendamentos').lista = window.AgendamentosAPI.getAll();
    }
    if (precisa(['consultas', 'dashboard']) && window.ConsultasAPI) {
      garantir('consultas').consultas = window.ConsultasAPI.getAll();
    }
    if (precisa(['exames', 'dashboard']) && window.ExamesAPI) {
      garantir('exames').lista = window.ExamesAPI.getAll();
    }
    if (pageId === 'logs' && window.AuditoriaService) {
      const registros = window.AuditoriaService.getAll();
      const b = garantir('logs');
      b.registros = registros;
      b.lista = registros;
    }
    if (precisa(['vacinacao', 'dashboard']) && window.VacinacaoAPI) {
      const base = this.data.vacinacao || {};
      this.data.vacinacao = { ...base, ...window.VacinacaoAPI.obterDadosTela() };
    }
  },

  recomputeAgendamentosStats(pageData) {
    if (!pageData?.boxes) return;
    const lista = pageData.boxes.lista || [];
    const total = lista.length;
    const conta = st => lista.filter(a => a.status === st).length;
    const confirmados = conta('Confirmado');
    const pendentes = conta('Pendente') + conta('Remarcado');
    const cancelados = conta('Cancelado');
    const pct = n => total > 0 ? `${((n / total) * 100).toFixed(1)}% do total` : 'Sem registros';

    pageData.boxes.stats = [
      { label: 'Total de agendamentos', icon: '📅', iconClass: 'ic-blue', value: String(total), note: 'Registrados no sistema', noteClass: 'note-muted' },
      { label: 'Confirmados', icon: '✅', iconClass: 'ic-green', value: String(confirmados), note: pct(confirmados), noteClass: 'note-green' },
      { label: 'Aguardando confirmação', icon: '⏳', iconClass: 'ic-yellow', value: String(pendentes), note: 'Pendentes e remarcados', noteClass: 'note-orange' },
      { label: 'Cancelados', icon: '✖', iconClass: 'ic-red', value: String(cancelados), note: pct(cancelados), noteClass: 'note-red' }
    ];
  },

  recomputeConsultasStats(pageData) {
    if (!pageData?.boxes) return;
    const ind = window.ConsultasAPI?.getIndicadores().indicadores;
    const lista = pageData.boxes.consultas || [];
    const conta = st => lista.filter(c => c.status === st).length;
    const agendadas = ind ? ind.agendadas : conta('Agendada');
    const canceladas = ind ? ind.canceladas : conta('Cancelada');
    const andamento = ind ? ind.emAndamento : conta('Em Andamento');
    const espera = ind ? ind.tempoMedioEspera : '—';

    pageData.boxes.stats = [
      { label: 'Agendadas', icon: '📅', iconClass: 'ic-blue', value: String(agendadas), note: 'Consultas futuras', noteClass: 'note-muted' },
      { label: 'Em andamento', icon: '🩺', iconClass: 'ic-teal', value: String(andamento), note: 'Atendimentos agora', noteClass: 'note-green' },
      { label: 'Tempo médio de espera', icon: '⏱', iconClass: 'ic-purple', value: espera, note: 'Fila de atendimento', noteClass: 'note-orange' },
      { label: 'Canceladas', icon: '✖', iconClass: 'ic-red', value: String(canceladas), note: 'Cancelamentos', noteClass: 'note-red' }
    ];
  },

  recomputeExamesStats(pageData, filtros) {
    if (!pageData?.boxes) return;
    const ind = window.ExamesAPI
      ? window.ExamesAPI.getIndicadores(filtros)
      : { solicitados: 0, emAndamento: 0, concluidos: 0, atrasados: 0 };

    pageData.boxes.stats = [
      { label: 'Solicitados', icon: '🔬', iconClass: 'ic-blue', value: String(ind.solicitados), note: 'Novos pedidos', noteClass: 'note-muted' },
      { label: 'Em andamento', icon: '🧪', iconClass: 'ic-orange', value: String(ind.emAndamento), note: 'Em análise no laboratório', noteClass: 'note-orange' },
      { label: 'Concluídos', icon: '✔', iconClass: 'ic-green', value: String(ind.concluidos), note: 'Laudos prontos', noteClass: 'note-green' },
      { label: 'Atrasados', icon: '⚠', iconClass: 'ic-red', value: String(ind.atrasados), note: 'Prazo previsto expirado', noteClass: 'note-red' }
    ];
  },

  recomputeDashboardStats() {
    const dash = this.data.dashboard;
    if (!dash?.boxes) return;

    const cidadaos = this.initUsuariosDB().filter(u => Util.ehCidadao(u)).length;
    const agLista = this.data.agendamentos?.boxes?.lista || [];
    const ativos = agLista.filter(a => a.status !== 'Cancelado');
    const pendentes = agLista.filter(a => a.status === 'Pendente' || a.status === 'Remarcado').length;
    const confirmados = agLista.filter(a => a.status === 'Confirmado').length;
    const indEx = window.ExamesAPI?.getIndicadores() || { solicitados: 0, emAndamento: 0, atrasados: 0 };
    const examesPendentes = indEx.solicitados + indEx.emAndamento + indEx.atrasados;
    const taxa = ativos.length > 0 ? Number(((confirmados / ativos.length) * 100).toFixed(1)) : 0;

    dash.boxes.stats = [
      { label: 'Cidadãos cadastrados', icon: '👥', iconClass: 'ic-blue', value: String(cidadaos), note: 'Com acesso ao autoatendimento', noteClass: 'note-muted' },
      { label: 'Agendamentos ativos', icon: '📅', iconClass: 'ic-teal', value: String(ativos.length), note: `${pendentes} aguardando confirmação`, noteClass: pendentes ? 'note-orange' : 'note-muted' },
      { label: 'Exames pendentes', icon: '🔬', iconClass: 'ic-orange', value: String(examesPendentes), note: `${indEx.atrasados} com prazo expirado`, noteClass: indEx.atrasados ? 'note-red' : 'note-muted' },
      { label: 'Taxa de confirmação', icon: '📈', iconClass: 'ic-green', value: `${taxa}%`, bar: taxa, barClass: 'bar-green', note: 'Confirmados / agendamentos ativos', noteClass: 'note-muted' }
    ];
  },

  recomputeLogsStats(pageData, filtros) {
    if (!pageData?.boxes) return;
    const ind = window.AuditoriaService
      ? window.AuditoriaService.getIndicadores(filtros)
      : { total: 0, erros: 0, avisos: 0, acessos: 0 };

    pageData.boxes.stats = [
      { label: 'Total de registros', icon: '📝', iconClass: 'ic-blue', value: String(ind.total), note: 'Trilha de auditoria', noteClass: 'note-muted' },
      { label: 'Erros', icon: '🚨', iconClass: 'ic-red', value: String(ind.erros), note: 'Falhas e exceções', noteClass: 'note-red' },
      { label: 'Avisos', icon: '⚠', iconClass: 'ic-yellow', value: String(ind.avisos), note: 'Alertas de segurança', noteClass: 'note-orange' },
      { label: 'Acessos', icon: '🔑', iconClass: 'ic-green', value: String(ind.acessos), note: 'Logins e autenticações', noteClass: 'note-green' }
    ];
  },

  recomputeUnidadesStats(pageData) {
    if (!pageData?.boxes) return;
    const lista = pageData.boxes.lista || [];
    if (!Array.isArray(lista) || lista.length === 0) return;
    const operacionais = lista.filter(u => u.status === 'Operacional').length;
    const paradas = lista.filter(u => u.status === 'Manutenção' || u.status === 'Inativa').length;
    // Antes "Capacidade Total" era o texto fixo "12.5k". Agora soma os leitos
    // informados pelas unidades em funcionamento (ex.: "500 leitos").
    const leitos = lista
      .filter(u => /leito/i.test(u.capacidade || '') && u.status === 'Operacional')
      .reduce((s, u) => s + (parseInt(String(u.capacidade).replace(/\D/g, ''), 10) || 0), 0);

    pageData.boxes.stats = [
      { label: 'Total de unidades', icon: '🏥', iconClass: 'ic-blue', value: String(lista.length), note: 'Unidades cadastradas', noteClass: 'note-muted' },
      { label: 'Operacionais', icon: '✅', iconClass: 'ic-green', value: String(operacionais), note: 'Funcionando normalmente', noteClass: 'note-green' },
      { label: 'Em manutenção / inativas', icon: '🔧', iconClass: 'ic-orange', value: String(paradas), note: 'Temporariamente indisponíveis', noteClass: 'note-orange' },
      { label: 'Leitos disponíveis', icon: '🛏', iconClass: 'ic-purple', value: leitos.toLocaleString('pt-BR'), note: 'Em unidades operacionais', noteClass: 'note-muted' }
    ];
  },

  recomputeVacinacaoStats(filtros = {}) {
    if (window.VacinacaoAPI) {
      const base = this.data.vacinacao || {};
      this.data.vacinacao = { ...base, ...window.VacinacaoAPI.obterDadosTela(filtros) };
    }
  },

  refreshStats(pageId) {
    try {
      const mapa = {
        agendamentos: () => this.recomputeAgendamentosStats(this.data.agendamentos),
        consultas: () => this.recomputeConsultasStats(this.data.consultas),
        exames: () => this.recomputeExamesStats(this.data.exames),
        vacinacao: () => this.recomputeVacinacaoStats(),
        unidades: () => this.recomputeUnidadesStats(this.data.unidades),
        logs: () => this.recomputeLogsStats(this.data.logs),
        dashboard: () => this.recomputeDashboardStats()
      };
      mapa[pageId]?.();
    } catch (err) {
      console.error('Erro ao recalcular estatísticas de', pageId, err);
    }
  },

  /**
   * Log de auditoria a partir de qualquer módulo. Antes este método também
   * inseria o mesmo registro numa segunda lista em memória — os logs
   * apareciam duplicados na tela até o próximo recarregamento.
   */
  addLog(tipo, titulo, meta, modulo) {
    const moduloDoTexto = String(meta || '').match(/Módulo:\s*([^·]+)/)?.[1]?.trim();
    window.AuditoriaService?.registrar({
      usuario: this.usuario ? this.usuario.nome : 'sistema',
      acao: titulo,
      tipo,
      descricao: meta || titulo,
      modulo: modulo || moduloDoTexto || 'SISTEMA'
    });
    this.atualizarBadgeNotificacoes();
  },

  // ==========================================================================
  // Visão restrita do Cidadão (somente os próprios registros)
  // ==========================================================================
  pertenceAoCidadao(registro) {
    const u = this.usuario;
    if (!Util.ehCidadao(u)) return true;
    const cpfU = Util.somenteDigitos(u.cpf);
    const cpfR = Util.somenteDigitos(registro?.cpf);
    if (cpfU && cpfR) return cpfU === cpfR;
    const nome = s => String(s || '').trim().toLowerCase();
    return nome(registro?.paciente || registro?.cidadao) === nome(u.nome);
  },

  /** Devolve uma cópia de pageData só com os registros do Cidadão logado. */
  filtrarDadosParaCidadao(pageId, pageData) {
    if (!Util.ehCidadao(this.usuario) || !pageData?.boxes) return pageData;
    const clone = { ...pageData, boxes: { ...pageData.boxes } };
    const chave = pageId === 'consultas' ? 'consultas' : 'lista';
    if (['agendamentos', 'consultas', 'exames'].includes(pageId) && Array.isArray(clone.boxes[chave])) {
      clone.boxes[chave] = clone.boxes[chave].filter(r => this.pertenceAoCidadao(r));
    }
    return clone;
  },

  /** Lista que o usuário logado pode ver para a tela (base dos filtros). */
  listaVisivel(pageId) {
    const chave = pageId === 'consultas' ? 'consultas' : 'lista';
    const lista = this.data[pageId]?.boxes?.[chave] || [];
    return Util.ehCidadao(this.usuario) ? lista.filter(r => this.pertenceAoCidadao(r)) : lista;
  },

  // ==========================================================================
  // Navegação
  // ==========================================================================
  ICONES_MENU: {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    agendamentos: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    consultas: '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
    exames: '<path d="M9 3h6M10 3v6.5L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9.5V3"/><path d="M7 15h10"/>',
    vacinacao: '<path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6"/>',
    unidades: '<path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M10 9h4M12 7v4"/>',
    logs: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    relatorios: '<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V8M17 16v-3"/>',
    'cadastro-usuarios': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>'
  },

  buildSidebar() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav || !this.navegacao?.itens) return;
    const visiveis = window.Permissoes?.paginasVisiveis(this.usuario?.perfil) || [];
    const itens = this.navegacao.itens.filter(i => i.secao && visiveis.includes(i.id));
    const secoes = this.navegacao.secoes || [{ id: undefined, label: '' }];

    nav.innerHTML = secoes.map(secao => {
      const daSecao = itens.filter(i => i.secao === secao.id);
      if (!daSecao.length) return '';
      return `
        <div class="nav-section">
          ${secao.label ? `<div class="nav-section-title">${Util.esc(secao.label)}</div>` : ''}
          ${daSecao.map(item => `
            <a href="#${Util.esc(item.id)}" class="nav-item${item.id === this.currentPage ? ' active' : ''}" data-page="${Util.esc(item.id)}">
              <svg fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">${this.ICONES_MENU[item.id] || ''}</svg>
              <span>${Util.esc(item.label)}</span>
            </a>`).join('')}
        </div>`;
    }).join('');
  },

  bindNavigation() {
    document.addEventListener('click', e => {
      const alvoPagina = e.target.closest('[data-page]');
      if (alvoPagina && alvoPagina.dataset.page) {
        e.preventDefault();
        this.fecharMenus();
        this.goTo(alvoPagina.dataset.page);
        return;
      }

      const alvoNav = e.target.closest('[data-nav]');
      if (alvoNav && alvoNav.dataset.nav) {
        e.preventDefault();
        this.fecharMenus();
        const destino = alvoNav.dataset.nav === 'inicio'
          ? (window.Permissoes?.paginaInicial(this.usuario?.perfil) || 'dashboard')
          : alvoNav.dataset.nav;
        this.goTo(destino);
        return;
      }

      if (e.target.id === 'app-modal') this.closeModal();
      if (e.target.id === 'sidebar-backdrop') document.body.classList.remove('sidebar-aberta');

      const searchWrap = document.getElementById('search-wrap-container');
      if (searchWrap && !searchWrap.contains(e.target)) {
        const dropdown = document.getElementById('search-results-dropdown');
        if (dropdown) dropdown.hidden = true;
      }

      const userMenu = document.getElementById('user-menu-wrap');
      if (userMenu && !userMenu.contains(e.target)) this.toggleUserMenu(false);
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.fecharMenus();
      }
      // Atalho "/" ou Ctrl+K para a busca global
      const digitando = /input|textarea|select/i.test(document.activeElement?.tagName || '');
      if ((e.key === '/' && !digitando) || (String(e.key).toLowerCase() === 'k' && (e.ctrlKey || e.metaKey))) {
        const busca = document.getElementById('busca-global');
        if (busca && this.usuario) {
          e.preventDefault();
          busca.focus();
        }
      }
    });

    // Botões voltar/avançar do navegador
    window.addEventListener('hashchange', () => {
      const alvo = decodeURIComponent(location.hash.slice(1));
      if (this.usuario && alvo && alvo !== this.currentPage) this.goTo(alvo);
    });
  },

  fecharMenus() {
    const dropdown = document.getElementById('search-results-dropdown');
    if (dropdown) dropdown.hidden = true;
    this.toggleUserMenu(false);
    document.body.classList.remove('sidebar-aberta');
  },

  toggleUserMenu(abrir) {
    const menu = document.getElementById('user-dropdown-menu');
    const pill = document.getElementById('user-pill');
    if (!menu) return;
    const vaiAbrir = abrir ?? menu.hidden;
    menu.hidden = !vaiAbrir;
    pill?.setAttribute('aria-expanded', String(vaiAbrir));
  },

  bindGlobalActions() {
    document.getElementById('btn-sair')?.addEventListener('click', () => this.confirmarSaida());
    document.getElementById('dropdown-btn-sair')?.addEventListener('click', () => {
      this.toggleUserMenu(false);
      this.confirmarSaida();
    });
    document.getElementById('btn-header-notif')?.addEventListener('click', () => this.showNotificationsModal());
    document.getElementById('btn-menu-mobile')?.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-aberta');
    });
    document.getElementById('user-pill')?.addEventListener('click', e => {
      e.stopPropagation();
      this.toggleUserMenu();
    });

    const busca = document.getElementById('busca-global');
    if (busca) {
      let timer = null;
      busca.addEventListener('input', e => {
        clearTimeout(timer);
        timer = setTimeout(() => this.handleGlobalSearch(e.target.value.trim()), 120);
      });
      busca.addEventListener('focus', e => {
        if (e.target.value.trim()) this.handleGlobalSearch(e.target.value.trim());
      });
      busca.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          clearTimeout(timer);
          this.handleGlobalSearch(e.target.value.trim());
          document.querySelector('#search-results-dropdown [data-search-index]')?.click();
        }
      });
    }
  },

  confirmarSaida() {
    this.showModal({
      title: 'Encerrar sessão',
      bodyHtml: '<p class="modal-texto">Deseja realmente sair do sistema UPA 24H?</p>',
      confirmText: 'Sair do sistema',
      confirmVariant: 'danger',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        await this.sair();
        return true;
      }
    });
  },

  async goTo(pageId) {
    if (!this.checkLogin(pageId)) return;

    const token = window.AuthAPI?.getTokenLocal();
    const acesso = window.AuthAPI?.verificarAcesso(token, { pagina: pageId });
    if (acesso && !acesso.permitido) {
      if (acesso.status === 401) {
        await this.sair({ motivo: 'Sua sessão expirou. Entre novamente.', tipo: 'warning' });
        return;
      }
      window.AuditoriaService?.registrar({
        usuario: this.usuario?.nome || 'Usuário',
        acao: 'Tentativa de Acesso Negado',
        tipo: 'Aviso',
        modulo: 'SEGURANÇA',
        descricao: acesso.error || `Acesso negado à página "${pageId}".`
      });
      this.toast('Acesso negado: seu perfil não tem permissão para acessar esta área.', 'warning');
      const inicial = window.Permissoes?.paginaInicial(this.usuario?.perfil) || 'agendamentos';
      if (pageId !== inicial && this.currentPage !== inicial) return this.goTo(inicial);
      return;
    }

    const item = this.navegacao?.itens?.find(i => i.id === pageId);
    if (!item) return;

    const seq = ++this._navSeq;
    this.currentPage = pageId;
    const container = document.getElementById('screen-container');
    container.innerHTML = '<div class="loading-screen"><span class="spinner"></span>Carregando…</div>';
    document.querySelectorAll('#sidebar-slot .nav-item[data-page]').forEach(n => {
      const ativo = n.dataset.page === pageId;
      n.classList.toggle('active', ativo);
      if (ativo) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current');
    });

    try {
      if (!item._htmlCache) item._htmlCache = await this.fetchText(item.arquivo);
      const atual = this.data[pageId];
      if (!atual || typeof atual !== 'object' || 'success' in atual) {
        this.data[pageId] = await this.fetchJson(item.json);
      }
      // Uma navegação mais recente venceu a corrida (cliques rápidos): descarta esta.
      if (seq !== this._navSeq) return;

      this.sincronizarDados(pageId);
      this.refreshStats(pageId);
      const dados = this.filtrarDadosParaCidadao(pageId, this.data[pageId]);

      container.innerHTML = item._htmlCache;
      container.querySelector('.page')?.classList.add('active');
      document.title = `${item.label} · UPA 24H`;
      if (decodeURIComponent(location.hash.slice(1)) !== pageId) history.replaceState(null, '', `#${pageId}`);

      window.Render?.resetarPaginacao(pageId);
      window.Render?.renderPage(pageId, dados, this.usuario);
      this.bindControlesDaTela(pageId);
      this.atualizarBadgeNotificacoes();
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      if (seq === this._navSeq) {
        container.innerHTML = this.telaErro(`Não foi possível carregar a tela "${item.label}".`, err);
      }
    }
  },

  /** Ícone SVG monocromático (delegado ao Render, que mantém o catálogo). */
  icone(nome, tamanho) {
    return window.Render?.icone ? window.Render.icone(nome, tamanho) : '';
  },

  telaErro(mensagem, err) {
    return `<div class="estado-vazio estado-erro">
      <div class="estado-icone">${App.icone('alerta')}</div>
      <strong>${Util.esc(mensagem)}</strong>
      <span>${Util.esc(err?.message || '')}</span>
    </div>`;
  },

  // ==========================================================================
  // Modal, toast, busca e notificações
  // ==========================================================================
  showModal({ title, bodyHtml, confirmText = 'Salvar', cancelText = 'Cancelar', onConfirm = null, size = '', confirmVariant = 'primary' }) {
    const modal = document.getElementById('app-modal');
    if (!modal) return;
    if (!modal.classList.contains('active')) this._focoAntesDoModal = document.activeElement;
    modal.innerHTML = `
      <div class="modal-dialog ${size ? `modal-${size}` : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-titulo">${Util.esc(title)}</h3>
          <button class="modal-close" type="button" data-modal-fechar aria-label="Fechar">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        <div class="modal-footer">
          ${cancelText ? `<button class="btn btn-ghost" type="button" data-modal-fechar>${Util.esc(cancelText)}</button>` : ''}
          ${confirmText ? `<button class="btn btn-${confirmVariant}" id="modal-confirm-btn" type="button">${Util.esc(confirmText)}</button>` : ''}
        </div>
      </div>`;
    modal.classList.add('active');
    document.body.classList.add('modal-aberto');

    modal.querySelectorAll('[data-modal-fechar]').forEach(b => b.addEventListener('click', () => this.closeModal()));

    const confirmar = modal.querySelector('#modal-confirm-btn');
    if (onConfirm && confirmar) {
      // Trava o botão enquanto a ação roda: antes, dois cliques rápidos
      // criavam dois agendamentos/exames iguais.
      confirmar.addEventListener('click', async () => {
        if (confirmar.disabled) return;
        confirmar.disabled = true;
        confirmar.classList.add('carregando');
        try {
          const ok = await onConfirm();
          if (ok !== false) this.closeModal();
        } catch (err) {
          console.error(err);
          this.toast('Erro inesperado ao processar a ação.', 'danger');
        } finally {
          confirmar.disabled = false;
          confirmar.classList.remove('carregando');
        }
      });
    }

    // Enter num campo de formulário do modal = confirmar
    modal.querySelectorAll('form').forEach(f => f.addEventListener('submit', e => {
      e.preventDefault();
      confirmar?.click();
    }));

    setTimeout(() => {
      const primeiro = modal.querySelector('.modal-body input:not([readonly]):not([type=hidden]), .modal-body select, .modal-body textarea:not([readonly])');
      (primeiro || confirmar || modal.querySelector('.modal-close'))?.focus();
    }, 60);
  },

  closeModal() {
    const modal = document.getElementById('app-modal');
    if (!modal || !modal.classList.contains('active')) return;
    modal.classList.remove('active');
    document.body.classList.remove('modal-aberto');
    const foco = this._focoAntesDoModal;
    this._focoAntesDoModal = null;
    if (foco && document.contains(foco)) foco.focus?.();
  },

  toast(msg, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icones = { success: '✓', info: 'i', warning: '!', danger: '×' };
    const tipo = type === 'error' ? 'danger' : (icones[type] ? type : 'info');
    const el = document.createElement('div');
    el.className = `toast toast-${tipo}`;
    el.setAttribute('role', tipo === 'danger' || tipo === 'warning' ? 'alert' : 'status');
    el.innerHTML = `<span class="toast-ico">${icones[tipo]}</span><span class="toast-msg">${Util.esc(msg)}</span>`;
    container.appendChild(el);
    while (container.children.length > 4) container.firstElementChild.remove();
    setTimeout(() => {
      el.classList.add('saindo');
      setTimeout(() => el.remove(), 300);
    }, tipo === 'danger' ? 5200 : 3600);
  },

  /**
   * Busca global no cabeçalho. Antes ela pesquisava em TODOS os registros,
   * inclusive para o Cidadão (que via agendamentos e exames de outras
   * pessoas pela busca) e em módulos que o perfil não pode acessar.
   */
  handleGlobalSearch(query) {
    const dropdown = document.getElementById('search-results-dropdown');
    if (!dropdown) return;
    if (!query || query.length < 2 || !this.usuario) {
      dropdown.hidden = true;
      return;
    }

    const q = query.toLowerCase();
    const qDig = Util.somenteDigitos(query);
    const tem = (...campos) => campos.some(c => String(c || '').toLowerCase().includes(q)) ||
      (qDig.length >= 3 && campos.some(c => Util.somenteDigitos(c).includes(qDig)));
    const pode = id => window.Permissoes?.perfilPodeAcessarPagina(this.usuario.perfil, id);
    const resultados = [];

    // Atalhos para as telas
    (this.navegacao?.itens || []).forEach(i => {
      if (pode(i.id) && i.label.toLowerCase().includes(q)) {
        resultados.push({ titulo: i.label, sub: 'Ir para a tela', cat: 'Tela', acao: () => this.goTo(i.id) });
      }
    });
    if (pode('agendamentos') && window.AgendamentosAPI) {
      window.AgendamentosAPI.getAll().filter(i => this.pertenceAoCidadao(i)).forEach(i => {
        if (tem(i.paciente, i.cpf, i.especialidade, i.id, i.medico)) {
          resultados.push({ titulo: i.paciente, sub: `${i.especialidade} · ${i.data} ${i.horario}`, cat: 'Agendamento', acao: () => this.showAgendamentoModal(i) });
        }
      });
    }
    if (pode('consultas') && window.ConsultasAPI) {
      window.ConsultasAPI.getAll().filter(i => this.pertenceAoCidadao(i)).forEach(i => {
        if (tem(i.paciente, i.medico, i.especialidade, i.cid)) {
          resultados.push({ titulo: i.paciente, sub: `${i.especialidade} · ${i.status}`, cat: 'Consulta', acao: () => this.showConsultaModal(i.id) });
        }
      });
    }
    if (pode('exames') && window.ExamesAPI) {
      window.ExamesAPI.getAll().filter(i => this.pertenceAoCidadao(i)).forEach(i => {
        if (tem(i.paciente, i.tipo, i.id, i.cpf)) {
          resultados.push({ titulo: i.paciente, sub: `${i.tipo} · ${i.status}`, cat: 'Exame', acao: () => this.showExameModal(i.id) });
        }
      });
    }
    if (pode('unidades')) {
      (this.data.unidades?.boxes?.lista || this.fallbacks['json/unidades.json']?.boxes?.lista || []).forEach(i => {
        if (tem(i.nome, i.endereco, i.tipo)) {
          resultados.push({ titulo: i.nome, sub: `${i.tipo} · ${i.endereco}`, cat: 'Unidade', acao: () => this.showUnidadeModal(i.id) });
        }
      });
    }

    if (resultados.length === 0) {
      dropdown.innerHTML = `<div class="search-empty">Nenhum resultado para “${Util.esc(query)}”.</div>`;
    } else {
      dropdown.innerHTML = resultados.slice(0, 8).map((r, i) => `
        <button type="button" class="search-result-item" data-search-index="${i}">
          <span class="search-result-text">
            <strong>${Util.esc(r.titulo)}</strong>
            <small>${Util.esc(r.sub)}</small>
          </span>
          <span class="search-result-category">${Util.esc(r.cat)}</span>
        </button>`).join('');
      dropdown.querySelectorAll('[data-search-index]').forEach(el => {
        el.addEventListener('click', () => {
          dropdown.hidden = true;
          resultados[Number(el.dataset.searchIndex)]?.acao();
        });
      });
    }
    dropdown.hidden = false;
  },

  alertasAtivos() {
    if (!this.usuario) return [];
    const pode = id => window.Permissoes?.perfilPodeAcessarPagina(this.usuario.perfil, id);
    const alertas = [];
    if (pode('vacinacao') && window.VacinacaoAPI?.listarAlertas) {
      alertas.push(...window.VacinacaoAPI.listarAlertas().data);
    }
    if (pode('exames') && window.ExamesAPI) {
      const atrasados = window.ExamesAPI.getAll().filter(e => this.pertenceAoCidadao(e) && window.ExamesAPI.isAtrasado(e));
      if (atrasados.length) {
        alertas.push({
          nivel: 'atencao',
          titulo: `${atrasados.length} exame(s) com prazo de resultado expirado`,
          descricao: atrasados.slice(0, 3).map(e => `${e.tipo} — ${e.paciente}`).join(' · ')
        });
      }
    }
    return alertas;
  },

  atualizarBadgeNotificacoes() {
    const dot = document.querySelector('#btn-header-notif .notif-dot');
    if (!dot) return;
    const n = this.alertasAtivos().length;
    dot.textContent = n > 9 ? '9+' : String(n);
    dot.hidden = n === 0;
  },

  showNotificationsModal() {
    const alertas = this.alertasAtivos();
    const itens = alertas.map(a => `
      <div class="notif-item nivel-${a.nivel === 'critico' ? 'critico' : 'atencao'}">
        <div class="notif-ico">${this.icone('alerta', 18)}</div>
        <div>
          <strong>${Util.esc(a.titulo)}</strong>
          <p>${Util.esc(a.descricao || a.mensagem || '')}</p>
        </div>
      </div>`).join('');

    this.showModal({
      title: 'Notificações',
      bodyHtml: `<div class="notif-lista">${itens || `<div class="estado-vazio"><div class="estado-icone">${this.icone('sino')}</div><strong>Tudo em dia</strong><span>Nenhum alerta ativo no momento.</span></div>`}</div>`,
      confirmText: null,
      cancelText: 'Fechar'
    });
  },

  // ==========================================================================
  // Ações das telas
  // ==========================================================================
  /**
   * Delegação de cliques para os botões [data-action] das tabelas.
   * Registrada UMA vez no init. Antes, bindPageActions() adicionava um novo
   * listener no container a cada navegação: depois de abrir 5 telas, um clique
   * em "Confirmar" disparava 5 confirmações (e 5 downloads, 5 modais...).
   */
  bindAcoesDasTelas() {
    const root = document.getElementById('screen-container');
    if (!root) return;
    root.addEventListener('click', e => {
      const el = e.target.closest('[data-action]');
      if (!el || !root.contains(el)) return;
      e.preventDefault();
      this.executarAcao(el.dataset.action, el.dataset);
    });
  },

  async executarAcao(acao, ds) {
    const id = ds.id;
    const podeGerenciar = window.Permissoes?.podeGerenciarAtendimentos(this.usuario?.perfil);
    const buscarAg = () => window.AgendamentosAPI?.getAll().find(a => a.id === id);
    const buscarEx = () => window.ExamesAPI?.getAll().find(e => e.id === id);

    switch (acao) {
      case 'view-agendamento':
      case 'click-atendimento': {
        const item = buscarAg();
        if (item && this.pertenceAoCidadao(item)) this.showAgendamentoModal(item);
        break;
      }
      case 'edit-agendamento': {
        const item = buscarAg();
        // Alterar é exclusivo da Recepção / Administrador (o Cidadão só aceita ou recusa)
        if (item && podeGerenciar) this.showEditarAgendamentoModal(item);
        break;
      }
      case 'cancel-agendamento': {
        const item = buscarAg();
        if (item && (podeGerenciar || (Util.ehCidadao(this.usuario) && this.pertenceAoCidadao(item)))) this.showCancelarAgendamentoModal(item);
        break;
      }
      case 'confirm-agendamento': {
        const item = buscarAg();
        if (!item || !(podeGerenciar || (Util.ehCidadao(this.usuario) && this.pertenceAoCidadao(item)))) break;
        const res = await window.AgendamentosAPI.confirmar(id, this.usuario?.nome);
        const msgOk = Util.ehCidadao(this.usuario) ? `Agendamento ${id} aceito.` : res.body?.message;
        this.toast(res.body?.success ? msgOk : res.body?.error, res.body?.success ? 'success' : 'warning');
        this.goTo(this.currentPage);
        break;
      }
      case 'view-agenda-medico':
        this.showAgendaMedicoModal(ds.medico);
        break;
      case 'view-consulta':
        this.showConsultaModal(id || ds.paciente);
        break;
      case 'view-exame':
        this.showExameModal(id);
        break;
      case 'edit-exame': {
        const item = buscarEx();
        if (item && podeGerenciar) this.showEditarExameModal(item);
        break;
      }
      case 'historico-exames':
        this.showHistoricoExamesModal(ds.cpf || ds.paciente || id);
        break;
      case 'laudo-exame':
        this.showLaudoExameModal(id);
        break;
      case 'download-exame':
        this.baixarLaudo(id);
        break;
      case 'view-unidade':
      case 'edit-unidade':
        this.showUnidadeModal(id);
        break;
      case 'view-log':
        this.showLogModal(id);
        break;
      default:
        break;
    }
  },

  /** Gera o arquivo do laudo com os dados reais do exame. */
  baixarLaudo(id) {
    const exame = window.ExamesAPI?.getAll().find(e => e.id === id);
    if (!exame || !this.pertenceAoCidadao(exame)) {
      this.toast('Exame não encontrado.', 'warning');
      return;
    }
    const linha = '='.repeat(56);
    const conteudo = [
      linha,
      'UPA 24H - SAÚDE PÚBLICA DIGITAL',
      'LAUDO DE EXAME',
      linha,
      `Exame:            ${exame.id} — ${exame.tipo}`,
      `Cidadão:          ${exame.paciente}${exame.cpf ? ` (CPF ${exame.cpf})` : ''}`,
      `Data do exame:    ${exame.data}${exame.horario ? ` às ${exame.horario}` : ''}`,
      `Unidade:          ${exame.unidade || '—'}`,
      `Solicitante:      ${exame.solicitante || '—'}`,
      `Emitido por:      ${exame.laudoEmitidoPor || '—'}`,
      `Emitido em:       ${exame.laudoEmitidoEm ? new Date(exame.laudoEmitidoEm).toLocaleString('pt-BR') : '—'}`,
      '',
      'PARECER:',
      exame.laudo || 'Laudo registrado no sistema sem parecer descritivo.',
      '',
      linha,
      'Documento gerado eletronicamente pelo sistema UPA 24H.',
      linha
    ].join('\r\n');
    Util.baixarArquivo(`Laudo_${String(exame.id).replace(/[^\w-]/g, '')}.txt`, conteudo);
    this.toast(`Laudo ${exame.id} baixado.`, 'success');
  },

  /** Liga os controles (botões, filtros) da tela recém-desenhada. */
  bindControlesDaTela(pageId) {
    const root = document.getElementById('screen-container');
    if (!root) return;
    const $ = sel => root.querySelector(sel);
    const ligar = (sel, fn) => { const el = $(sel); if (el) el.onclick = fn; };

    /** Liga um conjunto de filtros: digitar/selecionar já filtra. */
    const ligarFiltros = (ids, executar, idLimpar) => {
      const campos = ids.map(i => $(i)).filter(Boolean);
      let timer = null;
      campos.forEach(c => {
        const evento = c.tagName === 'SELECT' || c.type === 'date' ? 'change' : 'input';
        c.addEventListener(evento, () => {
          clearTimeout(timer);
          timer = setTimeout(executar, evento === 'input' ? 160 : 0);
        });
      });
      const limpar = $(idLimpar);
      if (limpar) limpar.onclick = () => { campos.forEach(c => { c.value = ''; }); executar(); };
    };

    if (pageId === 'dashboard') {
      ligar('#btn-dash-agendar', () => this.showNovoAgendamentoModal());
    }

    if (pageId === 'agendamentos') {
      ligar('#btn-novo-agendamento', () => this.showNovoAgendamentoModal());
      ligar('#btn-exportar-agendamentos', () => this.exportTableToCSV('agendamentos'));
      const filtrar = () => {
        const q = ($('#filter-agendamentos-busca')?.value || '').trim().toLowerCase();
        const st = $('#filter-agendamentos-status')?.value || '';
        const un = $('#filter-agendamentos-unidade')?.value || '';
        const esp = $('#filter-agendamentos-especialidade')?.value || '';
        const ini = $('#filter-agendamentos-data-inicio')?.value || '';
        const fim = $('#filter-agendamentos-data-fim')?.value || '';
        const parse = window.AgendamentosAPI?.parseDataHora;
        const dIni = ini && parse ? parse(ini, '00:00') : null;
        const dFim = fim && parse ? parse(fim, '23:59') : null;

        const lista = this.listaVisivel('agendamentos').filter(i => {
          if (q && !(`${i.paciente} ${i.cpf} ${i.id}`.toLowerCase().includes(q))) return false;
          if (st && i.status !== st) return false;
          if (un && i.unidade !== un) return false;
          if (esp && i.especialidade !== esp) return false;
          if (dIni || dFim) {
            const d = parse(i.data, i.horario);
            if (d && dIni && d < dIni) return false;
            if (d && dFim && d > dFim) return false;
          }
          return true;
        });
        Render.resetarPaginacao('agendamentos');
        Render.renderAgendamentos(root, { boxes: { ...this.data.agendamentos.boxes, lista } });
      };
      ligarFiltros(['#filter-agendamentos-busca', '#filter-agendamentos-status', '#filter-agendamentos-unidade',
        '#filter-agendamentos-especialidade', '#filter-agendamentos-data-inicio', '#filter-agendamentos-data-fim'],
      filtrar, '#btn-limpar-agendamentos');
    }

    if (pageId === 'consultas') {
      ligar('#btn-nova-consulta', () => this.showNovaConsultaModal());
      ligar('#btn-ver-agenda-medico', () => {
        const med = $('#filter-consultas-medico')?.value ||
          (perfilProfissional(this.usuario) ? this.usuario.nome : 'Dr. Manoel Joaquim');
        this.showAgendaMedicoModal(med);
      });
      const filtrar = () => {
        const med = ($('#filter-consultas-medico')?.value || '').toLowerCase();
        const esp = ($('#filter-consultas-especialidade')?.value || '').toLowerCase();
        const st = ($('#filter-consultas-status')?.value || '').toLowerCase();
        const q = ($('#filter-consultas-busca')?.value || '').trim().toLowerCase();
        const lista = this.listaVisivel('consultas').filter(c =>
          (!med || String(c.medico || '').toLowerCase().includes(med)) &&
          (!esp || String(c.especialidade || '').toLowerCase() === esp) &&
          (!st || String(c.status || '').toLowerCase() === st) &&
          (!q || `${c.paciente} ${c.cid} ${c.id}`.toLowerCase().includes(q))
        );
        Render.resetarPaginacao('consultas');
        Render.renderConsultas(root, { boxes: { ...this.data.consultas.boxes, consultas: lista } });
      };
      ligarFiltros(['#filter-consultas-busca', '#filter-consultas-medico', '#filter-consultas-especialidade', '#filter-consultas-status'],
        filtrar, '#btn-limpar-consultas');
    }

    if (pageId === 'exames') {
      ligar('#btn-solicitar-exame', () => this.showSolicitarExameModal());
      ligar('#btn-exportar-exames', () => this.exportTableToCSV('exames'));
      const filtrar = () => {
        const filtros = {
          busca: ($('#filter-exames-busca')?.value || '').trim(),
          status: $('#filter-exames-status')?.value || '',
          dataInicio: $('#filter-exames-data-inicio')?.value || '',
          dataFim: $('#filter-exames-data-fim')?.value || ''
        };
        const lista = Array.from(window.ExamesAPI.listar(filtros)).filter(r => this.pertenceAoCidadao(r));
        if (!Util.ehCidadao(this.usuario)) {
          this.recomputeExamesStats(this.data.exames, filtros);
          Render.renderStats($('[data-box="stats"]'), this.data.exames.boxes.stats);
        }
        Render.resetarPaginacao('exames');
        Render.renderExames(root, { boxes: { ...this.data.exames.boxes, lista } });
      };
      ligarFiltros(['#filter-exames-busca', '#filter-exames-status', '#filter-exames-data-inicio', '#filter-exames-data-fim'],
        filtrar, '#btn-limpar-exames');
    }

    if (pageId === 'vacinacao') {
      ligar('#btn-registrar-vacinacao', () => this.showRegistrarVacinaModal());
      ligar('#btn-entrada-estoque-vacina', () => this.showEntradaEstoqueVacinaModal());
      const filtrar = () => {
        Render.resetarPaginacao('vacinacao');
        Render.renderVacinacao(root, this.data.vacinacao);
      };
      ligarFiltros(['#filter-vacinacao-busca', '#filter-vacinacao-vacina', '#filter-vacinacao-unidade',
        '#filter-vacinacao-data-inicio', '#filter-vacinacao-data-fim'], filtrar, '#btn-limpar-vacinacao');
    }

    if (pageId === 'unidades') {
      ligar('#btn-novo-chamado', () => this.showNovoChamadoModal());
      ligar('#btn-relatorio-insumos-unidades', () => this.showRelatorioInsumosModal());
      const filtrar = () => {
        const q = ($('#filter-unidades-busca')?.value || '').trim().toLowerCase();
        const tp = $('#filter-unidades-tipo')?.value || '';
        const st = $('#filter-unidades-status')?.value || '';
        const lista = (this.data.unidades?.boxes?.lista || []).filter(u =>
          (!q || `${u.nome} ${u.endereco}`.toLowerCase().includes(q)) &&
          (!tp || u.tipo === tp) &&
          (!st || u.status === st)
        );
        Render.resetarPaginacao('unidades');
        Render.renderUnidades(root, { boxes: { ...this.data.unidades.boxes, lista } });
      };
      ligarFiltros(['#filter-unidades-busca', '#filter-unidades-tipo', '#filter-unidades-status'], filtrar, '#btn-limpar-unidades');
    }

    if (pageId === 'relatorios') {
      this.configurarRelatorios(root);
    }

    if (pageId === 'logs') {
      ligar('#btn-exportar-logs', () => this.exportTableToCSV('logs'));
      const filtrar = () => {
        const filtros = {
          tipo: $('#filter-logs-tipo')?.value || '',
          usuario: ($('#filter-logs-usuario')?.value || '').trim(),
          dataInicio: $('#filter-logs-data-inicio')?.value || '',
          dataFim: $('#filter-logs-data-fim')?.value || '',
          busca: ($('#filter-logs-busca')?.value || '').trim()
        };
        const lista = Array.from(window.AuditoriaService.listar(filtros));
        this.recomputeLogsStats(this.data.logs, filtros);
        Render.renderStats($('[data-box="stats"]'), this.data.logs.boxes.stats);
        Render.resetarPaginacao('logs');
        Render.renderLogs(root, { boxes: { ...this.data.logs.boxes, registros: lista, lista } });
      };
      ligarFiltros(['#filter-logs-tipo', '#filter-logs-usuario', '#filter-logs-data-inicio', '#filter-logs-data-fim', '#filter-logs-busca'],
        filtrar, '#btn-limpar-logs');
    }

    if (pageId === 'configuracoes') {
      ligar('#btn-salvar-config', () => {
        const visivel = sel => $(sel) && !$(sel).closest('.config-field')?.hidden;
        const ok = this.salvarDadosUsuario({
          nome: $('#cfg-nome')?.value,
          email: $('#cfg-email')?.value,
          cargo: visivel('#cfg-cargo') ? $('#cfg-cargo').value : undefined,
          unidade: visivel('#cfg-unidade') ? $('#cfg-unidade').value : undefined,
          telefone: $('#cfg-telefone')?.value
        });
        if (!ok) return;

        const notificacoes = {};
        root.querySelectorAll('[data-notif]').forEach(cb => { notificacoes[cb.dataset.notif] = cb.checked; });
        const timeout = Math.min(240, Math.max(0, parseInt($('#cfg-timeout')?.value, 10) || 0));
        this.settings = {
          ...this.settings,
          notificacoes: { ...this.settings.notificacoes, ...notificacoes },
          itensPorPagina: parseInt($('#cfg-itens')?.value, 10) || this.settings.itensPorPagina,
          sessaoTimeoutMin: timeout
        };
        this.applySettings();
        this.saveState();
        this.toast('Configurações salvas com sucesso!', 'success');
      });
    }

    if (pageId === 'perfil') {
      const salvarPerfil = () => {
        const visivel = sel => $(sel) && !$(sel).closest('.config-field')?.hidden;
        const ok = this.salvarDadosUsuario({
          nome: $('#perfil-edit-nome')?.value,
          email: $('#perfil-edit-email')?.value,
          cargo: visivel('#perfil-edit-cargo') ? $('#perfil-edit-cargo').value : undefined,
          unidade: visivel('#perfil-edit-unidade') ? $('#perfil-edit-unidade').value : undefined,
          telefone: $('#perfil-edit-telefone')?.value
        });
        if (ok) {
          Render.renderPerfil(root, this.usuario);
          this.toast('Perfil atualizado com sucesso!', 'success');
        }
      };
      ligar('#btn-salvar-perfil', salvarPerfil);
      ligar('#btn-alterar-foto', () => $('#input-foto-avatar')?.click());
      const inputFoto = $('#input-foto-avatar');
      if (inputFoto) inputFoto.onchange = e => this.atualizarFoto(e.target.files[0]);
      ligar('#btn-alterar-senha', () => this.alterarSenha(root));
    }
  },

  /**
   * Reduz a foto para 160×160 antes de salvar. Antes a imagem original era
   * gravada em base64 no localStorage — uma foto de celular (3–5 MB) estourava
   * a cota de armazenamento e a gravação falhava.
   */
  atualizarFoto(arquivo) {
    if (!arquivo) return;
    if (!/^image\//.test(arquivo.type)) {
      this.toast('Selecione um arquivo de imagem.', 'warning');
      return;
    }
    const leitor = new FileReader();
    leitor.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const lado = 160;
        const canvas = document.createElement('canvas');
        canvas.width = lado;
        canvas.height = lado;
        const ctx = canvas.getContext('2d');
        const menor = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - menor) / 2, (img.height - menor) / 2, menor, menor, 0, 0, lado, lado);
        if (this.salvarDadosUsuario({ avatarUrl: canvas.toDataURL('image/jpeg', 0.85) })) {
          this.toast('Foto de perfil atualizada!', 'success');
        }
      };
      img.onerror = () => this.toast('Não foi possível ler a imagem.', 'warning');
      img.src = ev.target.result;
    };
    leitor.readAsDataURL(arquivo);
  },

  /**
   * Máscara de CPF + busca do cidadão cadastrado, usada por todos os
   * formulários de atendimento (antes, o mesmo código estava copiado em 4
   * modais, cada um com uma regra ligeiramente diferente de perfil).
   */
  ligarBuscaCidadao(inputCpf, { aoEncontrar, aoLimpar, avisar = true } = {}) {
    if (!inputCpf) return;
    inputCpf.addEventListener('input', e => {
      e.target.value = Util.mascararCPF(e.target.value);
      const limpo = Util.somenteDigitos(e.target.value);
      if (limpo.length !== 11) { aoLimpar?.(false); return; }
      const cidadao = this.initUsuariosDB().find(u => Util.ehCidadao(u) && Util.somenteDigitos(u.cpf) === limpo);
      if (cidadao) {
        aoEncontrar?.(cidadao);
        if (avisar) this.toast(`Cidadão localizado: ${cidadao.nome}`, 'success');
      } else {
        aoLimpar?.(true);
        if (avisar) this.toast('Nenhum cidadão cadastrado com este CPF.', 'warning');
      }
    });
  },

  async alterarSenha(root) {
    const atual = root.querySelector('#senha-atual')?.value || '';
    const nova = root.querySelector('#senha-nova')?.value || '';
    const confirma = root.querySelector('#senha-confirma')?.value || '';
    if (!atual || !nova) return this.toast('Preencha a senha atual e a nova senha.', 'warning');
    if (nova.length < 6) return this.toast('A nova senha deve ter pelo menos 6 caracteres.', 'warning');
    if (nova !== confirma) return this.toast('A confirmação não confere com a nova senha.', 'warning');

    const registro = this.initUsuariosDB().find(u => u.id === this.usuario?.id);
    const ok = registro && await window.Crypto.verificarSenha(atual, registro.senha);
    if (!ok) return this.toast('Senha atual incorreta.', 'danger');

    window.UsuariosAPI.atualizarSenha(registro.id, await window.Crypto.hashSenha(nova));
    window.AuditoriaService?.registrar({
      usuario: this.usuario.nome,
      acao: 'Senha alterada',
      tipo: 'Acesso',
      modulo: 'AUTH',
      descricao: 'Usuário alterou a própria senha de acesso.'
    });
    ['#senha-atual', '#senha-nova', '#senha-confirma'].forEach(s => { const el = root.querySelector(s); if (el) el.value = ''; });
    this.toast('Senha alterada com sucesso!', 'success');
  }
};

function perfilProfissional(usuario) {
  return window.Permissoes?.normalizarPerfil(usuario?.perfil) === 'Profissional da Saúde';
}

// `App` é declarado com `const`, então não vira propriedade de `window`
// sozinho. render.js e as APIs usam `window.App` para toasts e checagens.
window.App = App;

document.addEventListener('DOMContentLoaded', () => App.init());
