const test = require('node:test');
const assert = require('node:assert');
const { prepararAmbiente, carregar } = require('./helpers/ambiente');

prepararAmbiente();
carregar('api/http.js', 'api/auditoria.js', 'api/exames.js');

test('Exames: "Atrasado" é calculado contra a data de hoje, não contra 07/05/2026', () => {
  const ontem = new Date(Date.now() - 24 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const dataPrevista = `${pad(ontem.getDate())}/${pad(ontem.getMonth() + 1)}/${ontem.getFullYear()}`;
  assert.strictEqual(window.ExamesAPI.isAtrasado({ status: 'Em andamento', dataPrevista }), true);
});

test('Exames: IDs de novos exames são sequenciais e nunca repetem', async () => {
  window.ExamesAPI.persist([{ id: '#EX-9000', paciente: 'A', tipo: 'T', data: '01/01/2031', unidade: 'U', status: 'Solicitado' }]);
  const ids = [];
  for (let i = 0; i < 30; i++) {
    const r = await window.ExamesAPI.solicitar({ paciente: `P${i}`, tipo: 'Hemograma', data: '02/01/2031', horario: `${String(7 + Math.floor(i / 6)).padStart(2, '0')}:${String((i % 6) * 10).padStart(2, '0')}`, unidade: 'Unidade X' });
    assert.strictEqual(r.status, 201);
    ids.push(r.body.exame.id);
  }
  assert.strictEqual(new Set(ids).size, 30);
  assert.strictEqual(ids[0], '#EX-9001');
  assert.strictEqual(ids[29], '#EX-9030');
});
