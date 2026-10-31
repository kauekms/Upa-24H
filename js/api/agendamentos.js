/**
 * ============================================================================
 * AgendamentosAPI — Camada de Acesso a Dados e Regras de Negócio de Agendamentos.
 * ============================================================================
 *
 * CONTRATO DAS ROTAS (Mock local / Interceptor de fetch e chamadas diretas)
 *
 *   POST /agendamentos/solicitar
 *     body:     { paciente, cpf, data, horario, especialidade, medico, unidade, solicitantePerfil }
 *     200:      { success: true, message: string, agendamento: {...} }
 *     400:      { success: false, error: string }  (RN01 ou Horário Indisponível)
 *
 *   PUT /agendamentos/alterar  (ou POST /agendamentos/alterar)
 *     body:     { id, data, horario, medico, especialidade, unidade, solicitantePerfil }
 *     200:      { success: true, message: string, agendamento: {...} }
 *     400:      { success: false, error: string }  (RN02 ou Horário Indisponível)
 *     404:      { success: false, error: 'Agendamento não encontrado.' }
 *
 *   POST /agendamentos/confirmar
 *     body:     { id, operador }
 *     200:      { success: true, message: string, agendamento: {...} }
 *     404:      { success: false, error: 'Agendamento não encontrado.' }
 *
 *   POST /agendamentos/cancelar  (ou DELETE /agendamentos/cancelar)
 *     body:     { id, motivo, tipo, perfilOperador, justificativa }
 *     200:      { success: true, message: string, agendamento: {...} }
 *     400:      { success: false, error: string }  (RN03 sem justificativa ou Cidadão com <24h)
 *
 *   GET /agendamentos?status=...&unidade=...&dataInicio=...&dataFim=...&busca=...
 *     200:      { success: true, total: number, data: [...] }
 *
 *   GET /agendamentos/indicadores
 *     200:      { success: true, indicadores: { total, confirmados, pendentes, cancelados, remarcados } }
 *
 * REGRAS DE NEGÓCIO IMPLEMENTADAS:
 *   - RN01: Solicitação de agendamento exige antecedência mínima de 24 horas.
 *   - RN02: Alterações e cancelamentos solicitados pelo cidadão exigem antecedência mínima de 24h.
 *   - RN03: Cancelamento administrativo (equipe/gestão) é permitido a qualquer momento, exigindo
 *           obrigatoriamente justificativa/motivo do cancelamento e registro em log de auditoria.
 *   - Verificação de Conflito de Horário: Impede que o mesmo médico ou unidade receba dois atendimentos
 *     simultâneos na mesma data e horário.
 * ============================================================================
 */
