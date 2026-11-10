/**
 * Modais da Campanha de Vacinação (aplicação de dose e entrada de lote).
 *
 * Métodos do objeto App separados de js/app.js por domínio. São anexados
 * ao App com Object.assign, então continuam sendo chamados como
 * this.metodo() / App.metodo() exatamente como antes.
 */
Object.assign(App, {
  _atualizarTelaVacinacao() {
    if (window.VacinacaoAPI) this.recomputeVacinacaoStats();
    this.saveState();
    const root = document.getElementById('screen-container');
    if (this.currentPage === 'vacinacao' && root) window.Render?.renderVacinacao(root, this.data.vacinacao);
    else if (this.currentPage === 'dashboard') this.goTo('dashboard');
    this.atualizarBadgeNotificacoes();
  },

  _mostrarErroForm(idFeedback, status, msg) {
    const el = document.getElementById(idFeedback);
    if (!el) return;
    el.hidden = false;
    el.textContent = `${msg} (HTTP ${status})`;
  },

  showRegistrarVacinaModal() {
    const esc = Util.esc;
    const estoque = window.VacinacaoAPI?.listarEstoque?.().data || [];
    const aplicacoes = window.VacinacaoAPI?.listarAplicacoes?.().data || [];
    const usuarios = this.initUsuariosDB();

    const nomes = [...new Set([
      ...usuarios.filter(u => Util.ehCidadao(u)).map(u => u.nome),
      ...aplicacoes.map(a => a.cidadao || a.paciente)
    ].filter(Boolean))];
    const vacinas = [...new Set([...Catalogos.vacinas, ...estoque.map(e => e.vacina)].filter(Boolean))];
    const unidades = [...new Set([...Catalogos.unidades, ...estoque.map(e => e.unidade)].filter(Boolean))];
    const disponivel = estoque.find(e => !e.vencido && Number(e.quantidade) > 0) || estoque[0] || {};
    const profPadrao = window.Permissoes?.normalizarPerfil(this.usuario?.perfil) === 'Profissional da Saúde' ? this.usuario.nome : '';

    const opcoesLote = estoque.map(item => {
      const tag = item.vencido ? ' · VENCIDO' : (Number(item.quantidade) <= 0 ? ' · ESGOTADO'
        : (Number(item.quantidade) <= Number(item.estoqueMinimo) ? ' · baixo estoque' : ''));
      return `<option value="${esc(item.lote)}" data-vacina="${esc(item.vacina)}" data-unidade="${esc(item.unidade)}" ${item.lote === disponivel.lote ? 'selected' : ''}>${esc(item.lote)} — ${esc(item.vacina)} · ${esc(item.unidade)} (${esc(item.quantidade)} dose(s), val. ${esc(item.validade)})${tag}</option>`;
    }).join('');

    const html = `
      <form id="form-vacina" novalidate>
        <div id="vax-form-feedback" class="callout callout-danger" role="alert" hidden></div>
        <div class="form-grid">
          <div class="form-group">
            <label for="vax-cpf">CPF do cidadão <span class="opcional">(opcional)</span></label>
            <input type="text" id="vax-cpf" placeholder="000.000.000-00" maxlength="14" inputmode="numeric">
          </div>
          <div class="form-group">
            <label for="vax-paciente">Cidadão</label>
            <input type="text" id="vax-paciente" list="vax-cidadaos-list" placeholder="Nome completo" required>
            <datalist id="vax-cidadaos-list">${nomes.map(n => `<option value="${esc(n)}"></option>`).join('')}</datalist>
          </div>
          <div class="form-group">
            <label for="vax-nome">Vacina</label>
            <select id="vax-nome" required>${Catalogos.opcoes(vacinas, disponivel.vacina)}</select>
          </div>
          <div class="form-group">
            <label for="vax-dose">Dose</label>
            <select id="vax-dose" required>${Catalogos.opcoes(['1ª Dose', '2ª Dose', 'Reforço', 'Dose Única'])}</select>
          </div>
          <div class="form-group full">
            <label for="vax-lote">Lote</label>
            <select id="vax-lote" required><option value="">Selecione um lote…</option>${opcoesLote}</select>
          </div>
          <div class="form-group">
            <label for="vax-unidade">Unidade</label>
            <select id="vax-unidade" required>${Catalogos.opcoes(unidades, disponivel.unidade)}</select>
          </div>
          <div class="form-group">
            <label for="vax-datahora">Data e hora</label>
            <input type="datetime-local" id="vax-datahora" value="${Util.dataHoraLocalISO()}" required>
          </div>
          <div class="form-group full">
            <label for="vax-prof">Profissional responsável</label>
            <input type="text" id="vax-prof" value="${esc(profPadrao)}" placeholder="Nome do profissional" required>
          </div>
        </div>
      </form>`;

    this.showModal({
      title: 'Registrar aplicação de vacina',
      bodyHtml: html,
      confirmText: 'Registrar dose',
      size: 'lg',
      onConfirm: async () => {
        const v = id => document.getElementById(id)?.value?.trim() || '';
        const dados = {
          cidadao: v('vax-paciente'), cpf: v('vax-cpf'), vacina: v('vax-nome'), lote: v('vax-lote'),
          dose: v('vax-dose'), unidade: v('vax-unidade'), profissional: v('vax-prof'), dataHora: v('vax-datahora')
        };
        try {
          const res = await fetch('/vacinacao/registrar-aplicacao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
          });
          const result = await res.json();
          if (res.status === 201 && result.success) {
            this.toast(result.message || `Vacina registrada para ${dados.cidadao}.`, 'success');
            if (result.alertaGerado) {
              this.toast(result.alertaGerado.mensagem, result.alertaGerado.nivel === 'critico' ? 'danger' : 'warning');
            }
            this._atualizarTelaVacinacao();
            return true;
          }
          const msg = result.error || 'Não foi possível registrar a aplicação.';
          this._mostrarErroForm('vax-form-feedback', res.status, msg);
          return false;
        } catch (err) {
          console.error('Erro ao registrar aplicação de vacina:', err);
          this._mostrarErroForm('vax-form-feedback', 500, 'Erro inesperado ao registrar a aplicação.');
          return false;
        }
      }
    });

    // Sincroniza lote ⇄ vacina ⇄ unidade
    const selVacina = document.getElementById('vax-nome');
    const selLote = document.getElementById('vax-lote');
    const selUnidade = document.getElementById('vax-unidade');
    selLote?.addEventListener('change', () => {
      const opt = selLote.selectedOptions[0];
      if (opt?.dataset.vacina) selVacina.value = opt.dataset.vacina;
      if (opt?.dataset.unidade) selUnidade.value = opt.dataset.unidade;
    });
    selVacina?.addEventListener('change', () => {
      const opt = Array.from(selLote.options).find(o => o.dataset.vacina === selVacina.value);
      if (opt) {
        selLote.value = opt.value;
        if (opt.dataset.unidade) selUnidade.value = opt.dataset.unidade;
      }
    });

    const inputPaciente = document.getElementById('vax-paciente');
    document.getElementById('vax-cpf')?.addEventListener('input', e => {
      e.target.value = Util.mascararCPF(e.target.value);
      const limpo = Util.somenteDigitos(e.target.value);
      if (limpo.length !== 11) return;
      const u = usuarios.find(x => Util.somenteDigitos(x.cpf) === limpo);
      const a = aplicacoes.find(x => Util.somenteDigitos(x.cpf) === limpo);
      if (u || a) inputPaciente.value = u ? u.nome : (a.cidadao || a.paciente);
    });
  },

  showEntradaEstoqueVacinaModal() {
    const validadePadrao = Util.dataLocalISO(new Date(new Date().getFullYear() + 1, 11, 31));
    const html = `
      <form id="form-entrada-estoque-vacina" novalidate>
        <div id="est-form-feedback" class="callout callout-danger" role="alert" hidden></div>
        <div class="form-grid">
          <div class="form-group">
            <label for="est-vacina">Vacina</label>
            <select id="est-vacina" required>${Catalogos.opcoes(Catalogos.vacinas)}</select>
          </div>
          <div class="form-group">
            <label for="est-lote">Código do lote</label>
            <input type="text" id="est-lote" placeholder="Ex.: LOT-COV-2027A" required style="text-transform:uppercase">
          </div>
          <div class="form-group">
            <label for="est-unidade">Unidade</label>
            <select id="est-unidade" required>${Catalogos.opcoes(Catalogos.unidades)}</select>
          </div>
          <div class="form-group">
            <label for="est-validade">Validade</label>
            <input type="date" id="est-validade" value="${validadePadrao}" min="${Util.dataLocalISO()}" required>
          </div>
          <div class="form-group">
            <label for="est-quantidade">Quantidade de doses</label>
            <input type="number" id="est-quantidade" min="1" step="1" value="20" required>
          </div>
          <div class="form-group">
            <label for="est-minimo">Estoque mínimo <span class="opcional">(opcional)</span></label>
            <input type="number" id="est-minimo" min="0" step="1" placeholder="Padrão da vacina">
          </div>
        </div>
      </form>`;

    this.showModal({
      title: 'Entrada de lote no estoque',
      bodyHtml: html,
      confirmText: 'Registrar entrada',
      size: 'lg',
      onConfirm: async () => {
        const v = id => document.getElementById(id)?.value?.trim() || '';
        const minimo = v('est-minimo');
        try {
          const res = await fetch('/vacinacao/estoque/entrada', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vacina: v('est-vacina'),
              lote: v('est-lote').toUpperCase(),
              unidade: v('est-unidade'),
              validade: v('est-validade'),
              quantidade: Number(v('est-quantidade')),
              estoqueMinimo: minimo !== '' ? Number(minimo) : undefined
            })
          });
          const result = await res.json();
          if (res.status === 201 && result.success) {
            this.toast(result.message || 'Entrada de lote registrada!', 'success');
            this._atualizarTelaVacinacao();
            return true;
          }
          this._mostrarErroForm('est-form-feedback', res.status, result.error || 'Erro ao registrar entrada de lote.');
          return false;
        } catch (err) {
          console.error('Erro na entrada de lote:', err);
          this._mostrarErroForm('est-form-feedback', 500, 'Erro inesperado ao registrar entrada de lote.');
          return false;
        }
      }
    });
  }
});
