/**
 * ============================================================================
 * UsuariosAPI — camada de acesso a dados de Usuários (Cidadãos, Profissionais
 * da Saúde e Administradores).
 * ============================================================================
 *
 * POR QUE ESTE ARQUIVO EXISTE SEPARADO DO app.js
 * Toda a regra de cadastro de usuário (validação de CPF, obrigatoriedade de
 * campos por perfil, unicidade) ficava misturada dentro do objeto App em
 * app.js. Isso foi isolado aqui para que, quando o backend real (VPS) entrar
 * em cena, baste mexer NESTE arquivo — nenhuma tela (cadastro-usuarios.html,
 * render.js) precisa ser alterada.
 *
 * CONTRATO DA "ROTA" (hoje simulada, amanhã real na VPS)
 *   POST /usuarios/cadastrar
 *   body:     { perfil, nome, cpf, email, senha, ...campos específicos do perfil }
 *   resposta 200: { success: true,  message: string, user: {...} }
 *   resposta 400: { success: false, error: string }
 *
 * O formulário em cadastro-usuarios.html (ver render.js → renderCadastroUsuarios)
 * já consome essa rota via fetch(), exatamente como consumiria uma API HTTP de
 * verdade. Isso é proposital: é o que torna a troca para a VPS barata.
 *
 * ============================================================================
 * COMO TROCAR PARA O BACKEND REAL QUANDO A VPS ESTIVER PRONTA
 * ============================================================================
 * 1) Troque a constante USE_MOCK_API abaixo para false.
 * 2) Defina API_BASE_URL com o endereço da VPS (ex.: 'https://upa24h.seudominio.com.br').
 * 3) Garanta que o backend real responda no mesmo contrato descrito acima.
 * Nada além disso precisa mudar: quando USE_MOCK_API é false, este arquivo não
 * intercepta mais o fetch() global e as chamadas seguem direto para API_BASE_URL.
 * ============================================================================
 */
