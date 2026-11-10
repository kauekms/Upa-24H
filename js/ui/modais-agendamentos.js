/**
 * Modais de Agendamentos e Agenda do Profissional.
 *
 * Métodos do objeto App separados de js/app.js por domínio. São anexados
 * ao App com Object.assign, então continuam sendo chamados como
 * this.metodo() / App.metodo() exatamente como antes.
 */
Object.assign(App, {
  /** Liga o select de especialidade ao de médicos (mostra só os da especialidade). */
  _ligarEspecialidadeMedico(selEsp, selMed) {
    if (!selEsp || !selMed) return;
    selEsp.addEventListener('change', () => {
      const atual = selMed.value;
      const medicos = Catalogos.medicosDa(selEsp.value).map(m => m.nome);
      selMed.innerHTML = Catalogos.opcoes(medicos, medicos.includes(atual) ? atual : medicos[0]);
    });
  },

  /** Recarrega a tela atual se ela mostra agendamentos. */
  _atualizarTelaAgendamentos() {
    if (['agendamentos', 'dashboard'].includes(this.currentPage)) this.goTo(this.currentPage);
  },

  showNovoAgendamentoModal() {
    // Data mínima = amanhã, no fuso LOCAL (toISOString usava UTC e, depois das
    // 21h em Brasília, sugeria uma data 2 dias à frente).
    const amanha = new Date(Date.now() + 24 * 3600 * 1000);
    const minDateStr = Util.dataLocalISO(amanha);
    const horaSugerida = `${String(Math.min(amanha.getHours() + 1, 23)).padStart(2, '0')}:00`;
    const espInicial = Catalogos.especialidades[0];

    const html = `
      <form id="form-novo-agendamento" novalidate>
        <div class="callout callout-info">
          <strong>RN01</strong> — Agendamentos exigem <strong>antecedência mínima de 24 horas</strong>. O sistema verifica a disponibilidade do profissional e da unidade.
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label for="ag-cpf">CPF do cidadão</label>
            <input type="text" id="ag-cpf" placeholder="000.000.000-00" maxlength="14" inputmode="numeric" required>
          </div>
          <div class="form-group">
            <label for="ag-paciente">Cidadão</label>
            <input type="text" id="ag-paciente" placeholder="Digite o CPF para localizar" readonly>
          </div>
          <div class="form-group">
            <label for="ag-data">Data</label>
            <input type="date" id="ag-data" min="${minDateStr}" value="${minDateStr}" required>
          </div>
          <div class="form-group">
            <label for="ag-horario">Horário</label>
            <input type="time" id="ag-horario" value="${horaSugerida}" step="300" required>
          </div>
          <div class="form-group">
            <label for="ag-especialidade">Especialidade</label>
            <select id="ag-especialidade">${Catalogos.opcoes(Catalogos.especialidades, espInicial)}</select>
          </div>
          <div class="form-group">
            <label for="ag-medico">Profissional</label>
            <select id="ag-medico">${Catalogos.opcoes(Catalogos.medicosDa(espInicial).map(m => m.nome))}</select>
          </div>
          <div class="form-group full">
            <label for="ag-unidade">Unidade de saúde</label>
            <select id="ag-unidade">${Catalogos.opcoes(Catalogos.unidades)}</select>
          </div>
        </div>
      </form>`;

    this.showModal({
      title: 'Novo agendamento',
      bodyHtml: html,
      confirmText: 'Confirmar agendamento',
      size: 'lg',
      onConfirm: async () => {
        const v = id => document.getElementById(id)?.value?.trim() || '';
        const paciente = v('ag-paciente');
        const cpf = v('ag-cpf');
        if (!paciente || !cpf) {
          this.toast('Cidadão não identificado. Informe um CPF cadastrado.', 'warning');
          return false;
        }
        const res = await window.AgendamentosAPI.solicitar({
          paciente, cpf,
          data: v('ag-data'),
          horario: v('ag-horario'),
          especialidade: v('ag-especialidade'),
          medico: v('ag-medico'),
          unidade: v('ag-unidade'),
          perfilOperador: this.usuario?.perfil
        }, this.usuario?.nome);

        if (!res.body?.success) {
          this.toast(res.body?.error || 'Erro ao solicitar agendamento.', 'warning');
          return false;
        }
        this.toast(res.body.message || 'Agendamento solicitado com sucesso!', 'success');
        this._atualizarTelaAgendamentos();
        return true;
      }
    });

    const agPaciente = document.getElementById('ag-paciente');
    this.ligarBuscaCidadao(document.getElementById('ag-cpf'), {
      aoEncontrar: c => { agPaciente.value = c.nome; },
      aoLimpar: naoEncontrado => {
        agPaciente.value = '';
        agPaciente.placeholder = naoEncontrado ? 'Cidadão não cadastrado' : 'Digite o CPF para localizar';
      }
    });
    this._ligarEspecialidadeMedico(document.getElementById('ag-especialidade'), document.getElementById('ag-medico'));
  },

  showEditarAgendamentoModal(item) {
    const esc = Util.esc;
    const dataISO = Util.brParaISO(item.data) || Util.dataLocalISO();
    const html = `
      <form id="form-editar-agendamento" novalidate>
        <div class="callout callout-info">
          <strong>RN02</strong> — Alterações feitas pelo cidadão exigem <strong>24 horas de antecedência</strong> em relação ao horário original e ao novo horário. O sistema verifica conflitos de agenda.
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>Agendamento</label>
            <input type="text" value="${esc(item.id)}" readonly class="mono">
          </div>
          <div class="form-group">
            <label>Cidadão</label>
            <input type="text" value="${esc(item.paciente)} · ${esc(item.cpf)}" readonly>
          </div>
          <div class="form-group">
            <label for="edit-ag-data">Nova data</label>
            <input type="date" id="edit-ag-data" value="${esc(dataISO)}" required>
          </div>
          <div class="form-group">
            <label for="edit-ag-horario">Novo horário</label>
            <input type="time" id="edit-ag-horario" value="${esc(item.horario || '14:00')}" step="300" required>
          </div>
          <div class="form-group">
            <label for="edit-ag-especialidade">Especialidade</label>
            <select id="edit-ag-especialidade">${Catalogos.opcoes(Catalogos.especialidades, item.especialidade)}</select>
          </div>
          <div class="form-group">
            <label for="edit-ag-medico">Profissional</label>
            <select id="edit-ag-medico">${Catalogos.opcoes(Catalogos.medicos.map(m => m.nome), item.medico)}</select>
          </div>
          <div class="form-group full">
            <label for="edit-ag-unidade">Unidade de saúde</label>
            <select id="edit-ag-unidade">${Catalogos.opcoes(Catalogos.unidades, item.unidade)}</select>
          </div>
        </div>
      </form>`;

    this.showModal({
      title: `Alterar agendamento ${item.id}`,
      bodyHtml: html,
      confirmText: 'Salvar alteração',
      size: 'lg',
      onConfirm: async () => {
        const v = id => document.getElementById(id)?.value || '';
        const res = await window.AgendamentosAPI.alterar({
          id: item.id,
          data: v('edit-ag-data'),
          horario: v('edit-ag-horario'),
          especialidade: v('edit-ag-especialidade'),
          medico: v('edit-ag-medico'),
          unidade: v('edit-ag-unidade'),
          perfilOperador: this.usuario?.perfil
        }, this.usuario?.nome);

        if (!res.body?.success) {
          this.toast(res.body?.error || 'Erro ao alterar agendamento.', 'warning');
          return false;
        }
        this.toast(res.body.message || 'Agendamento alterado com sucesso!', 'success');
        this._atualizarTelaAgendamentos();
        return true;
      }
    });
    this._ligarEspecialidadeMedico(document.getElementById('edit-ag-especialidade'), document.getElementById('edit-ag-medico'));
  },

  showCancelarAgendamentoModal(item) {
    const esc = Util.esc;
    const ehEquipe = window.Permissoes?.podeGerenciarAtendimentos(this.usuario?.perfil);
    const html = ehEquipe ? `
      <p class="modal-texto">Cancelamento administrativo do agendamento <strong class="mono text-primary">${esc(item.id)}</strong> de <strong>${esc(item.paciente)}</strong> (${esc(item.data)} às ${esc(item.horario)}).</p>
      <div class="callout callout-danger">
        <strong>RN03</strong> — O cancelamento pela equipe é permitido a qualquer momento, mas <strong>exige justificativa</strong>, registrada na auditoria.
      </div>
      <div class="form-group">
        <label for="cancel-justificativa">Justificativa (obrigatória)</label>
        <textarea id="cancel-justificativa" rows="3" placeholder="Ex.: ausência imprevista do profissional, manutenção de equipamento, remanejamento de escala…" required></textarea>
      </div>` : `
      <p class="modal-texto">Deseja recusar o agendamento <strong class="mono text-primary">${esc(item.id)}</strong> de <strong>${esc(item.data)} às ${esc(item.horario)}</strong> com ${esc(item.medico)}? O horário será liberado.</p>
      <div class="callout callout-info">
        <strong>RN02</strong> — A recusa pelo cidadão precisa de <strong>24 horas de antecedência</strong> do horário marcado. Para remarcar, procure a Recepção.
      </div>`;

    this.showModal({
      title: ehEquipe ? 'Cancelamento administrativo' : 'Recusar agendamento',
      bodyHtml: html,
      confirmText: ehEquipe ? 'Confirmar cancelamento' : 'Recusar agendamento',
      confirmVariant: 'danger',
      cancelText: 'Voltar',
      onConfirm: async () => {
        const justificativa = document.getElementById('cancel-justificativa')?.value.trim() || '';
        if (ehEquipe && !justificativa) {
          this.toast('RN03: informe a justificativa do cancelamento.', 'warning');
          document.getElementById('cancel-justificativa')?.focus();
          return false;
        }
        const res = await window.AgendamentosAPI.cancelar({
          id: item.id,
          tipo: ehEquipe ? 'ADMINISTRATIVO' : 'CIDADAO',
          justificativa,
          perfilOperador: this.usuario?.perfil
        }, this.usuario?.nome);

        if (!res.body?.success) {
          this.toast(res.body?.error || 'Erro ao cancelar agendamento.', 'warning');
          return false;
        }
        this.toast(ehEquipe ? (res.body.message || 'Agendamento cancelado.') : 'Agendamento recusado. O horário foi liberado.', 'success');
        this._atualizarTelaAgendamentos();
        return true;
      }
    });
  },

  showAgendaMedicoModal(nomeMedicoInicial) {
    const esc = Util.esc;
    const medicos = Catalogos.medicos.map(m => m.nome);
    const medicoAtual = nomeMedicoInicial || medicos[0];
    const { agenda = {} } = window.ConsultasAPI?.getAgendaProfissional(medicoAtual) || {};
    const ind = agenda.indicadores || {};

    const consultasHtml = (agenda.consultasHoje || []).map(c => `
      <tr>
        <td class="mono fw-600">${esc(c.inicio)}</td>
        <td><strong>${esc(c.paciente)}</strong> <span class="text-muted-sm">${esc(c.idade || '')}</span></td>
        <td class="mono">${esc(c.duracao || '—')}</td>
        <td>${Render.badge(c.status, c.badge)}</td>
        <td class="mono text-muted-sm">${esc(c.cid || '—')}</td>
      </tr>`).join('') || '<tr class="linha-vazia"><td colspan="5"><div class="estado-vazio compacto"><span>Nenhuma consulta na agenda.</span></div></td></tr>';

    const futurosHtml = (agenda.agendamentosFuturos || []).map(a => `
      <div class="lista-linha">
        <div><strong>${esc(a.paciente)}</strong> <span class="text-muted-sm">${esc(a.data)} às ${esc(a.horario)}</span></div>
        ${Render.badge(a.status, a.badge)}
      </div>`).join('') || '<div class="estado-vazio compacto"><span>Nenhum agendamento futuro.</span></div>';

    const mini = (rotulo, valor, cls = '') => `<div class="mini-stat"><span>${esc(rotulo)}</span><strong class="${cls}">${esc(valor)}</strong></div>`;

    this.showModal({
      title: `Agenda — ${medicoAtual}`,
      size: 'lg',
      confirmText: null,
      cancelText: 'Fechar',
      bodyHtml: `
        <div class="agenda-topo">
          <div class="form-group" style="margin:0;flex:1;min-width:220px">
            <label for="select-agenda-medico-modal">Profissional</label>
            <select id="select-agenda-medico-modal">${Catalogos.opcoes(medicos, medicoAtual)}</select>
          </div>
          <div class="agenda-esp"><span>Especialidade</span><strong>${esc(agenda.especialidade || '—')}</strong></div>
        </div>
        <div class="mini-stats">
          ${mini('Agendadas', ind.agendadas || 0)}
          ${mini('Na fila', ind.aguardando || 0)}
          ${mini('Concluídas', ind.concluidas || 0)}
          ${mini('Canceladas', ind.canceladas || 0, 'text-danger')}
        </div>
        <h4 class="secao-titulo">Consultas do profissional</h4>
        <div class="tbl-wrap tbl-compacta"><table>
          <thead><tr><th>Horário</th><th>Paciente</th><th>Duração</th><th>Status</th><th>CID</th></tr></thead>
          <tbody>${consultasHtml}</tbody>
        </table></div>
        <h4 class="secao-titulo">Próximos agendamentos</h4>
        <div class="lista-caixa">${futurosHtml}</div>`
    });

    const sel = document.getElementById('select-agenda-medico-modal');
    if (sel) sel.onchange = () => this.showAgendaMedicoModal(sel.value);
  },

  showAgendamentoModal(item) {
    if (!item) return;
    const esc = Util.esc;
    const podeGerenciar = window.Permissoes?.podeGerenciarAtendimentos(this.usuario?.perfil);
    const ehCidadao = Util.ehCidadao(this.usuario);
    const aguardando = item.status === 'Pendente' || item.status === 'Remarcado';
    const linha = (rotulo, valor) => `<div class="detalhe-linha"><dt>${esc(rotulo)}</dt><dd>${valor}</dd></div>`;

    const html = `
      <dl class="detalhe-lista">
        ${linha('Agendamento', `<strong class="mono text-primary">${esc(item.id)}</strong>`)}
        ${linha('Cidadão', `<strong>${esc(item.paciente)}</strong>`)}
        ${linha('CPF', `<span class="mono">${esc(item.cpf)}</span>`)}
        ${linha('Data e horário', `${esc(item.data)} às <strong>${esc(item.horario)}</strong>`)}
        ${linha('Especialidade', esc(item.especialidade))}
        ${linha('Profissional', esc(item.medico))}
        ${linha('Unidade', esc(item.unidade))}
        ${linha('Status', Render.badge(item.status, item.badge))}
      </dl>
      ${item.motivoCancelamento ? `<div class="callout callout-danger"><strong>Motivo do cancelamento:</strong> ${esc(item.motivoCancelamento)}</div>` : ''}
      ${item.status !== 'Cancelado' && podeGerenciar ? `
        <div class="modal-acoes-extra">
          <button class="btn btn-outline" id="btn-modal-alterar-ag" type="button">Alterar</button>
          <button class="btn btn-outline-danger" id="btn-modal-cancelar-ag" type="button">Cancelar agendamento</button>
        </div>` : ''}
      ${item.status !== 'Cancelado' && ehCidadao ? `
        <div class="modal-acoes-extra">
          ${aguardando ? '<button class="btn btn-primary" id="btn-modal-aceitar-ag" type="button">Aceitar agendamento</button>' : ''}
          <button class="btn btn-outline-danger" id="btn-modal-cancelar-ag" type="button">Recusar agendamento</button>
        </div>` : ''}`;

    this.showModal({
      title: 'Detalhes do agendamento',
      bodyHtml: html,
      confirmText: null,
      cancelText: 'Fechar'
    });

    document.getElementById('btn-modal-alterar-ag')?.addEventListener('click', () => this.showEditarAgendamentoModal(item));
    document.getElementById('btn-modal-aceitar-ag')?.addEventListener('click', () => {
      this.closeModal();
      this.executarAcao('confirm-agendamento', { id: item.id });
    });
    document.getElementById('btn-modal-cancelar-ag')?.addEventListener('click', () => this.showCancelarAgendamentoModal(item));
  }
});
