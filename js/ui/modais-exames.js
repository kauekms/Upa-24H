/**
 * Modais de Exames Laboratoriais e Laudos.
 *
 * Métodos do objeto App separados de js/app.js por domínio. São anexados
 * ao App com Object.assign, então continuam sendo chamados como
 * this.metodo() / App.metodo() exatamente como antes.
 */
Object.assign(App, {
  _atualizarTelaExames() {
    if (['exames', 'dashboard'].includes(this.currentPage)) this.goTo(this.currentPage);
    this.atualizarBadgeNotificacoes();
  },

  _statusExame(e) {
    const st = String(e.status || '').toLowerCase();
    const concluido = st.includes('concl') || st.includes('laudo emit');
    const atrasado = window.ExamesAPI?.isAtrasado(e);
    const texto = atrasado ? 'Atrasado' : (concluido ? 'Concluído' : (e.status || 'Solicitado'));
    const badge = atrasado ? 'b-red' : (concluido ? 'b-green' : (texto === 'Em andamento' ? 'b-blue' : 'b-yellow'));
    return { texto, badge, concluido };
  },

  showSolicitarExameModal() {
    const hoje = Util.dataLocalISO();
    const previsao = Util.dataLocalISO(new Date(Date.now() + 3 * 24 * 3600 * 1000));

    const html = `
      <form id="form-solicitar-exame" novalidate>
        <div class="form-grid">
          <div class="form-group">
            <label for="ex-cpf">CPF do cidadão</label>
            <input type="text" id="ex-cpf" placeholder="000.000.000-00" maxlength="14" inputmode="numeric" required>
          </div>
          <div class="form-group">
            <label for="ex-paciente">Cidadão</label>
            <input type="text" id="ex-paciente" placeholder="Digite o CPF para localizar" readonly>
          </div>
          <div class="form-group">
            <label for="ex-pid">Cartão SUS</label>
            <input type="text" id="ex-pid" placeholder="—" readonly>
          </div>
          <div class="form-group">
            <label for="ex-tipo">Tipo de exame</label>
            <select id="ex-tipo" required>${Catalogos.opcoes(Catalogos.tiposExame)}</select>
          </div>
          <div class="form-group">
            <label for="ex-data">Data do exame</label>
            <input type="date" id="ex-data" value="${hoje}" required>
          </div>
          <div class="form-group">
            <label for="ex-horario">Horário</label>
            <input type="time" id="ex-horario" value="08:00" step="300" required>
          </div>
          <div class="form-group">
            <label for="ex-unidade">Unidade</label>
            <select id="ex-unidade" required>${Catalogos.opcoes(Catalogos.unidades)}</select>
          </div>
          <div class="form-group">
            <label for="ex-medico">Solicitante</label>
            <select id="ex-medico">${Catalogos.opcoes(Catalogos.medicos.map(m => m.nome), 'Dr. Arnaldo Luiz')}</select>
          </div>
          <div class="form-group">
            <label for="ex-prioridade">Prioridade</label>
            <select id="ex-prioridade">${Catalogos.opcoes(['Normal', 'Média', 'Urgente'])}</select>
          </div>
          <div class="form-group">
            <label for="ex-data-prevista">Previsão do resultado</label>
            <input type="date" id="ex-data-prevista" value="${previsao}">
          </div>
        </div>
      </form>`;

    this.showModal({
      title: 'Solicitar exame',
      bodyHtml: html,
      confirmText: 'Enviar solicitação',
      size: 'lg',
      onConfirm: async () => {
        const v = id => document.getElementById(id)?.value?.trim() || '';
        const paciente = v('ex-paciente');
        const cpf = v('ex-cpf');
        if (!paciente || !cpf) {
          this.toast('Cidadão não identificado. Informe um CPF cadastrado.', 'warning');
          return false;
        }
        const res = await window.ExamesAPI.solicitar({
          paciente,
          cpf,
          pid: v('ex-pid') || undefined,
          tipo: v('ex-tipo'),
          solicitante: v('ex-medico'),
          unidade: v('ex-unidade'),
          data: Util.isoParaBR(v('ex-data')),
          horario: v('ex-horario') || '08:00',
          prioridade: v('ex-prioridade') || 'Normal',
          dataPrevista: Util.isoParaBR(v('ex-data-prevista'))
        }, this.usuario?.nome || 'Operador');

        if (res.status !== 201) {
          this.toast(res.body?.error || res.body?.message || 'Erro ao solicitar exame.', 'warning');
          return false;
        }
        this.toast(res.body?.message || 'Exame solicitado com sucesso!', 'success');
        this._atualizarTelaExames();
        return true;
      }
    });

    const exPaciente = document.getElementById('ex-paciente');
    const exPid = document.getElementById('ex-pid');
    this.ligarBuscaCidadao(document.getElementById('ex-cpf'), {
      aoEncontrar: c => { exPaciente.value = c.nome; exPid.value = c.sus || ''; },
      aoLimpar: naoEncontrado => {
        exPaciente.value = '';
        exPid.value = '';
        exPaciente.placeholder = naoEncontrado ? 'Cidadão não cadastrado' : 'Digite o CPF para localizar';
      }
    });
  },

  showEditarExameModal(exame) {
    if (!exame) return;
    const esc = Util.esc;
    if (this._statusExame(exame).concluido) {
      this.toast('Exames concluídos não podem ser alterados.', 'warning');
      return;
    }
    const statusAtual = ['Solicitado', 'Em andamento'].includes(exame.status) ? exame.status : 'Solicitado';

    const html = `
      <form id="form-editar-exame" novalidate>
        <div class="form-grid">
          <div class="form-group full">
            <label>Cidadão</label>
            <input type="text" value="${esc(exame.paciente)} · ${esc(exame.cpf || exame.id)}" readonly>
          </div>
          <div class="form-group">
            <label for="edit-ex-tipo">Tipo de exame</label>
            <select id="edit-ex-tipo">${Catalogos.opcoes(Catalogos.tiposExame, exame.tipo)}</select>
          </div>
          <div class="form-group">
            <label for="edit-ex-unidade">Unidade</label>
            <select id="edit-ex-unidade">${Catalogos.opcoes([...new Set([...Catalogos.unidades, exame.unidade].filter(Boolean))], exame.unidade)}</select>
          </div>
          <div class="form-group">
            <label for="edit-ex-data">Data do exame</label>
            <input type="date" id="edit-ex-data" value="${esc(Util.brParaISO(exame.data) || Util.dataLocalISO())}" required>
          </div>
          <div class="form-group">
            <label for="edit-ex-horario">Horário</label>
            <input type="time" id="edit-ex-horario" value="${esc(exame.horario || '08:00')}" step="300" required>
          </div>
          <div class="form-group">
            <label for="edit-ex-medico">Solicitante</label>
            <input type="text" id="edit-ex-medico" value="${esc(exame.solicitante || '')}" required>
          </div>
          <div class="form-group">
            <label for="edit-ex-prioridade">Prioridade</label>
            <select id="edit-ex-prioridade">${Catalogos.opcoes(['Normal', 'Média', 'Urgente'], exame.prioridade)}</select>
          </div>
          <div class="form-group">
            <label for="edit-ex-status">Status</label>
            <select id="edit-ex-status">${Catalogos.opcoes(['Solicitado', 'Em andamento'], statusAtual)}</select>
          </div>
          <div class="form-group">
            <label for="edit-ex-data-prevista">Previsão do resultado</label>
            <input type="date" id="edit-ex-data-prevista" value="${esc(Util.brParaISO(exame.dataPrevista))}">
          </div>
        </div>
        <p class="texto-suave">Para concluir o exame, use <strong>Emitir laudo</strong> na lista.</p>
      </form>`;

    this.showModal({
      title: `Alterar exame ${exame.id}`,
      bodyHtml: html,
      confirmText: 'Salvar alterações',
      size: 'lg',
      onConfirm: async () => {
        const v = id => document.getElementById(id)?.value?.trim() || '';
        const res = await window.ExamesAPI.alterar(exame.id, {
          tipo: v('edit-ex-tipo'),
          unidade: v('edit-ex-unidade'),
          data: Util.isoParaBR(v('edit-ex-data')),
          horario: v('edit-ex-horario'),
          solicitante: v('edit-ex-medico'),
          prioridade: v('edit-ex-prioridade'),
          status: v('edit-ex-status'),
          dataPrevista: Util.isoParaBR(v('edit-ex-data-prevista'))
        }, this.usuario?.nome || 'Operador');

        if (res.status !== 200) {
          this.toast(res.body?.error || res.body?.message || 'Erro ao alterar exame.', 'warning');
          return false;
        }
        this.toast(res.body?.message || 'Exame alterado com sucesso!', 'success');
        this._atualizarTelaExames();
        return true;
      }
    });
  },

  showHistoricoExamesModal(pacienteOuCpf) {
    const esc = Util.esc;
    const historico = (window.ExamesAPI?.getHistoricoPaciente(pacienteOuCpf) || []).filter(e => this.pertenceAoCidadao(e));
    const nome = historico[0]?.paciente || pacienteOuCpf || 'Cidadão';

    const corpo = historico.length === 0
      ? '<div class="estado-vazio"><div class="estado-icone">🔬</div><span>Nenhum exame registrado para este cidadão.</span></div>'
      : `<div class="tbl-wrap tbl-compacta"><table>
          <thead><tr><th>Exame</th><th>Tipo</th><th>Data</th><th>Unidade</th><th>Status</th></tr></thead>
          <tbody>${historico.map(e => {
            const st = this._statusExame(e);
            return `<tr>
              <td class="mono fw-600">${esc(e.id)}</td>
              <td><strong>${esc(e.tipo)}</strong><div class="text-muted-sm">${esc(e.solicitante || '')}</div></td>
              <td class="mono">${esc(e.data)}${e.horario ? ` ${esc(e.horario)}` : ''}</td>
              <td>${esc(e.unidade || '—')}</td>
              <td>${Render.badge(st.texto, st.badge)}</td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>`;

    this.showModal({
      title: `Histórico de exames — ${nome}`,
      size: 'lg',
      confirmText: null,
      cancelText: 'Fechar',
      bodyHtml: `
        <div class="perfil-resumo">
          <span class="avatar-mini avatar-md">${esc(Util.iniciais(nome))}</span>
          <div><strong>${esc(nome)}</strong><span>Exames laboratoriais e de imagem</span></div>
          <span class="badge b-blue">${historico.length} exame(s)</span>
        </div>
        ${corpo}`
    });
  },

  showExameModal(id) {
    const esc = Util.esc;
    const exame = window.ExamesAPI?.getAll().find(e => e.id === id);
    if (!exame || !this.pertenceAoCidadao(exame)) {
      this.toast('Exame não encontrado.', 'warning');
      return;
    }
    const st = this._statusExame(exame);
    const podeEmitir = !st.concluido && window.Permissoes?.podeEmitirLaudo(this.usuario?.perfil);
    const linha = (rotulo, valor) => `<div class="detalhe-linha"><dt>${esc(rotulo)}</dt><dd>${valor}</dd></div>`;

    this.showModal({
      title: `Exame ${exame.id}`,
      confirmText: st.concluido ? 'Baixar laudo' : (podeEmitir ? 'Emitir laudo' : null),
      cancelText: 'Fechar',
      bodyHtml: `
        <dl class="detalhe-lista">
          ${linha('Cidadão', `<strong>${esc(exame.paciente)}</strong>${exame.cpf ? ` <span class="text-muted-sm mono">${esc(exame.cpf)}</span>` : ''}`)}
          ${linha('Tipo de exame', esc(exame.tipo))}
          ${linha('Data', `<span class="mono">${esc(exame.data)}${exame.horario ? ` ${esc(exame.horario)}` : ''}</span>`)}
          ${linha('Unidade', esc(exame.unidade || '—'))}
          ${linha('Solicitante', esc(exame.solicitante || '—'))}
          ${linha('Prioridade', Render.badge(exame.prioridade || 'Normal', exame.priorBadge || 'b-gray'))}
          ${linha('Previsão do resultado', `<span class="mono">${esc(exame.dataPrevista || '—')}</span>`)}
          ${linha('Status', Render.badge(st.texto, st.badge))}
        </dl>
        ${exame.laudo ? `<h4 class="secao-titulo">Parecer</h4><p class="texto-suave">${Util.textoParaHtml(exame.laudo)}</p>` : ''}`,
      onConfirm: () => {
        if (st.concluido) {
          this.baixarLaudo(exame.id);
          return true;
        }
        this.showLaudoExameModal(exame.id);
        return false;
      }
    });
  },

  showLaudoExameModal(id) {
    const esc = Util.esc;
    const exame = window.ExamesAPI?.getAll().find(e => e.id === id);
    if (!exame) return this.toast('Exame não encontrado.', 'warning');
    if (!window.Permissoes?.podeEmitirLaudo(this.usuario?.perfil)) {
      return this.toast('Somente o Profissional da Saúde pode emitir laudos.', 'warning');
    }

    this.showModal({
      title: `Emitir laudo — ${exame.id}`,
      size: 'lg',
      confirmText: 'Emitir e assinar laudo',
      bodyHtml: `
        <p class="modal-texto">Laudo de <strong>${esc(exame.tipo)}</strong> de <strong>${esc(exame.paciente)}</strong>. Ao emitir, o exame passa para <strong>Concluído</strong> e o laudo fica disponível para download.</p>
        <div class="form-group">
          <label for="txt-laudo">Parecer</label>
          <textarea id="txt-laudo" rows="6" placeholder="Descreva os achados e a conclusão do exame…"></textarea>
        </div>`,
      onConfirm: () => {
        const texto = document.getElementById('txt-laudo')?.value.trim();
        if (!texto) {
          this.toast('Escreva o parecer do laudo antes de emitir.', 'warning');
          document.getElementById('txt-laudo')?.focus();
          return false;
        }
        const lista = window.ExamesAPI.getAll();
        const alvo = lista.find(e => e.id === exame.id);
        if (!alvo) return false;
        Object.assign(alvo, {
          status: 'Concluído',
          statusBadge: 'b-green',
          download: true,
          laudo: texto,
          laudoEmitidoPor: this.usuario?.nome,
          laudoEmitidoEm: new Date().toISOString()
        });
        window.ExamesAPI.persist(lista);
        this.addLog('SUCESSO', `Laudo do exame ${exame.id} emitido`,
          `Módulo: EXAMES · Emitido por: ${this.usuario?.nome} · ${exame.tipo} de ${exame.paciente}`, 'EXAMES');
        this.toast(`Laudo do exame ${exame.id} emitido.`, 'success');
        this._atualizarTelaExames();
        return true;
      }
    });
  }
});
