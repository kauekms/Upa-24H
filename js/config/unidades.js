/**
 * ============================================================================
 * Unidades — lista oficial de unidades de saúde do sistema.
 * ============================================================================
 * DECISÃO DE NEGÓCIO (10/11/2026): o sistema trabalha com DUAS unidades,
 * "Unidade Centro" e "Unidade Julia". Antes cada módulo usava nomes
 * diferentes ("Unidade Central/Sul/Norte...", "UPA 24h Central", "UBS Vila
 * Nova", "Hospital Central Municipal"...).
 *
 * normalizar() converte os nomes antigos para os oficiais. As APIs aplicam
 * essa conversão ao ler os dados, então registros já salvos no navegador com
 * nomes antigos são migrados automaticamente, sem perder nada.
 * ============================================================================
 */
const Unidades = (() => {
  const CENTRO = 'Unidade Centro';
  const JULIA = 'Unidade Julia';
  const LISTA = [CENTRO, JULIA];

  // Nomes antigos (em minúsculas) → unidade oficial
  const LEGADO = {
    'unidade central': CENTRO,
    'upa 24h central': CENTRO,
    'upa central 24h': CENTRO,
    'ubs centro': CENTRO,
    'hospital central municipal': CENTRO,
    'unidade oeste': JULIA,
    'unidade sul': JULIA,
    'unidade norte': JULIA,
    'unidade leste': JULIA,
    'upa sul': JULIA,
    'upa 24h jardim sul': JULIA,
    'ubs vila nova': JULIA,
    'hospital regional norte': JULIA,
    'ame especialidades leste': JULIA,
    'ame laboratorial': JULIA,
    'unidade júlia': JULIA
  };

  /** Converte um nome antigo para o oficial; outros valores voltam inalterados. */
  function normalizar(nome) {
    if (typeof nome !== 'string') return nome;
    const oficial = LEGADO[nome.trim().toLowerCase()];
    return oficial || nome;
  }

  /** Normaliza o campo `unidade` de uma lista de registros. Retorna true se algo mudou. */
  function normalizarRegistros(lista, campo = 'unidade') {
    let mudou = false;
    (Array.isArray(lista) ? lista : []).forEach(r => {
      if (r && typeof r[campo] === 'string') {
        const novo = normalizar(r[campo]);
        if (novo !== r[campo]) { r[campo] = novo; mudou = true; }
      }
    });
    return mudou;
  }

  return { CENTRO, JULIA, LISTA, normalizar, normalizarRegistros };
})();

if (typeof window !== 'undefined') window.Unidades = Unidades;
if (typeof module !== 'undefined' && module.exports) module.exports = Unidades;
