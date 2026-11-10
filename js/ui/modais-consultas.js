/**
 * Modais de Consultas Médicas.
 *
 * Métodos do objeto App separados de js/app.js por domínio. São anexados
 * ao App com Object.assign, então continuam sendo chamados como
 * this.metodo() / App.metodo() exatamente como antes.
 */
Object.assign(App, {
  showNovaConsultaModal() {
    const espInicial = Catalogos.especialidades[0];
    const agora = new Date();
    const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    const html = `
      <form id="form-nova-consulta" novalidate>
        <div class="form-grid">
          <div class="form-group">
            <label for="cs-cpf">CPF do cidadão</label>
            <input type="text" id="cs-cpf" placeholder="000.000.000-00" maxlength="14" inputmode="numeric" required>
          </div>
          <div class="form-group">
            <label for="cs-paciente">Cidadão</label>
            <input type="text" id="cs-paciente" placeholder="Digite o CPF para localizar" readonly>
          </div>
          <div class="form-group">
            <label for="cs-idade">Idade</label>
            <input type="text" id="cs-idade" placeholder="—" readonly>
          </div>
          <div class="form-group">
            <label for="cs-inicio">Horário de início</label>
            <input type="time" id="cs-inicio" value="${horaAtual}" required>
          </div>
          <div class="form-group">
            <label for="cs-especialidade">Especialidade</label>
            <select id="cs-especialidade">${Catalogos.opcoes(Catalogos.especialidades, espInicial)}</select>
          </div>
          <div class="form-group">
            <label for="cs-medico">Profissional</label>
            <select id="cs-medico">${Catalogos.opcoes(Catalogos.medicosDa(espInicial).map(m => m.nome))}</select>
          </div>
          <div class="form-group full">
            <label for="cs-cid">CID-10 (opcional)</label>
            <input type="text" id="cs-cid" placeholder="Ex.: J00, I10, E11" maxlength="8" style="text-transform:uppercase">
          </div>
        </div>
      </form>`;

    this.showModal({
      title: 'Iniciar consulta',
      bodyHtml: html,
      confirmText: 'Registrar consulta',
      size: 'lg',
      onConfirm: () => {
        const v = id => document.getElementById(id)?.value?.trim() || '';
        const paciente = v('cs-paciente');
        const cpf = v('cs-cpf');
        if (!paciente || !cpf) {
          this.toast('Cidadão não identificado. Informe um CPF cadastrado.', 'warning');
          return false;
        }
        const especialidade = v('cs-especialidade');
        const medico = v('cs-medico');
        const lista = window.ConsultasAPI.getAll();
        const nova = {
          id: window.ConsultasAPI.gerarNovoId(lista),
          paciente,
          cpf,
          idade: v('cs-idade') || '—',
          especialidade,
          medico,
          inicio: v('cs-inicio') || '—',
          duracao: '—',
          status: 'Em Andamento',
          badge: 'b-blue',
          cid: v('cs-cid').toUpperCase() || '—',
          data: new Date().toLocaleDateString('pt-BR')
        };
        lista.unshift(nova);
        window.ConsultasAPI.persist(lista);

        this.addLog('SUCESSO', `Consulta iniciada para o cidadão: ${paciente}`,
          `Módulo: CONSULTAS · Operador: ${this.usuario?.nome || 'sistema'} · Médico: ${medico} · Especialidade: ${especialidade}`, 'CONSULTAS');
        this.toast(`Consulta de ${paciente} iniciada.`, 'success');
        if (this.currentPage === 'consultas') this.goTo('consultas');
        return true;
      }
    });

    const csPaciente = document.getElementById('cs-paciente');
    const csIdade = document.getElementById('cs-idade');
    this.ligarBuscaCidadao(document.getElementById('cs-cpf'), {
      aoEncontrar: c => {
        csPaciente.value = c.nome;
        const idade = Util.calcularIdade(c.nascimento);
        csIdade.value = idade != null ? `${idade} anos` : '—';
      },
      aoLimpar: naoEncontrado => {
        csPaciente.value = '';
        csIdade.value = '';
        csPaciente.placeholder = naoEncontrado ? 'Cidadão não cadastrado' : 'Digite o CPF para localizar';
      }
    });
    this._ligarEspecialidadeMedico(document.getElementById('cs-especialidade'), document.getElementById('cs-medico'));
  },

  /** Abre o prontuário da consulta. Aceita o ID (preferido) ou o nome do paciente. */
  showConsultaModal(idOuPaciente) {
    const esc = Util.esc;
    const lista = window.ConsultasAPI?.getAll() || [];
    const consulta = lista.find(c => c.id === idOuPaciente) || lista.find(c => c.paciente === idOuPaciente);
    if (!consulta || !this.pertenceAoCidadao(consulta)) {
      this.toast('Consulta não encontrada.', 'warning');
      return;
    }

    const cids = {
      J00: 'Nasofaringite aguda (resfriado comum)',
      I10: 'Hipertensão essencial (primária)',
      E11: 'Diabetes mellitus tipo 2',
      M54: 'Dorsalgia'
    };
    const cid = String(consulta.cid || '').trim();
    const temCid = cid && cid !== '—';
    const linha = (rotulo, valor) => `<div class="detalhe-linha"><dt>${esc(rotulo)}</dt><dd>${valor}</dd></div>`;

    this.showModal({
      title: 'Prontuário da consulta',
      confirmText: 'Imprimir',
      cancelText: 'Fechar',
      bodyHtml: `
        <div class="perfil-resumo">
          <span class="avatar-mini avatar-md">${esc(Util.iniciais(consulta.paciente))}</span>
          <div>
            <strong>${esc(consulta.paciente)}</strong>
            <span>${esc(consulta.idade || '')} · ${esc(consulta.especialidade)}</span>
          </div>
          ${Render.badge(consulta.status, consulta.badge)}
        </div>
        <dl class="detalhe-lista">
          ${linha('Consulta', `<span class="mono">${esc(consulta.id)}</span>`)}
          ${linha('Profissional', esc(consulta.medico))}
          ${linha('Data / início', `${esc(consulta.data || '—')} · <span class="mono">${esc(consulta.inicio)}</span>`)}
          ${linha('Duração', esc(consulta.duracao))}
          ${linha('CID-10', `<span class="mono fw-600">${esc(cid || '—')}</span>`)}
        </dl>
        <h4 class="secao-titulo">Hipótese diagnóstica</h4>
        <p class="texto-suave">${temCid ? esc(cids[cid] || 'Diagnóstico registrado pelo profissional.') : 'Ainda não informada — consulta sem CID registrado.'}</p>
        ${consulta.motivoCancelamento ? `<div class="callout callout-danger"><strong>Cancelamento:</strong> ${esc(consulta.motivoCancelamento)}</div>` : ''}`,
      onConfirm: () => {
        window.print();
        return true;
      }
    });
  }
});
