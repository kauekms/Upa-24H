/**
 * ============================================================================
 * Permissoes — tabela central de acesso por perfil de usuário.
 * ============================================================================
 *
 * Antes, cada tela verificava manualmente (com if/else espalhados por
 * app.js e render.js) se o perfil logado podia ver isto ou aquilo. Isso foi
 * centralizado aqui para que uma mudança de regra de negócio — "a Recepção
 * agora também pode ver Vacinação", por exemplo — seja uma alteração num
 * único lugar, e não uma caça por todo o código.
 *
 * DECISÃO DE NEGÓCIO REGISTRADA (16/08/2026):
 *  - Administrador   → uso interno da equipe de TI (gestão completa do sistema).
 *  - Recepção        → time da recepção: Dashboard, Agendamentos, Consultas e
 *                       Exames (visualizar e inserir novos). Sem acesso a
 *                       Vacinação, Unidades, Logs ou Cadastro de Usuários.
 *  - Profissional da Saúde → mantido como já funcionava (tudo, exceto Logs e
 *                       Cadastro de Usuários).
 *  - Cidadão (antigo "Paciente") → o plano original era esse perfil só existir
 *                       como CADASTRO, com o acesso de verdade acontecendo só
 *                       pelo futuro aplicativo móvel (.NET MAUI). Ainda não
 *                       existe app — então, ATUALIZAÇÃO (21/08/2026): o Cidadão
 *                       volta a poder logar aqui no sistema web, neste primeiro
 *                       momento, mas com o MESMO recorte de dados já definido
 *                       para o app móvel (ver ModelosCidadao.cs): só enxerga os
 *                       PRÓPRIOS Agendamentos, Consultas e Exames (nunca a lista
 *                       completa da equipe), sem Dashboard, Vacinação, Unidades,
 *                       Logs ou Cadastro de Usuários, e só no modo visualização
 *                       (não pode criar/editar — isso continua exclusivo de
 *                       Administrador e Recepção). O filtro "só meus dados" é
 *                       aplicado em app.js (goTo), não aqui.
 *
 * IMPORTANTE — nada disto é validado no servidor, porque hoje não existe
 * servidor: é só o navegador decidindo o que mostrar. Quando a VPS existir,
 * esta mesma tabela deve ser espelhada (e validada de verdade) no backend,
 * porque um usuário mal-intencionado pode alterar `App.usuario.perfil` pelo
 * console e contornar tudo isto no front-end.
 * ============================================================================
 */
const Permissoes = (() => {
  // Perfis que podem efetivamente entrar no sistema web hoje.
  const PERFIS_COM_LOGIN_WEB = ['Administrador', 'Recepção', 'Profissional da Saúde', 'Cidadão', 'Paciente'];

  // Páginas (ids de js/../json/navegacao.json) visíveis por perfil.
  // 'configuracoes' e 'perfil' não entram aqui de propósito: são acessíveis
  // a qualquer usuário autenticado (ficam fora do menu principal).
  const PAGINAS_POR_PERFIL = {
    'Administrador': ['dashboard', 'agendamentos', 'consultas', 'exames', 'unidades', 'logs', 'cadastro-usuarios'],
    'Profissional da Saúde': ['dashboard', 'agendamentos', 'consultas', 'exames', 'unidades'],
    'Recepção': ['dashboard', 'agendamentos', 'consultas', 'exames'],
    // Cidadão e Paciente têm a mesma visão restrita: autoatendimento de
    // agendamentos, consultas e exames próprios.
    'Cidadão': ['agendamentos', 'consultas', 'exames'],
    'Paciente': ['agendamentos', 'consultas', 'exames']
  };

  // Perfis que podem criar/editar agendamentos, consultas e exames (não só ver).
  const PERFIS_QUE_GERENCIAM_ATENDIMENTOS = ['Administrador', 'Recepção'];

  // Perfis autorizados a cadastrar e gerenciar novos usuários no sistema.
  const PERFIS_QUE_GERENCIAM_USUARIOS = ['Administrador'];

  function normalizarPerfil(perfil) {
    if (!perfil) return '';
    const p = String(perfil).trim();
    const pLower = p.toLowerCase();
    if (pLower === 'administrador' || pLower === 'admin') return 'Administrador';
    if (pLower === 'profissional da saúde' || pLower === 'profissional de saude' || pLower === 'medico' || pLower === 'enfermeiro') {
      return 'Profissional da Saúde';
    }
    if (pLower === 'recepção' || pLower === 'recepcao') return 'Recepção';
    if (pLower === 'paciente') return 'Paciente';
    if (pLower === 'cidadão' || pLower === 'cidadao') return 'Cidadão';
    return p;
  }

  function perfilTemLoginWeb(perfil) {
    const norm = normalizarPerfil(perfil);
    return PERFIS_COM_LOGIN_WEB.includes(norm) || PERFIS_COM_LOGIN_WEB.includes(perfil);
  }

  function paginasVisiveis(perfil) {
    const norm = normalizarPerfil(perfil);
    return PAGINAS_POR_PERFIL[norm] || PAGINAS_POR_PERFIL[perfil] || [];
  }

  function perfilPodeAcessarPagina(perfil, pageId) {
    if (pageId === 'configuracoes' || pageId === 'perfil') return perfilTemLoginWeb(perfil);
    return paginasVisiveis(perfil).includes(pageId);
  }

  function podeGerenciarAtendimentos(perfil) {
    const norm = normalizarPerfil(perfil);
    return PERFIS_QUE_GERENCIAM_ATENDIMENTOS.includes(norm) || PERFIS_QUE_GERENCIAM_ATENDIMENTOS.includes(perfil);
  }

  function podeCadastrarUsuarios(perfil) {
    const norm = normalizarPerfil(perfil);
    return PERFIS_QUE_GERENCIAM_USUARIOS.includes(norm) || PERFIS_QUE_GERENCIAM_USUARIOS.includes(perfil);
  }

  // Página inicial para onde mandar o usuário logo após o login.
  function paginaInicial(perfil) {
    const paginas = paginasVisiveis(perfil);
    return paginas.includes('dashboard') ? 'dashboard' : (paginas[0] || 'agendamentos');
  }

  return {
    PERFIS_COM_LOGIN_WEB,
    PAGINAS_POR_PERFIL,
    normalizarPerfil,
    perfilTemLoginWeb,
    paginasVisiveis,
    perfilPodeAcessarPagina,
    podeGerenciarAtendimentos,
    podeCadastrarUsuarios,
    paginaInicial
  };
})();

window.Permissoes = Permissoes;