const AgendamentosAPI = (() => {
  const STORAGE_KEY = 'upa_agendamentos';
  const USE_MOCK_API = true;
  const API_BASE_URL = '';

  function seedInicial() {
    return [
      { id: '#10291', paciente: 'Luciana Ferreira', cpf: '123.456.789-00', data: '07/05/2026', horario: '13:20', especialidade: 'Clínica Geral', medico: 'Dr. Manoel Joaquim', unidade: 'Unidade Central', status: 'Confirmado', badge: 'b-green' },
      { id: '#10292', paciente: 'Marcos Oliveira', cpf: '987.654.321-00', data: '07/05/2026', horario: '13:45', especialidade: 'Cardiologia', medico: 'Dr. Arnaldo Luiz', unidade: 'Unidade Oeste', status: 'Confirmado', badge: 'b-green' },
      { id: '#10293', paciente: 'Ana Paula Costa', cpf: '456.789.123-00', data: '07/05/2026', horario: '14:00', especialidade: 'Ginecologia', medico: 'Dra. Heloísa Rocha', unidade: 'Unidade Sul', status: 'Pendente', badge: 'b-yellow' },
      { id: '#10294', paciente: 'Roberto Alves', cpf: '321.654.987-00', data: '07/05/2026', horario: '14:30', especialidade: 'Ortopedia', medico: 'Dr. Carlos Mendes', unidade: 'Unidade Norte', status: 'Confirmado', badge: 'b-green' },
      { id: '#10295', paciente: 'Fernanda Lima', cpf: '654.321.987-00', data: '07/05/2026', horario: '15:00', especialidade: 'Dermatologia', medico: 'Dra. Patrícia Souza', unidade: 'Unidade Leste', status: 'Cancelado', badge: 'b-red' },
      { id: '#10296', paciente: 'José Pereira', cpf: '789.123.456-00', data: '07/05/2026', horario: '15:30', especialidade: 'Neurologia', medico: 'Dr. Paulo Ribeiro', unidade: 'Unidade Central', status: 'Pendente', badge: 'b-yellow' },
      { id: '#10297', paciente: 'Maria Santos', cpf: '112.233.445-00', data: '07/05/2026', horario: '16:00', especialidade: 'Pediatria', medico: 'Dra. Camila Torres', unidade: 'Unidade Sul', status: 'Remarcado', badge: 'b-blue' }
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
      if (window.App?.data?.agendamentos?.boxes) {
        window.App.data.agendamentos.boxes.lista = lista;
      }
    } catch (e) {
      console.error('Erro ao persistir agendamentos:', e);
    }
  }

  /**
   * Converte data e hora para objeto Date nativo.
   * Suporta formatos: DD/MM/YYYY e YYYY-MM-DD.
   */
  function parseDataHora(dataStr, horaStr = '00:00') {
    if (!dataStr) return null;
    let ano, mes, dia;
    const str = String(dataStr).trim();

    if (str.includes('-')) {
      const parts = str.split('-');
      ano = parseInt(parts[0], 10);
      mes = parseInt(parts[1], 10) - 1;
      dia = parseInt(parts[2], 10);
    } else if (str.includes('/')) {
      const parts = str.split('/');
      dia = parseInt(parts[0], 10);
      mes = parseInt(parts[1], 10) - 1;
      ano = parseInt(parts[2], 10);
    } else {
      return null;
    }

    let horas = 0;
    let minutos = 0;
    if (horaStr && String(horaStr).includes(':')) {
      const timeParts = String(horaStr).trim().split(':');
      horas = parseInt(timeParts[0], 10) || 0;
      minutos = parseInt(timeParts[1], 10) || 0;
    }

    const d = new Date(ano, mes, dia, horas, minutos, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  function normalizarDataBR(dataStr) {
    if (!dataStr) return '';
    const s = String(dataStr).trim();
    if (s.includes('-')) {
      const [ano, mes, dia] = s.split('-');
      return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`;
    }
    return s;
  }

  function normalizarDataISO(dataStr) {
    if (!dataStr) return '';
    const s = String(dataStr).trim();
    if (s.includes('/')) {
      const [dia, mes, ano] = s.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    return s;
  }

  /**
   * RN01 / RN02: Valida se há antecedência mínima de 24 horas.
   */
  function verificarAntecedencia24h(dataStr, horaStr, agora = new Date()) {
    const dataHoraAlvo = parseDataHora(dataStr, horaStr);
    if (!dataHoraAlvo) {
      return { valido: false, mensagem: 'Data ou horário do agendamento inválido.' };
    }

    const diffMs = dataHoraAlvo.getTime() - agora.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);

    if (diffHoras < 24) {
      return {
        valido: false,
        diferencaHoras: diffHoras,
        mensagem: 'Regra de Antecedência (RN01/RN02): O agendamento ou alteração exige antecedência mínima de 24 horas.'
      };
    }

    return { valido: true, diferencaHoras: diffHoras, mensagem: '' };
  }

  /**
   * Verificação de horário disponível para médico e unidade.
   * Não permite agendamento simultâneo para o mesmo médico ou mesma unidade.
   */
  function verificarHorarioDisponivel(medico, unidade, dataStr, horaStr, idIgnorado = null) {
    const dataNorm = normalizarDataBR(dataStr);
    const horaNorm = String(horaStr || '').trim();
    const medicoNorm = String(medico || '').trim().toLowerCase();
    const unidadeNorm = String(unidade || '').trim().toLowerCase();

    const lista = getAll();
    const conflito = lista.find(item => {
      if (idIgnorado && item.id === idIgnorado) return false;
      if (item.status === 'Cancelado') return false; // Agendamentos cancelados liberam a vaga

      const itemData = normalizarDataBR(item.data);
      const itemHora = String(item.horario || '').trim();
      const mesmoHorario = (itemData === dataNorm && itemHora === horaNorm);

      if (!mesmoHorario) return false;

      const mesmoMedico = medicoNorm && String(item.medico || '').trim().toLowerCase() === medicoNorm;
      const mesmaUnidade = unidadeNorm && String(item.unidade || '').trim().toLowerCase() === unidadeNorm;

      return mesmoMedico || mesmaUnidade;
    });

    if (conflito) {
      const motivo = String(conflito.medico || '').toLowerCase() === medicoNorm
        ? `O profissional ${conflito.medico} já possui atendimento marcado em ${dataNorm} às ${horaNorm}.`
        : `A ${conflito.unidade} já atingiu a capacidade no horário ${horaNorm}.`;
      return { disponivel: false, conflito, motivo };
    }

    return { disponivel: true, conflito: null, motivo: '' };
  }

  function gerarNovoId() {
    const lista = getAll();
    const idsNumericos = lista
      .map(item => parseInt(String(item.id || '').replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    const maiorId = idsNumericos.length > 0 ? Math.max(...idsNumericos) : 10290;
    return `#${maiorId + 1}`;
  }

  /**
   * POST /agendamentos/solicitar
   * Implementa RN01 e verificação de horário disponível.
   */
  async function solicitarAgendamento(dados = {}, operadorInfo = null, customAgora = null) {
    const paciente = dados.paciente;
    const cpf = dados.cpf;
    const data = dados.data;
    const horario = (dados.horario || dados.hora || '').trim();
    const especialidade = dados.especialidade;
    const medico = dados.medico;
    const unidade = dados.unidade;
    const perfilOperador = dados.perfilSolicitante || dados.perfilOperador || window.App?.usuario?.perfil;
    const encaixeAdministrativo = dados.encaixeAdministrativo;

    if (!paciente || !paciente.trim()) return { status: 400, body: { success: false, error: 'O nome do cidadão é obrigatório.' } };
    if (!cpf || !cpf.trim()) return { status: 400, body: { success: false, error: 'O CPF do cidadão é obrigatório.' } };
    if (!data) return { status: 400, body: { success: false, error: 'A data do agendamento é obrigatória.' } };
    if (!horario) return { status: 400, body: { success: false, error: 'O horário do agendamento é obrigatório.' } };
    if (!especialidade) return { status: 400, body: { success: false, error: 'A especialidade é obrigatória.' } };
    if (!medico) return { status: 400, body: { success: false, error: 'O médico responsável é obrigatório.' } };
    if (!unidade) return { status: 400, body: { success: false, error: 'A unidade de saúde é obrigatória.' } };

    // Validação de Antecedência Mínima de 24h (RN01)
    // Permite bypass apenas se for encaixe administrativo explícito feito por equipe gestora
    const ehEquipe = ['Administrador', 'Recepção'].includes(perfilOperador);
    if (!(ehEquipe && encaixeAdministrativo)) {
      const checkAntecedencia = verificarAntecedencia24h(data, horario, customAgora || new Date());
      if (!checkAntecedencia.valido) {
        return {
          status: 400,
          body: {
            success: false,
            regra: 'RN01',
            codigoRegra: 'RN01',
            error: 'RN01: Agendamentos devem ser solicitados com antecedência mínima de 24 horas.'
          }
        };
      }
    }

    // Verificação de Horário Disponível
    const checkDisponibilidade = verificarHorarioDisponivel(medico, unidade, data, horario);
    if (!checkDisponibilidade.disponivel) {
      return {
        status: 409,
        body: {
          success: false,
          codigoRegra: 'CONFLITO_HORARIO',
          error: `Horário indisponível: ${checkDisponibilidade.motivo}`
        }
      };
    }

    const novoId = gerarNovoId();
    const dataBR = normalizarDataBR(data);
    const novoAgendamento = {
      id: novoId,
      paciente: paciente.trim(),
      cpf: cpf.trim(),
      data: dataBR,
      horario: horario,
      hora: horario,
      especialidade: especialidade.trim(),
      medico: medico.trim(),
      unidade: unidade.trim(),
      status: 'Pendente',
      badge: 'b-yellow',
      criadoEm: (customAgora || new Date()).toISOString()
    };

    const lista = getAll();
    lista.unshift(novoAgendamento);
    persist(lista);

    const operadorNome = operadorInfo || window.App?.usuario?.nome || 'Sistema';
    window.App?.addLog?.(
      'SUCESSO',
      `Novo agendamento solicitado: ${novoId}`,
      `Módulo: AGENDAMENTOS · Operador: ${operadorNome} · Cidadão: ${novoAgendamento.paciente} · Data: ${dataBR} ${horario}`
    );

    return {
      status: 201,
      body: {
        success: true,
        message: `Agendamento ${novoId} solicitado com sucesso!`,
        agendamento: novoAgendamento
      }
    };
  }

  /**
   * PUT /agendamentos/alterar
   * Implementa RN02 (antecedência mínima 24h) e verificação de horário disponível.
   */
  async function alterarAgendamento(dados = {}, operadorInfo = null, customAgora = null) {
    const id = dados.id;

    if (!id) return { status: 400, body: { success: false, error: 'O ID do agendamento é obrigatório.' } };

    const lista = getAll();
    const index = lista.findIndex(a => a.id === id);
    if (index === -1) {
      return { status: 404, body: { success: false, error: `Agendamento ${id} não encontrado.` } };
    }

    const itemOriginal = lista[index];

    if (itemOriginal.status === 'Cancelado') {
      return { status: 400, body: { success: false, error: 'Não é permitido alterar um agendamento já cancelado.' } };
    }

    const perfil = dados.perfilSolicitante || dados.perfilOperador || window.App?.usuario?.perfil;
    const ehEquipe = ['Administrador', 'Recepção'].includes(perfil);
    const agora = customAgora || new Date();

    // Regra RN02: Se solicitada pelo cidadão/paciente (ou não-equipe), a alteração exige
    // antecedência mínima de 24h antes da data original agendada E nova data >= 24h.
    if (!ehEquipe) {
      const checkOriginal = verificarAntecedencia24h(itemOriginal.data, itemOriginal.horario || itemOriginal.hora, agora);
      if (!checkOriginal.valido) {
        return {
          status: 400,
          body: {
            success: false,
            regra: 'RN02',
            codigoRegra: 'RN02',
            error: 'RN02: Alterações e reagendamentos só são permitidos com antecedência mínima de 24 horas do horário agendado.'
          }
        };
      }
    }

    const novaData = dados.novaData || dados.data || itemOriginal.data;
    const novoHorario = dados.novaHora || dados.horario || dados.hora || itemOriginal.horario;
    const novoMedico = dados.medico || itemOriginal.medico;
    const novaUnidade = dados.unidade || itemOriginal.unidade;
    const novaEspec = dados.especialidade || itemOriginal.especialidade;

    // Novo horário também deve respeitar 24h de antecedência se não for equipe administrativa
    if (!ehEquipe) {
      const checkNovo = verificarAntecedencia24h(novaData, novoHorario, agora);
      if (!checkNovo.valido) {
        return {
          status: 400,
          body: {
            success: false,
            regra: 'RN02',
            codigoRegra: 'RN02',
            error: 'RN02: O novo horário de agendamento deve ter antecedência mínima de 24 horas.'
          }
        };
      }
    }

    // Verificação de Conflito de Horário
    const checkDisponibilidade = verificarHorarioDisponivel(novoMedico, novaUnidade, novaData, novoHorario, id);
    if (!checkDisponibilidade.disponivel) {
      return {
        status: 409,
        body: {
          success: false,
          codigoRegra: 'CONFLITO_HORARIO',
          error: `Horário indisponível para alteração: ${checkDisponibilidade.motivo}`
        }
      };
    }

    const dataBR = normalizarDataBR(novaData);
    itemOriginal.data = dataBR;
    itemOriginal.horario = novoHorario;
    itemOriginal.hora = novoHorario;
    itemOriginal.medico = novoMedico;
    itemOriginal.unidade = novaUnidade;
    itemOriginal.especialidade = novaEspec;
    itemOriginal.status = 'Remarcado';
    itemOriginal.badge = 'b-blue';
    itemOriginal.alteradoEm = agora.toISOString();
    const motivoAlt = dados.justificativa || dados.motivo;
    if (motivoAlt) itemOriginal.motivoAlteracao = motivoAlt;

    lista[index] = itemOriginal;
    persist(lista);

    const operadorNome = operadorInfo || window.App?.usuario?.nome || 'Sistema';
    window.App?.addLog?.(
      'INFO',
      `Agendamento ${id} alterado / remarcado`,
      `Módulo: AGENDAMENTOS · Operador: ${operadorNome} · Nova Data: ${dataBR} às ${novoHorario} · Médico: ${novoMedico}`
    );

    return {
      status: 200,
      body: {
        success: true,
        message: `Agendamento ${id} remarcado com sucesso!`,
        agendamento: itemOriginal
      }
    };
  }

  /**
   * POST /agendamentos/confirmar
   */
  async function confirmarAgendamento(dados = {}, operadorInfo = null) {
    const id = typeof dados === 'string' ? dados : dados?.id;
    if (!id) return { status: 400, body: { success: false, error: 'O ID do agendamento é obrigatório.' } };

    const lista = getAll();
    const index = lista.findIndex(a => a.id === id);
    if (index === -1) {
      return { status: 404, body: { success: false, error: `Agendamento ${id} não encontrado.` } };
    }

    const item = lista[index];
    item.status = 'Confirmado';
    item.badge = 'b-green';
    item.confirmadoEm = new Date().toISOString();

    lista[index] = item;
    persist(lista);

    const operadorNome = operadorInfo || window.App?.usuario?.nome || 'Sistema';
    window.App?.addLog?.(
      'SUCESSO',
      `Agendamento ${id} confirmado`,
      `Módulo: AGENDAMENTOS · Operador: ${operadorNome} · Cidadão: ${item.paciente}`
    );

    return {
      status: 200,
      body: {
        success: true,
        message: `Agendamento ${id} confirmado com sucesso!`,
        agendamento: item
      }
    };
  }

  /**
   * POST /agendamentos/cancelar
   * Implementa RN03 (Cancelamento Administrativo) e regra de cancelamento por cidadão (RN02).
   */
  async function cancelarAgendamento(dados = {}, operadorInfo = null, customAgora = null) {
    const id = typeof dados === 'string' ? dados : dados?.id;
    const { tipo, perfilOperador, perfilSolicitante, justificativa, motivo } = dados || {};
    if (!id) return { status: 400, body: { success: false, error: 'O ID do agendamento é obrigatório.' } };

    const lista = getAll();
    const index = lista.findIndex(a => a.id === id);
    if (index === -1) {
      return { status: 404, body: { success: false, error: `Agendamento ${id} não encontrado.` } };
    }

    const item = lista[index];
    const perfil = perfilSolicitante || perfilOperador || window.App?.usuario?.perfil;
    const ehEquipe = ['Administrador', 'Recepção'].includes(perfil);
    const ehCancelamentoAdm = (tipo === 'ADMINISTRATIVO') || ehEquipe;
    const agora = customAgora || new Date();
    const motivoFinal = (justificativa || motivo || '').trim();

    // RN03: Cancelamento Administrativo
    if (ehCancelamentoAdm) {
      if (!motivoFinal) {
        return {
          status: 400,
          body: {
            success: false,
            regra: 'RN03',
            codigoRegra: 'RN03',
            error: 'RN03: O cancelamento administrativo exige obrigatoriamente uma justificativa do cancelamento.'
          }
        };
      }
      item.tipoCancelamento = 'ADMINISTRATIVO';
      item.cancelamentoAdministrativo = true;
      item.motivoCancelamento = motivoFinal;
    } else {
      // Cancelamento solicitado pelo Cidadão: exige antecedência de 24 horas (RN02)
      const checkAntecedencia = verificarAntecedencia24h(item.data, item.horario || item.hora, agora);
      if (!checkAntecedencia.valido) {
        return {
          status: 400,
          body: {
            success: false,
            regra: 'RN02',
            codigoRegra: 'RN02',
            error: 'RN02: O cancelamento pelo cidadão exige antecedência mínima de 24 horas do horário agendado.'
          }
        };
      }
      item.tipoCancelamento = 'CIDADAO';
      item.cancelamentoAdministrativo = false;
      if (motivoFinal) item.motivoCancelamento = motivoFinal;
    }

    item.status = 'Cancelado';
    item.badge = 'b-red';
    item.canceladoEm = agora.toISOString();

    lista[index] = item;
    persist(lista);

    const operadorNome = operadorInfo || window.App?.usuario?.nome || 'Sistema';
    const logDesc = ehCancelamentoAdm
      ? `Cancelamento Administrativo (RN03): Agendamento ${id} cancelado. Justificativa: "${motivoFinal}"`
      : `Cancelamento de Agendamento: ${id} cancelado pelo cidadão.`;

    window.App?.addLog?.(
      ehCancelamentoAdm ? 'AVISO' : 'INFO',
      logDesc,
      `Módulo: AGENDAMENTOS · Operador: ${operadorNome} · Cidadão: ${item.paciente} · Unidade: ${item.unidade}`
    );

    return {
      status: 200,
      body: {
        success: true,
        message: `Agendamento ${id} cancelado com sucesso!`,
        agendamento: item
      }
    };
  }

  /**
   * GET /agendamentos
   * Filtra por status, unidade, período (início e fim), busca (nome/CPF), especialidade e médico.
   */
  function listarAgendamentos(filtros = {}) {
    const { status, unidade, dataInicio, dataFim, busca, especialidade, medico, cpf } = filtros;
    let lista = getAll();

    if (status && status !== 'Todos') {
      lista = lista.filter(a => a.status === status);
    }

    if (unidade && unidade !== 'Todas') {
      lista = lista.filter(a => a.unidade === unidade);
    }

    if (especialidade && especialidade !== 'Todas') {
      lista = lista.filter(a => a.especialidade === especialidade);
    }

    if (medico) {
      const medLower = medico.toLowerCase();
      lista = lista.filter(a => (a.medico || '').toLowerCase().includes(medLower));
    }

    if (cpf) {
      const cpfLimpo = cpf.replace(/\D/g, '');
      lista = lista.filter(a => (a.cpf || '').replace(/\D/g, '') === cpfLimpo);
    }

    if (busca) {
      const q = busca.toLowerCase().trim();
      lista = lista.filter(a =>
        (a.paciente || '').toLowerCase().includes(q) ||
        (a.cpf || '').includes(q) ||
        (a.id || '').toLowerCase().includes(q)
      );
    }

    // Filtro por Período (dataInicio / dataFim)
    if (dataInicio || dataFim) {
      const dtIni = dataInicio ? parseDataHora(dataInicio, '00:00') : null;
      const dtFim = dataFim ? parseDataHora(dataFim, '23:59') : null;

      lista = lista.filter(a => {
        const dtItem = parseDataHora(a.data, a.horario || '12:00');
        if (!dtItem) return true;
        if (dtIni && dtItem < dtIni) return false;
        if (dtFim && dtItem > dtFim) return false;
        return true;
      });
    }

    return {
      success: true,
      total: lista.length,
      data: lista
    };
  }

  /**
   * GET /agendamentos/indicadores
   * Calcula estatísticas dinâmicas agregadas.
   */
  function getIndicadores(filtros = {}) {
    const { data: lista } = listarAgendamentos(filtros);
    const total = lista.length;
    const confirmados = lista.filter(a => a.status === 'Confirmado').length;
    const pendentes = lista.filter(a => a.status === 'Pendente').length;
    const cancelados = lista.filter(a => a.status === 'Cancelado').length;
    const remarcados = lista.filter(a => a.status === 'Remarcado').length;

    const pct = (n) => total > 0 ? Number(((n / total) * 100).toFixed(1)) : 0;

    return {
      success: true,
      indicadores: {
        total,
        confirmados,
        pendentes,
        cancelados,
        remarcados,
        taxaConfirmados: pct(confirmados),
        taxaCancelados: pct(cancelados)
      }
    };
  }

  // ==========================================================================
  // Interceptor global do fetch para emulação de API REST
  // ==========================================================================
  let interceptado = false;
  function registrarInterceptor() {
    if (!USE_MOCK_API || interceptado) return;
    interceptado = true;
    const originalFetch = window.fetch.bind(window);

    const ROTAS = ['/agendamentos', '/agendamentos/solicitar', '/agendamentos/alterar', '/agendamentos/confirmar', '/agendamentos/cancelar', '/agendamentos/indicadores'];

    window.fetch = async (url, options = {}) => {
      const Http = window.Http;
      const rota = Http ? Http.caminho(url) : '';
      if (!ROTAS.includes(rota)) return originalFetch(url, options);

      const method = Http.metodo(options);
      const acesso = Http.autorizar(options);
      if (!acesso.permitido) return Http.negado(acesso);

      const perfil = acesso.perfil;
      const operador = acesso.user?.nome || 'Sistema';
      const ehCidadao = Http.ehCidadao(perfil);
      const ehEquipe = window.Permissoes?.podeGerenciarAtendimentos(perfil);
      const cpfSessao = Http.cpfLimpo(acesso.user?.cpf);
      const proibido = (msg) => Http.json(403, { success: false, error: msg });

      // Somente equipe (Administrador/Recepção) ou o próprio Cidadão alteram
      // agendamentos. Profissional da Saúde atende, mas não agenda.
      const podeMexerNoAgendamento = (id) => {
        if (ehEquipe) return true;
        if (!ehCidadao) return false;
        const item = getAll().find(a => a.id === id);
        return !item || Http.cpfLimpo(item.cpf) === cpfSessao; // inexistente → a API responde 404
      };

      try {
        if (method === 'GET' && (rota === '/agendamentos' || rota === '/agendamentos/indicadores')) {
          const filtros = Http.parametros(url);
          if (ehCidadao) filtros.cpf = acesso.user?.cpf || '-'; // Cidadão só vê os próprios
          const res = rota === '/agendamentos/indicadores' ? getIndicadores(filtros) : listarAgendamentos(filtros);
          return Http.json(200, res);
        }

        const body = Http.corpo(options);
        // O perfil declarado no corpo é ignorado: vale o da sessão.
        const dados = { ...body, perfilSolicitante: perfil, perfilOperador: perfil };
        if (!ehEquipe) {
          delete dados.encaixeAdministrativo;
          delete dados.tipo; // Cidadão não pode declarar cancelamento ADMINISTRATIVO
        }

        if (rota === '/agendamentos/solicitar' && method === 'POST') {
          if (!ehEquipe && !ehCidadao) return proibido(`Acesso negado: perfil "${perfil}" não pode solicitar agendamentos.`);
          if (ehCidadao && Http.cpfLimpo(dados.cpf) !== cpfSessao) {
            return proibido('Acesso negado: o cidadão só pode solicitar agendamentos para o próprio CPF.');
          }
          const res = await solicitarAgendamento(dados, operador);
          return Http.json(res.status, res.body);
        }

        if (rota === '/agendamentos/alterar' && (method === 'PUT' || method === 'POST')) {
          if (!podeMexerNoAgendamento(dados.id)) return proibido('Acesso negado: agendamento de outro cidadão ou perfil sem permissão.');
          const res = await alterarAgendamento(dados, operador);
          return Http.json(res.status, res.body);
        }

        if (rota === '/agendamentos/confirmar' && method === 'POST') {
          if (!podeMexerNoAgendamento(dados.id)) return proibido('Acesso negado: agendamento de outro cidadão ou perfil sem permissão.');
          const res = await confirmarAgendamento(dados, operador);
          return Http.json(res.status, res.body);
        }

        if (rota === '/agendamentos/cancelar' && (method === 'POST' || method === 'DELETE')) {
          if (!podeMexerNoAgendamento(dados.id)) return proibido('Acesso negado: agendamento de outro cidadão ou perfil sem permissão.');
          const res = await cancelarAgendamento(dados, operador);
          return Http.json(res.status, res.body);
        }

        return Http.json(405, { success: false, error: 'Método não permitido.' });
      } catch (err) {
        return Http.json(500, { success: false, error: err.message });
      }
    };
  }

  // Inicializa interceptor mock automaticamente se estiver no navegador
  if (typeof window !== 'undefined') {
    registrarInterceptor();
  }

  return {
    getAll,
    persist,
    parseDataHora,
    normalizarDataBR,
    normalizarDataISO,
    verificarAntecedencia24h,
    verificarHorarioDisponivel,
    solicitar: solicitarAgendamento,
    alterar: alterarAgendamento,
    confirmar: confirmarAgendamento,
    cancelar: cancelarAgendamento,
    listar: listarAgendamentos,
    getIndicadores,
    registrarInterceptor
  };
})();

if (typeof window !== 'undefined') {
  window.AgendamentosAPI = AgendamentosAPI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AgendamentosAPI;
}
