# Validação Geral dos Requisitos — 30/10/2026

**Projeto:** Sistema de Gestão UPA 24H
**Método:** leitura do código, testes automatizados escritos antes das correções (TDD, conforme
[obra/superpowers](https://github.com/obra/superpowers)) e roteiro executado num navegador Chrome real.

## Resultado

| Verificação | Antes | Depois |
|-------------|-------|--------|
| Testes automatizados (`npm test`) | 44 | **110 — todos passando** |
| Roteiro no navegador (3 perfis, todas as telas) | — | **32/32** |

Agosto e setembro estão detalhados nos relatórios mensais. Abaixo, os itens de outubro.

## Itens de outubro

| Requisito | Antes | Ação |
|-----------|-------|------|
| Tela de Agendamentos (lista, filtros, indicadores) | ✅ | — |
| `/agendamentos` solicitar/alterar/confirmar/cancelar com horário disponível | ⚠️ | Perfil e operador agora vêm da sessão; Cidadão só age sobre o próprio CPF; Profissional não agenda |
| RN01/RN02 (24h) e RN03 (cancelamento administrativo) | ⚠️ | Regras corretas, mas burláveis pelo corpo da requisição (`perfilSolicitante`, `tipo: ADMINISTRATIVO`). Fechado |
| Tela de Consultas com indicadores | ⚠️ | "Tempo médio de espera" calculava a média da **duração** das consultas; agora é início − chegada |
| `/consultas` vinculado à agenda do profissional | ⚠️ | Incluída checagem de conflito (mesmo médico, dia e horário → 409); IDs deixam de repetir |
| Listagem de consultas por médico/especialidade/status | ✅ | — |
| Tela de Exames com indicadores | ⚠️ | "Atrasado" era calculado contra a data fixa 07/05/2026; agora contra a data atual |
| Endpoints de solicitação/alteração de exame (CU 2 e 3) | ⚠️ | ID aleatório podia colidir → sequencial; Cidadão não solicita exames (403) |
| Histórico/listagem de exames por status e data | ⚠️ | `GET /exames` devolvia só o array (perdia `success/total`); Cidadão recebe só os próprios |
| Tela de Log com indicadores | ✅ | — |
| Auditoria detalhada + autenticação em áreas administrativas | ⚠️ | `GET /logs` era público; agora exige Administrador e registra a tentativa negada |
| Filtro de logs e testes de segurança | ✅ | Ampliados |
| Tela de Vacinação com indicadores | ❌ | Inacessível a todos os perfis e com números fixos no HTML; agora calculados |
| `/vacinacao/registrar-aplicacao` | ❌ | Criado (`js/api/vacinacao.js`) |
| Controle de estoque e alerta de baixo estoque | ❌ | Criado: baixa por dose, bloqueio com estoque zerado, entrada de estoque, alerta no mínimo |

## Correções transversais

- **XSS:** dados exibidos nas tabelas passaram a ser escapados (`Render.esc`). Verificado no navegador com um
  nome contendo `<img onerror>`.
- **Rotas mock:** casamento exato de caminho (`js/api/http.js`). Antes, `fetch('json/agendamentos.json')` era
  capturado pela rota `/agendamentos`.
- **Modo `file://`:** as cópias das telas embutidas em `app.js` (966 linhas, 18 de 22 desatualizadas) foram
  substituídas por `js/fallbacks.js`, gerado por `npm run build:fallbacks` e vigiado por teste.

## Riscos que continuam

1. Toda a "API" roda no navegador. As regras estão prontas para serem portadas, mas só valem de verdade no backend.
2. Credenciais de demonstração (`admin`, `prof123`...) estão no código.
3. Envio do e-mail do cidadão para `api.mailcheck.ai` (LGPD).
4. "Cobertura por Faixa Etária" na tela de Vacinação ainda vem do JSON estático, porque não há data de
   nascimento associada às aplicações.
