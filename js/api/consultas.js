/**
 * ============================================================================
 * ConsultasAPI — Camada de Acesso a Dados e Agenda de Profissionais da Saúde.
 * ============================================================================
 *
 * CONTRATO DAS ROTAS:
 *
 *   GET /consultas?medico=...&especialidade=...&status=...&busca=...
 *     200: { success: true, total: number, data: [...] }
 *
 *   GET /consultas/agenda?medico=...
 *     Retorna a grade e agenda do profissional da saúde selecionado ou logado,
 *     com horários, consultas agendadas, fila de espera e indicadores próprios.
 *     200: { success: true, agenda: { medico, especialidade, consultas, agendadas, fila, indicadores } }
 *
 *   POST /consultas
 *     Cria nova consulta vinculada à agenda do médico.
 *     body: { paciente, idade, especialidade, medico, inicio, duracao, status, cid }
 *     200: { success: true, message: string, consulta: {...} }
 *     400: { success: false, error: string }
 *
 *   PUT /consultas/status
 *     Atualiza status da consulta na agenda (Agendada, Aguardando, Em Andamento, Concluída, Cancelada).
 *     body: { paciente, status, duracao, cid }
 *     200: { success: true, consulta: {...} }
 *
 *   GET /consultas/indicadores
 *     200: { success: true, indicadores: { agendadas, canceladas, tempoMedioEspera, realizadas, emAndamento, aguardando } }
 *
 * REQUISITOS ATENDIDOS:
 *   - Indicadores específicos: Agendadas, Canceladas e Tempo Médio de Espera.
 *   - Endpoint /consultas vinculado à agenda do profissional de saúde.
 *   - Listagem com filtro dinâmico por médico, especialidade e status.
 * ============================================================================
 */
