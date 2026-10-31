/**
 * ============================================================================
 * VacinacaoAPI — Campanha de Vacinação: aplicações, estoque e indicadores.
 * ============================================================================
 *
 * CONTRATO DAS ROTAS (mock local, espelhável na VPS)
 *
 *   POST /vacinacao/registrar-aplicacao    (Administrador, Profissional da Saúde)
 *     body: { paciente, cpf, vacinaId (ou vacina = nome), dose, unidade, profissional?, lote? }
 *     201:  { success: true, message, aplicacao, alertaEstoque? }
 *     400:  campo obrigatório/inválido · 404: vacina inexistente
 *     409:  estoque esgotado ou dose já aplicada para o CPF
 *
 *   POST /vacinacao/estoque/entrada        (Administrador)
 *     body: { vacinaId, quantidade, lote? }   → 200 | 400 | 404
 *
 *   GET /vacinacao/estoque | /vacinacao/alertas | /vacinacao/aplicacoes | /vacinacao/indicadores
 *     (perfis com acesso à tela de Vacinação)
 *
 * REGRAS
 *   - Cada aplicação baixa 1 dose do estoque; estoque zerado bloqueia a aplicação.
 *   - Situação do estoque: Esgotado (0), Crítico (≤ mínimo), Atenção (≤ 2× mínimo), Normal.
 *   - Ao atingir o mínimo, a resposta traz `alertaEstoque` e um Aviso vai para a auditoria.
 *   - A mesma dose da mesma vacina não é aplicada duas vezes no mesmo CPF;
 *     "Dose única" não admite nenhuma aplicação anterior daquela vacina.
 *   - Cobertura vacinal = doses aplicadas ÷ população-alvo (todas as vacinas).
 * ============================================================================
 */
