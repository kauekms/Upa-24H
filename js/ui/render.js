/**
 * ============================================================================
 * Render — desenha cards, tabelas e painéis de cada tela a partir dos dados.
 * ============================================================================
 *
 * Regra de ouro deste arquivo: TODO dado vindo de usuário/API passa por
 * esc() antes de ir para innerHTML. Antes nada era escapado e um nome como
 * `<img src=x onerror=...>` executava código na tela de quem abrisse a lista.
 * ============================================================================
 */
const esc = v => Util.esc(v);

/** Ícones (SVG de traço) usados nos cards de indicadores. */
const ICONES_STATS = {
  calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  estetoscopio: '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
  frasco: '<path d="M9 3h6M10 3v6.5L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9.5V3"/>',
  alerta: '<path d="m10.3 3.9-8.2 14.2A2 2 0 0 0 3.8 21h16.4a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  pessoas: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  grafico: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
  documento: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/>',
  chave: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
  hospital: '<path d="M3 21h18M5 21V7l7-4 7 4v14M10 9h4M12 7v4"/>',
  chave_inglesa: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
  cama: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>',
  seringa: '<path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6"/>',
  escudo: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  caixa: '<path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>'
};

const ICONE_POR_EMOJI = {
  '📅': 'calendario', '✅': 'check', '✔': 'check', '⏳': 'relogio', '⏱': 'relogio', '✖': 'x', '❌': 'x',
  '🩺': 'estetoscopio', '🔬': 'frasco', '🧪': 'frasco', '📋': 'documento', '⚠': 'alerta', '⚠️': 'alerta',
  '🚨': 'alerta', '👥': 'pessoas', '📈': 'grafico', '📊': 'grafico', '📝': 'documento', '🔑': 'chave',
  '👤': 'chave', '🏥': 'hospital', '🔧': 'chave_inglesa', '🛏': 'cama', '💉': 'seringa', '🛡': 'escudo', '📦': 'caixa'
};

function iconeStat(emoji) {
  const nome = ICONE_POR_EMOJI[String(emoji || '').trim()];
  if (!nome) return esc(emoji || '');
  return `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">${ICONES_STATS[nome]}</svg>`;
}

function linhaVazia(colunas, mensagem, icone = '🔍') {
  return `<tr class="linha-vazia"><td colspan="${colunas}">
    <div class="estado-vazio"><div class="estado-icone">${icone}</div><span>${esc(mensagem)}</span></div>
  </td></tr>`;
}

