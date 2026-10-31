/**
 * ============================================================================
 * AuthAPI — autenticação, tokens de sessão e controle de acesso por perfil.
 * ============================================================================
 *
 * CONTRATO DAS ROTAS (mock local, espelhável na VPS)
 *   POST /auth/login
 *     body:     { identificador, senha }
 *     200:      { success: true, token, user: {...}, expiresAt }
 *     401:      { success: false, error: 'Credenciais inválidas.' }
 *     403:      { success: false, error: 'Perfil sem acesso web.' }
 *
 *   POST /auth/logout
 *     header:   Authorization: Bearer <token>
 *     200:      { success: true }
 *
 *   GET /auth/me
 *     header:   Authorization: Bearer <token>
 *     200:      { success: true, user: {...} }
 *     401:      { success: false, error: 'Sessão inválida ou expirada.' }
 *
 * O middleware `verificarAcesso` valida token + perfil antes de rotas protegidas.
 * ============================================================================
 */
const AuthAPI = (() => {
  const STORAGE_SESSOES = 'upa_sessoes';
  const STORAGE_TOKEN = 'upa_token';
  const SESSAO_DURACAO_MS = 8 * 60 * 60 * 1000; // 8 horas

  // Proteção contra força bruta: após MAX_TENTATIVAS senhas erradas seguidas,
  // a conta (ou o identificador, se não existir) fica bloqueada por BLOQUEIO_MS.
  const STORAGE_TENTATIVAS = 'upa_tentativas_login';
  const MAX_TENTATIVAS = 5;
  const BLOQUEIO_MS = 15 * 60 * 1000;

  const USE_MOCK_API = true;
  const API_BASE_URL = '';

  const ROTAS_PUBLICAS = ['/auth/login'];

  function getSessoes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_SESSOES) || '{}');
    } catch {
      return {};
    }
  }

  function persistSessoes(sessoes) {
    localStorage.setItem(STORAGE_SESSOES, JSON.stringify(sessoes));
  }

  function sanitizarUsuario(user) {
    if (!user) return null;
    const { senha, ...safe } = user;
    return safe;
  }

  function buscarUsuarioPorIdentificador(identificador) {
    const id = String(identificador || '').trim();
    if (!id) return null;
    const usuarios = window.UsuariosAPI?.getAll() || [];
    const idLower = id.toLowerCase();
    const idLimpo = id.replace(/\D/g, '');

    // Só CPF e e-mail identificam um usuário de forma única. Antes também se
    // aceitava nome, primeiro nome, apelidos ("admin", "paciente") e o nome
    // do perfil — dois usuários com o mesmo primeiro nome tornavam o login
    // ambíguo e "Administrador" sempre apontava para o primeiro admin da base.
    if (idLimpo.length === 11 && /^[\d.\-\s]+$/.test(id)) {
      return usuarios.find(u => (u.cpf || '').replace(/\D/g, '') === idLimpo) || null;
    }
    return usuarios.find(u => (u.email || '').trim().toLowerCase() === idLower) || null;
  }

  function getTentativas() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_TENTATIVAS) || '{}');
    } catch {
      return {};
    }
  }

  function persistTentativas(t) {
    localStorage.setItem(STORAGE_TENTATIVAS, JSON.stringify(t));
  }

  function chaveTentativa(user, identificador) {
    return user ? `user:${user.id}` : `id:${String(identificador).trim().toLowerCase()}`;
  }

  function bloqueioAtivo(chave) {
    const reg = getTentativas()[chave];
    return reg && reg.bloqueadoAte && reg.bloqueadoAte > Date.now() ? reg.bloqueadoAte : null;
  }

  // Retorna true quando esta falha disparou o bloqueio.
  function registrarFalha(chave) {
    const t = getTentativas();
    const reg = t[chave] || { falhas: 0, bloqueadoAte: 0 };
    if (reg.bloqueadoAte && reg.bloqueadoAte <= Date.now()) {
      reg.falhas = 0;
      reg.bloqueadoAte = 0;
    }
    reg.falhas++;
    const bloqueou = reg.falhas >= MAX_TENTATIVAS;
    if (bloqueou) reg.bloqueadoAte = Date.now() + BLOQUEIO_MS;
    t[chave] = reg;
    persistTentativas(t);
    return bloqueou;
  }

  function limparFalhas(chave) {
    const t = getTentativas();
    delete t[chave];
    persistTentativas(t);
  }

  // Uso exclusivo de testes: simula o fim da janela de bloqueio.
  function _expirarBloqueios() {
    persistTentativas({});
  }

  function falhaDeLogin(chave, nome) {
    if (!registrarFalha(chave)) return;
    window.AuditoriaService?.registrar({
      usuario: nome,
      acao: 'Conta bloqueada',
      tipo: 'Aviso',
      modulo: 'AUTH',
      descricao: `Login de "${nome}" bloqueado por ${BLOQUEIO_MS / 60000} min após ${MAX_TENTATIVAS} senhas incorretas.`
    });
  }

  function respostaBloqueio(nome, ate) {
    const minutos = Math.max(1, Math.ceil((ate - Date.now()) / 60000));
    window.AuditoriaService?.registrar({
      usuario: nome,
      acao: 'Login bloqueado',
      tipo: 'Aviso',
      modulo: 'AUTH',
      descricao: `Tentativa de login em conta bloqueada por excesso de senhas incorretas ("${nome}").`
    });
    return {
      status: 429,
      body: { success: false, error: `Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em ${minutos} min.` }
    };
  }

  function criarSessao(user) {
    const token = window.Crypto.gerarToken();
    const expiresAt = Date.now() + SESSAO_DURACAO_MS;
    const sessoes = getSessoes();
    sessoes[token] = {
      userId: user.id,
      perfil: user.perfil,
      expiresAt
    };
    persistSessoes(sessoes);
    return { token, expiresAt };
  }

  function validarToken(token) {
    if (!token) return null;
    const sessoes = getSessoes();
    const sessao = sessoes[token];
    if (!sessao) return null;
    if (sessao.expiresAt < Date.now()) {
      delete sessoes[token];
      persistSessoes(sessoes);
      return null;
    }
    const usuarios = window.UsuariosAPI?.getAll() || [];
    const user = usuarios.find(u => u.id === sessao.userId);
    if (!user) {
      delete sessoes[token];
      persistSessoes(sessoes);
      return null;
    }
    return { ...sessao, user: sanitizarUsuario(user) };
  }

  function encerrarSessao(token) {
    if (!token) return;
    const sessoes = getSessoes();
    delete sessoes[token];
    persistSessoes(sessoes);
  }

  /**
   * Middleware de controle de acesso por perfil.
   * @param {string} token - Token Bearer da sessão
   * @param {{ pagina?: string, acao?: string }} recurso - Recurso solicitado
   * @returns {{ permitido: boolean, status: number, error?: string, user?: object }}
   */
  function verificarAcesso(token, recurso = {}) {
    const sessao = validarToken(token);
    if (!sessao) {
      return { permitido: false, status: 401, error: 'Sessão inválida ou expirada.' };
    }

    const perfil = window.Permissoes?.normalizarPerfil(sessao.perfil) || sessao.perfil;
    const { pagina, acao } = recurso;

    if (pagina && !window.Permissoes?.perfilPodeAcessarPagina(perfil, pagina)) {
      return {
        permitido: false,
        status: 403,
        error: `Acesso negado: perfil "${perfil}" não pode acessar "${pagina}".`,
        user: sessao.user
      };
    }

    const mensagensAcao = {
      gerenciar_atendimentos: 'não pode gerenciar atendimentos',
      cadastrar_usuarios: 'não possui permissão para cadastrar usuários',
      ver_logs: 'não pode consultar os logs do sistema',
      gerenciar_unidades: 'não pode cadastrar ou alterar unidades de saúde',
      registrar_vacinacao: 'não pode registrar aplicações de vacina',
      gerenciar_estoque_vacinas: 'não pode movimentar o estoque de vacinas',
      atualizar_consultas: 'não pode atualizar consultas'
    };
    if (acao && !window.Permissoes?.podeExecutarAcao(perfil, acao)) {
      return {
        permitido: false,
        status: 403,
        error: `Acesso negado: perfil "${perfil}" ${mensagensAcao[acao] || `não pode executar "${acao}"`}.`,
        user: sessao.user
      };
    }

    return { permitido: true, status: 200, user: sessao.user, perfil };
  }

  function extrairToken(request) {
    const h = request?.headers;
    let authHeader = '';
    if (h && typeof h.get === 'function') authHeader = h.get('Authorization') || '';
    else authHeader = h?.Authorization || h?.authorization || '';
    if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
    return null;
  }

  /**
   * Middleware para os interceptadores mock: usa o token do header
   * Authorization ou, na falta dele, a sessão local do navegador.
   */
  function autorizarRequisicao(options = {}, recurso = {}) {
    const token = extrairToken({ headers: options.headers || {} }) || getTokenLocal();
    return verificarAcesso(token, recurso);
  }

  /**
   * Processa login — validação de credenciais, hashing e geração de token.
   */
  async function processarLogin(dados) {
    const { identificador, senha } = dados || {};

    if (!identificador || !String(identificador).trim()) {
      return { status: 400, body: { success: false, error: 'Informe CPF, e-mail ou usuário.' } };
    }
    if (!senha) {
      return { status: 400, body: { success: false, error: 'A senha é obrigatória.' } };
    }

    const user = buscarUsuarioPorIdentificador(identificador);
    const chave = chaveTentativa(user, identificador);
    const nomeTentativa = user ? user.nome : String(identificador);

    const bloqueadoAte = bloqueioAtivo(chave);
    if (bloqueadoAte) return respostaBloqueio(nomeTentativa, bloqueadoAte);

    if (!user) {
      window.AuditoriaService?.registrar({
        usuario: String(identificador || 'Desconhecido'),
        acao: 'Falha no login',
        tipo: 'Aviso',
        modulo: 'AUTH',
        descricao: `Tentativa de login com identificador inexistente: "${identificador}".`
      });
      falhaDeLogin(chave, nomeTentativa);
      return { status: 401, body: { success: false, error: 'Credenciais inválidas.' } };
    }

    // Removido (30/10/2026): havia aqui uma "auto-recuperação" que aceitava a
    // senha do seed de demonstração para QUALQUER usuário com perfil
    // Administrador — na prática, uma senha-mestra. Hashes corrompidos dos
    // usuários seed já são restaurados em UsuariosAPI.getAll().
    let senhaValida = false;
    try {
      senhaValida = await window.Crypto.verificarSenha(senha, user.senha);
    } catch (err) {
      console.warn('Falha na verificação de senha:', err);
      senhaValida = false;
    }

    if (!senhaValida) {
      window.AuditoriaService?.registrar({
        usuario: user.nome,
        acao: 'Falha no login',
        tipo: 'Aviso',
        modulo: 'AUTH',
        descricao: `Tentativa de login com senha incorreta para o usuário "${user.nome}".`
      });
      falhaDeLogin(chave, nomeTentativa);
      return { status: 401, body: { success: false, error: 'Credenciais inválidas.' } };
    }

    limparFalhas(chave);

    if (!window.Permissoes?.perfilTemLoginWeb(user.perfil)) {
      window.AuditoriaService?.registrar({
        usuario: user.nome,
        acao: 'Acesso negado ao sistema web',
        tipo: 'Aviso',
        modulo: 'AUTH',
        descricao: `Perfil "${user.perfil}" não possui acesso ao sistema web.`
      });
      return { status: 403, body: { success: false, error: 'Esta conta não tem acesso a este sistema web.' } };
    }

    // Migra senha em texto plano para hash na primeira autenticação bem-sucedida
    if (!window.Crypto.senhaEstaHasheada(user.senha) && window.UsuariosAPI?.atualizarSenha) {
      const hash = await window.Crypto.hashSenha(senha);
      window.UsuariosAPI.atualizarSenha(user.id, hash);
    }

    const { token, expiresAt } = criarSessao(user);
    const safeUser = sanitizarUsuario(user);

    window.AuditoriaService?.registrar({
      usuario: user.nome,
      acao: 'Login realizado com sucesso',
      tipo: 'Acesso',
      modulo: 'AUTH',
      descricao: `Usuário "${user.nome}" (${user.perfil}) autenticado com sucesso.`
    });

    window.App?.addLog?.(
      'SUCESSO',
      `Login realizado: ${user.nome} (${user.perfil})`,
      `Módulo: AUTENTICAÇÃO · IP: local`
    );

    return {
      status: 200,
      body: { success: true, token, user: safeUser, expiresAt }
    };
  }

  function processarLogout(token) {
    const sessao = validarToken(token);
    const nomeUser = sessao?.user?.nome || 'Usuário';
    encerrarSessao(token);

    window.AuditoriaService?.registrar({
      usuario: nomeUser,
      acao: 'Logout realizado',
      tipo: 'Acesso',
      modulo: 'AUTH',
      descricao: `Sessão encerrada pelo usuário "${nomeUser}".`
    });

    return { status: 200, body: { success: true, message: 'Sessão encerrada.' } };
  }

  function processarMe(token) {
    const sessao = validarToken(token);
    if (!sessao) {
      return { status: 401, body: { success: false, error: 'Sessão inválida ou expirada.' } };
    }
    return { status: 200, body: { success: true, user: sessao.user } };
  }

  let interceptado = false;
  function registrarInterceptor() {
    if (!USE_MOCK_API || interceptado) return;
    interceptado = true;
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (url, options = {}) => {
      const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
      const method = (options.method || 'GET').toUpperCase();

      // POST /auth/login
      if (urlStr.endsWith('/auth/login') && method === 'POST') {
        try {
          const dados = JSON.parse(options.body || '{}');
          const { status, body } = await processarLogin(dados);
          return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: 'Erro interno: ' + err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // POST /auth/logout
      if (urlStr.endsWith('/auth/logout') && method === 'POST') {
        const token = extrairToken({ headers: options.headers || {} });
        const { status, body } = processarLogout(token);
        return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
      }

      // GET /auth/me
      if (urlStr.endsWith('/auth/me') && method === 'GET') {
        const token = extrairToken({ headers: options.headers || {} });
        const { status, body } = processarMe(token);
        return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
      }

      // Middleware: rotas protegidas exigem token válido
      const isRotaProtegida = urlStr.includes('/usuarios/') || urlStr.includes('/api/');
      const isPublica = ROTAS_PUBLICAS.some(r => urlStr.endsWith(r));
      if (isRotaProtegida && !isPublica && !urlStr.endsWith('/usuarios/cadastrar')) {
        const token = extrairToken({ headers: options.headers || {} }) || getTokenLocal();
        const acesso = verificarAcesso(token, {});
        if (!acesso.permitido) {
          return new Response(JSON.stringify({ success: false, error: acesso.error }), {
            status: acesso.status, headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      return originalFetch(url, options);
    };
  }

  function getTokenLocal() {
    return sessionStorage.getItem(STORAGE_TOKEN) || localStorage.getItem(STORAGE_TOKEN);
  }

  function setTokenLocal(token) {
    if (token) {
      sessionStorage.setItem(STORAGE_TOKEN, token);
    } else {
      sessionStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_TOKEN);
    }
  }

  async function login(identificador, senha) {
    const url = USE_MOCK_API ? '/auth/login' : `${API_BASE_URL}/auth/login`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identificador, senha })
    });
    const body = await res.json();
    if (body.success && body.token) {
      setTokenLocal(body.token);
      if (body.user) {
        localStorage.setItem('upa_usuario', JSON.stringify(body.user));
      }
    }
    return { status: res.status, body };
  }

  async function logout() {
    const token = getTokenLocal();
    const url = USE_MOCK_API ? '/auth/logout' : `${API_BASE_URL}/auth/logout`;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      await fetch(url, { method: 'POST', headers });
    } catch {
      // Ignora erro de rede no logout
    }
    setTokenLocal(null);
    localStorage.removeItem('upa_usuario');
  }

  async function restaurarSessao() {
    const token = getTokenLocal();
    if (!token) return null;
    const url = USE_MOCK_API ? '/auth/me' : `${API_BASE_URL}/auth/me`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const body = await res.json();
      if (body.success && body.user) {
        localStorage.setItem('upa_usuario', JSON.stringify(body.user));
        return body.user;
      }
    } catch {
      // Falha ao validar token
    }
    setTokenLocal(null);
    localStorage.removeItem('upa_usuario');
    return null;
  }

  function podeAcessarPagina(pagina) {
    const token = getTokenLocal();
    return verificarAcesso(token, { pagina });
  }

  return {
    STORAGE_TOKEN,
    SESSAO_DURACAO_MS,
    registrarInterceptor,
    processarLogin,
    processarLogout,
    processarMe,
    verificarAcesso,
    autorizarRequisicao,
    _expirarBloqueios,
    validarToken,
    login,
    logout,
    restaurarSessao,
    podeAcessarPagina,
    getTokenLocal,
    setTokenLocal,
    sanitizarUsuario
  };
})();

window.AuthAPI = AuthAPI;
