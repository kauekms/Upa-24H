/**
 * ============================================================================
 * VacinacaoAPI — Camada de Acesso a Dados, Controle de Estoque, Alertas e
 * Registro de Aplicações da Campanha de Vacinação.
 * ============================================================================
 *
 * CONTRATO DOS ENDPOINTS SIMULADOS (via interceptação de fetch e métodos diretos):
 *
 *   POST /vacinacao/registrar-aplicacao
 *     body: { cidadao, cpf?, vacina, lote, dose, unidade, profissional, dataHora }
 *     201:  { success: true, message, aplicacao, estoqueAtual, indicadores, alertas }
 *     400:  { success: false, error } (Campos obrigatórios ausentes ou vacina/lote inexistente)
 *     401:  { success: false, error } (Usuário não autenticado)
 *     403:  { success: false, error } (Perfil sem permissão — permitido: Profissional da Saúde, Recepção ou Administrador)
 *     409:  { success: false, error } (Aplicação duplicada da mesma dose para o mesmo cidadão)
 *     422:  { success: false, error } (Estoque insuficiente/zerado ou lote vencido)
 *
 *   GET /vacinacao/estoque?vacina=...&unidade=...
 *     200:  { success: true, total, totalDoses, data: [...], estoque: [...] }
 *
 *   GET /vacinacao/alertas?vacina=...&unidade=...&nivel=...
 *     200:  { success: true, total, criticos, atencao, data: [...], alertas: [...] }
 *
 *   POST /vacinacao/estoque/entrada
 *     body: { vacina, lote, validade, quantidade, unidade, estoqueMinimo? }
 *     201:  { success: true, message, lote: {...}, indicadores, alertas }
 *     400:  { success: false, error } (Dados inválidos)
 *     401:  { success: false, error } (Não autenticado)
 *     403:  { success: false, error } (Restrito a Administrador)
 *     422:  { success: false, error } (Lote vencido)
 *
 *   GET /vacinacao/indicadores?vacina=...&campanha=...&unidade=...&dataInicio=...&dataFim=...
 *     200:  { success: true, indicadores: {...} }
 * ============================================================================
 */
