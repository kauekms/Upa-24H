/**
 * Crypto — utilitários de hashing de senha (PBKDF2-SHA256) e geração de tokens.
 * Usa Web Crypto API (disponível em navegadores modernos e Node 19+).
 */
const Crypto = (() => {
  const PBKDF2_ITERATIONS = 100000;
  const TOKEN_BYTES = 32;
  const PREFIX = 'pbkdf2';

  function bytesToBase64(bytes) {
    const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let binary = '';
    for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
    return btoa(binary);
  }

  function base64ToBytes(b64) {
    if (!b64 || typeof b64 !== 'string') return new Uint8Array(0);
    try {
      // Normaliza base64url (- e _) para base64 padrão (+ e /) e remove espaços
      let clean = b64.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
      // Remove caracteres que não pertencem ao alfabeto Base64
      clean = clean.replace(/[^A-Za-z0-9+/=]/g, '');
      // Corrige padding '=' ausente
      const mod = clean.length % 4;
      if (mod === 2) clean += '==';
      else if (mod === 3) clean += '=';
      else if (mod === 1) return new Uint8Array(0); // comprimento inválido

      const binary = atob(clean);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    } catch (err) {
      console.warn('Crypto.base64ToBytes: Base64 inválido ignorado com segurança:', err);
      return new Uint8Array(0);
    }
  }

  function senhaEstaHasheada(senha) {
    return typeof senha === 'string' && senha.startsWith(`${PREFIX}:`);
  }

  function hashEhValido(hashStr) {
    if (!hashStr || typeof hashStr !== 'string') return false;
    if (!senhaEstaHasheada(hashStr)) return true;
    const parts = hashStr.split(':');
    if (parts.length !== 4 || parts[0] !== PREFIX) return false;
    const it = parseInt(parts[1], 10);
    if (isNaN(it) || it <= 0) return false;
    try {
      const salt = base64ToBytes(parts[2]);
      if (!salt || salt.length === 0) return false;
      const hBytes = base64ToBytes(parts[3]);
      if (!hBytes || hBytes.length === 0) return false;
      return true;
    } catch {
      return false;
    }
  }

  async function hashSenha(senhaPlana) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(senhaPlana),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    return `${PREFIX}:${PBKDF2_ITERATIONS}:${bytesToBase64(salt)}:${bytesToBase64(new Uint8Array(derived))}`;
  }

  async function verificarSenha(senhaPlana, senhaArmazenada) {
    try {
      if (!senhaArmazenada) return false;
      if (!senhaEstaHasheada(senhaArmazenada)) {
        return senhaPlana === senhaArmazenada;
      }
      const parts = senhaArmazenada.split(':');
      if (parts.length !== 4 || parts[0] !== PREFIX) return false;

      const iterations = parseInt(parts[1], 10);
      if (isNaN(iterations) || iterations <= 0) return false;

      const salt = base64ToBytes(parts[2]);
      if (!salt || salt.length === 0) return false;

      const expectedHash = parts[3];
      if (!expectedHash) return false;

      if (!crypto || !crypto.subtle) {
        console.warn('Web Crypto API não disponível no ambiente atual.');
        return false;
      }

      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(senhaPlana),
        'PBKDF2',
        false,
        ['deriveBits']
      );
      const derived = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
        keyMaterial,
        256
      );
      return bytesToBase64(new Uint8Array(derived)) === expectedHash;
    } catch (err) {
      console.warn('Crypto.verificarSenha: falha na verificação de hash:', err);
      return false;
    }
  }

  function gerarToken() {
    const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
    return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  return {
    PBKDF2_ITERATIONS,
    senhaEstaHasheada,
    hashEhValido,
    base64ToBytes,
    bytesToBase64,
    hashSenha,
    verificarSenha,
    gerarToken
  };
})();

if (typeof window !== 'undefined') {
  window.Crypto = Crypto;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Crypto;
}
