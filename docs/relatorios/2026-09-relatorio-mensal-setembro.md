# Relatório Mensal — Setembro/2026

**Projeto:** Sistema de Gestão UPA 24H — Saúde Pública Digital
**Período:** 01/09/2026 a 30/09/2026
**Consolidado em:** 30/10/2026, a partir do backlog do projeto e da validação do código-fonte.

## 1. Escopo planejado para o mês

| Bloco | Itens do backlog |
|-------|------------------|
| Autenticação | Tela de login · `POST /auth/login` com validação de credenciais · hashing de senha e token de sessão |
| Perfis e permissões | Perfis (Administrador, Profissional da Saúde, Paciente) · middleware de acesso por perfil · testes de restrição |
| Unidades de Saúde | Tela com indicadores (total, ativas, capacidade, tipos) · `POST /unidades/cadastrar` e listagem paginada · validação dos campos |
| Dashboard | Indicadores gerais (agendamentos do dia, exames pendentes, taxa de comparecimento) · card de alertas e mini calendário · endpoint agregador |

## 2. Situação encontrada e ações (validação de 30/10/2026)

### Autenticação

| Item | Situação | O que foi feito |
|------|----------|-----------------|
| Tela de login | ✅ Atende | — |
| `/auth/login` | ⚠️ Corrigido | Aceitava como login o **primeiro nome** ou o **nome do perfil** ("Administrador" entrava no primeiro admin da base). Agora só CPF ou e-mail. Incluído bloqueio de 15 min após 5 senhas erradas (HTTP 429), registrado na auditoria. |
| Hash e token | ⚠️ Corrigido | PBKDF2-SHA256 (100 mil iterações) e token de 256 bits já existiam. Removido um bloco de "recuperação" que aceitaria a senha de demonstração para **qualquer** conta de Administrador. |

### Perfis e permissões

| Item | Situação | O que foi feito |
|------|----------|-----------------|
| Perfis | ⚠️ Corrigido | A tela de **Vacinação não estava liberada para nenhum perfil**. Agora: Administrador e Profissional da Saúde. |
| Middleware | ⚠️ Corrigido | As rotas de agendamentos, consultas, exames e logs **confiavam no perfil enviado no corpo da requisição** (um Cidadão podia se declarar Administrador e burlar a RN01). Agora o perfil vem sempre do token de sessão; ação desconhecida é negada. |
| Testes de restrição | ✅ Ampliado | De 12 para 34 testes de usuários, autenticação e autorização, mais 32 verificações automatizadas no navegador. |

### Unidades de Saúde

| Item | Situação | O que foi feito |
|------|----------|-----------------|
| Tela com indicadores | ⚠️ Corrigido | "Capacidade total" era o texto fixo `12.5k`; não havia indicador de tipos. Agora os quatro cards são calculados. |
| `/unidades/cadastrar` + listagem paginada | ❌ → ✅ Criado | Não existia. Novo módulo `js/api/unidades.js` e botão "Nova Unidade" (só Administrador). |
| Validação dos campos | ❌ → ✅ Criado | Nome (único), endereço, telefone com DDD, tipo (Hospital/UPA/UBS/AME) e capacidade inteira. 13 testes. |

### Dashboard

| Item | Situação | O que foi feito |
|------|----------|-----------------|
| Indicadores gerais | ⚠️ Corrigido | "Consultas agendadas" contava **todos** os agendamentos, não os do dia; a taxa de comparecimento era confirmados ÷ total; "Total de cidadãos" ignorava o perfil Paciente. |
| Alertas e mini calendário | ⚠️ Corrigido | Calendário funcionava; o card de alertas **tinha sido removido**. Recriado com alertas reais (estoque de vacinas, exames atrasados, unidades fora de operação ou lotadas, contas bloqueadas). |
| Endpoint agregador | ❌ → ✅ Criado | `GET /dashboard/indicadores` (`js/api/dashboard.js`). |

## 3. Definições adotadas

- **Unidade ativa:** status Operacional. Só unidades ativas somam capacidade.
- **Agendamentos do dia:** agendamentos com data de hoje, exceto os cancelados.
- **Taxa de comparecimento:** consultas em que o paciente compareceu (Aguardando, Em Andamento, Concluída)
  ÷ (essas + "Não Compareceu"). Sem base de cálculo, o card mostra "—" em vez de um número inventado.

## 4. Pendências

- A senha de demonstração do Administrador (`admin`) precisa ser trocada antes de qualquer uso real.
- A proteção contra força bruta guarda as tentativas no navegador; no backend ela deve ser feita no servidor.
