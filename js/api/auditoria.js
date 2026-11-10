/**
 * ============================================================================
 * AuditoriaService — Serviço Central de Auditoria e Logs do Sistema UPA 24H.
 * ============================================================================
 *
 * Registra eventos e ações relevantes de todo o sistema:
 *   - Login, logout e tentativas de autenticação
 *   - Solicitação, alteração e cancelamento de exames laboratoriais
 *   - Agendamentos e consultas médicas
 *   - Tentativas de acesso negado a áreas administrativas e recursos protegidos
 *
 * CONTRATO DO SERVIÇO:
 *   registrar({ usuario, acao, dataHora, tipo, descricao, modulo, ip })
 *     Campos obrigatórios mínimos: usuario, acao, dataHora (ou gerada), tipo, descricao
 *     Tipos suportados: 'Erro', 'Aviso', 'Informação', 'Acesso'
 *
 * CONTRATO DAS ROTAS (Mock HTTP / Interceptor fetch):
 *   GET /logs?tipo=...&usuario=...&dataInicio=...&dataFim=...&busca=...
 *     200: { success: true, total: number, data: [...] }
 *   GET /logs/indicadores?tipo=...&usuario=...&dataInicio=...&dataFim=...&busca=...
 *     200: { success: true, indicadores: { total, erros, avisos, acessos } }
 *   POST /logs
 *     201: { success: true, log: {...} }
 * ============================================================================
 */
