# UPA 24H — Saúde Pública Digital

Sistema web para gestão de agendamentos, consultas, exames, vacinação e unidades
de saúde, com controle de acesso por perfil, trilha de auditoria e relatórios
gerenciais.

- **Front-end:** HTML, CSS e JavaScript puro (sem framework).
- **Back-end:** PHP 8 orientado a objetos, com PDO.
- **Banco de dados:** MySQL/MariaDB (XAMPP), com 17 tabelas relacionais.

## Como rodar no XAMPP (com banco de dados)

1. No painel do XAMPP, ligue **Apache** e **MySQL**.
2. Crie o banco pelo phpMyAdmin (http://localhost/phpmyadmin), aba **Importar**,
   enviando nesta ordem os arquivos da pasta `database/`:
   1. `01_estrutura.sql`: cria o banco `upa24h` e as tabelas.
   2. `02_dados.sql`: perfis, unidades, catálogos e contas de demonstração.
   3. `03_dados_atendimento.sql` (opcional): agendamentos, exames e vacinação de exemplo.
3. Publique a pasta do projeto no Apache. Em um Prompt de Comando, rode:
   ```
   mklink /J C:\xampp\htdocs\upa24h "C:\caminho\da\pasta\do\projeto"
   ```
   O comando cria um atalho (junção), sem copiar arquivos. Também é possível
   copiar a pasta para `C:\xampp\htdocs\upa24h`.
4. Acesse **http://localhost/upa24h/**. O rodapé do menu lateral deve mostrar
   "Banco MySQL conectado".

A conexão usa o padrão do XAMPP (usuário `root`, sem senha) e fica em
`backend/config.php`.

## Outros comandos

| Comando | O que faz |
|---|---|
| `npm start` | Servidor local em http://localhost:8080, **sem banco** (dados só no navegador) |
| `npm test` | Testes unitários e de estrutura (Node ≥ 22) |
| `npm run test:e2e` | Teste no Chrome/Edge headless, sem banco (HTTP e `file://`) |
| `npm run test:xampp` | Teste de integração com o banco real (exige Apache e MySQL ligados) |
| `npm run build` | Regenera `js/generated/fallbacks.js`. Rode após editar `pages/`, `partials/` ou `json/` |

Sem o XAMPP, o sistema continua funcionando em "modo local": por exemplo,
abrindo o `index.html` direto do disco. Nesse modo os dados ficam só no
navegador e a tela de Relatórios fica indisponível.

## Contas de demonstração

As contas aparecem como atalhos na tela de login.

| Perfil | CPF | Senha |
|---|---|---|
| Administrador | 111.444.777-35 | admin |
| Profissional da Saúde | 222.555.888-46 | prof123 |
| Recepção | 444.777.000-83 | recep123 |
| Cidadão | 333.666.999-57 | paciente123 |

> **Atenção:** estes perfis foram criados no início do projeto apenas para
> desenvolvimento, testes e demonstração. Eles **não serão aplicados** caso o
> projeto seja submetido a uma publicação efetiva. Nesse cenário, as contas de
> demonstração, suas senhas e os atalhos da tela de login devem ser removidos,
> e os usuários reais passam a ser cadastrados pela administração do sistema.

## Normas do Estágio Supervisionado

| Norma | Como o projeto atende |
|---|---|
| Projeto orientado a objetos | Backend em PHP com classes em camadas. **Modelo:** a classe abstrata `Entidade` e 8 entidades herdeiras. **Repositório:** a classe abstrata `Repositorio` e um repositório por tabela. **Controle:** os endpoints. **Relatório:** a classe abstrata `Relatorio` e 3 relatórios. **Segurança:** sessão, senha, permissões e auditoria. |
| Banco relacional com no mínimo 6 tabelas | **17 tabelas** no MySQL (`database/01_estrutura.sql`), com 29 chaves estrangeiras |
| No mínimo 1 relacionamento N:N e 1 relacionamento 1:N | **N:N:** `profissional_unidade` (profissionais × unidades) e `campanha_unidade` (campanhas × unidades). **1:N:** perfis → usuários, cidadãos → agendamentos e exames, vacinas → lotes, lotes → aplicações, entre outros |
| Autenticação e controle de perfil | Login validado no MySQL (senha com hash PBKDF2-SHA256) e sessão no servidor. As permissões por perfil são conferidas **no servidor** (`ControleAcesso`) e na interface (`js/config/permissoes.js`). Logins, falhas e acessos negados são gravados em `logs_auditoria` |
| No mínimo 3 relatórios, 1 com junção de tabelas no formato mestre-detalhe | Tela **Relatórios**: (1) Ficha do cidadão, **mestre-detalhe**; (2) Agendamentos por período, com junção e totais; (3) Estoque de vacinas por lote, **mestre-detalhe**. Todos podem ser impressos ou salvos em PDF |

O modelo completo, com o diagrama entidade-relacionamento, está em
[docs/banco-de-dados.md](docs/banco-de-dados.md).

## Regras por perfil

| Ação | Administrador (testes) | Recepção | Profissional da Saúde | Cidadão |
|---|---|---|---|---|
| Criar / alterar / cancelar agendamento | ✔ | ✔ | — | — |
| Aceitar / recusar o próprio agendamento | — | — | — | ✔ |
| Emitir laudo de exame | ✔ | — | ✔ | — |
| Acessar Vacinação e registrar aplicação | ✔ | ✔ | ✔ | — |
| Entrada de lote / estoque mínimo de vacinas | ✔ | — | — | — |
| Relatórios gerenciais | ✔ | ✔ | ✔ | — |
| Logs de sistema e cadastro de usuários | ✔ | — | — | — |

O Cidadão recebe do servidor apenas os próprios dados. Ele não pode alterar o
próprio perfil nem gravar dados de outras pessoas.

Unidades oficiais: **Unidade Centro** e **Unidade Julia**.

## Estrutura

```
index.html              Página única da aplicação
backend/                API em PHP orientado a objetos (roda no Apache do XAMPP)
  api.php               Ponto de entrada da API (login, sincronização, relatórios)
  relatorio.php         Documento do relatório para imprimir ou salvar em PDF
  config.php            Conexão com o MySQL
  src/Core/             Conexão PDO, requisição, resposta e roteador
  src/Seguranca/        Sessão, hash de senha, permissões por perfil e auditoria
  src/Modelo/           Entidades: mapeamento objeto ↔ tabela
  src/Repositorio/      Acesso ao banco (SELECT com JOIN e gravação) por tabela
  src/Controle/         Controladores dos endpoints
  src/Relatorio/        Os 3 relatórios gerenciais
database/               Scripts SQL (estrutura, dados iniciais e de exemplo)
assets/, css/, pages/, partials/, json/   Interface
js/
  config/               Permissões por perfil e catálogos
  core/utils.js         Escape de HTML, datas, CPF, CSV, download
  api/                  Regras de negócio no navegador
  api/persistencia.js   Ligação com o backend e o MySQL
  ui/                   Renderização, login, modais e tela de relatórios
  app.js                Núcleo: sessão, navegação, busca, modal, toasts
  generated/            Arquivos gerados (não editar à mão)
scripts/                Servidor local e gerador de fallbacks
tests/                  Unitários, E2E sem banco e integração com o XAMPP
docs/                   Relatórios mensais e documentação do banco
```

## Observações

- Os perfis de demonstração deixados no início do projeto (tabela acima) não
  fazem parte de uma publicação efetiva e não devem ser levados para produção.
- Em uma publicação efetiva, crie no MySQL um usuário próprio para o sistema
  (não use o `root` sem senha) e atualize `backend/config.php`.
- `npm run test:xampp` grava no banco alguns agendamentos de teste. Para voltar
  ao estado inicial, importe de novo os scripts da pasta `database/`.
