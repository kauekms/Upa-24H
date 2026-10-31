# Relatório Mensal — Agosto/2026

**Projeto:** Sistema de Gestão UPA 24H — Saúde Pública Digital
**Período:** 01/08/2026 a 31/08/2026
**Consolidado em:** 30/10/2026, a partir do backlog do projeto e da validação do código-fonte.

## 1. Escopo planejado para o mês

| # | Item do backlog |
|---|-----------------|
| 1 | Tela de cadastro de usuários (Paciente, Profissional da Saúde, Administrador) |
| 2 | Endpoint `POST /usuarios/cadastrar` |
| 3 | Validação de CPF (formato e unicidade) |
| 4 | Validação de obrigatoriedade dos campos por perfil de usuário |

## 2. Entregas

- **Tela de cadastro** (`cadastro-usuarios.html`): formulário com seleção de perfil que exibe e torna obrigatórios
  apenas os campos daquele perfil; máscaras de CPF e Cartão SUS; validação em tempo real de CPF e e-mail
  (formato e disponibilidade) e lista pesquisável dos usuários cadastrados.
- **Endpoint `POST /usuarios/cadastrar`** (`js/api/usuarios.js`): contrato `{ success, message, user }` (200) /
  `{ success, error }` (400), consumido pela tela via `fetch`, pronto para ser trocado pelo backend real.
- **Validação de CPF:** 11 dígitos, rejeição de sequências repetidas, cálculo dos dois dígitos verificadores e
  unicidade independente da máscara (`111.444.777-35` = `11144477735`).
- **Campos por perfil:**

  | Perfil | Campos obrigatórios além de nome, CPF, e-mail e senha |
  |--------|------------------------------------------------------|
  | Paciente / Cidadão | Cartão SUS (15 dígitos), data de nascimento |
  | Profissional da Saúde | Registro profissional (CRM/COREN), especialidade, unidade |
  | Administrador | Setor/departamento, cargo |
  | Recepção | Unidade de saúde |

- **Decisões de negócio registradas** (`js/config/permissoes.js`): perfis e telas de cada um (16/08) e
  liberação do login web do Cidadão com visão restrita aos próprios dados (21/08).

## 3. Validação (30/10/2026)

| Item | Situação | Evidência |
|------|----------|-----------|
| Tela de cadastro | ✅ Atende | Teste de navegador: tela abre para o Administrador |
| `/usuarios/cadastrar` | ⚠️ Corrigido | A rota **não exigia autenticação**: qualquer visitante podia criar um Administrador. Passou a exigir token de Administrador (401/403). |
| Validação de CPF | ✅ Atende | 3 testes automatizados (formato, DV, unicidade sem máscara) |
| Campos por perfil | ✅ Atende | 5 testes automatizados (um por perfil + perfil inválido) |

Correções adicionais na tela: os dados dos usuários exibidos na lista passaram a ser escapados (proteção contra
XSS) e a senha é sempre gravada com hash PBKDF2-SHA256, nunca devolvida na resposta.

## 4. Pendências e riscos

- A tela consulta `api.mailcheck.ai` para checar o domínio do e-mail. Isso envia o e-mail do cidadão a um
  serviço de terceiros; avaliar consentimento à luz da LGPD ou mover a checagem para o backend.
- Todas as regras ainda rodam no navegador (dados em `localStorage`). O backend real precisa replicar o mesmo
  contrato e as mesmas validações.
