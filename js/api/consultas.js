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
        chegada: '13:02',
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
        chegada: '13:31',
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
        chegada: '13:35',
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
        id: 'CS-110',
        paciente: 'Rafael Antunes',
        idade: '33 anos',
        especialidade: 'Clínica Geral',
        medico: 'Dr. Manoel Joaquim',
        inicio: '12:40',
        duracao: '—',
        status: 'Não Compareceu',
        badge: 'b-gray',
        cid: '—',
        data: '07/05/2026'
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

  function minutosDoDia(hhmm) {
    const m = String(hhmm || '').match(/^(\d{1,2}):(\d{2})/);
    return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
  }

  /**
   * Tempo de espera = horário de início do atendimento − horário de chegada
   * do paciente, só para consultas já iniciadas (Em Andamento/Concluída).
   * Antes este indicador fazia a média da DURAÇÃO das consultas (com um
   * "ajuste" pela fila e piso fixo de 12 min) — media outra coisa.
   */
  function calcularTempoMedioEspera(lista) {
    const esperas = lista
      .filter(c => c.status === 'Em Andamento' || c.status === 'Concluída')
      .map(c => {
        const chegada = minutosDoDia(c.chegada);
        const inicio = minutosDoDia(c.inicio);
        return chegada == null || inicio == null ? null : inicio - chegada;
      })
      .filter(n => n != null && n >= 0);
    if (esperas.length === 0) return 0;
    return Math.round(esperas.reduce((a, b) => a + b, 0) / esperas.length);
  }

  const STATUS_CONSULTA = ['Agendada', 'Aguardando', 'Em Andamento', 'Concluída', 'Cancelada', 'Não Compareceu'];

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

    const tempoMedioMinutos = calcularTempoMedioEspera(lista);
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
          tempoMedioEspera: `${calcularTempoMedioEspera(consultasMedico)} min`,
          concluidas: concluidas.length,
          emAndamento: emAndamento.length,
          aguardando: aguardandoFila.length
        }
      }
    };
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
    // Antes: CS-(100 + tamanho da lista) — repetia IDs quando algum registro era removido.
    const maiorId = lista.reduce((m, c) => Math.max(m, parseInt(String(c.id || '').replace(/\D/g, ''), 10) || 0), 100);
    const novoId = `CS-${maiorId + 1}`;

    // Vínculo com a agenda do profissional: o mesmo médico não atende duas
    // consultas no mesmo dia e horário.
    const dataConsulta = dados.data ? String(dados.data).trim() : new Date().toLocaleDateString('pt-BR');
    const horario = inicio || '14:00';
    const conflito = lista.find(c =>
      c.status !== 'Cancelada' &&
      String(c.medico || '').trim().toLowerCase() === String(medico).trim().toLowerCase() &&
      (c.data || '') === dataConsulta &&
      c.inicio === horario
    );
    if (conflito) {
      return {
        status: 409,
        body: { success: false, codigoRegra: 'CONFLITO_AGENDA', error: `Horário indisponível: ${conflito.medico} já tem consulta em ${dataConsulta} às ${horario}.` }
      };
    }

    const novaConsulta = {
      id: novoId,
      paciente: paciente.trim(),
      idade: idade ? `${idade} anos` : '35 anos',
      especialidade: especialidade.trim(),
      medico: medico.trim(),
      inicio: horario,
      chegada: dados.chegada || undefined,
      cpf: dados.cpf || undefined,
      duracao: duracao || '—',
      status: status || 'Agendada',
      badge: status === 'Concluída' ? 'b-green' : (status === 'Em Andamento' ? 'b-blue' : (status === 'Cancelada' ? 'b-red' : 'b-yellow')),
      cid: cid || '—',
      data: dataConsulta
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
    if (!STATUS_CONSULTA.includes(novoStatus)) {
      return { status: 400, body: { success: false, error: `Status inválido. Use: ${STATUS_CONSULTA.join(', ')}.` } };
    }

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
      const Http = window.Http;
      const rota = Http ? Http.caminho(url) : '';
      if (rota !== '/consultas' && !rota.startsWith('/consultas/')) return originalFetch(url, options);

      const method = Http.metodo(options);
      const acesso = Http.autorizar(options);
      if (!acesso.permitido) return Http.negado(acesso);
      const ehCidadao = Http.ehCidadao(acesso.perfil);
      const operador = acesso.user?.nome || 'Sistema';

      // Consultas antigas não guardam CPF, só o nome do paciente.
      const doCidadao = (c) => {
        const cpf = Http.cpfLimpo(acesso.user?.cpf);
        if (c.cpf) return Http.cpfLimpo(c.cpf) === cpf;
        return String(c.paciente || '').trim().toLowerCase() === String(acesso.user?.nome || '').trim().toLowerCase();
      };

      try {
        if (method === 'GET') {
          const filtros = Http.parametros(url);
          if (rota === '/consultas/agenda') {
            if (ehCidadao) return Http.json(403, { success: false, error: 'Acesso negado: a agenda do profissional é restrita à equipe.' });
            const medico = filtros.medico || (acesso.perfil === 'Profissional da Saúde' ? acesso.user?.nome : '');
            return Http.json(200, getAgendaProfissional(medico));
          }
          if (rota === '/consultas/indicadores') {
            if (ehCidadao) return Http.json(403, { success: false, error: 'Acesso negado: indicadores são restritos à equipe.' });
            return Http.json(200, getIndicadores(filtros));
          }
          if (rota === '/consultas') {
            const res = listarConsultas(filtros);
            if (ehCidadao) {
              res.data = res.data.filter(doCidadao);
              res.total = res.data.length;
            }
            return Http.json(200, res);
          }
          return Http.json(404, { success: false, error: 'Rota não encontrada.' });
        }

        const body = Http.corpo(options);

        if (rota === '/consultas' && method === 'POST') {
          const gestao = Http.autorizar(options, { acao: 'gerenciar_atendimentos' });
          if (!gestao.permitido) return Http.negado(gestao);
          const res = await criarConsulta(body, operador);
          return Http.json(res.status, res.body);
        }

        if (rota === '/consultas/status' && (method === 'PUT' || method === 'POST')) {
          const perm = Http.autorizar(options, { acao: 'atualizar_consultas' });
          if (!perm.permitido) return Http.negado(perm);
          const res = await atualizarStatus(body.id || body.paciente, body.status, body);
          return Http.json(res.status, res.body);
        }

        return Http.json(405, { success: false, error: 'Método não permitido.' });
      } catch (err) {
        return Http.json(500, { success: false, error: err.message });
      }
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
