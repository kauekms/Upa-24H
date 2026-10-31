/**
 * ============================================================================
 * UnidadesAPI — cadastro, listagem paginada e indicadores das Unidades de Saúde.
 * ============================================================================
 *
 * CONTRATO DAS ROTAS (mock local, espelhável na VPS)
 *
 *   POST /unidades/cadastrar               (Administrador)
 *     body: { nome, endereco, telefone, tipo, capacidade, ocupacao? }
 *     201:  { success: true, message, unidade }
 *     400:  { success: false, error, campo }      (validação)
 *     409:  { success: false, error, campo: 'nome' } (nome já cadastrado)
 *
 *   GET /unidades?pagina=1&porPagina=10&tipo=&status=&busca=   (perfis com acesso à tela)
 *     200:  { success: true, data: [...], paginacao: { pagina, porPagina, total, totalPaginas } }
 *
 *   GET /unidades/indicadores
 *     200:  { success: true, indicadores: { total, ativas, inativas, capacidadeTotal, porTipo } }
 *
 *   PUT /unidades/status                    (Administrador)
 *     body: { id, status }  → 200 | 400 | 404
 *
 * REGRAS DE VALIDAÇÃO
 *   - nome: obrigatório, 3 a 120 caracteres, único (sem diferenciar maiúsculas).
 *   - endereco: obrigatório, mínimo 5 caracteres.
 *   - telefone: obrigatório, DDD + 8 ou 9 dígitos.
 *   - tipo: Hospital, UPA, UBS ou AME.
 *   - capacidade: número inteiro de leitos/vagas entre 1 e 200.000.
 *   - "Ativa" = status Operacional; só unidades ativas somam capacidade.
 * ============================================================================
 */