const AuditoriaService = (() => {
  const Http = (typeof window !== 'undefined' && window.MockHttp) || require('./mock-http.js');
  const STORAGE_KEY = 'upa_logs';
  // Limite de registros mantidos no navegador. Sem isto o localStorage
  // crescia indefinidamente (cada login/navegação gera log) até estourar a
  // cota de ~5 MB e passar a falhar em silêncio.
  const LIMITE_REGISTROS = 2000;

  function seedInicial() {
    return [
      {
        id: 'LOG-1001',
        dataHora: '07/05/2026 09:41:22',
        data: '07/05/2026',
        hora: '09:41:22',
        tipo: 'Erro',
        acao: 'Falha na conexão com banco de dados',
        descricao: 'Tempo limite atingido durante tentativa de conexão com a base de dados principal.',
        usuario: 'sistema',
        modulo: 'DB_CONN',
        ip: '192.168.1.10',
        badge: 'b-red',
        dot: 'danger',
        titulo: 'Falha na conexão com banco de dados',
        meta: 'Módulo: DB_CONN · Usuário: sistema · IP: 192.168.1.10'
      },
      {
        id: 'LOG-1002',
        dataHora: '07/05/2026 09:38:14',
        data: '07/05/2026',
        hora: '09:38:14',
        tipo: 'Informação',
        acao: 'Laudo de exame emitido',
        descricao: 'Laudo do exame #EX-8819 (Raio-X Tórax) emitido e assinado digitalmente.',
        usuario: 'Dr. Paulo Ribeiro',
        modulo: 'EXAMES',
        ip: '192.168.1.45',
        badge: 'b-blue',
        dot: 'primary',
        titulo: 'Laudo do exame #EX-8819 emitido',
        meta: 'Módulo: EXAMES · Usuário: Dr. Paulo Ribeiro · IP: 192.168.1.45'
      },
      {
        id: 'LOG-1003',
        dataHora: '07/05/2026 09:35:07',
        data: '07/05/2026',
        hora: '09:35:07',
        tipo: 'Aviso',
        acao: 'Estoque de Insumos abaixo do mínimo',
        descricao: 'Estoque de Insulina NPH na Unidade Julia atingiu o limite crítico de segurança.',
        usuario: 'sistema',
        modulo: 'ESTOQUE',
        ip: '192.168.1.10',
        badge: 'b-yellow',
        dot: 'warning',
        titulo: 'Estoque de Insulina abaixo do mínimo',
        meta: 'Módulo: ESTOQUE · Usuário: sistema · Unidade: Julia'
      },
      {
        id: 'LOG-1004',
        dataHora: '07/05/2026 09:31:55',
        data: '07/05/2026',
        hora: '09:31:55',
        tipo: 'Acesso',
        acao: 'Login realizado com sucesso',
        descricao: 'Usuário Denilson Barrios autenticado com perfil Administrador.',
        usuario: 'Denilson Barrios',
        modulo: 'AUTH',
        ip: '192.168.1.1',
        badge: 'b-green',
        dot: 'success',
        titulo: 'Login realizado com sucesso',
        meta: 'Módulo: AUTH · Usuário: Denilson Barrios · IP: 192.168.1.1'
      },
      {
        id: 'LOG-1005',
        dataHora: '07/05/2026 09:28:43',
        data: '07/05/2026',
        hora: '09:28:43',
        tipo: 'Informação',
        acao: 'Agendamento #10297 criado',
        descricao: 'Solicitação de agendamento realizada para Maria Santos em Pediatria.',
        usuario: 'Enf. Cláudia',
        modulo: 'AGENDAMENTOS',
        ip: '192.168.1.22',
        badge: 'b-blue',
        dot: 'primary',
        titulo: 'Agendamento #10297 criado',
        meta: 'Módulo: AGENDAMENTOS · Usuário: Enf. Cláudia · IP: 192.168.1.22'
      },
      {
        id: 'LOG-1006',
        dataHora: '07/05/2026 09:22:18',
        data: '07/05/2026',
        hora: '09:22:18',
        tipo: 'Aviso',
        acao: 'Tentativa de acesso não autorizado bloqueada',
        descricao: 'Usuário sem privilégios administrativos tentou acessar o painel de logs.',
        usuario: 'Carlos Braga',
        modulo: 'SEGURANÇA',
        ip: '192.168.1.88',
        badge: 'b-yellow',
        dot: 'warning',
        titulo: 'Tentativa de acesso não autorizado bloqueada',
        meta: 'Módulo: SEGURANÇA · Usuário: Carlos Braga · IP: 192.168.1.88'
      },
      {
        id: 'LOG-1007',
        dataHora: '06/05/2026 16:15:30',
        data: '06/05/2026',
        hora: '16:15:30',
        tipo: 'Acesso',
        acao: 'Logout realizado',
        descricao: 'Sessão encerrada voluntariamente pelo usuário.',
        usuario: 'Dr. Arnaldo Luiz',
        modulo: 'AUTH',
        ip: '192.168.1.15',
        badge: 'b-green',
        dot: 'success',
        titulo: 'Logout realizado',
        meta: 'Módulo: AUTH · Usuário: Dr. Arnaldo Luiz · IP: 192.168.1.15'
      },
      {
        id: 'LOG-1008',
        dataHora: '06/05/2026 14:10:00',
        data: '06/05/2026',
        hora: '14:10:00',
        tipo: 'Informação',
        acao: 'Exame solicitado: #EX-8819',
        descricao: 'Solicitação de exame Raio-X Tórax para a paciente Maria Santos.',
        usuario: 'Dr. Paulo Ribeiro',
        modulo: 'EXAMES',
        ip: '192.168.1.45',
        badge: 'b-blue',
        dot: 'primary',
        titulo: 'Exame solicitado: #EX-8819',
        meta: 'Módulo: EXAMES · Usuário: Dr. Paulo Ribeiro · Paciente: Maria Santos'
      }
    ];
  }

  function getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seed = seedInicial();
        persist(seed);
        return seed;
      }
      return JSON.parse(raw);
    } catch {
      return seedInicial();
    }
  }

  function persist(lista) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
      // Sincroniza com estrutura de tela do App se estiver no browser
      if (typeof window !== 'undefined' && window.App?.data?.logs?.boxes) {
        window.App.data.logs.boxes.registros = lista;
        window.App.data.logs.boxes.lista = lista;
      }
    } catch (e) {
      console.error('Erro ao persistir logs de auditoria:', e);
    }
  }

  /**
   * Normaliza o tipo de log para os 4 padrões exigidos:
   * 'Erro', 'Aviso', 'Informação', 'Acesso'.
   */
  function normalizarTipo(tipo) {
    if (!tipo) return 'Informação';
    const s = String(tipo).trim().toLowerCase();
    if (s.includes('err') || s === 'danger') return 'Erro';
    if (s.includes('avis') || s.includes('warn') || s === 'warning') return 'Aviso';
    if (s.includes('acess') || s.includes('auth') || s.includes('login') || s.includes('logout')) return 'Acesso';
    return 'Informação';
  }

  function formatarDataHora(d = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const dia = pad(d.getDate());
    const mes = pad(d.getMonth() + 1);
    const ano = d.getFullYear();
    const hora = pad(d.getHours());
    const min = pad(d.getMinutes());
    const seg = pad(d.getSeconds());
    return {
      data: `${dia}/${mes}/${ano}`,
      hora: `${hora}:${min}:${seg}`,
      dataHora: `${dia}/${mes}/${ano} ${hora}:${min}:${seg}`
    };
  }

  /**
   * Converte uma data brasileira (DD/MM/YYYY) ou ISO (YYYY-MM-DD) para Date para comparação.
   */
  function parseData(dataStr) {
    if (!dataStr) return null;
    const str = String(dataStr).trim();
    if (str.includes('-')) {
      const [ano, mes, dia] = str.split('T')[0].split('-');
      return new Date(parseInt(ano, 10), parseInt(mes, 10) - 1, parseInt(dia, 10));
    }
    if (str.includes('/')) {
      const parts = str.split(' ')[0].split('/');
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  }

  /**
   * Serviço central de auditoria reutilizável.
   *
   * @param {Object} param0
   * @param {string} param0.usuario - Nome do usuário autenticado ou 'sistema'
   * @param {string} param0.acao - Nome da ação realizada (ex: 'Solicitação de Exame')
   * @param {string} [param0.dataHora] - Data/hora formatada (opcional, defaults to now)
   * @param {string} param0.tipo - 'Erro' | 'Aviso' | 'Informação' | 'Acesso'
   * @param {string} param0.descricao - Detalhes do registro
   * @param {string} [param0.modulo] - Módulo de origem (ex: 'EXAMES', 'AUTH', 'SEGURANÇA')
   * @param {string} [param0.ip] - IP de origem (opcional)
   * @returns {Object} Registro de log gerado
   */
  function registrar(arg1, acaoArg, descricaoArg, tipoArg, moduloArg, ipArg) {
    let usuario, acao, dataHora, tipo, descricao, modulo, ip;
    if (arg1 && typeof arg1 === 'object') {
      ({ usuario, acao, dataHora, tipo, descricao, modulo, ip } = arg1);
    } else {
      usuario = arg1;
      acao = acaoArg;
      descricao = descricaoArg;
      tipo = tipoArg;
      modulo = moduloArg;
      ip = ipArg;
    }
    const usuarioFinal = String(usuario || 'sistema').trim();
    const acaoFinal = String(acao || 'Ação do Sistema').trim();
    const tipoFinal = normalizarTipo(tipo);
    const descFinal = String(descricao || acaoFinal).trim();
    const moduloFinal = (modulo || 'SISTEMA').toUpperCase();
    const ipFinal = ip || 'local';

    const agora = new Date();
    const dtInfo = formatarDataHora(agora);
    const dataHoraFinal = dataHora || dtInfo.dataHora;
    const dataFinal = dtInfo.data;
    const horaFinal = dtInfo.hora;

    const estilo = {
      'Erro': { badge: 'b-red', dot: 'danger' },
      'Aviso': { badge: 'b-yellow', dot: 'warning' },
      'Informação': { badge: 'b-blue', dot: 'primary' },
      'Acesso': { badge: 'b-green', dot: 'success' }
    }[tipoFinal] || { badge: 'b-blue', dot: 'primary' };

    const novoLog = {
      id: `LOG-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`,
      dataHora: dataHoraFinal,
      data: dataFinal,
      hora: horaFinal,
      tipo: tipoFinal,
      acao: acaoFinal,
      descricao: descFinal,
      usuario: usuarioFinal,
      modulo: moduloFinal,
      ip: ipFinal,
      badge: estilo.badge,
      dot: estilo.dot,
      titulo: acaoFinal,
      meta: `Módulo: ${moduloFinal} · Usuário: ${usuarioFinal} · ${descFinal}`
    };

    const lista = getAll();
    lista.unshift(novoLog);
    if (lista.length > LIMITE_REGISTROS) lista.length = LIMITE_REGISTROS;
    persist(lista);

    return novoLog;
  }

  /**
   * Filtra registros de auditoria por múltiplos critérios combináveis.
   */
  function listar(filtros = {}) {
    const lista = getAll();
    const { tipo, usuario, dataInicio, dataFim, busca } = filtros;

    const tipoFiltro = tipo ? normalizarTipo(tipo).toLowerCase() : '';
    const userFiltro = usuario ? String(usuario).trim().toLowerCase() : '';
    const buscaFiltro = busca ? String(busca).trim().toLowerCase() : '';
    const dtInicio = dataInicio ? parseData(dataInicio) : null;
    const dtFim = dataFim ? parseData(dataFim) : null;

    const filtrados = lista.filter(item => {
      // 1. Filtro por tipo
      if (tipoFiltro) {
        const itemTipo = normalizarTipo(item.tipo).toLowerCase();
        if (itemTipo !== tipoFiltro) return false;
      }

      // 2. Filtro por usuário
      if (userFiltro) {
        const itemUser = String(item.usuario || '').toLowerCase();
        if (!itemUser.includes(userFiltro)) return false;
      }

      // 3. Filtro por busca global (ação, descrição, usuário ou módulo)
      if (buscaFiltro) {
        const hay = `${item.acao} ${item.descricao} ${item.usuario} ${item.modulo} ${item.meta}`.toLowerCase();
        if (!hay.includes(buscaFiltro)) return false;
      }

      // 4. Filtro por intervalo de datas
      if (dtInicio || dtFim) {
        const itemData = parseData(item.data || item.dataHora);
        if (itemData) {
          if (dtInicio && itemData < dtInicio) return false;
          if (dtFim && itemData > dtFim) return false;
        }
      }

      return true;
    });

    filtrados.success = true;
    filtrados.total = filtrados.length;
    filtrados.data = filtrados;
    return filtrados;
  }

  /**
   * Calcula dinamicamente os 4 indicadores exigidos:
   * Total de registros, Erros, Avisos e Acessos.
   */
  function getIndicadores(filtros = {}) {
    const { data: lista } = listar(filtros);

    let erros = 0;
    let avisos = 0;
    let acessos = 0;

    for (const item of lista) {
      const t = normalizarTipo(item.tipo);
      if (t === 'Erro') erros++;
      else if (t === 'Aviso') avisos++;
      else if (t === 'Acesso') acessos++;
    }

    return {
      total: lista.length,
      erros,
      avisos,
      acessos
    };
  }

  function limpar() {
    persist([]);
  }

  let interceptado = false;
  function registrarInterceptor() {
    if (typeof window === 'undefined' || !window.fetch || interceptado) return;
    interceptado = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = async function (url, options = {}) {
      const method = Http.metodo(options);

      if (Http.exata(url, '/logs/indicadores') && method === 'GET') {
        return Http.json({ success: true, indicadores: getIndicadores(Http.query(url)) });
      }

      if (Http.exata(url, '/logs') && method === 'GET') {
        // listar() devolve um array com propriedades extras; JSON.stringify de
        // um array descarta essas propriedades, então montamos o contrato aqui.
        const res = listar(Http.query(url));
        return Http.json({ success: true, total: res.length, data: Array.from(res) });
      }

      if (Http.exata(url, '/logs') && method === 'POST') {
        let body = {};
        try { body = Http.corpo(options); } catch { body = {}; }
        return Http.json({ success: true, log: registrar(body) }, 201);
      }

      return originalFetch(url, options);
    };
  }

  if (typeof window !== 'undefined') {
    registrarInterceptor();
  }

  return {
    registrar,
    listar,
    getIndicadores,
    getAll,
    persist,
    limpar,
    clear: limpar,
    normalizarTipo,
    parseData,
    formatarDataHora,
    registrarInterceptor
  };
})();

if (typeof window !== 'undefined') {
  window.AuditoriaService = AuditoriaService;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuditoriaService;
}
