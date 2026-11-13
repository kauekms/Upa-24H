-- ============================================================================
-- UPA 24H — Estrutura do banco de dados (MySQL / MariaDB do XAMPP)
-- ============================================================================
-- Como usar: no phpMyAdmin, aba "Importar", envie este arquivo e depois o
-- 02_dados.sql. Ou pelo terminal:
--   mysql -u root < database/01_estrutura.sql
--   mysql -u root upa24h < database/02_dados.sql
--
-- Resumo do modelo (17 tabelas):
--   Cadastros base ....: perfis, unidades, especialidades, tipos_exame, vacinas
--   Pessoas ...........: usuarios, profissionais, cidadaos
--   Atendimento .......: agendamentos, consultas, exames
--   Vacinação .........: campanhas, lotes, aplicacoes_vacina
--   Auditoria .........: logs_auditoria
--   Associativas (N:N) : profissional_unidade, campanha_unidade
--
-- Relacionamentos N:N
--   profissionais  N:N unidades   (tabela profissional_unidade)
--   campanhas      N:N unidades   (tabela campanha_unidade)
-- Relacionamentos 1:N (exemplos)
--   perfis 1:N usuarios · unidades 1:N agendamentos · cidadaos 1:N agendamentos
--   cidadaos 1:N exames · vacinas 1:N lotes · lotes 1:N aplicacoes_vacina
--   especialidades 1:N profissionais · usuarios 1:N logs_auditoria
--
-- A coluna "dados" (LONGTEXT com JSON) guarda campos complementares exibidos
-- pela interface (ex.: classe de cor do status). Os dados que participam de
-- relacionamentos, filtros e relatórios ficam sempre em colunas próprias.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS upa24h
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE upa24h;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS logs_auditoria, aplicacoes_vacina, lotes, campanha_unidade, campanhas,
  vacinas, exames, tipos_exame, consultas, agendamentos, cidadaos, profissional_unidade,
  profissionais, usuarios, especialidades, unidades, perfis;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- Cadastros base
-- ---------------------------------------------------------------------------
CREATE TABLE perfis (
  id         TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome       VARCHAR(40)  NOT NULL,
  descricao  VARCHAR(150) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_perfis_nome (nome)
) ENGINE=InnoDB COMMENT='Perfis de acesso (controle de permissões)';

CREATE TABLE unidades (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo      VARCHAR(20)  NOT NULL,
  nome        VARCHAR(100) NOT NULL,
  tipo        VARCHAR(20)  NOT NULL DEFAULT 'UPA',
  endereco    VARCHAR(200) NULL,
  leitos      SMALLINT UNSIGNED NULL,
  status      VARCHAR(30)  NOT NULL DEFAULT 'Operacional',
  PRIMARY KEY (id),
  UNIQUE KEY uk_unidades_codigo (codigo),
  UNIQUE KEY uk_unidades_nome (nome)
) ENGINE=InnoDB COMMENT='Unidades de saúde';

