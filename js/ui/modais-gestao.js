/**
 * Modais de Gestão (unidades, insumos, logs) e exportação CSV.
 *
 * Métodos do objeto App separados de js/app.js por domínio. São anexados
 * ao App com Object.assign, então continuam sendo chamados como
 * this.metodo() / App.metodo() exatamente como antes.
 */
Object.assign(App, {
  showNovoChamadoModal() {
    const unidades = (this.data.unidades?.boxes?.lista || []).map(u => u.nome);
    const html = `
      <form id="form-chamado" novalidate>
        <div class="form-grid">
          <div class="form-group full">
            <label for="ch-unidade">Unidade de saúde</label>
            <select id="ch-unidade">${Catalogos.opcoes(unidades.length ? unidades : Catalogos.unidades)}</select>
          </div>
          <div class="form-group">
            <label for="ch-tipo">Tipo de ocorrência</label>
            <select id="ch-tipo">${Catalogos.opcoes(['Manutenção de Equipamento', 'Falta de Insumos', 'Problema na Rede / TI', 'Reforma Estrutural'])}</select>
          </div>
          <div class="form-group">
            <label for="ch-prioridade">Prioridade</label>
            <select id="ch-prioridade">${Catalogos.opcoes(['Baixa', 'Média', 'Alta', 'Crítica'], 'Média')}</select>
          </div>
          <div class="form-group full">
            <label for="ch-desc">Descrição do problema</label>
            <textarea id="ch-desc" rows="4" placeholder="Descreva o problema, local e impacto no atendimento…" required></textarea>
          </div>
        </div>
      </form>`;

    this.showModal({
      title: 'Abrir chamado técnico',
      bodyHtml: html,
      confirmText: 'Abrir chamado',
      size: 'lg',
      onConfirm: () => {
        const v = id => document.getElementById(id)?.value?.trim() || '';
        if (!v('ch-desc')) {
          this.toast('Descreva o problema antes de abrir o chamado.', 'warning');
          document.getElementById('ch-desc')?.focus();
          return false;
        }
        const protocolo = `CH-${Date.now().toString(36).toUpperCase()}`;
        this.addLog(v('ch-prioridade') === 'Crítica' ? 'AVISO' : 'INFO',
          `Chamado ${protocolo} aberto: ${v('ch-tipo')}`,
          `Unidade: ${v('ch-unidade')} · Prioridade: ${v('ch-prioridade')} · ${v('ch-desc')}`, 'UNIDADES');
        this.toast(`Chamado ${protocolo} aberto para ${v('ch-unidade')}.`, 'success');
        return true;
      }
    });
  },

  showUnidadeModal(id) {
    const esc = Util.esc;
    const unidade = this.data.unidades?.boxes?.lista?.find(u => u.id === id);
    if (!unidade) return this.toast('Unidade não encontrada.', 'warning');
    const linha = (rotulo, valor) => `<div class="detalhe-linha"><dt>${esc(rotulo)}</dt><dd>${valor}</dd></div>`;

    this.showModal({
      title: unidade.nome,
      confirmText: 'Salvar alterações',
      cancelText: 'Fechar',
      bodyHtml: `
        <dl class="detalhe-lista">
          ${linha('Identificação', `<span class="mono">${esc(unidade.id)}</span>`)}
          ${linha('Tipo', `<span class="type-chip tipo-${esc(String(unidade.tipo).toLowerCase())}">${esc(unidade.tipo)}</span>`)}
          ${linha('Endereço', esc(unidade.endereco))}
          ${linha('Capacidade', esc(unidade.capacidade || '—'))}
          ${unidade.ocupacao != null ? linha('Ocupação', `${esc(unidade.ocupacao)}%`) : ''}
        </dl>
        <div class="form-group" style="margin-top:16px">
          <label for="modal-edit-unidade-status">Status operacional</label>
          <select id="modal-edit-unidade-status">${Catalogos.opcoes(['Operacional', 'Manutenção', 'Inativa'], unidade.status, v => v === 'Manutenção' ? 'Em manutenção' : v)}</select>
        </div>`,
      onConfirm: () => {
        const novo = document.getElementById('modal-edit-unidade-status')?.value;
        if (!novo || novo === unidade.status) return true;
        const anterior = unidade.status;
        unidade.status = novo;
        unidade.statusColor = novo === 'Operacional' ? 'success' : 'danger';
        this.saveState();
        this.addLog('INFO', `Status da unidade ${unidade.nome} alterado`, `De "${anterior}" para "${novo}"`, 'UNIDADES');
        this.toast(`${unidade.nome}: status alterado para ${novo}.`, 'success');
        if (this.currentPage === 'unidades') this.goTo('unidades');
        return true;
      }
    });
  },

  showRelatorioInsumosModal() {
    const esc = Util.esc;
    const insumos = this.data.unidades?.boxes?.insumos || [];
    const estoqueVacinas = window.VacinacaoAPI?.listarEstoque?.().data || [];
    const porVacina = {};
    estoqueVacinas.forEach(e => {
      if (e.vencido) return;
      porVacina[e.vacina] = (porVacina[e.vacina] || 0) + (Number(e.quantidade) || 0);
    });

    const linhasInsumos = insumos.map(i => `
      <div class="insumo-row">
        <span class="insumo-ico">${Render.icone('caixa', 16)}</span>
        <div class="insumo-info"><div class="insumo-name">${esc(i.nome)}</div>
          <div class="prog-bar"><div class="prog-fill bar-${i.color === 'danger' ? 'red' : i.color === 'warning' ? 'orange' : 'green'}" style="width:${Number(i.pct) || 0}%"></div></div></div>
        <span class="insumo-pct text-${esc(i.color || 'primary')}">${Number(i.pct) || 0}%</span>
      </div>`).join('');
    const linhasVacinas = Object.entries(porVacina).map(([v, n]) => `
      <div class="lista-linha"><span>${esc(v)}</span><strong>${n} dose(s)</strong></div>`).join('');

    this.showModal({
      title: 'Relatório de insumos e estoques',
      confirmText: 'Exportar CSV',
      cancelText: 'Fechar',
      bodyHtml: `
        <h4 class="secao-titulo" style="margin-top:0">Insumos da rede</h4>
        ${linhasInsumos || '<div class="estado-vazio compacto"><span>Sem dados de insumos.</span></div>'}
        <h4 class="secao-titulo">Vacinas válidas em estoque</h4>
        <div class="lista-caixa">${linhasVacinas || '<div class="estado-vazio compacto"><span>Sem estoque de vacinas.</span></div>'}</div>`,
      onConfirm: () => {
        const csv = Util.gerarCSV(['Categoria', 'Item', 'Nível / Quantidade'], [
          ...insumos.map(i => ['Insumo', i.nome, `${i.pct}%`]),
          ...Object.entries(porVacina).map(([v, n]) => ['Vacina', v, `${n} doses`])
        ]);
        Util.baixarArquivo(`UPA24H_insumos_${Util.dataLocalISO()}.csv`, csv, 'text/csv;charset=utf-8');
        this.toast('Relatório de insumos exportado.', 'success');
        return true;
      }
    });
  },

  showLogModal(id) {
    const esc = Util.esc;
    const log = (window.Render?._logsExibidos || []).find(l => l.id === id) ||
      window.AuditoriaService?.getAll().find(l => l.id === id);
    if (!log) return this.toast('Registro de log não encontrado.', 'warning');

    const linha = (rotulo, valor) => `<div class="detalhe-linha"><dt>${esc(rotulo)}</dt><dd>${valor}</dd></div>`;
    const texto = [
      `ID: ${log.id}`,
      `Data/hora: ${log.dataHora || log.hora}`,
      `Tipo: ${log.tipo}`,
      `Usuário: ${log.usuario}`,
      `Módulo: ${log.modulo}`,
      `Ação: ${log.acao || log.titulo}`,
      `Descrição: ${log.descricao || log.meta || ''}`
    ].join('\n');

    this.showModal({
      title: 'Registro de auditoria',
      confirmText: 'Copiar detalhes',
      cancelText: 'Fechar',
      bodyHtml: `
        <dl class="detalhe-lista">
          ${linha('Registro', `<span class="mono">${esc(log.id)}</span>`)}
          ${linha('Data / hora', `<span class="mono">${esc(log.dataHora || log.hora || '—')}</span>`)}
          ${linha('Tipo', Render.badge(log.tipo, log.badge))}
          ${linha('Usuário', `<strong>${esc(log.usuario || 'sistema')}</strong>`)}
          ${linha('Módulo', `<span class="mono">${esc(log.modulo || 'SISTEMA')}</span>`)}
          ${linha('Ação', esc(log.acao || log.titulo))}
          ${linha('Origem', `<span class="mono">${esc(log.ip || 'local')}</span>`)}
        </dl>
        <h4 class="secao-titulo">Descrição</h4>
        <pre class="bloco-codigo">${esc(log.descricao || log.meta || 'Sem descrição adicional.')}</pre>`,
      onConfirm: async () => {
        const ok = await Util.copiarTexto(texto);
        this.toast(ok ? 'Detalhes copiados para a área de transferência.' : 'Não foi possível copiar.', ok ? 'success' : 'warning');
        return ok;
      }
    });
  },

  /**
   * Exporta a lista da tela em CSV. Antes o arquivo era montado num data:URI
   * com encodeURI(), que não codifica "#": como todos os IDs começam com "#"
   * (ex.: "#10291"), o arquivo terminava logo no cabeçalho. O export de logs
   * também lia campos que não existem mais (hora/titulo/meta).
   */
  exportTableToCSV(type) {
    const data = Util.dataLocalISO();
    let cabecalhos;
    let linhas;
    if (type === 'agendamentos') {
      cabecalhos = ['ID', 'Cidadão', 'CPF', 'Data', 'Horário', 'Especialidade', 'Profissional', 'Unidade', 'Status'];
      linhas = (window.AgendamentosAPI?.getAll() || []).filter(r => this.pertenceAoCidadao(r))
        .map(r => [r.id, r.paciente, r.cpf, r.data, r.horario, r.especialidade, r.medico, r.unidade, r.status]);
    } else if (type === 'exames') {
      cabecalhos = ['ID', 'Cidadão', 'CPF', 'Tipo', 'Solicitante', 'Unidade', 'Data', 'Prioridade', 'Status'];
      linhas = (window.ExamesAPI?.getAll() || []).filter(r => this.pertenceAoCidadao(r))
        .map(r => [r.id, r.paciente, r.cpf, r.tipo, r.solicitante, r.unidade, r.data, r.prioridade, window.ExamesAPI.isAtrasado(r) ? 'Atrasado' : r.status]);
    } else if (type === 'logs') {
      cabecalhos = ['ID', 'Data/Hora', 'Tipo', 'Usuário', 'Módulo', 'Ação', 'Descrição'];
      linhas = (window.AuditoriaService?.getAll() || [])
        .map(r => [r.id, r.dataHora, r.tipo, r.usuario, r.modulo, r.acao, r.descricao]);
    } else {
      return;
    }
    Util.baixarArquivo(`UPA24H_${type}_${data}.csv`, Util.gerarCSV(cabecalhos, linhas), 'text/csv;charset=utf-8');
    this.toast(`${linhas.length} registro(s) de ${type} exportados.`, 'success');
  }
});