const Render = {
  _itensPorPagina: 10,
  _paginaAtual: {},
  _logsExibidos: [],

  badge(status, cls) {
    return `<span class="badge ${esc(cls || 'b-gray')}">${esc(status)}</span>`;
  },

  definirItensPorPagina(n) {
    const v = parseInt(n, 10);
    if (v > 0) this._itensPorPagina = v;
  },

  // --------------------------------------------------------------------------
  // Paginação
  // --------------------------------------------------------------------------
  resetarPaginacao(pageId) {
    this._paginaAtual[pageId] = 1;
  },

  paginar(listaCompleta, pageId) {
    const tamanho = this._itensPorPagina;
    const total = listaCompleta.length;
    const totalPaginas = Math.max(1, Math.ceil(total / tamanho));
    let atual = this._paginaAtual[pageId] || 1;
    atual = Math.min(Math.max(atual, 1), totalPaginas);
    this._paginaAtual[pageId] = atual;
    const inicio = (atual - 1) * tamanho;
    return { itens: listaCompleta.slice(inicio, inicio + tamanho), atual, totalPaginas, total, inicio };
  },

  _paginasComElipse(atual, totalPaginas) {
    const numeros = [...new Set([1, totalPaginas, atual - 1, atual, atual + 1])]
      .filter(n => n >= 1 && n <= totalPaginas)
      .sort((a, b) => a - b);
    const saida = [];
    let anterior = 0;
    for (const n of numeros) {
      if (anterior && n - anterior > 1) saida.push('…');
      saida.push(n);
      anterior = n;
    }
    return saida;
  },

  montarPaginacao(container, { pageId, total, atual, totalPaginas, rerender }) {
    if (!container) return;
    const tamanho = this._itensPorPagina;
    const info = container.querySelector('.page-info');
    if (info) {
      info.textContent = total === 0
        ? 'Nenhum registro'
        : `${(atual - 1) * tamanho + 1}–${Math.min(atual * tamanho, total)} de ${total}`;
    }

    const btns = container.querySelector('.page-btns');
    if (!btns) return;
    if (totalPaginas <= 1) {
      btns.innerHTML = '';
      return;
    }

    const paginas = this._paginasComElipse(atual, totalPaginas);
    btns.innerHTML = `
      <button class="page-btn" data-pg="prev" type="button" aria-label="Página anterior" ${atual <= 1 ? 'disabled' : ''}>‹</button>
      ${paginas.map(p => p === '…'
        ? '<span class="page-btn page-ellipsis">…</span>'
        : `<button class="page-btn${p === atual ? ' active' : ''}" data-pg="${p}" type="button" ${p === atual ? 'aria-current="page"' : ''}>${p}</button>`
      ).join('')}
      <button class="page-btn" data-pg="next" type="button" aria-label="Próxima página" ${atual >= totalPaginas ? 'disabled' : ''}>›</button>`;

    btns.querySelectorAll('[data-pg]').forEach(btn => {
      btn.addEventListener('click', () => {
        let alvo = btn.dataset.pg;
        if (alvo === 'prev') alvo = atual - 1;
        else if (alvo === 'next') alvo = atual + 1;
        else alvo = parseInt(alvo, 10);
        if (alvo >= 1 && alvo <= totalPaginas && alvo !== atual) {
          this._paginaAtual[pageId] = alvo;
          rerender();
        }
      });
    });
  },

  // --------------------------------------------------------------------------
  // Componentes comuns
  // --------------------------------------------------------------------------
  renderStats(container, stats) {
    if (!container || !stats) return;
    container.innerHTML = stats.map(s => {
      const note = s.note ? `<div class="stat-note ${esc(s.noteClass || 'note-muted')}">${esc(s.note)}</div>` : '';
      const bar = s.bar != null
        ? `<div class="stat-bar"><div class="stat-bar-fill ${esc(s.barClass || 'bar-blue')}" style="width:${Math.min(100, Math.max(0, Number(s.bar) || 0))}%"></div></div>`
        : '';
      // extraHtml é montado pela VacinacaoAPI (conteúdo interno, não digitado por usuário)
      const extra = s.extraHtml ? `<div class="stat-extra">${s.extraHtml}</div>` : '';
      return `<div class="stat-card">
        <div class="stat-top">
          <span class="stat-icon ${esc(s.iconClass || 'ic-blue')}">${iconeStat(s.icon)}</span>
          <span class="stat-label">${esc(s.label)}</span>
        </div>
        <div class="stat-value">${esc(s.value)}</div>
        ${bar}${note}${extra}
      </div>`;
    }).join('');
  },

  renderPage(pageId, data, usuario) {
    const root = document.getElementById('screen-container');
    if (!root || !data) return;

    // Os cards agregados de Agendamentos/Consultas/Exames mostram números de
    // toda a equipe — ficam ocultos na visão individual do Cidadão.
    const statsEl = root.querySelector('[data-box="stats"]');
    if (statsEl) {
      const ocultar = Util.ehCidadao(usuario) && ['agendamentos', 'consultas', 'exames'].includes(pageId);
      statsEl.hidden = ocultar;
      if (!ocultar && data.boxes?.stats) this.renderStats(statsEl, data.boxes.stats);
    }

    if (data.subtitulo) {
      const sub = root.querySelector('.page-sub');
      if (sub) sub.textContent = data.subtitulo.replace('{usuario}', usuario?.nome || '');
    }

    const renderers = {
      dashboard: () => this.renderDashboard(root, data, usuario),
      agendamentos: () => this.renderAgendamentos(root, data),
      consultas: () => this.renderConsultas(root, data),
      exames: () => this.renderExames(root, data),
      vacinacao: () => this.renderVacinacao(root, data),
      unidades: () => this.renderUnidades(root, data),
      logs: () => this.renderLogs(root, data),
      configuracoes: () => this.renderConfiguracoes(root, data, usuario),
      perfil: () => this.renderPerfil(root, usuario),
      'cadastro-usuarios': () => this.renderCadastroUsuarios(root, data)
    };
    renderers[pageId]?.();
    if (Util.ehCidadao(usuario)) root.querySelector('.page')?.classList?.add('visao-cidadao');
  },

  // --------------------------------------------------------------------------
  // Dashboard
  // --------------------------------------------------------------------------
  _calendario: null,

  renderCalendario(root) {
    const hoje = new Date();
    if (!this._calendario) this._calendario = { ano: hoje.getFullYear(), mes: hoje.getMonth(), selecionado: null };
    const { ano, mes } = this._calendario;
    const nomesMes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mesEl = root.querySelector('[data-box="cal-mes"]');
    if (mesEl) mesEl.textContent = `${nomesMes[mes]} ${ano}`;

    const agendamentos = (window.App?.data?.agendamentos?.boxes?.lista || []).filter(a => a.status !== 'Cancelado');
    const porDia = {};
    agendamentos.forEach(a => {
      const chave = Util.brParaISO(a.data);
      porDia[chave] = (porDia[chave] || 0) + 1;
    });

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
    const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();
    const celulas = [];
    for (let i = primeiroDiaSemana - 1; i >= 0; i--) celulas.push({ dia: totalDiasMesAnterior - i, outroMes: true });
    for (let d = 1; d <= totalDiasMes; d++) celulas.push({ dia: d, outroMes: false });
    let prox = 1;
    while (celulas.length % 7 !== 0) celulas.push({ dia: prox++, outroMes: true });

    const diasEl = root.querySelector('[data-box="cal-dias"]');
    if (diasEl) {
      const hojeISO = Util.dataLocalISO(hoje);
      diasEl.innerHTML = celulas.map(c => {
        if (c.outroMes) return `<span class="cal-day muted">${c.dia}</span>`;
        const chave = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(c.dia).padStart(2, '0')}`;
        const classes = ['cal-day'];
        if (this._calendario.selecionado === chave) classes.push('selected');
        else if (chave === hojeISO) classes.push('today');
        if (porDia[chave]) classes.push('has-evento');
        const titulo = porDia[chave] ? `${porDia[chave]} agendamento(s)` : 'Sem agendamentos';
        return `<button type="button" class="${classes.join(' ')}" data-cal-dia="${chave}" title="${titulo}">${c.dia}</button>`;
      }).join('');

      diasEl.querySelectorAll('[data-cal-dia]').forEach(el => {
        el.addEventListener('click', () => {
          const chave = el.dataset.calDia;
          this._calendario.selecionado = chave;
          this.renderCalendario(root);
          const n = porDia[chave] || 0;
          window.App?.toast(n
            ? `${n} agendamento${n > 1 ? 's' : ''} em ${Util.isoParaBR(chave)}.`
            : `Nenhum agendamento em ${Util.isoParaBR(chave)}.`, n ? 'info' : 'warning');
        });
      });
    }

    const mudarMes = delta => {
      const c = this._calendario;
      c.mes += delta;
      if (c.mes < 0) { c.mes = 11; c.ano--; }
      if (c.mes > 11) { c.mes = 0; c.ano++; }
      this.renderCalendario(root);
    };
    const btnPrev = root.querySelector('#cal-btn-prev');
    const btnNext = root.querySelector('#cal-btn-next');
    const btnHoje = root.querySelector('#cal-btn-hoje');
    if (btnPrev) btnPrev.onclick = () => mudarMes(-1);
    if (btnNext) btnNext.onclick = () => mudarMes(1);
    if (btnHoje) btnHoje.onclick = () => {
      this._calendario = { ano: hoje.getFullYear(), mes: hoje.getMonth(), selecionado: null };
      this.renderCalendario(root);
    };
  },

  renderDashboard(root, data, usuario) {
    const titulo = root.querySelector('[data-box="saudacao"]');
    if (titulo && usuario) {
      const h = new Date().getHours();
      const saudacao = h < 12 ? 'Bom dia' : (h < 18 ? 'Boa tarde' : 'Boa noite');
      titulo.textContent = `${saudacao}, ${String(usuario.nome || '').split(' ')[0]}`;
    }
    const dataEl = root.querySelector('[data-box="data-hoje"]');
    if (dataEl) {
      const txt = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      dataEl.textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
    }

    const parse = window.AgendamentosAPI?.parseDataHora || (() => null);
    const agendamentos = window.App?.data?.agendamentos?.boxes?.lista || [];

    // Agendamentos mais recentes (pela data marcada, mais novos primeiro)
    const tbody = root.querySelector('[data-box="agendamentos-tbody"]');
    if (tbody) {
      const recentes = [...agendamentos]
        .sort((a, b) => (parse(b.data, b.horario) || 0) - (parse(a.data, a.horario) || 0))
        .slice(0, 6);
      tbody.innerHTML = recentes.length ? recentes.map(a => `
        <tr>
          <td><div class="cel-pessoa"><span class="avatar-mini">${esc(Util.iniciais(a.paciente))}</span><span class="fw-600">${esc(a.paciente)}</span></div></td>
          <td><span class="mono">${esc(a.data)}</span> <span class="text-muted-sm mono">${esc(a.horario)}</span></td>
          <td>${esc(a.especialidade)}</td>
          <td>${esc(a.unidade)}</td>
          <td>${this.badge(a.status, a.badge)}</td>
          <td class="col-acoes"><button class="act-btn" data-action="view-agendamento" data-id="${esc(a.id)}" type="button">Ver</button></td>
        </tr>`).join('') : linhaVazia(6, 'Nenhum agendamento registrado ainda.', '📅');
    }

    // Próximos atendimentos (futuros, não cancelados, em ordem cronológica)
    const atend = root.querySelector('[data-box="proximos-atendimentos"]');
    if (atend) {
      const agora = new Date();
      const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
      const proximos = agendamentos
        .filter(a => a.status !== 'Cancelado')
        .map(a => ({ a, d: parse(a.data, a.horario) }))
        .filter(x => x.d && x.d >= agora)
        .sort((x, y) => x.d - y.d)
        .slice(0, 4);
      atend.innerHTML = proximos.length ? proximos.map(({ a, d }) => {
        const mesmoDia = (x, y) => x.toDateString() === y.toDateString();
        const rotulo = mesmoDia(d, agora) ? 'Hoje' : (mesmoDia(d, amanha) ? 'Amanhã' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', ''));
        return `
          <button type="button" class="atend-item" data-action="click-atendimento" data-id="${esc(a.id)}">
            <span class="atend-time-box"><span class="atend-label">${esc(rotulo)}</span><span class="atend-time">${esc(a.horario)}</span></span>
            <span class="atend-info"><span class="atend-name">${esc(a.paciente)}</span><span class="atend-desc">${esc(a.especialidade)} · ${esc(a.medico)}</span></span>
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          </button>`;
      }).join('') : '<div class="estado-vazio compacto"><span>Nenhum atendimento futuro agendado.</span></div>';
    }

    const btnAgendar = root.querySelector('#btn-dash-agendar');
    if (btnAgendar) btnAgendar.hidden = !window.Permissoes?.podeGerenciarAtendimentos(usuario?.perfil);

    const alertasVacEl = root.querySelector('[data-box="dashboard-alertas-vacinacao"]');
    if (alertasVacEl) {
      const pode = window.Permissoes?.perfilPodeAcessarPagina(usuario?.perfil, 'vacinacao');
      const lista = pode && window.VacinacaoAPI?.listarAlertas ? window.VacinacaoAPI.listarAlertas().data : [];
      this.renderAlertasVacinacao(alertasVacEl, lista, { exibirLink: true });
    }

    this.renderCalendario(root);
  },

  // --------------------------------------------------------------------------
  // Agendamentos
  // --------------------------------------------------------------------------
  renderAgendamentos(root, data) {
    const usuario = window.App?.usuario;
    const podeGerenciar = window.Permissoes?.podeGerenciarAtendimentos(usuario?.perfil);
    const isCidadao = Util.ehCidadao(usuario);
    const btnNovo = root.querySelector('#btn-novo-agendamento');
    if (btnNovo) btnNovo.hidden = !podeGerenciar;

    const tbody = root.querySelector('[data-box="lista-tbody"]');
    const listaCompleta = data.boxes?.lista;
    if (!tbody || !listaCompleta) return;

    const { itens, atual, totalPaginas, total } = this.paginar(listaCompleta, 'agendamentos');
    const hoje0 = new Date(new Date().setHours(0, 0, 0, 0));

    tbody.innerHTML = total === 0
      ? linhaVazia(8, isCidadao ? 'Você ainda não possui agendamentos.' : 'Nenhum agendamento encontrado para os filtros selecionados.', '📅')
      : itens.map(r => {
        const id = esc(r.id);
        const acoes = [`<button class="act-btn" data-action="view-agendamento" data-id="${id}" type="button">Ver</button>`];
        const passado = (() => {
          const d = window.AgendamentosAPI?.parseDataHora(r.data, '00:00');
          return d ? d < hoje0 : false;
        })();
        const aguardando = r.status === 'Pendente' || r.status === 'Remarcado';
        if (r.status !== 'Cancelado' && podeGerenciar) {
          // Recepção / Administrador: confirmar, alterar e cancelar
          if (aguardando) acoes.unshift(`<button class="act-btn act-success" data-action="confirm-agendamento" data-id="${id}" type="button">Confirmar</button>`);
          acoes.push(`<button class="act-btn act-primary" data-action="edit-agendamento" data-id="${id}" type="button">Alterar</button>`);
          acoes.push(`<button class="act-btn act-danger" data-action="cancel-agendamento" data-id="${id}" type="button">Cancelar</button>`);
        } else if (r.status !== 'Cancelado' && isCidadao && !passado) {
          // Cidadão: apenas aceita ou recusa o agendamento atribuído (nunca altera)
          if (aguardando) acoes.unshift(`<button class="act-btn act-success" data-action="confirm-agendamento" data-id="${id}" type="button">Aceitar</button>`);
          acoes.push(`<button class="act-btn act-danger" data-action="cancel-agendamento" data-id="${id}" type="button">Recusar</button>`);
        }
        return `
          <tr>
            <td class="mono text-muted-sm">${id}</td>
            <td><div class="fw-600">${esc(r.paciente)}</div><div class="text-muted-sm nowrap">CPF ${esc(r.cpf)}</div></td>
            <td><div class="mono">${esc(r.data)}</div><div class="mono text-primary">${esc(r.horario)}</div></td>
            <td>${esc(r.especialidade)}</td>
            <td>${esc(r.medico)}</td>
            <td>${esc(r.unidade)}</td>
            <td>${this.badge(r.status, r.badge)}</td>
            <td class="col-acoes"><div class="acoes">${acoes.join('')}</div></td>
          </tr>`;
      }).join('');

    this.montarPaginacao(root.querySelector('.pagination'), {
      pageId: 'agendamentos', total, atual, totalPaginas,
      rerender: () => this.renderAgendamentos(root, data)
    });
  },

  // --------------------------------------------------------------------------
  // Consultas
  // --------------------------------------------------------------------------
  renderConsultas(root, data) {
    const usuario = window.App?.usuario;
    const podeGerenciar = window.Permissoes?.podeGerenciarAtendimentos(usuario?.perfil);
    const btnNova = root.querySelector('#btn-nova-consulta');
    if (btnNova) btnNova.hidden = !podeGerenciar;
    const btnAgenda = root.querySelector('#btn-ver-agenda-medico');
    if (btnAgenda) btnAgenda.hidden = Util.ehCidadao(usuario);

    const tbody = root.querySelector('[data-box="consultas-tbody"]');
    const listaCompleta = data.boxes?.consultas;
    if (!tbody || !listaCompleta) return;

    const { itens, atual, totalPaginas, total } = this.paginar(listaCompleta, 'consultas');
    tbody.innerHTML = total === 0
      ? linhaVazia(8, 'Nenhuma consulta encontrada.', '🩺')
      : itens.map(c => `
        <tr>
          <td><div class="fw-600">${esc(c.paciente)}</div><div class="text-muted-sm">${esc(c.idade || '')}</div></td>
          <td>${esc(c.especialidade)}</td>
          <td>${esc(c.medico)}</td>
          <td><div class="mono">${esc(c.inicio)}</div><div class="text-muted-sm">${esc(c.data || '')}</div></td>
          <td class="mono">${esc(c.duracao)}</td>
          <td>${this.badge(c.status, c.badge)}</td>
          <td><span class="mono text-muted-sm">${esc(c.cid || '—')}</span></td>
          <td class="col-acoes"><div class="acoes">
            ${Util.ehCidadao(usuario) ? '' : `<button class="act-btn act-primary" data-action="view-agenda-medico" data-medico="${esc(c.medico)}" type="button" title="Agenda deste profissional">Agenda</button>`}
            <button class="act-btn" data-action="view-consulta" data-id="${esc(c.id)}" type="button">Ver</button>
          </div></td>
        </tr>`).join('');

    this.montarPaginacao(root.querySelector('.pagination'), {
      pageId: 'consultas', total, atual, totalPaginas,
      rerender: () => this.renderConsultas(root, data)
    });

    // Painéis laterais calculados a partir dos dados (antes eram números fixos no HTML)
    const espEl = root.querySelector('[data-box="consultas-especialidades"]');
    if (espEl) {
      const contagem = {};
      listaCompleta.forEach(c => { contagem[c.especialidade] = (contagem[c.especialidade] || 0) + 1; });
      const ordenado = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
      const max = ordenado[0]?.[1] || 1;
      const cores = ['var(--primary)', 'var(--accent)', 'var(--violet)', 'var(--warning)', 'var(--info)', 'var(--danger)'];
      espEl.innerHTML = ordenado.length ? ordenado.slice(0, 6).map(([nome, n], i) => `
        <div class="barra-item">
          <div class="barra-hd"><span>${esc(nome)}</span><strong>${n}</strong></div>
          <div class="prog-bar"><div class="prog-fill" style="width:${Math.round((n / max) * 100)}%;background:${cores[i % cores.length]}"></div></div>
        </div>`).join('') : '<div class="estado-vazio compacto"><span>Sem consultas registradas.</span></div>';
    }

    const filaEl = root.querySelector('[data-box="fila-espera"]');
    if (filaEl) {
      const fila = listaCompleta
        .filter(c => c.status === 'Aguardando' || c.status === 'Em Andamento')
        .sort((a, b) => (a.status === 'Em Andamento' ? -1 : 1) - (b.status === 'Em Andamento' ? -1 : 1) || String(a.inicio).localeCompare(String(b.inicio)));
      filaEl.innerHTML = fila.length ? fila.slice(0, 6).map((c, i) => `
        <div class="fila-item">
          <span class="fila-num ${c.status === 'Em Andamento' ? 'active' : 'wait'}">${i + 1}</span>
          <div class="fila-info"><div class="fw-600">${esc(c.paciente)}</div><div class="text-muted-sm">${esc(c.especialidade)} · ${esc(c.medico)}</div></div>
          <span class="fila-eta ${c.status === 'Em Andamento' ? 'text-primary' : ''}">${c.status === 'Em Andamento' ? 'Em atendimento' : `~${(i + 1) * 15} min`}</span>
        </div>`).join('') : '<div class="estado-vazio compacto"><span>Ninguém aguardando no momento.</span></div>';
    }
  },

  // --------------------------------------------------------------------------
  // Exames
  // --------------------------------------------------------------------------
  renderExames(root, data) {
    const usuario = window.App?.usuario;
    const podeGerenciar = window.Permissoes?.podeGerenciarAtendimentos(usuario?.perfil);
    // Laudo: Profissional da Saúde (e Administrador para testes). Recepção não emite.
    const podeEmitirLaudo = window.Permissoes?.podeEmitirLaudo(usuario?.perfil);
    const btnSolicitar = root.querySelector('#btn-solicitar-exame');
    if (btnSolicitar) btnSolicitar.hidden = !podeGerenciar;

    const tbody = root.querySelector('[data-box="exames-tbody"]');
    const listaCompleta = data.boxes?.lista;
    if (!tbody || !listaCompleta) return;

    const { itens, atual, totalPaginas, total } = this.paginar(listaCompleta, 'exames');
    tbody.innerHTML = total === 0
      ? linhaVazia(6, 'Nenhum exame encontrado para os filtros selecionados.', '🔬')
      : itens.map(e => {
        const st = String(e.status || '').toLowerCase();
        const isConcluido = st.includes('concl') || st.includes('laudo emit');
        const atrasado = window.ExamesAPI?.isAtrasado(e);
        const statusExibido = atrasado ? 'Atrasado' : (isConcluido ? 'Concluído' : (e.status || 'Solicitado'));
        const badgeCls = atrasado ? 'b-red' : (isConcluido ? 'b-green' : (statusExibido === 'Em andamento' ? 'b-blue' : 'b-yellow'));
        const id = esc(e.id);

        const acoes = [`<button class="act-btn" data-action="view-exame" data-id="${id}" type="button">Ver</button>`];
        if (!isConcluido && podeGerenciar) acoes.push(`<button class="act-btn act-primary" data-action="edit-exame" data-id="${id}" type="button">Alterar</button>`);
        acoes.push(`<button class="act-btn" data-action="historico-exames" data-paciente="${esc(e.paciente)}" data-cpf="${esc(e.cpf || '')}" type="button">Histórico</button>`);
        if (e.download || isConcluido) {
          acoes.push(`<button class="act-btn act-primary" data-action="download-exame" data-id="${id}" type="button">Laudo ⤓</button>`);
        } else if (podeEmitirLaudo) {
          acoes.push(`<button class="act-btn" data-action="laudo-exame" data-id="${id}" type="button">Emitir laudo</button>`);
        } else {
          acoes.push('<span class="text-muted-sm">Aguardando laudo</span>');
        }

        return `<tr>
          <td><div class="fw-600">${esc(e.paciente)}</div><div class="text-muted-sm">${e.cpf ? `${esc(e.cpf)} · ` : ''}${id}</div></td>
          <td><div>${esc(e.tipo)}</div>${e.solicitante ? `<div class="text-muted-sm">${esc(e.solicitante)}</div>` : ''}</td>
          <td><div class="mono">${esc(e.data)}</div>${e.horario ? `<div class="text-muted-sm mono">${esc(e.horario)}</div>` : ''}</td>
          <td>${esc(e.unidade || '—')}</td>
          <td>${this.badge(statusExibido, badgeCls)}</td>
          <td class="col-acoes"><div class="acoes">${acoes.join('')}</div></td>
        </tr>`;
      }).join('');

    this.montarPaginacao(root.querySelector('.pagination'), {
      pageId: 'exames', total, atual, totalPaginas,
      rerender: () => this.renderExames(root, data)
    });
  },

  // --------------------------------------------------------------------------
  // Unidades
  // --------------------------------------------------------------------------
  renderUnidades(root, data) {
    if (!root) root = document.getElementById('screen-container');
    if (!root) return;
    data = data || window.App?.data?.unidades || {};
    const boxes = data.boxes || {};

    const statsEl = root.querySelector('[data-box="stats"]');
    if (statsEl && boxes.stats) this.renderStats(statsEl, boxes.stats);

    const tbody = root.querySelector('[data-box="unidades-tbody"]');
    const listaCompleta = boxes.lista || [];
    if (tbody) {
      const { itens, atual, totalPaginas, total } = this.paginar(listaCompleta, 'unidades');
      tbody.innerHTML = total === 0
        ? linhaVazia(6, 'Nenhuma unidade de saúde encontrada para os filtros selecionados.', '🏥')
        : itens.map(u => {
          const statusCls = u.status === 'Operacional' ? 'ok' : (u.status === 'Manutenção' ? 'atencao' : 'critico');
          const ocupacao = Math.min(100, Math.max(0, Number(u.ocupacao) || 0));
          const corOcup = ocupacao >= 85 ? 'bar-red' : (ocupacao >= 70 ? 'bar-orange' : 'bar-blue');
          const capacidade = u.indisponivel || u.status !== 'Operacional'
            ? `<div class="text-muted-sm text-danger fw-600">${esc(u.capacidade || 'Indisponível')}</div>`
            : `<div class="text-muted-sm">${esc(u.capacidade || '—')}</div>
               <div class="prog-wrap"><div class="prog-bar"><div class="prog-fill ${corOcup}" style="width:${ocupacao}%"></div></div><span class="prog-label">${ocupacao}%</span></div>`;
          return `
            <tr>
              <td><div class="unidade-cell"><span class="unidade-icon">${esc(u.icone || '🏥')}</span><div><div class="fw-600">${esc(u.nome)}</div><div class="text-muted-sm">ID ${esc(u.id)}</div></div></div></td>
              <td><span class="type-chip tipo-${esc(String(u.tipo || '').toLowerCase())}">${esc(u.tipo)}</span></td>
              <td class="text-sm">${esc(u.endereco)}</td>
              <td style="min-width:150px">${capacidade}</td>
              <td><span class="status-pill ${statusCls}">${esc(u.status)}</span></td>
              <td class="col-acoes"><div class="acoes">
                <button class="act-btn" data-action="view-unidade" data-id="${esc(u.id)}" type="button">Ver</button>
                <button class="act-btn act-primary" data-action="edit-unidade" data-id="${esc(u.id)}" type="button">Editar</button>
              </div></td>
            </tr>`;
        }).join('');

      this.montarPaginacao(root.querySelector('.pagination'), {
        pageId: 'unidades', total, atual, totalPaginas,
        rerender: () => this.renderUnidades(root, data)
      });
    }

    const insumosEl = root.querySelector('[data-box="insumos-rows"]');
    if (insumosEl && Array.isArray(boxes.insumos)) {
      insumosEl.innerHTML = boxes.insumos.map(item => `
        <div class="insumo-row">
          <span class="insumo-ico">${esc(item.icone || '📦')}</span>
          <div class="insumo-info">
            <div class="insumo-name">${esc(item.nome)}</div>
            <div class="prog-bar"><div class="prog-fill bar-${esc(item.color === 'danger' ? 'red' : item.color === 'warning' ? 'orange' : 'green')}" style="width:${Number(item.pct) || 0}%"></div></div>
          </div>
          <span class="insumo-pct text-${esc(item.color || 'primary')}">${Number(item.pct) || 0}%</span>
        </div>`).join('');
    }

    // Distribuição por tipo calculada a partir da lista real (antes: números fixos)
    const distEl = root.querySelector('[data-box="distribuicao-rows"]');
    const listaTodas = window.App?.data?.unidades?.boxes?.lista || listaCompleta;
    if (distEl) {
      const cores = { Hospital: 'var(--danger)', UPA: 'var(--warning)', UBS: 'var(--primary)', AME: 'var(--violet)' };
      const contagem = {};
      listaTodas.forEach(u => { contagem[u.tipo] = (contagem[u.tipo] || 0) + 1; });
      distEl.innerHTML = Object.entries(contagem).map(([tipo, n]) => `
        <div class="dist-item">
          <span class="dist-label"><span class="dist-dot" style="background:${cores[tipo] || 'var(--text-light)'}"></span>${esc(tipo)}</span>
          <strong>${n}</strong>
        </div>`).join('') || '<div class="estado-vazio compacto"><span>Sem unidades.</span></div>';
    }

    // Alertas calculados: unidades paradas e ocupação alta
    const alertasEl = root.querySelector('[data-box="alertas-rows"]');
    if (alertasEl) {
      const alertas = [
        ...listaTodas.filter(u => u.status !== 'Operacional').map(u => ({ nivel: 'critico', titulo: `${u.nome} indisponível`, descricao: `Status: ${u.status}` })),
        ...listaTodas.filter(u => u.status === 'Operacional' && Number(u.ocupacao) >= 70).map(u => ({ nivel: 'atencao', titulo: `${u.nome} com ${u.ocupacao}% de ocupação`, descricao: 'Capacidade em atenção' }))
      ];
      alertasEl.innerHTML = alertas.length ? alertas.map(a => `
        <div class="alert-item nivel-${a.nivel}">
          <span class="alert-ico">${a.nivel === 'critico' ? '⛔' : '⚠️'}</span>
          <div class="alert-body"><strong>${esc(a.titulo)}</strong><p>${esc(a.descricao)}</p></div>
        </div>`).join('') : '<div class="estado-vazio compacto"><span>Nenhum alerta nas unidades.</span></div>';
    }
  },

  // --------------------------------------------------------------------------
  // Vacinação
  // --------------------------------------------------------------------------
  renderAlertasVacinacao(container, alertas, { exibirLink = false } = {}) {
    if (!container) return;
    const lista = Array.isArray(alertas) ? alertas : [];
    if (lista.length === 0) {
      container.innerHTML = '';
      return;
    }
    const criticos = lista.filter(a => a.nivel === 'critico');
    const atencao = lista.filter(a => a.nivel === 'atencao');
    const link = cls => exibirLink ? `<a href="#vacinacao" data-nav="vacinacao" class="btn btn-sm ${cls}">Ver estoque →</a>` : '';
    const blocos = [];

    if (criticos.length) {
      blocos.push(`
        <div class="vax-alert-banner nivel-critico" role="alert">
          <div class="vax-alert-left">
            <div class="vax-alert-icon">🚨</div>
            <div>
              <div class="vax-alert-title">Estoque de vacina esgotado (${criticos.length})</div>
              <div class="vax-alert-desc">Lotes com quantidade zero que precisam de reposição imediata:</div>
              <div class="vax-alert-chips">${criticos.map(a => `<span class="vax-alert-chip chip-critico" title="${esc(a.mensagem)}">${esc(a.vacina)} · Lote <strong>${esc(a.lote)}</strong> (${esc(a.unidade)})</span>`).join('')}</div>
            </div>
          </div>
          ${link('btn-alerta-critico')}
        </div>`);
    }
    if (atencao.length) {
      blocos.push(`
        <div class="vax-alert-banner nivel-atencao" role="status">
          <div class="vax-alert-left">
            <div class="vax-alert-icon">⚠️</div>
            <div>
              <div class="vax-alert-title">Baixo estoque de vacinas (${atencao.length})</div>
              <div class="vax-alert-desc">Lotes com quantidade igual ou abaixo do estoque mínimo:</div>
              <div class="vax-alert-chips">${atencao.map(a => `<span class="vax-alert-chip chip-atencao" title="${esc(a.mensagem)}">${esc(a.vacina)} · Lote <strong>${esc(a.lote)}</strong> (${esc(a.unidade)}): <strong>${esc(a.quantidade)}</strong> dose(s) · mín. ${esc(a.estoqueMinimo)}</span>`).join('')}</div>
            </div>
          </div>
          ${criticos.length ? '' : link('btn-alerta-atencao')}
        </div>`);
    }
    container.innerHTML = blocos.join('');
  },

  obterFiltrosVacinacaoDOM(root) {
    if (!root) root = document.getElementById('screen-container');
    if (!root) return {};
    return {
      busca: root.querySelector('#filter-vacinacao-busca')?.value?.trim() || '',
      vacina: root.querySelector('#filter-vacinacao-vacina')?.value || '',
      unidade: root.querySelector('#filter-vacinacao-unidade')?.value || '',
      dataInicio: root.querySelector('#filter-vacinacao-data-inicio')?.value || '',
      dataFim: root.querySelector('#filter-vacinacao-data-fim')?.value || ''
    };
  },

  renderVacinacao(root, data) {
    if (!root) root = document.getElementById('screen-container');
    if (!root) return;

    const perfil = window.App?.usuario?.perfil;
    const btnRegistrar = root.querySelector('#btn-registrar-vacinacao');
    if (btnRegistrar) btnRegistrar.hidden = !window.Permissoes?.podeRegistrarVacinacao(perfil);
    const btnEstoque = root.querySelector('#btn-entrada-estoque-vacina');
    if (btnEstoque) btnEstoque.hidden = !window.Permissoes?.podeGerenciarEstoqueVacina(perfil);

    const filtros = this.obterFiltrosVacinacaoDOM(root);
    const dados = window.VacinacaoAPI?.obterDadosTela
      ? window.VacinacaoAPI.obterDadosTela(filtros)
      : (data || window.App?.data?.vacinacao || {});
    const boxes = dados.boxes || {};

    const statsEl = root.querySelector('[data-box="stats"]');
    if (statsEl && boxes.stats) this.renderStats(statsEl, boxes.stats);
    this.renderAlertasVacinacao(root.querySelector('[data-box="vacinacao-alertas-banner"]'), boxes.alertas || []);

    const plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

    const campanhas = Array.isArray(boxes.campanhas) ? boxes.campanhas : [];
    const campanhasCount = root.querySelector('[data-box="campanhas-count"]');
    if (campanhasCount) campanhasCount.textContent = plural(campanhas.length, 'campanha', 'campanhas');
    const campanhasTbody = root.querySelector('[data-box="campanhas-tbody"]');
    if (campanhasTbody) {
      campanhasTbody.innerHTML = campanhas.length === 0
        ? linhaVazia(8, 'Nenhuma campanha encontrada para os filtros selecionados.', '💉')
        : campanhas.map(c => {
          const pct = Math.min(100, Number(c.cobertura || 0));
          const barClass = pct >= 75 ? 'bar-green' : (pct >= 40 ? 'bar-blue' : 'bar-orange');
          return `
            <tr>
              <td><div class="unidade-cell"><span class="unidade-icon">${esc(c.icone || '💉')}</span><div><div class="fw-600">${esc(c.nome)}</div><div class="text-muted-sm">${esc(c.id || '')}</div></div></div></td>
              <td class="fw-600">${esc(c.vacina)}</td>
              <td class="text-sm">${esc(c.publicoAlvo)}</td>
              <td class="mono text-sm">${esc(c.periodo)}</td>
              <td><span class="fw-600">${esc(c.meta)}</span> <span class="text-muted-sm">doses</span></td>
              <td><span class="fw-600 text-primary">${esc(c.dosesAplicadas)}</span></td>
              <td style="min-width:150px"><div class="prog-wrap"><div class="prog-bar"><div class="prog-fill ${barClass}" style="width:${pct}%"></div></div><span class="prog-label">${esc(c.cobertura)}%</span></div></td>
              <td>${this.badge(c.status || 'Ativa', c.badge || 'b-green')}</td>
            </tr>`;
        }).join('');
    }

    const estoque = Array.isArray(boxes.estoque) ? boxes.estoque : [];
    const estoqueCount = root.querySelector('[data-box="estoque-count"]');
    if (estoqueCount) estoqueCount.textContent = plural(estoque.length, 'lote', 'lotes');
    const estoqueTbody = root.querySelector('[data-box="estoque-tbody"]');
    if (estoqueTbody) {
      estoqueTbody.innerHTML = estoque.length === 0
        ? linhaVazia(7, 'Nenhum lote encontrado no estoque para os filtros selecionados.', '📦')
        : estoque.map(item => {
          const qtd = Number(item.quantidade);
          const qtdCls = (qtd <= 0 || item.vencido) ? 'text-danger' : (qtd <= Number(item.estoqueMinimo || 5) ? 'text-warning' : '');
          return `
            <tr>
              <td class="fw-600">${esc(item.vacina)}</td>
              <td><span class="mono fw-600">${esc(item.lote)}</span></td>
              <td>${esc(item.unidade)}</td>
              <td><span class="mono ${item.vencido ? 'text-danger fw-600' : ''}">${esc(item.validade)}</span>${item.vencido ? '<div class="text-muted-sm text-danger">Vencido</div>' : ''}</td>
              <td><span class="fw-700 ${qtdCls}">${esc(item.quantidade)}</span> <span class="text-muted-sm">dose(s)</span></td>
              <td><span class="mono">${esc(item.estoqueMinimo ?? 5)}</span></td>
              <td>${this.badge(item.status || 'Normal', item.badge || 'b-green')}</td>
            </tr>`;
        }).join('');
    }

    const aplicacoes = Array.isArray(boxes.aplicacoes) ? boxes.aplicacoes : [];
    const aplicacoesCount = root.querySelector('[data-box="aplicacoes-count"]');
    if (aplicacoesCount) aplicacoesCount.textContent = plural(aplicacoes.length, 'registro', 'registros');
    const aplicacoesTbody = root.querySelector('[data-box="aplicacoes-tbody"]');
    if (aplicacoesTbody) {
      const { itens, atual, totalPaginas, total } = this.paginar(aplicacoes, 'vacinacao');
      aplicacoesTbody.innerHTML = total === 0
        ? linhaVazia(8, 'Nenhuma aplicação registrada para os filtros informados.', '💉')
        : itens.map(a => `
          <tr>
            <td class="mono text-muted-sm">${esc(a.id || '—')}</td>
            <td><div class="fw-600">${esc(a.cidadao || a.paciente)}</div>${a.cpf ? `<div class="text-muted-sm mono">${esc(a.cpf)}</div>` : ''}</td>
            <td><div class="fw-600">${esc(a.vacina)}</div>${a.campanha ? `<div class="text-muted-sm">${esc(a.campanha)}</div>` : ''}</td>
            <td class="mono">${esc(a.lote || '—')}</td>
            <td><span class="badge b-blue">${esc(a.dose)}</span></td>
            <td>${esc(a.unidade)}</td>
            <td>${esc(a.profissional)}</td>
            <td class="mono text-sm">${esc(a.dataHora)}</td>
          </tr>`).join('');

      this.montarPaginacao(root.querySelector('#vacinacao-pagination') || root.querySelector('.pagination'), {
        pageId: 'vacinacao', total, atual, totalPaginas,
        rerender: () => this.renderVacinacao(root, data)
      });
    }
  },

  // --------------------------------------------------------------------------
  // Logs
  // --------------------------------------------------------------------------
  renderLogs(root, data) {
    const container = root.querySelector('[data-box="logs-list"]');
    const registros = data.boxes?.registros || data.boxes?.lista;
    if (!container || !registros) return;
    // Guarda a lista exibida: o modal de detalhes busca por ID. Antes usava o
    // índice da linha na lista COMPLETA, então com filtro ativo abria outro log.
    this._logsExibidos = registros;
    const cores = { danger: 'var(--danger)', success: 'var(--success)', warning: 'var(--warning)', primary: 'var(--primary)' };

    const { itens, atual, totalPaginas, total } = this.paginar(registros, 'logs');
    container.innerHTML = total === 0
      ? '<div class="estado-vazio"><div class="estado-icone">📝</div><span>Nenhum registro encontrado para os filtros selecionados.</span></div>'
      : itens.map(r => `
        <button type="button" class="log-item" data-action="view-log" data-id="${esc(r.id)}">
          <span class="log-dot" style="background:${cores[r.dot] || 'var(--primary)'}"></span>
          <span class="log-time"><span>${esc(r.data || '')}</span><span>${esc(r.hora)}</span></span>
          <span class="log-corpo">
            <span class="log-text">${this.badge(r.tipo, r.badge)} <strong>${esc(r.titulo || r.acao)}</strong></span>
            <span class="log-meta">${esc(r.modulo || 'SISTEMA')} · ${esc(r.usuario || 'sistema')} — ${esc(r.descricao || r.meta || '')}</span>
          </span>
        </button>`).join('');

    // Painel lateral: contagem por tipo e por módulo (dados reais)
    const contaTipo = trecho => registros.filter(l => String(l.tipo || '').toLowerCase().includes(trecho)).length;
    const set = (sel, v) => { const el = root.querySelector(sel); if (el) el.textContent = v; };
    set('#side-info-count', contaTipo('info'));
    set('#side-acesso-count', contaTipo('acess'));
    set('#side-aviso-count', contaTipo('avis'));
    set('#side-erro-count', contaTipo('err'));

    const modulosEl = root.querySelector('[data-box="logs-modulos"]');
    if (modulosEl) {
      const porModulo = {};
      registros.forEach(r => { const m = r.modulo || 'SISTEMA'; porModulo[m] = (porModulo[m] || 0) + 1; });
      const ordenado = Object.entries(porModulo).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const max = ordenado[0]?.[1] || 1;
      modulosEl.innerHTML = ordenado.map(([m, n]) => `
        <div class="barra-item">
          <div class="barra-hd"><span class="mono">${esc(m)}</span><strong>${n}</strong></div>
          <div class="prog-bar"><div class="prog-fill bar-blue" style="width:${Math.round((n / max) * 100)}%"></div></div>
        </div>`).join('') || '<div class="estado-vazio compacto"><span>Sem registros.</span></div>';
    }

    this.montarPaginacao(root.querySelector('.pagination'), {
      pageId: 'logs', total, atual, totalPaginas,
      rerender: () => this.renderLogs(root, data)
    });
  },

  // --------------------------------------------------------------------------
  // Configurações e perfil
  // --------------------------------------------------------------------------
  renderConfiguracoes(root, data, usuario) {
    const b = data?.boxes || {};
    const settings = window.App?.settings || {};
    const nav = root.querySelector('[data-box="config-nav"]');
    if (nav && b.secoes) {
      nav.innerHTML = b.secoes.map((s, i) =>
        `<button type="button" class="config-nav-item${i === 0 ? ' active' : ''}" data-config-tab="${esc(s.id)}" role="tab">${esc(s.label)}</button>`
      ).join('');
      this.bindConfigTabs(root);
    }

    const u = usuario;
    if (u) {
      const set = (id, val) => { const el = root.querySelector(id); if (el && val != null) el.value = val; };
      set('#cfg-nome', u.nome);
      set('#cfg-email', u.email);
      set('#cfg-cargo', u.cargo);
      set('#cfg-unidade', u.unidade);
      set('#cfg-telefone', u.telefone);
      const esconder = (sel, cond) => { const f = root.querySelector(sel)?.closest('.config-field'); if (f) f.hidden = cond; };
      esconder('#cfg-cargo', Util.ehCidadao(u));
      esconder('#cfg-unidade', Util.ehCidadao(u));
    }

    const notif = root.querySelector('[data-box="notificacoes-list"]');
    if (notif && b.notificacoes) {
      const prefs = settings.notificacoes || {};
      notif.innerHTML = b.notificacoes.map(n => {
        const ativo = prefs[n.id] ?? n.ativo;
        return `
          <label class="toggle-row">
            <span class="toggle-info"><strong>${esc(n.titulo)}</strong><span>${esc(n.descricao)}</span></span>
            <span class="switch"><input type="checkbox" data-notif="${esc(n.id)}" ${ativo ? 'checked' : ''}><span class="switch-slider"></span></span>
          </label>`;
      }).join('');
    }

    const itens = root.querySelector('#cfg-itens');
    if (itens) itens.value = String(settings.itensPorPagina || 10);
    const t = root.querySelector('#cfg-timeout');
    if (t) t.value = settings.sessaoTimeoutMin ?? 30;
    const ultimo = root.querySelector('#cfg-ultimo-acesso');
    if (ultimo) {
      const login = (window.AuditoriaService?.getAll() || []).find(l =>
        l.acao === 'Login realizado com sucesso' && l.usuario === u?.nome);
      ultimo.value = login?.dataHora || '—';
    }
  },

  bindConfigTabs(root) {
    const tabs = root.querySelectorAll('.config-nav-item');
    const sections = root.querySelectorAll('.config-section');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const id = tab.dataset.configTab;
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        sections.forEach(s => s.classList.toggle('active', s.dataset.section === id));
      });
    });
  },

  renderPerfil(root, usuario) {
    const u = usuario || window.App?.usuario;
    if (!u) return;
    const setTxt = (sel, val) => { const el = root.querySelector(sel); if (el) el.textContent = val ?? '—'; };
    const setVal = (sel, val) => { const el = root.querySelector(sel); if (el && val != null) el.value = val; };

    setTxt('#perfil-nome-hdr', u.nome);
    setTxt('#perfil-cargo-badge', u.perfil);
    setTxt('#perfil-avatar-iniciais', u.iniciais || Util.iniciais(u.nome));

    const meta = [];
    if (u.cargo) meta.push(['Cargo', u.cargo]);
    if (u.registro) meta.push(['Registro', u.registro]);
    if (u.especialidade) meta.push(['Especialidade', u.especialidade]);
    if (u.setor) meta.push(['Setor', u.setor]);
    if (u.unidade) meta.push(['Unidade', u.unidade]);
    if (u.sus) meta.push(['Cartão SUS', u.sus]);
    const metaEl = root.querySelector('#perfil-meta-hdr');
    if (metaEl) {
      metaEl.innerHTML = meta.map(([k, v]) => `<span class="meta-chip"><span>${esc(k)}</span><strong>${esc(v)}</strong></span>`).join('');
    }

    setVal('#perfil-edit-nome', u.nome);
    setVal('#perfil-edit-email', u.email);
    setVal('#perfil-edit-cargo', u.cargo || '');
    setVal('#perfil-edit-unidade', u.unidade || '');
    setVal('#perfil-edit-telefone', u.telefone || '');
    const esconder = (sel, cond) => { const f = root.querySelector(sel)?.closest('.config-field'); if (f) f.hidden = cond; };
    esconder('#perfil-edit-cargo', Util.ehCidadao(u));
    esconder('#perfil-edit-unidade', Util.ehCidadao(u));

    const cpf = String(u.cpf || '');
    setTxt('#perfil-info-perfil', u.perfil);
    setTxt('#perfil-info-cpf', cpf ? `${cpf.slice(0, 4)}***.***-${cpf.slice(-2)}` : '—');
    setTxt('#perfil-info-id', u.id);

    window.App?.applyUsuario();
  },

  // --------------------------------------------------------------------------
  // Cadastro de usuários
  // --------------------------------------------------------------------------
  renderCadastroUsuarios(root) {
    const listContainer = root.querySelector('#users-list-container');
    const badge = root.querySelector('#users-count-badge');
    const form = root.querySelector('#form-cadastro-usuario');
    const selectPerfil = root.querySelector('#cad-perfil');
    const inputCpf = root.querySelector('#cad-cpf');
    const inputSus = root.querySelector('#cad-sus');
    const inputEmail = root.querySelector('#cad-email');
    const btnLimpar = root.querySelector('#btn-limpar-cadastro');
    const inputBusca = root.querySelector('#busca-usuarios-cadastrados');

    const mostrarMensagemCampo = (input, mensagem, tipo) => {
      if (!input) return;
      let msgEl = input.parentElement.querySelector('.field-hint');
      if (!msgEl) {
        msgEl = document.createElement('div');
        msgEl.className = 'field-hint';
        input.insertAdjacentElement('afterend', msgEl);
      }
      msgEl.textContent = mensagem || '';
      msgEl.classList.toggle('field-hint-erro', tipo === 'erro');
      msgEl.classList.toggle('field-hint-ok', tipo === 'ok');
      input.classList.toggle('input-invalido', tipo === 'erro');
    };

    const limparMensagensCampos = () => {
      root.querySelectorAll('.field-hint').forEach(el => { el.textContent = ''; el.classList.remove('field-hint-erro', 'field-hint-ok'); });
      root.querySelectorAll('.input-invalido').forEach(el => el.classList.remove('input-invalido'));
    };

    const esconderSecoes = () => {
      root.querySelectorAll('.profile-fields-section').forEach(sec => {
        sec.hidden = true;
        sec.querySelectorAll('input, select').forEach(f => f.removeAttribute('required'));
      });
    };

    const corPerfil = { 'Administrador': 'b-red', 'Profissional da Saúde': 'b-blue', 'Recepção': 'b-purple', 'Cidadão': 'b-green', 'Paciente': 'b-green' };

    const loadUsersList = () => {
      const dbUsers = window.App?.initUsuariosDB() || [];
      const query = (inputBusca?.value || '').trim().toLowerCase();
      const qDig = Util.somenteDigitos(query);
      const filtered = dbUsers.filter(u =>
        String(u.nome || '').toLowerCase().includes(query) ||
        (qDig && Util.somenteDigitos(u.cpf).includes(qDig)) ||
        String(u.email || '').toLowerCase().includes(query)
      );
      if (badge) badge.textContent = filtered.length;
      if (!listContainer) return;
      if (!filtered.length) {
        listContainer.innerHTML = '<div class="estado-vazio compacto"><span>Nenhum usuário encontrado.</span></div>';
        return;
      }
      listContainer.innerHTML = filtered.map(u => {
        let extra;
        if (Util.ehCidadao(u)) extra = `SUS ${u.sus || '—'} · acesso somente aos próprios dados`;
        else if (u.perfil === 'Recepção') extra = `Unidade: ${u.unidade || '—'}`;
        else if (u.perfil === 'Profissional da Saúde') extra = `${u.registro || '—'} · ${u.especialidade || '—'} (${u.unidade || '—'})`;
        else extra = `${u.cargo || '—'} · ${u.setor || '—'}`;
        return `
          <div class="user-row">
            <span class="avatar-mini">${esc(u.iniciais || Util.iniciais(u.nome))}</span>
            <div class="user-row-info">
              <div class="user-row-hd"><strong>${esc(u.nome)}</strong>${this.badge(u.perfil, corPerfil[u.perfil] || 'b-gray')}</div>
              <div class="text-muted-sm"><span class="mono">${esc(u.cpf)}</span> · ${esc(u.email)}</div>
              <div class="text-muted-sm">${esc(extra)}</div>
            </div>
          </div>`;
      }).join('');
    };

    if (inputCpf) {
      inputCpf.addEventListener('input', e => { e.target.value = Util.mascararCPF(e.target.value); });
      inputCpf.addEventListener('blur', () => {
        const val = inputCpf.value.trim();
        if (!val) { mostrarMensagemCampo(inputCpf, '', ''); return; }
        const check = window.UsuariosAPI?.validarCPF(val);
        if (check && !check.valido) mostrarMensagemCampo(inputCpf, check.mensagem, 'erro');
        else if (window.UsuariosAPI && !window.UsuariosAPI.cpfDisponivel(val)) mostrarMensagemCampo(inputCpf, 'Este CPF já está cadastrado no sistema.', 'erro');
        else mostrarMensagemCampo(inputCpf, 'CPF válido e disponível.', 'ok');
      });
    }

    if (inputSus) {
      inputSus.addEventListener('input', e => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 15);
        if (val.length > 11) val = val.replace(/^(\d{3})(\d{4})(\d{4})(\d{1,4})$/, '$1.$2.$3.$4');
        else if (val.length > 7) val = val.replace(/^(\d{3})(\d{4})(\d{1,4})$/, '$1.$2.$3');
        else if (val.length > 3) val = val.replace(/^(\d{3})(\d{1,4})$/, '$1.$2');
        e.target.value = val;
      });
    }

    if (inputEmail) {
      inputEmail.addEventListener('blur', () => {
        const val = inputEmail.value.trim();
        if (!val) { mostrarMensagemCampo(inputEmail, '', ''); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) mostrarMensagemCampo(inputEmail, 'Informe um e-mail em um formato válido.', 'erro');
        else if (window.UsuariosAPI && !window.UsuariosAPI.emailDisponivel(val)) mostrarMensagemCampo(inputEmail, 'Este e-mail já está cadastrado no sistema.', 'erro');
        else mostrarMensagemCampo(inputEmail, 'E-mail disponível.', 'ok');
      });
    }

    if (selectPerfil) {
      selectPerfil.addEventListener('change', e => {
        const perfil = e.target.value;
        esconderSecoes();
        const secao = {
          'Cidadão': '#fields-paciente', 'Paciente': '#fields-paciente', 'Recepção': '#fields-recepcao',
          'Profissional da Saúde': '#fields-profissional', 'Administrador': '#fields-administrador'
        }[perfil];
        const sec = secao && root.querySelector(secao);
        if (!sec) return;
        sec.hidden = false;
        // RG não é obrigatório quando o CPF é informado (regra da UsuariosAPI)
        sec.querySelectorAll('input, select').forEach(f => { if (f.id !== 'cad-rg') f.setAttribute('required', 'required'); });
      });
    }

    inputBusca?.addEventListener('input', loadUsersList);

    btnLimpar?.addEventListener('click', () => {
      form?.reset();
      esconderSecoes();
      limparMensagensCampos();
    });

    form?.addEventListener('submit', async e => {
      e.preventDefault();
      const perfil = selectPerfil?.value;
      const valor = sel => root.querySelector(sel)?.value?.trim();
      const bodyData = { perfil, nome: valor('#cad-nome'), cpf: valor('#cad-cpf'), email: valor('#cad-email'), senha: root.querySelector('#cad-senha')?.value };
      if (Util.ehCidadao({ perfil })) Object.assign(bodyData, { rg: valor('#cad-rg'), sus: valor('#cad-sus'), nascimento: valor('#cad-nascimento') });
      else if (perfil === 'Recepção') bodyData.unidade = valor('#cad-recep-unidade');
      else if (perfil === 'Profissional da Saúde') Object.assign(bodyData, { registro: valor('#cad-registro'), especialidade: valor('#cad-especialidade'), unidade: valor('#cad-unidade') });
      else if (perfil === 'Administrador') Object.assign(bodyData, { setor: valor('#cad-setor'), cargo: valor('#cad-cargo') });

      const btn = form.querySelector('button[type="submit"]');
      const textoOriginal = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Salvando…';
      try {
        const res = await fetch('/usuarios/cadastrar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
        const result = await res.json();
        if (res.status === 200) {
          window.App?.toast(result.message || 'Usuário cadastrado com sucesso!', 'success');
          form.reset();
          esconderSecoes();
          limparMensagensCampos();
          loadUsersList();
        } else {
          window.App?.toast(result.error || 'Erro ao cadastrar usuário.', 'danger');
        }
      } catch (err) {
        console.error(err);
        window.App?.toast('Erro ao cadastrar o usuário.', 'danger');
      } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
      }
    });

    loadUsersList();
  }
};

window.Render = Render;
