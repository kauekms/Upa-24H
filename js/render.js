/**
 * Renderização de boxes/layout a partir dos JSON de cada tela
 */
const PAGE_SIZE_PADRAO = 4;

const Render = {
  badge(status, cls) {
    return `<span class="badge ${cls}">${status}</span>`;
  },

  // Estado da página atual de cada tabela paginada (por pageId). Antes, os
  // botões "‹ 1 2 3 › " de Agendamentos, Consultas, Exames, Unidades e Logs
  // eram só enfeite — clicar não fazia nada. Agora `paginar()` fatia a lista
  // de verdade e `montarPaginacao()` desenha e liga os botões a essa fatia.
  _paginaAtual: {},

  resetarPaginacao(pageId) {
    this._paginaAtual[pageId] = 1;
  },

  paginar(listaCompleta, pageId) {
    const total = listaCompleta.length;
    const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE_PADRAO));
    let atual = this._paginaAtual[pageId] || 1;
    if (atual > totalPaginas) atual = totalPaginas;
    if (atual < 1) atual = 1;
    this._paginaAtual[pageId] = atual;
    const inicio = (atual - 1) * PAGE_SIZE_PADRAO;
    return { itens: listaCompleta.slice(inicio, inicio + PAGE_SIZE_PADRAO), atual, totalPaginas, total };
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
    const info = container.querySelector('.page-info');
    if (info) {
      if (total === 0) {
        info.textContent = 'Nenhum registro encontrado';
      } else {
        const de = (atual - 1) * PAGE_SIZE_PADRAO + 1;
        const ate = Math.min(atual * PAGE_SIZE_PADRAO, total);
        info.textContent = `Mostrando ${de}–${ate} de ${total}`;
      }
    }

    const btns = container.querySelector('.page-btns');
    if (!btns) return;

    const paginas = this._paginasComElipse(atual, totalPaginas);
    btns.innerHTML = `
      <button class="page-btn" data-pg="prev" type="button" ${atual <= 1 ? 'disabled' : ''}>‹</button>
      ${paginas.map(p => p === '…'
        ? '<span class="page-btn" style="cursor:default;pointer-events:none">…</span>'
        : `<button class="page-btn${p === atual ? ' active' : ''}" data-pg="${p}" type="button">${p}</button>`
      ).join('')}
      <button class="page-btn" data-pg="next" type="button" ${atual >= totalPaginas ? 'disabled' : ''}>›</button>
    `;

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

  renderStats(container, stats) {
    if (!container || !stats) return;
    container.innerHTML = stats.map(s => {
      const note = s.note
        ? `<div class="stat-note ${s.noteClass || 'note-muted'}">${s.note}</div>`
        : '';
      const bar = s.bar != null
        ? `<div class="stat-bar"><div class="stat-bar-fill ${s.barClass || 'bar-blue'}" style="width:${s.bar}%"></div></div>`
        : '';
      return `<div class="stat-card">
        <div class="stat-label">${s.label}</div>
        <div class="stat-icon ${s.iconClass}">${s.icon}</div>
        <div class="stat-value">${s.value}</div>
        ${note}${bar}
      </div>`;
    }).join('');
  },

  renderPage(pageId, data, usuario) {
    const root = document.getElementById('screen-container');
    if (!root || !data) return;

    // Os cards de estatística das telas de Agendamentos/Consultas/Exames
    // mostram números agregados de toda a equipe — não fazem sentido na
    // visão restrita e individual do Cidadão, então ficam ocultos ali.
    const statsEl = root.querySelector('[data-box="stats"]');
    if (statsEl) {
      const ocultarStats = (usuario?.perfil === 'Cidadão' || usuario?.perfil === 'Paciente') && ['agendamentos', 'consultas', 'exames'].includes(pageId);
      if (ocultarStats) {
        statsEl.style.display = 'none';
      } else {
        statsEl.style.display = '';
        if (data.boxes?.stats) this.renderStats(statsEl, data.boxes.stats);
      }
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

    if (renderers[pageId]) renderers[pageId]();
  },

  renderPerfil(root, usuario) {
    const u = usuario || window.App?.usuario;
    if (!u) return;
    const setTxt = (id, val) => { const el = root.querySelector(id); if (el && val != null) el.textContent = val; };
    const setVal = (id, val) => { const el = root.querySelector(id); if (el && val != null) el.value = val; };

    setTxt('#perfil-nome-hdr', u.nome);
    setTxt('#perfil-cargo-badge', u.cargo || u.perfil);
    setTxt('#perfil-unidade-hdr', u.unidade);

    setVal('#perfil-edit-nome', u.nome);
    setVal('#perfil-edit-email', u.email);
    setVal('#perfil-edit-cargo', u.cargo || u.perfil);
    setVal('#perfil-edit-unidade', u.unidade);
    setVal('#perfil-edit-telefone', u.telefone);

    const avatarBig = root.querySelector('#perfil-avatar-big');
    if (avatarBig && u.nome) {
      avatarBig.textContent = u.iniciais || u.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    
    // Ocultar itens não aplicáveis ao Cidadão/Paciente na tela Meu Perfil
    if (u.perfil === 'Cidadão' || u.perfil === 'Paciente') {
      const cargoInput = root.querySelector('#perfil-edit-cargo');
      if (cargoInput) cargoInput.closest('.config-field').style.display = 'none';
      
      const unidadeInput = root.querySelector('#perfil-edit-unidade');
      if (unidadeInput) unidadeInput.closest('.config-field').style.display = 'none';
      
      const metaHdr = root.querySelector('#perfil-meta-hdr');
      if (metaHdr) metaHdr.style.display = 'none';
    }
  },

  // ==========================================================================
  // Calendário do Dashboard
  // ==========================================================================
  // Antes era um bloco de HTML fixo com "Maio 2026" escrito na mão e os dias
  // digitados um a um — os botões ‹ › não tinham nenhum evento ligado e
  // nenhum dia era clicável de verdade. Agora é um calendário real: navega
  // entre meses de verdade, marca o dia de hoje usando a data real do
  // sistema, e sinaliza (com um pontinho) os dias que têm agendamento,
  // usando os dados reais de Agendamentos.
  _calendario: null,

  renderCalendario(root) {
    const hoje = new Date();
    if (!this._calendario) {
      this._calendario = { ano: hoje.getFullYear(), mes: hoje.getMonth(), selecionado: null };
    }
    const { ano, mes } = this._calendario;

    const nomesMes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mesEl = root.querySelector('[data-box="cal-mes"]');
    if (mesEl) mesEl.textContent = `${nomesMes[mes]} ${ano}`;

    // Datas (formato "aaaa-mm-dd") que têm pelo menos um agendamento real,
    // para marcar no calendário.
    const agendamentos = window.App?.data?.agendamentos?.boxes?.lista || [];
    const chaveData = (dataBr) => {
      const partes = String(dataBr || '').split('/'); // "07/05/2026" -> [dd, mm, aaaa]
      return partes.length === 3 ? `${partes[2]}-${partes[1]}-${partes[0]}` : null;
    };
    const diasComAgendamento = new Set(agendamentos.map(a => chaveData(a.data)).filter(Boolean));

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay(); // 0 = Domingo
    const totalDiasMes = new Date(ano, mes + 1, 0).getDate();
    const totalDiasMesAnterior = new Date(ano, mes, 0).getDate();

    const celulas = [];
    for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
      celulas.push({ dia: totalDiasMesAnterior - i, outroMes: true });
    }
    for (let d = 1; d <= totalDiasMes; d++) {
      celulas.push({ dia: d, outroMes: false });
    }
    let proximoMesDia = 1;
    while (celulas.length % 7 !== 0) {
      celulas.push({ dia: proximoMesDia++, outroMes: true });
    }

    const diasEl = root.querySelector('[data-box="cal-dias"]');
    if (diasEl) {
      diasEl.innerHTML = celulas.map(c => {
        if (c.outroMes) return `<div class="cal-day muted">${c.dia}</div>`;

        const chave = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(c.dia).padStart(2, '0')}`;
        const ehHoje = ano === hoje.getFullYear() && mes === hoje.getMonth() && c.dia === hoje.getDate();
        const ehSelecionado = this._calendario.selecionado === chave;
        const temAgendamento = diasComAgendamento.has(chave);

        const classes = ['cal-day'];
        if (ehSelecionado) classes.push('selected');
        else if (ehHoje) classes.push('today');
        if (temAgendamento) classes.push('has-evento');

        return `<div class="${classes.join(' ')}" data-cal-dia="${chave}">${c.dia}</div>`;
      }).join('');

      diasEl.querySelectorAll('[data-cal-dia]').forEach(el => {
        el.addEventListener('click', () => {
          const chave = el.dataset.calDia;
          this._calendario.selecionado = chave;
          this.renderCalendario(root);

          const count = agendamentos.filter(a => chaveData(a.data) === chave).length;
          const [ay, am, ad] = chave.split('-');
          const dataFmt = `${ad}/${am}/${ay}`;
          const msg = count > 0
            ? `${count} agendamento${count > 1 ? 's' : ''} em ${dataFmt}.`
            : `Nenhum agendamento em ${dataFmt}.`;
          window.App?.toast(msg, count > 0 ? 'info' : 'warning');
        });
      });
    }

    // Os botões de navegação são elementos fixos (não são recriados a cada
    // clique), então usamos .onclick em vez de addEventListener — assim
    // cada clique substitui o handler anterior, em vez de empilhar um novo
    // listener a cada vez que o mês muda.
    const btnPrev = root.querySelector('#cal-btn-prev');
    if (btnPrev) {
      btnPrev.onclick = () => {
        this._calendario.mes--;
        if (this._calendario.mes < 0) { this._calendario.mes = 11; this._calendario.ano--; }
        this.renderCalendario(root);
      };
    }

    const btnNext = root.querySelector('#cal-btn-next');
    if (btnNext) {
      btnNext.onclick = () => {
        this._calendario.mes++;
        if (this._calendario.mes > 11) { this._calendario.mes = 0; this._calendario.ano++; }
        this.renderCalendario(root);
      };
    }
  },

  renderDashboard(root, data, usuario) {
    const b = data.boxes;
    const tbody = root.querySelector('[data-box="agendamentos-tbody"]');
    // Usar dados globais de agendamentos para manter sincronizado com a tela inicial
    const agendamentosGlobais = window.App?.data?.agendamentos?.boxes?.lista || b.agendamentosRecentes || [];
    const recentes = agendamentosGlobais.slice(0, 5);
    if (tbody && recentes) {
      tbody.innerHTML = recentes.map((a, idx) => `
        <tr>
          <td class="fw-600">${a.paciente || a.nome}</td><td>${a.data}</td>
          <td><span class="mono">${a.horario}</span></td>
          <td>${a.unidade}</td>
          <td>${this.badge(a.status, a.badge)}</td>
          <td><button class="act-btn" data-action="view-agendamento" data-id="${a.id || ('#' + (10291 + idx))}" type="button">Ver</button></td>
        </tr>`).join('');
    }

    // O bloco de "Alertas Importantes" foi removido do Dashboard (não fazia
    // parte do escopo atual, que ficou focado só em agendamentos, consultas
    // e exames) — não há mais nada para desenhar aqui.

    this.renderCalendario(root);

    const atend = root.querySelector('[data-box="proximos-atendimentos"]');
    if (atend && b.proximosAtendimentos) {
      atend.innerHTML = b.proximosAtendimentos.map((p, i) => `
        <div class="atend-item" data-action="click-atendimento" data-nome="${p.nome}" style="cursor:pointer">
          <div class="atend-time-box">
            <div class="atend-label">${p.periodo}</div>
            <div class="atend-time">${p.horario}</div>
          </div>
          <div class="atend-info">
            <div class="atend-name">${p.nome}</div>
            <div class="atend-desc">${p.descricao}</div>
          </div>
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
        </div>`).join('');
    }

    const titleSub = root.querySelector('.page-sub');
    if (titleSub && usuario) {
      titleSub.textContent = `Bem-vindo, ${usuario.nome}. Aqui está o resumo das atividades de saúde de hoje.`;
    }
  },

  renderAgendamentos(root, data) {
    const podeGerenciar = window.Permissoes?.podeGerenciarAtendimentos(window.App?.usuario?.perfil);
    const btnNovo = root.querySelector('#btn-novo-agendamento');
    if (btnNovo) btnNovo.style.display = podeGerenciar ? 'block' : 'none';

    const tbody = root.querySelector('[data-box="lista-tbody"]');
    const listaCompleta = data.boxes?.lista;
    if (!tbody || !listaCompleta) return;

    const { itens, atual, totalPaginas, total } = this.paginar(listaCompleta, 'agendamentos');
    const u = window.App?.usuario;
    const isCidadao = u?.perfil === 'Cidadão' || u?.perfil === 'Paciente' || u?.cargo === 'Cidadão' || u?.cargo === 'Paciente';

    tbody.innerHTML = itens.map(r => {
      let botoesAcao = `<button class="act-btn" data-action="view-agendamento" data-id="${r.id}" type="button">Ver</button>`;

      if (r.status !== 'Cancelado') {
        if (podeGerenciar) {
          // Administrador / Recepção
          const btnConfirmar = (r.status === 'Pendente' || r.status === 'Remarcado')
            ? `<button class="act-btn" style="color:var(--success)" data-action="confirm-agendamento" data-id="${r.id}" type="button">Confirmar</button>`
            : '';
          botoesAcao = `
            ${btnConfirmar}
            <button class="act-btn" style="color:var(--primary)" data-action="edit-agendamento" data-id="${r.id}" type="button">Alterar</button>
            <button class="act-btn" style="color:var(--danger)" data-action="cancel-agendamento" data-id="${r.id}" type="button">Cancelar</button>
            <button class="act-btn" data-action="view-agendamento" data-id="${r.id}" type="button">Ver</button>
          `;
        } else if (isCidadao) {
          const p = (r.data || '').split('/');
          const isPast = p.length === 3 ? (new Date(`${p[2]}-${p[1]}-${p[0]}T00:00:00`) < new Date(new Date().setHours(0,0,0,0))) : false;
          if (!isPast) {
            const btnConfirmar = (r.status === 'Pendente')
              ? `<button class="act-btn" style="color:var(--success)" data-action="confirm-agendamento" data-id="${r.id}" type="button">Confirmar</button>`
              : '';
            botoesAcao = `
              ${btnConfirmar}
              <button class="act-btn" style="color:var(--primary)" data-action="edit-agendamento" data-id="${r.id}" type="button">Alterar</button>
              <button class="act-btn" style="color:var(--danger)" data-action="cancel-agendamento" data-id="${r.id}" type="button">Cancelar</button>
              <button class="act-btn" data-action="view-agendamento" data-id="${r.id}" type="button">Ver</button>
            `;
          }
        }
      }

      return `
        <tr>
          <td class="mono text-muted-sm">${r.id}</td>
          <td><div class="fw-600">${r.paciente}</div><div class="text-muted-sm">CPF: ${r.cpf}</div></td>
          <td><div>${r.data}</div><div class="mono" style="color:var(--primary)">${r.horario}</div></td>
          <td>${r.especialidade}</td><td>${r.medico}</td><td>${r.unidade}</td>
          <td>${this.badge(r.status, r.badge)}</td>
          <td><div style="display:flex;gap:4px;flex-wrap:wrap">${botoesAcao}</div></td>
        </tr>`;
    }).join('');

    this.montarPaginacao(root.querySelector('.pagination'), {
      pageId: 'agendamentos', total, atual, totalPaginas,
      rerender: () => this.renderAgendamentos(root, data)
    });
  },

  renderConsultas(root, data) {
    const podeGerenciar = window.Permissoes?.podeGerenciarAtendimentos(window.App?.usuario?.perfil);
    const btnNova = root.querySelector('#btn-nova-consulta');
    if (btnNova) btnNova.style.display = podeGerenciar ? 'block' : 'none';

    const tbody = root.querySelector('[data-box="consultas-tbody"]');
    const listaCompleta = data.boxes?.consultas;
    if (!tbody || !listaCompleta) return;

    const { itens, atual, totalPaginas, total } = this.paginar(listaCompleta, 'consultas');
    tbody.innerHTML = itens.map(c => `
      <tr>
        <td><div class="fw-600">${c.paciente}</div><div class="text-muted-sm">${c.idade || ''}</div></td>
        <td>${c.especialidade}</td><td>${c.medico}</td>
        <td class="mono">${c.inicio}</td><td class="mono">${c.duracao}</td>
        <td>${this.badge(c.status, c.badge)}</td>
        <td><span class="mono text-muted-sm">${c.cid || '—'}</span></td>
        <td>
          <div style="display:flex;gap:4px">
            <button class="act-btn" style="color:var(--primary)" data-action="view-agenda-medico" data-medico="${c.medico}" type="button" title="Ver Agenda deste Profissional">Agenda</button>
            <button class="act-btn" data-action="view-consulta" data-paciente="${c.paciente}" type="button">Ver</button>
          </div>
        </td>
      </tr>`).join('');

    this.montarPaginacao(root.querySelector('.pagination'), {
      pageId: 'consultas', total, atual, totalPaginas,
      rerender: () => this.renderConsultas(root, data)
    });
  },

  renderExames(root, data) {
    const podeGerenciar = window.Permissoes?.podeGerenciarAtendimentos(window.App?.usuario?.perfil);
    const btnSolicitar = root.querySelector('#btn-solicitar-exame');
    if (btnSolicitar) btnSolicitar.style.display = podeGerenciar ? 'block' : 'none';

    const tbody = root.querySelector('[data-box="exames-tbody"]');
    const listaCompleta = data.boxes?.lista;
    if (!tbody || !listaCompleta) return;

    const { itens, atual, totalPaginas, total } = this.paginar(listaCompleta, 'exames');
    if (total === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:34px 14px;color:var(--text-muted);font-size:13px">Nenhum exame encontrado para os filtros selecionados.</td></tr>`;
    } else {
      tbody.innerHTML = itens.map(e => {
        const isConcluido = String(e.status || '').toLowerCase().includes('concl') || String(e.status || '').toLowerCase().includes('laudo emit');
        const atrasado = window.ExamesAPI?.isAtrasado(e);
        const statusExibido = atrasado ? 'Atrasado' : (isConcluido ? 'Concluído' : (e.status || 'Solicitado'));
        const badgeCls = atrasado ? 'b-red' : (isConcluido ? 'b-green' : (statusExibido === 'Em andamento' ? 'b-blue' : 'b-yellow'));

        // Exames concluídos não devem poder ser alterados
        const btnAlterar = (!isConcluido && podeGerenciar)
          ? `<button class="act-btn" data-action="edit-exame" data-id="${e.id}" type="button" title="Alterar Exame">Alterar</button>`
          : '';

        const btnHistorico = `<button class="act-btn" data-action="historico-exames" data-paciente="${e.paciente}" data-cpf="${e.cpf || ''}" type="button" title="Histórico do Paciente">Histórico</button>`;

        const btnDownload = (e.download || isConcluido)
          ? `<button class="act-btn" data-action="download-exame" data-id="${e.id}" type="button" style="color:var(--primary)">Download</button>`
          : (!podeGerenciar
              ? `<span style="color:var(--text-muted);font-size:11.5px">Aguardando Laudo</span>`
              : `<button class="act-btn" data-action="laudo-exame" data-id="${e.id}" type="button">Laudo</button>`);

        return `<tr>
          <td>
            <div class="fw-600">${e.paciente}</div>
            <div class="text-muted-sm">${e.cpf ? e.cpf + ' · ' : ''}ID: ${e.id || e.pid || '—'}</div>
          </td>
          <td>
            <div>${e.tipo}</div>
            ${e.solicitante ? `<div class="text-muted-sm">${e.solicitante}</div>` : ''}
          </td>
          <td>
            <span class="mono">${e.data}</span>
            ${e.horario ? `<div class="text-muted-sm mono">${e.horario}</div>` : ''}
          </td>
          <td>${e.unidade || 'Unidade Central'}</td>
          <td>${this.badge(statusExibido, badgeCls)}</td>
          <td>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              <button class="act-btn" data-action="view-exame" data-id="${e.id}" type="button">Ver</button>
              ${btnAlterar}
              ${btnHistorico}
              ${btnDownload}
            </div>
          </td>
        </tr>`;
      }).join('');
    }

    this.montarPaginacao(root.querySelector('.pagination'), {
      pageId: 'exames', total, atual, totalPaginas,
      rerender: () => this.renderExames(root, data)
    });
  },

  renderUnidades(root, data) {
    if (!root) root = document.getElementById('screen-container');
    if (!root) return;

    data = data || window.App?.data?.unidades || {};
    const boxes = data.boxes || {};

    // Atualiza os cards de estatísticas se fornecidos em data.boxes.stats
    const statsEl = root.querySelector('[data-box="stats"]');
    if (statsEl && boxes.stats) {
      this.renderStats(statsEl, boxes.stats);
    }

    // Tabela de Unidades
    const tbody = root.querySelector('[data-box="unidades-tbody"]');
    const listaCompleta = boxes.lista || [];

    if (tbody) {
      const { itens, atual, totalPaginas, total } = this.paginar(listaCompleta, 'unidades');
      if (total === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:34px 14px;color:var(--text-muted);font-size:13px">Nenhuma unidade de saúde encontrada para os filtros selecionados.</td></tr>`;
      } else {
        tbody.innerHTML = itens.map(u => {
          const isManutencao = u.status === 'Manutenção';
          const isInativa = u.status === 'Inativa';
          let statusCor = 'var(--success)';
          if (isManutencao) statusCor = 'var(--warning)';
          else if (isInativa || u.statusColor === 'danger') statusCor = 'var(--danger)';
          else if (u.statusColor === 'warning') statusCor = 'var(--warning)';

          const chipBg = u.tipoBg || (u.tipo === 'Hospital' ? '#fef2f2' : (u.tipo === 'UPA' ? '#fef9c3' : (u.tipo === 'AME' ? '#f3e8ff' : '#e8f2fb')));
          const chipColor = u.tipoColor || (u.tipo === 'Hospital' ? '#b91c1c' : (u.tipo === 'UPA' ? '#92400e' : (u.tipo === 'AME' ? '#7e22ce' : '#1d4ed8')));

          const capacidadeHtml = u.indisponivel
            ? `<div style="font-size:11.5px;color:var(--danger);margin-bottom:4px;font-weight:600">${u.capacidade || 'Indisponível · Reforma'}</div><div class="prog-bar"><div class="prog-fill bar-red" style="width:100%"></div></div>`
            : `<div style="font-size:11.5px;color:var(--text-muted);margin-bottom:4px">${u.capacidade || '—'}</div><div class="prog-wrap"><div class="prog-bar"><div class="prog-fill ${u.barClass || ''}" style="width:${u.ocupacao || 0}%;${u.barColor ? `background:${u.barColor}` : ''}"></div></div><span class="prog-label" style="color:${u.barColor || 'var(--primary)'}">${u.ocupacao != null ? `${u.ocupacao}%` : ''}</span></div>`;

          return `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:36px;height:36px;border-radius:9px;background:${u.icoBg || '#fef2f2'};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">${u.icone || '🏥'}</div>
                  <div>
                    <div style="font-weight:600">${u.nome}</div>
                    <div style="font-size:11px;color:var(--text-muted)">ID: ${u.id}</div>
                  </div>
                </div>
              </td>
              <td><span class="type-chip" style="background:${chipBg};color:${chipColor}">${u.tipo}</span></td>
              <td><div style="font-size:12.5px">${u.endereco}</div></td>
              <td>${capacidadeHtml}</td>
              <td>
                <span style="display:flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:${statusCor}">
                  <span style="width:7px;height:7px;border-radius:50%;background:${statusCor};display:inline-block"></span>${u.status}
                </span>
              </td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="act-btn" data-action="view-unidade" data-id="${u.id}" type="button">Ver</button>
                  <button class="act-btn" data-action="edit-unidade" data-id="${u.id}" type="button">Editar</button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }

      this.montarPaginacao(root.querySelector('.pagination'), {
        pageId: 'unidades', total, atual, totalPaginas,
        rerender: () => this.renderUnidades(root, data)
      });
    }

    // Insumos (se container dinâmico existir)
    const insumosEl = root.querySelector('[data-box="insumos-rows"]');
    if (insumosEl && Array.isArray(boxes.insumos)) {
      const bgMap = { success: '#e6f9f7', warning: '#fef2f2', danger: '#fef9c3' };
      insumosEl.innerHTML = boxes.insumos.map(item => `
        <div class="insumo-row">
          <div class="insumo-ico" style="background:${item.icoBg || bgMap[item.color] || '#e8f2fb'}">${item.icone || '📦'}</div>
          <div class="insumo-name">${item.nome}</div>
          <div class="insumo-pct" style="color:var(--${item.color || 'primary'})">${item.pct}%</div>
        </div>
      `).join('');
    }

    // Distribuição por tipo (se container dinâmico existir)
    const distEl = root.querySelector('[data-box="distribuicao-rows"]');
    if (distEl && Array.isArray(boxes.distribuicao)) {
      distEl.innerHTML = boxes.distribuicao.map(d => `
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="display:flex;align-items:center;gap:6px">
            <span style="width:10px;height:10px;border-radius:50%;background:${d.cor || '#0a6ebd'};display:inline-block"></span>
            <span style="font-size:13px">${d.tipo}</span>
          </span>
          <span style="font-weight:700">${d.total}</span>
        </div>
      `).join('');
    }

    // Alertas (se container dinâmico existir)
    const alertasEl = root.querySelector('[data-box="alertas-rows"]');
    if (alertasEl && Array.isArray(boxes.alertas)) {
      alertasEl.innerHTML = boxes.alertas.map(a => `
        <div class="alert-item" style="padding:9px 0">
          <div class="alert-ico a-${a.tipo || 'warn'}" style="width:28px;height:28px">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m10.29 3.86-8.19 14.17A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.72-3l-8.19-14.14a2 2 0 0 0-3.46.01z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div class="alert-body">
            <strong style="font-size:12px">${a.titulo}</strong>
            <p>${a.descricao}</p>
          </div>
        </div>
      `).join('');
    }
  },

  renderVacinacao(root, data) {
    if (!root) root = document.getElementById('screen-container');
    if (!root) return;
    data = data || window.App?.data?.vacinacao || {};
    const boxes = data.boxes || {};

    const statsEl = root.querySelector('[data-box="stats"]');
    if (statsEl && boxes.stats) {
      this.renderStats(statsEl, boxes.stats);
    }
  },

  renderLogs(root, data) {
    const container = root.querySelector('[data-box="logs-list"]');
    const registrosCompletos = data.boxes?.registros || data.boxes?.lista;
    if (!container || !registrosCompletos) return;
    const dotColors = { danger: 'var(--danger)', success: 'var(--success)', warning: 'var(--warning)', primary: 'var(--primary)' };

    const { itens: registros, atual, totalPaginas, total } = this.paginar(registrosCompletos, 'logs');
    if (total === 0) {
      container.innerHTML = `<div style="text-align:center;padding:34px 14px;color:var(--text-muted);font-size:13px">Nenhum registro de log encontrado para os filtros selecionados.</div>`;
    } else {
      const offset = (atual - 1) * PAGE_SIZE_PADRAO;
      container.innerHTML = registros.map((r, i) => `
        <div class="log-item" data-action="view-log" data-index="${offset + i}" style="cursor:pointer">
          <div class="log-dot" style="background:${dotColors[r.dot] || 'var(--primary)'}"></div>
          <div class="log-time">${r.hora}</div>
          <div style="flex:1">
            <div class="log-text"><span class="badge ${r.badge}" style="font-size:10px;padding:1px 7px;margin-right:6px">${r.tipo}</span><strong>${r.titulo || r.acao}</strong></div>
            <div class="log-meta">${r.meta || `Módulo: ${r.modulo || 'SISTEMA'} · Usuário: ${r.usuario || 'sistema'} · ${r.descricao || ''}`}</div>
          </div>
        </div>`).join('');
    }

    // Atualiza contadores laterais se presentes
    const sideInfo = root.querySelector('#side-info-count');
    const sideAcesso = root.querySelector('#side-acesso-count');
    const sideAviso = root.querySelector('#side-aviso-count');
    const sideErro = root.querySelector('#side-erro-count');
    if (sideInfo || sideAcesso || sideAviso || sideErro) {
      const todos = registrosCompletos || [];
      if (sideInfo) sideInfo.textContent = todos.filter(l => (l.tipo || '').toLowerCase().includes('info')).length;
      if (sideAcesso) sideAcesso.textContent = todos.filter(l => (l.tipo || '').toLowerCase().includes('acess')).length;
      if (sideAviso) sideAviso.textContent = todos.filter(l => (l.tipo || '').toLowerCase().includes('avis')).length;
      if (sideErro) sideErro.textContent = todos.filter(l => (l.tipo || '').toLowerCase().includes('err')).length;
    }

    this.montarPaginacao(root.querySelector('.pagination'), {
      pageId: 'logs', total, atual, totalPaginas,
      rerender: () => this.renderLogs(root, data)
    });
  },

  renderConfiguracoes(root, data, usuario) {
    const b = data?.boxes || {};
    const nav = root.querySelector('[data-box="config-nav"]');
    if (nav && b.secoes) {
      nav.innerHTML = b.secoes.map((s, i) =>
        `<button type="button" class="config-nav-item${i === 0 ? ' active' : ''}" data-config-tab="${s.id}">${s.label}</button>`
      ).join('');
      this.bindConfigTabs(root);
    }

    const u = usuario || b.perfil;
    if (u) {
      const set = (id, val) => { const el = root.querySelector(id); if (el && val != null) el.value = val; };
      set('#cfg-nome', u.nome);
      set('#cfg-email', u.email);
      set('#cfg-cargo', u.cargo);
      set('#cfg-unidade', u.unidade);
      set('#cfg-telefone', u.telefone);

      const p = u.perfil || '';
      if (p === 'Cidadão' || p === 'Paciente' || p === 'Administrador') {
        const cargoField = root.querySelector('#cfg-cargo')?.closest('.config-field');
        if (cargoField) cargoField.style.display = 'none';
      }
      if (p === 'Cidadão' || p === 'Paciente') {
        const unidadeField = root.querySelector('#cfg-unidade')?.closest('.config-field');
        if (unidadeField) unidadeField.style.display = 'none';
      }
    }

    const notif = root.querySelector('[data-box="notificacoes-list"]');
    if (notif && b.notificacoes) {
      notif.innerHTML = b.notificacoes.map(n => `
        <div class="toggle-row">
          <div class="toggle-info"><strong>${n.titulo}</strong><span>${n.descricao}</span></div>
          <input type="checkbox" data-notif="${n.id}" ${n.ativo ? 'checked' : ''}>
        </div>`).join('');
    }

    if (b.seguranca) {
      const t = root.querySelector('#cfg-timeout');
      const last = root.querySelector('#cfg-ultimo-acesso');
      if (t) t.value = b.seguranca.sessaoTimeout;
      if (last) last.value = b.seguranca.ultimoAcesso;
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

  renderCadastroUsuarios(root, data) {
    const listContainer = root.querySelector('#users-list-container');
    const badge = root.querySelector('#users-count-badge');
    const form = root.querySelector('#form-cadastro-usuario');
    const selectPerfil = root.querySelector('#cad-perfil');
    const inputCpf = root.querySelector('#cad-cpf');
    const inputSus = root.querySelector('#cad-sus');
    const inputEmail = root.querySelector('#cad-email');
    const btnLimpar = root.querySelector('#btn-limpar-cadastro');
    const inputBusca = root.querySelector('#busca-usuarios-cadastrados');

    // Feedback de validação em tempo real (formato/unicidade de CPF e e-mail),
    // usando as mesmas regras que o "endpoint" /usuarios/cadastrar aplica no
    // envio do formulário (ver js/api/usuarios.js). Isso evita que o usuário
    // só descubra um CPF duplicado depois de preencher o formulário inteiro.
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

    const loadUsersList = () => {
      const dbUsers = window.App?.initUsuariosDB() || [];
      const query = inputBusca?.value.trim().toLowerCase() || '';
      
      const filtered = dbUsers.filter(u => 
        u.nome.toLowerCase().includes(query) || 
        u.cpf.includes(query)
      );

      if (badge) badge.textContent = filtered.length;

      if (!listContainer) return;

      if (filtered.length === 0) {
        listContainer.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12.5px;">Nenhum usuário encontrado.</div>';
        return;
      }

      listContainer.innerHTML = filtered.map(u => {
        let extraInfo = '';
        if (u.perfil === 'Cidadão' || u.perfil === 'Paciente') {
          extraInfo = `RG: ${u.rg || '—'} · SUS: ${u.sus || '—'} · acesso web só aos próprios dados (visualização)`;
        } else if (u.perfil === 'Recepção') {
          extraInfo = `Unidade: ${u.unidade || '—'}`;
        } else if (u.perfil === 'Profissional da Saúde') {
          extraInfo = `Reg: ${u.registro || '—'} · ${u.especialidade || '—'} (${u.unidade || '—'})`;
        } else {
          extraInfo = `${u.cargo || '—'} (${u.setor || '—'})`;
        }

        const badgeClasses = {
          'Administrador': 'b-red',
          'Profissional da Saúde': 'b-blue',
          'Recepção': 'b-purple',
          'Cidadão': 'b-green',
          'Paciente': 'b-green'
        };
        const badgeClass = badgeClasses[u.perfil] || 'b-gray';

        return `
          <div style="padding: 12px 20px; border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; transition: background 0.15s;" class="registered-user-row">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="font-size:13.5px; color: var(--text);">${u.nome}</strong>
              <span class="badge ${badgeClass}" style="font-size: 9.5px; padding: 2px 6px;">${u.perfil}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">
              CPF: <span style="font-family:monospace; color:var(--text);">${u.cpf}</span> · E-mail: <span>${u.email}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); font-style: italic;">
              ${extraInfo}
            </div>
          </div>
        `;
      }).join('');
    };

    if (inputCpf) {
      inputCpf.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length <= 11) {
          if (val.length > 9) {
            val = val.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
          } else if (val.length > 6) {
            val = val.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
          } else if (val.length > 3) {
            val = val.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
          }
          e.target.value = val;
        }

        // Atualiza a obrigatoriedade do RG com base na presença do CPF
        const rgInput = root.querySelector('#cad-rg');
        if (rgInput && (selectPerfil?.value === 'Cidadão' || selectPerfil?.value === 'Paciente')) {
          if (e.target.value.trim() !== '') {
            rgInput.removeAttribute('required');
          } else {
            rgInput.setAttribute('required', 'required');
          }
        }
      });
    }

    if (inputSus) {
      inputSus.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length <= 15) {
          if (val.length > 11) {
            val = val.replace(/^(\d{3})(\d{4})(\d{4})(\d{1,4})$/, '$1.$2.$3.$4');
          } else if (val.length > 7) {
            val = val.replace(/^(\d{3})(\d{4})(\d{1,4})$/, '$1.$2.$3');
          } else if (val.length > 3) {
            val = val.replace(/^(\d{3})(\d{1,4})$/, '$1.$2');
          }
          e.target.value = val;
        }
      });

      inputCpf.addEventListener('blur', () => {
        const val = inputCpf.value.trim();
        if (!val) { mostrarMensagemCampo(inputCpf, '', ''); return; }
        const check = window.UsuariosAPI?.validarCPF(val);
        if (check && !check.valido) {
          mostrarMensagemCampo(inputCpf, check.mensagem, 'erro');
        } else if (window.UsuariosAPI && !window.UsuariosAPI.cpfDisponivel(val)) {
          mostrarMensagemCampo(inputCpf, 'Este CPF já está cadastrado no sistema.', 'erro');
        } else {
          mostrarMensagemCampo(inputCpf, 'CPF válido e disponível.', 'ok');
        }
      });
    }

    if (inputEmail) {
      inputEmail.addEventListener('blur', () => {
        const val = inputEmail.value.trim();
        if (!val) { mostrarMensagemCampo(inputEmail, '', ''); return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          mostrarMensagemCampo(inputEmail, 'Informe um e-mail em um formato válido.', 'erro');
        } else if (window.UsuariosAPI && !window.UsuariosAPI.emailDisponivel(val)) {
          mostrarMensagemCampo(inputEmail, 'Este e-mail já está cadastrado no sistema.', 'erro');
        } else {
          mostrarMensagemCampo(inputEmail, 'E-mail disponível.', 'ok');
        }
      });
    }

    if (selectPerfil) {
      selectPerfil.addEventListener('change', (e) => {
        const profile = e.target.value;
        
        root.querySelectorAll('.profile-fields-section').forEach(sec => {
          sec.style.display = 'none';
        });

        const toggleRequired = (sectionSelector, required) => {
          const fields = root.querySelectorAll(`${sectionSelector} input, ${sectionSelector} select`);
          fields.forEach(field => {
            if (field.id === 'cad-rg') {
              const cpfInput = root.querySelector('#cad-cpf');
              if (cpfInput && cpfInput.value.trim() !== '') {
                field.removeAttribute('required');
                return;
              }
            }
            if (required) {
              field.setAttribute('required', 'required');
            } else {
              field.removeAttribute('required');
            }
          });
        };

        toggleRequired('#fields-paciente', false);
        toggleRequired('#fields-recepcao', false);
        toggleRequired('#fields-profissional', false);
        toggleRequired('#fields-administrador', false);

        if (profile === 'Cidadão' || profile === 'Paciente') {
          const sec = root.querySelector('#fields-paciente');
          if (sec) sec.style.display = 'block';
          toggleRequired('#fields-paciente', true);
        } else if (profile === 'Recepção') {
          const sec = root.querySelector('#fields-recepcao');
          if (sec) sec.style.display = 'block';
          toggleRequired('#fields-recepcao', true);
        } else if (profile === 'Profissional da Saúde') {
          const sec = root.querySelector('#fields-profissional');
          if (sec) sec.style.display = 'block';
          toggleRequired('#fields-profissional', true);
        } else if (profile === 'Administrador') {
          const sec = root.querySelector('#fields-administrador');
          if (sec) sec.style.display = 'block';
          toggleRequired('#fields-administrador', true);
        }
      });
    }

    if (inputBusca) {
      inputBusca.addEventListener('input', loadUsersList);
    }

    if (btnLimpar) {
      btnLimpar.addEventListener('click', () => {
        if (form) form.reset();
        root.querySelectorAll('.profile-fields-section').forEach(sec => {
          sec.style.display = 'none';
          const fields = sec.querySelectorAll('input, select');
          fields.forEach(field => field.removeAttribute('required'));
        });
        limparMensagensCampos();
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const perfil = selectPerfil?.value;
        const nome = root.querySelector('#cad-nome')?.value.trim();
        const cpf = root.querySelector('#cad-cpf')?.value.trim();
        const email = root.querySelector('#cad-email')?.value.trim();
        const senha = root.querySelector('#cad-senha')?.value;

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = 'Validando e-mail...';
        btn.disabled = true;

        try {
          const resEmail = await fetch(`https://api.mailcheck.ai/email/${encodeURIComponent(email)}`);
          if (resEmail.ok) {
            const dataEmail = await resEmail.json();
            if (dataEmail.mx === false) {
              window.App?.toast('O e-mail informado é inválido ou o domínio não existe.', 'error');
              btn.textContent = originalText;
              btn.disabled = false;
              return;
            }
            if (dataEmail.disposable === true) {
              window.App?.toast('E-mails temporários (descartáveis) não são permitidos.', 'error');
              btn.textContent = originalText;
              btn.disabled = false;
              return;
            }
          }
        } catch (err) {
          console.warn('Erro na validação de e-mail via API:', err);
        }

        btn.textContent = 'Salvando...';

        const bodyData = { perfil, nome, cpf, email, senha };

        if (perfil === 'Cidadão' || perfil === 'Paciente') {
          bodyData.rg = root.querySelector('#cad-rg')?.value.trim();
          bodyData.sus = root.querySelector('#cad-sus')?.value.trim();
          bodyData.nascimento = root.querySelector('#cad-nascimento')?.value;
        } else if (perfil === 'Recepção') {
          bodyData.unidade = root.querySelector('#cad-recep-unidade')?.value;
        } else if (perfil === 'Profissional da Saúde') {
          bodyData.registro = root.querySelector('#cad-registro')?.value.trim();
          bodyData.especialidade = root.querySelector('#cad-especialidade')?.value;
          bodyData.unidade = root.querySelector('#cad-unidade')?.value;
        } else if (perfil === 'Administrador') {
          bodyData.setor = root.querySelector('#cad-setor')?.value.trim();
          bodyData.cargo = root.querySelector('#cad-cargo')?.value.trim();
        }

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
            root.querySelectorAll('.profile-fields-section').forEach(sec => {
              sec.style.display = 'none';
              const fields = sec.querySelectorAll('input, select');
              fields.forEach(field => field.removeAttribute('required'));
            });
            limparMensagensCampos();
            loadUsersList();
          } else {
            window.App?.toast(result.error || 'Erro ao cadastrar usuário.', 'danger');
          }
        } catch (err) {
          console.error(err);
          window.App?.toast('Erro de rede ou servidor ao cadastrar.', 'danger');
        } finally {
          btn.textContent = originalText;
          btn.disabled = false;
        }
      });
    }

    loadUsersList();
  }
}

window.Render = Render;
