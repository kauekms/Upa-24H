# Validação dos Requisitos do Sistema UPA 24H — Plano de Implementação

> Metodologia: [obra/superpowers](https://github.com/obra/superpowers) — `writing-plans`,
> `test-driven-development` (RED → GREEN → REFACTOR) e `verification-before-completion`.

**Objetivo:** validar, um a um, os requisitos do backlog (agosto → outubro/2026), corrigir o que
está incorreto, criar o que não existe e cobrir tudo com testes automatizados (`npm test`).

**Arquitetura:** front-end estático (HTML/CSS/JS puro). Cada módulo de `js/api/*.js` simula uma
rota HTTP (interceptando `fetch`) e expõe as mesmas regras como funções puras — o contrato que a
VPS/backend real deverá espelhar.

**Stack:** JavaScript (ES2020, sem build), `node:test` (Node 24) para testes.

## Restrições globais

- Nenhuma dependência nova (o projeto não tem `node_modules`).
- Toda rota mock que altera dados deve derivar o perfil do **token de sessão**, nunca do corpo da requisição.
- Toda ação relevante gera registro no `AuditoriaService` (usuário, ação, data/hora).
- Textos e mensagens em pt-BR.

## Matriz de validação (estado encontrado em 30/10/2026)

| # | Requisito | Encontrado | Ação |
|---|-----------|------------|------|
| 1 | Tela de cadastro (Paciente/Profissional/Admin) | Existe | Melhorar (XSS, e-mail enviado a terceiro) |
| 2 | Endpoint `/usuarios/cadastrar` | Existe, **sem controle de acesso** | Exigir token de Administrador |
| 3 | Validação de CPF (formato + unicidade) | Existe, sem testes | Cobrir com testes |
| 4 | Obrigatoriedade por perfil | Existe, sem testes | Cobrir com testes |
| 5 | Relatório mensal agosto | Não existe | Criar em `docs/relatorios/` |
| 6 | Tela de login | Existe | — |
| 7 | `/auth/login` com validação | Existe; login aceita "primeiro nome"/"perfil" | Remover identificadores ambíguos; bloqueio por tentativas |
| 8 | Hash de senha + token | PBKDF2 + token 256 bits | Remover bloco de "recuperação" que aceitaria a senha seed de qualquer admin |
| 9 | Perfis e permissões | Existe; **Vacinação inacessível a todos** | Incluir `vacinacao` na matriz |
| 10 | Middleware por perfil | Parcial (só no front) | Aplicar nas rotas mock |
| 11 | Testes de restrição por perfil | Existem | Ampliar |
| 12 | Tela de Unidades com indicadores | Capacidade fixa "12.5k", sem "tipos" | Indicadores calculados |
| 13 | `/unidades/cadastrar` + listagem paginada | **Não existe** | Criar `js/api/unidades.js` |
| 14 | Validação de campos da unidade | **Não existe** | Criar |
| 15 | Dashboard com indicadores | "Agendamentos do dia" conta todos; comparecimento = confirmados | Corrigir cálculo |
| 16 | Card de alertas + mini calendário | Calendário OK; **alertas removidos** | Recriar alertas a partir dos dados |
| 17 | Endpoint agregador do dashboard | **Não existe** | Criar `js/api/dashboard.js` |
| 18 | Relatório mensal setembro | Não existe | Criar |
| 19–21 | Agendamentos + RN01/RN02/RN03 | Existe; perfil vem do corpo (burlável) | Perfil vem da sessão |
| 22–24 | Consultas | Tempo médio de espera não mede espera; sem conflito de agenda | Corrigir |
| 25–27 | Exames | Existe; ID aleatório pode colidir | ID sequencial |
| 28–30 | Logs/auditoria | Existe; `GET /logs` sem autenticação | Exigir Administrador |
| 31 | Tela de Vacinação com indicadores | Números fixos no HTML | Calcular a partir dos dados |
| 32 | `/vacinacao/registrar-aplicacao` | **Não existe** (só altera array local, data fixa "07/05 14:45") | Criar `js/api/vacinacao.js` |
| 33 | Controle de estoque + alerta de baixo estoque | **Não existe** | Criar |
| — | Cópias embutidas em `app.js` (modo `file://`) | 18 de 22 desatualizadas | Gerar `js/fallbacks.js` por script + teste de sincronia |

## Tarefas (cada uma: teste falhando → código mínimo → suíte verde)

1. **Usuários:** testes de CPF/unicidade/perfil; `/usuarios/cadastrar` exige Administrador.
2. **Auth:** remover recuperação insegura e identificadores ambíguos; bloqueio após 5 falhas (15 min).
3. **Rotas mock:** perfil derivado da sessão em agendamentos/consultas/exames; `GET /logs` só Admin.
4. **Unidades:** `UnidadesAPI` (cadastrar, listar paginado, indicadores, status) + tela.
5. **Vacinação:** `VacinacaoAPI` (registrar aplicação, estoque, alertas, indicadores) + tela + permissão.
6. **Dashboard:** `DashboardAPI` agregador + card de alertas.
7. **Consultas:** tempo médio de espera real (chegada → início) e conflito na agenda do profissional.
8. **Exames:** ID sequencial.
9. **Fallbacks:** `scripts/gerar-fallbacks.js` → `js/fallbacks.js` + teste de sincronia.
10. **XSS:** escapar dados nas tabelas de `render.js`.
11. **Relatórios mensais** de agosto e setembro.

## Foco de revisão

- Tokens: rota sem `Authorization` deve cair no token da sessão local do navegador (comportamento atual).
- Dados antigos no `localStorage` (unidades/vacinas no formato antigo) não podem quebrar a tela.
- Fuso horário: datas `dd/mm/aaaa` comparadas sempre no horário local.