const UnidadesAPI = (() => {
  const STORAGE_KEY = 'upa_unidades';
  const TIPOS = ['Hospital', 'UPA', 'UBS', 'AME'];
  const STATUS = ['Operacional', 'Manutenção', 'Inativa'];
  const CAPACIDADE_MAX = 200000;
  const POR_PAGINA_PADRAO = 10;
  const POR_PAGINA_MAX = 100;

  function seedInicial() {
    return [
      { id: '102938', nome: 'Hospital Central Municipal', tipo: 'Hospital', endereco: 'Av. Brasil, 1500 – Centro', telefone: '(11) 3201-1500', capacidade: 500, ocupacao: 85, status: 'Operacional' },
      { id: '102945', nome: 'UPA 24h Jardim Sul', tipo: 'UPA', endereco: 'Rua das Palmeiras, 45 – Jd. Sul', telefone: '(11) 3202-0045', capacidade: 80, ocupacao: 40, status: 'Operacional' },
      { id: '102952', nome: 'UBS Vila Nova', tipo: 'UBS', endereco: 'Praça da Matriz, s/n – Vila Nova', telefone: '(11) 3203-0010', capacidade: 40, ocupacao: 0, status: 'Manutenção', observacao: 'Em reforma desde 01/05' },
      { id: '102960', nome: 'Hospital Regional Norte', tipo: 'Hospital', endereco: 'Rod. BR-153, km 12 – Zona Norte', telefone: '(11) 3204-0153', capacidade: 320, ocupacao: 73, status: 'Operacional' },
      { id: '102971', nome: 'AME Especialidades Leste', tipo: 'AME', endereco: 'Av. Independência, 800 – Leste', telefone: '(11) 3205-0800', capacidade: 150, ocupacao: 60, status: 'Operacional' }
    ];
  }

  function getAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const lista = JSON.parse(raw);
        if (Array.isArray(lista)) return lista;
      }
    } catch {
      // dado corrompido: recomeça do seed
    }
    const seed = seedInicial();
    persist(seed);
    return seed;
  }

  function persist(lista) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
      if (typeof window !== 'undefined' && window.App?.data?.unidades?.boxes) {
        window.App.data.unidades.boxes.lista = lista;
      }
    } catch (e) {
      console.error('Erro ao persistir unidades:', e);
    }
  }

  const texto = (v) => String(v == null ? '' : v).trim();
  const normalizarNome = (n) => texto(n).toLowerCase().replace(/\s+/g, ' ');
  const erro = (status, campo, error) => ({ status, body: { success: false, campo, error } });

  function validar(dados) {
    const nome = texto(dados.nome);
    if (!nome) return erro(400, 'nome', 'O nome da unidade é obrigatório.');
    if (nome.length < 3 || nome.length > 120) return erro(400, 'nome', 'O nome da unidade deve ter entre 3 e 120 caracteres.');

    const endereco = texto(dados.endereco);
    if (!endereco) return erro(400, 'endereco', 'O endereço é obrigatório.');
    if (endereco.length < 5) return erro(400, 'endereco', 'Informe o endereço completo (rua, número e bairro).');

    const telefone = texto(dados.telefone);
    if (!telefone) return erro(400, 'telefone', 'O telefone é obrigatório.');
    const digitos = telefone.replace(/\D/g, '');
    if (digitos.length !== 10 && digitos.length !== 11) {
      return erro(400, 'telefone', 'Telefone inválido: informe DDD + número (8 ou 9 dígitos).');
    }

    const tipo = texto(dados.tipo);
    if (!tipo) return erro(400, 'tipo', 'O tipo da unidade é obrigatório.');
    if (!TIPOS.includes(tipo)) return erro(400, 'tipo', `Tipo inválido. Use: ${TIPOS.join(', ')}.`);

    if (dados.capacidade == null || texto(dados.capacidade) === '') {
      return erro(400, 'capacidade', 'A capacidade (leitos/vagas) é obrigatória.');
    }
    const capacidade = Number(dados.capacidade);
    if (!Number.isInteger(capacidade) || capacidade < 1 || capacidade > CAPACIDADE_MAX) {
      return erro(400, 'capacidade', `A capacidade deve ser um número inteiro entre 1 e ${CAPACIDADE_MAX.toLocaleString('pt-BR')}.`);
    }

    let ocupacao = 0;
    if (dados.ocupacao != null && texto(dados.ocupacao) !== '') {
      ocupacao = Number(dados.ocupacao);
      if (!Number.isFinite(ocupacao) || ocupacao < 0 || ocupacao > 100) {
        return erro(400, 'ocupacao', 'A ocupação deve ser um percentual entre 0 e 100.');
      }
    }

    return { valido: true, unidade: { nome, endereco, telefone: formatarTelefone(digitos), tipo, capacidade, ocupacao: Math.round(ocupacao) } };
  }

  function formatarTelefone(d) {
    return d.length === 11
      ? d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
      : d.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }

  function gerarId(lista) {
    const maior = lista.reduce((m, u) => Math.max(m, parseInt(u.id, 10) || 0), 102900);
    return String(maior + 1);
  }

  /** POST /unidades/cadastrar */
  async function cadastrar(dados = {}, operador = 'sistema') {
    const v = validar(dados || {});
    if (!v.valido) return v;

    const lista = getAll();
    if (lista.some(u => normalizarNome(u.nome) === normalizarNome(v.unidade.nome))) {
      return erro(409, 'nome', `Já existe uma unidade cadastrada com o nome "${v.unidade.nome}".`);
    }

    const unidade = { id: gerarId(lista), ...v.unidade, status: 'Operacional', criadoEm: new Date().toISOString() };
    lista.unshift(unidade);
    persist(lista);

    window.AuditoriaService?.registrar({
      usuario: operador,
      acao: 'Cadastro de Unidade de Saúde',
      tipo: 'Informação',
      modulo: 'UNIDADES',
      descricao: `Unidade "${unidade.nome}" (${unidade.tipo}, capacidade ${unidade.capacidade}) cadastrada.`
    });

    return { status: 201, body: { success: true, message: `Unidade "${unidade.nome}" cadastrada com sucesso!`, unidade } };
  }

  function filtrar(filtros = {}) {
    const busca = texto(filtros.busca).toLowerCase();
    const tipo = texto(filtros.tipo);
    const status = texto(filtros.status);
    return getAll().filter(u => {
      if (tipo && u.tipo !== tipo) return false;
      if (status && u.status !== status) return false;
      if (busca && !`${u.nome} ${u.endereco}`.toLowerCase().includes(busca)) return false;
      return true;
    });
  }

  /** GET /unidades (paginado) */
  function listar(filtros = {}) {
    const todos = filtrar(filtros);
    let porPagina = parseInt(filtros.porPagina, 10);
    if (!Number.isFinite(porPagina) || porPagina < 1) porPagina = POR_PAGINA_PADRAO;
    porPagina = Math.min(porPagina, POR_PAGINA_MAX);
    let pagina = parseInt(filtros.pagina, 10);
    if (!Number.isFinite(pagina) || pagina < 1) pagina = 1;

    const total = todos.length;
    const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
    const inicio = (pagina - 1) * porPagina;
    return {
      success: true,
      data: todos.slice(inicio, inicio + porPagina),
      paginacao: { pagina, porPagina, total, totalPaginas }
    };
  }

  /** GET /unidades/indicadores */
  function getIndicadores(filtros = {}) {
    const lista = filtrar(filtros);
    const ativas = lista.filter(u => u.status === 'Operacional');
    const porTipo = {};
    for (const t of TIPOS) porTipo[t] = 0;
    for (const u of lista) porTipo[u.tipo] = (porTipo[u.tipo] || 0) + 1;
    return {
      total: lista.length,
      ativas: ativas.length,
      inativas: lista.length - ativas.length,
      capacidadeTotal: ativas.reduce((s, u) => s + (Number(u.capacidade) || 0), 0),
      porTipo
    };
  }

  /** PUT /unidades/status */
  async function alterarStatus(id, status, operador = 'sistema') {
    if (!STATUS.includes(status)) return erro(400, 'status', `Status inválido. Use: ${STATUS.join(', ')}.`);
    const lista = getAll();
    const u = lista.find(x => String(x.id) === String(id));
    if (!u) return erro(404, 'id', 'Unidade não encontrada.');
    const anterior = u.status;
    u.status = status;
    persist(lista);
    window.AuditoriaService?.registrar({
      usuario: operador,
      acao: 'Alteração de status de unidade',
      tipo: status === 'Operacional' ? 'Informação' : 'Aviso',
      modulo: 'UNIDADES',
      descricao: `Unidade "${u.nome}" alterada de ${anterior} para ${status}.`
    });
    return { status: 200, body: { success: true, message: `Status de "${u.nome}" atualizado para ${status}.`, unidade: u } };
  }

  let interceptado = false;
  function registrarInterceptor() {
    if (typeof window === 'undefined' || !window.fetch || interceptado) return;
    interceptado = true;
    const originalFetch = window.fetch;

    window.fetch = async function (url, options = {}) {
      const Http = window.Http;
      const rota = Http ? Http.caminho(url) : '';
      if (rota !== '/unidades' && !rota.startsWith('/unidades/')) return originalFetch(url, options);
      const method = Http.metodo(options);

      if (method === 'GET') {
        const acesso = Http.autorizar(options, { pagina: 'unidades' });
        if (!acesso.permitido) return Http.negado(acesso);
        const filtros = Http.parametros(url);
        if (rota === '/unidades/indicadores') return Http.json(200, { success: true, indicadores: getIndicadores(filtros) });
        if (rota === '/unidades') return Http.json(200, listar(filtros));
        return Http.json(404, { success: false, error: 'Rota não encontrada.' });
      }

      const acesso = Http.autorizar(options, { acao: 'gerenciar_unidades' });
      if (!acesso.permitido) return Http.negado(acesso);
      const body = Http.corpo(options);
      const operador = acesso.user?.nome || 'sistema';

      if (method === 'POST' && rota === '/unidades/cadastrar') {
        const res = await cadastrar(body, operador);
        return Http.json(res.status, res.body);
      }
      if ((method === 'PUT' || method === 'POST') && rota === '/unidades/status') {
        const res = await alterarStatus(body.id, body.status, operador);
        return Http.json(res.status, res.body);
      }
      return Http.json(405, { success: false, error: 'Método não permitido.' });
    };
  }

  if (typeof window !== 'undefined') {
    registrarInterceptor();
  }

  return { STORAGE_KEY, TIPOS, STATUS, getAll, persist, validar, cadastrar, listar, getIndicadores, alterarStatus, registrarInterceptor };
})();

if (typeof window !== 'undefined') {
  window.UnidadesAPI = UnidadesAPI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnidadesAPI;
}
