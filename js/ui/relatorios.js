/**
 * Tela "Relatórios": monta os filtros e abre o documento gerado pelo servidor
 * (backend/relatorio.php), que consulta o MySQL com junções de tabelas.
 *
 * Método do objeto App, anexado com Object.assign (como os demais módulos de UI).
 */
Object.assign(App, {
  STATUS_AGENDAMENTO: ['Pendente', 'Confirmado', 'Remarcado', 'Cancelado', 'Recusado'],

  configurarRelatorios(root) {
    const online = !!window.Persistencia?.online;
    const aviso = root.querySelector('[data-box="relatorios-offline"]');
    if (aviso) aviso.hidden = online;

    const nomesProfissionais = (window.Catalogos?.medicos || []).map(m => m.nome);
    const opcoes = {
      unidades: window.Catalogos?.unidades || [],
      profissionais: nomesProfissionais,
      vacinas: window.Catalogos?.vacinas || [],
      status: this.STATUS_AGENDAMENTO
    };
    root.querySelectorAll('select[data-opcoes]').forEach(sel => {
      const lista = opcoes[sel.dataset.opcoes] || [];
      sel.innerHTML = '<option value="">Todos</option>' + Catalogos.opcoes(lista, '');
    });

    root.querySelectorAll('form[data-relatorio]').forEach(form => {
      const botao = form.querySelector('button[type="submit"]');
      if (botao) botao.disabled = !online;
      form.addEventListener('submit', async ev => {
        ev.preventDefault();
        if (!window.Persistencia?.online) {
          this.toast('Relatórios exigem o banco de dados (XAMPP com Apache e MySQL).', 'warning');
          return;
        }
        const filtros = Object.fromEntries(new FormData(form).entries());
        // Garante que as últimas alterações já estão gravadas no banco.
        await window.Persistencia.enviarPendentes();
        const url = window.Persistencia.urlRelatorio(form.dataset.relatorio, filtros);
        const aba = window.open(url, '_blank');
        if (!aba) window.location.href = url;
      });
    });
  }
});