const UsuariosAPI = (() => {
  const STORAGE_KEY = 'upa_usuarios';

  // ---- PONTO DE TROCA PARA A VPS (ver instruções no cabeçalho do arquivo) ----
  const USE_MOCK_API = true;
  const API_BASE_URL = ''; // ex.: 'https://upa24h.seudominio.com.br' quando USE_MOCK_API = false
  // ------------------------------------------------------------------------

  // Regras de campos obrigatórios por perfil. Centralizado aqui para que
  // adicionar um novo perfil (ou um novo campo obrigatório) no futuro seja
  // uma alteração em um único lugar, tanto no mock quanto — futuramente — na
  // validação espelhada no backend.
  const CAMPOS_OBRIGATORIOS_POR_PERFIL = {
    'Cidadão': [
      { campo: 'rg', label: 'RG' },
      { campo: 'sus', label: 'Cartão SUS' },
      { campo: 'nascimento', label: 'Data de Nascimento' }
    ],
    'Paciente': [
      { campo: 'rg', label: 'RG' },
      { campo: 'sus', label: 'Cartão SUS' },
      { campo: 'nascimento', label: 'Data de Nascimento' }
    ],
    'Profissional da Saúde': [
      { campo: 'registro', label: 'Registro Profissional (CRM/COREN)' },
      { campo: 'especialidade', label: 'Especialidade' },
      { campo: 'unidade', label: 'Unidade de Saúde Atribuída' }
    ],
    'Administrador': [
      { campo: 'setor', label: 'Setor/Departamento' },
      { campo: 'cargo', label: 'Cargo/Função' }
    ],
    'Recepção': [
      { campo: 'unidade', label: 'Unidade de Saúde' }
    ]
  };

  function gerarId(perfil) {
    const prefixos = {
      'Cidadão': 'cid',
      'Paciente': 'pac',
      'Profissional da Saúde': 'prof',
      'Administrador': 'adm',
      'Recepção': 'recep'
    };
    const prefixo = prefixos[perfil] || 'usr';
    return `${prefixo}-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
  }

  function seedInicial() {
    return [
      {
        id: 'adm-seed-001',
        nome: "teste",
        cpf: "111.444.777-35",
        email: "teste@saude.gov.br",
        senha: "admin",
        perfil: "Administrador",
        cargo: "Administrador Geral",
        setor: "Tecnologia da Informação",
        unidade: "Unidade Central",
        telefone: "(11) 98765-4321",
        iniciais: "TE"
      },
      {
        id: 'prof-seed-001',
        nome: "Dr. Carlos Eduardo Mendes",
        cpf: "222.555.888-46",
        email: "carlos.mendes@saude.gov.br",
        senha: "prof123",
        perfil: "Profissional da Saúde",
        registro: "CRM/SP 123456",
        especialidade: "Clínica Geral",
        unidade: "Unidade Central",
        cargo: "Médico Clínico",
        telefone: "(11) 98888-1234",
        iniciais: "CM"
      },
      {
        id: 'pac-seed-001',
        nome: "Maria da Silva Santos",
        cpf: "333.666.999-57",
        email: "maria.santos@email.com",
        senha: "paciente123",
        perfil: "Paciente",
        sus: "123456789012345",
        rg: "12.345.678-9",
        nascimento: "1988-04-12",
        telefone: "(11) 97777-5678",
        iniciais: "MS"
      },
      {
        id: 'recep-seed-001',
        nome: "Mariana Costa Souza",
        cpf: "444.777.000-83",
        email: "recepcao@saude.gov.br",
        senha: "recep123",
        perfil: "Recepção",
        unidade: "Unidade Central",
        cargo: "Recepcionista",
        telefone: "(11) 96666-4321",
        iniciais: "MC"
      }
    ];
  }

  function getAll() {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (raw.includes("Denilson Barrios") || raw.includes("Luciana Ferreira") || raw.includes("Marcos Oliveira"))) {
      localStorage.removeItem(STORAGE_KEY);
      raw = null;
    }
    let users = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) users = parsed;
      } catch {
        users = [];
      }
    }

    // Garante que TODOS os usuários canônicos do seed existam e estejam com credenciais válidas
    const seed = seedInicial();
    let precisaSalvar = (users.length === 0);

    for (const sUser of seed) {
      const sCpfLimpo = (sUser.cpf || '').replace(/\D/g, '');
      const idx = users.findIndex(u => 
        u.id === sUser.id || 
        (u.cpf && sCpfLimpo && u.cpf.replace(/\D/g, '') === sCpfLimpo)
      );

      if (idx === -1) {
        users.push({ ...sUser });
        precisaSalvar = true;
      } else {
        const u = users[idx];
        // Garante que a senha e perfil estejam presentes e funcionais
        const hashInvalido = u.senha && window.Crypto?.senhaEstaHasheada?.(u.senha) && window.Crypto?.hashEhValido && !window.Crypto.hashEhValido(u.senha);
        if (!u.senha || hashInvalido) {
          u.senha = sUser.senha;
          precisaSalvar = true;
        }
        if (!u.perfil) {
          u.perfil = sUser.perfil;
          precisaSalvar = true;
        }
      }
    }

    if (precisaSalvar) {
      persist(users);
    }
    return users;
  }

  function persist(lista) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  /**
   * Valida formato (11 dígitos, não repetidos) e dígitos verificadores de um CPF.
   * Retorna { valido, limpo, mensagem }. `limpo` é o CPF só com dígitos.
   */
  function validarCPF(cpfBruto) {
    const limpo = String(cpfBruto || '').replace(/\D/g, '');

    if (limpo.length !== 11) {
      return { valido: false, limpo, mensagem: 'O CPF deve conter exatamente 11 dígitos.' };
    }
    if (/^(\d)\1{10}$/.test(limpo)) {
      return { valido: false, limpo, mensagem: 'CPF inválido (dígitos repetidos).' };
    }

    let soma = 0;
    for (let i = 1; i <= 9; i++) soma += parseInt(limpo.substring(i - 1, i), 10) * (11 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(limpo.substring(9, 10), 10)) {
      return { valido: false, limpo, mensagem: 'CPF inválido.' };
    }

    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(limpo.substring(i - 1, i), 10) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(limpo.substring(10, 11), 10)) {
      return { valido: false, limpo, mensagem: 'CPF inválido.' };
    }

    return { valido: true, limpo, mensagem: '' };
  }

  function formatarCPF(cpfLimpo) {
    return cpfLimpo.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }

  function cpfDisponivel(cpfBruto, ignorarId) {
    const limpo = String(cpfBruto || '').replace(/\D/g, '');
    if (!limpo) return true;
    return !getAll().some(u => u.id !== ignorarId && u.cpf.replace(/\D/g, '') === limpo);
  }

  function emailDisponivel(emailBruto, ignorarId) {
    const email = String(emailBruto || '').trim().toLowerCase();
    if (!email) return true;
    return !getAll().some(u => u.id !== ignorarId && String(u.email || '').trim().toLowerCase() === email);
  }

  /**
   * Valida a presença dos campos obrigatórios específicos do perfil escolhido.
   * Retorna { valido, mensagem }.
   */
  function validarCamposPorPerfil(dados) {
    let regras = CAMPOS_OBRIGATORIOS_POR_PERFIL[dados.perfil];
    if (!regras) {
      return { valido: false, mensagem: 'Perfil de usuário inválido.' };
    }

    // Se CPF foi informado, RG não é obrigatório
    if (dados.cpf && dados.cpf.trim()) {
      regras = regras.filter(r => r.campo !== 'rg');
    }

    for (const regra of regras) {
      const valor = dados[regra.campo];
      if (!valor || !String(valor).trim()) {
        return { valido: false, mensagem: `${regra.label} é obrigatório para o perfil ${dados.perfil}.` };
      }
    }

    if (dados.perfil === 'Cidadão' || dados.perfil === 'Paciente') {
      const susLimpo = String(dados.sus || '').replace(/\D/g, '');
      if (susLimpo.length !== 15) {
        return { valido: false, mensagem: 'O Cartão SUS deve conter exatamente 15 dígitos numéricos.' };
      }
    }

    return { valido: true, mensagem: '' };
  }

  function atualizarSenha(id, novoHash) {
    const usuarios = getAll();
    const index = usuarios.findIndex(u => u.id === id);
    if (index !== -1) {
      usuarios[index].senha = novoHash;
      persist(usuarios);
      return true;
    }
    return false;
  }

  /**
   * Regra central de cadastro. Usada tanto pelo interceptor de fetch (mock)
   * quanto por chamadas diretas da aplicação e testes.
   * Retorna { status, body } no mesmo formato de uma resposta HTTP.
   */
  async function processarCadastro(dados) {
    const { nome, cpf, email, senha, perfil } = dados || {};

    if (!nome || !nome.trim()) return { status: 400, body: { success: false, error: 'O nome completo é obrigatório.' } };
    if (!cpf || !cpf.trim()) return { status: 400, body: { success: false, error: 'O CPF é obrigatório.' } };
    if (!email || !email.trim()) return { status: 400, body: { success: false, error: 'O e-mail é obrigatório.' } };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return { status: 400, body: { success: false, error: 'Informe um e-mail em um formato válido.' } };
    }
    if (!senha || !senha.trim()) return { status: 400, body: { success: false, error: 'A senha é obrigatória.' } };
    if (!perfil) return { status: 400, body: { success: false, error: 'O perfil do usuário é obrigatório.' } };

    const cpfCheck = validarCPF(cpf);
    if (!cpfCheck.valido) {
      return { status: 400, body: { success: false, error: cpfCheck.mensagem } };
    }

    if (!cpfDisponivel(cpf)) {
      return { status: 400, body: { success: false, error: 'Este CPF já está cadastrado no sistema.' } };
    }
    if (!emailDisponivel(email)) {
      return { status: 400, body: { success: false, error: 'Este e-mail já está cadastrado no sistema.' } };
    }

    const perfilCheck = validarCamposPorPerfil(dados);
    if (!perfilCheck.valido) {
      return { status: 400, body: { success: false, error: perfilCheck.mensagem } };
    }

    let senhaArmazenada = senha.trim();
    if (window.Crypto?.hashSenha && !window.Crypto.senhaEstaHasheada(senhaArmazenada)) {
      try {
        senhaArmazenada = await window.Crypto.hashSenha(senhaArmazenada);
      } catch (err) {
        console.warn('Não foi possível gerar hash criptográfico, mantendo valor informado:', err);
      }
    }

    const iniciais = nome.trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const novoUsuario = {
      ...dados,
      senha: senhaArmazenada,
      id: gerarId(perfil),
      cpf: formatarCPF(cpfCheck.limpo),
      email: email.trim(),
      iniciais
    };

    const usuarios = getAll();
    usuarios.push(novoUsuario);
    persist(usuarios);

    // Registra log de auditoria do cadastro de usuário
    const operador = window.App?.usuario ? window.App.usuario.nome : 'sistema';
    window.App?.addLog(
      'SUCESSO',
      `Novo usuário cadastrado: ${novoUsuario.nome} (${novoUsuario.perfil})`,
      `Módulo: CADASTRO · Operador: ${operador} · CPF: ${novoUsuario.cpf}`
    );

    const { senha: _, ...safeUser } = novoUsuario;

    return {
      status: 200,
      body: { success: true, message: 'Usuário cadastrado com sucesso!', user: safeUser }
    };
  }

  let interceptado = false;
  function registrarInterceptor() {
    if (!USE_MOCK_API || interceptado) return;
    interceptado = true;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (url, options) => {
      const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
      if (urlStr.endsWith('/usuarios/cadastrar')) {
        if (!options || options.method !== 'POST') {
          return new Response(JSON.stringify({ success: false, error: 'Método não permitido.' }), {
            status: 405, headers: { 'Content-Type': 'application/json' }
          });
        }
        try {
          const dados = JSON.parse(options.body);
          const { status, body } = await processarCadastro(dados);
          return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
          return new Response(JSON.stringify({ success: false, error: 'Erro interno no servidor: ' + err.message }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      return originalFetch(url, options);
    };
  }

  async function cadastrar(dados) {
    const url = USE_MOCK_API ? '/usuarios/cadastrar' : `${API_BASE_URL}/usuarios/cadastrar`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const body = await res.json();
    return { status: res.status, body };
  }

  return {
    STORAGE_KEY,
    registrarInterceptor,
    getAll,
    persist,
    cadastrar,
    processarCadastro,
    atualizarSenha,
    validarCPF,
    cpfDisponivel,
    emailDisponivel,
    CAMPOS_OBRIGATORIOS_POR_PERFIL
  };
})();

window.UsuariosAPI = UsuariosAPI;
