/**
 * ============================================================================
 * DashboardAPI — endpoint agregador da Visão Geral do Sistema.
 * ============================================================================
 *
 *   GET /dashboard/indicadores?ano=&mes=     (perfis com acesso ao Dashboard)
 *     200: { success: true, indicadores: {
 *              agendamentosHoje, examesPendentes, taxaComparecimento,
 *              totalCidadaos, alertas: [...], calendario: { 'aaaa-mm-dd': n },
 *              proximosAtendimentos: [...] } }
 *
 * Os números vêm sempre das APIs de cada módulo (agendamentos, consultas,
 * exames, unidades, vacinação e auditoria) — nada é fixo no JSON da tela.
 *
 * DEFINIÇÕES
 *   - Agendamentos do dia: agendamentos com data de hoje, exceto cancelados.
 *   - Exames pendentes: exames ainda não concluídos.
 *   - Taxa de comparecimento: consultas em que o paciente compareceu
 *     (Aguardando, Em Andamento, Concluída) ÷ (essas + Não Compareceu).
 *     Agendadas e canceladas não entram. Sem base de cálculo → null.
 * ============================================================================
 */
const DashboardAPI = (() => {
  const COMPARECEU = ['Aguardando', 'Em Andamento', 'Concluída'];
  const pad = (n) => String(n).padStart(2, '0');

  function parseBR(data, hora = '00:00') {
    const p = String(data || '').split('/');
    if (p.length !== 3) return null;
    const [h, m] = String(hora || '00:00').split(':').map(n => parseInt(n, 10) || 0);
    const d = new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10), h, m);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const chaveDia = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const agendamentos = () => window.AgendamentosAPI?.getAll() || [];
  const ativos = () => agendamentos().filter(a => a.status !== 'Cancelado');

  function contarAgendamentosHoje(agora) {
    const hoje = chaveDia(agora);
    return ativos().filter(a => {
      const d = parseBR(a.data);
      return d && chaveDia(d) === hoje;
    }).length;
  }

  function contarExamesPendentes() {
    return (window.ExamesAPI?.getAll() || []).filter(e => {
      const st = String(e.status || '').toLowerCase();
      return !st.includes('concl') && !st.includes('laudo emit');
    }).length;
  }

  function calcularTaxaComparecimento() {
    const consultas = window.ConsultasAPI?.getAll() || [];
    const compareceram = consultas.filter(c => COMPARECEU.includes(c.status)).length;
    const faltaram = consultas.filter(c => c.status === 'Não Compareceu').length;
    const base = compareceram + faltaram;
    return base === 0 ? null : Number(((compareceram / base) * 100).toFixed(1));
  }

  function getAlertas(agora = new Date()) {
    const alertas = [];

    for (const v of window.VacinacaoAPI?.getAlertas() || []) {
      alertas.push({
        nivel: 'red', origem: 'vacinacao',
        titulo: v.situacao === 'Esgotado' ? `${v.nome}: estoque esgotado` : `${v.nome}: estoque crítico`,
        descricao: `${v.estoque} doses (mínimo ${v.estoqueMinimo}).`
      });
    }

    const atrasados = (window.ExamesAPI?.getAll() || []).filter(e => window.ExamesAPI.isAtrasado(e, agora));
    if (atrasados.length > 0) {
      alertas.push({
        nivel: 'red', origem: 'exames',
        titulo: `${atrasados.length} exame${atrasados.length > 1 ? 's' : ''} com prazo expirado`,
        descricao: atrasados.slice(0, 3).map(e => `${e.id} (${e.tipo})`).join(', ')
      });
    }

    for (const u of window.UnidadesAPI?.getAll() || []) {
      if (u.status !== 'Operacional') {
        alertas.push({ nivel: 'warn', origem: 'unidades', titulo: `${u.nome} fora de operação`, descricao: u.observacao || `Status: ${u.status}.` });
      } else if (Number(u.ocupacao) >= 85) {
        alertas.push({ nivel: 'warn', origem: 'unidades', titulo: `${u.nome} com ${u.ocupacao}% de ocupação`, descricao: 'Capacidade em atenção.' });
      }
    }

    const hoje = `${pad(agora.getDate())}/${pad(agora.getMonth() + 1)}/${agora.getFullYear()}`;
    const bloqueios = (window.AuditoriaService?.getAll() || []).filter(l => l.acao === 'Conta bloqueada' && l.data === hoje);
    if (bloqueios.length > 0) {
      alertas.push({ nivel: 'warn', origem: 'seguranca', titulo: `${bloqueios.length} conta(s) bloqueada(s) hoje`, descricao: 'Excesso de senhas incorretas — verifique os Logs.' });
    }

    return alertas.sort((a, b) => (a.nivel === 'red' ? 0 : 1) - (b.nivel === 'red' ? 0 : 1));
  }

  /** Agendamentos ativos por dia do mês (mes: 0–11). */
  function getCalendario(ano, mes) {
    const dias = {};
    for (const a of ativos()) {
      const d = parseBR(a.data);
      if (!d || d.getFullYear() !== ano || d.getMonth() !== mes) continue;
      const k = chaveDia(d);
      dias[k] = (dias[k] || 0) + 1;
    }
    return dias;
  }

  function getProximosAtendimentos(agora = new Date(), limite = 5) {
    const hoje = chaveDia(agora);
    const amanha = chaveDia(new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1));
    return ativos()
      .map(a => ({ a, quando: parseBR(a.data, a.horario || a.hora) }))
      .filter(x => x.quando && x.quando >= agora)
      .sort((x, y) => x.quando - y.quando)
      .slice(0, limite)
      .map(({ a, quando }) => {
        const k = chaveDia(quando);
        return {
          id: a.id,
          periodo: k === hoje ? 'HOJE' : k === amanha ? 'AMANHÃ' : a.data.slice(0, 5),
          horario: a.horario || a.hora,
          nome: a.medico,
          paciente: a.paciente,
          descricao: `${a.especialidade || ''} · ${a.unidade || ''}`
        };
      });
  }

  function getIndicadores(agora = new Date(), { ano, mes } = {}) {
    const usuarios = window.UsuariosAPI?.getAll() || [];
    return {
      agendamentosHoje: contarAgendamentosHoje(agora),
      examesPendentes: contarExamesPendentes(),
      taxaComparecimento: calcularTaxaComparecimento(),
      totalCidadaos: usuarios.filter(u => u.perfil === 'Cidadão' || u.perfil === 'Paciente').length,
      alertas: getAlertas(agora),
      calendario: getCalendario(ano ?? agora.getFullYear(), mes ?? agora.getMonth()),
      proximosAtendimentos: getProximosAtendimentos(agora)
    };
  }

  let interceptado = false;
  function registrarInterceptor() {
    if (typeof window === 'undefined' || !window.fetch || interceptado) return;
    interceptado = true;
    const originalFetch = window.fetch;
    window.fetch = async function (url, options = {}) {
      const Http = window.Http;
      if (!Http || Http.caminho(url) !== '/dashboard/indicadores') return originalFetch(url, options);
      if (Http.metodo(options) !== 'GET') return Http.json(405, { success: false, error: 'Método não permitido.' });
      const acesso = Http.autorizar(options, { pagina: 'dashboard' });
      if (!acesso.permitido) return Http.negado(acesso);
      const p = Http.parametros(url);
      const periodo = {};
      if (p.ano !== undefined && p.mes !== undefined) {
        periodo.ano = parseInt(p.ano, 10);
        periodo.mes = parseInt(p.mes, 10);
      }
      return Http.json(200, { success: true, indicadores: getIndicadores(new Date(), periodo) });
    };
  }

  if (typeof window !== 'undefined') {
    registrarInterceptor();
  }

  return { getIndicadores, getAlertas, getCalendario, getProximosAtendimentos, calcularTaxaComparecimento, registrarInterceptor };
})();

if (typeof window !== 'undefined') {
  window.DashboardAPI = DashboardAPI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DashboardAPI;
}
