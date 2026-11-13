-- ============================================================================
-- UPA 24H — Dados iniciais (cadastros base e contas de demonstração)
-- Execute depois de 01_estrutura.sql.
-- Os registros de atendimento (agendamentos, exames, vacinação...) são
-- gravados pela própria aplicação a partir do primeiro acesso.
-- ============================================================================
USE upa24h;

INSERT INTO perfis (id, nome, descricao) VALUES
  (1, 'Administrador',         'Acesso total ao sistema (uso de testes e gestão)'),
  (2, 'Profissional da Saúde', 'Atende, emite laudos e registra vacinação'),
  (3, 'Recepção',              'Agenda, altera e cancela atendimentos; registra vacinação'),
  (4, 'Cidadão',               'Autoatendimento: consulta e responde aos próprios agendamentos'),
  (5, 'Paciente',              'Mesmo acesso do Cidadão (nomenclatura legada)');

INSERT INTO unidades (id, codigo, nome, tipo, endereco, leitos, status) VALUES
  (1, 'UN-001', 'Unidade Centro', 'UPA', 'Av. Brasil, 1500 – Centro',             120, 'Operacional'),
  (2, 'UN-002', 'Unidade Julia',  'UPA', 'Rua das Palmeiras, 45 – Jardim Julia',   80, 'Operacional');

INSERT INTO especialidades (id, nome) VALUES
  (1, 'Clínica Geral'), (2, 'Cardiologia'), (3, 'Ginecologia'), (4, 'Ortopedia'),
  (5, 'Dermatologia'), (6, 'Pediatria'), (7, 'Neurologia');

INSERT INTO tipos_exame (id, nome) VALUES
  (1, 'Hemograma Completo'), (2, 'Glicemia em Jejum'), (3, 'Raio-X Tórax'), (4, 'Tomografia Crânio'),
  (5, 'Ultrassom Abdominal'), (6, 'ECG'), (7, 'Urina Tipo I'), (8, 'Colesterol Total e Frações');

INSERT INTO vacinas (id, nome, estoque_minimo) VALUES
  (1, 'COVID-19 (Bivalente)', 10), (2, 'Influenza', 10), (3, 'Hepatite B', 5),
  (4, 'Febre Amarela', 5), (5, 'Meningite ACWY', 5);

-- Contas de demonstração (ver README: NÃO devem ir para uma publicação efetiva).
-- Senhas: admin / prof123 / paciente123 / recep123, guardadas como hash PBKDF2-SHA256.
INSERT INTO usuarios (id, codigo, nome, cpf, email, telefone, senha_hash, perfil_id, unidade_id, cargo, dados) VALUES
  (1, 'adm-seed-001',   'teste',                     '111.444.777-35', 'teste@saude.gov.br',         '(11) 98765-4321',
      'pbkdf2:100000:C8l27sh5c+Xjynv6n5v/9g==:j2ey+mEmCLdPqjkcj7kApWLW1Npb/3c0feygo+ToWGM=', 1, 1, 'Administrador Geral',
      '{"setor":"Tecnologia da Informação","iniciais":"TE"}'),
  (2, 'prof-seed-001',  'Dr. Carlos Eduardo Mendes', '222.555.888-46', 'carlos.mendes@saude.gov.br', '(11) 98888-1234',
      'pbkdf2:100000:a9AUNxX+ICO1sXYD69YsGg==:4W23O0w5q09w/r7isflcHWraIwnJBA6QCs4i0j8wuIo=', 2, 1, 'Médico Clínico',
      '{"registro":"CRM/SP 123456","especialidade":"Clínica Geral","iniciais":"CM"}'),
  (3, 'pac-seed-001',   'Maria da Silva Santos',     '333.666.999-57', 'maria.santos@email.com',     '(11) 97777-5678',
      'pbkdf2:100000:KjhiqFBqEnat9JopjKHEyg==:JM1X7qegqWMlnuE4ySqBL2xPf7I1P/QbM/IYNQTIQxI=', 5, NULL, NULL,
      '{"sus":"123456789012345","rg":"12.345.678-9","nascimento":"1988-04-12","iniciais":"MS"}'),
  (4, 'recep-seed-001', 'Mariana Costa Souza',       '444.777.000-83', 'recepcao@saude.gov.br',      '(11) 96666-4321',
      'pbkdf2:100000:F7ZjBZLs5kZrmNecKTg15w==:5LRBkCH7loF7vp76VxodkaCZR+nvDTBYNbqrRmdyZvE=', 3, 1, 'Recepcionista',
      '{"iniciais":"MC"}');

INSERT INTO profissionais (id, nome, tipo, registro, especialidade_id, usuario_id) VALUES
  (1,  'Dr. Manoel Joaquim',        'Médico',     NULL,            1, NULL),
  (2,  'Dr. Arnaldo Luiz',          'Médico',     NULL,            2, NULL),
  (3,  'Dra. Heloísa Rocha',        'Médico',     NULL,            3, NULL),
  (4,  'Dr. Carlos Mendes',         'Médico',     NULL,            4, NULL),
  (5,  'Dra. Patrícia Souza',       'Médico',     NULL,            5, NULL),
  (6,  'Dr. Paulo Ribeiro',         'Médico',     NULL,            7, NULL),
  (7,  'Dra. Camila Torres',        'Médico',     NULL,            6, NULL),
  (8,  'Dr. Carlos Eduardo Mendes', 'Médico',     'CRM/SP 123456', 1, 2),
  (9,  'Enf. Cláudia',              'Enfermagem', NULL,            NULL, NULL),
  (10, 'Enf. Rodrigo',              'Enfermagem', NULL,            NULL, NULL),
  (11, 'Enf. Marcos',               'Enfermagem', NULL,            NULL, NULL),
  (12, 'Enf. Juliana',              'Enfermagem', NULL,            NULL, NULL);

-- N:N profissionais x unidades (vários profissionais atendem nas duas unidades)
INSERT INTO profissional_unidade (profissional_id, unidade_id) VALUES
  (1, 1), (1, 2), (2, 1), (2, 2), (3, 2), (4, 1), (4, 2), (5, 2), (6, 1),
  (7, 2), (8, 1), (9, 1), (10, 2), (11, 1), (11, 2), (12, 2);

INSERT INTO cidadaos (id, nome, cpf, data_nascimento, telefone, usuario_id) VALUES
  (1, 'Maria da Silva Santos', '333.666.999-57', '1988-04-12', '(11) 97777-5678', 3);