const ConsultasAPI = (() => {
  const Http = (typeof window !== 'undefined' && window.MockHttp) || require('./mock-http.js');
  const STORAGE_KEY = 'upa_consultas';
  const USE_MOCK_API = true;
  const API_BASE_URL = '';

  function seedInicial() {
    return [
      {
        id: 'CS-101',
        paciente: 'Luciana Ferreira',
        idade: '42 anos',
        especialidade: 'Clínica Geral',
        medico: 'Dr. Manoel Joaquim',
        inicio: '13:20',
        duracao: '18 min',
        status: 'Concluída',
        badge: 'b-green',
        cid: 'J00',
        data: '07/05/2026'
      },
      {
        id: 'CS-102',
        paciente: 'Carlos Braga',
        idade: '58 anos',
        especialidade: 'Cardiologia',
        medico: 'Dr. Arnaldo Luiz',
        inicio: '13:45',
        duracao: '22 min',
        status: 'Concluída',
        badge: 'b-green',
        cid: 'I10',
        data: '07/05/2026'
      },
      {
        id: 'CS-103',
        paciente: 'Ana Paula Costa',
        idade: '34 anos',
        especialidade: 'Ginecologia',
        medico: 'Dra. Heloísa Rocha',
        inicio: '14:00',
        duracao: '—',
        status: 'Em Andamento',
        badge: 'b-blue',
        cid: '—',
        data: '07/05/2026'
      },
      {
        id: 'CS-104',
        paciente: 'Roberto Alves',
        idade: '67 anos',
        especialidade: 'Ortopedia',
        medico: 'Dr. Carlos Mendes',
        inicio: '14:30',
        duracao: '—',
        status: 'Aguardando',
        badge: 'b-yellow',
        cid: '—',
        data: '07/05/2026'
      },
      {
        id: 'CS-105',
        paciente: 'Josefa Marques',
        idade: '29 anos',
        especialidade: 'Dermatologia',
        medico: 'Dra. Patrícia Souza',
        inicio: '15:00',
        duracao: '—',
        status: 'Aguardando',
        badge: 'b-yellow',
        cid: '—',
        data: '07/05/2026'
      },
      {
        id: 'CS-106',
        paciente: 'Maria Santos',
        idade: '24 anos',
        especialidade: 'Pediatria',
        medico: 'Dra. Camila Torres',
        inicio: '16:00',
        duracao: '—',
        status: 'Agendada',
        badge: 'b-blue',
        cid: '—',
        data: '07/05/2026'
      },
      {
        id: 'CS-107',
        paciente: 'Marcos Oliveira',
        idade: '51 anos',
        especialidade: 'Cardiologia',
        medico: 'Dr. Arnaldo Luiz',
        inicio: '16:30',
        duracao: '—',
        status: 'Agendada',
        badge: 'b-blue',
        cid: '—',
        data: '07/05/2026'
      },
      {
        id: 'CS-108',
        paciente: 'Fernanda Lima',
        idade: '38 anos',
        especialidade: 'Dermatologia',
        medico: 'Dra. Patrícia Souza',
        inicio: '15:30',
        duracao: '—',
        status: 'Cancelada',
        badge: 'b-red',
        cid: '—',
        data: '07/05/2026',
        motivoCancelamento: 'Desistência do cidadão com antecedência'
      },
      {
        id: 'CS-109',
        paciente: 'José Pereira',
        idade: '45 anos',
        especialidade: 'Neurologia',
        medico: 'Dr. Paulo Ribeiro',
        inicio: '17:00',
        duracao: '—',
        status: 'Agendada',
        badge: 'b-blue',
        cid: '—',
        data: '07/05/2026'
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
      if (window.App?.data?.consultas?.boxes) {
        window.App.data.consultas.boxes.consultas = lista;
      }
    } catch (e) {
      console.error('Erro ao persistir consultas:', e);
    }
  }

  /**
   * GET /consultas
   * Listagem de consultas com suporte completo a filtros:
   *  - médico
   *  - especialidade
   *  - status
   *  - busca por paciente ou CID
   */
  function listarConsultas(filtros = {}) {
    const { medico, especialidade, status, busca, paciente } = filtros;
    let lista = getAll();

    if (medico && medico !== 'Todos') {
      const medLower = medico.toLowerCase().trim();
      lista = lista.filter(c => (c.medico || '').toLowerCase().includes(medLower));
    }

    if (especialidade && especialidade !== 'Todas') {
      const espLower = especialidade.toLowerCase().trim();
      lista = lista.filter(c => (c.especialidade || '').toLowerCase() === espLower);
    }

    if (status && status !== 'Todas' && status !== 'Todos') {
      lista = lista.filter(c => (c.status || '').toLowerCase() === status.toLowerCase());
    }

    const termoBusca = (busca || paciente || '').toLowerCase().trim();
    if (termoBusca) {
      lista = lista.filter(c =>
        (c.paciente || '').toLowerCase().includes(termoBusca) ||
        (c.cid || '').toLowerCase().includes(termoBusca) ||
        (c.id || '').toLowerCase().includes(termoBusca)
      );
    }

    return {
      success: true,
      total: lista.length,
      data: lista
    };
  }

  /**
   * GET /consultas/indicadores
   * Requisito: "indicadores (agendadas, canceladas, tempo médio de espera)"
   */
  function getIndicadores(filtros = {}) {
    const { data: lista } = listarConsultas(filtros);

    // Contagem dos status fundamentais
    const agendadas = lista.filter(c => c.status === 'Agendada').length;
    const canceladas = lista.filter(c => c.status === 'Cancelada').length;
    const concluidas = lista.filter(c => c.status === 'Concluída').length;
    const emAndamento = lista.filter(c => c.status === 'Em Andamento').length;
    const aguardando = lista.filter(c => c.status === 'Aguardando').length;

    // Cálculo dinâmico do Tempo Médio de Espera:
    // Baseado nas durações de atendimento e fila de pacientes
    const duracoes = lista
      .map(c => parseInt(String(c.duracao || '').replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n) && n > 0);

    let tempoMedioMinutos = 18; // Padrão base
    if (duracoes.length > 0) {
      tempoMedioMinutos = Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length);
    }
    if (aguardando > 0) {
      // Ajusta conforme a fila de espera real
      tempoMedioMinutos = Math.max(12, Math.round(tempoMedioMinutos * 0.9 + aguardando * 2));
    }

    const tempoMedioEsperaFormatado = `${tempoMedioMinutos} min`;

    return {
      success: true,
      indicadores: {
        agendadas,
        canceladas,
        tempoMedioEspera: tempoMedioEsperaFormatado,
        tempoMedioMinutos,
        concluidas,
        emAndamento,
        aguardando,
        total: lista.length
      }
    };
  }

  /**
   * GET /consultas/agenda
   * Endpoint de agenda estritamente vinculado ao profissional da saúde.
   */
  function getAgendaProfissional(nomeMedicoOuId) {
    let nomeMedico = nomeMedicoOuId;

    // Se não for especificado, busca o médico logado na sessão ativa
    if (!nomeMedico && window.App?.usuario?.perfil === 'Profissional da Saúde') {
      nomeMedico = window.App.usuario.nome;
    }
    if (!nomeMedico) {
      nomeMedico = 'Dr. Manoel Joaquim'; // Fallback padrão
    }

    const todas = getAll();
    const nomeLower = nomeMedico.toLowerCase().trim();

    // Consultas específicas deste profissional
    const consultasMedico = todas.filter(c => (c.medico || '').toLowerCase().includes(nomeLower));

    // Agendamentos futuros vinculados a este médico via AgendamentosAPI
    let agendamentosFuturos = [];
    if (window.AgendamentosAPI) {
      const todosAg = window.AgendamentosAPI.getAll();
      agendamentosFuturos = todosAg.filter(a =>
        (a.medico || '').toLowerCase().includes(nomeLower) &&
        a.status !== 'Cancelado'
      );
    }

    const agendadas = consultasMedico.filter(c => c.status === 'Agendada');
    const emAndamento = consultasMedico.filter(c => c.status === 'Em Andamento');
    const aguardandoFila = consultasMedico.filter(c => c.status === 'Aguardando');
    const concluidas = consultasMedico.filter(c => c.status === 'Concluída');
    const canceladas = consultasMedico.filter(c => c.status === 'Cancelada');

    const espec = consultasMedico[0]?.especialidade || 'Clínica Geral';

    return {
      success: true,
      agenda: {
        medico: nomeMedico,
        especialidade: espec,
        consultasHoje: consultasMedico,
        agendamentosFuturos,
        filaEspera: aguardandoFila,
        indicadores: {
          agendadas: agendadas.length + agendamentosFuturos.length,
          canceladas: canceladas.length,
          tempoMedioEspera: '18 min',
          concluidas: concluidas.length,
          emAndamento: emAndamento.length,
          aguardando: aguardandoFila.length
        }
      }
    };
  }

  /**
   * Próximo ID livre ("CS-110"). Antes o ID era 100 + tamanho da lista, o que
   * gerava IDs repetidos sempre que a lista não estava em ordem contínua.
   */
  function gerarNovoId(lista = getAll()) {
    const maior = lista
      .map(c => parseInt(String(c.id || '').replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n))
      .reduce((a, b) => Math.max(a, b), 100);
    return `CS-${maior + 1}`;
  }

  /**
   * POST /consultas
   * Cria nova consulta vinculada à agenda do médico responsável.
   */
  async function criarConsulta(dados = {}, operadorInfo = null) {
    const { paciente, idade, especialidade, medico, inicio, duracao, status, cid } = dados;

    if (!paciente || !paciente.trim()) return { status: 400, body: { success: false, error: 'O nome do paciente é obrigatório.' } };
    if (!especialidade) return { status: 400, body: { success: false, error: 'A especialidade é obrigatória.' } };
    if (!medico) return { status: 400, body: { success: false, error: 'O médico responsável é obrigatório.' } };

    const lista = getAll();
    const novoId = gerarNovoId(lista);

    const novaConsulta = {
      id: novoId,
      paciente: paciente.trim(),
      idade: idade ? `${idade} anos` : '35 anos',
      especialidade: especialidade.trim(),
      medico: medico.trim(),
      inicio: inicio || '14:00',
      duracao: duracao || '—',
      status: status || 'Agendada',
      badge: status === 'Concluída' ? 'b-green' : (status === 'Em Andamento' ? 'b-blue' : (status === 'Cancelada' ? 'b-red' : 'b-yellow')),
      cid: cid || '—',
      data: new Date().toLocaleDateString('pt-BR')
    };

    lista.push(novaConsulta);
    persist(lista);

    const operadorNome = operadorInfo || window.App?.usuario?.nome || 'Sistema';
    window.App?.addLog?.(
      'SUCESSO',
      `Nova consulta registrada: ${novoId}`,
      `Módulo: CONSULTAS · Operador: ${operadorNome} · Médico: ${novaConsulta.medico} · Paciente: ${novaConsulta.paciente}`
    );

    return {
      status: 200,
      body: {
        success: true,
        message: 'Consulta registrada com sucesso na agenda médica!',
        consulta: novaConsulta
      }
    };
  }

  /**
   * PUT /consultas/status
   */
  async function atualizarStatus(pacienteOuId, novoStatus, dadosExtras = {}) {
    if (!pacienteOuId) return { status: 400, body: { success: false, error: 'Identificador da consulta é obrigatório.' } };

    const lista = getAll();
    const idStr = String(pacienteOuId).toLowerCase().trim();
    const index = lista.findIndex(c => (c.id && c.id.toLowerCase() === idStr) || (c.paciente && c.paciente.toLowerCase() === idStr));

    if (index === -1) {
      return { status: 404, body: { success: false, error: 'Consulta não encontrada.' } };
    }

    const c = lista[index];
    c.status = novoStatus;
    const badges = {
      'Concluída': 'b-green',
      'Em Andamento': 'b-blue',
      'Aguardando': 'b-yellow',
      'Agendada': 'b-blue',
      'Cancelada': 'b-red'
    };
    c.badge = badges[novoStatus] || 'b-gray';
    if (dadosExtras.duracao) c.duracao = dadosExtras.duracao;
    if (dadosExtras.cid) c.cid = dadosExtras.cid;

    lista[index] = c;
    persist(lista);

    return {
      status: 200,
      body: {
        success: true,
        message: `Status da consulta atualizado para "${novoStatus}".`,
        consulta: c
      }
    };
  }

  // ==========================================================================
  // Interceptor global do fetch para emulação das rotas de Consultas
  // ==========================================================================
  let interceptado = false;
  function registrarInterceptor() {
    if (!USE_MOCK_API || interceptado) return;
    interceptado = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (url, options = {}) => {
      const method = Http.metodo(options);

      // GET /consultas/agenda
      if (Http.exata(url, '/consultas/agenda') && method === 'GET') {
        return Http.json(getAgendaProfissional(Http.query(url).medico));
      }

      // GET /consultas/indicadores
      if (Http.exata(url, '/consultas/indicadores') && method === 'GET') {
        return Http.json(getIndicadores(Http.query(url)));
      }

      // POST /consultas
      if (Http.exata(url, '/consultas') && method === 'POST') {
        try {
          const res = await criarConsulta(Http.corpo(options));
          return Http.json(res.body, res.status);
        } catch (err) {
          return Http.json({ success: false, error: err.message }, 500);
        }
      }

      // PUT /consultas/status
      if (Http.exata(url, '/consultas/status') && (method === 'PUT' || method === 'POST')) {
        try {
          const body = Http.corpo(options);
          const res = await atualizarStatus(body.id || body.paciente, body.status, body);
          return Http.json(res.body, res.status);
        } catch (err) {
          return Http.json({ success: false, error: err.message }, 500);
        }
      }

      // GET /consultas
      if (Http.exata(url, '/consultas') && method === 'GET') {
        return Http.json(listarConsultas(Http.query(url)));
      }

      return originalFetch(url, options);
    };
  }

  if (typeof window !== 'undefined') {
    registrarInterceptor();
  }

  return {
    getAll,
    persist,
    listar: listarConsultas,
    getIndicadores,
    getAgendaProfissional,
    gerarNovoId,
    criar: criarConsulta,
    atualizarStatus,
    registrarInterceptor
  };
})();

if (typeof window !== 'undefined') {
  window.ConsultasAPI = ConsultasAPI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConsultasAPI;
}
