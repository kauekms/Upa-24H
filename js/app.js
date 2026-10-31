/**
 * UPA 24H – Aplicação principal estendida com suporte a protocolo file:// e Servidor HTTP
 * Suporte completo a navegação, modais, dados dinâmicos, buscas e ações operacionais.
 */
const App = {
  currentPage: 'dashboard',
  usuario: null,
  navegacao: null,
  data: {},
  // Tema escuro e alto contraste foram removidos (a pedido): o sistema fica
  // sempre no modo claro, então "tema"/"highContrast" não existem mais aqui.
  settings: {
    notificacoes: { email: true, push: true, estoque: true, manutencao: false }
  },

  fallbacks: {
    'partials/header.html': `<header>
  <div class="logo nav-item" data-page="dashboard" role="button" tabindex="0" style="cursor:pointer">
    <div class="logo-badge">UPA<br>24H</div>
    <div class="logo-text">
      <strong id="sistema-nome">UPA 24H</strong>
      <span id="sistema-subtitulo">Saúde Pública Digital</span>
    </div>
  </div>
  <div class="search-wrap" id="search-wrap-container">
    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    <input type="text" id="busca-global" placeholder="Buscar no sistema..." autocomplete="off">
    <div id="search-results-dropdown" class="search-results-dropdown" style="display:none"></div>
  </div>
  <div class="header-right">
    <button class="icon-btn" id="btn-header-notif" type="button" aria-label="Notificações" title="Notificações do Sistema">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <span class="notif-dot"></span>
    </button>
    <div class="divider-v"></div>
    <div class="user-menu-wrap">
      <div class="user-pill nav-item" id="user-pill" data-page="perfil" role="button" tabindex="0" title="Meu Perfil & Edição de Conta">
        <div class="avatar" id="user-avatar">DR</div>
        <div>
          <div class="uname" id="user-nome">Denilson Barrios</div>
          <div class="urole" id="user-cargo">Gestor Geral</div>
        </div>
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
      </div>
      <div id="user-dropdown-menu" class="user-dropdown-menu" style="display:none">
        <div class="user-dropdown-header">
          <strong id="dropdown-user-nome">Denilson Barrios</strong>
          <span id="dropdown-user-email">denilson.barrios@saude.gov.br</span>
        </div>
        <div class="user-dropdown-item" data-page="perfil">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Ver Perfil & Editar
        </div>
        <div class="user-dropdown-item" data-page="configuracoes">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Configurações
        </div>
        <div class="user-dropdown-divider"></div>
        <div class="user-dropdown-item" id="dropdown-btn-sair" style="color:var(--danger)">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Encerrar Sessão
        </div>
      </div>
    </div>
  </div>
</header>`,

    'partials/sidebar.html': `<aside>
  <nav id="sidebar-nav"></nav>
  <div class="sidebar-bottom">
    <div class="nav-item" data-page="configuracoes" role="button" tabindex="0">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M20 12a8 8 0 1 0-3.58 6.67"/></svg>
      Configurações
    </div>
    <div class="nav-item" id="btn-sair" role="button" tabindex="0">
      <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      Sair
    </div>
  </div>
</aside>`,

    'json/usuario.json': {
      nome: 'Denilson Barrios',
      cargo: 'Gestor Geral',
      iniciais: 'DR',
      email: 'denilson.barrios@saude.gov.br',
      unidade: 'Unidade Central',
      telefone: '(11) 98765-4321',
      sistema: { nome: 'UPA 24H', subtitulo: 'Saúde Pública Digital' }
    },

    'json/navegacao.json': {
      itens: [
        { id: 'dashboard', label: 'Dashboard', arquivo: 'dashboard.html', css: ['css/pages/dashboard.css'], json: 'json/dashboard.json' },
        { id: 'agendamentos', label: 'Agendamentos', arquivo: 'agendamentos.html', css: [], json: 'json/agendamentos.json' },
        { id: 'consultas', label: 'Consultas', arquivo: 'consultas.html', css: ['css/pages/consultas.css'], json: 'json/consultas.json' },
        { id: 'exames', label: 'Exames', arquivo: 'exames.html', css: [], json: 'json/exames.json' },
        { id: 'unidades', label: 'Unidades de Saúde', arquivo: 'unidades.html', css: ['css/pages/unidades.css'], json: 'json/unidades.json' },
        { id: 'logs', label: 'Logs de Sistema', arquivo: 'logs.html', css: ['css/pages/logs.css'], json: 'json/logs.json' },
        { id: 'cadastro-usuarios', label: 'Cadastro de Usuários', arquivo: 'cadastro-usuarios.html', css: ['css/pages/configuracoes.css'], json: 'json/usuario.json' },
        { id: 'configuracoes', label: 'Configurações', arquivo: 'configuracoes.html', css: ['css/pages/configuracoes.css'], json: 'json/configuracoes.json' },
        { id: 'perfil', label: 'Meu Perfil', arquivo: 'perfil.html', css: ['css/pages/configuracoes.css'], json: 'json/perfil.json' }
      ]
    },

    'cadastro-usuarios.html': `<div class="page active" id="page-cadastro-usuarios">
  <div class="page-hd">
    <div>
      <div class="breadcrumb">Administração › <span>Cadastro de Usuários</span></div>
      <div class="page-title">Cadastro de Usuários</div>
      <div class="page-sub">Cadastre e gerencie os perfis de Cidadãos, Recepção, Profissionais da Saúde e Administradores (TI) no sistema. Contas de Cidadão têm acesso web só aos próprios dados (Agendamentos, Consultas e Exames, em modo visualização).</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 360px;gap:20px">
    <div>
      <div class="card card-body">
        <h3 class="card-title" style="margin-bottom:16px;color:var(--text)">✏️ Formulário de Cadastro</h3>
        <form id="form-cadastro-usuario" onsubmit="return false;">
          
          <div class="config-row">
            <div class="config-field">
              <label for="cad-nome">Nome Completo</label>
              <input type="text" id="cad-nome" placeholder="Digite o nome completo" required>
            </div>
            <div class="config-field">
              <label for="cad-cpf">CPF</label>
              <input type="text" id="cad-cpf" placeholder="000.000.000-00" maxlength="14" required>
            </div>
          </div>

          <div class="config-row">
            <div class="config-field">
              <label for="cad-email">E-mail</label>
              <input type="email" id="cad-email" placeholder="nome@exemplo.com" required>
            </div>
            <div class="config-field">
              <label for="cad-senha">Senha de Acesso</label>
              <input type="password" id="cad-senha" placeholder="Digite a senha" required>
            </div>
          </div>

          <div class="config-row" style="margin-bottom:20px">
            <div class="config-field" style="grid-column: span 2">
              <label for="cad-perfil">Perfil do Usuário</label>
              <select id="cad-perfil" required>
                <option value="" disabled selected>Selecione o perfil...</option>
                <option value="Cidadão">Cidadão</option>
                <option value="Recepção">Recepção</option>
                <option value="Profissional da Saúde">Profissional da Saúde</option>
                <option value="Administrador">Administrador (TI)</option>
              </select>
            </div>
          </div>

          <!-- Campos Específicos do Cidadão -->
          <div id="fields-paciente" class="profile-fields-section" style="display:none; border-top: 1px solid var(--border); padding-top: 16px; margin-top: 16px;">
            <h4 style="font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Dados do Cidadão</h4>
            <div class="config-row">
              <div class="config-field">
                <label for="cad-rg">RG</label>
                <input type="text" id="cad-rg" placeholder="Digite o RG">
              </div>
              <div class="config-field">
                <label for="cad-sus">Cartão SUS</label>
                <input type="text" id="cad-sus" placeholder="000.0000.0000.0000" maxlength="18">
              </div>
            </div>
            <div class="config-field" style="margin-top:12px">
              <label for="cad-nascimento">Data de Nascimento</label>
              <input type="date" id="cad-nascimento">
            </div>
          </div>

          <!-- Campos Específicos da Recepção -->
          <div id="fields-recepcao" class="profile-fields-section" style="display:none; border-top: 1px solid var(--border); padding-top: 16px; margin-top: 16px;">
            <h4 style="font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Dados da Recepção</h4>
            <div class="config-field">
              <label for="cad-recep-unidade">Unidade de Saúde</label>
              <select id="cad-recep-unidade">
                <option value="" disabled selected>Selecione a unidade...</option>
                <option value="Unidade Central">Unidade Central</option>
                <option value="Unidade Oeste">Unidade Oeste</option>
                <option value="Unidade Sul">Unidade Sul</option>
                <option value="Unidade Norte">Unidade Norte</option>
                <option value="Unidade Leste">Unidade Leste</option>
              </select>
            </div>
          </div>

          <!-- Campos Específicos do Profissional de Saúde -->
          <div id="fields-profissional" class="profile-fields-section" style="display:none; border-top: 1px solid var(--border); padding-top: 16px; margin-top: 16px;">
            <h4 style="font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Dados Profissionais</h4>
            <div class="config-row">
              <div class="config-field">
                <label for="cad-registro">Registro Profissional (CRM/COREN)</label>
                <input type="text" id="cad-registro" placeholder="Ex: CRM/SP 123456">
              </div>
              <div class="config-field">
                <label for="cad-especialidade">Especialidade</label>
                <select id="cad-especialidade">
                  <option value="" disabled selected>Selecione a especialidade...</option>
                  <option value="Clínica Geral">Clínica Geral</option>
                  <option value="Cardiologia">Cardiologia</option>
                  <option value="Pediatria">Pediatria</option>
                  <option value="Ginecologia">Ginecologia</option>
                  <option value="Ortopedia">Ortopedia</option>
                  <option value="Dermatologia">Dermatologia</option>
                  <option value="Enfermagem Geral">Enfermagem Geral</option>
                </select>
              </div>
            </div>
            <div class="config-field" style="margin-top:12px">
              <label for="cad-unidade">Unidade de Saúde Atribuída</label>
              <select id="cad-unidade">
                <option value="" disabled selected>Selecione a unidade...</option>
                <option value="Unidade Central">Unidade Central</option>
                <option value="Unidade Oeste">Unidade Oeste</option>
                <option value="Unidade Sul">Unidade Sul</option>
                <option value="Unidade Norte">Unidade Norte</option>
                <option value="Unidade Leste">Unidade Leste</option>
              </select>
            </div>
          </div>

          <!-- Campos Específicos do Administrador -->
          <div id="fields-administrador" class="profile-fields-section" style="display:none; border-top: 1px solid var(--border); padding-top: 16px; margin-top: 16px;">
            <h4 style="font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Dados Administrativos</h4>
            <div class="config-row">
              <div class="config-field">
                <label for="cad-setor">Setor / Departamento</label>
                <input type="text" id="cad-setor" placeholder="Ex: Gestão Geral, TI, Recursos Humanos">
              </div>
              <div class="config-field">
                <label for="cad-cargo">Cargo / Função</label>
                <input type="text" id="cad-cargo" placeholder="Ex: Diretor Técnico, Supervisor, Analista">
              </div>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;margin-top:20px;gap:10px;border-top:1px solid var(--border);padding-top:16px">
            <button type="button" class="btn btn-outline" id="btn-limpar-cadastro">Limpar</button>
            <button type="submit" class="btn btn-primary" id="btn-salvar-usuario">Cadastrar Usuário</button>
          </div>
        </form>
      </div>
    </div>

    <div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">Usuários Cadastrados</span>
          <span class="badge b-blue" id="users-count-badge">0</span>
        </div>
        <div style="padding: 10px 20px; border-bottom: 1px solid var(--border); background: var(--bg);">
          <input type="text" id="busca-usuarios-cadastrados" placeholder="Filtrar por nome ou CPF..." style="width: 100%; padding: 6px 10px; border-radius: var(--radius-sm); border: 1.5px solid var(--border); font-size: 12px;">
        </div>
        <div style="max-height:480px; overflow-y:auto; padding: 10px 0;" id="users-list-container">
          <div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12.5px;">Nenhum usuário cadastrado.</div>
        </div>
      </div>
    </div>
  </div>
</div>`,

    'dashboard.html': `<div class="page active" id="page-dashboard">
  <div class="page-hd">
    <div>
      <div class="page-title">Visão Geral do Sistema</div>
      <div class="page-sub">Bem-vindo, Denilson Barrios. Aqui está o resumo das atividades de saúde de hoje.</div>
    </div>
  </div>
  <div class="stats-grid cols4" data-box="stats"></div>
  <div class="dashboard-grid">
    <div class="dashboard-main-col">
      <div class="card">
        <div class="card-header"><span class="card-title">Agendamentos Recentes</span><a href="#" data-nav="agendamentos" style="font-size:12.5px;font-weight:600;color:var(--primary);text-decoration:none">Ver todos →</a></div>
        <div class="tbl-wrap"><table>
          <thead><tr><th>Nome do Cidadão</th><th>Data</th><th>Horário</th><th>Unidade</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody data-box="agendamentos-tbody"></tbody>
        </table></div>
      </div>
    </div>
    <div class="dashboard-side-col">
      <div class="card calendar-card">
        <div class="calendar-hd">
          <span class="calendar-title" data-box="cal-mes">Maio 2026</span>
          <div class="calendar-nav">
            <button class="cal-nav-btn" id="cal-btn-prev" type="button" aria-label="Mês anterior">‹</button>
            <button class="cal-nav-btn" id="cal-btn-next" type="button" aria-label="Próximo mês">›</button>
          </div>
        </div>
        <div class="calendar-grid">
          <div class="cal-dow">D</div><div class="cal-dow">S</div><div class="cal-dow">T</div><div class="cal-dow">Q</div><div class="cal-dow">Q</div><div class="cal-dow">S</div><div class="cal-dow">S</div>
        </div>
        <div class="calendar-grid" data-box="cal-dias"></div>
        <div class="cal-legenda" data-box="cal-legenda"></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title" style="font-size:13.5px">Próximos Atendimentos</span></div>
        <div class="atend-list" data-box="proximos-atendimentos"></div>
        <button class="btn btn-primary btn-block" id="btn-dash-agendar" type="button">Agendar Novo Atendimento</button>
      </div>
    </div>
  </div>
</div>`,

    'json/dashboard.json': {
      layout: 'dashboard',
      titulo: 'Visão Geral do Sistema',
      subtitulo: 'Bem-vindo, {usuario}. Aqui está o resumo das atividades de saúde de hoje.',
      boxes: {
        stats: [
          { label: 'Total de Cidadãos', icon: '👥', iconClass: 'ic-blue', value: '12.482', note: '↑ +3% este mês', noteClass: 'note-green' },
          { label: 'Consultas Agendadas', icon: '📅', iconClass: 'ic-teal', value: '158', note: 'Previstas para hoje', noteClass: 'note-muted' },
          { label: 'Exames Pendentes', icon: '📋', iconClass: 'ic-orange', value: '42', note: 'Aguardando laudo', noteClass: 'note-orange' },
          { label: 'Taxa de Comparecimento', icon: '📊', iconClass: 'ic-red', value: '94.2%', bar: 94.2, barClass: 'bar-blue' }
        ],
        agendamentosRecentes: [
          { id: '#10291', nome: 'Luciana Ferreira', data: '07/05/2026', horario: '13:20', unidade: 'Dr. Manoel Joaquim dos Reis', status: 'Confirmado', badge: 'b-green' },
          { id: '#10292', nome: 'Marcos Oliveira', data: '07/05/2026', horario: '13:20', unidade: 'Dr. Manoel Joaquim dos Reis', status: 'Confirmado', badge: 'b-green' },
          { id: '#10293', nome: 'Ana Paula Costa', data: '07/05/2026', horario: '14:00', unidade: 'Dr. Manoel Joaquim dos Reis', status: 'Pendente', badge: 'b-yellow' },
          { id: '#10294', nome: 'Roberto Alves', data: '07/05/2026', horario: '14:30', unidade: 'Dr. Manoel Joaquim dos Reis', status: 'Confirmado', badge: 'b-green' },
          { id: '#10295', nome: 'Fernanda Lima', data: '07/05/2026', horario: '15:00', unidade: 'Dr. Manoel Joaquim dos Reis', status: 'Cancelado', badge: 'b-red' }
        ],
        proximosAtendimentos: [
          { periodo: 'HOJE', horario: '14:00', nome: 'Dr. Arnaldo Luiz', descricao: 'Cardiologia · Unidade Oeste' },
          { periodo: 'HOJE', horario: '15:30', nome: 'Dra. Heloísa Rocha', descricao: 'Ginecologia · Unidade Sul' },
          { periodo: 'AMANHÃ', horario: '09:00', nome: 'Lab Exames S/A', descricao: 'Hemograma Completo' }
        ]
      }
    },

    'agendamentos.html': `<div class="page active" id="page-agendamentos">
  <div class="page-hd">
    <div>
      <div class="breadcrumb">Administração › <span>Agendamentos</span></div>
      <div class="page-title">Agendamentos</div>
      <div class="page-sub">Gerencie e acompanhe todos os agendamentos do sistema com validação de horário e regras de antecedência.</div>
    </div>
    <button class="btn btn-primary" id="btn-novo-agendamento">
      <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Novo Agendamento
    </button>
  </div>
  <div class="stats-grid cols4" data-box="stats" style="margin-bottom:20px"></div>
  <div class="card">
    <div class="card-header">
      <span class="card-title">Lista de Agendamentos</span>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline btn-sm" id="btn-exportar-agendamentos">Exportar</button>
      </div>
    </div>
    <div style="padding:14px 20px;border-bottom:1px solid var(--border)">
      <div class="filters-row" style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
        <div class="filter-group">
          <label>Buscar Cidadão</label>
          <div class="search-input-wrap"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="filter-input" id="filter-agendamentos-busca" type="text" placeholder="Nome, CPF ou ID..."></div>
        </div>
        <div class="filter-group">
          <label>Status</label>
          <select class="filter-select" id="filter-agendamentos-status">
            <option value="">Todos</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Pendente">Pendente</option>
            <option value="Cancelado">Cancelado</option>
            <option value="Remarcado">Remarcado</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Unidade</label>
          <select class="filter-select" id="filter-agendamentos-unidade">
            <option value="">Todas</option>
            <option value="Unidade Central">Unidade Central</option>
            <option value="Unidade Oeste">Unidade Oeste</option>
            <option value="Unidade Sul">Unidade Sul</option>
            <option value="Unidade Norte">Unidade Norte</option>
            <option value="Unidade Leste">Unidade Leste</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Período (Início)</label>
          <input class="filter-input" id="filter-agendamentos-data-inicio" type="date" style="min-width:130px">
        </div>
        <div class="filter-group">
          <label>Período (Fim)</label>
          <input class="filter-input" id="filter-agendamentos-data-fim" type="date" style="min-width:130px">
        </div>
        <div class="filter-group">
          <label>Especialidade</label>
          <select class="filter-select" id="filter-agendamentos-especialidade">
            <option value="">Todas</option>
            <option value="Clínica Geral">Clínica Geral</option>
            <option value="Cardiologia">Cardiologia</option>
            <option value="Ginecologia">Ginecologia</option>
            <option value="Pediatria">Pediatria</option>
            <option value="Ortopedia">Ortopedia</option>
            <option value="Dermatologia">Dermatologia</option>
            <option value="Neurologia">Neurologia</option>
          </select>
        </div>
        <div class="filter-group" style="display:flex;gap:6px">
          <button class="btn btn-primary btn-sm" id="btn-filtrar-agendamentos">Filtrar</button>
          <button class="btn btn-outline btn-sm" id="btn-limpar-agendamentos">Limpar</button>
        </div>
      </div>
    </div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>#</th><th>Cidadão</th><th>Data / Horário</th><th>Especialidade</th><th>Médico</th><th>Unidade</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody data-box="lista-tbody"></tbody>
    </table></div>
    <div class="pagination"><span class="page-info" data-box="paginacao-info">Mostrando agendamentos</span><div class="page-btns"></div></div>
  </div>
</div>`,

    'json/agendamentos.json': {
      layout: 'agendamentos',
      titulo: 'Agendamentos',
      breadcrumb: 'Administração › Agendamentos',
      subtitulo: 'Gerencie e acompanhe todos os agendamentos do sistema.',
      boxes: {
        stats: [
          { label: 'Total Hoje', icon: '📅', iconClass: 'ic-blue', value: '158', note: 'Agendamentos', noteClass: 'note-muted' },
          { label: 'Confirmados', icon: '✅', iconClass: 'ic-green', value: '112', note: '70.9% do total', noteClass: 'note-green' },
          { label: 'Pendentes', icon: '⏳', iconClass: 'ic-yellow', value: '31', note: 'Aguardando confirmação', noteClass: 'note-orange' },
          { label: 'Cancelados', icon: '❌', iconClass: 'ic-red', value: '15', note: '9.5% do total', noteClass: 'note-red' }
        ],
        lista: [
          { id: '#10291', paciente: 'Luciana Ferreira', cpf: '123.456.789-00', data: '07/05/2026', horario: '13:20', especialidade: 'Clínica Geral', medico: 'Dr. Manoel Joaquim', unidade: 'Unidade Central', status: 'Confirmado', badge: 'b-green' },
          { id: '#10292', paciente: 'Marcos Oliveira', cpf: '987.654.321-00', data: '07/05/2026', horario: '13:45', especialidade: 'Cardiologia', medico: 'Dr. Arnaldo Luiz', unidade: 'Unidade Oeste', status: 'Confirmado', badge: 'b-green' },
          { id: '#10293', paciente: 'Ana Paula Costa', cpf: '456.789.123-00', data: '07/05/2026', horario: '14:00', especialidade: 'Ginecologia', medico: 'Dra. Heloísa Rocha', unidade: 'Unidade Sul', status: 'Pendente', badge: 'b-yellow' },
          { id: '#10294', paciente: 'Roberto Alves', cpf: '321.654.987-00', data: '07/05/2026', horario: '14:30', especialidade: 'Ortopedia', medico: 'Dr. Carlos Mendes', unidade: 'Unidade Norte', status: 'Confirmado', badge: 'b-green' },
          { id: '#10295', paciente: 'Fernanda Lima', cpf: '654.321.987-00', data: '07/05/2026', horario: '15:00', especialidade: 'Dermatologia', medico: 'Dra. Patrícia Souza', unidade: 'Unidade Leste', status: 'Cancelado', badge: 'b-red' },
          { id: '#10296', paciente: 'José Pereira', cpf: '789.123.456-00', data: '07/05/2026', horario: '15:30', especialidade: 'Neurologia', medico: 'Dr. Paulo Ribeiro', unidade: 'Unidade Central', status: 'Pendente', badge: 'b-yellow' },
          { id: '#10297', paciente: 'Maria Santos', cpf: '112.233.445-00', data: '07/05/2026', horario: '16:00', especialidade: 'Pediatria', medico: 'Dra. Camila Torres', unidade: 'Unidade Sul', status: 'Remarcado', badge: 'b-blue' }
        ],
        paginacao: { de: 1, ate: 7, total: 158 }
      }
    },

    'consultas.html': `<div class="page active" id="page-consultas">
  <div class="page-hd">
    <div>
      <div class="breadcrumb">Administração › <span>Consultas</span></div>
      <div class="page-title">Consultas Médicas</div>
      <div class="page-sub">Registro, acompanhamento e integração com a agenda dos profissionais de saúde.</div>
    </div>
    <div style="display:flex;gap:10px">
      <button class="btn btn-outline" id="btn-ver-agenda-medico">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>
        Agenda do Profissional
      </button>
      <button class="btn btn-primary" id="btn-nova-consulta">Nova Consulta</button>
    </div>
  </div>
  <div class="stats-grid cols4" data-box="stats" style="margin-bottom:20px"></div>
  <div style="display:grid;grid-template-columns:1fr 300px;gap:16px">
    <div>
      <div class="card">
        <div class="card-header"><span class="card-title">Consultas Registradas</span></div>
        <div style="padding:14px 20px;border-bottom:1px solid var(--border)">
          <div class="filters-row" style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
            <div class="filter-group">
              <label>Buscar Cidadão</label>
              <div class="search-input-wrap"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="filter-input" id="filter-consultas-busca" type="text" placeholder="Nome ou CID..."></div>
            </div>
            <div class="filter-group">
              <label>Médico</label>
              <select class="filter-select" id="filter-consultas-medico">
                <option value="">Todos os médicos</option>
                <option value="Dr. Manoel Joaquim">Dr. Manoel Joaquim</option>
                <option value="Dr. Arnaldo Luiz">Dr. Arnaldo Luiz</option>
                <option value="Dra. Heloísa Rocha">Dra. Heloísa Rocha</option>
                <option value="Dr. Carlos Mendes">Dr. Carlos Mendes</option>
                <option value="Dra. Patrícia Souza">Dra. Patrícia Souza</option>
                <option value="Dr. Paulo Ribeiro">Dr. Paulo Ribeiro</option>
                <option value="Dra. Camila Torres">Dra. Camila Torres</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Especialidade</label>
              <select class="filter-select" id="filter-consultas-especialidade">
                <option value="">Todas</option>
                <option value="Clínica Geral">Clínica Geral</option>
                <option value="Cardiologia">Cardiologia</option>
                <option value="Ginecologia">Ginecologia</option>
                <option value="Ortopedia">Ortopedia</option>
                <option value="Dermatologia">Dermatologia</option>
                <option value="Pediatria">Pediatria</option>
                <option value="Neurologia">Neurologia</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Status</label>
              <select class="filter-select" id="filter-consultas-status">
                <option value="">Todos</option>
                <option value="Agendada">Agendada</option>
                <option value="Aguardando">Aguardando</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluída">Concluída</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
            <div class="filter-group" style="display:flex;gap:6px">
              <button class="btn btn-primary btn-sm" id="btn-filtrar-consultas">Filtrar</button>
              <button class="btn btn-outline btn-sm" id="btn-limpar-consultas">Limpar</button>
            </div>
          </div>
        </div>
        <div class="tbl-wrap"><table>
          <thead><tr><th>Cidadão</th><th>Especialidade</th><th>Médico</th><th>Início</th><th>Duração</th><th>Status</th><th>CID</th><th>Ações</th></tr></thead>
          <tbody data-box="consultas-tbody"></tbody>
        </table></div>
        <div class="pagination"><span class="page-info">Mostrando consultas</span><div class="page-btns"></div></div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card">
        <div class="card-header"><span class="card-title" style="font-size:13.5px">Por Especialidade</span></div>
        <div style="padding:8px 20px 14px">
          <div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:12.5px;font-weight:500">Clínica Geral</span><span style="font-size:12px;font-weight:700">34</span></div><div class="prog-bar"><div class="prog-fill bar-blue" style="width:65%"></div></div></div>
          <div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:12.5px;font-weight:500">Cardiologia</span><span style="font-size:12px;font-weight:700">18</span></div><div class="prog-bar"><div class="prog-fill" style="width:35%;background:var(--accent)"></div></div></div>
          <div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:12.5px;font-weight:500">Ginecologia</span><span style="font-size:12px;font-weight:700">14</span></div><div class="prog-bar"><div class="prog-fill" style="width:27%;background:var(--accent2)"></div></div></div>
          <div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:12.5px;font-weight:500">Pediatria</span><span style="font-size:12px;font-weight:700">11</span></div><div class="prog-bar"><div class="prog-fill" style="width:21%;background:#a855f7"></div></div></div>
          <div><div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:12.5px;font-weight:500">Outras</span><span style="font-size:12px;font-weight:700">10</span></div><div class="prog-bar"><div class="prog-fill" style="width:19%;background:var(--warning)"></div></div></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title" style="font-size:13.5px">Fila de Espera</span></div>
        <div style="padding:8px 16px 12px">
          <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)"><div style="width:22px;height:22px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0">1</div><div style="flex:1"><div style="font-size:13px;font-weight:600">Roberto Alves</div><div style="font-size:11px;color:var(--text-muted)">Ortopedia · Dr. Carlos Mendes</div></div><span style="font-size:11px;color:var(--warning);font-weight:600">~15 min</span></div>
          <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)"><div style="width:22px;height:22px;background:#6b7a8d;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0">2</div><div style="flex:1"><div style="font-size:13px;font-weight:600">Josefa Marques</div><div style="font-size:11px;color:var(--text-muted)">Dermatologia · Dra. Patrícia</div></div><span style="font-size:11px;color:var(--text-muted);font-weight:600">~30 min</span></div>
          <div style="display:flex;align-items:center;gap:10px;padding:9px 0"><div style="width:22px;height:22px;background:#6b7a8d;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0">3</div><div style="flex:1"><div style="font-size:13px;font-weight:600">Pedro Lima</div><div style="font-size:11px;color:var(--text-muted)">Clínica Geral · Dr. Manoel</div></div><span style="font-size:11px;color:var(--text-muted);font-weight:600">~45 min</span></div>
        </div>
      </div>
    </div>
  </div>
</div>`,

    'json/consultas.json': {
      layout: 'consultas',
      titulo: 'Consultas Médicas',
      breadcrumb: 'Administração › Consultas',
      subtitulo: 'Registro e acompanhamento de todas as consultas realizadas e agenda médica.',
      boxes: {
        stats: [
          { label: 'Agendadas', icon: '📅', iconClass: 'ic-blue', value: '3', note: 'Consultas agendadas', noteClass: 'note-muted' },
          { label: 'Canceladas', icon: '❌', iconClass: 'ic-red', value: '1', note: 'Cancelamentos', noteClass: 'note-red' },
          { label: 'Tempo Médio de Espera', icon: '⏱', iconClass: 'ic-purple', value: '18 min', note: 'Fila de espera estimada', noteClass: 'note-orange' },
          { label: 'Em Andamento', icon: '🩺', iconClass: 'ic-teal', value: '1', note: 'Atendimentos agora', noteClass: 'note-green' }
        ],
        consultas: [
          { id: 'CS-101', paciente: 'Luciana Ferreira', idade: '42 anos', especialidade: 'Clínica Geral', medico: 'Dr. Manoel Joaquim', inicio: '13:20', duracao: '18 min', status: 'Concluída', badge: 'b-green', cid: 'J00', data: '07/05/2026' },
          { id: 'CS-102', paciente: 'Carlos Braga', idade: '58 anos', especialidade: 'Cardiologia', medico: 'Dr. Arnaldo Luiz', inicio: '13:45', duracao: '22 min', status: 'Concluída', badge: 'b-green', cid: 'I10', data: '07/05/2026' },
          { id: 'CS-103', paciente: 'Ana Paula Costa', idade: '34 anos', especialidade: 'Ginecologia', medico: 'Dra. Heloísa Rocha', inicio: '14:00', duracao: '—', status: 'Em Andamento', badge: 'b-blue', cid: '—', data: '07/05/2026' },
          { id: 'CS-104', paciente: 'Roberto Alves', idade: '67 anos', especialidade: 'Ortopedia', medico: 'Dr. Carlos Mendes', inicio: '14:30', duracao: '—', status: 'Aguardando', badge: 'b-yellow', cid: '—', data: '07/05/2026' },
          { id: 'CS-105', paciente: 'Josefa Marques', idade: '29 anos', especialidade: 'Dermatologia', medico: 'Dra. Patrícia Souza', inicio: '15:00', duracao: '—', status: 'Aguardando', badge: 'b-yellow', cid: '—', data: '07/05/2026' },
          { id: 'CS-106', paciente: 'Maria Santos', idade: '24 anos', especialidade: 'Pediatria', medico: 'Dra. Camila Torres', inicio: '16:00', duracao: '—', status: 'Agendada', badge: 'b-blue', cid: '—', data: '07/05/2026' },
          { id: 'CS-107', paciente: 'Marcos Oliveira', idade: '51 anos', especialidade: 'Cardiologia', medico: 'Dr. Arnaldo Luiz', inicio: '16:30', duracao: '—', status: 'Agendada', badge: 'b-blue', cid: '—', data: '07/05/2026' },
          { id: 'CS-108', paciente: 'Fernanda Lima', idade: '38 anos', especialidade: 'Dermatologia', medico: 'Dra. Patrícia Souza', inicio: '15:30', duracao: '—', status: 'Cancelada', badge: 'b-red', cid: '—', data: '07/05/2026' },
          { id: 'CS-109', paciente: 'José Pereira', idade: '45 anos', especialidade: 'Neurologia', medico: 'Dr. Paulo Ribeiro', inicio: '17:00', duracao: '—', status: 'Agendada', badge: 'b-blue', cid: '—', data: '07/05/2026' }
        ]
      }
    },

    'exames.html': `<div class="page active" id="page-exames">
  <div class="page-hd">
    <div>
      <div class="breadcrumb">Administração › <span>Exames</span></div>
      <div class="page-title">Exames Laboratoriais</div>
      <div class="page-sub">Acompanhe solicitações, laudos e resultados dos exames.</div>
    </div>
    <button class="btn btn-primary" id="btn-solicitar-exame">
      <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Solicitar Exame
    </button>
  </div>
  <div class="stats-grid cols4" data-box="stats" style="margin-bottom:20px"></div>
  <div class="card">
    <div class="card-header"><span class="card-title">Solicitações de Exames</span>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline btn-sm" id="btn-exportar-exames">Exportar CSV</button>
      </div>
    </div>
    <div style="padding:14px 20px;border-bottom:1px solid var(--border)">
      <div class="filters-row" style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
        <div class="filter-group">
          <label>Buscar Cidadão / Exame</label>
          <div class="search-input-wrap">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input class="filter-input" id="filter-exames-busca" type="text" placeholder="Nome, CPF ou tipo...">
          </div>
        </div>
        <div class="filter-group">
          <label>Status</label>
          <select class="filter-select" id="filter-exames-status">
            <option value="">Todos</option>
            <option value="Solicitado">Solicitado</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluído">Concluído</option>
            <option value="Atrasado">Atrasado</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Período (Início)</label>
          <input class="filter-input" id="filter-exames-data-inicio" type="date" style="min-width:130px">
        </div>
        <div class="filter-group">
          <label>Período (Fim)</label>
          <input class="filter-input" id="filter-exames-data-fim" type="date" style="min-width:130px">
        </div>
        <div class="filter-group" style="display:flex;gap:6px">
          <button class="btn btn-primary btn-sm" id="btn-filtrar-exames">Filtrar</button>
          <button class="btn btn-outline btn-sm" id="btn-limpar-exames" title="Limpar todos os filtros">Limpar</button>
        </div>
      </div>
    </div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Paciente</th><th>Tipo de Exame</th><th>Data</th><th>Unidade</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody data-box="exames-tbody"></tbody>
    </table></div>
    <div class="pagination"><span class="page-info"></span><div class="page-btns"></div></div>
  </div>
</div>`,

    'json/exames.json': {
      layout: 'exames',
      titulo: 'Exames Laboratoriais',
      breadcrumb: 'Administração › Exames',
      subtitulo: 'Acompanhe solicitações, laudos e resultados dos exames.',
      boxes: {
        stats: [
          { label: 'Solicitados', icon: '🔬', iconClass: 'ic-blue', value: '2', note: 'Novos pedidos', noteClass: 'note-muted' },
          { label: 'Em andamento', icon: '📋', iconClass: 'ic-orange', value: '2', note: 'Em análise no laboratório', noteClass: 'note-orange' },
          { label: 'Concluídos', icon: '✔', iconClass: 'ic-green', value: '3', note: 'Laudos prontos', noteClass: 'note-green' },
          { label: 'Atrasados', icon: '🚨', iconClass: 'ic-red', value: '1', note: 'Prazo previsto expirado', noteClass: 'note-red' }
        ],
        lista: [
          { id: '#EX-8821', paciente: 'Carlos Braga', cpf: '123.456.789-00', pid: 'P-4521', tipo: 'Hemograma Completo', solicitante: 'Dr. Arnaldo Luiz', unidade: 'UBS Centro', data: '07/05/2026', horario: '07:30', dataPrevista: '09/05/2026', prioridade: 'Urgente', priorBadge: 'b-red', status: 'Solicitado', statusBadge: 'b-yellow' },
          { id: '#EX-8822', paciente: 'Luciana Ferreira', cpf: '987.654.321-00', pid: 'P-4318', tipo: 'Glicemia em Jejum', solicitante: 'Dr. Manoel Joaquim', unidade: 'Unidade Central', data: '07/05/2026', horario: '08:00', dataPrevista: '08/05/2026', prioridade: 'Normal', priorBadge: 'b-gray', status: 'Em andamento', statusBadge: 'b-blue' },
          { id: '#EX-8819', paciente: 'Maria Santos', cpf: '112.233.445-00', pid: 'P-3892', tipo: 'Raio-X Tórax', solicitante: 'Dr. Paulo Ribeiro', unidade: 'Unidade Sul', data: '05/05/2026', horario: '09:15', dataPrevista: '06/05/2026', prioridade: 'Normal', priorBadge: 'b-gray', status: 'Concluído', statusBadge: 'b-green', download: true },
          { id: '#EX-8815', paciente: 'José Pereira', cpf: '789.123.456-00', pid: 'P-4102', tipo: 'Tomografia Crânio', solicitante: 'Dr. Paulo Ribeiro', unidade: 'Unidade Central', data: '01/05/2026', horario: '10:30', dataPrevista: '03/05/2026', prioridade: 'Média', priorBadge: 'b-orange', status: 'Em andamento', statusBadge: 'b-blue' }
        ]
      }
    },

    'vacinacao.html': `<div class="page active" id="page-vacinacao">
  <div class="page-hd">
    <div>
      <div class="breadcrumb">Administração › <span>Vacinação</span></div>
      <div class="page-title">Campanha de Vacinação</div>
      <div class="page-sub">Monitoramento de doses, coberturas e estoques das vacinas.</div>
    </div>
    <button class="btn btn-primary" id="btn-registrar-vacinacao">Registrar Aplicação</button>
  </div>
  <div class="stats-grid cols4" data-box="stats" style="margin-bottom:20px"></div>
  <div style="display:grid;grid-template-columns:1fr 320px;gap:16px">
    <div>
      <div class="card">
        <div class="card-header"><span class="card-title">Painel de Vacinas</span></div>
        <div style="padding:8px 20px 16px">
          <div data-box="vacinas-painel"></div>
        </div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="card" style="padding:16px 20px">
        <div class="card-title" style="margin-bottom:12px">Relatório de Insumos</div>
        <button class="btn btn-outline" id="btn-relatorio-insumos" style="width:100%;justify-content:center;margin-top:14px;font-size:12.5px">Ver Relatório Completo</button>
      </div>
    </div>
  </div>
</div>`,

    'json/vacinacao.json': {
      layout: 'vacinacao',
      titulo: 'Campanha de Vacinação',
      breadcrumb: 'Administração › Vacinação',
      subtitulo: 'Monitoramento de doses, coberturas e estoques das vacinas.',
      boxes: {
        stats: [
          { label: 'Doses Aplicadas Hoje', icon: '💉', iconClass: 'ic-green', value: '348', note: '↑ +8% vs ontem', noteClass: 'note-green' },
          { label: 'Total Este Mês', icon: '📊', iconClass: 'ic-blue', value: '4.821', note: 'Doses no mês', noteClass: 'note-muted' },
          { label: 'Cobertura Vacinal', icon: '🛡', iconClass: 'ic-teal', value: '78.4%', bar: 78.4, barClass: 'bar-green' },
          { label: 'Estoque Crítico', icon: '⚠', iconClass: 'ic-red', value: '2', note: 'Vacinas em alerta', noteClass: 'note-red' }
        ],
        vacinas: [
          { nome: 'COVID-19 (Bivalente)', detalhe: 'mRNA · 2ª dose', icone: '💉', icoBg: '#dcfce7', estoque: '1.240', cobertura: 82, status: 'Normal', badge: 'b-green' },
          { nome: 'Influenza', detalhe: 'Dose única', icone: '🩸', icoBg: '#fef9c3', estoque: '890', cobertura: 71, status: 'Atenção', badge: 'b-yellow', barColor: 'var(--warning)' },
          { nome: 'Hepatite B', detalhe: '3 doses', icone: '🔵', icoBg: '#e8f2fb', estoque: '540', cobertura: 88, status: 'Normal', badge: 'b-green' },
          { nome: 'Febre Amarela', detalhe: 'Dose única', icone: '🟣', icoBg: '#f3e8ff', estoque: '45', estoqueCritico: true, cobertura: 55, status: 'Crítico', badge: 'b-red', barColor: 'var(--accent2)' }
        ]
      }
    },

    'unidades.html': `<div class="page active" id="page-unidades">
  <div class="page-hd">
    <div>
      <div class="breadcrumb">Administração › <span>Gestão de Unidades</span></div>
      <div class="page-title">Unidades de Saúde</div>
      <div class="page-sub">Gerencie a infraestrutura e capacidade das unidades federativas.</div>
    </div>
    <button class="btn btn-primary" id="btn-novo-chamado">+ Novo Chamado</button>
  </div>
  <div class="stats-grid cols4" data-box="stats" style="margin-bottom:20px"></div>
  <div class="card">
    <div class="card-header"><span class="card-title">Lista de Unidades</span></div>
    <div style="padding:14px 20px;border-bottom:1px solid var(--border)">
      <div class="filters-row">
        <div class="filter-group"><label>Buscar Unidade</label><div class="search-input-wrap"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="filter-input" id="filter-unidades-busca" type="text" placeholder="Nome da unidade ou endereço..."></div></div>
        <div class="filter-group"><label>Tipo</label><select class="filter-select" id="filter-unidades-tipo"><option value="">Todos os tipos</option><option value="Hospital">Hospital</option><option value="UPA">UPA</option><option value="UBS">UBS</option><option value="AME">AME</option></select></div>
        <div class="filter-group"><label>Status</label><select class="filter-select" id="filter-unidades-status"><option value="">Qualquer status</option><option value="Operacional">Operacional</option><option value="Manutenção">Manutenção</option><option value="Inativa">Inativa</option></select></div>
        <div class="filter-group" style="justify-content:flex-end"><label>&nbsp;</label><button class="btn btn-outline btn-sm" id="btn-filtrar-unidades">Filtrar</button></div>
      </div>
    </div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Unidade</th><th>Tipo</th><th>Endereço</th><th>Capacidade</th><th>Status</th><th>Ações</th></tr></thead>
      <tbody data-box="unidades-tbody"></tbody>
    </table></div>
    <div class="pagination"><span class="page-info"></span><div class="page-btns"></div></div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px">
    <div class="card" style="padding:16px 20px">
      <div class="card-title" style="margin-bottom:12px">Relatório de Insumos</div>
      <button class="btn btn-outline" id="btn-relatorio-insumos-unidades" style="width:100%;justify-content:center;margin-top:12px;font-size:12.5px">Ver Relatório Completo</button>
    </div>
  </div>
</div>`,

    'json/unidades.json': {
      layout: 'unidades',
      titulo: 'Unidades de Saúde',
      breadcrumb: 'Administração › Gestão de Unidades',
      subtitulo: 'Gerencie a infraestrutura e capacidade das unidades federativas.',
      boxes: {
        stats: [
          { label: 'Total de Unidades', icon: '🏥', iconClass: 'ic-red', value: '42', note: 'Unidades cadastradas', noteClass: 'note-muted' },
          { label: 'Operacionais', icon: '✅', iconClass: 'ic-green', value: '38', note: 'Funcionando normalmente', noteClass: 'note-green' },
          { label: 'Em Manutenção', icon: '🔧', iconClass: 'ic-orange', value: '04', note: 'Temporariamente inativas', noteClass: 'note-orange' },
          { label: 'Capacidade Total', icon: '👥', iconClass: 'ic-blue', value: '12.5k', note: 'Leitos disponíveis', noteClass: 'note-muted' }
        ],
        lista: [
          { nome: 'Hospital Central Municipal', id: '102938', icone: '🏥', icoBg: '#fef2f2', tipo: 'Hospital', tipoBg: '#fef2f2', tipoColor: '#b91c1c', endereco: 'Av. Brasil, 1500 – Centro', capacidade: '500 leitos', ocupacao: 85, barClass: 'bar-blue', status: 'Operacional', statusColor: 'success' },
          { nome: 'UPA 24h Jardim Sul', id: '102945', icone: '🚑', icoBg: '#fef2f2', tipo: 'UPA', tipoBg: '#fef9c3', tipoColor: '#92400e', endereco: 'Rua das Palmeiras, 45 – Jd. Sul', capacidade: '80 atend/h', ocupacao: 40, barColor: 'var(--success)', status: 'Operacional', statusColor: 'success' },
          { nome: 'UBS Vila Nova', id: '102952', icone: '🏪', icoBg: '#e8f2fb', tipo: 'UBS', tipoBg: '#e8f2fb', tipoColor: '#1d4ed8', endereco: 'Praça da Matriz, s/n – Vila Nova', capacidade: 'Indisponível · Reforma', indisponivel: true, status: 'Manutenção', statusColor: 'danger' }
        ]
      }
    },

    'logs.html': `<div class="page active" id="page-logs">
  <div class="page-hd">
    <div>
      <div class="breadcrumb">Administração › <span>Logs de Sistema</span></div>
      <div class="page-title">Logs de Sistema</div>
      <div class="page-sub">Auditoria completa de todas as ações realizadas no sistema.</div>
    </div>
    <button class="btn btn-outline" id="btn-exportar-logs">
      <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Exportar Logs
    </button>
  </div>
  <div class="stats-grid cols4" data-box="stats" style="margin-bottom:20px"></div>
  <div style="display:grid;grid-template-columns:1fr 260px;gap:16px">
    <div class="card">
      <div class="card-header"><span class="card-title">Registros de Auditoria</span></div>
      <div style="padding:14px 20px;border-bottom:1px solid var(--border)">
        <div class="filters-row" style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
          <div class="filter-group">
            <label>Tipo</label>
            <select class="filter-select" id="filter-logs-tipo" style="min-width:130px">
              <option value="">Todos</option>
              <option value="Erro">Erro</option>
              <option value="Aviso">Aviso</option>
              <option value="Informação">Informação</option>
              <option value="Acesso">Acesso</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Usuário</label>
            <input class="filter-input" id="filter-logs-usuario" type="text" placeholder="Nome ou login...">
          </div>
          <div class="filter-group">
            <label>Período (Início)</label>
            <input class="filter-input" id="filter-logs-data-inicio" type="date" style="min-width:130px">
          </div>
          <div class="filter-group">
            <label>Período (Fim)</label>
            <input class="filter-input" id="filter-logs-data-fim" type="date" style="min-width:130px">
          </div>
          <div class="filter-group">
            <label>Buscar</label>
            <div class="search-input-wrap">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input class="filter-input" id="filter-logs-busca" type="text" placeholder="Ação, módulo ou termo..." style="min-width:160px">
            </div>
          </div>
          <div class="filter-group" style="display:flex;gap:6px">
            <button class="btn btn-primary btn-sm" id="btn-filtrar-logs">Filtrar</button>
            <button class="btn btn-outline btn-sm" id="btn-limpar-logs" title="Limpar todos os filtros">Limpar</button>
          </div>
        </div>
      </div>
      <div style="padding:8px 20px 4px" data-box="logs-list"></div>
      <div class="pagination"><span class="page-info"></span><div class="page-btns"></div></div>
    </div>
  </div>
</div>`,

    'json/logs.json': {
      layout: 'logs',
      titulo: 'Logs de Sistema',
      breadcrumb: 'Administração › Logs de Sistema',
      subtitulo: 'Auditoria completa de todas as ações realizadas no sistema.',
      boxes: {
        stats: [
          { label: 'Total de registros', icon: '📝', iconClass: 'ic-blue', value: '8', note: 'Auditoria geral', noteClass: 'note-muted' },
          { label: 'Erros', icon: '🚨', iconClass: 'ic-red', value: '1', note: 'Falhas e exceções', noteClass: 'note-red' },
          { label: 'Avisos', icon: '⚠', iconClass: 'ic-yellow', value: '2', note: 'Alertas de segurança', noteClass: 'note-orange' },
          { label: 'Acessos', icon: '👤', iconClass: 'ic-green', value: '2', note: 'Logins e autenticações', noteClass: 'note-green' }
        ],
        registros: [
          { id: 'LOG-1001', hora: '09:41:22', data: '07/05/2026', dataHora: '07/05/2026 09:41:22', tipo: 'Erro', badge: 'b-red', dot: 'danger', acao: 'Falha na conexão com banco de dados', titulo: 'Falha na conexão com banco de dados', descricao: 'Tempo limite atingido durante tentativa de conexão com a base de dados principal.', usuario: 'sistema', modulo: 'DB_CONN', ip: '192.168.1.10', meta: 'Módulo: DB_CONN · Usuário: sistema · IP: 192.168.1.10' },
          { id: 'LOG-1002', hora: '09:38:14', data: '07/05/2026', dataHora: '07/05/2026 09:38:14', tipo: 'Informação', badge: 'b-blue', dot: 'primary', acao: 'Laudo do exame #EX-8819 emitido', titulo: 'Laudo do exame #EX-8819 emitido', descricao: 'Laudo do exame #EX-8819 (Raio-X Tórax) emitido e assinado digitalmente.', usuario: 'Dr. Paulo Ribeiro', modulo: 'EXAMES', ip: '192.168.1.45', meta: 'Módulo: EXAMES · Usuário: Dr. Paulo Ribeiro · IP: 192.168.1.45' },
          { id: 'LOG-1003', hora: '09:35:07', data: '07/05/2026', dataHora: '07/05/2026 09:35:07', tipo: 'Aviso', badge: 'b-yellow', dot: 'warning', acao: 'Estoque de Insulina abaixo do mínimo', titulo: 'Estoque de Insulina abaixo do mínimo', descricao: 'Estoque de Insulina NPH na Unidade Sul atingiu o limite crítico de segurança.', usuario: 'sistema', modulo: 'ESTOQUE', ip: '192.168.1.10', meta: 'Módulo: ESTOQUE · Usuário: sistema · Unidade: Sul' },
          { id: 'LOG-1004', hora: '09:31:55', data: '07/05/2026', dataHora: '07/05/2026 09:31:55', tipo: 'Acesso', badge: 'b-green', dot: 'success', acao: 'Login realizado com sucesso', titulo: 'Login realizado com sucesso', descricao: 'Usuário Denilson Barrios autenticado com perfil Administrador.', usuario: 'Denilson Barrios', modulo: 'AUTH', ip: '192.168.1.1', meta: 'Módulo: AUTH · Usuário: Denilson Barrios · IP: 192.168.1.1' }
        ]
      }
    },

    'configuracoes.html': `<div class="page active" id="page-configuracoes">
  <div class="page-hd">
    <div>
      <div class="breadcrumb">Sistema › <span>Configurações</span></div>
      <div class="page-title">Configurações do Sistema</div>
      <div class="page-sub" data-box="subtitulo">Personalize as preferências, perfil e parâmetros do sistema.</div>
    </div>
    <button class="btn btn-primary btn-sm" id="btn-salvar-config">Salvar Alterações</button>
  </div>
  <div class="config-card">
    <div class="config-header-tabs">
      <nav class="config-nav" data-box="config-nav" style="display:flex;gap:6px;width:100%"></nav>
    </div>
    <div class="config-body">
      <section class="config-section active" id="sec-perfil" data-section="perfil">
        <h3 class="card-title" style="margin-bottom:16px">Perfil do Usuário</h3>
        <div class="config-row">
          <div class="config-field"><label>Nome Completo</label><input type="text" id="cfg-nome" value="Denilson Barrios"></div>
          <div class="config-field"><label>E-mail</label><input type="email" id="cfg-email" value="denilson.barrios@saude.gov.br"></div>
        </div>
        <div class="config-row">
          <div class="config-field"><label>Cargo</label><input type="text" id="cfg-cargo" value="Gestor Geral"></div>
          <div class="config-field"><label>Unidade</label><input type="text" id="cfg-unidade" value="Unidade Central"></div>
        </div>
        <div class="config-field"><label>Telefone</label><input type="tel" id="cfg-telefone" value="(11) 98765-4321"></div>
      </section>
      <section class="config-section" id="sec-sistema" data-section="sistema">
        <h3 class="card-title" style="margin-bottom:16px">Preferências do Sistema</h3>
        <div class="config-row">
          <div class="config-field"><label>Idioma</label><select id="cfg-idioma"><option value="pt-BR">Português (Brasil)</option><option value="en-US">English</option></select></div>
          <div class="config-field"><label>Fuso Horário</label><select id="cfg-fuso"><option value="America/Sao_Paulo">Brasília (GMT-3)</option></select></div>
        </div>
        <div class="config-row">
          <div class="config-field"><label>Itens por Página</label><select id="cfg-itens"><option value="10">10</option><option value="25">25</option><option value="50">50</option></select></div>
        </div>
      </section>
      <section class="config-section" id="sec-notificacoes" data-section="notificacoes">
        <h3 class="card-title" style="margin-bottom:16px">Notificações</h3>
        <div data-box="notificacoes-list"></div>
      </section>
      <section class="config-section" id="sec-seguranca" data-section="seguranca">
        <h3 class="card-title" style="margin-bottom:16px">Segurança</h3>
        <div class="config-row">
          <div class="config-field"><label>Timeout de Sessão (min)</label><input type="number" id="cfg-timeout" value="30" min="5" max="120"></div>
          <div class="config-field"><label>Último Acesso</label><input type="text" id="cfg-ultimo-acesso" value="07/05/2026 09:31" readonly></div>
        </div>
        <div class="toggle-row">
          <div class="toggle-info"><strong>Autenticação em Dois Fatores (2FA)</strong><span>Camada extra de proteção via aplicativo autenticador</span></div>
          <input type="checkbox" id="cfg-2fa">
        </div>
      </section>
    </div>
  </div>
</div>`,

    'json/configuracoes.json': {
      layout: 'configuracoes',
      titulo: 'Configurações',
      breadcrumb: 'Sistema › Configurações',
      subtitulo: 'Personalize o sistema, perfil e preferências de notificação.',
      boxes: {
        secoes: [
          { id: 'perfil', label: 'Perfil do Usuário' },
          { id: 'sistema', label: 'Sistema' },
          { id: 'notificacoes', label: 'Notificações' },
          { id: 'seguranca', label: 'Segurança' }
        ],
        perfil: {
          nome: 'Denilson Barrios',
          email: 'denilson.barrios@saude.gov.br',
          cargo: 'Gestor Geral',
          unidade: 'Unidade Central',
          telefone: '(11) 98765-4321'
        },
        sistema: { idioma: 'pt-BR', fuso: 'America/Sao_Paulo' },
        notificacoes: [
          { id: 'email', titulo: 'Alertas por E-mail', descricao: 'Receber alertas críticos por e-mail', ativo: true },
          { id: 'push', titulo: 'Notificações Push', descricao: 'Alertas em tempo real no navegador', ativo: true }
        ],
        seguranca: { sessaoTimeout: 30, ultimoAcesso: '07/05/2026 09:31' }
      }
    },

    'perfil.html': `<div class="page active" id="page-perfil">
  <div class="page-hd">
    <div>
      <div class="breadcrumb">Sistema › <span>Meu Perfil & Edição</span></div>
      <div class="page-title">Meu Perfil & Configurações da Conta</div>
      <div class="page-sub">Visualize suas credenciais, edite seus dados pessoais e personalize o sistema.</div>
    </div>
    <button class="btn btn-primary" id="btn-salvar-perfil-top">
      <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      Salvar Alterações
    </button>
  </div>
  <div class="card perfil-hdr-card" style="padding:24px;margin-bottom:20px;display:flex;align-items:center;gap:20px">
    <div style="width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px;font-weight:700;box-shadow:0 4px 14px rgba(10,110,189,0.3);flex-shrink:0" id="perfil-avatar-big">DR</div>
    <div style="flex:1">
      <div style="display:flex;align-items:center;gap:10px">
        <h2 style="font-size:22px;font-weight:700;color:var(--text)" id="perfil-nome-hdr">Denilson Barrios</h2>
        <span class="badge b-blue" id="perfil-cargo-badge">Gestor Geral</span>
      </div>
      <div style="font-size:13.5px;color:var(--text-muted);margin-top:4px" id="perfil-meta-hdr">
        Matrícula: <strong class="mono" style="color:var(--text)">MAT-2026-9814</strong> · Registro/CRM: <strong class="mono" style="color:var(--text)">MS-88192-SP</strong> · Unidade: <strong style="color:var(--text)" id="perfil-unidade-hdr">Unidade Central UPA 24H</strong>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 340px;gap:20px">
    <div style="display:flex;flex-direction:column;gap:20px">
      <div class="card card-body">
        <h3 class="card-title" style="margin-bottom:16px;color:var(--text)">✏️ Editar Informações do Usuário</h3>
        <form id="form-edit-perfil" onsubmit="return false;">
          <div class="config-row" style="margin-bottom:14px">
            <div class="config-field"><label>Nome Completo</label><input type="text" id="perfil-edit-nome" value="Denilson Barrios"></div>
            <div class="config-field"><label>E-mail Institucional</label><input type="email" id="perfil-edit-email" value="denilson.barrios@saude.gov.br"></div>
          </div>
          <div class="config-row" style="margin-bottom:14px">
            <div class="config-field"><label>Cargo / Função</label><input type="text" id="perfil-edit-cargo" value="Gestor Geral"></div>
            <div class="config-field"><label>Unidade Principal</label><input type="text" id="perfil-edit-unidade" value="Unidade Central"></div>
          </div>
          <div class="config-row" style="margin-bottom:14px">
            <div class="config-field" style="grid-column: span 2"><label>Telefone de Contato</label><input type="tel" id="perfil-edit-telefone" value="(11) 98765-4321"></div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:10px">
            <button class="btn btn-primary" id="btn-salvar-perfil">Salvar Alterações do Perfil</button>
          </div>
        </form>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:20px">
      <div class="card card-body">
        <h3 class="card-title" style="margin-bottom:12px;color:var(--text)">🔒 Recuperação de Senha</h3>
        <button class="btn btn-outline btn-sm" id="btn-esqueceu-senha" style="width:100%;justify-content:center;margin-bottom:10px" onclick="document.getElementById('form-recuperar-senha').style.display='block'; this.style.display='none';">Esqueceu sua senha?</button>
        <form id="form-recuperar-senha" onsubmit="return false;" style="display:none;">
          <div class="form-group" style="margin-bottom:10px">
            <label style="color:var(--text-muted)">Digite seu CPF para solicitar nova senha ao T.I</label>
            <input type="text" id="recupera-cpf" placeholder="000.000.000-00" required>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-confirmar-recuperacao" style="width:100%;justify-content:center;margin-top:6px">Confirmar solicitação</button>
        </form>
      </div>
    </div>
  </div>
</div>`,

    'json/perfil.json': {
      layout: 'perfil',
      titulo: 'Perfil do Usuário',
      breadcrumb: 'Sistema › Meu Perfil',
      subtitulo: 'Informações pessoais, credenciais médicas e escala de trabalho.'
    }
  },

  // Cadastro/consulta de usuários agora vive em js/api/usuarios.js (UsuariosAPI).
  // Este método é mantido como um atalho fino para não obrigar a reescrever
  // todos os pontos do app.js que já chamam this.initUsuariosDB() para buscar
  // a lista de usuários (login, busca de paciente por CPF nos formulários etc).
  initUsuariosDB() {
    return window.UsuariosAPI ? window.UsuariosAPI.getAll() : [];
  },


  checkLogin(pageId = '') {
    if (!this.usuario) {
      if (pageId && (pageId === 'logs' || pageId === 'cadastro-usuarios')) {
        window.AuditoriaService?.registrar({
          usuario: 'Não autenticado',
          acao: 'Tentativa de Acesso Negado',
          tipo: 'Aviso',
          modulo: 'SEGURANÇA',
          descricao: `Tentativa de acesso não autenticado à área administrativa "${pageId}".`
        });
      }
      this.showLoginOverlay();
      return false;
    }
    return true;
  },

  showLoginOverlay() {
    let overlay = document.getElementById('login-overlay');
    if (overlay) overlay.remove();

    const cardBg = 'var(--card-bg)';
    const cardText = 'var(--text)';
    const cardMuted = 'var(--text-muted)';
    const cardBorder = 'var(--border)';
    const inputBg = '#ffffff';

    overlay = document.createElement('div');
    overlay.id = 'login-overlay';
    overlay.style = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--bg);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: 'DM Sans', sans-serif;
    `;

    overlay.innerHTML = `
      <div style="
        background: ${cardBg};
        border: 1px solid ${cardBorder};
        border-radius: var(--radius);
        overflow: hidden;
        box-shadow: var(--shadow-md);
        max-width: 410px;
        width: 100%;
        color: ${cardText};
      " id="login-container-card">
        <div style="padding: 32px 28px; display: flex; flex-direction: column; justify-content: center;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, var(--primary), var(--accent)); color: #fff; font-weight: 800; font-size: 11px; padding: 6px 8px; border-radius: 8px; line-height: 1.1; text-align: center; box-shadow: 0 2px 6px rgba(10,110,189,0.25);">UPA<br>24H</div>
            <div>
              <strong style="font-size: 16px; color: var(--primary); display: block; font-weight: 700; letter-spacing: -0.2px;">UPA 24H</strong>
              <span style="font-size: 11px; color: ${cardMuted};">Saúde Pública Digital</span>
            </div>
          </div>

          <h2 style="font-size: 21px; font-weight: 700; margin-bottom: 6px; letter-spacing: -0.5px; color: ${cardText};">Portal de Acesso</h2>
          <p style="font-size: 12.5px; color: ${cardMuted}; margin-bottom: 18px; line-height: 1.45;">Autentique-se para acessar os serviços e painéis da UPA 24H de acordo com seu perfil de atendimento.</p>

          <div id="login-error-msg" style="display: none; background: #fee2e2; color: #b91c1c; border-radius: 8px; padding: 10px 12px; font-size: 12px; margin-bottom: 16px; font-weight: 500; border-left: 4px solid #ef4444; line-height: 1.35;"></div>

          <form id="login-form-element" onsubmit="return false;" style="display:flex; flex-direction:column; gap:14px;">
            <div style="display: flex; flex-direction: column; gap: 5px;">
              <label style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: ${cardMuted}; letter-spacing: 0.5px;">CPF, E-mail ou Usuário</label>
              <input type="text" id="login-username" placeholder="000.000.000-00 ou email" required autocomplete="username" style="padding: 10px 12px; border: 1.5px solid ${cardBorder}; border-radius: 8px; font-size: 13.5px; outline: none; transition: border-color 0.15s; background: ${inputBg}; color: ${cardText};">
            </div>

            <div style="display: flex; flex-direction: column; gap: 5px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <label style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; color: ${cardMuted}; letter-spacing: 0.5px;">Senha</label>
                <button type="button" id="btn-toggle-pwd" style="background: none; border: none; font-size: 11px; color: var(--primary); cursor: pointer; padding: 0; font-weight: 500;">Mostrar</button>
              </div>
              <input type="password" id="login-password" placeholder="Digite sua senha" required autocomplete="current-password" style="padding: 10px 12px; border: 1.5px solid ${cardBorder}; border-radius: 8px; font-size: 13.5px; outline: none; transition: border-color 0.15s; background: ${inputBg}; color: ${cardText};">
            </div>

            <button type="submit" id="btn-submit-login" style="
              background: linear-gradient(135deg, var(--primary), var(--primary-dark));
              color: #fff;
              border: none;
              padding: 11px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 13.5px;
              cursor: pointer;
              box-shadow: 0 4px 8px -1px rgba(10, 110, 189, 0.3);
              transition: all 0.15s;
              margin-top: 2px;
            ">Entrar no Sistema</button>
          </form>

          <!-- Atalhos rápidos para validação e testes dos 3 perfis exigidos -->
          <div style="margin-top: 20px; padding-top: 14px; border-top: 1px dashed ${cardBorder};">
            <div style="font-size: 10.5px; font-weight: 600; color: ${cardMuted}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.4px;">Preenchimento rápido para testes:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              <button type="button" class="btn-quick-fill" data-user="111.444.777-35" data-pass="admin" style="font-size: 11px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); background: #f8fafc; color: var(--text); cursor: pointer; transition: background 0.12s;">👑 Administrador</button>
              <button type="button" class="btn-quick-fill" data-user="222.555.888-46" data-pass="prof123" style="font-size: 11px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); background: #f8fafc; color: var(--text); cursor: pointer; transition: background 0.12s;">🩺 Profissional da Saúde</button>
              <button type="button" class="btn-quick-fill" data-user="333.666.999-57" data-pass="paciente123" style="font-size: 11px; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); background: #f8fafc; color: var(--text); cursor: pointer; transition: background 0.12s;">👤 Paciente</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const autenticar = async (loginCPF, loginPass) => {
      const errMsg = document.getElementById('login-error-msg');
      const submitBtn = document.getElementById('btn-submit-login');
      if (errMsg) errMsg.style.display = 'none';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Autenticando...';
      }

      try {
        const res = await window.AuthAPI.login(loginCPF, loginPass);
        if (!res.body.success || !res.body.user) {
          if (errMsg) {
            errMsg.textContent = res.body.error || 'Credenciais inválidas. Verifique os dados.';
            errMsg.style.display = 'block';
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar no Sistema';
          }
          return;
        }

        const user = res.body.user;
        this.usuario = user;
        overlay.remove();

        this.toast(`Bem-vindo(a), ${user.nome}!`, 'success');

        this.applyUsuario();
        this.buildSidebar();
        await this.goTo(window.Permissoes?.paginaInicial(user.perfil) || 'dashboard');
      } catch (err) {
        if (errMsg) {
          errMsg.textContent = 'Erro ao processar login: ' + (err.message || err);
          errMsg.style.display = 'block';
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Entrar no Sistema';
        }
      }
    };

    const form = document.getElementById('login-form-element');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const loginCPF = document.getElementById('login-username').value.trim();
      const loginPass = document.getElementById('login-password').value;
      autenticar(loginCPF, loginPass);
    });

    const togglePwd = document.getElementById('btn-toggle-pwd');
    const pwdInput = document.getElementById('login-password');
    if (togglePwd && pwdInput) {
      togglePwd.addEventListener('click', () => {
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        togglePwd.textContent = isPwd ? 'Ocultar' : 'Mostrar';
      });
    }

    overlay.querySelectorAll('.btn-quick-fill').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = btn.dataset.user;
        const p = btn.dataset.pass;
        const userInp = document.getElementById('login-username');
        const passInp = document.getElementById('login-password');
        const errMsg = document.getElementById('login-error-msg');
        if (userInp) {
          userInp.value = u;
          userInp.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (passInp) passInp.value = p;
        if (errMsg) errMsg.style.display = 'none';
      });
    });

    const cpfInput = document.getElementById('login-username');
    cpfInput.addEventListener('input', (e) => {
      const isDigitsOnly = /^\d+$/.test(e.target.value.replace(/[\.\-]/g, ''));
      if (isDigitsOnly) {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length <= 11) {
          if (val.length > 9) {
            val = val.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
          } else if (val.length > 6) {
            val = val.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
          } else if (val.length > 3) {
            val = val.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
          }
          e.target.value = val;
        }
      }
    });
  },

  async init() {
    try {
      window.AuthAPI?.registrarInterceptor();
      window.UsuariosAPI?.registrarInterceptor();
      this.initUsuariosDB();
      await this.loadPartials();
      
      const [usuario, navegacao] = await Promise.all([
        this.fetchJson('json/usuario.json'),
        this.fetchJson('json/navegacao.json')
      ]);

      this.navegacao = navegacao;

      // Corrige um bug real: this.data era gravado em localStorage
      // (upa_data_cache) mas nunca era lido de volta aqui, então todo
      // agendamento/consulta/exame criado pelo usuário sumia ao recarregar
      // a página, mesmo parecendo ter sido salvo.
      const savedData = localStorage.getItem('upa_data_cache');
      if (savedData) {
        try { this.data = JSON.parse(savedData) || {}; } catch (e) { this.data = {}; }
      }

      // Validação de sessão autenticada com token de segurança via AuthAPI
      let sessaoValida = null;
      if (window.AuthAPI?.restaurarSessao) {
        sessaoValida = await window.AuthAPI.restaurarSessao();
      }

      if (sessaoValida && window.Permissoes?.perfilTemLoginWeb(sessaoValida.perfil)) {
        this.usuario = sessaoValida;
      } else {
        // Fallback local se não houver token ou sessão expirou
        this.usuario = null;
        window.AuthAPI?.setTokenLocal(null);
        localStorage.removeItem('upa_usuario');
      }

      const savedSettings = localStorage.getItem('upa_settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }

      this.applySettings();

      if (this.usuario) {
        this.applyUsuario();
        this.buildSidebar();
        this.bindNavigation();
        this.bindGlobalActions();
        await this.goTo(window.Permissoes?.paginaInicial(this.usuario.perfil) || 'dashboard');
      } else {
        this.buildSidebar();
        this.bindNavigation();
        this.bindGlobalActions();
        this.showLoginOverlay();
      }
    } catch (err) {
      console.error('Erro na inicialização:', err);
      document.getElementById('screen-container').innerHTML =
        '<p class="screen-error">Erro ao iniciar o sistema UPA 24H.</p>';
    }
  },

  async fetchJson(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (this.fallbacks && this.fallbacks[url]) {
        return JSON.parse(JSON.stringify(this.fallbacks[url]));
      }
      throw err;
    }
  },

  async fetchText(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (this.fallbacks && this.fallbacks[url]) {
        return this.fallbacks[url];
      }
      throw err;
    }
  },

  async loadPartials() {
    const [header, sidebar] = await Promise.all([
      this.fetchText('partials/header.html'),
      this.fetchText('partials/sidebar.html')
    ]);
    document.getElementById('header-slot').innerHTML = header;
    document.getElementById('sidebar-slot').innerHTML = sidebar;
  },

  applyUsuario() {
    const u = this.usuario;
    if (!u) return;
    const map = {
      '#user-nome': u.nome,
      // Nem todo perfil tem um campo "cargo" próprio (ex.: Recepção só
      // registra a unidade) — sem isto, o cabeçalho ficava mostrando o
      // placeholder estático "Gestor Geral" do HTML para qualquer usuário
      // sem cargo definido.
      '#user-cargo': u.cargo || u.perfil,
      '#user-avatar': u.iniciais || u.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      '#dropdown-user-nome': u.nome,
      '#dropdown-user-email': u.email,
      '#sistema-nome': u.sistema?.nome || 'UPA 24H',
      '#sistema-subtitulo': u.sistema?.subtitulo || 'Saúde Pública Digital'
    };
    Object.entries(map).forEach(([sel, val]) => {
      const el = document.querySelector(sel);
      if (el && val) el.textContent = val;
    });

    if (u.avatarUrl) {
      const headerAvatar = document.querySelector('#user-avatar');
      if (headerAvatar) {
        headerAvatar.style.backgroundImage = `url(${u.avatarUrl})`;
        headerAvatar.style.backgroundSize = 'cover';
        headerAvatar.style.backgroundPosition = 'center';
        headerAvatar.style.color = 'transparent';
      }
      const perfilAvatar = document.querySelector('#perfil-avatar-big');
      if (perfilAvatar) {
        perfilAvatar.style.backgroundImage = `url(${u.avatarUrl})`;
        perfilAvatar.style.backgroundSize = 'cover';
        perfilAvatar.style.backgroundPosition = 'center';
        perfilAvatar.style.color = 'transparent';
      }
    }
  },

  applySettings() {
    // Tema escuro e alto contraste foram removidos do sistema: fica sempre
    // no modo claro. As duas linhas abaixo só existem por segurança, para
    // limpar essas classes caso alguém ainda tenha uma dessas preferências
    // salva no navegador de uma sessão anterior a esta mudança.
    document.body.classList.remove('dark-theme');
    document.body.classList.remove('high-contrast');
  },

  saveState() {
    localStorage.setItem('upa_usuario', JSON.stringify(this.usuario));
    localStorage.setItem('upa_settings', JSON.stringify(this.settings));
    localStorage.setItem('upa_data_cache', JSON.stringify(this.data));
  },

  /**
   * ==========================================================================
   * Cards de estatísticas (Dashboard, Agendamentos, Consultas, Exames)
   * ==========================================================================
   * Corrige um bug real: os cards de números (ex.: "Total de Cidadãos",
   * "Consultas Agendadas") vinham prontos, fixos, direto dos arquivos
   * json/*.json — nunca eram recalculados a partir dos dados de verdade
   * (usuários cadastrados, agendamentos, consultas, exames). Por isso pareciam
   * "travados": não importava o que o usuário fizesse (logar, cadastrar
   * alguém, criar um agendamento), o número exibido era sempre o mesmo.
   *
   * A partir de agora, `refreshStats(pageId)` recalcula esses cards a partir
   * das listas reais guardadas em this.data toda vez que a página é aberta
   * (goTo), então eles sempre refletem o estado atual do sistema.
   */
  async ensureDataset(pageId, jsonUrl) {
    if (!this.data[pageId]) {
      this.data[pageId] = await this.fetchJson(jsonUrl);
    }
    return this.data[pageId];
  },

  recomputeAgendamentosStats(pageData) {
    if (!pageData?.boxes) return;
    const lista = pageData.boxes.lista || [];
    const total = lista.length;
    const confirmados = lista.filter(a => a.status === 'Confirmado').length;
    const pendentes = lista.filter(a => a.status === 'Pendente').length;
    const cancelados = lista.filter(a => a.status === 'Cancelado').length;
    const pct = (n) => total > 0 ? `${((n / total) * 100).toFixed(1)}% do total` : 'Sem registros';

    pageData.boxes.stats = [
      { label: 'Total Hoje', icon: '📅', iconClass: 'ic-blue', value: String(total), note: 'Agendamentos', noteClass: 'note-muted' },
      { label: 'Confirmados', icon: '✅', iconClass: 'ic-green', value: String(confirmados), note: pct(confirmados), noteClass: 'note-green' },
      { label: 'Pendentes', icon: '⏳', iconClass: 'ic-yellow', value: String(pendentes), note: 'Aguardando confirmação', noteClass: 'note-orange' },
      { label: 'Cancelados', icon: '❌', iconClass: 'ic-red', value: String(cancelados), note: pct(cancelados), noteClass: 'note-red' }
    ];
  },

  recomputeConsultasStats(pageData) {
    if (!pageData?.boxes) return;
    const lista = pageData.boxes.consultas || [];
    const agendadas = lista.filter(c => c.status === 'Agendada').length;
    const canceladas = lista.filter(c => c.status === 'Cancelada').length;
    const andamento = lista.filter(c => c.status === 'Em Andamento').length;
    const aguardando = lista.filter(c => c.status === 'Aguardando').length;

    let tempoMedioMinutos = 18;
    const duracoes = lista
      .map(c => parseInt(String(c.duracao || '').replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n) && n > 0);
    if (duracoes.length > 0) {
      tempoMedioMinutos = Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length);
    }
    if (aguardando > 0) {
      tempoMedioMinutos = Math.max(12, Math.round(tempoMedioMinutos * 0.9 + aguardando * 2));
    }
    const tempoMedioEspera = `${tempoMedioMinutos} min`;

    pageData.boxes.stats = [
      { label: 'Agendadas', icon: '📅', iconClass: 'ic-blue', value: String(agendadas), note: 'Consultas agendadas', noteClass: 'note-muted' },
      { label: 'Canceladas', icon: '❌', iconClass: 'ic-red', value: String(canceladas), note: 'Cancelamentos', noteClass: 'note-red' },
      { label: 'Tempo Médio de Espera', icon: '⏱', iconClass: 'ic-purple', value: tempoMedioEspera, note: 'Fila de atendimento', noteClass: 'note-orange' },
      { label: 'Em Andamento', icon: '🩺', iconClass: 'ic-teal', value: String(andamento), note: 'Atendimentos agora', noteClass: 'note-green' }
    ];
  },

  recomputeExamesStats(pageData, filtros) {
    if (!pageData?.boxes) return;
    const ind = window.ExamesAPI ? window.ExamesAPI.getIndicadores(filtros) : {
      solicitados: 0,
      emAndamento: 0,
      concluidos: 0,
      atrasados: 0
    };

    pageData.boxes.stats = [
      { label: 'Solicitados', icon: '🔬', iconClass: 'ic-blue', value: String(ind.solicitados), note: 'Novos pedidos', noteClass: 'note-muted' },
      { label: 'Em andamento', icon: '📋', iconClass: 'ic-orange', value: String(ind.emAndamento), note: 'Em análise no laboratório', noteClass: 'note-orange' },
      { label: 'Concluídos', icon: '✔', iconClass: 'ic-green', value: String(ind.concluidos), note: 'Laudos prontos', noteClass: 'note-green' },
      { label: 'Atrasados', icon: '🚨', iconClass: 'ic-red', value: String(ind.atrasados), note: 'Prazo previsto expirado', noteClass: 'note-red' }
    ];
  },

  recomputeDashboardStats() {
    const dash = this.data.dashboard;
    if (!dash?.boxes) return;

    const cidadaos = (this.initUsuariosDB() || []).filter(u => u.perfil === 'Cidadão').length;
    const agLista = this.data.agendamentos?.boxes?.lista || [];
    const totalAgendamentos = agLista.length;
    const confirmados = agLista.filter(a => a.status === 'Confirmado').length;
    const exLista = this.data.exames?.boxes?.lista || [];
    const examesPendentes = exLista.filter(e => {
      const st = String(e.status || '').toLowerCase();
      return !st.includes('concl') && !st.includes('laudo emit');
    }).length;
    const taxaComparecimento = totalAgendamentos > 0
      ? Number(((confirmados / totalAgendamentos) * 100).toFixed(1))
      : 0;

    dash.boxes.stats = [
      { label: 'Total de Cidadãos', icon: '👥', iconClass: 'ic-blue', value: String(cidadaos), note: 'Cadastrados no sistema', noteClass: 'note-muted' },
      { label: 'Consultas Agendadas', icon: '📅', iconClass: 'ic-teal', value: String(totalAgendamentos), note: 'Agendamentos no sistema', noteClass: 'note-muted' },
      { label: 'Exames Pendentes', icon: '📋', iconClass: 'ic-orange', value: String(examesPendentes), note: 'Aguardando laudo', noteClass: 'note-orange' },
      { label: 'Taxa de Comparecimento', icon: '📊', iconClass: 'ic-red', value: `${taxaComparecimento}%`, bar: taxaComparecimento, barClass: 'bar-blue' }
    ];
  },

  addLog(tipo, titulo, meta, modulo) {
    if (window.AuditoriaService) {
      window.AuditoriaService.registrar({
        usuario: this.usuario ? this.usuario.nome : 'sistema',
        acao: titulo,
        tipo,
        descricao: meta || titulo,
        modulo: modulo || 'SISTEMA'
      });
    }

    if (!this.data.logs) {
      this.data.logs = { boxes: { registros: [], lista: [] } };
    }
    if (!this.data.logs.boxes) {
      this.data.logs.boxes = { registros: [], lista: [] };
    }

    const agora = new Date();
    const hora = agora.toLocaleTimeString('pt-BR', { hour12: false });
    const badgeClass = { SUCESSO: 'b-green', AVISO: 'b-yellow', INFO: 'b-blue', ERRO: 'b-red' }[tipo] || 'b-gray';
    const dot = { SUCESSO: 'success', AVISO: 'warning', INFO: 'primary', ERRO: 'danger' }[tipo] || 'default';

    const novoLog = {
      hora,
      tipo,
      badge: badgeClass,
      dot,
      titulo,
      meta,
      usuario: this.usuario ? this.usuario.nome : 'sistema',
      acao: titulo,
      descricao: meta || titulo,
      modulo: modulo || 'SISTEMA'
    };

    if (Array.isArray(this.data.logs.boxes.registros)) {
      this.data.logs.boxes.registros.unshift(novoLog);
    }
    if (Array.isArray(this.data.logs.boxes.lista)) {
      this.data.logs.boxes.lista.unshift(novoLog);
    }
    this.saveState();
  },

  recomputeLogsStats(pageData, filtros) {
    if (!pageData?.boxes) return;
    const ind = window.AuditoriaService ? window.AuditoriaService.getIndicadores(filtros) : {
      total: 0,
      erros: 0,
      avisos: 0,
      acessos: 0
    };

    pageData.boxes.stats = [
      { label: 'Total de registros', icon: '📝', iconClass: 'ic-blue', value: String(ind.total), note: 'Auditoria geral', noteClass: 'note-muted' },
      { label: 'Erros', icon: '🚨', iconClass: 'ic-red', value: String(ind.erros), note: 'Falhas e exceções', noteClass: 'note-red' },
      { label: 'Avisos', icon: '⚠', iconClass: 'ic-yellow', value: String(ind.avisos), note: 'Alertas de segurança', noteClass: 'note-orange' },
      { label: 'Acessos', icon: '👤', iconClass: 'ic-green', value: String(ind.acessos), note: 'Logins e autenticações', noteClass: 'note-green' }
    ];
  },

  recomputeUnidadesStats(pageData) {
    if (!pageData?.boxes) return;
    const lista = pageData.boxes.lista || [];
    if (!Array.isArray(lista) || lista.length === 0) return;
    const operacionais = lista.filter(u => u.status === 'Operacional').length;
    const emManutencao = lista.filter(u => u.status === 'Manutenção' || u.status === 'Inativa').length;
    const total = lista.length;

    pageData.boxes.stats = [
      { label: 'Total de Unidades', icon: '🏥', iconClass: 'ic-red', value: String(total).padStart(2, '0'), note: 'Unidades cadastradas', noteClass: 'note-muted' },
      { label: 'Operacionais', icon: '✅', iconClass: 'ic-green', value: String(operacionais).padStart(2, '0'), note: 'Funcionando normalmente', noteClass: 'note-green' },
      { label: 'Em Manutenção', icon: '🔧', iconClass: 'ic-orange', value: String(emManutencao).padStart(2, '0'), note: 'Temporariamente inativas', noteClass: 'note-orange' },
      { label: 'Capacidade Total', icon: '👥', iconClass: 'ic-blue', value: '12.5k', note: 'Leitos disponíveis', noteClass: 'note-muted' }
    ];
  },

  async refreshStats(pageId) {
    try {
      if (pageId === 'agendamentos') {
        this.recomputeAgendamentosStats(this.data.agendamentos);
      } else if (pageId === 'consultas') {
        this.recomputeConsultasStats(this.data.consultas);
      } else if (pageId === 'exames') {
        this.recomputeExamesStats(this.data.exames);
      } else if (pageId === 'unidades') {
        this.recomputeUnidadesStats(this.data.unidades);
      } else if (pageId === 'logs') {
        this.recomputeLogsStats(this.data.logs);
      } else if (pageId === 'dashboard') {
        await Promise.all([
          this.ensureDataset('agendamentos', 'json/agendamentos.json'),
          this.ensureDataset('exames', 'json/exames.json')
        ]);
        this.recomputeDashboardStats();
      }
    } catch (err) {
      console.error('Erro ao recalcular estatísticas de', pageId, err);
    }
  },

  // Restringe os dados de Agendamentos/Consultas/Exames aos registros do
  // próprio Cidadão logado. Nunca altera o objeto original em this.data
  // (que fica em cache e é compartilhado entre telas) — sempre devolve uma
  // cópia rasa com só o array da tela filtrado. Para os demais perfis
  // (equipe), os dados voltam sem nenhuma alteração.
  filtrarDadosParaCidadao(pageId, pageData) {
    const u = this.usuario;
    if (!u || (u.perfil !== 'Cidadão' && u.perfil !== 'Paciente') || !pageData || !pageData.boxes) return pageData;

    const cpfLimpo = String(u.cpf || '').replace(/\D/g, '');
    const nomeLimpo = String(u.nome || '').trim().toLowerCase();
    const clone = { ...pageData, boxes: { ...pageData.boxes } };

    if (pageId === 'agendamentos' && Array.isArray(clone.boxes.lista)) {
      clone.boxes.lista = clone.boxes.lista.filter(r => String(r.cpf || '').replace(/\D/g, '') === cpfLimpo);
    } else if (pageId === 'consultas' && Array.isArray(clone.boxes.consultas)) {
      clone.boxes.consultas = clone.boxes.consultas.filter(r => String(r.paciente || '').trim().toLowerCase() === nomeLimpo);
    } else if (pageId === 'exames' && Array.isArray(clone.boxes.lista)) {
      clone.boxes.lista = clone.boxes.lista.filter(r => String(r.paciente || '').trim().toLowerCase() === nomeLimpo);
    }

    return clone;
  },

  buildSidebar() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav || !this.navegacao?.itens) return;

    const icons = {
      dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
      agendamentos: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
      consultas: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>',
      exames: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>',
      vacinacao: '<path d="m18 2 4 4-4 4M14.5 9.5 18 6M4 20l6-6M9 9l6 6M14.5 14.5l3.5 3.5M6 6l2 2"/>',
      unidades: '<path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>',
      logs: '<path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/>',
      'cadastro-usuarios': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>'
    };

    // Regras de quem vê o quê estão centralizadas em js/config/permissoes.js.
    const paginasVisiveis = window.Permissoes?.paginasVisiveis(this.usuario?.perfil) || [];
    const mainItems = this.navegacao.itens.filter(item => {
      if (item.id === 'configuracoes' || item.id === 'perfil') return false;
      return paginasVisiveis.includes(item.id);
    });

    nav.innerHTML = mainItems.map(item => `
      <div class="nav-item${item.id === this.currentPage ? ' active' : ''}" data-page="${item.id}" role="button" tabindex="0">
        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">${icons[item.id] || ''}</svg>
        ${item.label}
      </div>`).join('');
  },

  bindNavigation() {
    document.addEventListener('click', e => {
      const nav = e.target.closest('[data-page]');
      if (nav && nav.dataset.page) {
        e.preventDefault();
        const dropdown = document.getElementById('user-dropdown-menu');
        if (dropdown) dropdown.style.display = 'none';
        this.goTo(nav.dataset.page);
        return;
      }

      const navAttr = e.target.closest('[data-nav]');
      if (navAttr && navAttr.dataset.nav) {
        e.preventDefault();
        this.goTo(navAttr.dataset.nav);
        return;
      }

      if (e.target.id === 'app-modal') {
        this.closeModal();
      }

      const searchWrap = document.getElementById('search-wrap-container');
      if (searchWrap && !searchWrap.contains(e.target)) {
        const dropdown = document.getElementById('search-results-dropdown');
        if (dropdown) dropdown.style.display = 'none';
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.closeModal();
        const dropdown = document.getElementById('search-results-dropdown');
        if (dropdown) dropdown.style.display = 'none';
      }
    });
  },

  bindGlobalActions() {
    const sair = document.getElementById('btn-sair');
    if (sair) {
      sair.addEventListener('click', () => {
        this.showModal({
          title: 'Encerrar Sessão',
          bodyHtml: '<p style="font-size:14px;color:var(--text)">Deseja realmente sair do sistema UPA 24H?</p>',
          confirmText: 'Sair do Sistema',
          cancelText: 'Cancelar',
          onConfirm: async () => {
            this.toast('Sessão encerrada com sucesso.', 'info');
            await window.AuthAPI?.logout();
            this.usuario = null;
            this.showLoginOverlay();
            return true;
          }
        });
      });
    }

    const btnNotif = document.getElementById('btn-header-notif');
    if (btnNotif) {
      btnNotif.addEventListener('click', () => {
        this.showNotificationsModal();
      });
    }

    const buscaInput = document.getElementById('busca-global');
    if (buscaInput) {
      buscaInput.addEventListener('input', e => {
        this.handleGlobalSearch(e.target.value.trim());
      });
      buscaInput.addEventListener('focus', e => {
        if (e.target.value.trim()) this.handleGlobalSearch(e.target.value.trim());
      });
    }

    // User pill dropdown menu toggle
    const userPill = document.getElementById('user-pill');
    const userDropdown = document.getElementById('user-dropdown-menu');
    if (userPill && userDropdown) {
      userPill.onclick = (e) => {
        e.stopPropagation();
        const isVisible = userDropdown.style.display === 'block';
        userDropdown.style.display = isVisible ? 'none' : 'block';
      };

      document.addEventListener('click', (e) => {
        if (!userPill.contains(e.target) && !userDropdown.contains(e.target)) {
          userDropdown.style.display = 'none';
        }
      });
    }

    const dropdownSair = document.getElementById('dropdown-btn-sair');
    if (dropdownSair) {
      dropdownSair.onclick = () => {
        if (userDropdown) userDropdown.style.display = 'none';
        const btnSair = document.getElementById('btn-sair');
        if (btnSair) btnSair.click();
      };
    }
  },

  async goTo(pageId) {
    if (!this.checkLogin(pageId)) return;

    // Regra: Áreas administrativas (como Logs de Sistema) são restritas ao Administrador
    const isAdminArea = pageId === 'logs' || pageId === 'cadastro-usuarios';
    const perfil = window.Permissoes?.normalizarPerfil(this.usuario?.perfil);
    if (isAdminArea && perfil !== 'Administrador') {
      window.AuditoriaService?.registrar({
        usuario: this.usuario?.nome || 'Usuário',
        acao: 'Tentativa de Acesso Negado',
        tipo: 'Aviso',
        modulo: 'SEGURANÇA',
        descricao: `Usuário "${this.usuario?.nome}" (${this.usuario?.perfil}) tentou acessar a área administrativa restrita "${pageId}" sem permissão de Administrador.`
      });
      const fallbackPage = window.Permissoes?.paginaInicial(this.usuario?.perfil) || 'agendamentos';
      this.toast(`Acesso negado: a página "${pageId}" é restrita a administradores.`, 'warning');
      if (pageId !== fallbackPage) {
        return this.goTo(fallbackPage);
      }
      return;
    }

    // Validação com middleware de controle de acesso por perfil via AuthAPI/Permissoes
    const token = window.AuthAPI?.getTokenLocal();
    const acesso = window.AuthAPI?.verificarAcesso(token, { pagina: pageId });
    if (acesso && !acesso.permitido) {
      window.AuditoriaService?.registrar({
        usuario: this.usuario?.nome || 'Usuário',
        acao: 'Tentativa de Acesso Negado',
        tipo: 'Aviso',
        modulo: 'SEGURANÇA',
        descricao: acesso.error || `Acesso negado à página "${pageId}".`
      });
      const fallbackPage = window.Permissoes?.paginaInicial(this.usuario?.perfil) || 'agendamentos';
      this.toast(acesso.error || `Acesso negado: perfil não autorizado para acessar "${pageId}".`, 'warning');
      if (pageId !== fallbackPage) {
        return this.goTo(fallbackPage);
      }
      return;
    }

    const item = this.navegacao?.itens?.find(i => i.id === pageId);
    if (!item) return;

    this.currentPage = pageId;
    const container = document.getElementById('screen-container');
    container.innerHTML = '<div class="loading-screen">Carregando tela...</div>';

    document.querySelectorAll('.nav-item[data-page]').forEach(n => {
      n.classList.toggle('active', n.dataset.page === pageId);
    });

    try {
      let pageData = this.data[pageId];
      let html = item._htmlCache;

      if (!html || !pageData) {
        const [htmlRes, jsonRes] = await Promise.all([
          this.fetchText(item.arquivo),
          this.fetchJson(item.json)
        ]);
        html = item._htmlCache = htmlRes;
        if (!this.data[pageId]) {
          this.data[pageId] = jsonRes;
        }
        pageData = this.data[pageId];
      }

      // O Cidadão voltou a ter login neste sistema web, mas só pode ver os
      // próprios dados (ver js/config/permissoes.js). Para os demais perfis
      // (equipe), a lista completa é exibida normalmente.
      const filteredData = this.filtrarDadosParaCidadao(pageId, pageData);

      // Recalcula os cards de estatística (Total de Cidadãos, Confirmados,
      // Aguardando Laudo etc.) a partir dos dados reais antes de desenhar a
      // tela — é isto que corrige os cards travados/estáticos.
      await this.refreshStats(pageId);

      container.innerHTML = html;
      const page = container.querySelector('.page');
      if (page) page.classList.add('active');

      window.Render?.resetarPaginacao(pageId);
      window.Render?.renderPage(pageId, filteredData, this.usuario);
      this.bindPageActions(pageId);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      container.innerHTML = `<p class="screen-error">Não foi possível carregar a tela "${pageId}".</p>`;
    }
  },

  showModal({ title, bodyHtml, confirmText = 'Salvar', cancelText = 'Cancelar', onConfirm = null }) {
    const modal = document.getElementById('app-modal');
    if (!modal) return;
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" type="button" onclick="App.closeModal()">&times;</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-sm" type="button" onclick="App.closeModal()">${cancelText}</button>
          ${confirmText ? `<button class="btn btn-primary btn-sm" id="modal-confirm-btn" type="button">${confirmText}</button>` : ''}
        </div>
      </div>
    `;
    modal.classList.add('active');

    if (onConfirm && document.getElementById('modal-confirm-btn')) {
      document.getElementById('modal-confirm-btn').addEventListener('click', async () => {
        const success = await onConfirm();
        if (success !== false) {
          this.closeModal();
        }
      });
    }
  },

  closeModal() {
    const modal = document.getElementById('app-modal');
    if (modal) modal.classList.remove('active');
  },

  toast(msg, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    const icons = { success: '✅', info: 'ℹ️', warning: '⚠️', danger: '❌' };
    el.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> <span>${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      setTimeout(() => el.remove(), 300);
    }, 3200);
  },

  handleGlobalSearch(query) {
    const dropdown = document.getElementById('search-results-dropdown');
    if (!dropdown) return;

    if (!query || query.length < 2) {
      dropdown.style.display = 'none';
      return;
    }

    const q = query.toLowerCase();
    const results = [];

    const agList = this.data.agendamentos?.boxes?.lista || [];
    agList.forEach(item => {
      if (item.paciente.toLowerCase().includes(q) || item.cpf.includes(q) || item.especialidade.toLowerCase().includes(q)) {
        results.push({
          title: item.paciente,
          sub: `${item.especialidade} · ${item.data} ${item.horario}`,
          cat: 'Agendamento',
          action: () => this.showAgendamentoModal(item)
        });
      }
    });

    const conList = this.data.consultas?.boxes?.consultas || [];
    conList.forEach(item => {
      if (item.paciente.toLowerCase().includes(q) || item.medico.toLowerCase().includes(q) || item.especialidade.toLowerCase().includes(q)) {
        results.push({
          title: item.paciente,
          sub: `Consulta: ${item.especialidade} (${item.status})`,
          cat: 'Consulta',
          action: () => this.showConsultaModal(item.paciente)
        });
      }
    });

    const exList = this.data.exames?.boxes?.lista || [];
    exList.forEach(item => {
      if (item.paciente.toLowerCase().includes(q) || item.tipo.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)) {
        results.push({
          title: item.paciente,
          sub: `Exame: ${item.tipo} (${item.status})`,
          cat: 'Exame',
          action: () => this.showExameModal(item.id)
        });
      }
    });

    const unList = this.data.unidades?.boxes?.lista || [];
    unList.forEach(item => {
      if (item.nome.toLowerCase().includes(q) || item.endereco.toLowerCase().includes(q) || item.tipo.toLowerCase().includes(q)) {
        results.push({
          title: item.nome,
          sub: `${item.tipo} · ${item.endereco}`,
          cat: 'Unidade',
          action: () => this.showUnidadeModal(item.id)
        });
      }
    });

    if (results.length === 0) {
      dropdown.innerHTML = '<div style="padding:12px;font-size:12.5px;color:var(--text-muted);text-align:center">Nenhum resultado encontrado.</div>';
    } else {
      dropdown.innerHTML = results.slice(0, 7).map((r, i) => `
        <div class="search-result-item" data-search-index="${i}">
          <div>
            <div style="font-weight:600">${r.title}</div>
            <div style="font-size:11px;color:var(--text-muted)">${r.sub}</div>
          </div>
          <span class="search-result-category">${r.cat}</span>
        </div>
      `).join('');

      dropdown.querySelectorAll('[data-search-index]').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.dataset.searchIndex, 10);
          dropdown.style.display = 'none';
          results[idx]?.action();
        });
      });
    }

    dropdown.style.display = 'block';
  },

  showNotificationsModal() {
    const alerts = this.data.dashboard?.boxes?.alertas || [];
    const html = `
      <div style="display:flex;flex-direction:column;gap:10px">
        ${alerts.map(a => `
          <div class="alert-item" style="border:1px solid var(--border);border-radius:8px">
            <div class="alert-ico a-warn">
              <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m10.29 3.86-8.19 14.17A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.72-3l-8.19-14.14a2 2 0 0 0-3.46.01z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="alert-body">
              <strong>${a.titulo}</strong>
              <p>${a.descricao}</p>
            </div>
          </div>
        `).join('')}
        <div class="alert-item" style="border:1px solid var(--border);border-radius:8px">
          <div class="alert-ico a-info">ℹ️</div>
          <div class="alert-body">
            <strong>Atualização de Sistema</strong>
            <p>Versão 3.2.1 ativa e sincronizada com banco de dados de saúde.</p>
          </div>
        </div>
      </div>
    `;
    this.showModal({
      title: 'Notificações & Alertas Rápidos',
      bodyHtml: html,
      confirmText: 'Entendido',
      cancelText: 'Fechar',
      onConfirm: () => true
    });
  },

  bindPageActions(pageId) {
    const root = document.getElementById('screen-container');
    if (!root) return;

    root.addEventListener('click', e => {
      const actEl = e.target.closest('[data-action]');
      if (!actEl) return;
      const action = actEl.dataset.action;
      const id = actEl.dataset.id;
      const paciente = actEl.dataset.paciente;

      if (action === 'view-agendamento') {
        const item = this.data.agendamentos?.boxes?.lista?.find(a => a.id === id);
        this.showAgendamentoModal(item || { id: id || '#10291', paciente: actEl.dataset.nome || 'Luciana Ferreira', status: 'Confirmado' });
      } else if (action === 'edit-agendamento') {
        const item = this.data.agendamentos?.boxes?.lista?.find(a => a.id === id);
        if (item) this.showEditarAgendamentoModal(item);
      } else if (action === 'confirm-agendamento') {
        if (window.AgendamentosAPI) {
          window.AgendamentosAPI.confirmar(id, this.usuario?.nome).then(res => {
            this.toast(res.body?.message || 'Agendamento confirmado com sucesso.', 'success');
            this.data.agendamentos.boxes.lista = window.AgendamentosAPI.getAll();
            this.saveState();
            this.goTo('agendamentos');
          });
        } else {
          const item = this.data.agendamentos?.boxes?.lista?.find(a => a.id === id);
          if (item) {
            item.status = 'Confirmado';
            item.badge = 'b-green';
            this.saveState();
            this.toast('Agendamento confirmado com sucesso.', 'success');
            this.goTo('agendamentos');
          }
        }
      } else if (action === 'cancel-agendamento' || action === 'refuse-agendamento') {
        const item = this.data.agendamentos?.boxes?.lista?.find(a => a.id === id);
        if (item) this.showCancelarAgendamentoModal(item);
      } else if (action === 'view-agenda-medico') {
        this.showAgendaMedicoModal(actEl.dataset.medico);
      } else if (action === 'view-consulta') {
        this.showConsultaModal(paciente);
      } else if (action === 'view-exame') {
        this.showExameModal(id);
      } else if (action === 'edit-exame') {
        const item = this.data.exames?.boxes?.lista?.find(e => e.id === id);
        if (item) this.showEditarExameModal(item);
      } else if (action === 'historico-exames') {
        const pacienteKey = actEl.dataset.paciente || actEl.dataset.cpf || id;
        this.showHistoricoExamesModal(pacienteKey);
      } else if (action === 'laudo-exame') {
        this.showLaudoExameModal(id);
      } else if (action === 'download-exame') {
        const content = `================================================
UPA 24H - SAÚDE PÚBLICA DIGITAL
LAUDO MÉDICO E DIAGNÓSTICO
================================================
Identificador: ${id || 'EX-9921'}
Cidadão: Denilson Barrios
Data de Emissão: 14/08/2026
Assinado Digitalmente por: Dr. Roberto Alencar (CRM-SP 99182)

Resultado Diagnóstico:
- Exame processado sem alterações patológicas observadas.
- Parâmetros fisiológicos dentro da normalidade.

Certificado ICP-Brasil: e-Saúde Válido.
================================================`;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Laudo_Exame_${id || 'EX-9921'}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.toast(`Laudo ${id} baixado com sucesso!`, 'success');
      } else if (action === 'view-vacina') {
        this.toast(`Vacina: ${actEl.dataset.nome}`, 'info');
      } else if (action === 'view-unidade' || action === 'edit-unidade') {
        this.showUnidadeModal(id);
      } else if (action === 'view-log') {
        const idx = parseInt(actEl.dataset.index, 10);
        this.showLogModal(idx);
      } else if (action === 'click-atendimento') {
        this.toast(`Atendimento de: ${actEl.dataset.nome}`, 'info');
      }
    });

    if (pageId === 'dashboard') {
      const btnDashAgendar = document.getElementById('btn-dash-agendar');
      if (btnDashAgendar) {
        btnDashAgendar.onclick = () => this.showNovoAgendamentoModal();
      }
    }

    if (pageId === 'agendamentos') {
      const btnNovo = document.getElementById('btn-novo-agendamento');
      if (btnNovo) btnNovo.onclick = () => this.showNovoAgendamentoModal();

      const btnExport = document.getElementById('btn-exportar-agendamentos');
      if (btnExport) btnExport.onclick = () => this.exportTableToCSV('agendamentos');

      const btnFiltrar = document.getElementById('btn-filtrar-agendamentos');
      const btnLimpar = document.getElementById('btn-limpar-agendamentos');
      const inputBusca = document.getElementById('filter-agendamentos-busca');
      const inputStatus = document.getElementById('filter-agendamentos-status');
      const inputUnidade = document.getElementById('filter-agendamentos-unidade');
      const inputDataInicio = document.getElementById('filter-agendamentos-data-inicio');
      const inputDataFim = document.getElementById('filter-agendamentos-data-fim');
      const inputEspec = document.getElementById('filter-agendamentos-especialidade');

      const runFilter = () => {
        const q = inputBusca?.value.trim().toLowerCase() || '';
        const st = inputStatus?.value || '';
        const un = inputUnidade?.value || '';
        const dtIniStr = inputDataInicio?.value || '';
        const dtFimStr = inputDataFim?.value || '';
        const espec = inputEspec?.value || '';

        const lista = this.data.agendamentos?.boxes?.lista || [];
        const filtered = lista.filter(item => {
          const matchQ = !q || (item.paciente || '').toLowerCase().includes(q) || (item.cpf || '').includes(q) || (item.id || '').toLowerCase().includes(q);
          const matchStatus = !st || item.status === st;
          const matchUnidade = !un || item.unidade === un;
          const matchEspec = !espec || item.especialidade === espec;

          let matchPeriodo = true;
          if (dtIniStr || dtFimStr) {
            const dtItem = window.AgendamentosAPI?.parseDataHora(item.data, item.horario) || null;
            if (dtItem) {
              if (dtIniStr) {
                const d1 = window.AgendamentosAPI.parseDataHora(dtIniStr, '00:00');
                if (d1 && dtItem < d1) matchPeriodo = false;
              }
              if (dtFimStr) {
                const d2 = window.AgendamentosAPI.parseDataHora(dtFimStr, '23:59');
                if (d2 && dtItem > d2) matchPeriodo = false;
              }
            }
          }

          return matchQ && matchStatus && matchUnidade && matchEspec && matchPeriodo;
        });

        Render.resetarPaginacao('agendamentos');
        Render.renderAgendamentos(root, {
          boxes: {
            ...this.data.agendamentos.boxes,
            lista: filtered
          }
        });
      };

      if (btnFiltrar) btnFiltrar.onclick = runFilter;
      if (btnLimpar) {
        btnLimpar.onclick = () => {
          if (inputBusca) inputBusca.value = '';
          if (inputStatus) inputStatus.value = '';
          if (inputUnidade) inputUnidade.value = '';
          if (inputDataInicio) inputDataInicio.value = '';
          if (inputDataFim) inputDataFim.value = '';
          if (inputEspec) inputEspec.value = '';
          runFilter();
        };
      }
      if (inputBusca) inputBusca.onkeyup = runFilter;
      if (inputStatus) inputStatus.onchange = runFilter;
      if (inputUnidade) inputUnidade.onchange = runFilter;
      if (inputDataInicio) inputDataInicio.onchange = runFilter;
      if (inputDataFim) inputDataFim.onchange = runFilter;
      if (inputEspec) inputEspec.onchange = runFilter;
    }

    if (pageId === 'consultas') {
      const btnNova = document.getElementById('btn-nova-consulta');
      if (btnNova) btnNova.onclick = () => this.showNovaConsultaModal();

      const btnVerAgenda = document.getElementById('btn-ver-agenda-medico');
      if (btnVerAgenda) {
        btnVerAgenda.onclick = () => {
          const medSelecionado = document.getElementById('filter-consultas-medico')?.value || (this.usuario?.perfil === 'Profissional da Saúde' ? this.usuario.nome : 'Dr. Manoel Joaquim');
          this.showAgendaMedicoModal(medSelecionado);
        };
      }

      const filterMedico = document.getElementById('filter-consultas-medico');
      const filterEspec = document.getElementById('filter-consultas-especialidade');
      const filterStatus = document.getElementById('filter-consultas-status');
      const filterBusca = document.getElementById('filter-consultas-busca');
      const btnFiltrar = document.getElementById('btn-filtrar-consultas');
      const btnLimpar = document.getElementById('btn-limpar-consultas');

      const runFilterConsultas = () => {
        const med = filterMedico?.value || '';
        const esp = filterEspec?.value || '';
        const st = filterStatus?.value || '';
        const q = filterBusca?.value.trim().toLowerCase() || '';

        const lista = this.data.consultas?.boxes?.consultas || [];
        const filtered = lista.filter(c => {
          const matchMed = !med || (c.medico || '').toLowerCase().includes(med.toLowerCase());
          const matchEsp = !esp || (c.especialidade || '').toLowerCase() === esp.toLowerCase();
          const matchSt = !st || (c.status || '').toLowerCase() === st.toLowerCase();
          const matchQ = !q || (c.paciente || '').toLowerCase().includes(q) || (c.cid || '').toLowerCase().includes(q) || (c.id || '').toLowerCase().includes(q);
          return matchMed && matchEsp && matchSt && matchQ;
        });

        Render.resetarPaginacao('consultas');
        Render.renderConsultas(root, { boxes: { ...this.data.consultas.boxes, consultas: filtered } });
      };

      if (btnFiltrar) btnFiltrar.onclick = runFilterConsultas;
      if (btnLimpar) {
        btnLimpar.onclick = () => {
          if (filterMedico) filterMedico.value = '';
          if (filterEspec) filterEspec.value = '';
          if (filterStatus) filterStatus.value = '';
          if (filterBusca) filterBusca.value = '';
          runFilterConsultas();
        };
      }
      if (filterMedico) filterMedico.onchange = runFilterConsultas;
      if (filterEspec) filterEspec.onchange = runFilterConsultas;
      if (filterStatus) filterStatus.onchange = runFilterConsultas;
      if (filterBusca) filterBusca.onkeyup = runFilterConsultas;
    }

    if (pageId === 'exames') {
      const btnSolicitar = document.getElementById('btn-solicitar-exame');
      if (btnSolicitar) btnSolicitar.onclick = () => this.showSolicitarExameModal();

      const btnExport = document.getElementById('btn-exportar-exames');
      if (btnExport) btnExport.onclick = () => this.exportTableToCSV('exames');

      const inputBusca = document.getElementById('filter-exames-busca');
      const inputStatus = document.getElementById('filter-exames-status');
      const inputDataInicio = document.getElementById('filter-exames-data-inicio');
      const inputDataFim = document.getElementById('filter-exames-data-fim');
      const btnFiltrar = document.getElementById('btn-filtrar-exames');
      const btnLimpar = document.getElementById('btn-limpar-exames');

      // Sincroniza dados com ExamesAPI
      if (window.ExamesAPI) {
        if (!this.data.exames) this.data.exames = { boxes: {} };
        this.data.exames.boxes.lista = window.ExamesAPI.getAll();
      }

      const runFilter = () => {
        const busca = inputBusca?.value.trim() || '';
        const status = inputStatus?.value || '';
        const dataInicio = inputDataInicio?.value || '';
        const dataFim = inputDataFim?.value || '';

        const filtros = { busca, status, dataInicio, dataFim };

        let filtered = [];
        if (window.ExamesAPI) {
          const res = window.ExamesAPI.listar(filtros);
          filtered = res.data;
        } else {
          const lista = this.data.exames?.boxes?.lista || [];
          filtered = lista.filter(item => {
            const matchQ = !busca || item.paciente.toLowerCase().includes(busca.toLowerCase()) || item.tipo.toLowerCase().includes(busca.toLowerCase());
            const matchStatus = !status || item.status === status;
            return matchQ && matchStatus;
          });
        }

        // Restrição para Cidadão
        if (['Cidadão', 'Paciente'].includes(this.usuario?.perfil)) {
          const nomeLimpo = String(this.usuario?.nome || '').trim().toLowerCase();
          filtered = filtered.filter(r => String(r.paciente || '').trim().toLowerCase() === nomeLimpo);
        }

        // Atualiza dinamicamente os 4 indicadores de exames
        this.recomputeExamesStats(this.data.exames, filtros);
        const statsBox = root.querySelector('[data-box="stats"]');
        if (statsBox && this.data.exames.boxes.stats) {
          Render.renderStats(statsBox, this.data.exames.boxes.stats);
        }

        Render.resetarPaginacao('exames');
        Render.renderExames(root, { boxes: { ...this.data.exames.boxes, lista: filtered } });
      };

      if (btnFiltrar) btnFiltrar.onclick = runFilter;
      if (inputBusca) inputBusca.onkeyup = runFilter;
      if (inputStatus) inputStatus.onchange = runFilter;
      if (inputDataInicio) inputDataInicio.onchange = runFilter;
      if (inputDataFim) inputDataFim.onchange = runFilter;

      if (btnLimpar) {
        btnLimpar.onclick = () => {
          if (inputBusca) inputBusca.value = '';
          if (inputStatus) inputStatus.value = '';
          if (inputDataInicio) inputDataInicio.value = '';
          if (inputDataFim) inputDataFim.value = '';
          runFilter();
        };
      }
    }

    if (pageId === 'vacinacao') {
      const btnRegistrar = document.getElementById('btn-registrar-vacinacao');
      if (btnRegistrar) btnRegistrar.onclick = () => this.showRegistrarVacinaModal();

      const btnRelatorio = document.getElementById('btn-relatorio-insumos');
      if (btnRelatorio) btnRelatorio.onclick = () => this.showRelatorioInsumosModal();
    }

    if (pageId === 'unidades') {
      const btnNovo = document.getElementById('btn-novo-chamado');
      if (btnNovo) btnNovo.onclick = () => this.showNovoChamadoModal();

      const btnRelatorio = document.getElementById('btn-relatorio-insumos-unidades');
      if (btnRelatorio) btnRelatorio.onclick = () => this.showRelatorioInsumosModal();

      const inputBusca = document.getElementById('filter-unidades-busca');
      const inputTipo = document.getElementById('filter-unidades-tipo');
      const inputStatus = document.getElementById('filter-unidades-status');
      const btnFiltrar = document.getElementById('btn-filtrar-unidades');
      const btnLimpar = document.getElementById('btn-limpar-unidades');

      const runFilter = () => {
        const q = inputBusca?.value.trim().toLowerCase() || '';
        const tp = inputTipo?.value || '';
        const st = inputStatus?.value || '';

        const lista = this.data.unidades?.boxes?.lista || [];
        const filtered = lista.filter(u => {
          const matchQ = !q || (u.nome && u.nome.toLowerCase().includes(q)) || (u.endereco && u.endereco.toLowerCase().includes(q));
          const matchTipo = !tp || u.tipo === tp;
          const matchStatus = !st || u.status === st;
          return matchQ && matchTipo && matchStatus;
        });

        Render.resetarPaginacao('unidades');
        Render.renderUnidades(root, { boxes: { ...this.data.unidades.boxes, lista: filtered } });
      };

      if (btnFiltrar) btnFiltrar.onclick = runFilter;
      if (btnLimpar) {
        btnLimpar.onclick = () => {
          if (inputBusca) inputBusca.value = '';
          if (inputTipo) inputTipo.value = '';
          if (inputStatus) inputStatus.value = '';
          runFilter();
        };
      }
      if (inputBusca) inputBusca.onkeyup = runFilter;
      if (inputTipo) inputTipo.onchange = runFilter;
      if (inputStatus) inputStatus.onchange = runFilter;
    }

    if (pageId === 'logs') {
      const btnExport = document.getElementById('btn-exportar-logs');
      if (btnExport) btnExport.onclick = () => this.exportTableToCSV('logs');

      const filterTipo = document.getElementById('filter-logs-tipo');
      const filterUsuario = document.getElementById('filter-logs-usuario');
      const filterDataInicio = document.getElementById('filter-logs-data-inicio');
      const filterDataFim = document.getElementById('filter-logs-data-fim');
      const filterBusca = document.getElementById('filter-logs-busca');
      const btnFiltrar = document.getElementById('btn-filtrar-logs');
      const btnLimpar = document.getElementById('btn-limpar-logs');

      // Sincroniza com AuditoriaService
      if (window.AuditoriaService) {
        if (!this.data.logs) this.data.logs = { boxes: {} };
        this.data.logs.boxes.registros = window.AuditoriaService.getAll();
        this.data.logs.boxes.lista = this.data.logs.boxes.registros;
      }

      const runFilter = () => {
        const tipo = filterTipo?.value || '';
        const usuario = filterUsuario?.value.trim() || '';
        const dataInicio = filterDataInicio?.value || '';
        const dataFim = filterDataFim?.value || '';
        const busca = filterBusca?.value.trim() || '';

        const filtros = { tipo, usuario, dataInicio, dataFim, busca };

        let filtered = [];
        if (window.AuditoriaService) {
          const res = window.AuditoriaService.listar(filtros);
          filtered = res.data;
        } else {
          const registros = this.data.logs?.boxes?.registros || [];
          filtered = registros.filter(r => {
            const matchQ = !busca || (r.titulo || r.acao || '').toLowerCase().includes(busca.toLowerCase());
            const matchTipo = !tipo || (r.tipo || '').toLowerCase() === tipo.toLowerCase();
            return matchQ && matchTipo;
          });
        }

        // Atualiza dinamicamente os 4 indicadores de logs (Total de registros, Erros, Avisos, Acessos)
        this.recomputeLogsStats(this.data.logs, filtros);
        const statsBox = root.querySelector('[data-box="stats"]');
        if (statsBox && this.data.logs.boxes.stats) {
          Render.renderStats(statsBox, this.data.logs.boxes.stats);
        }

        Render.resetarPaginacao('logs');
        Render.renderLogs(root, { boxes: { ...this.data.logs.boxes, registros: filtered, lista: filtered } });
      };

      if (btnFiltrar) btnFiltrar.onclick = runFilter;
      if (filterTipo) filterTipo.onchange = runFilter;
      if (filterUsuario) filterUsuario.onkeyup = runFilter;
      if (filterDataInicio) filterDataInicio.onchange = runFilter;
      if (filterDataFim) filterDataFim.onchange = runFilter;
      if (filterBusca) filterBusca.onkeyup = runFilter;

      if (btnLimpar) {
        btnLimpar.onclick = () => {
          if (filterTipo) filterTipo.value = '';
          if (filterUsuario) filterUsuario.value = '';
          if (filterDataInicio) filterDataInicio.value = '';
          if (filterDataFim) filterDataFim.value = '';
          if (filterBusca) filterBusca.value = '';
          runFilter();
        };
      }
    }

    if (pageId === 'configuracoes') {
      const btnSalvar = document.getElementById('btn-salvar-config');
      if (btnSalvar) {
        btnSalvar.onclick = () => {
          const nome = document.getElementById('cfg-nome')?.value.trim();
          const email = document.getElementById('cfg-email')?.value.trim();
          const cargo = document.getElementById('cfg-cargo')?.value.trim();
          const unidade = document.getElementById('cfg-unidade')?.value.trim();

          if (nome) this.usuario.nome = nome;
          if (email) this.usuario.email = email;
          if (cargo) this.usuario.cargo = cargo;
          if (unidade) this.usuario.unidade = unidade;

          this.applySettings();
          this.applyUsuario();
          this.saveState();
          this.toast('Configurações salvas com sucesso!', 'success');
        };
      }
    }

    if (pageId === 'perfil') {
      const savePerfil = () => {
        const nome = document.getElementById('perfil-edit-nome')?.value.trim();
        const email = document.getElementById('perfil-edit-email')?.value.trim();
        const cargo = document.getElementById('perfil-edit-cargo')?.value.trim();
        const unidade = document.getElementById('perfil-edit-unidade')?.value.trim();
        const telefone = document.getElementById('perfil-edit-telefone')?.value.trim();

        if (nome) this.usuario.nome = nome;
        if (email) this.usuario.email = email;
        if (cargo) this.usuario.cargo = cargo;
        if (unidade) this.usuario.unidade = unidade;
        if (telefone) this.usuario.telefone = telefone;

        this.applySettings();
        this.applyUsuario();
        this.saveState();

        if (window.Render) {
          window.Render.renderPerfil(root, this.usuario);
        }

        this.toast('Perfil e configurações atualizados com sucesso!', 'success');
      };

      const btnSalvar = document.getElementById('btn-salvar-perfil');
      if (btnSalvar) btnSalvar.onclick = savePerfil;

      const btnSalvarTop = document.getElementById('btn-salvar-perfil-top');
      if (btnSalvarTop) btnSalvarTop.onclick = savePerfil;

      const btnFoto = document.getElementById('btn-alterar-foto');
      const inputFoto = document.getElementById('input-foto-avatar');
      if (btnFoto) {
        btnFoto.onclick = () => {
          if (inputFoto) inputFoto.click();
        };
      }
      if (inputFoto) {
        inputFoto.onchange = e => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = ev => {
              this.usuario.avatarUrl = ev.target.result;
              this.applyUsuario();
              this.saveState();
              this.toast('Foto de perfil atualizada com sucesso!', 'success');
            };
            reader.readAsDataURL(file);
          }
        };
      }



      const btnRecuperacao = document.getElementById('btn-confirmar-recuperacao');
      if (btnRecuperacao) {
        btnRecuperacao.onclick = () => {
          const cpfInput = document.getElementById('recupera-cpf');
          if (!cpfInput || !cpfInput.value) {
            this.toast('Por favor, digite seu CPF.', 'warning');
            return;
          }
          this.toast('Solicitação enviada ao T.I com sucesso!', 'success');
          cpfInput.value = '';
          document.getElementById('form-recuperar-senha').style.display = 'none';
          const btnEsqueceu = document.getElementById('btn-esqueceu-senha');
          if (btnEsqueceu) btnEsqueceu.style.display = '';
        };
      }
    }

    document.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
        if (!isNaN(this.textContent)) this.classList.add('active');
      });
    });
  },

  showNovoAgendamentoModal() {
    const minDate = new Date(Date.now() + 24 * 3600 * 1000);
    const minDateStr = minDate.toISOString().split('T')[0];

    const html = `
      <form id="form-novo-agendamento" onsubmit="return false;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:9px 12px;margin-bottom:14px;font-size:12px;color:#1e40af">
          ℹ️ <strong>Regra RN01:</strong> Agendamentos devem ser solicitados com <strong>antecedência mínima de 24 horas</strong>. O sistema valida automaticamente o horário e a disponibilidade do médico.
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>CPF do Cidadão</label>
            <input type="text" id="ag-cpf" placeholder="000.000.000-00" maxlength="14" required>
          </div>
          <div class="form-group">
            <label>Nome do Cidadão</label>
            <input type="text" id="ag-paciente" placeholder="Digite o CPF para buscar..." required readonly style="background:var(--bg); color:var(--text); cursor:not-allowed;">
          </div>
          <div class="form-group">
            <label>Data do Agendamento (Mínimo 24h - RN01)</label>
            <input type="date" id="ag-data" min="${minDateStr}" value="${minDateStr}" required>
          </div>
          <div class="form-group">
            <label>Horário</label>
            <input type="time" id="ag-horario" value="14:30" required>
          </div>
          <div class="form-group">
            <label>Especialidade</label>
            <select id="ag-especialidade">
              <option value="Clínica Geral">Clínica Geral</option>
              <option value="Cardiologia">Cardiologia</option>
              <option value="Ginecologia">Ginecologia</option>
              <option value="Ortopedia">Ortopedia</option>
              <option value="Dermatologia">Dermatologia</option>
              <option value="Pediatria">Pediatria</option>
              <option value="Neurologia">Neurologia</option>
            </select>
          </div>
          <div class="form-group">
            <label>Médico Responsável</label>
            <select id="ag-medico">
              <option value="Dr. Manoel Joaquim">Dr. Manoel Joaquim (Clínica Geral)</option>
              <option value="Dr. Arnaldo Luiz">Dr. Arnaldo Luiz (Cardiologia)</option>
              <option value="Dra. Heloísa Rocha">Dra. Heloísa Rocha (Ginecologia)</option>
              <option value="Dr. Carlos Mendes">Dr. Carlos Mendes (Ortopedia)</option>
              <option value="Dra. Patrícia Souza">Dra. Patrícia Souza (Dermatologia)</option>
              <option value="Dr. Paulo Ribeiro">Dr. Paulo Ribeiro (Neurologia)</option>
              <option value="Dra. Camila Torres">Dra. Camila Torres (Pediatria)</option>
            </select>
          </div>
          <div class="form-group full">
            <label>Unidade de Saúde</label>
            <select id="ag-unidade">
              <option value="Unidade Central">Unidade Central</option>
              <option value="Unidade Oeste">Unidade Oeste</option>
              <option value="Unidade Sul">Unidade Sul</option>
              <option value="Unidade Norte">Unidade Norte</option>
              <option value="Unidade Leste">Unidade Leste</option>
            </select>
          </div>
        </div>
      </form>
    `;

    this.showModal({
      title: 'Agendar Novo Atendimento (RN01)',
      bodyHtml: html,
      confirmText: 'Confirmar Agendamento',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        const paciente = document.getElementById('ag-paciente')?.value.trim();
        const cpf = document.getElementById('ag-cpf')?.value.trim();
        const data = document.getElementById('ag-data')?.value;
        const horario = document.getElementById('ag-horario')?.value;
        const especialidade = document.getElementById('ag-especialidade')?.value;
        const medico = document.getElementById('ag-medico')?.value;
        const unidade = document.getElementById('ag-unidade')?.value;

        if (!paciente || !cpf || paciente.includes('Digite o CPF') || paciente.includes('não localizado')) {
          this.toast('Cidadão não identificado. Insira um CPF cadastrado.', 'warning');
          return false;
        }

        const dados = {
          paciente, cpf, data, horario, especialidade, medico, unidade,
          perfilOperador: this.usuario?.perfil
        };

        const res = window.AgendamentosAPI
          ? await window.AgendamentosAPI.solicitar(dados, this.usuario?.nome)
          : await fetch('/agendamentos/solicitar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dados)
            }).then(async r => ({ status: r.status, body: await r.json() }));

        if (!res.body?.success) {
          this.toast(res.body?.error || 'Erro ao solicitar agendamento.', 'warning');
          return false;
        }

        if (window.AgendamentosAPI) {
          if (!this.data.agendamentos) this.data.agendamentos = { boxes: { lista: [] } };
          this.data.agendamentos.boxes.lista = window.AgendamentosAPI.getAll();
        }

        this.saveState();
        this.toast(res.body?.message || 'Agendamento solicitado com sucesso!', 'success');
        if (this.currentPage === 'agendamentos' || this.currentPage === 'dashboard') {
          this.goTo(this.currentPage);
        }
        return true;
      }
    });

    const agCpf = document.getElementById('ag-cpf');
    const agPaciente = document.getElementById('ag-paciente');
    if (agCpf && agPaciente) {
      agCpf.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length <= 11) {
          if (val.length > 9) val = val.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
          else if (val.length > 6) val = val.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
          else if (val.length > 3) val = val.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
          e.target.value = val;
        }

        const cleanCPF = val.replace(/\D/g, '');
        if (cleanCPF.length === 11) {
          const dbUsers = this.initUsuariosDB();
          const patient = dbUsers.find(u => (u.perfil === 'Cidadão' || u.perfil === 'Paciente') && u.cpf.replace(/\D/g, '') === cleanCPF);
          if (patient) {
            agPaciente.value = patient.nome;
            agPaciente.removeAttribute('placeholder');
            this.toast('Cidadão localizado!', 'success');
          } else {
            agPaciente.value = '';
            agPaciente.placeholder = 'Cidadão não localizado. Cadastre-o primeiro.';
            this.toast('Nenhum cidadão localizado com este CPF.', 'warning');
          }
        } else {
          agPaciente.value = '';
          agPaciente.placeholder = 'Digite o CPF para buscar...';
        }
      });
    }
  },

  showEditarAgendamentoModal(item) {
    const dataISO = window.AgendamentosAPI?.normalizarDataISO(item.data) || '2026-05-08';
    const html = `
      <form id="form-editar-agendamento" onsubmit="return false;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:9px 12px;margin-bottom:14px;font-size:12px;color:#1e40af">
          ℹ️ <strong>Regra RN02:</strong> Alterações e remarcações exigem <strong>antecedência mínima de 24 horas</strong> em relação ao horário original agendado. O sistema verifica conflitos de horário com o profissional da saúde.
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>ID do Agendamento</label>
            <input type="text" value="${item.id}" readonly style="background:var(--bg);font-family:'DM Mono',monospace;cursor:not-allowed">
          </div>
          <div class="form-group">
            <label>Cidadão</label>
            <input type="text" value="${item.paciente} (CPF: ${item.cpf})" readonly style="background:var(--bg);cursor:not-allowed">
          </div>
          <div class="form-group">
            <label>Nova Data (RN02)</label>
            <input type="date" id="edit-ag-data" value="${dataISO}" required>
          </div>
          <div class="form-group">
            <label>Novo Horário</label>
            <input type="time" id="edit-ag-horario" value="${item.horario || '14:00'}" required>
          </div>
          <div class="form-group">
            <label>Especialidade</label>
            <select id="edit-ag-especialidade">
              <option value="Clínica Geral" ${item.especialidade === 'Clínica Geral' ? 'selected' : ''}>Clínica Geral</option>
              <option value="Cardiologia" ${item.especialidade === 'Cardiologia' ? 'selected' : ''}>Cardiologia</option>
              <option value="Ginecologia" ${item.especialidade === 'Ginecologia' ? 'selected' : ''}>Ginecologia</option>
              <option value="Ortopedia" ${item.especialidade === 'Ortopedia' ? 'selected' : ''}>Ortopedia</option>
              <option value="Dermatologia" ${item.especialidade === 'Dermatologia' ? 'selected' : ''}>Dermatologia</option>
              <option value="Pediatria" ${item.especialidade === 'Pediatria' ? 'selected' : ''}>Pediatria</option>
              <option value="Neurologia" ${item.especialidade === 'Neurologia' ? 'selected' : ''}>Neurologia</option>
            </select>
          </div>
          <div class="form-group">
            <label>Médico Responsável</label>
            <select id="edit-ag-medico">
              <option value="Dr. Manoel Joaquim" ${item.medico === 'Dr. Manoel Joaquim' ? 'selected' : ''}>Dr. Manoel Joaquim</option>
              <option value="Dr. Arnaldo Luiz" ${item.medico === 'Dr. Arnaldo Luiz' ? 'selected' : ''}>Dr. Arnaldo Luiz</option>
              <option value="Dra. Heloísa Rocha" ${item.medico === 'Dra. Heloísa Rocha' ? 'selected' : ''}>Dra. Heloísa Rocha</option>
              <option value="Dr. Carlos Mendes" ${item.medico === 'Dr. Carlos Mendes' ? 'selected' : ''}>Dr. Carlos Mendes</option>
              <option value="Dra. Patrícia Souza" ${item.medico === 'Dra. Patrícia Souza' ? 'selected' : ''}>Dra. Patrícia Souza</option>
              <option value="Dr. Paulo Ribeiro" ${item.medico === 'Dr. Paulo Ribeiro' ? 'selected' : ''}>Dr. Paulo Ribeiro</option>
              <option value="Dra. Camila Torres" ${item.medico === 'Dra. Camila Torres' ? 'selected' : ''}>Dra. Camila Torres</option>
            </select>
          </div>
          <div class="form-group full">
            <label>Unidade de Saúde</label>
            <select id="edit-ag-unidade">
              <option value="Unidade Central" ${item.unidade === 'Unidade Central' ? 'selected' : ''}>Unidade Central</option>
              <option value="Unidade Oeste" ${item.unidade === 'Unidade Oeste' ? 'selected' : ''}>Unidade Oeste</option>
              <option value="Unidade Sul" ${item.unidade === 'Unidade Sul' ? 'selected' : ''}>Unidade Sul</option>
              <option value="Unidade Norte" ${item.unidade === 'Unidade Norte' ? 'selected' : ''}>Unidade Norte</option>
              <option value="Unidade Leste" ${item.unidade === 'Unidade Leste' ? 'selected' : ''}>Unidade Leste</option>
            </select>
          </div>
        </div>
      </form>
    `;

    this.showModal({
      title: `Alterar Agendamento ${item.id}`,
      bodyHtml: html,
      confirmText: 'Salvar Alteração (RN02)',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        const data = document.getElementById('edit-ag-data')?.value;
        const horario = document.getElementById('edit-ag-horario')?.value;
        const especialidade = document.getElementById('edit-ag-especialidade')?.value;
        const medico = document.getElementById('edit-ag-medico')?.value;
        const unidade = document.getElementById('edit-ag-unidade')?.value;

        const dados = {
          id: item.id,
          data,
          horario,
          especialidade,
          medico,
          unidade,
          perfilOperador: this.usuario?.perfil
        };

        const res = window.AgendamentosAPI
          ? await window.AgendamentosAPI.alterar(dados, this.usuario?.nome)
          : await fetch('/agendamentos/alterar', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dados)
            }).then(async r => ({ status: r.status, body: await r.json() }));

        if (!res.body?.success) {
          this.toast(res.body?.error || 'Erro ao alterar agendamento.', 'warning');
          return false;
        }

        if (window.AgendamentosAPI) {
          this.data.agendamentos.boxes.lista = window.AgendamentosAPI.getAll();
        }
        this.saveState();
        this.toast(res.body?.message || 'Agendamento alterado com sucesso!', 'success');
        this.goTo('agendamentos');
        return true;
      }
    });
  },

  showCancelarAgendamentoModal(item) {
    const ehEquipe = ['Administrador', 'Recepção'].includes(this.usuario?.perfil);
    const html = ehEquipe ? `
      <div>
        <p style="font-size:13.5px;color:var(--text);margin-bottom:12px">
          Você está executando o <strong>Cancelamento Administrativo (RN03)</strong> para o agendamento <strong class="mono" style="color:var(--primary)">${item.id}</strong> do cidadão <strong>${item.paciente}</strong>.
        </p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:9px 12px;margin-bottom:14px;font-size:12px;color:#991b1b">
          ⚠️ <strong>Regra RN03:</strong> O cancelamento administrativo pela equipe é permitido a qualquer momento, mas <strong>exige obrigatoriamente a justificativa do cancelamento</strong> para registro em auditoria.
        </div>
        <div class="form-group">
          <label style="font-size:11.5px;font-weight:700;color:var(--danger)">JUSTIFICATIVA ADMINISTRATIVA (OBRIGATÓRIA - RN03)</label>
          <textarea id="cancel-justificativa" class="filter-input" rows="3" placeholder="Informe o motivo administrativo (ex.: ausência imprevista do profissional, manutenção de equipamento na unidade, remanejamento de escala)..." style="width:100%;resize:vertical" required></textarea>
        </div>
      </div>
    ` : `
      <div>
        <p style="font-size:13.5px;color:var(--text);margin-bottom:12px">
          Deseja realmente cancelar seu agendamento <strong class="mono" style="color:var(--primary)">${item.id}</strong> marcado para <strong>${item.data} às ${item.horario}</strong> com ${item.medico}?
        </p>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:9px 12px;font-size:12px;color:#1e40af">
          ℹ️ <strong>Regra RN02:</strong> Cancelamentos pelo cidadão devem respeitar a <strong>antecedência mínima de 24 horas</strong> do horário marcado.
        </div>
      </div>
    `;

    this.showModal({
      title: ehEquipe ? `Cancelamento Administrativo (RN03) - ${item.id}` : `Cancelar Agendamento ${item.id}`,
      bodyHtml: html,
      confirmText: 'Confirmar Cancelamento',
      cancelText: 'Voltar',
      onConfirm: async () => {
        const justificativaEl = document.getElementById('cancel-justificativa');
        const justificativa = justificativaEl ? justificativaEl.value.trim() : '';

        if (ehEquipe && !justificativa) {
          this.toast('RN03: Informe obrigatoriamente a justificativa do cancelamento administrativo.', 'warning');
          return false;
        }

        const dados = {
          id: item.id,
          tipo: ehEquipe ? 'ADMINISTRATIVO' : 'CIDADAO',
          justificativa,
          perfilOperador: this.usuario?.perfil
        };

        const res = window.AgendamentosAPI
          ? await window.AgendamentosAPI.cancelar(dados, this.usuario?.nome)
          : await fetch('/agendamentos/cancelar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dados)
            }).then(async r => ({ status: r.status, body: await r.json() }));

        if (!res.body?.success) {
          this.toast(res.body?.error || 'Erro ao cancelar agendamento.', 'warning');
          return false;
        }

        if (window.AgendamentosAPI) {
          this.data.agendamentos.boxes.lista = window.AgendamentosAPI.getAll();
        }
        this.saveState();
        this.toast(res.body?.message || 'Agendamento cancelado com sucesso.', 'success');
        this.goTo('agendamentos');
        return true;
      }
    });
  },

  showAgendaMedicoModal(nomeMedicoInicial = 'Dr. Manoel Joaquim') {
    const medicosDisponiveis = [
      'Dr. Manoel Joaquim',
      'Dr. Arnaldo Luiz',
      'Dra. Heloísa Rocha',
      'Dr. Carlos Mendes',
      'Dra. Patrícia Souza',
      'Dr. Paulo Ribeiro',
      'Dra. Camila Torres'
    ];

    const medicoAtual = nomeMedicoInicial || medicosDisponiveis[0];
    const agendaData = window.ConsultasAPI?.getAgendaProfissional(medicoAtual) || { agenda: {} };
    const { agenda } = agendaData;

    const optionsMedicos = medicosDisponiveis.map(m =>
      `<option value="${m}" ${m === medicoAtual ? 'selected' : ''}>${m}</option>`
    ).join('');

    const consultasHtml = (agenda.consultasHoje || []).map(c => `
      <tr>
        <td class="mono fw-600">${c.inicio}</td>
        <td><strong>${c.paciente}</strong> <span style="font-size:11px;color:var(--text-muted)">(${c.idade || 'Adulto'})</span></td>
        <td class="mono">${c.duracao || '—'}</td>
        <td>${window.Render ? window.Render.badge(c.status, c.badge) : c.status}</td>
        <td class="mono text-muted-sm">${c.cid || '—'}</td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Nenhuma consulta agendada para hoje.</td></tr>';

    const agendamentosFuturosHtml = (agenda.agendamentosFuturos || []).map(a => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:12.5px">
        <div><strong>${a.paciente}</strong> <span style="color:var(--text-muted)">(${a.data} às ${a.horario})</span></div>
        <div>${window.Render ? window.Render.badge(a.status, a.badge) : a.status}</div>
      </div>
    `).join('') || '<div style="color:var(--text-muted);font-size:12px;padding:6px 0">Nenhum agendamento futuro no momento.</div>';

    const html = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg);padding:10px 14px;border-radius:8px">
          <div>
            <label style="font-size:11px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:4px">SELECIONAR PROFISSIONAL DA SAÚDE</label>
            <select id="select-agenda-medico-modal" class="filter-select" style="min-width:220px;font-weight:600">
              ${optionsMedicos}
            </select>
          </div>
          <div style="text-align:right">
            <span style="font-size:11px;color:var(--text-muted);display:block">Especialidade</span>
            <strong style="color:var(--primary);font-size:13.5px">${agenda.especialidade || 'Clínica Geral'}</strong>
          </div>
        </div>

        <div class="stats-grid cols4" style="margin-bottom:4px">
          <div class="stat-card" style="padding:10px 14px">
            <div class="stat-label">Agendadas</div>
            <div class="stat-value" style="font-size:20px">${agenda.indicadores?.agendadas || 0}</div>
          </div>
          <div class="stat-card" style="padding:10px 14px">
            <div class="stat-label">Fila de Espera</div>
            <div class="stat-value" style="font-size:20px">${agenda.indicadores?.aguardando || 0}</div>
          </div>
          <div class="stat-card" style="padding:10px 14px">
            <div class="stat-label">Tempo Médio</div>
            <div class="stat-value" style="font-size:20px">${agenda.indicadores?.tempoMedioEspera || '18 min'}</div>
          </div>
          <div class="stat-card" style="padding:10px 14px">
            <div class="stat-label">Canceladas</div>
            <div class="stat-value" style="font-size:20px;color:var(--danger)">${agenda.indicadores?.canceladas || 0}</div>
          </div>
        </div>

        <div>
          <h4 style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--text)">Grade de Atendimentos do Dia</h4>
          <div class="tbl-wrap" style="max-height:200px;overflow-y:auto">
            <table>
              <thead><tr><th>Horário</th><th>Paciente</th><th>Duração</th><th>Status</th><th>CID</th></tr></thead>
              <tbody>${consultasHtml}</tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 style="font-size:13px;font-weight:700;margin-bottom:6px;color:var(--text)">Próximos Agendamentos Confirmados / Pendentes</h4>
          <div style="max-height:130px;overflow-y:auto;background:var(--bg);border-radius:8px;padding:8px 12px">
            ${agendamentosFuturosHtml}
          </div>
        </div>
      </div>
    `;

    this.showModal({
      title: `Agenda do Profissional: ${medicoAtual}`,
      bodyHtml: html,
      confirmText: null,
      cancelText: 'Fechar Agenda',
      onConfirm: null
    });

    setTimeout(() => {
      const sel = document.getElementById('select-agenda-medico-modal');
      if (sel) {
        sel.onchange = () => {
          this.closeModal();
          setTimeout(() => this.showAgendaMedicoModal(sel.value), 50);
        };
      }
    }, 50);
  },

  showAgendamentoModal(item) {
    const isCidadao = this.usuario?.perfil === 'Cidadão' || this.usuario?.perfil === 'Paciente' || this.usuario?.cargo === 'Cidadão' || this.usuario?.cargo === 'Paciente';
    const podeGerenciar = window.Permissoes?.podeGerenciarAtendimentos(this.usuario?.perfil);
    
    let botoesAcaoModal = '';
    if (item.status !== 'Cancelado') {
      if (podeGerenciar) {
        botoesAcaoModal = `
          <div style="display:flex;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
            <button class="btn btn-outline" id="btn-modal-alterar-ag" style="flex:1">Alterar (RN02)</button>
            <button class="btn btn-outline" id="btn-modal-cancelar-ag" style="flex:1;color:var(--danger);border-color:var(--danger)">Cancelar (RN03)</button>
          </div>
        `;
      } else if (isCidadao) {
        botoesAcaoModal = `
          <div style="display:flex;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)">
            <button class="btn btn-outline" id="btn-modal-alterar-ag" style="flex:1">Alterar Agendamento</button>
            <button class="btn btn-outline" id="btn-modal-cancelar-ag" style="flex:1;color:var(--danger);border-color:var(--danger)">Cancelar</button>
          </div>
        `;
      }
    }

    const html = `
      <div style="display:flex;flex-direction:column;gap:12px;font-size:13.5px">
        <div style="display:flex;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid var(--border)">
          <span style="color:var(--text-muted)">ID Agendamento:</span>
          <strong class="mono" style="color:var(--primary)">${item.id || '#10291'}</strong>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Cidadão:</span>
          <strong>${item.paciente || 'Luciana Ferreira'}</strong>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">CPF:</span>
          <span>${item.cpf || '123.456.789-00'}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Data & Horário:</span>
          <span>${item.data || '07/05/2026'} às <strong>${item.horario || '13:20'}</strong></span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Especialidade:</span>
          <span>${item.especialidade || 'Clínica Geral'}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Médico Responsável:</span>
          <span>${item.medico || 'Dr. Manoel Joaquim'}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Unidade:</span>
          <span>${item.unidade || 'Unidade Central'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="color:var(--text-muted)">Status Atual:</span>
          <span>${window.Render ? window.Render.badge(item.status, item.badge) : item.status}</span>
        </div>
        ${item.motivoCancelamento ? `
          <div style="background:#fee2e2;color:#991b1b;padding:8px 12px;border-radius:6px;font-size:12px">
            <strong>Motivo do Cancelamento:</strong> ${item.motivoCancelamento}
          </div>
        ` : ''}
        ${botoesAcaoModal}
      </div>
    `;

    this.showModal({
      title: `Detalhes do Agendamento ${item.id || ''}`,
      bodyHtml: html,
      confirmText: null,
      cancelText: 'Fechar',
      onConfirm: null
    });

    setTimeout(() => {
      const btnAlt = document.getElementById('btn-modal-alterar-ag');
      if (btnAlt) {
        btnAlt.onclick = () => {
          this.closeModal();
          setTimeout(() => this.showEditarAgendamentoModal(item), 50);
        };
      }
      const btnCanc = document.getElementById('btn-modal-cancelar-ag');
      if (btnCanc) {
        btnCanc.onclick = () => {
          this.closeModal();
          setTimeout(() => this.showCancelarAgendamentoModal(item), 50);
        };
      }
    }, 50);
  },

  showNovaConsultaModal() {
    const html = `
      <form id="form-nova-consulta" onsubmit="return false;">
        <div class="form-grid">
          <div class="form-group">
            <label>CPF do Cidadão</label>
            <input type="text" id="cs-cpf" placeholder="000.000.000-00" maxlength="14" required>
          </div>
          <div class="form-group">
            <label>Nome do Cidadão</label>
            <input type="text" id="cs-paciente" placeholder="Digite o CPF para buscar..." required readonly style="background:var(--bg); color:var(--text); cursor:not-allowed;">
          </div>
          <div class="form-group">
            <label>Idade</label>
            <input type="text" id="cs-idade" placeholder="Aguardando CPF..." required readonly style="background:var(--bg); color:var(--text); cursor:not-allowed;">
          </div>
          <div class="form-group">
            <label>Especialidade</label>
            <select id="cs-especialidade">
              <option value="Clínica Geral">Clínica Geral</option>
              <option value="Cardiologia">Cardiologia</option>
              <option value="Ginecologia">Ginecologia</option>
              <option value="Ortopedia">Ortopedia</option>
              <option value="Pediatria">Pediatria</option>
            </select>
          </div>
          <div class="form-group">
            <label>Médico</label>
            <input type="text" id="cs-medico" value="Dr. Manoel Joaquim" required>
          </div>
          <div class="form-group">
            <label>Horário de Início</label>
            <input type="time" id="cs-inicio" value="14:00" required>
          </div>
          <div class="form-group full">
            <label>Código CID-10 Diagnosticado</label>
            <input type="text" id="cs-cid" placeholder="Ex.: J00, I10, E11">
          </div>
        </div>
      </form>
    `;

    this.showModal({
      title: 'Iniciar Nova Consulta Médica',
      bodyHtml: html,
      confirmText: 'Registrar Consulta',
      cancelText: 'Cancelar',
      onConfirm: () => {
        const paciente = document.getElementById('cs-paciente')?.value.trim();
        const cpf = document.getElementById('cs-cpf')?.value.trim();
        const idade = document.getElementById('cs-idade')?.value.trim();
        const especialidade = document.getElementById('cs-especialidade')?.value;
        const medico = document.getElementById('cs-medico')?.value;
        const inicio = document.getElementById('cs-inicio')?.value;
        const cid = document.getElementById('cs-cid')?.value || '—';

        if (!paciente || !cpf || paciente.includes('Digite o CPF') || paciente.includes('não localizado')) {
          this.toast('Cidadão não identificado. Insira um CPF cadastrado.', 'warning');
          return false;
        }

        const nextNum = 100 + (this.data.consultas?.boxes?.consultas?.length || 0) + 1;
        const newConsulta = {
          id: `CS-${nextNum}`,
          paciente,
          cpf,
          idade: idade || '30 anos',
          especialidade,
          medico,
          inicio: inicio || '14:00',
          duracao: 'Em andamento',
          status: 'Em Andamento',
          badge: 'b-blue',
          cid,
          data: new Date().toLocaleDateString('pt-BR')
        };

        if (!this.data.consultas) this.data.consultas = { boxes: { consultas: [] } };
        this.data.consultas.boxes.consultas.unshift(newConsulta);
        this.recomputeConsultasStats(this.data.consultas);
        this.saveState();
        if (window.ConsultasAPI) {
          window.ConsultasAPI.persist(this.data.consultas.boxes.consultas);
        }

        // Registra log de auditoria do início da consulta
        const operador = this.usuario ? this.usuario.nome : 'sistema';
        this.addLog(
          'SUCESSO',
          `Consulta iniciada para o cidadão: ${paciente}`,
          `Módulo: CONSULTAS · Operador: ${operador} · Médico: ${medico} · Especialidade: ${especialidade}`
        );

        this.toast(`Consulta de ${paciente} iniciada com sucesso!`, 'success');
        if (this.currentPage === 'consultas') this.goTo('consultas');
        return true;
      }
    });

    const csCpf = document.getElementById('cs-cpf');
    const csPaciente = document.getElementById('cs-paciente');
    const csIdade = document.getElementById('cs-idade');
    if (csCpf && csPaciente && csIdade) {
      csCpf.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length <= 11) {
          if (val.length > 9) val = val.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
          else if (val.length > 6) val = val.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
          else if (val.length > 3) val = val.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
          e.target.value = val;
        }

        const cleanCPF = val.replace(/\D/g, '');
        if (cleanCPF.length === 11) {
          const dbUsers = this.initUsuariosDB();
          const patient = dbUsers.find(u => u.perfil === 'Cidadão' && u.cpf.replace(/\D/g, '') === cleanCPF);
          if (patient) {
            csPaciente.value = patient.nome;
            let ageStr = "30 anos";
            if (patient.nascimento) {
              const birthDate = new Date(patient.nascimento);
              const age = new Date().getFullYear() - birthDate.getFullYear();
              ageStr = `${age} anos`;
            }
            csIdade.value = ageStr;
            this.toast('Cidadão localizado!', 'success');
          } else {
            csPaciente.value = '';
            csIdade.value = '';
            csPaciente.placeholder = 'Cidadão não localizado. Cadastre-o primeiro.';
            this.toast('Nenhum cidadão localizado com este CPF.', 'warning');
          }
        } else {
          csPaciente.value = '';
          csIdade.value = '';
          csPaciente.placeholder = 'Digite o CPF para buscar...';
        }
      });
    }
  },

  showConsultaModal(pacienteNome) {
    const consulta = this.data.consultas?.boxes?.consultas?.find(c => c.paciente === pacienteNome) || {
      paciente: pacienteNome || 'Luciana Ferreira',
      idade: '42 anos',
      especialidade: 'Clínica Geral',
      medico: 'Dr. Manoel Joaquim',
      inicio: '13:20',
      duracao: '18 min',
      status: 'Concluída',
      cid: 'J00'
    };

    const cids = {
      J00: 'Nasofaringite aguda (resfriado comum)',
      I10: 'Hipertensão essencial (primária)',
      E11: 'Diabetes mellitus tipo 2',
      M54: 'Dorsalgia / Dor nas costas'
    };

    const html = `
      <div style="font-size:13.5px;display:flex;flex-direction:column;gap:14px">
        <div style="padding:12px;background:var(--primary-light);border-radius:8px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <strong style="font-size:15px;color:var(--primary)">${consulta.paciente}</strong>
            <div style="font-size:11.5px;color:var(--text-muted)">Idade: ${consulta.idade} · Especialidade: ${consulta.especialidade}</div>
          </div>
          <span class="badge b-green">${consulta.status}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><strong>Médico:</strong> ${consulta.medico}</div>
          <div><strong>Início:</strong> <span class="mono">${consulta.inicio}</span></div>
          <div><strong>Duração:</strong> ${consulta.duracao}</div>
          <div><strong>CID-10:</strong> <span class="mono fw-600">${consulta.cid}</span></div>
        </div>
        <div style="border-top:1px solid var(--border);padding-top:10px">
          <strong style="display:block;margin-bottom:4px">Descrição Diagnóstica:</strong>
          <p style="color:var(--text-muted);font-size:12.5px">${cids[consulta.cid] || 'Atendimento clínico com prescrição e orientação preventiva.'}</p>
        </div>
        <div style="border-top:1px solid var(--border);padding-top:10px">
          <strong style="display:block;margin-bottom:4px">Prescrição Médica & Recomendações:</strong>
          <ul style="padding-left:18px;font-size:12.5px;color:var(--text);display:flex;flex-direction:column;gap:4px">
            <li>Paracetamol 750mg - 1 comprimido de 8/8h se dor ou febre</li>
            <li>Repouso e hidratação oral constante (mínimo 2L/dia)</li>
            <li>Retorno em caso de persistência dos sintomas por mais de 5 dias</li>
          </ul>
        </div>
      </div>
    `;

    this.showModal({
      title: `Prontuário Eletrônico – ${consulta.paciente}`,
      bodyHtml: html,
      confirmText: 'Imprimir Prontuário',
      cancelText: 'Fechar',
      onConfirm: () => {
        this.toast('Prontuário enviado para a impressora hospitalar.', 'info');
        return true;
      }
    });
  },

  showSolicitarExameModal() {
    const hojeStr = new Date().toISOString().split('T')[0];
    const prevDate = new Date(Date.now() + 3 * 24 * 3600 * 1000);
    const prevStr = prevDate.toISOString().split('T')[0];

    const html = `
      <form id="form-solicitar-exame" onsubmit="return false;">
        <div class="form-grid">
          <div class="form-group">
            <label>CPF do Cidadão</label>
            <input type="text" id="ex-cpf" placeholder="000.000.000-00" maxlength="14" required>
          </div>
          <div class="form-group">
            <label>Nome do Cidadão *</label>
            <input type="text" id="ex-paciente" placeholder="Digite o CPF para buscar..." required readonly style="background:var(--bg); color:var(--text); cursor:not-allowed;">
          </div>
          <div class="form-group">
            <label>ID Cidadão (PID / SUS)</label>
            <input type="text" id="ex-pid" placeholder="Aguardando CPF..." required readonly style="background:var(--bg); color:var(--text); cursor:not-allowed;">
          </div>
          <div class="form-group">
            <label>Tipo de Exame *</label>
            <select id="ex-tipo" required>
              <option value="Hemograma Completo">Hemograma Completo</option>
              <option value="Glicemia em Jejum">Glicemia em Jejum</option>
              <option value="Raio-X Tórax">Raio-X Tórax</option>
              <option value="Tomografia Crânio">Tomografia Crânio</option>
              <option value="Ultrassom Abdominal">Ultrassom Abdominal</option>
              <option value="ECG">ECG</option>
              <option value="Urina Tipo I">Urina Tipo I</option>
              <option value="Colesterol Total e Frações">Colesterol Total e Frações</option>
            </select>
          </div>
          <div class="form-group">
            <label>Data do Exame *</label>
            <input type="date" id="ex-data" value="${hojeStr}" required>
          </div>
          <div class="form-group">
            <label>Horário *</label>
            <input type="time" id="ex-horario" value="08:00" required>
          </div>
          <div class="form-group">
            <label>Unidade de Saúde *</label>
            <select id="ex-unidade" required>
              <option value="UPA 24h Central">UPA 24h Central</option>
              <option value="UPA 24h Jardim Sul">UPA 24h Jardim Sul</option>
              <option value="UBS Vila Nova">UBS Vila Nova</option>
              <option value="Hospital Central Municipal">Hospital Central Municipal</option>
            </select>
          </div>
          <div class="form-group">
            <label>Solicitado por (Médico) *</label>
            <input type="text" id="ex-medico" value="Dr. Arnaldo Luiz" required>
          </div>
          <div class="form-group">
            <label>Prioridade</label>
            <select id="ex-prioridade">
              <option value="Normal">Normal</option>
              <option value="Média">Média</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>
          <div class="form-group">
            <label>Data Prevista do Resultado</label>
            <input type="date" id="ex-data-prevista" value="${prevStr}">
          </div>
        </div>
      </form>
    `;

    this.showModal({
      title: 'Solicitar Exame Laboratorial',
      bodyHtml: html,
      confirmText: 'Enviar Solicitação',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        const paciente = document.getElementById('ex-paciente')?.value.trim();
        const cpf = document.getElementById('ex-cpf')?.value.trim();
        const pid = document.getElementById('ex-pid')?.value;
        const tipo = document.getElementById('ex-tipo')?.value;
        const solicitante = document.getElementById('ex-medico')?.value.trim();
        const prioridade = document.getElementById('ex-prioridade')?.value || 'Normal';
        const rawData = document.getElementById('ex-data')?.value;
        const horario = document.getElementById('ex-horario')?.value || '08:00';
        const unidade = document.getElementById('ex-unidade')?.value;
        const rawDataPrevista = document.getElementById('ex-data-prevista')?.value;

        if (!paciente || !cpf || paciente.includes('Digite o CPF') || paciente.includes('não localizado')) {
          this.toast('Cidadão não identificado. Insira um CPF cadastrado.', 'warning');
          return false;
        }

        let dataFmt = rawData;
        if (rawData && rawData.includes('-')) {
          const [y, m, d] = rawData.split('-');
          dataFmt = `${d}/${m}/${y}`;
        }
        let dataPrevistaFmt = rawDataPrevista;
        if (rawDataPrevista && rawDataPrevista.includes('-')) {
          const [y, m, d] = rawDataPrevista.split('-');
          dataPrevistaFmt = `${d}/${m}/${y}`;
        }

        const payload = {
          paciente,
          cpf,
          pid: pid || 'SUS-' + Math.floor(1000 + Math.random() * 9000),
          tipo,
          solicitante: solicitante || 'Dr. Arnaldo Luiz',
          unidade: unidade || 'UPA 24h Central',
          data: dataFmt || new Date().toLocaleDateString('pt-BR'),
          horario,
          prioridade,
          dataPrevista: dataPrevistaFmt || ''
        };

        let res;
        if (window.ExamesAPI) {
          res = await window.ExamesAPI.solicitar(payload, this.usuario?.nome || 'Operador');
        } else {
          const r = await fetch('/exames', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          res = { status: r.status, body: await r.json() };
        }

        if (res.status === 201) {
          this.toast(res.body?.message || 'Exame solicitado com sucesso!', 'success');
          if (window.ExamesAPI) {
            if (!this.data.exames) this.data.exames = { boxes: { lista: [] } };
            this.data.exames.boxes.lista = window.ExamesAPI.getAll();
          }
          await this.recomputeExamesStats(this.data.exames);
          this.saveState();
          if (this.currentPage === 'exames') this.goTo('exames');
          return true;
        } else {
          this.toast(res.body?.error || res.body?.message || 'Erro ao solicitar exame.', 'warning');
          return false;
        }
      }
    });

    const exCpf = document.getElementById('ex-cpf');
    const exPaciente = document.getElementById('ex-paciente');
    const exPid = document.getElementById('ex-pid');
    if (exCpf && exPaciente && exPid) {
      exCpf.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length <= 11) {
          if (val.length > 9) val = val.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
          else if (val.length > 6) val = val.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
          else if (val.length > 3) val = val.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
          e.target.value = val;
        }

        const cleanCPF = val.replace(/\D/g, '');
        if (cleanCPF.length === 11) {
          const dbUsers = this.initUsuariosDB();
          const patient = dbUsers.find(u => (u.perfil === 'Cidadão' || u.perfil === 'Paciente') && u.cpf.replace(/\D/g, '') === cleanCPF);
          if (patient) {
            exPaciente.value = patient.nome;
            exPid.value = patient.sus || `P-${Math.floor(4000 + Math.random() * 1000)}`;
            this.toast('Cidadão localizado!', 'success');
          } else {
            exPaciente.value = '';
            exPid.value = '';
            exPaciente.placeholder = 'Cidadão não localizado. Cadastre-o primeiro.';
            this.toast('Nenhum cidadão localizado com este CPF.', 'warning');
          }
        } else {
          exPaciente.value = '';
          exPid.value = '';
          exPaciente.placeholder = 'Digite o CPF para buscar...';
        }
      });
    }
  },

  showEditarExameModal(exame) {
    if (!exame) return;
    const isConcluido = String(exame.status || '').toLowerCase().includes('concl') ||
                        String(exame.status || '').toLowerCase().includes('laudo emit');
    if (isConcluido) {
      this.toast('Exames com status Concluído não podem ser alterados.', 'warning');
      return;
    }

    const toIsoDate = (dStr) => {
      if (!dStr) return '';
      if (dStr.includes('-')) return dStr;
      const parts = dStr.split('/');
      if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      return '';
    };

    const dataIso = toIsoDate(exame.data) || new Date().toISOString().split('T')[0];
    const dataPrevistaIso = toIsoDate(exame.dataPrevista) || '';

    const html = `
      <form id="form-editar-exame" onsubmit="return false;">
        <div class="form-grid">
          <div class="form-group full">
            <label>Cidadão</label>
            <input type="text" value="${exame.paciente} (${exame.cpf || exame.id})" readonly style="background:var(--bg);cursor:not-allowed">
          </div>
          <div class="form-group">
            <label>Tipo de Exame *</label>
            <select id="edit-ex-tipo" required>
              ${['Hemograma Completo', 'Glicemia em Jejum', 'Raio-X Tórax', 'Tomografia Crânio', 'Ultrassom Abdominal', 'ECG', 'Urina Tipo I', 'Colesterol Total e Frações'].map(t =>
                `<option value="${t}" ${exame.tipo === t ? 'selected' : ''}>${t}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Unidade de Saúde *</label>
            <select id="edit-ex-unidade" required>
              ${['UPA 24h Central', 'UPA 24h Jardim Sul', 'UBS Vila Nova', 'Hospital Central Municipal'].map(u =>
                `<option value="${u}" ${exame.unidade === u ? 'selected' : ''}>${u}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Data do Exame *</label>
            <input type="date" id="edit-ex-data" value="${dataIso}" required>
          </div>
          <div class="form-group">
            <label>Horário *</label>
            <input type="time" id="edit-ex-horario" value="${exame.horario || '08:00'}" required>
          </div>
          <div class="form-group">
            <label>Solicitado por (Médico) *</label>
            <input type="text" id="edit-ex-medico" value="${exame.solicitante || 'Dr. Arnaldo Luiz'}" required>
          </div>
          <div class="form-group">
            <label>Prioridade</label>
            <select id="edit-ex-prioridade">
              <option value="Normal" ${exame.prioridade === 'Normal' ? 'selected' : ''}>Normal</option>
              <option value="Média" ${exame.prioridade === 'Média' ? 'selected' : ''}>Média</option>
              <option value="Urgente" ${exame.prioridade === 'Urgente' ? 'selected' : ''}>Urgente</option>
            </select>
          </div>
          <div class="form-group">
            <label>Status do Exame</label>
            <select id="edit-ex-status">
              <option value="Solicitado" ${exame.status === 'Solicitado' ? 'selected' : ''}>Solicitado</option>
              <option value="Em andamento" ${exame.status === 'Em andamento' ? 'selected' : ''}>Em andamento</option>
              <option value="Concluído" ${exame.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
            </select>
          </div>
          <div class="form-group">
            <label>Data Prevista do Resultado</label>
            <input type="date" id="edit-ex-data-prevista" value="${dataPrevistaIso}">
          </div>
        </div>
      </form>
    `;

    this.showModal({
      title: `Alterar Exame – ${exame.id}`,
      bodyHtml: html,
      confirmText: 'Salvar Alterações',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        const tipo = document.getElementById('edit-ex-tipo')?.value;
        const unidade = document.getElementById('edit-ex-unidade')?.value;
        const rawData = document.getElementById('edit-ex-data')?.value;
        const horario = document.getElementById('edit-ex-horario')?.value;
        const solicitante = document.getElementById('edit-ex-medico')?.value;
        const prioridade = document.getElementById('edit-ex-prioridade')?.value;
        const status = document.getElementById('edit-ex-status')?.value;
        const rawDataPrevista = document.getElementById('edit-ex-data-prevista')?.value;

        let dataFmt = rawData;
        if (rawData && rawData.includes('-')) {
          const [y, m, d] = rawData.split('-');
          dataFmt = `${d}/${m}/${y}`;
        }
        let dataPrevistaFmt = rawDataPrevista;
        if (rawDataPrevista && rawDataPrevista.includes('-')) {
          const [y, m, d] = rawDataPrevista.split('-');
          dataPrevistaFmt = `${d}/${m}/${y}`;
        }

        const payload = {
          tipo,
          unidade,
          data: dataFmt,
          horario,
          solicitante,
          prioridade,
          status,
          dataPrevista: dataPrevistaFmt
        };

        let res;
        if (window.ExamesAPI) {
          res = await window.ExamesAPI.alterar(exame.id, payload, this.usuario?.nome || 'Operador');
        } else {
          const r = await fetch(`/exames/${encodeURIComponent(exame.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          res = { status: r.status, body: await r.json() };
        }

        if (res.status === 200) {
          this.toast(res.body?.message || 'Exame alterado com sucesso!', 'success');
          if (window.ExamesAPI) {
            if (!this.data.exames) this.data.exames = { boxes: { lista: [] } };
            this.data.exames.boxes.lista = window.ExamesAPI.getAll();
          }
          await this.recomputeExamesStats(this.data.exames);
          this.saveState();
          if (this.currentPage === 'exames') this.goTo('exames');
          return true;
        } else {
          this.toast(res.body?.error || res.body?.message || 'Erro ao alterar exame.', 'warning');
          return false;
        }
      }
    });
  },

  showHistoricoExamesModal(pacienteOuCpf) {
    let historico = [];
    if (window.ExamesAPI) {
      historico = window.ExamesAPI.getHistoricoPaciente(pacienteOuCpf);
    } else {
      const lista = this.data.exames?.boxes?.lista || [];
      const termo = String(pacienteOuCpf || '').toLowerCase();
      historico = lista.filter(e =>
        String(e.paciente || '').toLowerCase().includes(termo) ||
        String(e.cpf || '').replace(/\D/g, '').includes(termo.replace(/\D/g, '')) ||
        String(e.id || '').toLowerCase() === termo
      );
    }

    const pacienteNome = historico[0]?.paciente || pacienteOuCpf || 'Cidadão';

    const html = `
      <div style="font-size:13px;display:flex;flex-direction:column;gap:12px">
        <div style="padding:10px 12px;background:var(--primary-light);border-radius:8px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <strong style="color:var(--primary);font-size:14px">${pacienteNome}</strong>
            <div style="font-size:11.5px;color:var(--text-muted)">Histórico de Exames Laboratoriais e Diagnósticos</div>
          </div>
          <span class="badge b-blue">${historico.length} exame(s) registrado(s)</span>
        </div>
        ${historico.length === 0 ? `
          <div style="text-align:center;padding:24px;color:var(--text-muted)">Nenhum exame anterior registrado para este paciente.</div>
        ` : `
          <div style="max-height:360px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">
            <table class="data-table" style="width:100%;font-size:12px">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tipo de Exame</th>
                  <th>Data</th>
                  <th>Unidade</th>
                  <th>Solicitante</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${historico.map(e => {
                  const isConcluido = String(e.status || '').toLowerCase().includes('concl') || String(e.status || '').toLowerCase().includes('laudo emit');
                  const atrasado = window.ExamesAPI?.isAtrasado(e);
                  const st = atrasado ? 'Atrasado' : (isConcluido ? 'Concluído' : (e.status || 'Solicitado'));
                  const badge = atrasado ? 'b-red' : (isConcluido ? 'b-green' : (st === 'Em andamento' ? 'b-blue' : 'b-yellow'));
                  return `
                    <tr>
                      <td class="mono fw-600">${e.id}</td>
                      <td><strong>${e.tipo}</strong></td>
                      <td class="mono">${e.data}${e.horario ? ` ${e.horario}` : ''}</td>
                      <td>${e.unidade || 'Unidade Central'}</td>
                      <td>${e.solicitante || '—'}</td>
                      <td><span class="badge ${badge}">${st}</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    this.showModal({
      title: `Histórico de Exames – ${pacienteNome}`,
      bodyHtml: html,
      confirmText: null,
      cancelText: 'Fechar'
    });
  },

  showExameModal(id) {
    const exame = this.data.exames?.boxes?.lista?.find(e => e.id === id) || {
      id: id || '#EX-8821',
      paciente: 'Carlos Braga',
      pid: 'P-4521',
      tipo: 'Hemograma Completo',
      solicitante: 'Dr. Arnaldo Luiz',
      data: '07/05/2026',
      prioridade: 'Urgente',
      status: 'Aguardando'
    };

    const html = `
      <div style="font-size:13.5px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid var(--border)">
          <span style="color:var(--text-muted)">Código do Exame:</span>
          <strong class="mono" style="color:var(--primary)">${exame.id}</strong>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Cidadão:</span>
          <strong>${exame.paciente} (${exame.pid})</strong>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Tipo de Exame:</span>
          <span>${exame.tipo}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Solicitado por:</span>
          <span>${exame.solicitante}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Prioridade:</span>
          <span class="badge ${exame.priorBadge || 'b-red'}">${exame.prioridade}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Status Atual:</span>
          <span class="badge ${exame.statusBadge || 'b-yellow'}">${exame.status}</span>
        </div>
      </div>
    `;

    this.showModal({
      title: `Ficha de Exame ${exame.id}`,
      bodyHtml: html,
      confirmText: 'Ver Laudo',
      cancelText: 'Fechar',
      onConfirm: () => {
        this.closeModal();
        setTimeout(() => this.showLaudoExameModal(exame.id), 200);
        return false;
      }
    });
  },

  showLaudoExameModal(id) {
    const exame = this.data.exames?.boxes?.lista?.find(e => e.id === id) || { id: id || '#EX-8819', paciente: 'Maria Santos', tipo: 'Raio-X Tórax' };

    const isCidadao = this.usuario?.perfil === 'Cidadão';
    const html = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="font-size:13px;color:var(--text-muted)">
          ${isCidadao ? 'Visualizando' : 'Emitindo / visualizando'} laudo do exame <strong>${exame.id}</strong> (${exame.tipo}) do paciente <strong>${exame.paciente}</strong>.
        </div>
        <div class="form-group">
          <label>Parecer Radiológico / Laboratorial</label>
          <textarea id="txt-laudo" style="width:100%;height:130px;padding:10px;font-family:inherit;font-size:13px" placeholder="Digite aqui a análise clínica do exame..." ${isCidadao ? 'readonly' : ''}>Campos pulmonares de transparência normal. Hilos pulmonares e área cardíaca com limites dentro da normalidade. Ausência de derrames pleurais ativos.</textarea>
        </div>
      </div>
    `;

    this.showModal({
      title: `Laudo Médico – ${exame.id}`,
      bodyHtml: html,
      confirmText: isCidadao ? null : 'Emitir e Assinar Laudo',
      cancelText: isCidadao ? 'Fechar' : 'Cancelar',
      onConfirm: () => {
        if (isCidadao) return true;
        if (exame.id) {
          const found = this.data.exames?.boxes?.lista?.find(e => e.id === exame.id);
          if (found) {
            found.status = 'Laudo Emitido';
            found.statusBadge = 'b-green';
            found.download = true;
            this.saveState();
            this.toast(`Laudo do exame ${exame.id} emitido e assinado digitalmente.`, 'success');
            if (this.currentPage === 'exames') this.goTo('exames');
          }
        }
        return true;
      }
    });
  },

  showRegistrarVacinaModal() {
    const html = `
      <form id="form-vacina" onsubmit="return false;">
        <div class="form-grid">
          <div class="form-group full">
            <label>Nome do Cidadão</label>
            <input type="text" id="vax-paciente" placeholder="Nome completo" required>
          </div>
          <div class="form-group">
            <label>Vacina</label>
            <select id="vax-nome">
              <option value="COVID-19">COVID-19 (Bivalente)</option>
              <option value="Influenza">Influenza</option>
              <option value="Hepatite B">Hepatite B</option>
              <option value="Febre Amarela">Febre Amarela</option>
              <option value="Meningite ACWY">Meningite ACWY</option>
            </select>
          </div>
          <div class="form-group">
            <label>Dose</label>
            <select id="vax-dose">
              <option value="1ª dose">1ª dose</option>
              <option value="2ª dose">2ª dose</option>
              <option value="Dose única">Dose única</option>
              <option value="Reforço">Reforço</option>
            </select>
          </div>
          <div class="form-group">
            <label>Profissional de Enfermagem</label>
            <input type="text" id="vax-prof" value="Enf. Cláudia" required>
          </div>
          <div class="form-group">
            <label>Unidade de Vacinação</label>
            <select id="vax-unidade">
              <option value="Unidade Central">Unidade Central</option>
              <option value="Unidade Norte">Unidade Norte</option>
              <option value="Unidade Sul">Unidade Sul</option>
              <option value="Unidade Oeste">Unidade Oeste</option>
            </select>
          </div>
        </div>
      </form>
    `;

    this.showModal({
      title: 'Registrar Aplicação de Vacina',
      bodyHtml: html,
      confirmText: 'Registrar Dose',
      cancelText: 'Cancelar',
      onConfirm: () => {
        const paciente = document.getElementById('vax-paciente')?.value.trim();
        const vacina = document.getElementById('vax-nome')?.value;
        const dose = document.getElementById('vax-dose')?.value;
        const profissional = document.getElementById('vax-prof')?.value;
        const unidade = document.getElementById('vax-unidade')?.value;

        if (!paciente) {
          this.toast('Informe o nome do paciente.', 'warning');
          return false;
        }

        const newApp = {
          paciente,
          vacina,
          dose,
          dataHora: '07/05 14:45',
          profissional,
          unidade
        };

        if (!this.data.vacinacao) this.data.vacinacao = { boxes: { aplicacoes: [] } };
        this.data.vacinacao.boxes.aplicacoes.unshift(newApp);
        this.saveState();

        this.toast(`Vacina ${vacina} registrada para ${paciente}!`, 'success');
        if (this.currentPage === 'vacinacao') this.goTo('vacinacao');
        return true;
      }
    });
  },

  showNovoChamadoModal() {
    const html = `
      <form id="form-chamado" onsubmit="return false;">
        <div class="form-grid">
          <div class="form-group full">
            <label>Unidade de Saúde</label>
            <select id="ch-unidade">
              <option value="Hospital Central Municipal">Hospital Central Municipal</option>
              <option value="UPA 24h Jardim Sul">UPA 24h Jardim Sul</option>
              <option value="UBS Vila Nova">UBS Vila Nova</option>
              <option value="Hospital Regional Norte">Hospital Regional Norte</option>
            </select>
          </div>
          <div class="form-group">
            <label>Tipo de Ocorrência</label>
            <select id="ch-tipo">
              <option value="Manutenção de Equipamento">Manutenção de Equipamento</option>
              <option value="Falta de Insumos">Falta de Insumos</option>
              <option value="Problema na Rede / TI">Problema na Rede / TI</option>
              <option value="Reforma Estrutural">Reforma Estrutural</option>
            </select>
          </div>
          <div class="form-group">
            <label>Prioridade</label>
            <select id="ch-prioridade">
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </div>
          <div class="form-group full">
            <label>Descrição do Problema</label>
            <textarea id="ch-desc" placeholder="Detalhes do chamado operacional..."></textarea>
          </div>
        </div>
      </form>
    `;

    this.showModal({
      title: 'Abertura de Chamado Técnico / Operacional',
      bodyHtml: html,
      confirmText: 'Abrir Chamado',
      cancelText: 'Cancelar',
      onConfirm: () => {
        const unidade = document.getElementById('ch-unidade')?.value;
        const tipo = document.getElementById('ch-tipo')?.value;

        this.toast(`Chamado de ${tipo} aberto para ${unidade}!`, 'success');
        return true;
      }
    });
  },

  showUnidadeModal(id) {
    const unidade = this.data.unidades?.boxes?.lista?.find(u => u.id === id) || {
      id: id || '102938',
      nome: 'Hospital Central Municipal',
      tipo: 'Hospital',
      endereco: 'Av. Brasil, 1500 – Centro',
      capacidade: '500 leitos',
      ocupacao: 85,
      status: 'Operacional'
    };

    const html = `
      <div style="font-size:13.5px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Unidade:</span>
          <strong>${unidade.nome} (ID: ${unidade.id})</strong>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Tipo:</span>
          <span>${unidade.tipo}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Endereço:</span>
          <span>${unidade.endereco}</span>
        </div>
        <div style="display:flex;justify-content:space-between">
          <span style="color:var(--text-muted)">Capacidade:</span>
          <span>${unidade.capacidade}</span>
        </div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
          <label style="font-size:11px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:6px">ALTERAR STATUS OPERACIONAL</label>
          <select id="modal-edit-unidade-status" class="filter-select" style="width:100%">
            <option value="Operacional" ${unidade.status === 'Operacional' ? 'selected' : ''}>Operacional</option>
            <option value="Manutenção" ${unidade.status === 'Manutenção' ? 'selected' : ''}>Em Manutenção</option>
            <option value="Inativa" ${unidade.status === 'Inativa' ? 'selected' : ''}>Inativa</option>
          </select>
        </div>
      </div>
    `;

    this.showModal({
      title: `Gestão de Unidade – ${unidade.nome}`,
      bodyHtml: html,
      confirmText: 'Salvar Alterações',
      cancelText: 'Fechar',
      onConfirm: () => {
        const st = document.getElementById('modal-edit-unidade-status')?.value;
        if (st && unidade.id) {
          const found = this.data.unidades?.boxes?.lista?.find(u => u.id === unidade.id);
          if (found) {
            found.status = st;
            found.statusColor = st === 'Manutenção' || st === 'Inativa' ? 'danger' : 'success';
            this.saveState();
            this.toast(`Status da unidade ${unidade.nome} atualizado para ${st}.`, 'success');
            if (this.currentPage === 'unidades') {
              this.recomputeUnidadesStats(this.data.unidades);
              this.goTo('unidades');
            }
          }
        }
        return true;
      }
    });
  },

  showRelatorioInsumosModal() {
    const html = `
      <div style="display:flex;flex-direction:column;gap:14px;font-size:13px">
        <p style="color:var(--text-muted)">Relatório consolidado de insumos e medicamentos da rede UPA 24H:</p>
        <div class="insumo-row"><div class="insumo-ico" style="background:#e6f9f7">💉</div><div class="insumo-name">Vacinas COVID-19 (1.240 doses)</div><div class="insumo-pct" style="color:var(--success)">82% (OK)</div></div>
        <div class="insumo-row"><div class="insumo-ico" style="background:#fef2f2">🩸</div><div class="insumo-name">Bolsas de Sangue O- (64 bolsas)</div><div class="insumo-pct" style="color:var(--warning)">64% (Atenção)</div></div>
        <div class="insumo-row"><div class="insumo-ico" style="background:#fef9c3">🦺</div><div class="insumo-name">Kits EPI Máscaras N95</div><div class="insumo-pct" style="color:var(--danger)">12% (CRÍTICO)</div></div>
        <div class="insumo-row"><div class="insumo-ico" style="background:#e8f2fb">💊</div><div class="insumo-name">Analgésicos & Antibióticos</div><div class="insumo-pct" style="color:var(--success)">91% (OK)</div></div>
      </div>
    `;

    this.showModal({
      title: 'Relatório Completo de Insumos & Estoques',
      bodyHtml: html,
      confirmText: 'Exportar Relatório PDF',
      cancelText: 'Fechar',
      onConfirm: () => {
        this.toast('Relatório de Insumos exportado para PDF.', 'success');
        return true;
      }
    });
  },

  showLogModal(idx) {
    const log = this.data.logs?.boxes?.registros?.[idx] ||
                this.data.logs?.boxes?.lista?.[idx] || {
      hora: '09:41:22',
      tipo: 'ERRO',
      titulo: 'Falha na conexão com banco de dados',
      meta: 'Módulo: DB_CONN · Usuário: sistema · IP: 192.168.1.10'
    };

    const hora = log.dataHora || log.hora || '—';
    const tipo = log.tipo || 'INFORMAÇÃO';
    const acao = log.acao || log.titulo || 'Registro do Sistema';
    const usuario = log.usuario || 'sistema';
    const modulo = log.modulo || 'SISTEMA';
    const descricao = log.descricao || log.meta || 'Sem descrição adicional.';
    const badge = log.badge || (tipo === 'ERRO' ? 'b-red' : tipo === 'AVISO' ? 'b-yellow' : 'b-blue');

    const html = `
      <div style="font-size:13px;display:flex;flex-direction:column;gap:10px">
        <div><strong>Data / Horário do Evento:</strong> <span class="mono">${hora}</span></div>
        <div><strong>Tipo / Severidade:</strong> <span class="badge ${badge}">${tipo}</span></div>
        <div><strong>Usuário Responsável:</strong> <strong>${usuario}</strong></div>
        <div><strong>Ação Realizada:</strong> ${acao}</div>
        <div><strong>Módulo:</strong> <span class="mono">${modulo}</span></div>
        <div style="border-top:1px solid var(--border);padding-top:8px">
          <strong>Descrição Detalhada / Auditoria:</strong>
          <pre style="background:var(--bg);padding:10px;border-radius:6px;font-family:'DM Mono',monospace;font-size:11.5px;margin-top:6px;white-space:pre-wrap;word-break:break-word">${descricao}</pre>
        </div>
      </div>
    `;

    this.showModal({
      title: `Log de Auditoria #${idx + 1}`,
      bodyHtml: html,
      confirmText: 'Copiar Detalhes',
      cancelText: 'Fechar',
      onConfirm: () => {
        this.toast('Detalhes do log copiados para a área de transferência.', 'info');
        return true;
      }
    });
  },

  exportTableToCSV(type) {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (type === 'agendamentos') {
      const dados = this.filtrarDadosParaCidadao('agendamentos', this.data.agendamentos);
      const rows = dados?.boxes?.lista || [];
      csvContent += 'ID,Cidadao,CPF,Data,Horario,Especialidade,Medico,Unidade,Status\n';
      rows.forEach(r => {
        csvContent += `"${r.id}","${r.paciente}","${r.cpf}","${r.data}","${r.horario}","${r.especialidade}","${r.medico}","${r.unidade}","${r.status}"\n`;
      });
    } else if (type === 'exames') {
      const dados = this.filtrarDadosParaCidadao('exames', this.data.exames);
      const rows = dados?.boxes?.lista || [];
      csvContent += 'ID,Cidadao,PID,Tipo,Solicitante,Data,Prioridade,Status\n';
      rows.forEach(r => {
        csvContent += `"${r.id}","${r.paciente}","${r.pid}","${r.tipo}","${r.solicitante}","${r.data}","${r.prioridade}","${r.status}"\n`;
      });
    } else if (type === 'logs') {
      const rows = this.data.logs?.boxes?.registros || [];
      csvContent += 'Hora,Tipo,Titulo,Meta\n';
      rows.forEach(r => {
        csvContent += `"${r.hora}","${r.tipo}","${r.titulo}","${r.meta}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `UPA24H_${type}_export.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    this.toast(`Dados de ${type} exportados com sucesso!`, 'success');
  }
};

// `App` é declarado com `const`, então nunca vira propriedade de `window`
// automaticamente. render.js (e agora js/api/usuarios.js) dependem de
// `window.App` para toasts e checagens de perfil — sem esta linha, essas
// chamadas falhavam em silêncio (optional chaining engolindo o erro).
window.App = App;

document.addEventListener('DOMContentLoaded', () => App.init());
