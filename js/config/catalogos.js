/**
 * ============================================================================
 * Catalogos — listas de domínio usadas nos formulários (selects).
 * ============================================================================
 * Antes, cada modal tinha a sua cópia destas listas digitada à mão (a lista
 * de médicos, por exemplo, aparecia em 4 lugares). Para incluir um médico,
 * especialidade ou unidade, altere apenas aqui.
 * ============================================================================
 */
const Catalogos = {
  especialidades: ['Clínica Geral', 'Cardiologia', 'Ginecologia', 'Ortopedia', 'Dermatologia', 'Pediatria', 'Neurologia'],

  medicos: [
    { nome: 'Dr. Manoel Joaquim', especialidade: 'Clínica Geral' },
    { nome: 'Dr. Arnaldo Luiz', especialidade: 'Cardiologia' },
    { nome: 'Dra. Heloísa Rocha', especialidade: 'Ginecologia' },
    { nome: 'Dr. Carlos Mendes', especialidade: 'Ortopedia' },
    { nome: 'Dra. Patrícia Souza', especialidade: 'Dermatologia' },
    { nome: 'Dr. Paulo Ribeiro', especialidade: 'Neurologia' },
    { nome: 'Dra. Camila Torres', especialidade: 'Pediatria' }
  ],

  // Unidades oficiais (definidas em js/config/unidades.js): "Unidade Centro" e "Unidade Julia"
  get unidades() { return Unidades.LISTA; },

  tiposExame: ['Hemograma Completo', 'Glicemia em Jejum', 'Raio-X Tórax', 'Tomografia Crânio', 'Ultrassom Abdominal', 'ECG', 'Urina Tipo I', 'Colesterol Total e Frações'],

  vacinas: ['COVID-19 (Bivalente)', 'Influenza', 'Hepatite B', 'Febre Amarela', 'Meningite ACWY'],

  /** Gera as <option> de um select, com o valor atual pré-selecionado. */
  opcoes(lista, selecionado, rotulo = v => v) {
    return lista.map(v => `<option value="${Util.esc(v)}"${v === selecionado ? ' selected' : ''}>${Util.esc(rotulo(v))}</option>`).join('');
  },

  medicosDa(especialidade) {
    const daEsp = this.medicos.filter(m => m.especialidade === especialidade);
    return daEsp.length ? daEsp : this.medicos;
  }
};

if (typeof window !== 'undefined') window.Catalogos = Catalogos;
if (typeof module !== 'undefined' && module.exports) module.exports = Catalogos;
