/**
 * ============================================================================
 * ExamesAPI — Camada de Acesso a Dados e Regras de Negócio de Exames Laboratoriais.
 * ============================================================================
 *
 * Atende aos Casos de Uso 2 (Solicitar Exame) e 3 (Alterar Exame).
 *
 * CONTRATO DAS ROTAS (Mock local / Interceptor de fetch e chamadas diretas):
 *
 *   POST /exames
 *     body: { paciente, cpf, tipo, data, horario, unidade, solicitante, prioridade, dataPrevista }
 *     201:  { success: true, message: 'Exame solicitado com sucesso.', exame: {...} }
 *     400:  { success: false, error: string } (Campos obrigatórios ausentes ou horário ocupado)
 *
 *   PUT /exames/:id (ou PUT /exames com { id, ... })
 *     body: { id, paciente, tipo, data, horario, unidade, solicitante, prioridade, status }
 *     200:  { success: true, message: 'Exame alterado com sucesso.', exame: {...} }
 *     400:  { success: false, error: string } (Exame concluído não pode ser alterado ou conflito)
 *     404:  { success: false, error: 'Exame não encontrado.' }
 *
 *   GET /exames?status=...&dataInicio=...&dataFim=...&busca=...&paciente=...
 *     200:  { success: true, total: number, data: [...] }
 *
 *   GET /exames/indicadores?status=...&dataInicio=...&dataFim=...
 *     200:  { success: true, indicadores: { solicitados, emAndamento, concluidos, atrasados } }
 *
 *   GET /exames/historico?paciente=...
 *     200:  { success: true, paciente: string, total: number, historico: [...] }
 *
 * REGRAS DE NEGÓCIO IMPLEMENTADAS:
 *   - Validação de campos obrigatórios: paciente, tipo de exame, data, unidade.
 *   - Verificação de conflito de horário na mesma unidade de saúde.
 *   - Exames com status 'Concluído' não podem ser alterados.
 *   - Indicador/Status 'Atrasado': quando a data prevista de resultado já passou e o status não é Concluído.
 *   - Todo registro e alteração gera log no serviço central de auditoria (AuditoriaService).
 * ============================================================================
 */
