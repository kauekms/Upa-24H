/**
 * ============================================================================
 * Util — funções utilitárias compartilhadas por toda a interface.
 * ============================================================================
 *
 * Antes, a mesma máscara de CPF estava copiada em 6 lugares diferentes,
 * datas eram geradas com toISOString() (que usa UTC e "pula" para o dia
 * seguinte depois das 21h no horário de Brasília) e nenhum dado era escapado
 * antes de ir para innerHTML — um nome de cidadão como
 * `<img src=x onerror=alert(1)>` executava código para quem abrisse a lista.
 * Tudo isso foi centralizado aqui.
 * ============================================================================
 */
const Util = (() => {
  const MAPA_ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };

  /** Escapa um valor para uso seguro dentro de HTML (texto ou atributo). */
  function esc(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor).replace(/[&<>"'`]/g, c => MAPA_ESCAPE[c]);
  }

  const pad = n => String(n).padStart(2, '0');

  /** Data local no formato aaaa-mm-dd (para inputs type="date"). */
  function dataLocalISO(d = new Date()) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  /** Data/hora local no formato aaaa-mm-ddThh:mm (para inputs datetime-local). */
  function dataHoraLocalISO(d = new Date()) {
    return `${dataLocalISO(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /** "2026-05-07" → "07/05/2026". Valores já em BR são devolvidos como estão. */
  function isoParaBR(valor) {
    const s = String(valor || '').trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
  }

  /** "07/05/2026" → "2026-05-07". Valores já em ISO são devolvidos como estão. */
  function brParaISO(valor) {
    const s = String(valor || '').trim();
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : s;
  }

  /** Aplica a máscara 000.000.000-00 progressivamente enquanto o usuário digita. */
  function mascararCPF(valor) {
    const d = String(valor || '').replace(/\D/g, '').slice(0, 11);
    if (d.length > 9) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
    if (d.length > 6) return d.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
    if (d.length > 3) return d.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
    return d;
  }

  const somenteDigitos = v => String(v || '').replace(/\D/g, '');

  function ehCidadao(usuario) {
    const p = usuario?.perfil;
    return p === 'Cidadão' || p === 'Paciente';
  }

  function iniciais(nome) {
    return String(nome || '?').trim().split(/\s+/).map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  /** Idade em anos completos a partir de "aaaa-mm-dd" (considera mês e dia). */
  function calcularIdade(nascimentoISO, hoje = new Date()) {
    const m = String(nascimentoISO || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    let idade = hoje.getFullYear() - Number(m[1]);
    const antesDoAniversario = (hoje.getMonth() + 1 < Number(m[2])) ||
      (hoje.getMonth() + 1 === Number(m[2]) && hoje.getDate() < Number(m[3]));
    if (antesDoAniversario) idade--;
    return idade >= 0 ? idade : null;
  }

  /** Monta um CSV (separador ";" — padrão do Excel em pt-BR) com aspas escapadas. */
  function gerarCSV(cabecalhos, linhas) {
    const celula = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [cabecalhos, ...linhas].map(l => l.map(celula).join(';')).join('\r\n');
  }

  /**
   * Faz o download de um arquivo gerado no navegador. Usa Blob em vez de
   * data:URI — o export antigo usava encodeURI() num data:URI e qualquer "#"
   * (presente em todos os IDs, ex.: "#10291") cortava o arquivo ali.
   */
  function baixarArquivo(nome, conteudo, mime = 'text/plain;charset=utf-8') {
    const bom = mime.startsWith('text/csv') ? '﻿' : '';
    const blob = new Blob([bom + conteudo], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copiarTexto(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  }

  /** Converte "a\nb" de mensagens livres em HTML seguro, preservando quebras. */
  function textoParaHtml(texto) {
    return esc(texto).replace(/\n/g, '<br>');
  }

  return {
    esc,
    dataLocalISO,
    dataHoraLocalISO,
    isoParaBR,
    brParaISO,
    mascararCPF,
    somenteDigitos,
    ehCidadao,
    iniciais,
    calcularIdade,
    gerarCSV,
    baixarArquivo,
    copiarTexto,
    textoParaHtml
  };
})();

if (typeof window !== 'undefined') window.Util = Util;
if (typeof module !== 'undefined' && module.exports) module.exports = Util;
