/**
 * ============================================================================
 * MockHttp — utilitários compartilhados pelos interceptores de fetch().
 * ============================================================================
 *
 * POR QUE ISTO EXISTE
 * Cada módulo de API (agendamentos, consultas, exames, logs...) intercepta o
 * fetch() global para simular um backend. Antes, as rotas eram reconhecidas
 * com `url.includes('/agendamentos')` — e isso também casava com o arquivo
 * de dados da própria tela, `json/agendamentos.json`. Resultado: num
 * navegador limpo, as telas de Agendamentos, Consultas e Exames abriam
 * vazias (e Exames quebrava com TypeError), porque recebiam a resposta da
 * "API" no lugar do JSON de layout.
 *
 * REGRA ATUAL
 * As rotas da API são sempre caminhos absolutos ("/agendamentos/solicitar").
 * Recursos da interface são relativos ("json/x.json", "pages/x.html") e
 * nunca são interceptados. O casamento é exato (ou por prefixo com "/",
 * para rotas com parâmetro como "/exames/:id").
 * ============================================================================
 */
const MockHttp = (() => {
  function urlComoTexto(url) {
    if (typeof url === 'string') return url;
    if (url && typeof url.url === 'string') return url.url;
    if (url && typeof url.href === 'string') return url.href;
    return '';
  }

  /** Caminho da requisição sem query string, ou '' se for um recurso relativo. */
  function caminho(url) {
    const bruto = urlComoTexto(url);
    if (/^https?:\/\//i.test(bruto)) {
      try { return new URL(bruto).pathname; } catch { return ''; }
    }
    const semQuery = bruto.split(/[?#]/)[0];
    return semQuery.startsWith('/') ? semQuery.replace(/\/+$/, '') || '/' : '';
  }

  /** A URL é exatamente esta rota? (ex.: exata(url, '/exames')) */
  function exata(url, rota) {
    return caminho(url) === rota;
  }

  /** A URL é esta rota ou uma sub-rota dela? (ex.: '/exames/%23EX-1') */
  function prefixo(url, rota) {
    const p = caminho(url);
    return p === rota || p.startsWith(rota + '/');
  }

  function query(url) {
    try {
      return Object.fromEntries(new URL(urlComoTexto(url), 'http://localhost').searchParams.entries());
    } catch {
      return {};
    }
  }

  function metodo(options) {
    return String(options?.method || 'GET').toUpperCase();
  }

  function corpo(options) {
    const b = options?.body;
    if (!b) return {};
    if (typeof b === 'string') return JSON.parse(b);
    return b;
  }

  function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return { caminho, exata, prefixo, query, metodo, corpo, json };
})();

if (typeof window !== 'undefined') window.MockHttp = MockHttp;
if (typeof module !== 'undefined' && module.exports) module.exports = MockHttp;
