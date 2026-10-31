/**
 * ============================================================================
 * Http — utilitários compartilhados pelos interceptadores mock de fetch.
 * ============================================================================
 *
 * Antes, cada js/api/*.js decidia a rota com `url.includes('/agendamentos')`.
 * Isso capturava também `fetch('json/agendamentos.json')` (o JSON da própria
 * tela) e devolvia a lista da API no lugar do arquivo. Aqui a rota é
 * comparada pelo caminho exato da URL.
 *
 * Também centraliza a autorização: o perfil de quem chama uma rota vem SEMPRE
 * do token de sessão (Authorization: Bearer ou sessão local do navegador),
 * nunca de um campo do corpo como `perfilSolicitante`.
 * ============================================================================
 */
const Http = (() => {
  function caminho(url) {
    const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
    try {
      return new URL(urlStr, 'http://localhost').pathname.replace(/\/+$/, '') || '/';
    } catch {
      return '';
    }
  }

  function parametros(url) {
    const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
    try {
      return Object.fromEntries(new URL(urlStr, 'http://localhost').searchParams.entries());
    } catch {
      return {};
    }
  }

  function metodo(options) {
    return String((options && options.method) || 'GET').toUpperCase();
  }

  function corpo(options) {
    const b = options && options.body;
    if (!b) return {};
    if (typeof b === 'object') return b;
    try {
      return JSON.parse(b);
    } catch {
      return {};
    }
  }

  function json(status, body) {
    return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  }

  /**
   * Valida a sessão de quem chama a rota e, opcionalmente, uma ação do RBAC.
   * Retorna o mesmo formato de AuthAPI.verificarAcesso.
   */
  function autorizar(options, recurso = {}) {
    if (!window.AuthAPI?.autorizarRequisicao) {
      return { permitido: false, status: 401, error: 'Serviço de autenticação indisponível.' };
    }
    return window.AuthAPI.autorizarRequisicao(options, recurso);
  }

  function negado(acesso) {
    return json(acesso.status || 403, { success: false, error: acesso.error || 'Acesso negado.' });
  }

  function ehCidadao(perfil) {
    const p = window.Permissoes?.normalizarPerfil(perfil) || perfil;
    return p === 'Cidadão' || p === 'Paciente';
  }

  function cpfLimpo(cpf) {
    return String(cpf || '').replace(/\D/g, '');
  }

  return { caminho, parametros, metodo, corpo, json, autorizar, negado, ehCidadao, cpfLimpo };
})();

if (typeof window !== 'undefined') {
  window.Http = Http;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Http;
}