const ExamesAPI = (() => {
  const STORAGE_KEY = 'upa_exames';

  function seedInicial() {
    return [
      {
        id: '#EX-8821',
        paciente: 'Carlos Braga',
        cpf: '123.456.789-00',
        pid: 'P-4521',
        tipo: 'Hemograma Completo',
        solicitante: 'Dr. Arnaldo Luiz',
        unidade: 'UBS Centro',
        data: '07/05/2026',
        horario: '07:30',
        dataPrevista: '09/05/2026',
        prioridade: 'Urgente',
        priorBadge: 'b-red',
        status: 'Solicitado',
        statusBadge: 'b-yellow'
      },
      {
        id: '#EX-8822',
        paciente: 'Luciana Ferreira',
        cpf: '987.654.321-00',
        pid: 'P-4318',
        tipo: 'Glicemia em Jejum',
        solicitante: 'Dr. Manoel Joaquim',
        unidade: 'Unidade Central',
        data: '07/05/2026',
        horario: '08:00',
        dataPrevista: '08/05/2026',
        prioridade: 'Normal',
        priorBadge: 'b-gray',
        status: 'Em andamento',
        statusBadge: 'b-blue'
      },
      {
        id: '#EX-8819',
        paciente: 'Maria Santos',
        cpf: '112.233.445-00',
        pid: 'P-3892',
        tipo: 'Raio-X Tórax',
        solicitante: 'Dr. Paulo Ribeiro',
        unidade: 'Unidade Sul',
        data: '05/05/2026',
        horario: '09:15',
        dataPrevista: '06/05/2026',
        prioridade: 'Normal',
        priorBadge: 'b-gray',
        status: 'Concluído',
        statusBadge: 'b-green',
        download: true
      },
      {
        id: '#EX-8815',
        paciente: 'José Pereira',
        cpf: '789.123.456-00',
        pid: 'P-4102',
        tipo: 'Tomografia Crânio',
        solicitante: 'Dr. Paulo Ribeiro',
        unidade: 'Unidade Central',
        data: '01/05/2026',
        horario: '10:30',
        dataPrevista: '03/05/2026', // Data prevista já passou e status não é Concluído -> ATRASADO
        prioridade: 'Média',
        priorBadge: 'b-orange',
        status: 'Em andamento',
        statusBadge: 'b-blue'
      },
      {
        id: '#EX-8810',
        paciente: 'Roberto Alves',
        cpf: '321.654.987-00',
        pid: 'P-3761',
        tipo: 'Ultrassom Abdominal',
        solicitante: 'Dr. Carlos Mendes',
        unidade: 'Unidade Norte',
        data: '04/05/2026',
        horario: '11:00',
        dataPrevista: '05/05/2026',
        prioridade: 'Normal',
        priorBadge: 'b-gray',
        status: 'Concluído',
        statusBadge: 'b-green',
        download: true
      },
      {
        id: '#EX-8807',
        paciente: 'Ana Paula Costa',
        cpf: '456.789.123-00',
        pid: 'P-4409',
        tipo: 'ECG',
        solicitante: 'Dra. Heloísa Rocha',
        unidade: 'Unidade Oeste',
        data: '07/05/2026',
        horario: '14:00',
        dataPrevista: '08/05/2026',
        prioridade: 'Urgente',
        priorBadge: 'b-red',
        status: 'Solicitado',
        statusBadge: 'b-yellow'
      },
      {
        id: '#EX-8805',
        paciente: 'Carlos Braga',
        cpf: '123.456.789-00',
        pid: 'P-4521',
        tipo: 'Colesterol Total e Frações',
        solicitante: 'Dr. Arnaldo Luiz',
        unidade: 'UBS Centro',
        data: '20/04/2026',
        horario: '08:30',
        dataPrevista: '22/04/2026',
        prioridade: 'Normal',
        priorBadge: 'b-gray',
        status: 'Concluído',
        statusBadge: 'b-green',
        download: true
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
      if (typeof window !== 'undefined' && window.App?.data?.exames?.boxes) {
        window.App.data.exames.boxes.lista = lista;
      }
    } catch (e) {
      console.error('Erro ao persistir exames:', e);
    }
  }

  function normalizarDataBR(dataStr) {
    if (!dataStr) return '';
    const s = String(dataStr).trim();
    if (s.includes('-')) {
      const parts = s.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    return s;
  }

  function normalizarDataISO(dataStr) {
    if (!dataStr) return '';
    const s = String(dataStr).trim();
    if (s.includes('/')) {
      const parts = s.split(' ')[0].split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return s;
  }

  function parseData(dataStr) {
    if (!dataStr) return null;
    const s = String(dataStr).trim();
    if (s.includes('-')) {
      const parts = s.split('T')[0].split('-');
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    if (s.includes('/')) {
      const parts = s.split(' ')[0].split('/');
      return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
    return null;
  }

  /**
   * Data de referência para teste de prazo "já passou".
   * Antes, fora de maio/2026 a referência era congelada em 07/05/2026 (data
   * da base de demonstração) — exames realmente vencidos nunca apareciam como
   * atrasados. Agora a referência padrão é sempre o momento atual.
   */
  function getDataReferencia(dataRef) {
    if (dataRef instanceof Date) return dataRef;
    if (typeof dataRef === 'string') return parseData(dataRef) || new Date();
    return new Date();
  }

  function gerarNovoId(lista) {
    const maior = lista.reduce((m, e) => Math.max(m, parseInt(String(e.id || '').replace(/\D/g, ''), 10) || 0), 8829);
    return `#EX-${maior + 1}`;
  }

  /**
   * RN: Um exame é "Atrasado" quando a data prevista de resultado já passou e o status não é Concluído.
   */
  function isAtrasado(exame, dataRef) {
    if (!exame) return false;
    const st = String(exame.status || '').trim().toLowerCase();
    if (st === 'concluído' || st === 'concluido' || st === 'laudo emitido') {
      return false;
    }
    if (st === 'atrasado') {
      return true;
    }

    const ref = getDataReferencia(dataRef);
    let dtPrev = parseData(exame.dataPrevista);
    if (!dtPrev && exame.data) {
      // Se não tiver data prevista explícita, considera prazo padrão de 2 dias após a solicitação
      const dtSolic = parseData(exame.data);
      if (dtSolic) {
        dtPrev = new Date(dtSolic.getTime() + 2 * 24 * 60 * 60 * 1000);
      }
    }

    if (dtPrev && dtPrev < ref) {
      return true;
    }
    return false;
  }

  /**
   * Normaliza os 4 status oficiais da tela:
   * 'Solicitado', 'Em andamento', 'Concluído', 'Atrasado'.
   */
  function normalizarStatus(status, exame) {
    if (exame && isAtrasado(exame)) return 'Atrasado';
    if (!status) return 'Solicitado';
    const s = String(status).trim().toLowerCase();
    if (s.includes('concl') || s.includes('laudo emit')) return 'Concluído';
    if (s.includes('andamento') || s.includes('análise') || s.includes('analise')) return 'Em andamento';
    if (s.includes('atras')) return 'Atrasado';
    return 'Solicitado';
  }

  function getStatusBadge(status) {
    const s = String(status).trim().toLowerCase();
    if (s.includes('concl') || s.includes('laudo emit')) return 'b-green';
    if (s.includes('andamento') || s.includes('análise') || s.includes('analise')) return 'b-blue';
    if (s.includes('atras')) return 'b-red';
    return 'b-yellow';
  }

  /**
   * Verifica se já existe agendamento de exame na mesma unidade, data e horário (Caso de Teste 2/9).
   */
  function verificarConflitoHorario(unidade, data, horario, ignorarId = null) {
    if (!unidade || !data || !horario) return false;
    const lista = getAll();
    const dataNorm = normalizarDataBR(data);
    const horaNorm = String(horario).trim();
    const unidadeNorm = String(unidade).trim().toLowerCase();

    return lista.some(e => {
      if (ignorarId && e.id === ignorarId) return false;
      const st = String(e.status || '').toLowerCase();
      if (st.includes('cancel')) return false;
      return (
        String(e.unidade || '').trim().toLowerCase() === unidadeNorm &&
        normalizarDataBR(e.data) === dataNorm &&
        String(e.horario || '').trim() === horaNorm
      );
    });
  }

  /**
   * CASO DE USO 2: SOLICITAR EXAME LABORATORIAL
   *
   * Valida campos obrigatórios: paciente, tipo de exame, data, unidade.
   * Valida conflito de horário.
   * Gera registro no serviço de auditoria.
   */
  async function solicitarExame(dados = {}, operador = 'sistema') {
    const {
      paciente,
      cpf,
      pid,
      tipo,
      data,
      horario,
      unidade,
      solicitante,
      prioridade,
      dataPrevista
    } = dados;

    // 1. Validação de campos obrigatórios (Regra de Negócio 1.2 / Caso de Uso 2)
    const faltantes = [];
    if (!paciente || !String(paciente).trim()) faltantes.push('paciente');
    if (!tipo || !String(tipo).trim()) faltantes.push('tipo de exame');
    if (!data || !String(data).trim()) faltantes.push('data');
    if (!unidade || !String(unidade).trim()) faltantes.push('unidade');

    if (faltantes.length > 0) {
      return {
        status: 400,
        body: {
          success: false,
          error: `Campos obrigatórios não preenchidos: ${faltantes.join(', ')}.`
        }
      };
    }

    // 2. Validação de conflito de horário na mesma unidade
    if (horario && verificarConflitoHorario(unidade, data, horario)) {
      return {
        status: 400,
        body: {
          success: false,
          error: `O horário selecionado (${horario}) já está ocupado na unidade ${unidade}.`
        }
      };
    }

    const dataBR = normalizarDataBR(data);
    const horaFinal = horario ? String(horario).trim() : '08:00';
    let dataPrevistaFinal = dataPrevista ? normalizarDataBR(dataPrevista) : '';
    if (!dataPrevistaFinal) {
      const dtObj = parseData(data);
      if (dtObj) {
        const dMais2 = new Date(dtObj.getTime() + 2 * 24 * 60 * 60 * 1000);
        dataPrevistaFinal = normalizarDataBR(dMais2.toISOString().split('T')[0]);
      } else {
        dataPrevistaFinal = dataBR;
      }
    }

    const prioridadeFinal = prioridade || 'Normal';
    const priorBadge = prioridadeFinal === 'Urgente' ? 'b-red' : prioridadeFinal === 'Média' ? 'b-orange' : 'b-gray';
    // Antes era aleatório entre #EX-8830 e #EX-9629: com algumas centenas de
    // exames, dois pedidos acabavam com o mesmo ID.
    const newId = gerarNovoId(getAll());

    const novoExame = {
      id: newId,
      paciente: String(paciente).trim(),
      cpf: cpf ? String(cpf).trim() : '',
      pid: pid || `P-${Math.floor(4000 + Math.random() * 1000)}`,
      tipo: String(tipo).trim(),
      solicitante: solicitante ? String(solicitante).trim() : 'Dr. Arnaldo Luiz',
      unidade: String(unidade).trim(),
      data: dataBR,
      horario: horaFinal,
      dataPrevista: dataPrevistaFinal,
      prioridade: prioridadeFinal,
      priorBadge,
      status: 'Solicitado',
      statusBadge: 'b-yellow'
    };

    const lista = getAll();
    lista.unshift(novoExame);
    persist(lista);

    // Registro no serviço central de auditoria (Parte 2)
    if (typeof window !== 'undefined' && window.AuditoriaService?.registrar) {
      window.AuditoriaService.registrar({
        usuario: operador,
        acao: 'Solicitação de Exame',
        tipo: 'Informação',
        modulo: 'EXAMES',
        descricao: `Exame ${novoExame.id} (${novoExame.tipo}) solicitado para o paciente "${novoExame.paciente}" na unidade "${novoExame.unidade}".`
      });
    }

    return {
      status: 201,
      body: {
        success: true,
        message: `Exame ${novoExame.id} solicitado com sucesso!`,
        exame: novoExame,
        data: novoExame
      }
    };
  }

  /**
   * CASO DE USO 3: ALTERAR EXAME LABORATORIAL
   *
   * Exames concluídos NÃO podem ser alterados.
   * Valida campos obrigatórios e conflito de horário.
   * Gera registro no serviço de auditoria.
   */
  async function alterarExame(id, dados = {}, operador = 'sistema') {
    if (!id) {
      return { status: 400, body: { success: false, error: 'O identificador do exame é obrigatório.' } };
    }

    const lista = getAll();
    const idx = lista.findIndex(e => e.id === id || String(e.id).replace(/\D/g, '') === String(id).replace(/\D/g, ''));
    if (idx === -1) {
      return { status: 404, body: { success: false, error: 'Exame não encontrado.' } };
    }

    const exameAtual = lista[idx];

    // Regra: Exames concluídos não devem poder ser alterados
    const stAtual = String(exameAtual.status || '').toLowerCase();
    if (stAtual.includes('concl') || stAtual.includes('laudo emit')) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Exames concluídos não podem ser alterados.'
        }
      };
    }

    const novoPaciente = dados.paciente != null ? String(dados.paciente).trim() : exameAtual.paciente;
    const novoTipo = dados.tipo != null ? String(dados.tipo).trim() : exameAtual.tipo;
    const novaData = dados.data != null ? normalizarDataBR(dados.data) : exameAtual.data;
    const novaUnidade = dados.unidade != null ? String(dados.unidade).trim() : exameAtual.unidade;
    const novoHorario = dados.horario != null ? String(dados.horario).trim() : (exameAtual.horario || '08:00');

    // Validação de campos obrigatórios
    if (!novoPaciente || !novoTipo || !novaData || !novaUnidade) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Campos obrigatórios não podem ficar em branco (paciente, tipo de exame, data e unidade).'
        }
      };
    }

    // Validação de conflito de horário
    if (novoHorario && verificarConflitoHorario(novaUnidade, novaData, novoHorario, exameAtual.id)) {
      return {
        status: 400,
        body: {
          success: false,
          error: `O horário selecionado (${novoHorario}) já está ocupado na unidade ${novaUnidade}.`
        }
      };
    }

    // Atualização dos dados
    exameAtual.paciente = novoPaciente;
    exameAtual.tipo = novoTipo;
    exameAtual.data = novaData;
    exameAtual.unidade = novaUnidade;
    exameAtual.horario = novoHorario;

    if (dados.cpf) exameAtual.cpf = String(dados.cpf).trim();
    if (dados.solicitante) exameAtual.solicitante = String(dados.solicitante).trim();
    if (dados.dataPrevista) exameAtual.dataPrevista = normalizarDataBR(dados.dataPrevista);
    if (dados.prioridade) {
      exameAtual.prioridade = dados.prioridade;
      exameAtual.priorBadge = dados.prioridade === 'Urgente' ? 'b-red' : dados.prioridade === 'Média' ? 'b-orange' : 'b-gray';
    }
    if (dados.status) {
      exameAtual.status = dados.status;
      exameAtual.statusBadge = getStatusBadge(dados.status);
    }

    lista[idx] = exameAtual;
    persist(lista);

    // Registro de auditoria (Parte 2)
    if (typeof window !== 'undefined' && window.AuditoriaService?.registrar) {
      window.AuditoriaService.registrar({
        usuario: operador,
        acao: 'Alteração de Exame',
        tipo: 'Informação',
        modulo: 'EXAMES',
        descricao: `Exame ${exameAtual.id} (${exameAtual.tipo}) do paciente "${exameAtual.paciente}" alterado com sucesso.`
      });
    }

    return {
      status: 200,
      body: {
        success: true,
        message: `Exame ${exameAtual.id} alterado com sucesso!`,
        exame: exameAtual,
        data: exameAtual
      }
    };
  }

  /**
   * Listagem de exames com suporte a filtros combináveis:
   * status (Solicitado, Em andamento, Concluído, Atrasado), data inicial, data final e busca.
   */
  function listarExames(filtros = {}) {
    const lista = getAll();
    const { status, dataInicio, dataFim, busca, q, paciente, cpf } = filtros;

    const cpfFiltro = cpf ? String(cpf).replace(/\D/g, '') || '-' : '';
    const stFiltro = status ? String(status).trim().toLowerCase() : '';
    const buscaFiltro = (busca || q) ? String(busca || q).trim().toLowerCase() : '';
    const pacFiltro = paciente ? String(paciente).trim().toLowerCase() : '';
    const dtInicio = dataInicio ? parseData(dataInicio) : null;
    const dtFim = dataFim ? parseData(dataFim) : null;

    const filtrados = lista.filter(item => {
      // 0. Filtro exato por CPF (usado no recorte "só meus exames" do Cidadão)
      if (cpfFiltro && String(item.cpf || '').replace(/\D/g, '') !== cpfFiltro) return false;

      // 1. Filtro por status (inclui a regra dinâmica de "Atrasado")
      if (stFiltro) {
        if (stFiltro === 'atrasado') {
          if (!isAtrasado(item)) return false;
        } else if (stFiltro === 'solicitado') {
          const st = String(item.status || '').toLowerCase();
          if (st !== 'solicitado' && st !== 'aguardando') return false;
        } else if (stFiltro === 'em andamento' || stFiltro === 'em análise' || stFiltro === 'em analise') {
          const st = String(item.status || '').toLowerCase();
          if (st !== 'em andamento' && st !== 'em análise' && st !== 'em analise') return false;
        } else if (stFiltro === 'concluído' || stFiltro === 'concluido' || stFiltro === 'laudo emitido') {
          const st = String(item.status || '').toLowerCase();
          if (!st.includes('concl') && !st.includes('laudo emit')) return false;
        } else {
          const st = String(item.status || '').toLowerCase();
          if (st !== stFiltro) return false;
        }
      }

      // 2. Filtro por paciente específico
      if (pacFiltro) {
        const pNome = String(item.paciente || '').toLowerCase();
        const pCpf = String(item.cpf || '').replace(/\D/g, '');
        const fLimpo = pacFiltro.replace(/\D/g, '');
        if (!pNome.includes(pacFiltro) && (!fLimpo || !pCpf.includes(fLimpo))) {
          return false;
        }
      }

      // 3. Filtro por busca genérica
      if (buscaFiltro) {
        const hay = `${item.id} ${item.paciente} ${item.tipo} ${item.unidade || ''} ${item.solicitante || ''}`.toLowerCase();
        if (!hay.includes(buscaFiltro)) return false;
      }

      // 4. Filtro por período de datas (data inicial e final)
      if (dtInicio || dtFim) {
        const itemData = parseData(item.data);
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
   * Retorna o histórico de exames de um paciente cadastrado.
   */
  function getHistoricoPaciente(pacienteOuCpf) {
    if (!pacienteOuCpf) {
      const arr = [];
      arr.success = false;
      arr.total = 0;
      arr.historico = arr;
      return arr;
    }
    const query = String(pacienteOuCpf).trim().toLowerCase();
    const queryDigitos = query.replace(/\D/g, '');

    const lista = getAll();
    let historico = lista.filter(e => {
      const pNome = String(e.paciente || '').toLowerCase();
      const pCpf = String(e.cpf || '').replace(/\D/g, '');
      const pId = String(e.id || '').toLowerCase();
      if (pNome.includes(query)) return true;
      if (pId === query || pId.replace(/\D/g, '') === query.replace(/\D/g, '')) return true;
      if (queryDigitos && queryDigitos.length >= 9 && pCpf.includes(queryDigitos)) return true;
      return false;
    });

    if (historico.length === 1 && (query.startsWith('#ex-') || query.startsWith('ex-'))) {
      const pAlvo = historico[0].paciente;
      const cpfAlvo = historico[0].cpf;
      historico = lista.filter(e =>
        e.paciente === pAlvo || (cpfAlvo && e.cpf === cpfAlvo)
      );
    }

    historico.success = true;
    historico.paciente = pacienteOuCpf;
    historico.total = historico.length;
    historico.historico = historico;
    return historico;
  }

  /**
   * Calcula dinamicamente os 4 indicadores do topo da tela:
   * Solicitados, Em andamento, Concluídos e Atrasados.
   */
  function getIndicadores(filtros = {}) {
    const { data: lista } = listarExames(filtros);

    let solicitados = 0;
    let emAndamento = 0;
    let concluidos = 0;
    let atrasados = 0;

    for (const item of lista) {
      if (isAtrasado(item)) {
        atrasados++;
      }
      const st = String(item.status || '').toLowerCase();
      if (st.includes('concl') || st.includes('laudo emit')) {
        concluidos++;
      } else if (st.includes('andamento') || st.includes('análise') || st.includes('analise')) {
        emAndamento++;
      } else if (st.includes('solicit') || st.includes('aguard')) {
        solicitados++;
      }
    }

    return {
      solicitados,
      emAndamento,
      concluidos,
      atrasados
    };
  }

  function limpar() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  /**
   * Interceptador de chamadas fetch para endpoints mockados de exames.
   */
  let interceptado = false;
  function registrarInterceptor() {
    if (typeof window === 'undefined' || !window.fetch || interceptado) return;
    interceptado = true;
    const originalFetch = window.fetch;

    window.fetch = async function (url, options = {}) {
      const Http = window.Http;
      const rota = Http ? Http.caminho(url) : '';
      if (rota !== '/exames' && !rota.startsWith('/exames/')) return originalFetch(url, options);

      const method = Http.metodo(options);
      const acesso = Http.autorizar(options);
      if (!acesso.permitido) return Http.negado(acesso);
      const ehCidadao = Http.ehCidadao(acesso.perfil);
      const operador = acesso.user?.nome || 'sistema';

      if (method === 'GET') {
        const filtros = Http.parametros(url);
        // Cidadão só enxerga os próprios exames (filtro por CPF da sessão).
        if (ehCidadao) filtros.cpf = acesso.user?.cpf || '-';

        if (rota === '/exames/indicadores') {
          return Http.json(200, { success: true, indicadores: getIndicadores(filtros) });
        }
        if (rota === '/exames/historico') {
          const alvo = ehCidadao ? (acesso.user?.cpf || '-') : (filtros.paciente || '');
          const hist = getHistoricoPaciente(alvo);
          return Http.json(200, { success: hist.success, paciente: alvo, total: hist.length, historico: Array.from(hist) });
        }
        if (rota === '/exames') {
          const lista = listarExames(filtros);
          return Http.json(200, { success: true, total: lista.length, data: Array.from(lista) });
        }
        return Http.json(404, { success: false, error: 'Rota não encontrada.' });
      }

      // Solicitar/alterar exames é atribuição da equipe (Casos de Uso 2 e 3).
      const gestao = Http.autorizar(options, { acao: 'gerenciar_atendimentos' });
      if (!gestao.permitido) return Http.negado(gestao);
      const body = Http.corpo(options);

      if (method === 'POST' && rota === '/exames') {
        const res = await solicitarExame(body, operador);
        return Http.json(res.status, res.body);
      }

      if (method === 'PUT') {
        const match = rota.match(/^\/exames\/([^/]+)$/);
        const id = match ? decodeURIComponent(match[1]) : body.id;
        const res = await alterarExame(id, body, operador);
        return Http.json(res.status, res.body);
      }

      return Http.json(405, { success: false, error: 'Método não permitido.' });
    };
  }

  if (typeof window !== 'undefined') {
    registrarInterceptor();
  }

  return {
    solicitar: solicitarExame,
    alterar: alterarExame,
    listar: listarExames,
    getIndicadores,
    getHistoricoPaciente,
    isAtrasado,
    normalizarStatus,
    normalizarDataBR,
    normalizarDataISO,
    parseData,
    getAll,
    persist,
    limpar,
    registrarInterceptor
  };
})();

if (typeof window !== 'undefined') {
  window.ExamesAPI = ExamesAPI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExamesAPI;
}
