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
  const Http = (typeof window !== 'undefined' && window.MockHttp) || require('./mock-http.js');
  const STORAGE_SESSOES = 'upa_sessoes';
  const STORAGE_TOKEN = 'upa_token';
  const SESSAO_DURACAO_MS = 8 * 60 * 60 * 1000; // 8 horas

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

    // 1. Busca por CPF (se contiver ao menos 9 dígitos ou formatação de CPF)
    if (idLimpo.length >= 9) {
      const porCpf = usuarios.find(u => {
        const cpfLimpo = (u.cpf || '').replace(/\D/g, '');
        return u.cpf === id || (cpfLimpo && cpfLimpo === idLimpo);
      });
      if (porCpf) return porCpf;
    }

    // 2. Busca por e-mail exato
    const porEmail = usuarios.find(u => (u.email || '').toLowerCase() === idLower);
    if (porEmail) return porEmail;

    // 3. Apelidos e nomes de usuários de teste (prioriza seed oficial)
    if (idLower === 'admin' || idLower === 'administrador') {
      return usuarios.find(u => u.id === 'adm-seed-001' || u.cpf === '111.444.777-35') ||
             usuarios.find(u => u.perfil === 'Administrador') || null;
    }
    if (idLower === 'prof' || idLower === 'profissional' || idLower === 'medico' || idLower === 'profissional da saúde' || idLower === 'profissional de saude') {
      return usuarios.find(u => u.id === 'prof-seed-001' || u.cpf === '222.555.888-46') ||
             usuarios.find(u => u.perfil === 'Profissional da Saúde') || null;
    }
    if (idLower === 'paciente' || idLower === 'cidadao' || idLower === 'cidadão') {
      return usuarios.find(u => u.id === 'pac-seed-001' || u.cpf === '333.666.999-57') ||
             usuarios.find(u => u.perfil === 'Paciente' || u.perfil === 'Cidadão') || null;
    }
    if (idLower === 'recepcao' || idLower === 'recepção' || idLower === 'recepcionista') {
      return usuarios.find(u => u.id === 'recep-seed-001' || u.cpf === '444.777.000-83') ||
             usuarios.find(u => u.perfil === 'Recepção') || null;
    }

    // 4. Busca por nome completo ou primeiro nome
    const porNome = usuarios.find(u => {
      const nomeLower = (u.nome || '').toLowerCase();
      if (nomeLower === idLower) return true;
      const primeiroNome = nomeLower.split(' ')[0];
      return primeiroNome === idLower;
    });
    if (porNome) return porNome;

    // 5. Fallback por perfil genérico
    return usuarios.find(u => (u.perfil || '').toLowerCase() === idLower) || null;
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

    if (acao === 'gerenciar_atendimentos' && !window.Permissoes?.podeGerenciarAtendimentos(perfil)) {
      return {
        permitido: false,
        status: 403,
        error: `Acesso negado: perfil "${perfil}" não pode gerenciar atendimentos.`,
        user: sessao.user
      };
    }

    if (acao === 'cadastrar_usuarios' && !window.Permissoes?.podeCadastrarUsuarios(perfil)) {
      return {
        permitido: false,
        status: 403,
        error: `Acesso negado: perfil "${perfil}" não possui permissão para cadastrar usuários.`,
        user: sessao.user
      };
    }

    if (acao === 'registrar_vacinacao' && !window.Permissoes?.podeRegistrarVacinacao(perfil)) {
      return {
        permitido: false,
        status: 403,
        error: `Acesso negado: perfil "${perfil}" não possui permissão para registrar aplicação de vacinas (permitido apenas a Profissional da Saúde, Recepção ou Administrador).`,
        user: sessao.user
      };
    }

    if (acao === 'gerenciar_estoque_vacina' && !window.Permissoes?.podeGerenciarEstoqueVacina(perfil)) {
      return {
        permitido: false,
        status: 403,
        error: `Acesso negado: perfil "${perfil}" não possui permissão para registrar entrada de lote no estoque (restrito a Administrador).`,
        user: sessao.user
      };
    }

    return { permitido: true, status: 200, user: sessao.user, perfil };
  }

  function extrairToken(request) {
    const authHeader = request?.headers?.Authorization || request?.headers?.authorization || '';
    if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
    return null;
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
    if (!user) {
      window.AuditoriaService?.registrar({
        usuario: String(identificador || 'Desconhecido'),
        acao: 'Falha no login',
        tipo: 'Aviso',
        modulo: 'AUTH',
        descricao: `Tentativa de login com identificador inexistente: "${identificador}".`
      });
      return { status: 401, body: { success: false, error: 'Credenciais inválidas.' } };
    }

    let senhaValida = false;
    try {
      senhaValida = await window.Crypto.verificarSenha(senha, user.senha);
    } catch (err) {
      console.warn('Falha na verificação de senha:', err);
      senhaValida = false;
    }

    // Auto-recuperação de senhas canônicas do seed SOMENTE quando o hash
    // armazenado está corrompido (ilegível). Antes, qualquer Administrador
    // entrava com a senha "admin" do seed (a busca casava "qualquer admin com
    // o admin do seed") e a senha original do seed continuava valendo mesmo
    // depois de ser trocada — na prática, uma porta dos fundos.
    const hashCorrompido = !window.Crypto?.hashEhValido || !window.Crypto.hashEhValido(user.senha);
    if (!senhaValida && hashCorrompido) {
      const seedUsers = window.UsuariosAPI?.seedInicial?.() || [];
      const sRef = seedUsers.find(s =>
        s.id === user.id ||
        (s.cpf && user.cpf && s.cpf.replace(/\D/g, '') === user.cpf.replace(/\D/g, ''))
      );
      if (sRef && sRef.senha === String(senha).trim()) {
        senhaValida = true;
        if (window.Crypto?.hashSenha && window.UsuariosAPI?.atualizarSenha) {
          try {
            const hash = await window.Crypto.hashSenha(sRef.senha);
            window.UsuariosAPI.atualizarSenha(user.id, hash);
            user.senha = hash;
          } catch (e) {
            console.warn('Não foi possível regenerar hash recuperado:', e);
          }
        }
      }
    }

    if (!senhaValida) {
      window.AuditoriaService?.registrar({
        usuario: user.nome,
        acao: 'Falha no login',
        tipo: 'Aviso',
        modulo: 'AUTH',
        descricao: `Tentativa de login com senha incorreta para o usuário "${user.nome}".`
      });
      return { status: 401, body: { success: false, error: 'Credenciais inválidas.' } };
    }

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
      const method = Http.metodo(options);

      // POST /auth/login
      if (Http.exata(url, '/auth/login') && method === 'POST') {
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
      if (Http.exata(url, '/auth/logout') && method === 'POST') {
        const token = extrairToken({ headers: options.headers || {} });
        const { status, body } = processarLogout(token);
        return Http.json(body, status);
      }

      // GET /auth/me
      if (Http.exata(url, '/auth/me') && method === 'GET') {
        const token = extrairToken({ headers: options.headers || {} });
        const { status, body } = processarMe(token);
        return Http.json(body, status);
      }

      // Middleware: rotas protegidas exigem token válido
      const isRotaProtegida = Http.prefixo(url, '/usuarios') || Http.prefixo(url, '/api');
      const isPublica = ROTAS_PUBLICAS.some(r => Http.exata(url, r));
      if (isRotaProtegida && !isPublica && !Http.exata(url, '/usuarios/cadastrar')) {
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