const VacinacaoAPI = (() => {
  const Http = (typeof window !== 'undefined' && window.MockHttp) || require('./mock-http.js');
  const Unid = (typeof window !== 'undefined' && window.Unidades) || require('../config/unidades.js');
  const STORAGE_ESTOQUE = 'upa_vacinacao_estoque';
  const STORAGE_APLICACOES = 'upa_vacinacao_aplicacoes';
  const STORAGE_CAMPANHAS = 'upa_vacinacao_campanhas';
  const STORAGE_MINIMOS = 'upa_vacinacao_minimos';
  const STORAGE_ALERTAS_LOG = 'upa_vacinacao_alertas_logados';

  const ESTOQUE_MINIMO_PADRAO = 5;

  function seedMinimosInicial() {
    return {
      'COVID-19 (Bivalente)': 10,
      'COVID-19': 10,
      'Influenza': 10,
      'Hepatite B': 5,
      'Febre Amarela': 5,
      'Meningite ACWY': 5
    };
  }

  function seedCampanhasInicial() {
    return [
      {
        id: 'CAMP-01',
        nome: 'Campanha Nacional COVID-19',
        vacina: 'COVID-19 (Bivalente)',
        publicoAlvo: 'Idosos (60+) e Imunossuprimidos',
        periodo: '01/03/2026 a 31/12/2026',
        dataInicio: '01/03/2026',
        dataFim: '31/12/2026',
        meta: 10,
        populacaoAlvo: 10,
        status: 'Ativa',
        icone: '💉',
        icoBg: '#dcfce7'
      },
      {
        id: 'CAMP-02',
        nome: 'Campanha Sazonal Influenza',
        vacina: 'Influenza',
        publicoAlvo: 'Gestantes, Crianças e Idosos',
        periodo: '01/04/2026 a 30/11/2026',
        dataInicio: '01/04/2026',
        dataFim: '30/11/2026',
        meta: 10,
        populacaoAlvo: 10,
        status: 'Ativa',
        icone: '🩸',
        icoBg: '#fef9c3'
      },
      {
        id: 'CAMP-03',
        nome: 'Imunização Permanente Hepatite B',
        vacina: 'Hepatite B',
        publicoAlvo: 'População Geral (Todas as idades)',
        periodo: '01/01/2026 a 31/12/2026',
        dataInicio: '01/01/2026',
        dataFim: '31/12/2026',
        meta: 8,
        populacaoAlvo: 8,
        status: 'Ativa',
        icone: '🔵',
        icoBg: '#e8f2fb'
      },
      {
        id: 'CAMP-04',
        nome: 'Intensificação Febre Amarela',
        vacina: 'Febre Amarela',
        publicoAlvo: 'Viajantes e Residentes (9m a 59 anos)',
        periodo: '01/02/2026 a 30/11/2026',
        dataInicio: '01/02/2026',
        dataFim: '30/11/2026',
        meta: 6,
        populacaoAlvo: 6,
        status: 'Em Atenção',
        icone: '🟣',
        icoBg: '#f3e8ff'
      },
      {
        id: 'CAMP-05',
        nome: 'Vacinação Escolar Meningite ACWY',
        vacina: 'Meningite ACWY',
        publicoAlvo: 'Adolescentes (11 a 14 anos)',
        periodo: '01/03/2026 a 31/12/2026',
        dataInicio: '01/03/2026',
        dataFim: '31/12/2026',
        meta: 6,
        populacaoAlvo: 6,
        status: 'Em Atenção',
        icone: '🔴',
        icoBg: '#fef2f2'
      }
    ];
  }

  function seedEstoqueInicial() {
    return [
      {
        id: 'EST-001',
        vacina: 'COVID-19 (Bivalente)',
        lote: 'LOT-COV-2026A',
        validade: '30/08/2027',
        quantidade: 25,
        estoqueMinimo: 10,
        unidade: 'Unidade Centro'
      },
      {
        id: 'EST-002',
        vacina: 'Influenza',
        lote: 'LOT-INF-2026B',
        validade: '15/09/2027',
        quantidade: 18,
        estoqueMinimo: 10,
        unidade: 'Unidade Julia'
      },
      {
        id: 'EST-003',
        vacina: 'Hepatite B',
        lote: 'LOT-HEP-2026C',
        validade: '20/10/2027',
        quantidade: 6,
        estoqueMinimo: 5,
        unidade: 'Unidade Centro'
      },
      {
        id: 'EST-004',
        vacina: 'Febre Amarela',
        lote: 'LOT-FA-2026D',
        validade: '10/07/2027',
        quantidade: 3,
        estoqueMinimo: 5,
        unidade: 'Unidade Julia'
      },
      {
        id: 'EST-005',
        vacina: 'Meningite ACWY',
        lote: 'LOT-MEN-2026E',
        validade: '05/11/2027',
        quantidade: 1,
        estoqueMinimo: 5,
        unidade: 'Unidade Julia'
      },
      {
        id: 'EST-006',
        vacina: 'Meningite ACWY',
        lote: 'LOT-MEN-ZERO',
        validade: '01/12/2027',
        quantidade: 0,
        estoqueMinimo: 5,
        unidade: 'Unidade Centro'
      },
      {
        id: 'EST-007',
        vacina: 'Febre Amarela',
        lote: 'LOT-FA-VENC',
        validade: '10/01/2026',
        quantidade: 12,
        estoqueMinimo: 5,
        unidade: 'Unidade Centro'
      }
    ];
  }

  function seedAplicacoesInicial() {
    return [
      {
        id: 'APL-1001',
        cidadao: 'Paulo Henrique',
        paciente: 'Paulo Henrique',
        cpf: '246.813.579-00',
        vacina: 'COVID-19 (Bivalente)',
        campanha: 'Campanha Nacional COVID-19',
        lote: 'LOT-COV-2026A',
        dose: '2ª Dose',
        unidade: 'Unidade Centro',
        profissional: 'Enf. Cláudia',
        dataHora: '07/05/2026 12:14',
        data: '07/05/2026',
        hora: '12:14'
      },
      {
        id: 'APL-1002',
        cidadao: 'Marina Gomes',
        paciente: 'Marina Gomes',
        cpf: '234.567.890-11',
        vacina: 'Influenza',
        campanha: 'Campanha Sazonal Influenza',
        lote: 'LOT-INF-2026B',
        dose: 'Dose Única',
        unidade: 'Unidade Julia',
        profissional: 'Enf. Rodrigo',
        dataHora: '07/05/2026 12:08',
        data: '07/05/2026',
        hora: '12:08'
      },
      {
        id: 'APL-1003',
        cidadao: 'Antônio Silva',
        paciente: 'Antônio Silva',
        cpf: '345.678.901-22',
        vacina: 'Hepatite B',
        campanha: 'Imunização Permanente Hepatite B',
        lote: 'LOT-HEP-2026C',
        dose: '1ª Dose',
        unidade: 'Unidade Centro',
        profissional: 'Enf. Cláudia',
        dataHora: '07/05/2026 11:52',
        data: '07/05/2026',
        hora: '11:52'
      },
      {
        id: 'APL-1004',
        cidadao: 'Beatriz Nunes',
        paciente: 'Beatriz Nunes',
        cpf: '456.789.012-33',
        vacina: 'Febre Amarela',
        campanha: 'Intensificação Febre Amarela',
        lote: 'LOT-FA-2026D',
        dose: 'Dose Única',
        unidade: 'Unidade Julia',
        profissional: 'Enf. Marcos',
        dataHora: '07/05/2026 11:40',
        data: '07/05/2026',
        hora: '11:40'
      },
      {
        id: 'APL-1005',
        cidadao: 'Lucas Ferreira',
        paciente: 'Lucas Ferreira',
        cpf: '567.890.123-44',
        vacina: 'Meningite ACWY',
        campanha: 'Vacinação Escolar Meningite ACWY',
        lote: 'LOT-MEN-2026E',
        dose: 'Dose Única',
        unidade: 'Unidade Julia',
        profissional: 'Enf. Juliana',
        dataHora: '06/05/2026 15:20',
        data: '06/05/2026',
        hora: '15:20'
      },
      {
        id: 'APL-1006',
        cidadao: 'Maria da Silva Santos',
        paciente: 'Maria da Silva Santos',
        cpf: '333.666.999-57',
        vacina: 'COVID-19 (Bivalente)',
        campanha: 'Campanha Nacional COVID-19',
        lote: 'LOT-COV-2026A',
        dose: '1ª Dose',
        unidade: 'Unidade Centro',
        profissional: 'Enf. Cláudia',
        dataHora: '06/05/2026 10:15',
        data: '06/05/2026',
        hora: '10:15'
      },
      {
        id: 'APL-1007',
        cidadao: 'Roberto Alves',
        paciente: 'Roberto Alves',
        cpf: '321.654.987-00',
        vacina: 'COVID-19 (Bivalente)',
        campanha: 'Campanha Nacional COVID-19',
        lote: 'LOT-COV-2026A',
        dose: 'Reforço',
        unidade: 'Unidade Centro',
        profissional: 'Enf. Cláudia',
        dataHora: '05/05/2026 14:30',
        data: '05/05/2026',
        hora: '14:30'
      },
      {
        id: 'APL-1008',
        cidadao: 'Fernanda Lima',
        paciente: 'Fernanda Lima',
        cpf: '654.321.987-00',
        vacina: 'Influenza',
        campanha: 'Campanha Sazonal Influenza',
        lote: 'LOT-INF-2026B',
        dose: 'Dose Única',
        unidade: 'Unidade Julia',
        profissional: 'Enf. Rodrigo',
        dataHora: '05/05/2026 09:45',
        data: '05/05/2026',
        hora: '09:45'
      }
    ];
  }

  // ==========================================================================
  // Persistência e Getters
  // ==========================================================================
  function getMinimos() {
    try {
      const raw = localStorage.getItem(STORAGE_MINIMOS);
      if (!raw) {
        const seed = seedMinimosInicial();
        localStorage.setItem(STORAGE_MINIMOS, JSON.stringify(seed));
        return seed;
      }
      return { ...seedMinimosInicial(), ...JSON.parse(raw) };
    } catch {
      return seedMinimosInicial();
    }
  }

  function persistMinimos(minimos) {
    try {
      localStorage.setItem(STORAGE_MINIMOS, JSON.stringify(minimos));
      window.Persistencia?.registrar(STORAGE_MINIMOS, minimos); // espelha no MySQL (XAMPP)
    } catch (e) {
      console.error('Erro ao salvar estoque mínimo de vacinas:', e);
    }
  }

  function getEstoqueMinimoVacina(vacina, itemEstoque = null) {
    if (itemEstoque && typeof itemEstoque.estoqueMinimo === 'number' && !isNaN(itemEstoque.estoqueMinimo)) {
      return itemEstoque.estoqueMinimo;
    }
    const minimos = getMinimos();
    const vNorm = String(vacina || '').trim();
    if (minimos[vNorm] != null) return Number(minimos[vNorm]);
    const key = Object.keys(minimos).find(k => mesmaVacina(k, vNorm));
    return key ? Number(minimos[key]) : ESTOQUE_MINIMO_PADRAO;
  }

  function definirEstoqueMinimo(vacina, minimo) {
    const vNorm = String(vacina || '').trim();
    const val = Number(minimo);
    if (!vNorm || isNaN(val) || val < 0) return false;
    const minimos = getMinimos();
    minimos[vNorm] = val;
    persistMinimos(minimos);

    // Atualiza os lotes dessa vacina no estoque
    const estoque = getEstoque();
    estoque.forEach(item => {
      if (mesmaVacina(item.vacina, vNorm)) {
        item.estoqueMinimo = val;
      }
    });
    persistEstoque(estoque);
    return true;
  }

  function getCampanhas() {
    try {
      const raw = localStorage.getItem(STORAGE_CAMPANHAS);
      if (!raw) {
        const seed = seedCampanhasInicial();
        persistCampanhas(seed);
        return seed;
      }
      return JSON.parse(raw);
    } catch {
      return seedCampanhasInicial();
    }
  }

  function persistCampanhas(lista) {
    try {
      localStorage.setItem(STORAGE_CAMPANHAS, JSON.stringify(lista));
      window.Persistencia?.registrar(STORAGE_CAMPANHAS, lista); // espelha no MySQL (XAMPP)
    } catch (e) {
      console.error('Erro ao persistir campanhas:', e);
    }
  }

  function getEstoque() {
    try {
      const raw = localStorage.getItem(STORAGE_ESTOQUE);
      if (!raw) {
        const seed = seedEstoqueInicial();
        persistEstoque(seed);
        return seed;
      }
      const lista = JSON.parse(raw);
      // Migra nomes antigos de unidade para "Unidade Centro" / "Unidade Julia"
      if (Unid.normalizarRegistros(lista)) persistEstoque(lista);
      return lista;
    } catch {
      return seedEstoqueInicial();
    }
  }

  function persistEstoque(lista) {
    try {
      localStorage.setItem(STORAGE_ESTOQUE, JSON.stringify(lista));
      window.Persistencia?.registrar(STORAGE_ESTOQUE, lista); // espelha no MySQL (XAMPP)
      sincronizarAppData();
    } catch (e) {
      console.error('Erro ao persistir estoque de vacinas:', e);
    }
  }

  function getAplicacoes() {
    try {
      const raw = localStorage.getItem(STORAGE_APLICACOES);
      if (!raw) {
        const seed = seedAplicacoesInicial();
        persistAplicacoes(seed);
        return seed;
      }
      const lista = JSON.parse(raw);
      // Migra nomes antigos de unidade para "Unidade Centro" / "Unidade Julia"
      if (Unid.normalizarRegistros(lista)) persistAplicacoes(lista);
      return lista;
    } catch {
      return seedAplicacoesInicial();
    }
  }

  function persistAplicacoes(lista) {
    try {
      localStorage.setItem(STORAGE_APLICACOES, JSON.stringify(lista));
      window.Persistencia?.registrar(STORAGE_APLICACOES, lista); // espelha no MySQL (XAMPP)
      sincronizarAppData();
    } catch (e) {
      console.error('Erro ao persistir aplicações de vacinas:', e);
    }
  }

  // ==========================================================================
  // Utilitários de Normalização e Datas
  // ==========================================================================
  function mesmaVacina(v1, v2) {
    const a = String(v1 || '').trim().toLowerCase();
    const b = String(v2 || '').trim().toLowerCase();
    if (!a || !b) return false;
    if (a === b) return true;
    if ((a === 'covid-19' && b.startsWith('covid-19')) || (b === 'covid-19' && a.startsWith('covid-19'))) {
      return true;
    }
    return false;
  }

  function normalizarDose(doseStr) {
    const s = String(doseStr || '').trim().toLowerCase();
    if (!s) return '';
    if (s.includes('1ª') || s.includes('1a') || s === '1' || s.includes('primeira')) return '1ª Dose';
    if (s.includes('2ª') || s.includes('2a') || s === '2' || s.includes('segunda')) return '2ª Dose';
    if (s.includes('3ª') || s.includes('3a') || s === '3' || s.includes('terceira')) return '3ª Dose';
    if (s.includes('refor')) return 'Reforço';
    if (s.includes('únic') || s.includes('unic')) return 'Dose Única';
    return String(doseStr).trim();
  }

  function parseData(dataStr, endOfDay = false) {
    if (!dataStr) return null;
    const s = String(dataStr).trim();
    let ano, mes, dia;

    if (s.includes('-')) {
      const datePart = s.split('T')[0].split(' ')[0];
      const parts = datePart.split('-');
      if (parts.length !== 3) return null;
      ano = parseInt(parts[0], 10);
      mes = parseInt(parts[1], 10) - 1;
      dia = parseInt(parts[2], 10);
    } else if (s.includes('/')) {
      const datePart = s.split(' ')[0];
      const parts = datePart.split('/');
      if (parts.length === 2) {
        dia = parseInt(parts[0], 10);
        mes = parseInt(parts[1], 10) - 1;
        ano = 2026;
      } else if (parts.length === 3) {
        dia = parseInt(parts[0], 10);
        mes = parseInt(parts[1], 10) - 1;
        ano = parseInt(parts[2], 10);
      } else {
        return null;
      }
    } else {
      return null;
    }

    if (isNaN(ano) || isNaN(mes) || isNaN(dia)) return null;
    const d = endOfDay
      ? new Date(ano, mes, dia, 23, 59, 59, 999)
      : new Date(ano, mes, dia, 0, 0, 0, 0);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatarDataBR(dataStr) {
    if (!dataStr) return '';
    const s = String(dataStr).trim();
    if (s.includes('-')) {
      const [datePart, timePart] = s.split(/T|\s+/);
      const parts = datePart.split('-');
      if (parts.length === 3) {
        const br = `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
        return timePart ? `${br} ${timePart.slice(0, 5)}` : br;
      }
    }
    if (s.includes('/')) {
      const [datePart, timePart] = s.split(/\s+/);
      const parts = datePart.split('/');
      if (parts.length === 2) {
        const br = `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/2026`;
        return timePart ? `${br} ${timePart.slice(0, 5)}` : br;
      }
    }
    return s;
  }

  function isLoteVencido(validadeStr, dataReferencia = null) {
    const dtValidade = parseData(validadeStr, true);
    if (!dtValidade) return true;
    const ref = dataReferencia instanceof Date
      ? dataReferencia
      : (dataReferencia ? (parseData(dataReferencia, false) || new Date()) : new Date());
    return dtValidade.getTime() < ref.getTime();
  }

  // ==========================================================================
  // Autenticação e Autorização (RBAC)
  // ==========================================================================
  function obterUsuarioAutenticado(options = {}, usuarioParam = null) {
    if (usuarioParam && typeof usuarioParam === 'object' && usuarioParam.perfil) {
      return { autenticado: true, user: usuarioParam };
    }

    const authHeader = options?.headers?.Authorization || options?.headers?.authorization || '';
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
      const sessao = window.AuthAPI?.validarToken?.(token);
      if (!sessao || !sessao.user) {
        return { autenticado: false, error: 'Sessão inválida ou expirada. Faça login novamente.' };
      }
      return { autenticado: true, user: sessao.user };
    }

    if (typeof window !== 'undefined' && window.App && 'usuario' in window.App) {
      if (window.App.usuario && window.App.usuario.perfil) {
        return { autenticado: true, user: window.App.usuario };
      }
      const tokenLocal = window.AuthAPI?.getTokenLocal?.();
      if (tokenLocal) {
        const sessao = window.AuthAPI?.validarToken?.(tokenLocal);
        if (sessao && sessao.user) {
          return { autenticado: true, user: sessao.user };
        }
      }
      return { autenticado: false, error: 'Usuário não autenticado. Faça login para realizar esta operação.' };
    }

    const tokenLocal = window.AuthAPI?.getTokenLocal?.();
    if (tokenLocal) {
      const sessao = window.AuthAPI?.validarToken?.(tokenLocal);
      if (sessao && sessao.user) {
        return { autenticado: true, user: sessao.user };
      }
    }

    return { autenticado: false, error: 'Usuário não autenticado. Faça login para realizar esta operação.' };
  }

  // ==========================================================================
  // Controle de Alertas de Estoque e Registro no Log de Sistema
  // ==========================================================================
  function getAlertasLogados() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_ALERTAS_LOG) || '{}');
    } catch {
      return {};
    }
  }

  function persistAlertasLogados(mapa) {
    try {
      localStorage.setItem(STORAGE_ALERTAS_LOG, JSON.stringify(mapa));
    } catch {}
  }

  function registrarLogAlerta(item, nivel, usuario = 'sistema', forcarLog = false) {
    const chave = `${item.lote}|${item.unidade}`;
    const logados = getAlertasLogados();

    if (!forcarLog && logados[chave] === `${nivel}:${item.quantidade}`) {
      return null;
    }

    logados[chave] = `${nivel}:${item.quantidade}`;
    persistAlertasLogados(logados);

    const min = getEstoqueMinimoVacina(item.vacina, item);
    const isCritico = nivel === 'critico';
    const acao = isCritico
      ? `Alerta de Estoque Esgotado (Crítico): ${item.vacina} - Lote ${item.lote}`
      : `Alerta de Baixo Estoque (Atenção): ${item.vacina} - Lote ${item.lote}`;
    const descricao = isCritico
      ? `Estoque esgotado (0 doses disponíveis) para a vacina "${item.vacina}" (Lote ${item.lote}) na "${item.unidade}" (mínimo configurado: ${min} doses).`
      : `Estoque baixo (${item.quantidade} dose(s) disponível(is), mínimo: ${min}) para a vacina "${item.vacina}" (Lote ${item.lote}) na "${item.unidade}".`;

    if (typeof window !== 'undefined' && window.AuditoriaService?.registrar) {
      return window.AuditoriaService.registrar({
        usuario: usuario || 'sistema',
        acao,
        tipo: isCritico ? 'Erro' : 'Aviso',
        modulo: 'VACINAÇÃO',
        descricao
      });
    }
    return null;
  }

  function construirAlertaItem(item) {
    const min = getEstoqueMinimoVacina(item.vacina, item);
    const qtd = Number(item.quantidade || 0);
    if (qtd > min) return null;

    const isCritico = qtd <= 0;
    const nivel = isCritico ? 'critico' : 'atencao';
    const tipo = isCritico ? 'ESTOQUE_ESGOTADO' : 'BAIXO_ESTOQUE';
    const badge = isCritico ? 'b-red' : 'b-yellow';
    const cor = isCritico ? 'danger' : 'warning';
    const titulo = isCritico
      ? `Estoque Esgotado: ${item.vacina} (Lote ${item.lote})`
      : `Baixo Estoque: ${item.vacina} (Lote ${item.lote})`;
    const mensagem = isCritico
      ? `Crítico: Lote ${item.lote} (${item.vacina}) na ${item.unidade} está com estoque esgotado (0 doses).`
      : `Atenção: Lote ${item.lote} (${item.vacina}) na ${item.unidade} possui ${qtd} dose(s) (estoque mínimo: ${min}).`;

    return {
      id: `ALR-${item.lote}-${item.unidade.replace(/\s+/g, '')}`,
      vacina: item.vacina,
      lote: item.lote,
      unidade: item.unidade,
      validade: item.validade,
      quantidade: qtd,
      estoqueMinimo: min,
      nivel,
      tipo,
      badge,
      cor,
      titulo,
      mensagem,
      descricao: mensagem
    };
  }

  /**
   * GET /vacinacao/alertas
   * Lista todos os alertas ativos de estoque (baixo estoque e estoque esgotado).
   */
  function listarAlertas(filtros = {}) {
    const estoque = getEstoque();
    const { vacina, unidade, nivel } = filtros || {};

    const alertas = [];
    for (const item of estoque) {
      const min = getEstoqueMinimoVacina(item.vacina, item);
      if (item.quantidade <= min) {
        const al = construirAlertaItem(item);
        if (al) {
          registrarLogAlerta(item, al.nivel, 'sistema', false);
          alertas.push(al);
        }
      }
    }

    // Ordena: nível crítico primeiro, depois menor quantidade
    alertas.sort((a, b) => {
      if (a.nivel !== b.nivel) return a.nivel === 'critico' ? -1 : 1;
      return a.quantidade - b.quantidade;
    });

    const filtrados = alertas.filter(a => {
      if (vacina && vacina !== 'Todas' && !mesmaVacina(a.vacina, vacina)) return false;
      if (unidade && unidade !== 'Todas' && a.unidade !== Unid.normalizar(unidade)) return false;
      if (nivel && a.nivel !== nivel) return false;
      return true;
    });

    const criticos = filtrados.filter(a => a.nivel === 'critico').length;
    const atencao = filtrados.filter(a => a.nivel === 'atencao').length;

    return {
      success: true,
      total: filtrados.length,
      criticos,
      atencao,
      data: filtrados,
      alertas: filtrados
    };
  }

  /**
   * GET /vacinacao/estoque
   * Lista estoque com filtros por vacina e unidade.
   */
  function listarEstoque(filtros = {}) {
    const estoque = getEstoque();
    const { vacina, unidade, lote, busca } = filtros || {};
    const q = busca ? String(busca).trim().toLowerCase() : '';

    const filtrados = estoque
      .map(item => {
        const min = getEstoqueMinimoVacina(item.vacina, item);
        const vencido = isLoteVencido(item.validade);
        let status = 'Normal';
        let badge = 'b-green';
        let nivelAlerta = null;

        if (vencido) {
          status = 'Lote Vencido';
          badge = 'b-red';
          nivelAlerta = 'vencido';
        } else if (item.quantidade <= 0) {
          status = 'Esgotado (Crítico)';
          badge = 'b-red';
          nivelAlerta = 'critico';
        } else if (item.quantidade <= min) {
          status = 'Baixo Estoque (Atenção)';
          badge = 'b-yellow';
          nivelAlerta = 'atencao';
        }

        return {
          ...item,
          estoqueMinimo: min,
          vencido,
          status,
          badge,
          nivelAlerta
        };
      })
      .filter(item => {
        if (vacina && vacina !== 'Todas' && !mesmaVacina(item.vacina, vacina)) return false;
        if (unidade && unidade !== 'Todas' && item.unidade !== Unid.normalizar(unidade)) return false;
        if (lote && String(item.lote).toLowerCase() !== String(lote).trim().toLowerCase()) return false;
        if (q) {
          const hay = `${item.vacina} ${item.lote} ${item.unidade} ${item.status}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

    const totalDoses = filtrados.reduce((acc, item) => acc + Number(item.quantidade || 0), 0);
    const totalDosesValidas = filtrados
      .filter(i => !i.vencido)
      .reduce((acc, item) => acc + Number(item.quantidade || 0), 0);

    return {
      success: true,
      total: filtrados.length,
      totalDoses,
      totalDosesValidas,
      data: filtrados,
      estoque: filtrados
    };
  }

  /**
   * Lista aplicações registradas com filtros por vacina/campanha, unidade, período e busca.
   */
  function listarAplicacoes(filtros = {}) {
    const lista = getAplicacoes();
    const { vacina, campanha, unidade, dataInicio, dataFim, busca } = filtros || {};
    const q = busca ? String(busca).trim().toLowerCase() : '';
    const dtIni = dataInicio ? parseData(dataInicio, false) : null;
    const dtFim = dataFim ? parseData(dataFim, true) : null;

    const filtradas = lista.filter(app => {
      if (vacina && vacina !== 'Todas') {
        const matchVac = mesmaVacina(app.vacina, vacina) ||
                         String(app.campanha || '').toLowerCase().includes(String(vacina).toLowerCase());
        if (!matchVac) return false;
      }
      if (campanha && campanha !== 'Todas') {
        const matchCamp = String(app.campanha || '').toLowerCase().includes(String(campanha).toLowerCase()) ||
                          mesmaVacina(app.vacina, campanha);
        if (!matchCamp) return false;
      }
      if (unidade && unidade !== 'Todas' && app.unidade !== Unid.normalizar(unidade)) {
        return false;
      }
      if (dtIni || dtFim) {
        const dtItem = parseData(app.data || app.dataHora, false);
        if (dtItem) {
          if (dtIni && dtItem < dtIni) return false;
          if (dtFim && dtItem > dtFim) return false;
        }
      }
      if (q) {
        const hay = `${app.cidadao || app.paciente || ''} ${app.cpf || ''} ${app.vacina || ''} ${app.lote || ''} ${app.dose || ''} ${app.unidade || ''} ${app.profissional || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    return {
      success: true,
      total: filtradas.length,
      data: filtradas,
      aplicacoes: filtradas
    };
  }

  /**
   * Lista campanhas enriquecidas com doses aplicadas, cobertura vacinal e status atualizados.
   */
  function listarCampanhas(filtros = {}) {
    const campanhasBase = getCampanhas();
    const { data: aplicacoesFiltradas } = listarAplicacoes({
      unidade: filtros.unidade,
      dataInicio: filtros.dataInicio,
      dataFim: filtros.dataFim,
      busca: filtros.busca
    });
    const estoqueCompleto = listarEstoque({ unidade: filtros.unidade }).data;

    const { vacina, campanha, dataInicio, dataFim } = filtros || {};
    const dtIni = dataInicio ? parseData(dataInicio, false) : null;
    const dtFim = dataFim ? parseData(dataFim, true) : null;

    const enriquecidas = campanhasBase
      .map(c => {
        const meta = Number(c.populacaoAlvo || c.meta || 10);
        const dosesAplicadas = aplicacoesFiltradas.filter(a =>
          mesmaVacina(a.vacina, c.vacina) ||
          (a.campanha && String(a.campanha).toLowerCase() === String(c.nome).toLowerCase())
        ).length;

        const cobertura = meta > 0 ? Number(((dosesAplicadas / meta) * 100).toFixed(1)) : 0;

        // Verifica estoque disponível para a vacina desta campanha
        const lotesVacina = estoqueCompleto.filter(e => mesmaVacina(e.vacina, c.vacina) && !e.vencido);
        const estoqueDisponivel = lotesVacina.reduce((s, e) => s + Number(e.quantidade || 0), 0);
        const temEsgotado = lotesVacina.some(e => e.quantidade <= 0) || estoqueDisponivel === 0;
        const temBaixo = lotesVacina.some(e => e.quantidade > 0 && e.quantidade <= e.estoqueMinimo);

        let status = 'Ativa';
        let badge = 'b-green';
        if (cobertura >= 100) {
          status = 'Meta Atingida';
          badge = 'b-blue';
        } else if (estoqueDisponivel === 0) {
          status = 'Estoque Esgotado';
          badge = 'b-red';
        } else if (temEsgotado || temBaixo) {
          status = 'Alerta de Estoque';
          badge = 'b-yellow';
        }

        return {
          ...c,
          meta,
          populacaoAlvo: meta,
          dosesAplicadas,
          cobertura,
          estoqueDisponivel,
          status,
          badge
        };
      })
      .filter(c => {
        if (vacina && vacina !== 'Todas') {
          const matchV = mesmaVacina(c.vacina, vacina) ||
                         String(c.nome).toLowerCase().includes(String(vacina).toLowerCase()) ||
                         c.id === vacina;
          if (!matchV) return false;
        }
        if (campanha && campanha !== 'Todas') {
          const matchC = String(c.nome).toLowerCase().includes(String(campanha).toLowerCase()) ||
                         mesmaVacina(c.vacina, campanha) ||
                         c.id === campanha;
          if (!matchC) return false;
        }
        if (dtIni || dtFim) {
          const cIni = parseData(c.dataInicio, false);
          const cFim = parseData(c.dataFim, true);
          if (cIni && cFim) {
            if (dtIni && cFim < dtIni) return false;
            if (dtFim && cIni > dtFim) return false;
          }
        }
        return true;
      });

    return {
      success: true,
      total: enriquecidas.length,
      data: enriquecidas,
      campanhas: enriquecidas
    };
  }

  /**
   * Calcula todos os indicadores do topo da tela a partir dos dados mock (aplicações e estoque):
   *  a) Doses aplicadas (total e por campanha/vacina)
   *  b) Cobertura vacinal (percentual = doses aplicadas / população-alvo da campanha x 100)
   *  c) Estoque (quantidade total disponível de doses e por vacina/lote)
   */
  function getIndicadores(filtros = {}) {
    const { data: campanhas } = listarCampanhas(filtros);
    const { data: aplicacoes } = listarAplicacoes(filtros);
    const { data: estoque } = listarEstoque({
      vacina: filtros.vacina || filtros.campanha,
      unidade: filtros.unidade
    });
    const alertasInfo = listarAlertas({
      vacina: filtros.vacina || filtros.campanha,
      unidade: filtros.unidade
    });

    const dosesAplicadasTotal = aplicacoes.length;
    const populacaoAlvoTotal = campanhas.reduce((acc, c) => acc + Number(c.populacaoAlvo || c.meta || 0), 0);
    const coberturaVacinal = populacaoAlvoTotal > 0
      ? Number(((dosesAplicadasTotal / populacaoAlvoTotal) * 100).toFixed(1))
      : 0;

    // Doses por campanha/vacina
    const dosesPorVacina = {};
    const dosesPorCampanha = {};
    campanhas.forEach(c => {
      dosesPorVacina[c.vacina] = c.dosesAplicadas;
      dosesPorCampanha[c.nome] = c.dosesAplicadas;
    });

    // Estoque total e por vacina/lote
    const estoqueTotal = estoque.reduce((acc, item) => acc + Number(item.quantidade || 0), 0);
    const estoqueValidoTotal = estoque
      .filter(i => !i.vencido)
      .reduce((acc, item) => acc + Number(item.quantidade || 0), 0);

    const estoquePorVacina = {};
    const estoquePorLote = {};
    estoque.forEach(item => {
      estoquePorVacina[item.vacina] = (estoquePorVacina[item.vacina] || 0) + Number(item.quantidade || 0);
      estoquePorLote[item.lote] = {
        vacina: item.vacina,
        lote: item.lote,
        unidade: item.unidade,
        quantidade: Number(item.quantidade || 0),
        validade: item.validade,
        vencido: item.vencido
      };
    });

    const resumoDosesHtml = campanhas
      .map(c => `<span class="stat-breakdown-chip" title="${c.nome}"><strong>${c.vacina.replace(' (Bivalente)', '')}:</strong> ${c.dosesAplicadas}</span>`)
      .join(' ');

    const resumoEstoqueHtml = estoque
      .map(item => `<span class="stat-breakdown-chip" title="${item.vacina} · ${item.unidade} · Val: ${item.validade}"><strong>${item.vacina.replace(' (Bivalente)', '')} (${item.lote}):</strong> ${item.quantidade}</span>`)
      .join(' ');

    const barClassCobertura = coberturaVacinal >= 75
      ? 'bar-green'
      : (coberturaVacinal >= 40 ? 'bar-blue' : 'bar-orange');

    const stats = [
      {
        label: 'Doses Aplicadas',
        icon: '💉',
        iconClass: 'ic-green',
        value: String(dosesAplicadasTotal),
        note: `Em ${campanhas.length} campanha(s) ativa(s)`,
        noteClass: 'note-green',
        extraHtml: resumoDosesHtml || 'Sem aplicações no filtro'
      },
      {
        label: 'Cobertura Vacinal',
        icon: '🛡',
        iconClass: 'ic-teal',
        value: `${coberturaVacinal}%`,
        bar: Math.min(100, coberturaVacinal),
        barClass: barClassCobertura,
        note: `${dosesAplicadasTotal} de ${populacaoAlvoTotal} doses (população-alvo)`,
        noteClass: 'note-muted'
      },
      {
        label: 'Estoque Disponível',
        icon: '📦',
        iconClass: 'ic-blue',
        value: String(estoqueTotal),
        note: `${estoqueValidoTotal} doses válidas · ${estoque.length} lote(s)`,
        noteClass: 'note-muted',
        extraHtml: resumoEstoqueHtml || 'Sem lotes no filtro'
      },
      {
        label: 'Alertas de Estoque',
        icon: '⚠️',
        iconClass: alertasInfo.criticos > 0 ? 'ic-red' : (alertasInfo.atencao > 0 ? 'ic-yellow' : 'ic-green'),
        value: String(alertasInfo.total),
        note: alertasInfo.total > 0
          ? `${alertasInfo.criticos} esgotado(s) · ${alertasInfo.atencao} baixo estoque`
          : 'Estoque regular',
        noteClass: alertasInfo.criticos > 0 ? 'note-red' : (alertasInfo.atencao > 0 ? 'note-orange' : 'note-green'),
        extraHtml: alertasInfo.data.map(a => `<span class="stat-breakdown-chip"><strong>${a.lote}:</strong> ${a.quantidade} dose(s)</span>`).join(' ')
      }
    ];

    return {
      dosesAplicadasTotal,
      dosesPorVacina,
      dosesPorCampanha,
      populacaoAlvoTotal,
      coberturaVacinal,
      estoqueTotal,
      estoqueValidoTotal,
      estoquePorVacina,
      estoquePorLote,
      alertasAtivos: alertasInfo.total,
      alertasCriticos: alertasInfo.criticos,
      alertasAtencao: alertasInfo.atencao,
      stats
    };
  }

  // ==========================================================================
  // 2) ENDPOINT POST /vacinacao/registrar-aplicacao
  // ==========================================================================
  async function registrarAplicacao(dados = {}, opcoesOuUsuario = {}) {
    // 1. Verificar autenticação (401) e perfil autorizado (403)
    const isUserObj = opcoesOuUsuario && typeof opcoesOuUsuario === 'object' && ('perfil' in opcoesOuUsuario);
    const authCheck = obterUsuarioAutenticado(isUserObj ? {} : opcoesOuUsuario, isUserObj ? opcoesOuUsuario : dados?.usuarioLogado);

    if (!authCheck.autenticado || !authCheck.user) {
      window.AuditoriaService?.registrar?.({
        usuario: 'Não autenticado',
        acao: 'Tentativa de Registro de Vacinação sem Autenticação',
        tipo: 'Aviso',
        modulo: 'VACINAÇÃO',
        descricao: 'Tentativa bloqueada (401) no endpoint POST /vacinacao/registrar-aplicacao.'
      });
      return {
        status: 401,
        body: {
          success: false,
          error: authCheck.error || 'Não autenticado: é necessário fazer login para registrar aplicação de vacina.'
        }
      };
    }

    const usuario = authCheck.user;
    const perfil = window.Permissoes?.normalizarPerfil?.(usuario.perfil) || usuario.perfil;
    const permitido = window.Permissoes?.podeRegistrarVacinacao
      ? window.Permissoes.podeRegistrarVacinacao(perfil)
      : ['Administrador', 'Profissional da Saúde', 'Recepção'].includes(perfil);

    if (!permitido) {
      window.AuditoriaService?.registrar?.({
        usuario: usuario.nome || 'Usuário',
        acao: 'Acesso Negado ao Registrar Aplicação de Vacina',
        tipo: 'Aviso',
        modulo: 'VACINAÇÃO',
        descricao: `Usuário "${usuario.nome}" (perfil "${perfil}") tentou registrar aplicação de vacina sem permissão (403).`
      });
      return {
        status: 403,
        body: {
          success: false,
          error: `Acesso negado: o perfil "${perfil}" não tem permissão para registrar aplicação de doses. Apenas Profissional da Saúde, Recepção ou Administrador podem realizar esta ação.`
        }
      };
    }

    // 2. Validação de campos obrigatórios (400)
    const cidadao = String(dados.cidadao || dados.paciente || '').trim();
    const cpf = String(dados.cpf || '').trim();
    const vacina = String(dados.vacina || '').trim();
    const lote = String(dados.lote || '').trim();
    const dose = String(dados.dose || '').trim();
    const unidade = Unid.normalizar(String(dados.unidade || '').trim());
    const profissional = String(dados.profissional || '').trim();
    const dataHoraBruta = String(dados.dataHora || (dados.data && dados.hora ? `${dados.data} ${dados.hora}` : (dados.data || ''))).trim();

    const faltantes = [];
    if (!cidadao) faltantes.push('cidadão');
    if (!vacina) faltantes.push('vacina');
    if (!lote) faltantes.push('lote');
    if (!dose) faltantes.push('dose');
    if (!unidade) faltantes.push('unidade');
    if (!profissional) faltantes.push('profissional');
    if (!dataHoraBruta) faltantes.push('data/hora');

    if (faltantes.length > 0) {
      return {
        status: 400,
        body: {
          success: false,
          error: `Dados inválidos: os seguintes campos obrigatórios não foram preenchidos: ${faltantes.join(', ')}.`
        }
      };
    }

    // 3. Validar se vacina e lote existem (400)
    const estoque = getEstoque();
    const lotesMesmoCodigo = estoque.filter(item =>
      String(item.lote).trim().toLowerCase() === lote.toLowerCase()
    );

    if (lotesMesmoCodigo.length === 0) {
      return {
        status: 400,
        body: {
          success: false,
          error: `Dados inválidos: o lote "${lote}" não existe no cadastro de estoque.`
        }
      };
    }

    const lotesMesmaVacina = lotesMesmoCodigo.filter(item => mesmaVacina(item.vacina, vacina));
    if (lotesMesmaVacina.length === 0) {
      return {
        status: 400,
        body: {
          success: false,
          error: `Dados inválidos: o lote "${lote}" não pertence à vacina "${vacina}".`
        }
      };
    }

    const idxEstoque = estoque.findIndex(item =>
      String(item.lote).trim().toLowerCase() === lote.toLowerCase() &&
      mesmaVacina(item.vacina, vacina) &&
      String(item.unidade).trim().toLowerCase() === unidade.toLowerCase()
    );

    if (idxEstoque === -1) {
      return {
        status: 400,
        body: {
          success: false,
          error: `Dados inválidos: o lote "${lote}" da vacina "${vacina}" não está cadastrado na unidade "${unidade}".`
        }
      };
    }

    const itemEstoque = estoque[idxEstoque];
    const doseNormalizada = normalizarDose(dose);

    // 4. Impedir aplicação duplicada da mesma dose para o mesmo cidadão (409)
    const aplicacoes = getAplicacoes();
    const cidadaoLower = cidadao.toLowerCase();
    const cpfLimpo = cpf.replace(/\D/g, '');

    const duplicada = aplicacoes.find(app => {
      const mesmoNome = String(app.cidadao || app.paciente || '').trim().toLowerCase() === cidadaoLower;
      const appCpfLimpo = String(app.cpf || '').replace(/\D/g, '');
      const mesmoCpf = cpfLimpo.length === 11 && appCpfLimpo.length === 11 && cpfLimpo === appCpfLimpo;
      const mesmoCidadao = mesmoNome || mesmoCpf;
      if (!mesmoCidadao) return false;

      const mesmaVac = mesmaVacina(app.vacina, itemEstoque.vacina);
      const mesmaDose = normalizarDose(app.dose) === doseNormalizada;
      return mesmaVac && mesmaDose;
    });

    if (duplicada) {
      window.AuditoriaService?.registrar?.({
        usuario: usuario.nome || profissional,
        acao: 'Tentativa de Aplicação Duplicada Bloqueada',
        tipo: 'Aviso',
        modulo: 'VACINAÇÃO',
        descricao: `Tentativa de aplicar dose duplicada (${doseNormalizada} de ${itemEstoque.vacina}) para o cidadão "${cidadao}" bloqueada (409).`
      });
      return {
        status: 409,
        body: {
          success: false,
          error: `Aplicação duplicada: o cidadão "${cidadao}" já possui registro da "${doseNormalizada}" para a vacina "${itemEstoque.vacina}".`
        }
      };
    }

    // 5. Validar se o lote está dentro da validade (422)
    if (isLoteVencido(itemEstoque.validade)) {
      window.AuditoriaService?.registrar?.({
        usuario: usuario.nome || profissional,
        acao: 'Tentativa de Aplicação com Lote Vencido',
        tipo: 'Aviso',
        modulo: 'VACINAÇÃO',
        descricao: `Bloqueada aplicação do lote vencido ${itemEstoque.lote} (validade: ${itemEstoque.validade}) para "${cidadao}" (422).`
      });
      return {
        status: 422,
        body: {
          success: false,
          error: `Lote vencido: o lote "${itemEstoque.lote}" venceu em ${itemEstoque.validade} e não pode ser aplicado.`
        }
      };
    }

    // 6. Validar se há estoque disponível > 0 para o lote/vacina na unidade (422)
    if (Number(itemEstoque.quantidade || 0) <= 0) {
      window.AuditoriaService?.registrar?.({
        usuario: usuario.nome || profissional,
        acao: 'Tentativa de Aplicação sem Estoque Disponível',
        tipo: 'Erro',
        modulo: 'VACINAÇÃO',
        descricao: `Bloqueada aplicação de ${itemEstoque.vacina} (Lote ${itemEstoque.lote}) na ${itemEstoque.unidade}: estoque esgotado (0 doses) (422).`
      });
      return {
        status: 422,
        body: {
          success: false,
          error: `Estoque insuficiente: o lote "${itemEstoque.lote}" da vacina "${itemEstoque.vacina}" está esgotado (0 doses disponíveis) na "${itemEstoque.unidade}".`
        }
      };
    }

    // 7. Baixar 1 dose do estoque e gravar a aplicação
    itemEstoque.quantidade = Number(itemEstoque.quantidade) - 1;
    estoque[idxEstoque] = itemEstoque;
    persistEstoque(estoque);

    const campanhas = getCampanhas();
    const campAssociada = campanhas.find(c => mesmaVacina(c.vacina, itemEstoque.vacina));
    const dataHoraFormatada = formatarDataBR(dataHoraBruta);
    const [dataParte, horaParte] = dataHoraFormatada.split(' ');

    const novaAplicacao = {
      id: `APL-${1000 + aplicacoes.length + 1}`,
      cidadao,
      paciente: cidadao,
      cpf,
      vacina: itemEstoque.vacina,
      campanha: dados.campanha || campAssociada?.nome || itemEstoque.vacina,
      lote: itemEstoque.lote,
      dose: doseNormalizada,
      unidade: itemEstoque.unidade,
      profissional,
      dataHora: dataHoraFormatada,
      data: dataParte || dataHoraFormatada,
      hora: horaParte || '12:00',
      registradoPor: usuario.nome || profissional,
      criadoEm: new Date().toISOString()
    };

    aplicacoes.unshift(novaAplicacao);
    persistAplicacoes(aplicacoes);

    // 8. Registrar a ação de aplicação no Log de Sistema (usuário, ação, data/hora)
    const operadorLog = usuario.nome || profissional;
    window.AuditoriaService?.registrar?.({
      usuario: operadorLog,
      acao: 'Registro de Aplicação de Vacina',
      dataHora: dataHoraFormatada,
      tipo: 'Informação',
      modulo: 'VACINAÇÃO',
      descricao: `Aplicada ${doseNormalizada} da vacina "${itemEstoque.vacina}" (Lote ${itemEstoque.lote}) no cidadão "${cidadao}" na "${itemEstoque.unidade}" pelo profissional "${profissional}". Estoque restante do lote: ${itemEstoque.quantidade} dose(s).`
    });

    // 9. Verificar se atingiu baixo estoque (<= mínimo) ou estoque esgotado (0) e gerar alerta + log
    const min = getEstoqueMinimoVacina(itemEstoque.vacina, itemEstoque);
    let alertaGerado = null;
    if (itemEstoque.quantidade === 0) {
      alertaGerado = construirAlertaItem(itemEstoque);
      registrarLogAlerta(itemEstoque, 'critico', operadorLog, true);
    } else if (itemEstoque.quantidade <= min) {
      alertaGerado = construirAlertaItem(itemEstoque);
      registrarLogAlerta(itemEstoque, 'atencao', operadorLog, true);
    }

    const indicadores = getIndicadores();
    const alertas = listarAlertas().data;
    sincronizarAppData();

    return {
      status: 201,
      body: {
        success: true,
        message: `Aplicação de ${itemEstoque.vacina} (${doseNormalizada}) registrada com sucesso para ${cidadao}!`,
        aplicacao: novaAplicacao,
        estoqueAtual: itemEstoque,
        alertaGerado,
        indicadores,
        alertas
      }
    };
  }

  // ==========================================================================
  // 3) ENDPOINT POST /vacinacao/estoque/entrada (Restrito a Administrador)
  // ==========================================================================
  async function registrarEntradaEstoque(dados = {}, opcoesOuUsuario = {}) {
    const isUserObj = opcoesOuUsuario && typeof opcoesOuUsuario === 'object' && ('perfil' in opcoesOuUsuario);
    const authCheck = obterUsuarioAutenticado(isUserObj ? {} : opcoesOuUsuario, isUserObj ? opcoesOuUsuario : dados?.usuarioLogado);

    if (!authCheck.autenticado || !authCheck.user) {
      window.AuditoriaService?.registrar?.({
        usuario: 'Não autenticado',
        acao: 'Tentativa de Entrada de Estoque sem Autenticação',
        tipo: 'Aviso',
        modulo: 'VACINAÇÃO',
        descricao: 'Tentativa bloqueada (401) no endpoint POST /vacinacao/estoque/entrada.'
      });
      return {
        status: 401,
        body: {
          success: false,
          error: authCheck.error || 'Não autenticado: faça login para registrar entrada de lote.'
        }
      };
    }

    const usuario = authCheck.user;
    const perfil = window.Permissoes?.normalizarPerfil?.(usuario.perfil) || usuario.perfil;
    const ehAdmin = window.Permissoes?.podeGerenciarEstoqueVacina
      ? window.Permissoes.podeGerenciarEstoqueVacina(perfil)
      : perfil === 'Administrador';

    if (!ehAdmin) {
      window.AuditoriaService?.registrar?.({
        usuario: usuario.nome || 'Usuário',
        acao: 'Acesso Negado na Entrada de Lote de Vacina',
        tipo: 'Aviso',
        modulo: 'VACINAÇÃO',
        descricao: `Usuário "${usuario.nome}" (perfil "${perfil}") tentou registrar entrada de lote sem permissão de Administrador (403).`
      });
      return {
        status: 403,
        body: {
          success: false,
          error: `Acesso negado: o perfil "${perfil}" não possui permissão para registrar entrada de lote. Operação restrita a Administrador.`
        }
      };
    }

    const vacina = String(dados.vacina || '').trim();
    const lote = String(dados.lote || '').trim().toUpperCase();
    const validade = String(dados.validade || '').trim();
    const unidade = Unid.normalizar(String(dados.unidade || '').trim());
    const quantidade = Number(dados.quantidade);
    const estoqueMinimoInformado = dados.estoqueMinimo != null && dados.estoqueMinimo !== ''
      ? Number(dados.estoqueMinimo)
      : null;

    const faltantes = [];
    if (!vacina) faltantes.push('vacina');
    if (!lote) faltantes.push('lote');
    if (!validade) faltantes.push('validade');
    if (!unidade) faltantes.push('unidade');
    if (dados.quantidade == null || dados.quantidade === '' || isNaN(quantidade)) faltantes.push('quantidade');

    if (faltantes.length > 0) {
      return {
        status: 400,
        body: {
          success: false,
          error: `Dados inválidos: preencha os campos obrigatórios (${faltantes.join(', ')}).`
        }
      };
    }

    if (quantidade <= 0 || !Number.isInteger(quantidade)) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Dados inválidos: a quantidade de entrada deve ser um número inteiro maior que zero.'
        }
      };
    }

    if (!parseData(validade, true)) {
      return {
        status: 400,
        body: {
          success: false,
          error: 'Dados inválidos: informe uma data de validade válida.'
        }
      };
    }

    if (isLoteVencido(validade)) {
      return {
        status: 422,
        body: {
          success: false,
          error: `Não é permitido registrar entrada de um lote já vencido (validade informada: ${formatarDataBR(validade)}).`
        }
      };
    }

    const estoque = getEstoque();
    const validadeBR = formatarDataBR(validade).split(' ')[0];
    const minPadrao = estoqueMinimoInformado != null && !isNaN(estoqueMinimoInformado) && estoqueMinimoInformado >= 0
      ? estoqueMinimoInformado
      : getEstoqueMinimoVacina(vacina);

    if (estoqueMinimoInformado != null && !isNaN(estoqueMinimoInformado) && estoqueMinimoInformado >= 0) {
      definirEstoqueMinimo(vacina, estoqueMinimoInformado);
    }

    const idxExistente = estoque.findIndex(item =>
      String(item.lote).trim().toLowerCase() === lote.toLowerCase() &&
      String(item.unidade).trim().toLowerCase() === unidade.toLowerCase()
    );

    let itemFinal;
    if (idxExistente !== -1) {
      estoque[idxExistente].quantidade = Number(estoque[idxExistente].quantidade || 0) + quantidade;
      estoque[idxExistente].validade = validadeBR;
      estoque[idxExistente].vacina = vacina;
      estoque[idxExistente].estoqueMinimo = minPadrao;
      itemFinal = estoque[idxExistente];
    } else {
      itemFinal = {
        id: `EST-${String(estoque.length + 1).padStart(3, '0')}`,
        vacina,
        lote,
        validade: validadeBR,
        quantidade,
        estoqueMinimo: minPadrao,
        unidade
      };
      estoque.unshift(itemFinal);
    }

    persistEstoque(estoque);

    window.AuditoriaService?.registrar?.({
      usuario: usuario.nome || 'Administrador',
      acao: 'Entrada de Lote de Vacina no Estoque',
      tipo: 'Informação',
      modulo: 'VACINAÇÃO',
      descricao: `Entrada de +${quantidade} dose(s) para a vacina "${vacina}" (Lote ${lote}, validade ${validadeBR}) na "${unidade}". Saldo atual do lote: ${itemFinal.quantidade} dose(s).`
    });

    // Se mesmo após entrada o lote ainda estiver <= mínimo, registra alerta
    if (itemFinal.quantidade <= itemFinal.estoqueMinimo) {
      const nv = itemFinal.quantidade === 0 ? 'critico' : 'atencao';
      registrarLogAlerta(itemFinal, nv, usuario.nome || 'Administrador', true);
    }

    const indicadores = getIndicadores();
    const alertas = listarAlertas().data;
    sincronizarAppData();

    return {
      status: 201,
      body: {
        success: true,
        message: `Entrada do lote ${lote} (+${quantidade} doses de ${vacina}) registrada com sucesso!`,
        lote: itemFinal,
        indicadores,
        alertas
      }
    };
  }

  // ==========================================================================
  // Sincronização com window.App.data.vacinacao
  // ==========================================================================
  function obterDadosTela(filtros = {}) {
    const indicadores = getIndicadores(filtros);
    const campanhas = listarCampanhas(filtros).data;
    const estoque = listarEstoque({
      vacina: filtros.vacina || filtros.campanha,
      unidade: filtros.unidade,
      busca: filtros.busca
    }).data;
    const aplicacoes = listarAplicacoes(filtros).data;
    const alertas = listarAlertas({
      vacina: filtros.vacina || filtros.campanha,
      unidade: filtros.unidade
    }).data;

    return {
      layout: 'vacinacao',
      titulo: 'Campanha de Vacinação',
      breadcrumb: 'Administração › Vacinação',
      subtitulo: 'Monitoramento de campanhas, cobertura vacinal, controle de lotes em estoque e registro de aplicações.',
      boxes: {
        stats: indicadores.stats,
        indicadores,
        campanhas,
        estoque,
        aplicacoes,
        alertas
      }
    };
  }

  function sincronizarAppData() {
    if (typeof window === 'undefined' || !window.App) return;
    if (!window.App.data) window.App.data = {};
    window.App.data.vacinacao = obterDadosTela();
  }

  function resetarParaSeed() {
    localStorage.removeItem(STORAGE_ALERTAS_LOG);
    persistMinimos(seedMinimosInicial());
    persistCampanhas(seedCampanhasInicial());
    persistEstoque(seedEstoqueInicial());
    persistAplicacoes(seedAplicacoesInicial());
    sincronizarAppData();
  }

  // ==========================================================================
  // Interceptor de fetch para os endpoints de vacinação
  // ==========================================================================
  function registrarInterceptor() {
    if (typeof window === 'undefined' || !window.fetch) return;
    if (window.fetch._vacinacaoInterceptado) return;

    const originalFetch = window.fetch.bind(window);

    const wrappedFetch = async function (url, options = {}) {
      const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
      const method = (options.method || 'GET').toUpperCase();

      // POST /vacinacao/registrar-aplicacao
      if (Http.exata(url, '/vacinacao/registrar-aplicacao')) {
        if (method !== 'POST') {
          return new Response(JSON.stringify({ success: false, error: 'Método não permitido. Use POST.' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        let body = {};
        try {
          body = typeof options.body === 'string' ? JSON.parse(options.body || '{}') : (options.body || {});
        } catch {
          return new Response(JSON.stringify({ success: false, error: 'JSON inválido no corpo da requisição.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        const res = await registrarAplicacao(body, options);
        return new Response(JSON.stringify(res.body), {
          status: res.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // POST /vacinacao/estoque/entrada
      if (Http.exata(url, '/vacinacao/estoque/entrada')) {
        if (method !== 'POST') {
          return new Response(JSON.stringify({ success: false, error: 'Método não permitido. Use POST.' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        let body = {};
        try {
          body = typeof options.body === 'string' ? JSON.parse(options.body || '{}') : (options.body || {});
        } catch {
          return new Response(JSON.stringify({ success: false, error: 'JSON inválido no corpo da requisição.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        const res = await registrarEntradaEstoque(body, options);
        return new Response(JSON.stringify(res.body), {
          status: res.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // GET /vacinacao/estoque
      if (Http.exata(url, '/vacinacao/estoque') && method === 'GET') {
        const u = new URL(urlStr, 'http://localhost');
        const filtros = Object.fromEntries(u.searchParams.entries());
        const res = listarEstoque(filtros);
        return new Response(JSON.stringify(res), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // GET /vacinacao/alertas
      if (Http.exata(url, '/vacinacao/alertas') && method === 'GET') {
        const u = new URL(urlStr, 'http://localhost');
        const filtros = Object.fromEntries(u.searchParams.entries());
        const res = listarAlertas(filtros);
        return new Response(JSON.stringify(res), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // GET /vacinacao/indicadores
      if (Http.exata(url, '/vacinacao/indicadores') && method === 'GET') {
        const u = new URL(urlStr, 'http://localhost');
        const filtros = Object.fromEntries(u.searchParams.entries());
        const res = getIndicadores(filtros);
        return new Response(JSON.stringify({ success: true, indicadores: res }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // GET /vacinacao/campanhas
      if (Http.exata(url, '/vacinacao/campanhas') && method === 'GET') {
        const u = new URL(urlStr, 'http://localhost');
        const filtros = Object.fromEntries(u.searchParams.entries());
        const res = listarCampanhas(filtros);
        return new Response(JSON.stringify(res), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // GET /vacinacao/aplicacoes
      if (Http.exata(url, '/vacinacao/aplicacoes') && method === 'GET') {
        const u = new URL(urlStr, 'http://localhost');
        const filtros = Object.fromEntries(u.searchParams.entries());
        const res = listarAplicacoes(filtros);
        return new Response(JSON.stringify(res), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return originalFetch(url, options);
    };

    wrappedFetch._vacinacaoInterceptado = true;
    window.fetch = wrappedFetch;
  }

  if (typeof window !== 'undefined') {
    registrarInterceptor();
  }

  return {
    STORAGE_ESTOQUE,
    STORAGE_APLICACOES,
    STORAGE_CAMPANHAS,
    STORAGE_MINIMOS,
    seedMinimosInicial,
    seedCampanhasInicial,
    seedEstoqueInicial,
    seedAplicacoesInicial,
    getMinimos,
    getEstoqueMinimoVacina,
    definirEstoqueMinimo,
    getCampanhas,
    persistCampanhas,
    getEstoque,
    persistEstoque,
    getAplicacoes,
    persistAplicacoes,
    listarEstoque,
    listarAlertas,
    listarAplicacoes,
    listarCampanhas,
    getIndicadores,
    registrarAplicacao,
    registrarEntradaEstoque,
    obterDadosTela,
    sincronizarAppData,
    resetarParaSeed,
    isLoteVencido,
    normalizarDose,
    mesmaVacina,
    parseData,
    formatarDataBR,
    registrarInterceptor
  };
})();

if (typeof window !== 'undefined') {
  window.VacinacaoAPI = VacinacaoAPI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VacinacaoAPI;
}