CREATE TABLE especialidades (
  id    SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome  VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_especialidades_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE tipos_exame (
  id    SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome  VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tipos_exame_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE vacinas (
  id              SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome            VARCHAR(80) NOT NULL,
  estoque_minimo  INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Mínimo por lote para gerar alerta',
  PRIMARY KEY (id),
  UNIQUE KEY uk_vacinas_nome (nome)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Pessoas
-- ---------------------------------------------------------------------------
CREATE TABLE usuarios (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo         VARCHAR(40)  NOT NULL COMMENT 'Identificador usado pela aplicação',
  nome           VARCHAR(120) NOT NULL,
  cpf            VARCHAR(14)  NOT NULL,
  email          VARCHAR(120) NULL,
  telefone       VARCHAR(20)  NULL,
  senha_hash     VARCHAR(255) NOT NULL COMMENT 'PBKDF2-SHA256 (nunca a senha em texto)',
  perfil_id      TINYINT UNSIGNED NOT NULL,
  unidade_id     INT UNSIGNED NULL,
  cargo          VARCHAR(80)  NULL,
  status         VARCHAR(20)  NOT NULL DEFAULT 'Ativo',
  dados          LONGTEXT     NULL,
  criado_em      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_codigo (codigo),
  UNIQUE KEY uk_usuarios_cpf (cpf),
  KEY idx_usuarios_email (email),
  CONSTRAINT fk_usuarios_perfil  FOREIGN KEY (perfil_id)  REFERENCES perfis (id),
  CONSTRAINT fk_usuarios_unidade FOREIGN KEY (unidade_id) REFERENCES unidades (id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Contas de acesso ao sistema';

CREATE TABLE profissionais (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome              VARCHAR(120) NOT NULL,
  tipo              VARCHAR(30)  NOT NULL DEFAULT 'Médico',
  registro          VARCHAR(40)  NULL COMMENT 'CRM / COREN',
  especialidade_id  SMALLINT UNSIGNED NULL,
  usuario_id        INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_profissionais_nome (nome),
  UNIQUE KEY uk_profissionais_usuario (usuario_id),
  CONSTRAINT fk_profissionais_especialidade FOREIGN KEY (especialidade_id) REFERENCES especialidades (id) ON DELETE SET NULL,
  CONSTRAINT fk_profissionais_usuario       FOREIGN KEY (usuario_id)       REFERENCES usuarios (id)       ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Médicos e equipe de enfermagem';

-- N:N — um profissional atende em várias unidades e cada unidade tem vários profissionais
CREATE TABLE profissional_unidade (
  profissional_id  INT UNSIGNED NOT NULL,
  unidade_id       INT UNSIGNED NOT NULL,
  PRIMARY KEY (profissional_id, unidade_id),
  CONSTRAINT fk_pu_profissional FOREIGN KEY (profissional_id) REFERENCES profissionais (id) ON DELETE CASCADE,
  CONSTRAINT fk_pu_unidade      FOREIGN KEY (unidade_id)      REFERENCES unidades (id)      ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Associativa N:N profissionais x unidades';

CREATE TABLE cidadaos (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome             VARCHAR(120) NOT NULL,
  cpf              VARCHAR(14)  NULL,
  data_nascimento  DATE         NULL,
  telefone         VARCHAR(20)  NULL,
  usuario_id       INT UNSIGNED NULL COMMENT 'Conta de autoatendimento, se houver',
  PRIMARY KEY (id),
  UNIQUE KEY uk_cidadaos_cpf (cpf),
  UNIQUE KEY uk_cidadaos_usuario (usuario_id),
  KEY idx_cidadaos_nome (nome),
  CONSTRAINT fk_cidadaos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Pacientes atendidos';

-- ---------------------------------------------------------------------------
-- Atendimento
-- ---------------------------------------------------------------------------
CREATE TABLE agendamentos (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo            VARCHAR(20)  NOT NULL,
  cidadao_id        INT UNSIGNED NOT NULL,
  profissional_id   INT UNSIGNED NULL,
  especialidade_id  SMALLINT UNSIGNED NULL,
  unidade_id        INT UNSIGNED NULL,
  data              DATE         NULL,
  horario           TIME         NULL,
  status            VARCHAR(30)  NOT NULL DEFAULT 'Pendente',
  dados             LONGTEXT     NULL,
  criado_em         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_agendamentos_codigo (codigo),
  KEY idx_agendamentos_data (data, horario),
  KEY idx_agendamentos_status (status),
  CONSTRAINT fk_agend_cidadao       FOREIGN KEY (cidadao_id)       REFERENCES cidadaos (id),
  CONSTRAINT fk_agend_profissional  FOREIGN KEY (profissional_id)  REFERENCES profissionais (id)  ON DELETE SET NULL,
  CONSTRAINT fk_agend_especialidade FOREIGN KEY (especialidade_id) REFERENCES especialidades (id) ON DELETE SET NULL,
  CONSTRAINT fk_agend_unidade       FOREIGN KEY (unidade_id)       REFERENCES unidades (id)       ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE consultas (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo            VARCHAR(20)  NOT NULL,
  cidadao_id        INT UNSIGNED NOT NULL,
  profissional_id   INT UNSIGNED NULL,
  especialidade_id  SMALLINT UNSIGNED NULL,
  data              DATE         NULL,
  inicio            TIME         NULL,
  status            VARCHAR(30)  NOT NULL,
  cid               VARCHAR(10)  NULL COMMENT 'CID-10',
  dados             LONGTEXT     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_consultas_codigo (codigo),
  KEY idx_consultas_data (data),
  CONSTRAINT fk_cons_cidadao       FOREIGN KEY (cidadao_id)       REFERENCES cidadaos (id),
  CONSTRAINT fk_cons_profissional  FOREIGN KEY (profissional_id)  REFERENCES profissionais (id)  ON DELETE SET NULL,
  CONSTRAINT fk_cons_especialidade FOREIGN KEY (especialidade_id) REFERENCES especialidades (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE exames (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo           VARCHAR(20)  NOT NULL,
  cidadao_id       INT UNSIGNED NOT NULL,
  tipo_exame_id    SMALLINT UNSIGNED NOT NULL,
  unidade_id       INT UNSIGNED NULL,
  solicitante_id   INT UNSIGNED NULL,
  data             DATE         NULL,
  horario          TIME         NULL,
  data_prevista    DATE         NULL,
  prioridade       VARCHAR(20)  NOT NULL DEFAULT 'Normal',
  status           VARCHAR(30)  NOT NULL,
  laudo            TEXT         NULL,
  dados            LONGTEXT     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_exames_codigo (codigo),
  KEY idx_exames_status (status),
  CONSTRAINT fk_exames_cidadao     FOREIGN KEY (cidadao_id)     REFERENCES cidadaos (id),
  CONSTRAINT fk_exames_tipo        FOREIGN KEY (tipo_exame_id)  REFERENCES tipos_exame (id),
  CONSTRAINT fk_exames_unidade     FOREIGN KEY (unidade_id)     REFERENCES unidades (id)      ON DELETE SET NULL,
  CONSTRAINT fk_exames_solicitante FOREIGN KEY (solicitante_id) REFERENCES profissionais (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Vacinação
-- ---------------------------------------------------------------------------
CREATE TABLE campanhas (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo        VARCHAR(20)  NOT NULL,
  nome          VARCHAR(120) NOT NULL,
  vacina_id     SMALLINT UNSIGNED NOT NULL,
  publico_alvo  VARCHAR(150) NULL,
  data_inicio   DATE         NULL,
  data_fim      DATE         NULL,
  meta          INT UNSIGNED NOT NULL DEFAULT 0,
  status        VARCHAR(20)  NOT NULL DEFAULT 'Ativa',
  dados         LONGTEXT     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_campanhas_codigo (codigo),
  CONSTRAINT fk_campanhas_vacina FOREIGN KEY (vacina_id) REFERENCES vacinas (id)
) ENGINE=InnoDB;

-- N:N — uma campanha ocorre em várias unidades e cada unidade participa de várias campanhas
CREATE TABLE campanha_unidade (
  campanha_id  INT UNSIGNED NOT NULL,
  unidade_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (campanha_id, unidade_id),
  CONSTRAINT fk_cu_campanha FOREIGN KEY (campanha_id) REFERENCES campanhas (id) ON DELETE CASCADE,
  CONSTRAINT fk_cu_unidade  FOREIGN KEY (unidade_id)  REFERENCES unidades (id)  ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Associativa N:N campanhas x unidades';

CREATE TABLE lotes (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo          VARCHAR(20)  NOT NULL COMMENT 'Registro de estoque (ex.: EST-001)',
  numero_lote     VARCHAR(40)  NOT NULL,
  vacina_id       SMALLINT UNSIGNED NOT NULL,
  unidade_id      INT UNSIGNED NOT NULL,
  quantidade      INT          NOT NULL DEFAULT 0,
  estoque_minimo  INT UNSIGNED NOT NULL DEFAULT 0,
  validade        DATE         NULL,
  dados           LONGTEXT     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_lotes_codigo (codigo),
  UNIQUE KEY uk_lotes_numero_unidade (numero_lote, unidade_id),
  CONSTRAINT fk_lotes_vacina  FOREIGN KEY (vacina_id)  REFERENCES vacinas (id),
  CONSTRAINT fk_lotes_unidade FOREIGN KEY (unidade_id) REFERENCES unidades (id)
) ENGINE=InnoDB COMMENT='Estoque de vacinas por lote e unidade';

CREATE TABLE aplicacoes_vacina (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo           VARCHAR(20)  NOT NULL,
  cidadao_id       INT UNSIGNED NOT NULL,
  lote_id          INT UNSIGNED NULL,
  campanha_id      INT UNSIGNED NULL,
  profissional_id  INT UNSIGNED NULL,
  unidade_id       INT UNSIGNED NULL,
  dose             VARCHAR(30)  NULL,
  data_hora        DATETIME     NULL,
  dados            LONGTEXT     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_aplicacoes_codigo (codigo),
  KEY idx_aplicacoes_data (data_hora),
  CONSTRAINT fk_apl_cidadao      FOREIGN KEY (cidadao_id)      REFERENCES cidadaos (id),
  CONSTRAINT fk_apl_lote         FOREIGN KEY (lote_id)         REFERENCES lotes (id)         ON DELETE SET NULL,
  CONSTRAINT fk_apl_campanha     FOREIGN KEY (campanha_id)     REFERENCES campanhas (id)     ON DELETE SET NULL,
  CONSTRAINT fk_apl_profissional FOREIGN KEY (profissional_id) REFERENCES profissionais (id) ON DELETE SET NULL,
  CONSTRAINT fk_apl_unidade      FOREIGN KEY (unidade_id)      REFERENCES unidades (id)      ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Auditoria
-- ---------------------------------------------------------------------------
CREATE TABLE logs_auditoria (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo      VARCHAR(40)  NOT NULL COMMENT 'Código exibido na tela (ex.: LOG-1001)',
  assinatura  CHAR(40)     NOT NULL COMMENT 'SHA-1 de código+data+ação+usuário: evita gravar o mesmo evento duas vezes',
  usuario_id  INT UNSIGNED NULL,
  usuario     VARCHAR(120) NULL COMMENT 'Nome registrado no momento da ação',
  tipo        VARCHAR(20)  NOT NULL COMMENT 'Informação, Acesso, Aviso, Erro',
  modulo      VARCHAR(40)  NULL,
  acao        VARCHAR(200) NOT NULL,
  descricao   TEXT         NULL,
  ip          VARCHAR(45)  NULL,
  data_hora   DATETIME     NOT NULL,
  dados       LONGTEXT     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_logs_assinatura (assinatura),
  KEY idx_logs_codigo (codigo),
  KEY idx_logs_data (data_hora),
  KEY idx_logs_tipo (tipo),
  CONSTRAINT fk_logs_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Trilha de auditoria (nunca é apagada pela aplicação)';