const VacinacaoAPI = (() => {
  const STORAGE_VACINAS = 'upa_vacinas';
  const STORAGE_APLICACOES = 'upa_vacinas_aplicacoes';
  const DOSES = ['1ª dose', '2ª dose', '3ª dose', 'Dose única', 'Reforço'];

  function seedVacinas() {
    return [
      { id: 'VAC-001', nome: 'COVID-19 (Bivalente)', detalhe: 'mRNA · 2 doses + reforço', icone: '💉', estoque: 1240, estoqueMinimo: 200, populacaoAlvo: 5000, aplicadas: 4100 },
      { id: 'VAC-002', nome: 'Influenza', detalhe: 'Dose única anual', icone: '🩸', estoque: 890, estoqueMinimo: 150, populacaoAlvo: 4000, aplicadas: 2840 },
      { id: 'VAC-003', nome: 'Hepatite B', detalhe: '3 doses', icone: '🔵', estoque: 540, estoqueMinimo: 100, populacaoAlvo: 3000, aplicadas: 2640 },
      { id: 'VAC-004', nome: 'Febre Amarela', detalhe: 'Dose única', icone: '🟣', estoque: 45, estoqueMinimo: 60, populacaoAlvo: 2000, aplicadas: 1100 },
      { id: 'VAC-005', nome: 'Meningite ACWY', detalhe: 'Dose única', icone: '🔴', estoque: 28, estoqueMinimo: 50, populacaoAlvo: 1500, aplicadas: 630 }
    ];
  }

  function seedAplicacoes() {
    return [
      { id: 'APL-1004', paciente: 'Paulo Henrique', cpf: '', vacinaId: 'VAC-001', vacina: 'COVID-19 (Bivalente)', dose: '2ª dose', dataHora: '2026-05-07T12:14:00', profissional: 'Enf. Cláudia', unidade: 'Unidade Norte' },
      { id: 'APL-1003', paciente: 'Marina Gomes', cpf: '', vacinaId: 'VAC-002', vacina: 'Influenza', dose: 'Dose única', dataHora: '2026-05-07T12:08:00', profissional: 'Enf. Rodrigo', unidade: 'Unidade Sul' },
      { id: 'APL-1002', paciente: 'Antônio Silva', cpf: '', vacinaId: 'VAC-003', vacina: 'Hepatite B', dose: '1ª dose', dataHora: '2026-05-07T11:52:00', profissional: 'Enf. Cláudia', unidade: 'Unidade Central' },
      { id: 'APL-1001', paciente: 'Beatriz Nunes', cpf: '', vacinaId: 'VAC-004', vacina: 'Febre Amarela', dose: 'Dose única', dataHora: '2026-05-07T11:40:00', profissional: 'Enf. Marcos', unidade: 'Unidade Oeste' }
    ];
  }

  function ler(chave, seed) {
    try {
      const raw = localStorage.getItem(chave);
      if (raw) {
        const v = JSON.parse(raw);
        if (Array.isArray(v)) return v;
      }
    } catch {
      // dado corrompido: recomeça do seed
    }
    const s = seed();
    localStorage.setItem(chave, JSON.stringify(s));
    return s;
  }

  const getEstoque = () => ler(STORAGE_VACINAS, seedVacinas).map(v => ({ ...v, situacao: situacaoEstoque(v) }));
  const getAplicacoes = () => ler(STORAGE_APLICACOES, seedAplicacoes);

  function persistirVacinas(lista) {
    localStorage.setItem(STORAGE_VACINAS, JSON.stringify(lista.map(({ situacao, ...v }) => v)));
  }
  function persistirAplicacoes(lista) {
    localStorage.setItem(STORAGE_APLICACOES, JSON.stringify(lista));
  }

  function situacaoEstoque(v) {
    const estoque = Number(v.estoque) || 0;
    const minimo = Number(v.estoqueMinimo) || 0;
    if (estoque <= 0) return 'Esgotado';
    if (estoque <= minimo) return 'Crítico';
    if (estoque <= minimo * 2) return 'Atenção';
    return 'Normal';
  }

  const texto = (v) => String(v == null ? '' : v).trim();
  const erro = (status, campo, error) => ({ status, body: { success: false, campo, error } });

  function cpfValido(cpf) {
    if (window.UsuariosAPI?.validarCPF) return window.UsuariosAPI.validarCPF(cpf).valido;
    const d = String(cpf).replace(/\D/g, '');
    return d.length === 11 && !/^(\d)\1{10}$/.test(d);
  }

  function formatarCPF(cpf) {
    return String(cpf).replace(/\D/g, '').replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  function encontrarVacina(lista, dados) {
    const id = texto(dados.vacinaId);
    const nome = texto(dados.vacina).toLowerCase();
    return lista.find(v => (id && v.id === id) || (!id && nome && (v.nome.toLowerCase() === nome || v.nome.toLowerCase().startsWith(nome))));
  }

  /** POST /vacinacao/registrar-aplicacao */
  async function registrarAplicacao(dados = {}, operador = 'sistema', agora = new Date()) {
    const paciente = texto(dados.paciente);
    if (!paciente) return erro(400, 'paciente', 'O nome do cidadão é obrigatório.');
    if (!texto(dados.cpf)) return erro(400, 'cpf', 'O CPF do cidadão é obrigatório.');
    if (!cpfValido(dados.cpf)) return erro(400, 'cpf', 'CPF inválido.');
    if (!texto(dados.vacinaId) && !texto(dados.vacina)) return erro(400, 'vacinaId', 'Selecione a vacina aplicada.');
    const dose = texto(dados.dose);
    if (!dose) return erro(400, 'dose', 'A dose aplicada é obrigatória.');
    if (!DOSES.includes(dose)) return erro(400, 'dose', `Dose inválida. Use: ${DOSES.join(', ')}.`);
    const unidade = texto(dados.unidade);
    if (!unidade) return erro(400, 'unidade', 'A unidade de vacinação é obrigatória.');

    const vacinas = getEstoque();
    const vacina = encontrarVacina(vacinas, dados);
    if (!vacina) return erro(404, 'vacinaId', 'Vacina não encontrada no catálogo.');

    if (vacina.estoque <= 0) {
      return erro(409, 'estoque', `Estoque de ${vacina.nome} esgotado. Registre uma entrada de estoque antes de aplicar.`);
    }

    const cpf = formatarCPF(dados.cpf);
    const anteriores = getAplicacoes().filter(a => a.vacinaId === vacina.id && formatarCPF(a.cpf || '') === cpf);
    if (anteriores.some(a => a.dose === dose)) {
      return erro(409, 'dose', `A ${dose} de ${vacina.nome} já foi aplicada neste CPF.`);
    }
    if (dose === 'Dose única' && anteriores.length > 0) {
      return erro(409, 'dose', `${vacina.nome} já foi aplicada neste CPF (dose única).`);
    }

    const antes = vacina.estoque;
    vacina.estoque = antes - 1;
    vacina.aplicadas = (Number(vacina.aplicadas) || 0) + 1;
    persistirVacinas(vacinas);

    const aplicacoes = getAplicacoes();
    const aplicacao = {
      id: `APL-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`,
      paciente,
      cpf,
      vacinaId: vacina.id,
      vacina: vacina.nome,
      dose,
      lote: texto(dados.lote) || undefined,
      dataHora: agora.toISOString(),
      profissional: texto(dados.profissional) || operador,
      unidade,
      registradoPor: operador
    };
    aplicacoes.unshift(aplicacao);
    persistirAplicacoes(aplicacoes);

    window.AuditoriaService?.registrar({
      usuario: operador,
      acao: 'Aplicação de vacina',
      tipo: 'Informação',
      modulo: 'VACINAÇÃO',
      descricao: `${vacina.nome} (${dose}) aplicada em "${paciente}" na ${unidade}.`
    });

    const body = { success: true, message: `Vacina ${vacina.nome} registrada para ${paciente}!`, aplicacao };
    if (vacina.estoque <= vacina.estoqueMinimo) {
      body.alertaEstoque = { vacinaId: vacina.id, vacina: vacina.nome, estoque: vacina.estoque, minimo: vacina.estoqueMinimo, situacao: situacaoEstoque(vacina) };
      // Registra só quando cruza o limite, para não gerar um aviso a cada dose.
      if (antes > vacina.estoqueMinimo || vacina.estoque === 0) {
        window.AuditoriaService?.registrar({
          usuario: 'sistema',
          acao: 'Estoque de vacina baixo',
          tipo: 'Aviso',
          modulo: 'ESTOQUE',
          descricao: `Estoque de ${vacina.nome} em ${vacina.estoque} doses (mínimo ${vacina.estoqueMinimo}).`
        });
      }
    }
    return { status: 201, body };
  }

  /** POST /vacinacao/estoque/entrada */
  async function registrarEntradaEstoque(dados = {}, operador = 'sistema') {
    const quantidade = Number(dados.quantidade);
    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      return erro(400, 'quantidade', 'A quantidade deve ser um número inteiro de doses maior que zero.');
    }
    const vacinas = getEstoque();
    const vacina = encontrarVacina(vacinas, dados);
    if (!vacina) return erro(404, 'vacinaId', 'Vacina não encontrada no catálogo.');
    vacina.estoque += quantidade;
    persistirVacinas(vacinas);
    window.AuditoriaService?.registrar({
      usuario: operador,
      acao: 'Entrada de estoque de vacina',
      tipo: 'Informação',
      modulo: 'ESTOQUE',
      descricao: `+${quantidade} doses de ${vacina.nome}${dados.lote ? ` (lote ${texto(dados.lote)})` : ''}. Estoque atual: ${vacina.estoque}.`
    });
    return { status: 200, body: { success: true, message: `Estoque de ${vacina.nome} atualizado para ${vacina.estoque} doses.`, vacina: { ...vacina, situacao: situacaoEstoque(vacina) } } };
  }

  function getAlertas() {
    return getEstoque().filter(v => v.situacao === 'Crítico' || v.situacao === 'Esgotado');
  }

  const mesmoDia = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  function getIndicadores(agora = new Date()) {
    const aplicacoes = getAplicacoes();
    let dosesHoje = 0;
    let dosesMes = 0;
    for (const a of aplicacoes) {
      const d = new Date(a.dataHora);
      if (Number.isNaN(d.getTime())) continue;
      if (d.getFullYear() === agora.getFullYear() && d.getMonth() === agora.getMonth()) {
        dosesMes++;
        if (mesmoDia(d, agora)) dosesHoje++;
      }
    }
    const vacinas = getEstoque();
    const aplicadas = vacinas.reduce((s, v) => s + (Number(v.aplicadas) || 0), 0);
    const alvo = vacinas.reduce((s, v) => s + (Number(v.populacaoAlvo) || 0), 0);
    return {
      dosesHoje,
      dosesMes,
      coberturaVacinal: alvo > 0 ? Number(((aplicadas / alvo) * 100).toFixed(1)) : 0,
      estoqueCritico: vacinas.filter(v => v.situacao === 'Crítico' || v.situacao === 'Esgotado').length,
      estoqueTotal: vacinas.reduce((s, v) => s + (Number(v.estoque) || 0), 0)
    };
  }

  let interceptado = false;
  function registrarInterceptor() {
    if (typeof window === 'undefined' || !window.fetch || interceptado) return;
    interceptado = true;
    const originalFetch = window.fetch;

    window.fetch = async function (url, options = {}) {
      const Http = window.Http;
      const rota = Http ? Http.caminho(url) : '';
      if (!rota.startsWith('/vacinacao/')) return originalFetch(url, options);
      const method = Http.metodo(options);

      if (method === 'GET') {
        const acesso = Http.autorizar(options, { pagina: 'vacinacao' });
        if (!acesso.permitido) return Http.negado(acesso);
        if (rota === '/vacinacao/estoque') return Http.json(200, { success: true, data: getEstoque() });
        if (rota === '/vacinacao/alertas') return Http.json(200, { success: true, data: getAlertas() });
        if (rota === '/vacinacao/aplicacoes') return Http.json(200, { success: true, data: getAplicacoes() });
        if (rota === '/vacinacao/indicadores') return Http.json(200, { success: true, indicadores: getIndicadores() });
        return Http.json(404, { success: false, error: 'Rota não encontrada.' });
      }

      if (method !== 'POST') return Http.json(405, { success: false, error: 'Método não permitido.' });
      const body = Http.corpo(options);

      if (rota === '/vacinacao/registrar-aplicacao') {
        const acesso = Http.autorizar(options, { acao: 'registrar_vacinacao' });
        if (!acesso.permitido) return Http.negado(acesso);
        const res = await registrarAplicacao(body, acesso.user?.nome || 'sistema');
        return Http.json(res.status, res.body);
      }
      if (rota === '/vacinacao/estoque/entrada') {
        const acesso = Http.autorizar(options, { acao: 'gerenciar_estoque_vacinas' });
        if (!acesso.permitido) return Http.negado(acesso);
        const res = await registrarEntradaEstoque(body, acesso.user?.nome || 'sistema');
        return Http.json(res.status, res.body);
      }
      return Http.json(404, { success: false, error: 'Rota não encontrada.' });
    };
  }

  if (typeof window !== 'undefined') {
    registrarInterceptor();
  }

  return {
    DOSES,
    getEstoque,
    getAplicacoes,
    persistirVacinas,
    situacaoEstoque,
    registrarAplicacao,
    registrarEntradaEstoque,
    getAlertas,
    getIndicadores,
    registrarInterceptor
  };
})();

if (typeof window !== 'undefined') {
  window.VacinacaoAPI = VacinacaoAPI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VacinacaoAPI;
}
