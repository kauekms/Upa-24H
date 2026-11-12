# UPA 24H — Saúde Pública Digital

Sistema web (HTML/CSS/JS puro, sem framework) para gestão de agendamentos,
consultas, exames, vacinação e unidades de saúde, com controle de acesso por
perfil e trilha de auditoria. Hoje os dados ficam no navegador (`localStorage`),
por meio de APIs simuladas que seguem o contrato de um backend REST.

## Como rodar

| Comando | O que faz |
|---|---|
| `npm start` | Servidor local em http://localhost:8080 |
| `npm test` | Testes unitários (Node ≥ 22) |
| `npm run test:e2e` | Teste de fumaça num Chrome/Edge headless (HTTP e `file://`) |
| `npm run build` | Regenera `js/generated/fallbacks.js` — rode após editar `pages/`, `partials/` ou `json/` |

Também é possível abrir o `index.html` direto do disco. Nesse caso as telas vêm
de `js/generated/fallbacks.js`.

Contas de demonstração (aparecem como atalhos na tela de login):

| Perfil | CPF | Senha |
|---|---|---|
| Administrador | 111.444.777-35 | admin |
| Profissional da Saúde | 222.555.888-46 | prof123 |
| Recepção | 444.777.000-83 | recep123 |
| Cidadão | 333.666.999-57 | paciente123 |

> **Atenção:** estes perfis foram criados no início do projeto apenas para
> desenvolvimento, testes e demonstração. Eles **não serão aplicados** caso o
> projeto seja submetido a uma publicação efetiva: nesse cenário, as contas de
> demonstração, suas senhas e os atalhos da tela de login devem ser removidos,
> e os usuários reais passam a ser cadastrados pela administração do sistema.

## Regras por perfil

| Ação | Administrador (testes) | Recepção | Profissional da Saúde | Cidadão |
|---|---|---|---|---|
| Criar / alterar / cancelar agendamento | ✔ | ✔ | — | — |
| Aceitar / recusar o próprio agendamento | — | — | — | ✔ |
| Emitir laudo de exame | ✔ | — | ✔ | — |
| Acessar Vacinação e registrar aplicação | ✔ | ✔ | ✔ | — |
| Entrada de lote no estoque de vacinas | ✔ | — | — | — |

Unidades oficiais: **Unidade Centro** e **Unidade Julia** (`js/config/unidades.js`).
Registros salvos com nomes antigos são convertidos automaticamente.

## Estrutura

```
index.html              Página única da aplicação
assets/                 Imagens (logo oficial)
css/
  tokens.css            Cores, tipografia, raios e sombras (identidade visual)
  base.css, layout.css, components.css
  pages/                Estilos específicos de cada tela
pages/                  HTML de cada tela (carregado sob demanda)
partials/               Cabeçalho e menu lateral
json/                   Navegação e textos/dados de cada tela
js/
  config/               Permissões por perfil e catálogos (médicos, unidades…)
  core/utils.js         Escape de HTML, datas, CPF, CSV, download
  api/                  APIs simuladas (fonte única dos dados)
  ui/                   Renderização, login e modais por domínio
  app.js                Núcleo: sessão, navegação, busca, modal, toasts
  generated/            Arquivos gerados — não editar à mão
scripts/                Servidor local e gerador de fallbacks
tests/                  Testes unitários, E2E (tests/e2e) e suíte de navegador (tests/navegador)
```

## Observações

- Os perfis de demonstração deixados no início do projeto (tabela acima) não
  fazem parte de uma publicação efetiva e não devem ser levados para produção.
- As regras de acesso (`js/config/permissoes.js`) são aplicadas apenas no
  navegador. Ao migrar para um servidor, elas precisam ser validadas também
  no backend.
- A suíte em `tests/navegador/testes.html` usa o mesmo `localStorage` do
  sistema e apaga os logs de auditoria ao rodar.
