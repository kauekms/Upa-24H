/**
 * ARQUIVO GERADO — não edite à mão. Rode `npm run build:fallbacks`.
 * Cópias das telas usadas quando o sistema é aberto via file://.
 */
window.APP_FALLBACKS = {
  "partials/header.html": "<header>\n  <div class=\"logo nav-item\" data-page=\"dashboard\" role=\"button\" tabindex=\"0\" style=\"cursor:pointer\">\n    <div class=\"logo-badge\">UPA<br>24H</div>\n    <div class=\"logo-text\">\n      <strong id=\"sistema-nome\">UPA 24H</strong>\n      <span id=\"sistema-subtitulo\">Saúde Pública Digital</span>\n    </div>\n  </div>\n  <div class=\"search-wrap\" id=\"search-wrap-container\">\n    <svg width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.35-4.35\"/></svg>\n    <input type=\"text\" id=\"busca-global\" placeholder=\"Buscar no sistema...\" autocomplete=\"off\">\n    <div id=\"search-results-dropdown\" class=\"search-results-dropdown\" style=\"display:none\"></div>\n  </div>\n  <div class=\"header-right\">\n    <button class=\"icon-btn\" id=\"btn-header-notif\" type=\"button\" aria-label=\"Notificações\" title=\"Notificações do Sistema\">\n      <svg width=\"18\" height=\"18\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><path d=\"M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9\"/><path d=\"M13.73 21a2 2 0 0 1-3.46 0\"/></svg>\n      <span class=\"notif-dot\"></span>\n    </button>\n    <div class=\"divider-v\"></div>\n    <div class=\"user-menu-wrap\">\n      <div class=\"user-pill nav-item\" id=\"user-pill\" data-page=\"perfil\" role=\"button\" tabindex=\"0\" title=\"Meu Perfil & Edição de Conta\">\n        <div class=\"avatar\" id=\"user-avatar\">DR</div>\n        <div>\n          <div class=\"uname\" id=\"user-nome\">Denilson Barrios</div>\n          <div class=\"urole\" id=\"user-cargo\">Gestor Geral</div>\n        </div>\n        <svg width=\"13\" height=\"13\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" viewBox=\"0 0 24 24\"><path d=\"m6 9 6 6 6-6\"/></svg>\n      </div>\n      <div id=\"user-dropdown-menu\" class=\"user-dropdown-menu\" style=\"display:none\">\n        <div class=\"user-dropdown-header\">\n          <strong id=\"dropdown-user-nome\">Denilson Barrios</strong>\n          <span id=\"dropdown-user-email\">denilson.barrios@saude.gov.br</span>\n        </div>\n        <div class=\"user-dropdown-item\" data-page=\"perfil\">\n          <svg width=\"15\" height=\"15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><path d=\"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/></svg>\n          Ver Perfil\n        </div>\n        <div class=\"user-dropdown-item\" data-page=\"configuracoes\">\n          <svg width=\"15\" height=\"15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z\"/></svg>\n          Configurações\n        </div>\n        <div class=\"user-dropdown-divider\"></div>\n        <div class=\"user-dropdown-item\" id=\"dropdown-btn-sair\" style=\"color:var(--danger)\">\n          <svg width=\"15\" height=\"15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"/><polyline points=\"16,17 21,12 16,7\"/><line x1=\"21\" y1=\"12\" x2=\"9\" y2=\"12\"/></svg>\n          Encerrar Sessão\n        </div>\n      </div>\n    </div>\n  </div>\n</header>\n",
  "partials/sidebar.html": "<aside>\n  <nav id=\"sidebar-nav\"></nav>\n  <div class=\"sidebar-bottom\">\n    <div class=\"nav-item\" data-page=\"configuracoes\" role=\"button\" tabindex=\"0\">\n      <svg fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M20 12a8 8 0 1 0-3.58 6.67\"/></svg>\n      Configurações\n    </div>\n    <div class=\"nav-item\" id=\"btn-sair\" role=\"button\" tabindex=\"0\">\n      <svg fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"/><polyline points=\"16,17 21,12 16,7\"/><line x1=\"21\" y1=\"12\" x2=\"9\" y2=\"12\"/></svg>\n      Sair\n    </div>\n  </div>\n</aside>\n",
  "json/usuario.json": {
    "nome": "Denilson Barrios",
    "iniciais": "DR",
    "cargo": "Gestor Geral",
    "sistema": {
      "nome": "UPA 24H",
      "subtitulo": "Saúde Pública Digital",
      "versao": "3.2.1"
    }
  },
  "json/navegacao.json": {
    "itens": [
      {
        "id": "dashboard",
        "label": "Dashboard",
        "arquivo": "dashboard.html",
        "css": [
          "css/pages/dashboard.css"
        ],
        "json": "json/dashboard.json"
      },
      {
        "id": "agendamentos",
        "label": "Agendamentos",
        "arquivo": "agendamentos.html",
        "css": [],
        "json": "json/agendamentos.json"
      },
      {
        "id": "consultas",
        "label": "Consultas",
        "arquivo": "consultas.html",
        "css": [
          "css/pages/consultas.css"
        ],
        "json": "json/consultas.json"
      },
      {
        "id": "exames",
        "label": "Exames",
        "arquivo": "exames.html",
        "css": [],
        "json": "json/exames.json"
      },
      {
        "id": "vacinacao",
        "label": "Vacinação",
        "arquivo": "vacinacao.html",
        "css": [
          "css/pages/vacinacao.css"
        ],
        "json": "json/vacinacao.json"
      },
      {
        "id": "unidades",
        "label": "Unidades de Saúde",
        "arquivo": "unidades.html",
        "css": [
          "css/pages/unidades.css"
        ],
        "json": "json/unidades.json"
      },
      {
        "id": "logs",
        "label": "Logs de Sistema",
        "arquivo": "logs.html",
        "css": [
          "css/pages/logs.css"
        ],
        "json": "json/logs.json"
      },
      {
        "id": "cadastro-usuarios",
        "label": "Cadastro de Usuários",
        "arquivo": "cadastro-usuarios.html",
        "css": [
          "css/pages/configuracoes.css"
        ],
        "json": "json/usuario.json"
      },
      {
        "id": "configuracoes",
        "label": "Configurações",
        "arquivo": "configuracoes.html",
        "css": [
          "css/pages/configuracoes.css"
        ],
        "json": "json/configuracoes.json"
      },
      {
        "id": "perfil",
        "label": "Meu Perfil",
        "arquivo": "perfil.html",
        "css": [
          "css/pages/configuracoes.css"
        ],
        "json": "json/perfil.json"
      }
    ]
  },
  "dashboard.html": "<div class=\"page active\" id=\"page-dashboard\">\n  <div class=\"page-hd\">\n    <div>\n      <div class=\"page-title\">Visão Geral do Sistema</div>\n      <div class=\"page-sub\">Bem-vindo, Denilson Barrios. Aqui está o resumo das atividades de saúde de hoje.</div>\n    </div>\n  </div>\n  <div class=\"stats-grid cols4\" data-box=\"stats\">\n    <div class=\"stat-card\"><div class=\"stat-label\">Total de Cidadãos</div><div class=\"stat-icon ic-blue\">👥</div><div class=\"stat-value\">12.482</div><div class=\"stat-note note-green\">↑ +3% este mês</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Consultas Agendadas</div><div class=\"stat-icon ic-teal\">📅</div><div class=\"stat-value\">158</div><div class=\"stat-note note-muted\">Previstas para hoje</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Exames Pendentes</div><div class=\"stat-icon ic-orange\">📋</div><div class=\"stat-value\">42</div><div class=\"stat-note note-orange\">Aguardando laudo</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Taxa de Comparecimento</div><div class=\"stat-icon ic-red\">📊</div><div class=\"stat-value\">94.2%</div><div class=\"stat-bar\"><div class=\"stat-bar-fill bar-blue\" style=\"width:94.2%\"></div></div></div>\n  </div>\n  <div class=\"dashboard-grid\">\n    <div class=\"dashboard-main-col\">\n      <div class=\"card\">\n        <div class=\"card-header\"><span class=\"card-title\">Agendamentos Recentes</span><a href=\"#\" data-nav=\"agendamentos\" style=\"font-size:12.5px;font-weight:600;color:var(--primary);text-decoration:none\">Ver todos →</a></div>\n        <div class=\"tbl-wrap\"><table>\n          <thead><tr><th>Nome do Cidadão</th><th>Data</th><th>Horário</th><th>Unidade</th><th>Status</th><th>Ações</th></tr></thead>\n          <tbody data-box=\"agendamentos-tbody\"><tr><td>Luciana Ferreira</td><td>07/05/2026</td><td><span style=\"font-family:'DM Mono',monospace;font-size:12px\">13:20</span></td><td>Dr. Manoel Joaquim dos Reis</td><td><span class=\"badge b-green\">Confirmado</span></td><td><button class=\"act-btn\">⋮</button></td></tr>\n            <tr><td>Marcos Oliveira</td><td>07/05/2026</td><td><span style=\"font-family:'DM Mono',monospace;font-size:12px\">13:20</span></td><td>Dr. Manoel Joaquim dos Reis</td><td><span class=\"badge b-green\">Confirmado</span></td><td><button class=\"act-btn\">⋮</button></td></tr>\n            <tr><td>Ana Paula Costa</td><td>07/05/2026</td><td><span style=\"font-family:'DM Mono',monospace;font-size:12px\">14:00</span></td><td>Dr. Manoel Joaquim dos Reis</td><td><span class=\"badge b-yellow\">Pendente</span></td><td><button class=\"act-btn\">⋮</button></td></tr>\n            <tr><td>Roberto Alves</td><td>07/05/2026</td><td><span style=\"font-family:'DM Mono',monospace;font-size:12px\">14:30</span></td><td>Dr. Manoel Joaquim dos Reis</td><td><span class=\"badge b-green\">Confirmado</span></td><td><button class=\"act-btn\">⋮</button></td></tr>\n            <tr><td>Fernanda Lima</td><td>07/05/2026</td><td><span style=\"font-family:'DM Mono',monospace;font-size:12px\">15:00</span></td><td>Dr. Manoel Joaquim dos Reis</td><td><span class=\"badge b-red\">Cancelado</span></td><td><button class=\"act-btn\">⋮</button></td></tr>\n          </tbody>\n        </table></div>\n      </div>\n      <div class=\"card\" style=\"margin-top:16px\">\n        <div class=\"card-header\"><span class=\"card-title\">Alertas Importantes</span><span class=\"badge b-red\" data-box=\"alertas-count\">0</span></div>\n        <div style=\"padding:4px 20px 12px\" data-box=\"alertas-dashboard\">\n          <div style=\"padding:16px 0;color:var(--text-muted);font-size:13px\">Carregando alertas...</div>\n        </div>\n      </div>\n    </div>\n    <div class=\"dashboard-side-col\">\n      <div class=\"card calendar-card\">\n        <div class=\"calendar-hd\">\n          <span class=\"calendar-title\" data-box=\"cal-mes\">Maio 2026</span>\n          <div class=\"calendar-nav\">\n            <button class=\"cal-nav-btn\" id=\"cal-btn-prev\" type=\"button\" aria-label=\"Mês anterior\">‹</button>\n            <button class=\"cal-nav-btn\" id=\"cal-btn-next\" type=\"button\" aria-label=\"Próximo mês\">›</button>\n          </div>\n        </div>\n        <div class=\"calendar-grid\">\n          <div class=\"cal-dow\">D</div><div class=\"cal-dow\">S</div><div class=\"cal-dow\">T</div><div class=\"cal-dow\">Q</div><div class=\"cal-dow\">Q</div><div class=\"cal-dow\">S</div><div class=\"cal-dow\">S</div>\n        </div>\n        <div class=\"calendar-grid\" data-box=\"cal-dias\"></div>\n        <div class=\"cal-legenda\" data-box=\"cal-legenda\"></div>\n      </div>\n      <div class=\"card\">\n        <div class=\"card-header\"><span class=\"card-title\" style=\"font-size:13.5px\">Próximos Atendimentos</span></div>\n        <div class=\"atend-list\" data-box=\"proximos-atendimentos\">\n          <div style=\"display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid var(--border)\">\n            <div style=\"text-align:center;min-width:50px\"><div style=\"font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-muted)\">HOJE</div><div style=\"font-size:13px;font-weight:700;color:var(--primary);font-family:'DM Mono',monospace\">14:00</div></div>\n            <div style=\"flex:1\"><div style=\"font-size:13px;font-weight:600\">Dr. Arnaldo Luiz</div><div style=\"font-size:11px;color:var(--text-muted)\">Cardiologia · Unidade Oeste</div></div>\n            <svg width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" viewBox=\"0 0 24 24\"><path d=\"m9 18 6-6-6-6\"/></svg>\n          </div>\n          <div style=\"display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid var(--border)\">\n            <div style=\"text-align:center;min-width:50px\"><div style=\"font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-muted)\">HOJE</div><div style=\"font-size:13px;font-weight:700;color:var(--primary);font-family:'DM Mono',monospace\">15:30</div></div>\n            <div style=\"flex:1\"><div style=\"font-size:13px;font-weight:600\">Dra. Heloísa Rocha</div><div style=\"font-size:11px;color:var(--text-muted)\">Ginecologia · Unidade Sul</div></div>\n            <svg width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" viewBox=\"0 0 24 24\"><path d=\"m9 18 6-6-6-6\"/></svg>\n          </div>\n          <div style=\"display:flex;align-items:center;gap:10px;padding:11px 0\">\n            <div style=\"text-align:center;min-width:50px\"><div style=\"font-size:9px;font-weight:700;text-transform:uppercase;color:var(--text-muted)\">AMANHÃ</div><div style=\"font-size:13px;font-weight:700;color:var(--primary);font-family:'DM Mono',monospace\">09:00</div></div>\n            <div style=\"flex:1\"><div style=\"font-size:13px;font-weight:600\">Lab Exames S/A</div><div style=\"font-size:11px;color:var(--text-muted)\">Hemograma Completo</div></div>\n            <svg width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" viewBox=\"0 0 24 24\"><path d=\"m9 18 6-6-6-6\"/></svg>\n          </div>\n        </div>\n        <button class=\"btn btn-primary btn-block\" id=\"btn-dash-agendar\" type=\"button\">Agendar Novo Atendimento</button>\n      </div>\n    </div>\n  </div>\n</div>\n\n",
  "json/dashboard.json": {
    "layout": "dashboard",
    "titulo": "Visão Geral do Sistema",
    "subtitulo": "Bem-vindo, {usuario}. Aqui está o resumo das atividades de saúde de hoje.",
    "boxes": {
      "stats": [
        {
          "label": "Total de Cidadãos",
          "icon": "👥",
          "iconClass": "ic-blue",
          "value": "12.482",
          "note": "↑ +3% este mês",
          "noteClass": "note-green"
        },
        {
          "label": "Consultas Agendadas",
          "icon": "📅",
          "iconClass": "ic-teal",
          "value": "158",
          "note": "Previstas para hoje",
          "noteClass": "note-muted"
        },
        {
          "label": "Exames Pendentes",
          "icon": "📋",
          "iconClass": "ic-orange",
          "value": "42",
          "note": "Aguardando laudo",
          "noteClass": "note-orange"
        },
        {
          "label": "Taxa de Comparecimento",
          "icon": "📊",
          "iconClass": "ic-red",
          "value": "94.2%",
          "bar": 94.2,
          "barClass": "bar-blue"
        }
      ],
      "agendamentosRecentes": [
        {
          "nome": "Luciana Ferreira",
          "data": "07/05/2026",
          "horario": "13:20",
          "unidade": "Dr. Manoel Joaquim dos Reis",
          "status": "Confirmado",
          "badge": "b-green"
        },
        {
          "nome": "Marcos Oliveira",
          "data": "07/05/2026",
          "horario": "13:20",
          "unidade": "Dr. Manoel Joaquim dos Reis",
          "status": "Confirmado",
          "badge": "b-green"
        },
        {
          "nome": "Ana Paula Costa",
          "data": "07/05/2026",
          "horario": "14:00",
          "unidade": "Dr. Manoel Joaquim dos Reis",
          "status": "Pendente",
          "badge": "b-yellow"
        },
        {
          "nome": "Roberto Alves",
          "data": "07/05/2026",
          "horario": "14:30",
          "unidade": "Dr. Manoel Joaquim dos Reis",
          "status": "Confirmado",
          "badge": "b-green"
        },
        {
          "nome": "Fernanda Lima",
          "data": "07/05/2026",
          "horario": "15:00",
          "unidade": "Dr. Manoel Joaquim dos Reis",
          "status": "Cancelado",
          "badge": "b-red"
        }
      ],
      "proximosAtendimentos": [
        {
          "periodo": "HOJE",
          "horario": "14:00",
          "nome": "Dr. Arnaldo Luiz",
          "descricao": "Cardiologia · Unidade Oeste"
        },
        {
          "periodo": "HOJE",
          "horario": "15:30",
          "nome": "Dra. Heloísa Rocha",
          "descricao": "Ginecologia · Unidade Sul"
        },
        {
          "periodo": "AMANHÃ",
          "horario": "09:00",
          "nome": "Lab Exames S/A",
          "descricao": "Hemograma Completo"
        }
      ]
    }
  },
  "agendamentos.html": "<div class=\"page active\" id=\"page-agendamentos\">\n  <div class=\"page-hd\">\n    <div>\n      <div class=\"breadcrumb\">Administração › <span>Agendamentos</span></div>\n      <div class=\"page-title\">Agendamentos</div>\n      <div class=\"page-sub\">Gerencie e acompanhe todos os agendamentos do sistema com validação de horário e regras de antecedência.</div>\n    </div>\n    <button class=\"btn btn-primary\" id=\"btn-novo-agendamento\">\n      <svg width=\"15\" height=\"15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" viewBox=\"0 0 24 24\"><line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/></svg>\n      Novo Agendamento\n    </button>\n  </div>\n  <div class=\"stats-grid cols4\" data-box=\"stats\" style=\"margin-bottom:20px\">\n    <div class=\"stat-card\"><div class=\"stat-label\">Total Hoje</div><div class=\"stat-icon ic-blue\">📅</div><div class=\"stat-value\">158</div><div class=\"stat-note note-muted\">Agendamentos</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Confirmados</div><div class=\"stat-icon ic-green\">✅</div><div class=\"stat-value\">112</div><div class=\"stat-note note-green\">70.9% do total</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Pendentes</div><div class=\"stat-icon ic-yellow\">⏳</div><div class=\"stat-value\">31</div><div class=\"stat-note note-orange\">Aguardando confirmação</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Cancelados</div><div class=\"stat-icon ic-red\">❌</div><div class=\"stat-value\">15</div><div class=\"stat-note note-red\">9.5% do total</div></div>\n  </div>\n  <div class=\"card\">\n    <div class=\"card-header\">\n      <span class=\"card-title\">Lista de Agendamentos</span>\n      <div style=\"display:flex;gap:8px\">\n        <button class=\"btn btn-outline btn-sm\" id=\"btn-exportar-agendamentos\">\n          <svg width=\"13\" height=\"13\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><polyline points=\"7 10 12 15 17 10\"/><line x1=\"12\" y1=\"15\" x2=\"12\" y2=\"3\"/></svg>\n          Exportar\n        </button>\n      </div>\n    </div>\n    <div style=\"padding:14px 20px;border-bottom:1px solid var(--border)\">\n      <div class=\"filters-row\" style=\"display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end\">\n        <div class=\"filter-group\">\n          <label>Buscar Cidadão</label>\n          <div class=\"search-input-wrap\"><svg width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.35-4.35\"/></svg><input class=\"filter-input\" id=\"filter-agendamentos-busca\" type=\"text\" placeholder=\"Nome, CPF ou ID...\"></div>\n        </div>\n        <div class=\"filter-group\">\n          <label>Status</label>\n          <select class=\"filter-select\" id=\"filter-agendamentos-status\">\n            <option value=\"\">Todos</option>\n            <option value=\"Confirmado\">Confirmado</option>\n            <option value=\"Pendente\">Pendente</option>\n            <option value=\"Cancelado\">Cancelado</option>\n            <option value=\"Remarcado\">Remarcado</option>\n          </select>\n        </div>\n        <div class=\"filter-group\">\n          <label>Unidade</label>\n          <select class=\"filter-select\" id=\"filter-agendamentos-unidade\">\n            <option value=\"\">Todas</option>\n            <option value=\"Unidade Central\">Unidade Central</option>\n            <option value=\"Unidade Oeste\">Unidade Oeste</option>\n            <option value=\"Unidade Sul\">Unidade Sul</option>\n            <option value=\"Unidade Norte\">Unidade Norte</option>\n            <option value=\"Unidade Leste\">Unidade Leste</option>\n          </select>\n        </div>\n        <div class=\"filter-group\">\n          <label>Período (Início)</label>\n          <input class=\"filter-input\" id=\"filter-agendamentos-data-inicio\" type=\"date\" style=\"min-width:130px\">\n        </div>\n        <div class=\"filter-group\">\n          <label>Período (Fim)</label>\n          <input class=\"filter-input\" id=\"filter-agendamentos-data-fim\" type=\"date\" style=\"min-width:130px\">\n        </div>\n        <div class=\"filter-group\">\n          <label>Especialidade</label>\n          <select class=\"filter-select\" id=\"filter-agendamentos-especialidade\">\n            <option value=\"\">Todas</option>\n            <option value=\"Clínica Geral\">Clínica Geral</option>\n            <option value=\"Cardiologia\">Cardiologia</option>\n            <option value=\"Ginecologia\">Ginecologia</option>\n            <option value=\"Pediatria\">Pediatria</option>\n            <option value=\"Ortopedia\">Ortopedia</option>\n            <option value=\"Dermatologia\">Dermatologia</option>\n            <option value=\"Neurologia\">Neurologia</option>\n          </select>\n        </div>\n        <div class=\"filter-group\" style=\"display:flex;gap:6px\">\n          <button class=\"btn btn-primary btn-sm\" id=\"btn-filtrar-agendamentos\">Filtrar</button>\n          <button class=\"btn btn-outline btn-sm\" id=\"btn-limpar-agendamentos\" title=\"Limpar todos os filtros\">Limpar</button>\n        </div>\n      </div>\n    </div>\n    <div class=\"tbl-wrap\"><table>\n      <thead><tr><th>#</th><th>Cidadão</th><th>Data / Horário</th><th>Especialidade</th><th>Médico</th><th>Unidade</th><th>Status</th><th>Ações</th></tr></thead>\n      <tbody data-box=\"lista-tbody\"></tbody>\n    </table></div>\n    <div class=\"pagination\"><span class=\"page-info\" data-box=\"paginacao-info\">Mostrando 1–7 de 158 agendamentos</span><div class=\"page-btns\"></div></div>\n  </div>\n</div>\n",
  "json/agendamentos.json": {
    "layout": "agendamentos",
    "titulo": "Agendamentos",
    "breadcrumb": "Administração › Agendamentos",
    "subtitulo": "Gerencie e acompanhe todos os agendamentos do sistema.",
    "boxes": {
      "stats": [
        {
          "label": "Total Hoje",
          "icon": "📅",
          "iconClass": "ic-blue",
          "value": "158",
          "note": "Agendamentos",
          "noteClass": "note-muted"
        },
        {
          "label": "Confirmados",
          "icon": "✅",
          "iconClass": "ic-green",
          "value": "112",
          "note": "70.9% do total",
          "noteClass": "note-green"
        },
        {
          "label": "Pendentes",
          "icon": "⏳",
          "iconClass": "ic-yellow",
          "value": "31",
          "note": "Aguardando confirmação",
          "noteClass": "note-orange"
        },
        {
          "label": "Cancelados",
          "icon": "❌",
          "iconClass": "ic-red",
          "value": "15",
          "note": "9.5% do total",
          "noteClass": "note-red"
        }
      ],
      "lista": [
        {
          "id": "#10291",
          "paciente": "Luciana Ferreira",
          "cpf": "123.456.789-00",
          "data": "07/05/2026",
          "horario": "13:20",
          "especialidade": "Clínica Geral",
          "medico": "Dr. Manoel Joaquim",
          "unidade": "Unidade Central",
          "status": "Confirmado",
          "badge": "b-green"
        },
        {
          "id": "#10292",
          "paciente": "Marcos Oliveira",
          "cpf": "987.654.321-00",
          "data": "07/05/2026",
          "horario": "13:45",
          "especialidade": "Cardiologia",
          "medico": "Dr. Arnaldo Luiz",
          "unidade": "Unidade Oeste",
          "status": "Confirmado",
          "badge": "b-green"
        },
        {
          "id": "#10293",
          "paciente": "Ana Paula Costa",
          "cpf": "456.789.123-00",
          "data": "07/05/2026",
          "horario": "14:00",
          "especialidade": "Ginecologia",
          "medico": "Dra. Heloísa Rocha",
          "unidade": "Unidade Sul",
          "status": "Pendente",
          "badge": "b-yellow"
        },
        {
          "id": "#10294",
          "paciente": "Roberto Alves",
          "cpf": "321.654.987-00",
          "data": "07/05/2026",
          "horario": "14:30",
          "especialidade": "Ortopedia",
          "medico": "Dr. Carlos Mendes",
          "unidade": "Unidade Norte",
          "status": "Confirmado",
          "badge": "b-green"
        },
        {
          "id": "#10295",
          "paciente": "Fernanda Lima",
          "cpf": "654.321.987-00",
          "data": "07/05/2026",
          "horario": "15:00",
          "especialidade": "Dermatologia",
          "medico": "Dra. Patrícia Souza",
          "unidade": "Unidade Leste",
          "status": "Cancelado",
          "badge": "b-red"
        },
        {
          "id": "#10296",
          "paciente": "José Pereira",
          "cpf": "789.123.456-00",
          "data": "07/05/2026",
          "horario": "15:30",
          "especialidade": "Neurologia",
          "medico": "Dr. Paulo Ribeiro",
          "unidade": "Unidade Central",
          "status": "Pendente",
          "badge": "b-yellow"
        },
        {
          "id": "#10297",
          "paciente": "Maria Santos",
          "cpf": "112.233.445-00",
          "data": "07/05/2026",
          "horario": "16:00",
          "especialidade": "Pediatria",
          "medico": "Dra. Camila Torres",
          "unidade": "Unidade Sul",
          "status": "Remarcado",
          "badge": "b-blue"
        }
      ],
      "paginacao": {
        "de": 1,
        "ate": 7,
        "total": 158
      }
    }
  },
  "consultas.html": "<div class=\"page active\" id=\"page-consultas\">\n  <div class=\"page-hd\">\n    <div>\n      <div class=\"breadcrumb\">Administração › <span>Consultas</span></div>\n      <div class=\"page-title\">Consultas Médicas</div>\n      <div class=\"page-sub\">Registro, acompanhamento e integração com a agenda dos profissionais de saúde.</div>\n    </div>\n    <div style=\"display:flex;gap:10px\">\n      <button class=\"btn btn-outline\" id=\"btn-ver-agenda-medico\">\n        <svg width=\"15\" height=\"15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><rect x=\"3\" y=\"4\" width=\"18\" height=\"18\" rx=\"2\"/><path d=\"M16 2v4M8 2v4M3 10h18\"/><path d=\"M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01\"/></svg>\n        Agenda do Profissional\n      </button>\n      <button class=\"btn btn-primary\" id=\"btn-nova-consulta\">\n        <svg width=\"15\" height=\"15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" viewBox=\"0 0 24 24\"><line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/></svg>\n        Nova Consulta\n      </button>\n    </div>\n  </div>\n  <div class=\"stats-grid cols4\" data-box=\"stats\" style=\"margin-bottom:20px\">\n    <div class=\"stat-card\"><div class=\"stat-label\">Agendadas</div><div class=\"stat-icon ic-blue\">📅</div><div class=\"stat-value\">3</div><div class=\"stat-note note-muted\">Consultas agendadas</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Canceladas</div><div class=\"stat-icon ic-red\">❌</div><div class=\"stat-value\">1</div><div class=\"stat-note note-red\">Cancelamentos</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Tempo Médio de Espera</div><div class=\"stat-icon ic-purple\">⏱</div><div class=\"stat-value\">18 min</div><div class=\"stat-note note-orange\">Fila de espera estimada</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Em Andamento</div><div class=\"stat-icon ic-teal\">🩺</div><div class=\"stat-value\">1</div><div class=\"stat-note note-green\">Atendimentos agora</div></div>\n  </div>\n  <div style=\"display:grid;grid-template-columns:1fr 300px;gap:16px\">\n    <div>\n      <div class=\"card\">\n        <div class=\"card-header\">\n          <span class=\"card-title\">Consultas Registradas</span>\n        </div>\n        <div style=\"padding:14px 20px;border-bottom:1px solid var(--border)\">\n          <div class=\"filters-row\" style=\"display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end\">\n            <div class=\"filter-group\">\n              <label>Buscar Cidadão</label>\n              <div class=\"search-input-wrap\"><svg width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.35-4.35\"/></svg><input class=\"filter-input\" id=\"filter-consultas-busca\" type=\"text\" placeholder=\"Nome ou CID...\"></div>\n            </div>\n            <div class=\"filter-group\">\n              <label>Médico</label>\n              <select class=\"filter-select\" id=\"filter-consultas-medico\">\n                <option value=\"\">Todos os médicos</option>\n                <option value=\"Dr. Manoel Joaquim\">Dr. Manoel Joaquim</option>\n                <option value=\"Dr. Arnaldo Luiz\">Dr. Arnaldo Luiz</option>\n                <option value=\"Dra. Heloísa Rocha\">Dra. Heloísa Rocha</option>\n                <option value=\"Dr. Carlos Mendes\">Dr. Carlos Mendes</option>\n                <option value=\"Dra. Patrícia Souza\">Dra. Patrícia Souza</option>\n                <option value=\"Dr. Paulo Ribeiro\">Dr. Paulo Ribeiro</option>\n                <option value=\"Dra. Camila Torres\">Dra. Camila Torres</option>\n              </select>\n            </div>\n            <div class=\"filter-group\">\n              <label>Especialidade</label>\n              <select class=\"filter-select\" id=\"filter-consultas-especialidade\">\n                <option value=\"\">Todas</option>\n                <option value=\"Clínica Geral\">Clínica Geral</option>\n                <option value=\"Cardiologia\">Cardiologia</option>\n                <option value=\"Ginecologia\">Ginecologia</option>\n                <option value=\"Ortopedia\">Ortopedia</option>\n                <option value=\"Dermatologia\">Dermatologia</option>\n                <option value=\"Pediatria\">Pediatria</option>\n                <option value=\"Neurologia\">Neurologia</option>\n              </select>\n            </div>\n            <div class=\"filter-group\">\n              <label>Status</label>\n              <select class=\"filter-select\" id=\"filter-consultas-status\">\n                <option value=\"\">Todos</option>\n                <option value=\"Agendada\">Agendada</option>\n                <option value=\"Aguardando\">Aguardando</option>\n                <option value=\"Em Andamento\">Em Andamento</option>\n                <option value=\"Concluída\">Concluída</option>\n                <option value=\"Cancelada\">Cancelada</option>\n              </select>\n            </div>\n            <div class=\"filter-group\" style=\"display:flex;gap:6px\">\n              <button class=\"btn btn-primary btn-sm\" id=\"btn-filtrar-consultas\">Filtrar</button>\n              <button class=\"btn btn-outline btn-sm\" id=\"btn-limpar-consultas\" title=\"Limpar todos os filtros\">Limpar</button>\n            </div>\n          </div>\n        </div>\n        <div class=\"tbl-wrap\"><table>\n          <thead><tr><th>Cidadão</th><th>Especialidade</th><th>Médico</th><th>Início</th><th>Duração</th><th>Status</th><th>CID</th><th>Ações</th></tr></thead>\n          <tbody data-box=\"consultas-tbody\"></tbody>\n        </table></div>\n        <div class=\"pagination\"><span class=\"page-info\">Mostrando consultas</span><div class=\"page-btns\"></div></div>\n      </div>\n    </div>\n    <div style=\"display:flex;flex-direction:column;gap:16px\">\n      <div class=\"card\">\n        <div class=\"card-header\"><span class=\"card-title\" style=\"font-size:13.5px\">Por Especialidade</span></div>\n        <div style=\"padding:8px 20px 14px\">\n          <div style=\"margin-bottom:12px\"><div style=\"display:flex;justify-content:space-between;margin-bottom:5px\"><span style=\"font-size:12.5px;font-weight:500\">Clínica Geral</span><span style=\"font-size:12px;font-weight:700\">34</span></div><div class=\"prog-bar\"><div class=\"prog-fill bar-blue\" style=\"width:65%\"></div></div></div>\n          <div style=\"margin-bottom:12px\"><div style=\"display:flex;justify-content:space-between;margin-bottom:5px\"><span style=\"font-size:12.5px;font-weight:500\">Cardiologia</span><span style=\"font-size:12px;font-weight:700\">18</span></div><div class=\"prog-bar\"><div class=\"prog-fill\" style=\"width:35%;background:var(--accent)\"></div></div></div>\n          <div style=\"margin-bottom:12px\"><div style=\"display:flex;justify-content:space-between;margin-bottom:5px\"><span style=\"font-size:12.5px;font-weight:500\">Ginecologia</span><span style=\"font-size:12px;font-weight:700\">14</span></div><div class=\"prog-bar\"><div class=\"prog-fill\" style=\"width:27%;background:var(--accent2)\"></div></div></div>\n          <div style=\"margin-bottom:12px\"><div style=\"display:flex;justify-content:space-between;margin-bottom:5px\"><span style=\"font-size:12.5px;font-weight:500\">Pediatria</span><span style=\"font-size:12px;font-weight:700\">11</span></div><div class=\"prog-bar\"><div class=\"prog-fill\" style=\"width:21%;background:#a855f7\"></div></div></div>\n          <div><div style=\"display:flex;justify-content:space-between;margin-bottom:5px\"><span style=\"font-size:12.5px;font-weight:500\">Outras</span><span style=\"font-size:12px;font-weight:700\">10</span></div><div class=\"prog-bar\"><div class=\"prog-fill\" style=\"width:19%;background:var(--warning)\"></div></div></div>\n        </div>\n      </div>\n      <div class=\"card\">\n        <div class=\"card-header\"><span class=\"card-title\" style=\"font-size:13.5px\">Fila de Espera</span></div>\n        <div style=\"padding:8px 16px 12px\">\n          <div style=\"display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)\"><div style=\"width:22px;height:22px;background:var(--primary);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0\">1</div><div style=\"flex:1\"><div style=\"font-size:13px;font-weight:600\">Roberto Alves</div><div style=\"font-size:11px;color:var(--text-muted)\">Ortopedia · Dr. Carlos Mendes</div></div><span style=\"font-size:11px;color:var(--warning);font-weight:600\">~15 min</span></div>\n          <div style=\"display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)\"><div style=\"width:22px;height:22px;background:#6b7a8d;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0\">2</div><div style=\"flex:1\"><div style=\"font-size:13px;font-weight:600\">Josefa Marques</div><div style=\"font-size:11px;color:var(--text-muted)\">Dermatologia · Dra. Patrícia</div></div><span style=\"font-size:11px;color:var(--text-muted);font-weight:600\">~30 min</span></div>\n          <div style=\"display:flex;align-items:center;gap:10px;padding:9px 0\"><div style=\"width:22px;height:22px;background:#6b7a8d;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;flex-shrink:0\">3</div><div style=\"flex:1\"><div style=\"font-size:13px;font-weight:600\">Pedro Lima</div><div style=\"font-size:11px;color:var(--text-muted)\">Clínica Geral · Dr. Manoel</div></div><span style=\"font-size:11px;color:var(--text-muted);font-weight:600\">~45 min</span></div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n",
  "json/consultas.json": {
    "layout": "consultas",
    "titulo": "Consultas Médicas",
    "breadcrumb": "Administração › Consultas",
    "subtitulo": "Registro e acompanhamento de todas as consultas realizadas e agenda médica.",
    "boxes": {
      "stats": [
        {
          "label": "Agendadas",
          "icon": "📅",
          "iconClass": "ic-blue",
          "value": "3",
          "note": "Consultas agendadas",
          "noteClass": "note-muted"
        },
        {
          "label": "Canceladas",
          "icon": "❌",
          "iconClass": "ic-red",
          "value": "1",
          "note": "Cancelamentos",
          "noteClass": "note-red"
        },
        {
          "label": "Tempo Médio de Espera",
          "icon": "⏱",
          "iconClass": "ic-purple",
          "value": "18 min",
          "note": "Fila de espera estimada",
          "noteClass": "note-orange"
        },
        {
          "label": "Em Andamento",
          "icon": "🩺",
          "iconClass": "ic-teal",
          "value": "1",
          "note": "Atendimentos agora",
          "noteClass": "note-green"
        }
      ],
      "consultas": [
        {
          "id": "CS-101",
          "paciente": "Luciana Ferreira",
          "idade": "42 anos",
          "especialidade": "Clínica Geral",
          "medico": "Dr. Manoel Joaquim",
          "inicio": "13:20",
          "duracao": "18 min",
          "status": "Concluída",
          "badge": "b-green",
          "cid": "J00",
          "data": "07/05/2026"
        },
        {
          "id": "CS-102",
          "paciente": "Carlos Braga",
          "idade": "58 anos",
          "especialidade": "Cardiologia",
          "medico": "Dr. Arnaldo Luiz",
          "inicio": "13:45",
          "duracao": "22 min",
          "status": "Concluída",
          "badge": "b-green",
          "cid": "I10",
          "data": "07/05/2026"
        },
        {
          "id": "CS-103",
          "paciente": "Ana Paula Costa",
          "idade": "34 anos",
          "especialidade": "Ginecologia",
          "medico": "Dra. Heloísa Rocha",
          "inicio": "14:00",
          "duracao": "—",
          "status": "Em Andamento",
          "badge": "b-blue",
          "cid": "—",
          "data": "07/05/2026"
        },
        {
          "id": "CS-104",
          "paciente": "Roberto Alves",
          "idade": "67 anos",
          "especialidade": "Ortopedia",
          "medico": "Dr. Carlos Mendes",
          "inicio": "14:30",
          "duracao": "—",
          "status": "Aguardando",
          "badge": "b-yellow",
          "cid": "—",
          "data": "07/05/2026"
        },
        {
          "id": "CS-105",
          "paciente": "Josefa Marques",
          "idade": "29 anos",
          "especialidade": "Dermatologia",
          "medico": "Dra. Patrícia Souza",
          "inicio": "15:00",
          "duracao": "—",
          "status": "Aguardando",
          "badge": "b-yellow",
          "cid": "—",
          "data": "07/05/2026"
        },
        {
          "id": "CS-106",
          "paciente": "Maria Santos",
          "idade": "24 anos",
          "especialidade": "Pediatria",
          "medico": "Dra. Camila Torres",
          "inicio": "16:00",
          "duracao": "—",
          "status": "Agendada",
          "badge": "b-blue",
          "cid": "—",
          "data": "07/05/2026"
        },
        {
          "id": "CS-107",
          "paciente": "Marcos Oliveira",
          "idade": "51 anos",
          "especialidade": "Cardiologia",
          "medico": "Dr. Arnaldo Luiz",
          "inicio": "16:30",
          "duracao": "—",
          "status": "Agendada",
          "badge": "b-blue",
          "cid": "—",
          "data": "07/05/2026"
        },
        {
          "id": "CS-108",
          "paciente": "Fernanda Lima",
          "idade": "38 anos",
          "especialidade": "Dermatologia",
          "medico": "Dra. Patrícia Souza",
          "inicio": "15:30",
          "duracao": "—",
          "status": "Cancelada",
          "badge": "b-red",
          "cid": "—",
          "data": "07/05/2026"
        },
        {
          "id": "CS-109",
          "paciente": "José Pereira",
          "idade": "45 anos",
          "especialidade": "Neurologia",
          "medico": "Dr. Paulo Ribeiro",
          "inicio": "17:00",
          "duracao": "—",
          "status": "Agendada",
          "badge": "b-blue",
          "cid": "—",
          "data": "07/05/2026"
        }
      ],
      "especialidades": [
        {
          "nome": "Clínica Geral",
          "total": 34,
          "width": "65%",
          "barClass": "bar-blue"
        },
        {
          "nome": "Cardiologia",
          "total": 18,
          "width": "35%",
          "color": "var(--accent)"
        },
        {
          "nome": "Ginecologia",
          "total": 14,
          "width": "27%",
          "color": "var(--accent2)"
        },
        {
          "nome": "Pediatria",
          "total": 11,
          "width": "21%",
          "color": "#a855f7"
        },
        {
          "nome": "Outras",
          "total": 10,
          "width": "19%",
          "color": "var(--warning)"
        }
      ],
      "fila": [
        {
          "posicao": 1,
          "ativo": true,
          "paciente": "Roberto Alves",
          "especialidade": "Ortopedia",
          "eta": "~15 min",
          "etaClass": "note-orange"
        },
        {
          "posicao": 2,
          "ativo": false,
          "paciente": "Josefa Marques",
          "especialidade": "Dermatologia",
          "eta": "~30 min",
          "etaClass": "note-muted"
        },
        {
          "posicao": 3,
          "ativo": false,
          "paciente": "Pedro Lima",
          "especialidade": "Clínica Geral",
          "eta": "~45 min",
          "etaClass": "note-muted"
        }
      ],
      "paginacao": {
        "de": 1,
        "ate": 9,
        "total": 9
      }
    }
  },
  "exames.html": "<div class=\"page active\" id=\"page-exames\">\n  <div class=\"page-hd\">\n    <div>\n      <div class=\"breadcrumb\">Administração › <span>Exames</span></div>\n      <div class=\"page-title\">Exames Laboratoriais</div>\n      <div class=\"page-sub\">Acompanhe solicitações, laudos e resultados dos exames.</div>\n    </div>\n    <button class=\"btn btn-primary\" id=\"btn-solicitar-exame\">\n      <svg width=\"15\" height=\"15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" viewBox=\"0 0 24 24\"><line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/></svg>\n      Solicitar Exame\n    </button>\n  </div>\n  <div class=\"stats-grid cols4\" data-box=\"stats\" style=\"margin-bottom:20px\">\n    <div class=\"stat-card\"><div class=\"stat-label\">Solicitados</div><div class=\"stat-icon ic-blue\">🔬</div><div class=\"stat-value\" id=\"stat-exames-solicitados\">0</div><div class=\"stat-note note-muted\">Novos pedidos</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Em andamento</div><div class=\"stat-icon ic-orange\">📋</div><div class=\"stat-value\" id=\"stat-exames-andamento\">0</div><div class=\"stat-note note-orange\">Em análise no laboratório</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Concluídos</div><div class=\"stat-icon ic-green\">✔</div><div class=\"stat-value\" id=\"stat-exames-concluidos\">0</div><div class=\"stat-note note-green\">Laudos prontos</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Atrasados</div><div class=\"stat-icon ic-red\">🚨</div><div class=\"stat-value\" id=\"stat-exames-atrasados\">0</div><div class=\"stat-note note-red\">Prazo previsto expirado</div></div>\n  </div>\n  <div class=\"card\">\n    <div class=\"card-header\"><span class=\"card-title\">Solicitações de Exames</span>\n      <div style=\"display:flex;gap:8px\">\n        <button class=\"btn btn-outline btn-sm\" id=\"btn-exportar-exames\">Exportar CSV</button>\n      </div>\n    </div>\n    <div style=\"padding:14px 20px;border-bottom:1px solid var(--border)\">\n      <div class=\"filters-row\" style=\"display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end\">\n        <div class=\"filter-group\">\n          <label>Buscar Cidadão / Exame</label>\n          <div class=\"search-input-wrap\">\n            <svg width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.35-4.35\"/></svg>\n            <input class=\"filter-input\" id=\"filter-exames-busca\" type=\"text\" placeholder=\"Nome, CPF ou tipo...\">\n          </div>\n        </div>\n        <div class=\"filter-group\">\n          <label>Status</label>\n          <select class=\"filter-select\" id=\"filter-exames-status\">\n            <option value=\"\">Todos</option>\n            <option value=\"Solicitado\">Solicitado</option>\n            <option value=\"Em andamento\">Em andamento</option>\n            <option value=\"Concluído\">Concluído</option>\n            <option value=\"Atrasado\">Atrasado</option>\n          </select>\n        </div>\n        <div class=\"filter-group\">\n          <label>Período (Início)</label>\n          <input class=\"filter-input\" id=\"filter-exames-data-inicio\" type=\"date\" style=\"min-width:130px\">\n        </div>\n        <div class=\"filter-group\">\n          <label>Período (Fim)</label>\n          <input class=\"filter-input\" id=\"filter-exames-data-fim\" type=\"date\" style=\"min-width:130px\">\n        </div>\n        <div class=\"filter-group\" style=\"display:flex;gap:6px\">\n          <button class=\"btn btn-primary btn-sm\" id=\"btn-filtrar-exames\">Filtrar</button>\n          <button class=\"btn btn-outline btn-sm\" id=\"btn-limpar-exames\" title=\"Limpar todos os filtros\">Limpar</button>\n        </div>\n      </div>\n    </div>\n    <div class=\"tbl-wrap\"><table>\n      <thead>\n        <tr>\n          <th>Paciente</th>\n          <th>Tipo de Exame</th>\n          <th>Data</th>\n          <th>Unidade</th>\n          <th>Status</th>\n          <th>Ações</th>\n        </tr>\n      </thead>\n      <tbody data-box=\"exames-tbody\"></tbody>\n    </table></div>\n    <div class=\"pagination\"><span class=\"page-info\"></span><div class=\"page-btns\"></div></div>\n  </div>\n</div>\n",
  "json/exames.json": {
    "layout": "exames",
    "titulo": "Exames Laboratoriais",
    "breadcrumb": "Administração › Exames",
    "subtitulo": "Acompanhe solicitações, laudos e resultados dos exames.",
    "boxes": {
      "stats": [
        {
          "label": "Solicitados",
          "icon": "🔬",
          "iconClass": "ic-blue",
          "value": "2",
          "note": "Novos pedidos",
          "noteClass": "note-muted"
        },
        {
          "label": "Em andamento",
          "icon": "📋",
          "iconClass": "ic-orange",
          "value": "2",
          "note": "Em análise no laboratório",
          "noteClass": "note-orange"
        },
        {
          "label": "Concluídos",
          "icon": "✔",
          "iconClass": "ic-green",
          "value": "3",
          "note": "Laudos prontos",
          "noteClass": "note-green"
        },
        {
          "label": "Atrasados",
          "icon": "🚨",
          "iconClass": "ic-red",
          "value": "1",
          "note": "Prazo previsto expirado",
          "noteClass": "note-red"
        }
      ],
      "lista": [
        {
          "id": "#EX-8821",
          "paciente": "Carlos Braga",
          "cpf": "123.456.789-00",
          "pid": "P-4521",
          "tipo": "Hemograma Completo",
          "solicitante": "Dr. Arnaldo Luiz",
          "unidade": "UBS Centro",
          "data": "07/05/2026",
          "horario": "07:30",
          "dataPrevista": "09/05/2026",
          "prioridade": "Urgente",
          "priorBadge": "b-red",
          "status": "Solicitado",
          "statusBadge": "b-yellow"
        },
        {
          "id": "#EX-8822",
          "paciente": "Luciana Ferreira",
          "cpf": "987.654.321-00",
          "pid": "P-4318",
          "tipo": "Glicemia em Jejum",
          "solicitante": "Dr. Manoel Joaquim",
          "unidade": "Unidade Central",
          "data": "07/05/2026",
          "horario": "08:00",
          "dataPrevista": "08/05/2026",
          "prioridade": "Normal",
          "priorBadge": "b-gray",
          "status": "Em andamento",
          "statusBadge": "b-blue"
        },
        {
          "id": "#EX-8819",
          "paciente": "Maria Santos",
          "cpf": "112.233.445-00",
          "pid": "P-3892",
          "tipo": "Raio-X Tórax",
          "solicitante": "Dr. Paulo Ribeiro",
          "unidade": "Unidade Sul",
          "data": "05/05/2026",
          "horario": "09:15",
          "dataPrevista": "06/05/2026",
          "prioridade": "Normal",
          "priorBadge": "b-gray",
          "status": "Concluído",
          "statusBadge": "b-green",
          "download": true
        },
        {
          "id": "#EX-8815",
          "paciente": "José Pereira",
          "cpf": "789.123.456-00",
          "pid": "P-4102",
          "tipo": "Tomografia Crânio",
          "solicitante": "Dr. Paulo Ribeiro",
          "unidade": "Unidade Central",
          "data": "01/05/2026",
          "horario": "10:30",
          "dataPrevista": "03/05/2026",
          "prioridade": "Média",
          "priorBadge": "b-orange",
          "status": "Em andamento",
          "statusBadge": "b-blue"
        },
        {
          "id": "#EX-8810",
          "paciente": "Roberto Alves",
          "cpf": "321.654.987-00",
          "pid": "P-3761",
          "tipo": "Ultrassom Abdominal",
          "solicitante": "Dr. Carlos Mendes",
          "unidade": "Unidade Norte",
          "data": "04/05/2026",
          "horario": "11:00",
          "dataPrevista": "05/05/2026",
          "prioridade": "Normal",
          "priorBadge": "b-gray",
          "status": "Concluído",
          "statusBadge": "b-green",
          "download": true
        },
        {
          "id": "#EX-8807",
          "paciente": "Ana Paula Costa",
          "cpf": "456.789.123-00",
          "pid": "P-4409",
          "tipo": "ECG",
          "solicitante": "Dra. Heloísa Rocha",
          "unidade": "Unidade Oeste",
          "data": "07/05/2026",
          "horario": "14:00",
          "dataPrevista": "08/05/2026",
          "prioridade": "Urgente",
          "priorBadge": "b-red",
          "status": "Solicitado",
          "statusBadge": "b-yellow"
        },
        {
          "id": "#EX-8805",
          "paciente": "Carlos Braga",
          "cpf": "123.456.789-00",
          "pid": "P-4521",
          "tipo": "Colesterol Total e Frações",
          "solicitante": "Dr. Arnaldo Luiz",
          "unidade": "UBS Centro",
          "data": "20/04/2026",
          "horario": "08:30",
          "dataPrevista": "22/04/2026",
          "prioridade": "Normal",
          "priorBadge": "b-gray",
          "status": "Concluído",
          "statusBadge": "b-green",
          "download": true
        }
      ],
      "paginacao": {
        "de": 1,
        "ate": 4,
        "total": 7,
        "label": "exames"
      }
    }
  },
  "vacinacao.html": "<div class=\"page active\" id=\"page-vacinacao\">\n  <div class=\"page-hd\">\n    <div>\n      <div class=\"breadcrumb\">Administração › <span>Vacinação</span></div>\n      <div class=\"page-title\">Campanha de Vacinação</div>\n      <div class=\"page-sub\">Monitoramento de doses, coberturas e estoques das vacinas.</div>\n    </div>\n    <div style=\"display:flex;gap:8px\">\n      <button class=\"btn btn-outline\" id=\"btn-entrada-estoque\" type=\"button\" style=\"display:none\">Entrada de Estoque</button>\n      <button class=\"btn btn-primary\" id=\"btn-registrar-vacinacao\" type=\"button\">\n        <svg width=\"15\" height=\"15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" viewBox=\"0 0 24 24\"><line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/></svg>\n        Registrar Aplicação\n      </button>\n    </div>\n  </div>\n  <div class=\"stats-grid cols4\" data-box=\"stats\" style=\"margin-bottom:20px\"></div>\n  <div style=\"display:grid;grid-template-columns:1fr 320px;gap:16px\">\n    <div>\n      <div class=\"card\">\n        <div class=\"card-header\"><span class=\"card-title\">Painel de Vacinas</span></div>\n        <div style=\"padding:8px 20px 16px\">\n          <div style=\"display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-muted)\"><div>Vacina</div><div>Estoque</div><div>Cobertura</div><div>Status</div></div>\n          <div data-box=\"vacinas-painel\"></div>\n        </div>\n      </div>\n      <div class=\"card\" style=\"margin-top:16px\">\n        <div class=\"card-header\"><span class=\"card-title\">Últimas Aplicações</span></div>\n        <div class=\"tbl-wrap\"><table>\n          <thead><tr><th>Cidadão</th><th>Vacina</th><th>Dose</th><th>Data/Hora</th><th>Profissional</th><th>Unidade</th></tr></thead>\n          <tbody data-box=\"aplicacoes-tbody\"></tbody>\n        </table></div>\n        <div class=\"pagination\"><span class=\"page-info\"></span><div class=\"page-btns\"></div></div>\n      </div>\n    </div>\n    <div style=\"display:flex;flex-direction:column;gap:16px\">\n      <div class=\"card\" style=\"padding:16px 20px\">\n        <div class=\"card-title\" style=\"margin-bottom:12px\">Alertas de Estoque</div>\n        <div data-box=\"alertas-estoque\"></div>\n      </div>\n      <div class=\"card\" style=\"padding:16px 20px\">\n        <div class=\"card-title\" style=\"margin-bottom:14px\">Cobertura por Faixa Etária</div>\n        <div data-box=\"faixas-etarias\"></div>\n      </div>\n    </div>\n  </div>\n</div>\n",
  "json/vacinacao.json": {
    "layout": "vacinacao",
    "titulo": "Campanha de Vacinação",
    "breadcrumb": "Administração › Vacinação",
    "subtitulo": "Monitoramento de doses, coberturas e estoques das vacinas.",
    "boxes": {
      "stats": [
        {
          "label": "Doses Aplicadas Hoje",
          "icon": "💉",
          "iconClass": "ic-green",
          "value": "348",
          "note": "↑ +8% vs ontem",
          "noteClass": "note-green"
        },
        {
          "label": "Total Este Mês",
          "icon": "📊",
          "iconClass": "ic-blue",
          "value": "4.821",
          "note": "Doses no mês",
          "noteClass": "note-muted"
        },
        {
          "label": "Cobertura Vacinal",
          "icon": "🛡",
          "iconClass": "ic-teal",
          "value": "78.4%",
          "bar": 78.4,
          "barClass": "bar-green"
        },
        {
          "label": "Estoque Crítico",
          "icon": "⚠",
          "iconClass": "ic-red",
          "value": "2",
          "note": "Vacinas em alerta",
          "noteClass": "note-red"
        }
      ],
      "vacinas": [
        {
          "nome": "COVID-19 (Bivalente)",
          "detalhe": "mRNA · 2ª dose",
          "icone": "💉",
          "icoBg": "#dcfce7",
          "estoque": "1.240",
          "cobertura": 82,
          "status": "Normal",
          "badge": "b-green"
        },
        {
          "nome": "Influenza",
          "detalhe": "Dose única",
          "icone": "🩸",
          "icoBg": "#fef9c3",
          "estoque": "890",
          "cobertura": 71,
          "status": "Atenção",
          "badge": "b-yellow",
          "barColor": "var(--warning)"
        },
        {
          "nome": "Hepatite B",
          "detalhe": "3 doses",
          "icone": "🔵",
          "icoBg": "#e8f2fb",
          "estoque": "540",
          "cobertura": 88,
          "status": "Normal",
          "badge": "b-green"
        },
        {
          "nome": "Febre Amarela",
          "detalhe": "Dose única",
          "icone": "🟣",
          "icoBg": "#f3e8ff",
          "estoque": "45",
          "estoqueCritico": true,
          "cobertura": 55,
          "status": "Crítico",
          "badge": "b-red",
          "barColor": "var(--accent2)"
        },
        {
          "nome": "Meningite ACWY",
          "detalhe": "Dose única",
          "icone": "🔴",
          "icoBg": "#fef2f2",
          "estoque": "28",
          "estoqueCritico": true,
          "cobertura": 42,
          "status": "Crítico",
          "badge": "b-red",
          "barColor": "var(--danger)"
        }
      ],
      "aplicacoes": [
        {
          "paciente": "Paulo Henrique",
          "vacina": "COVID-19",
          "dose": "2ª dose",
          "dataHora": "07/05 12:14",
          "profissional": "Enf. Cláudia",
          "unidade": "Unidade Norte"
        },
        {
          "paciente": "Marina Gomes",
          "vacina": "Influenza",
          "dose": "Única",
          "dataHora": "07/05 12:08",
          "profissional": "Enf. Rodrigo",
          "unidade": "Unidade Sul"
        },
        {
          "paciente": "Antônio Silva",
          "vacina": "Hepatite B",
          "dose": "1ª dose",
          "dataHora": "07/05 11:52",
          "profissional": "Enf. Cláudia",
          "unidade": "Unidade Central"
        },
        {
          "paciente": "Beatriz Nunes",
          "vacina": "Febre Amarela",
          "dose": "Única",
          "dataHora": "07/05 11:40",
          "profissional": "Enf. Marcos",
          "unidade": "Unidade Oeste"
        }
      ],
      "faixasEtarias": [
        {
          "faixa": "0–2 anos",
          "pct": 94,
          "color": "success"
        },
        {
          "faixa": "3–12 anos",
          "pct": 89,
          "color": "success"
        },
        {
          "faixa": "13–17 anos",
          "pct": 72,
          "color": "warning"
        },
        {
          "faixa": "18–59 anos",
          "pct": 68,
          "color": "primary"
        },
        {
          "faixa": "60+ anos",
          "pct": 91,
          "color": "success"
        }
      ],
      "insumos": [
        {
          "nome": "Vacinas COVID-19",
          "icone": "💉",
          "icoBg": "#e6f9f7",
          "pct": 82,
          "color": "success"
        },
        {
          "nome": "Estoque de Sangue",
          "icone": "🩸",
          "icoBg": "#fef2f2",
          "pct": 64,
          "color": "warning"
        },
        {
          "nome": "EPIs Críticos",
          "icone": "🦺",
          "icoBg": "#fef9c3",
          "pct": 12,
          "color": "danger"
        }
      ]
    }
  },
  "unidades.html": "<div class=\"page active\" id=\"page-unidades\">\n  <div class=\"page-hd\">\n    <div>\n      <div class=\"breadcrumb\">Administração › <span>Gestão de Unidades</span></div>\n      <div class=\"page-title\">Unidades de Saúde</div>\n      <div class=\"page-sub\">Gerencie a infraestrutura e capacidade das unidades federativas.</div>\n    </div>\n    <div style=\"display:flex;gap:8px\">\n      <button class=\"btn btn-outline\" id=\"btn-novo-chamado\" type=\"button\">+ Novo Chamado</button>\n      <button class=\"btn btn-primary\" id=\"btn-nova-unidade\" type=\"button\" style=\"display:none\">\n        <svg width=\"15\" height=\"15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" viewBox=\"0 0 24 24\"><line x1=\"12\" y1=\"5\" x2=\"12\" y2=\"19\"/><line x1=\"5\" y1=\"12\" x2=\"19\" y2=\"12\"/></svg>\n        Nova Unidade\n      </button>\n    </div>\n  </div>\n  <div class=\"stats-grid cols4\" data-box=\"stats\" style=\"margin-bottom:20px\">\n    <div class=\"stat-card\"><div class=\"stat-label\">Total de Unidades</div><div class=\"stat-icon ic-red\">🏥</div><div class=\"stat-value\">42</div><div class=\"stat-note note-muted\">Unidades cadastradas</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Operacionais</div><div class=\"stat-icon ic-green\">✅</div><div class=\"stat-value\">38</div><div class=\"stat-note note-green\">Funcionando normalmente</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Em Manutenção</div><div class=\"stat-icon ic-orange\">🔧</div><div class=\"stat-value\">04</div><div class=\"stat-note note-orange\">Temporariamente inativas</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Capacidade Total</div><div class=\"stat-icon ic-blue\">👥</div><div class=\"stat-value\">12.5k</div><div class=\"stat-note note-muted\">Leitos disponíveis</div></div>\n  </div>\n  <div class=\"card\">\n    <div class=\"card-header\"><span class=\"card-title\">Lista de Unidades</span></div>\n    <div style=\"padding:14px 20px;border-bottom:1px solid var(--border)\">\n      <div class=\"filters-row\">\n        <div class=\"filter-group\"><label>Buscar Unidade</label><div class=\"search-input-wrap\"><svg width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.35-4.35\"/></svg><input class=\"filter-input\" id=\"filter-unidades-busca\" type=\"text\" placeholder=\"Nome da unidade ou endereço...\"></div></div>\n        <div class=\"filter-group\"><label>Tipo</label><select class=\"filter-select\" id=\"filter-unidades-tipo\"><option value=\"\">Todos os tipos</option><option value=\"Hospital\">Hospital</option><option value=\"UPA\">UPA</option><option value=\"UBS\">UBS</option><option value=\"AME\">AME</option></select></div>\n        <div class=\"filter-group\"><label>Status</label><select class=\"filter-select\" id=\"filter-unidades-status\"><option value=\"\">Qualquer status</option><option value=\"Operacional\">Operacional</option><option value=\"Manutenção\">Manutenção</option><option value=\"Inativa\">Inativa</option></select></div>\n        <div class=\"filter-group\" style=\"justify-content:flex-end;display:flex;gap:6px\"><label>&nbsp;</label><button class=\"btn btn-outline btn-sm\" id=\"btn-filtrar-unidades\" style=\"gap:5px\"><svg width=\"13\" height=\"13\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><polygon points=\"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3\"/></svg> Filtrar</button><button class=\"btn btn-outline btn-sm\" id=\"btn-limpar-unidades\" title=\"Limpar todos os filtros\">Limpar</button></div>\n      </div>\n    </div>\n    <div class=\"tbl-wrap\"><table>\n      <thead><tr><th>Unidade</th><th>Tipo</th><th>Endereço</th><th>Capacidade</th><th>Status</th><th>Ações</th></tr></thead>\n      <tbody data-box=\"unidades-tbody\"><tr><td><div style=\"display:flex;align-items:center;gap:10px\"><div style=\"width:36px;height:36px;border-radius:9px;background:#fef2f2;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0\">🏥</div><div><div style=\"font-weight:600\">Hospital Central Municipal</div><div style=\"font-size:11px;color:var(--text-muted)\">ID: 102938</div></div></div></td>\n          <td><span class=\"type-chip\" style=\"background:#fef2f2;color:#b91c1c\">Hospital</span></td>\n          <td><div style=\"font-size:12.5px\">Av. Brasil, 1500 – Centro</div></td>\n          <td><div style=\"font-size:11.5px;color:var(--text-muted);margin-bottom:4px\">500 leitos</div><div class=\"prog-wrap\"><div class=\"prog-bar\"><div class=\"prog-fill bar-blue\" style=\"width:85%\"></div></div><span class=\"prog-label\" style=\"color:var(--primary)\">85%</span></div></td>\n          <td><span style=\"display:flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--success)\"><span style=\"width:7px;height:7px;border-radius:50%;background:var(--success);display:inline-block\"></span>Operacional</span></td>\n          <td><button class=\"act-btn\">Ver</button><button class=\"act-btn\">Editar</button></td>\n        </tr>\n        <tr>\n          <td><div style=\"display:flex;align-items:center;gap:10px\"><div style=\"width:36px;height:36px;border-radius:9px;background:#fef2f2;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0\">🚑</div><div><div style=\"font-weight:600\">UPA 24h Jardim Sul</div><div style=\"font-size:11px;color:var(--text-muted)\">ID: 102945</div></div></div></td>\n          <td><span class=\"type-chip\" style=\"background:#fef9c3;color:#92400e\">UPA</span></td>\n          <td><div style=\"font-size:12.5px\">Rua das Palmeiras, 45 – Jd. Sul</div></td>\n          <td><div style=\"font-size:11.5px;color:var(--text-muted);margin-bottom:4px\">80 atend/h</div><div class=\"prog-wrap\"><div class=\"prog-bar\"><div class=\"prog-fill\" style=\"width:40%;background:var(--success)\"></div></div><span class=\"prog-label\" style=\"color:var(--success)\">40%</span></div></td>\n          <td><span style=\"display:flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--success)\"><span style=\"width:7px;height:7px;border-radius:50%;background:var(--success);display:inline-block\"></span>Operacional</span></td>\n          <td><button class=\"act-btn\">Ver</button><button class=\"act-btn\">Editar</button></td>\n        </tr>\n        <tr>\n          <td><div style=\"display:flex;align-items:center;gap:10px\"><div style=\"width:36px;height:36px;border-radius:9px;background:#e8f2fb;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0\">🏪</div><div><div style=\"font-weight:600\">UBS Vila Nova</div><div style=\"font-size:11px;color:var(--text-muted)\">ID: 102952</div></div></div></td>\n          <td><span class=\"type-chip\" style=\"background:#e8f2fb;color:#1d4ed8\">UBS</span></td>\n          <td><div style=\"font-size:12.5px\">Praça da Matriz, s/n – Vila Nova</div></td>\n          <td><div style=\"font-size:11.5px;color:var(--danger);margin-bottom:4px;font-weight:600\">Indisponível · Reforma</div><div class=\"prog-bar\"><div class=\"prog-fill bar-red\" style=\"width:100%\"></div></div></td>\n          <td><span style=\"display:flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--danger)\"><span style=\"width:7px;height:7px;border-radius:50%;background:var(--danger);display:inline-block\"></span>Manutenção</span></td>\n          <td><button class=\"act-btn\">Ver</button><button class=\"act-btn\">Editar</button></td>\n        </tr>\n        <tr>\n          <td><div style=\"display:flex;align-items:center;gap:10px\"><div style=\"width:36px;height:36px;border-radius:9px;background:#dcfce7;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0\">🏥</div><div><div style=\"font-weight:600\">Hospital Regional Norte</div><div style=\"font-size:11px;color:var(--text-muted)\">ID: 102960</div></div></div></td>\n          <td><span class=\"type-chip\" style=\"background:#fef2f2;color:#b91c1c\">Hospital</span></td>\n          <td><div style=\"font-size:12.5px\">Rod. BR-153, km 12 – Zona Norte</div></td>\n          <td><div style=\"font-size:11.5px;color:var(--text-muted);margin-bottom:4px\">320 leitos</div><div class=\"prog-wrap\"><div class=\"prog-bar\"><div class=\"prog-fill bar-orange\" style=\"width:73%\"></div></div><span class=\"prog-label\" style=\"color:var(--warning)\">73%</span></div></td>\n          <td><span style=\"display:flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--success)\"><span style=\"width:7px;height:7px;border-radius:50%;background:var(--success);display:inline-block\"></span>Operacional</span></td>\n          <td><button class=\"act-btn\">Ver</button><button class=\"act-btn\">Editar</button></td>\n        </tr>\n        <tr>\n          <td><div style=\"display:flex;align-items:center;gap:10px\"><div style=\"width:36px;height:36px;border-radius:9px;background:#f3e8ff;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0\">🏪</div><div><div style=\"font-weight:600\">AME Especialidades Leste</div><div style=\"font-size:11px;color:var(--text-muted)\">ID: 102971</div></div></div></td>\n          <td><span class=\"type-chip\" style=\"background:#f3e8ff;color:#7e22ce\">AME</span></td>\n          <td><div style=\"font-size:12.5px\">Av. Independência, 800 – Leste</div></td>\n          <td><div style=\"font-size:11.5px;color:var(--text-muted);margin-bottom:4px\">150 cons/dia</div><div class=\"prog-wrap\"><div class=\"prog-bar\"><div class=\"prog-fill bar-blue\" style=\"width:60%\"></div></div><span class=\"prog-label\" style=\"color:var(--primary)\">60%</span></div></td>\n          <td><span style=\"display:flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--success)\"><span style=\"width:7px;height:7px;border-radius:50%;background:var(--success);display:inline-block\"></span>Operacional</span></td>\n          <td><button class=\"act-btn\">Ver</button><button class=\"act-btn\">Editar</button></td>\n        </tr>\n      </tbody>\n    </table></div>\n    <div class=\"pagination\"><span class=\"page-info\">Mostrando 1 a 5 de 42 unidades</span><div class=\"page-btns\"><button class=\"page-btn\">‹</button><button class=\"page-btn active\">1</button><button class=\"page-btn\">2</button><button class=\"page-btn\">3</button><button class=\"page-btn\">…</button><button class=\"page-btn\">5</button><button class=\"page-btn\">›</button></div></div>\n  </div>\n  <div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:16px\">\n    <div class=\"card\" style=\"padding:16px 20px\">\n      <div class=\"card-title\" style=\"margin-bottom:12px;font-size:13.5px\">Relatório de Insumos</div>\n      <div data-box=\"insumos-rows\">\n        <div class=\"insumo-row\"><div class=\"insumo-ico\" style=\"background:#e6f9f7\">💉</div><div class=\"insumo-name\">Vacinas COVID-19</div><div class=\"insumo-pct\" style=\"color:var(--success)\">82%</div></div>\n        <div class=\"insumo-row\"><div class=\"insumo-ico\" style=\"background:#fef2f2\">🩸</div><div class=\"insumo-name\">Estoque de Sangue</div><div class=\"insumo-pct\" style=\"color:var(--warning)\">64%</div></div>\n        <div class=\"insumo-row\"><div class=\"insumo-ico\" style=\"background:#fef9c3\">🦺</div><div class=\"insumo-name\">EPIs Críticos</div><div class=\"insumo-pct\" style=\"color:var(--danger)\">12%</div></div>\n      </div>\n      <button class=\"btn btn-outline\" id=\"btn-relatorio-insumos-unidades\" style=\"width:100%;justify-content:center;margin-top:12px;font-size:12.5px\">Ver Relatório Completo</button>\n    </div>\n    <div class=\"card\" style=\"padding:16px 20px\">\n      <div class=\"card-title\" style=\"margin-bottom:12px;font-size:13.5px\">Distribuição por Tipo</div>\n      <div style=\"display:flex;flex-direction:column;gap:8px\" data-box=\"distribuicao-rows\">\n        <div style=\"display:flex;align-items:center;justify-content:space-between\"><span style=\"display:flex;align-items:center;gap:6px\"><span style=\"width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block\"></span><span style=\"font-size:13px\">Hospital</span></span><span style=\"font-weight:700\">8</span></div>\n        <div style=\"display:flex;align-items:center;justify-content:space-between\"><span style=\"display:flex;align-items:center;gap:6px\"><span style=\"width:10px;height:10px;border-radius:50%;background:#f59e0b;display:inline-block\"></span><span style=\"font-size:13px\">UPA</span></span><span style=\"font-weight:700\">12</span></div>\n        <div style=\"display:flex;align-items:center;justify-content:space-between\"><span style=\"display:flex;align-items:center;gap:6px\"><span style=\"width:10px;height:10px;border-radius:50%;background:#0a6ebd;display:inline-block\"></span><span style=\"font-size:13px\">UBS</span></span><span style=\"font-weight:700\">18</span></div>\n        <div style=\"display:flex;align-items:center;justify-content:space-between\"><span style=\"display:flex;align-items:center;gap:6px\"><span style=\"width:10px;height:10px;border-radius:50%;background:#a855f7;display:inline-block\"></span><span style=\"font-size:13px\">AME</span></span><span style=\"font-weight:700\">4</span></div>\n      </div>\n    </div>\n    <div class=\"card\" style=\"padding:16px 20px\">\n      <div class=\"card-title\" style=\"margin-bottom:12px;font-size:13.5px\">Alertas de Unidades</div>\n      <div data-box=\"alertas-rows\">\n        <div class=\"alert-item\" style=\"padding:9px 0\"><div class=\"alert-ico a-red\" style=\"width:28px;height:28px\"><svg width=\"13\" height=\"13\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" viewBox=\"0 0 24 24\"><path d=\"m10.29 3.86-8.19 14.17A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.72-3l-8.19-14.14a2 2 0 0 0-3.46.01z\"/><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/></svg></div><div class=\"alert-body\"><strong style=\"font-size:12px\">UBS Vila Nova offline</strong><p>Em reforma desde 01/05</p></div></div>\n        <div class=\"alert-item\" style=\"padding:9px 0\"><div class=\"alert-ico a-warn\" style=\"width:28px;height:28px\"><svg width=\"13\" height=\"13\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" viewBox=\"0 0 24 24\"><path d=\"m10.29 3.86-8.19 14.17A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.72-3l-8.19-14.14a2 2 0 0 0-3.46.01z\"/><line x1=\"12\" y1=\"9\" x2=\"12\" y2=\"13\"/><line x1=\"12\" y1=\"17\" x2=\"12.01\" y2=\"17\"/></svg></div><div class=\"alert-body\"><strong style=\"font-size:12px\">Hospital Norte 73% cheio</strong><p>Capacidade em atenção</p></div></div>\n      </div>\n    </div>\n  </div>\n</div>\n\n",
  "json/unidades.json": {
    "layout": "unidades",
    "titulo": "Unidades de Saúde",
    "breadcrumb": "Administração › Gestão de Unidades",
    "subtitulo": "Gerencie a infraestrutura e capacidade das unidades federativas.",
    "boxes": {
      "stats": [
        {
          "label": "Total de Unidades",
          "icon": "🏥",
          "iconClass": "ic-red",
          "value": "42",
          "note": "Unidades cadastradas",
          "noteClass": "note-muted"
        },
        {
          "label": "Operacionais",
          "icon": "✅",
          "iconClass": "ic-green",
          "value": "38",
          "note": "Funcionando normalmente",
          "noteClass": "note-green"
        },
        {
          "label": "Em Manutenção",
          "icon": "🔧",
          "iconClass": "ic-orange",
          "value": "04",
          "note": "Temporariamente inativas",
          "noteClass": "note-orange"
        },
        {
          "label": "Capacidade Total",
          "icon": "👥",
          "iconClass": "ic-blue",
          "value": "12.5k",
          "note": "Leitos disponíveis",
          "noteClass": "note-muted"
        }
      ],
      "lista": [
        {
          "nome": "Hospital Central Municipal",
          "id": "102938",
          "icone": "🏥",
          "icoBg": "#fef2f2",
          "tipo": "Hospital",
          "tipoBg": "#fef2f2",
          "tipoColor": "#b91c1c",
          "endereco": "Av. Brasil, 1500 – Centro",
          "capacidade": "500 leitos",
          "ocupacao": 85,
          "barClass": "bar-blue",
          "status": "Operacional",
          "statusColor": "success"
        },
        {
          "nome": "UPA 24h Jardim Sul",
          "id": "102945",
          "icone": "🚑",
          "icoBg": "#fef2f2",
          "tipo": "UPA",
          "tipoBg": "#fef9c3",
          "tipoColor": "#92400e",
          "endereco": "Rua das Palmeiras, 45 – Jd. Sul",
          "capacidade": "80 atend/h",
          "ocupacao": 40,
          "barColor": "var(--success)",
          "status": "Operacional",
          "statusColor": "success"
        },
        {
          "nome": "UBS Vila Nova",
          "id": "102952",
          "icone": "🏪",
          "icoBg": "#e8f2fb",
          "tipo": "UBS",
          "tipoBg": "#e8f2fb",
          "tipoColor": "#1d4ed8",
          "endereco": "Praça da Matriz, s/n – Vila Nova",
          "capacidade": "Indisponível · Reforma",
          "indisponivel": true,
          "status": "Manutenção",
          "statusColor": "danger"
        },
        {
          "nome": "Hospital Regional Norte",
          "id": "102960",
          "icone": "🏥",
          "icoBg": "#dcfce7",
          "tipo": "Hospital",
          "tipoBg": "#fef2f2",
          "tipoColor": "#b91c1c",
          "endereco": "Rod. BR-153, km 12 – Zona Norte",
          "capacidade": "320 leitos",
          "ocupacao": 73,
          "barClass": "bar-orange",
          "status": "Operacional",
          "statusColor": "success"
        },
        {
          "nome": "AME Especialidades Leste",
          "id": "102971",
          "icone": "🏪",
          "icoBg": "#f3e8ff",
          "tipo": "AME",
          "tipoBg": "#f3e8ff",
          "tipoColor": "#7e22ce",
          "endereco": "Av. Independência, 800 – Leste",
          "capacidade": "150 cons/dia",
          "ocupacao": 60,
          "barClass": "bar-blue",
          "status": "Operacional",
          "statusColor": "success"
        }
      ],
      "distribuicao": [
        {
          "tipo": "Hospital",
          "total": 8,
          "cor": "#ef4444"
        },
        {
          "tipo": "UPA",
          "total": 12,
          "cor": "#f59e0b"
        },
        {
          "tipo": "UBS",
          "total": 18,
          "cor": "#0a6ebd"
        },
        {
          "tipo": "AME",
          "total": 4,
          "cor": "#a855f7"
        }
      ],
      "alertas": [
        {
          "tipo": "red",
          "titulo": "UBS Vila Nova offline",
          "descricao": "Em reforma desde 01/05"
        },
        {
          "tipo": "warn",
          "titulo": "Hospital Norte 73% cheio",
          "descricao": "Capacidade em atenção"
        }
      ],
      "insumos": [
        {
          "nome": "Vacinas COVID-19",
          "icone": "💉",
          "pct": 82,
          "color": "success"
        },
        {
          "nome": "Estoque de Sangue",
          "icone": "🩸",
          "pct": 64,
          "color": "warning"
        },
        {
          "nome": "EPIs Críticos",
          "icone": "🦺",
          "pct": 12,
          "color": "danger"
        }
      ],
      "paginacao": {
        "de": 1,
        "ate": 5,
        "total": 42
      }
    }
  },
  "logs.html": "<div class=\"page active\" id=\"page-logs\">\n  <div class=\"page-hd\">\n    <div>\n      <div class=\"breadcrumb\">Administração › <span>Logs de Sistema</span></div>\n      <div class=\"page-title\">Logs de Sistema</div>\n      <div class=\"page-sub\">Auditoria completa de todas as ações realizadas no sistema.</div>\n    </div>\n    <button class=\"btn btn-outline\" id=\"btn-exportar-logs\">\n      <svg width=\"15\" height=\"15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><polyline points=\"7 10 12 15 17 10\"/><line x1=\"12\" y1=\"15\" x2=\"12\" y2=\"3\"/></svg>\n      Exportar Logs\n    </button>\n  </div>\n  <div class=\"stats-grid cols4\" data-box=\"stats\" style=\"margin-bottom:20px\">\n    <div class=\"stat-card\"><div class=\"stat-label\">Total de registros</div><div class=\"stat-icon ic-blue\">📝</div><div class=\"stat-value\" id=\"stat-logs-total\">0</div><div class=\"stat-note note-muted\">Auditoria geral</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Erros</div><div class=\"stat-icon ic-red\">🚨</div><div class=\"stat-value\" id=\"stat-logs-erros\">0</div><div class=\"stat-note note-red\">Falhas e exceções</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Avisos</div><div class=\"stat-icon ic-yellow\">⚠</div><div class=\"stat-value\" id=\"stat-logs-avisos\">0</div><div class=\"stat-note note-orange\">Alertas de segurança</div></div>\n    <div class=\"stat-card\"><div class=\"stat-label\">Acessos</div><div class=\"stat-icon ic-green\">👤</div><div class=\"stat-value\" id=\"stat-logs-acessos\">0</div><div class=\"stat-note note-green\">Logins e autenticações</div></div>\n  </div>\n  <div style=\"display:grid;grid-template-columns:1fr 260px;gap:16px\">\n    <div class=\"card\">\n      <div class=\"card-header\"><span class=\"card-title\">Registros de Auditoria</span>\n      </div>\n      <div style=\"padding:14px 20px;border-bottom:1px solid var(--border)\">\n        <div class=\"filters-row\" style=\"display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end\">\n          <div class=\"filter-group\">\n            <label>Tipo</label>\n            <select class=\"filter-select\" id=\"filter-logs-tipo\" style=\"min-width:130px\">\n              <option value=\"\">Todos</option>\n              <option value=\"Erro\">Erro</option>\n              <option value=\"Aviso\">Aviso</option>\n              <option value=\"Informação\">Informação</option>\n              <option value=\"Acesso\">Acesso</option>\n            </select>\n          </div>\n          <div class=\"filter-group\">\n            <label>Usuário</label>\n            <input class=\"filter-input\" id=\"filter-logs-usuario\" type=\"text\" placeholder=\"Nome ou login...\">\n          </div>\n          <div class=\"filter-group\">\n            <label>Período (Início)</label>\n            <input class=\"filter-input\" id=\"filter-logs-data-inicio\" type=\"date\" style=\"min-width:130px\">\n          </div>\n          <div class=\"filter-group\">\n            <label>Período (Fim)</label>\n            <input class=\"filter-input\" id=\"filter-logs-data-fim\" type=\"date\" style=\"min-width:130px\">\n          </div>\n          <div class=\"filter-group\">\n            <label>Buscar</label>\n            <div class=\"search-input-wrap\">\n              <svg width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" viewBox=\"0 0 24 24\"><circle cx=\"11\" cy=\"11\" r=\"8\"/><path d=\"m21 21-4.35-4.35\"/></svg>\n              <input class=\"filter-input\" id=\"filter-logs-busca\" type=\"text\" placeholder=\"Ação, módulo ou termo...\" style=\"min-width:160px\">\n            </div>\n          </div>\n          <div class=\"filter-group\" style=\"display:flex;gap:6px\">\n            <button class=\"btn btn-primary btn-sm\" id=\"btn-filtrar-logs\">Filtrar</button>\n            <button class=\"btn btn-outline btn-sm\" id=\"btn-limpar-logs\" title=\"Limpar todos os filtros\">Limpar</button>\n          </div>\n        </div>\n      </div>\n      <div style=\"padding:8px 20px 4px\" data-box=\"logs-list\"></div>\n      <div class=\"pagination\"><span class=\"page-info\"></span><div class=\"page-btns\"></div></div>\n    </div>\n    <div style=\"display:flex;flex-direction:column;gap:16px\">\n      <div class=\"card\" style=\"padding:16px 18px\">\n        <div class=\"card-title\" style=\"margin-bottom:12px;font-size:13.5px\">Eventos por Tipo</div>\n        <div style=\"display:flex;flex-direction:column;gap:9px\" id=\"logs-side-eventos\">\n          <div style=\"display:flex;align-items:center;gap:8px\"><span style=\"width:10px;height:10px;border-radius:50%;background:var(--primary);flex-shrink:0\"></span><span style=\"font-size:13px;flex:1\">Informação</span><span style=\"font-weight:700;font-size:13px\" id=\"side-info-count\">0</span></div>\n          <div style=\"display:flex;align-items:center;gap:8px\"><span style=\"width:10px;height:10px;border-radius:50%;background:var(--success);flex-shrink:0\"></span><span style=\"font-size:13px;flex:1\">Acesso</span><span style=\"font-weight:700;font-size:13px\" id=\"side-acesso-count\">0</span></div>\n          <div style=\"display:flex;align-items:center;gap:8px\"><span style=\"width:10px;height:10px;border-radius:50%;background:var(--warning);flex-shrink:0\"></span><span style=\"font-size:13px;flex:1\">Aviso</span><span style=\"font-weight:700;font-size:13px\" id=\"side-aviso-count\">0</span></div>\n          <div style=\"display:flex;align-items:center;gap:8px\"><span style=\"width:10px;height:10px;border-radius:50%;background:var(--danger);flex-shrink:0\"></span><span style=\"font-size:13px;flex:1\">Erro</span><span style=\"font-weight:700;font-size:13px\" id=\"side-erro-count\">0</span></div>\n        </div>\n      </div>\n      <div class=\"card\" style=\"padding:16px 18px\">\n        <div class=\"card-title\" style=\"margin-bottom:12px;font-size:13.5px\">Módulos Auditados</div>\n        <div style=\"display:flex;flex-direction:column;gap:8px\">\n          <div><div style=\"display:flex;justify-content:space-between;margin-bottom:4px\"><span style=\"font-size:12.5px\">EXAMES</span><span style=\"font-size:12px;font-weight:700\">Ativo</span></div><div class=\"prog-bar\"><div class=\"prog-fill bar-orange\" style=\"width:85%\"></div></div></div>\n          <div><div style=\"display:flex;justify-content:space-between;margin-bottom:4px\"><span style=\"font-size:12.5px\">AGENDAMENTOS</span><span style=\"font-size:12px;font-weight:700\">Ativo</span></div><div class=\"prog-bar\"><div class=\"prog-fill bar-blue\" style=\"width:80%\"></div></div></div>\n          <div><div style=\"display:flex;justify-content:space-between;margin-bottom:4px\"><span style=\"font-size:12.5px\">CONSULTAS</span><span style=\"font-size:12px;font-weight:700\">Ativo</span></div><div class=\"prog-bar\"><div class=\"prog-fill\" style=\"width:65%;background:var(--accent)\"></div></div></div>\n          <div><div style=\"display:flex;justify-content:space-between;margin-bottom:4px\"><span style=\"font-size:12.5px\">AUTH & SEGURANÇA</span><span style=\"font-size:12px;font-weight:700\">Ativo</span></div><div class=\"prog-bar\"><div class=\"prog-fill\" style=\"width:75%;background:#a855f7\"></div></div></div>\n        </div>\n      </div>\n      <div class=\"card\" style=\"padding:16px 18px\">\n        <div class=\"card-title\" style=\"margin-bottom:10px;font-size:13.5px\">Integridade do Log</div>\n        <div style=\"display:flex;flex-direction:column;gap:7px\">\n          <div style=\"display:flex;align-items:center;justify-content:space-between\"><span style=\"font-size:12.5px;color:var(--text-muted)\">Persistência</span><span style=\"font-size:12px;font-weight:700;color:var(--success)\">Local + Auditoria</span></div>\n          <div style=\"display:flex;align-items:center;justify-content:space-between\"><span style=\"font-size:12.5px;color:var(--text-muted)\">Imutabilidade</span><span style=\"font-size:12px;font-weight:700;color:var(--primary)\">Audit Trail OK</span></div>\n          <div style=\"display:flex;align-items:center;justify-content:space-between;padding-top:4px;border-top:1px solid var(--border);margin-top:2px\"><span style=\"font-size:12px;color:var(--text-muted)\">Status Auditoria</span><span style=\"font-size:12px;font-weight:700;color:var(--success);font-family:'DM Mono',monospace\">ATIVO</span></div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n",
  "json/logs.json": {
    "layout": "logs",
    "titulo": "Logs de Sistema",
    "breadcrumb": "Administração › Logs de Sistema",
    "subtitulo": "Auditoria completa de todas as ações realizadas no sistema.",
    "boxes": {
      "stats": [
        {
          "label": "Total de registros",
          "icon": "📝",
          "iconClass": "ic-blue",
          "value": "8",
          "note": "Auditoria geral",
          "noteClass": "note-muted"
        },
        {
          "label": "Erros",
          "icon": "🚨",
          "iconClass": "ic-red",
          "value": "1",
          "note": "Falhas e exceções",
          "noteClass": "note-red"
        },
        {
          "label": "Avisos",
          "icon": "⚠",
          "iconClass": "ic-yellow",
          "value": "2",
          "note": "Alertas de segurança",
          "noteClass": "note-orange"
        },
        {
          "label": "Acessos",
          "icon": "👤",
          "iconClass": "ic-green",
          "value": "2",
          "note": "Logins e autenticações",
          "noteClass": "note-green"
        }
      ],
      "registros": [
        {
          "id": "LOG-1001",
          "hora": "09:41:22",
          "data": "07/05/2026",
          "dataHora": "07/05/2026 09:41:22",
          "tipo": "Erro",
          "badge": "b-red",
          "dot": "danger",
          "acao": "Falha na conexão com banco de dados",
          "titulo": "Falha na conexão com banco de dados",
          "descricao": "Tempo limite atingido durante tentativa de conexão com a base de dados principal.",
          "usuario": "sistema",
          "modulo": "DB_CONN",
          "ip": "192.168.1.10",
          "meta": "Módulo: DB_CONN · Usuário: sistema · IP: 192.168.1.10"
        },
        {
          "id": "LOG-1002",
          "hora": "09:38:14",
          "data": "07/05/2026",
          "dataHora": "07/05/2026 09:38:14",
          "tipo": "Informação",
          "badge": "b-blue",
          "dot": "primary",
          "acao": "Laudo do exame #EX-8819 emitido",
          "titulo": "Laudo do exame #EX-8819 emitido",
          "descricao": "Laudo do exame #EX-8819 (Raio-X Tórax) emitido e assinado digitalmente.",
          "usuario": "Dr. Paulo Ribeiro",
          "modulo": "EXAMES",
          "ip": "192.168.1.45",
          "meta": "Módulo: EXAMES · Usuário: Dr. Paulo Ribeiro · IP: 192.168.1.45"
        },
        {
          "id": "LOG-1003",
          "hora": "09:35:07",
          "data": "07/05/2026",
          "dataHora": "07/05/2026 09:35:07",
          "tipo": "Aviso",
          "badge": "b-yellow",
          "dot": "warning",
          "acao": "Estoque de Insulina abaixo do mínimo",
          "titulo": "Estoque de Insulina abaixo do mínimo",
          "descricao": "Estoque de Insulina NPH na Unidade Sul atingiu o limite crítico de segurança.",
          "usuario": "sistema",
          "modulo": "ESTOQUE",
          "ip": "192.168.1.10",
          "meta": "Módulo: ESTOQUE · Usuário: sistema · Unidade: Sul"
        },
        {
          "id": "LOG-1004",
          "hora": "09:31:55",
          "data": "07/05/2026",
          "dataHora": "07/05/2026 09:31:55",
          "tipo": "Acesso",
          "badge": "b-green",
          "dot": "success",
          "acao": "Login realizado com sucesso",
          "titulo": "Login realizado com sucesso",
          "descricao": "Usuário Denilson Barrios autenticado com perfil Administrador.",
          "usuario": "Denilson Barrios",
          "modulo": "AUTH",
          "ip": "192.168.1.1",
          "meta": "Módulo: AUTH · Usuário: Denilson Barrios · IP: 192.168.1.1"
        },
        {
          "id": "LOG-1005",
          "hora": "09:28:43",
          "data": "07/05/2026",
          "dataHora": "07/05/2026 09:28:43",
          "tipo": "Informação",
          "badge": "b-blue",
          "dot": "primary",
          "acao": "Agendamento #10297 criado",
          "titulo": "Agendamento #10297 criado",
          "descricao": "Solicitação de agendamento realizada para Maria Santos em Pediatria.",
          "usuario": "Enf. Cláudia",
          "modulo": "AGENDAMENTOS",
          "ip": "192.168.1.22",
          "meta": "Módulo: AGENDAMENTOS · Usuário: Enf. Cláudia · IP: 192.168.1.22"
        },
        {
          "id": "LOG-1006",
          "hora": "09:22:18",
          "data": "07/05/2026",
          "dataHora": "07/05/2026 09:22:18",
          "tipo": "Aviso",
          "badge": "b-yellow",
          "dot": "warning",
          "acao": "Tentativa de acesso não autorizado bloqueada",
          "titulo": "Tentativa de acesso não autorizado bloqueada",
          "descricao": "Usuário sem privilégios administrativos tentou acessar o painel de logs.",
          "usuario": "Carlos Braga",
          "modulo": "SEGURANÇA",
          "ip": "192.168.1.88",
          "meta": "Módulo: SEGURANÇA · Usuário: Carlos Braga · IP: 192.168.1.88"
        },
        {
          "id": "LOG-1007",
          "hora": "16:15:30",
          "data": "06/05/2026",
          "dataHora": "06/05/2026 16:15:30",
          "tipo": "Acesso",
          "badge": "b-green",
          "dot": "success",
          "acao": "Logout realizado",
          "titulo": "Logout realizado",
          "descricao": "Sessão encerrada voluntariamente pelo usuário.",
          "usuario": "Dr. Arnaldo Luiz",
          "modulo": "AUTH",
          "ip": "192.168.1.15",
          "meta": "Módulo: AUTH · Usuário: Dr. Arnaldo Luiz · IP: 192.168.1.15"
        },
        {
          "id": "LOG-1008",
          "hora": "14:10:00",
          "data": "06/05/2026",
          "dataHora": "06/05/2026 14:10:00",
          "tipo": "Informação",
          "badge": "b-blue",
          "dot": "primary",
          "acao": "Exame solicitado: #EX-8819",
          "titulo": "Exame solicitado: #EX-8819",
          "descricao": "Solicitação de exame Raio-X Tórax para a paciente Maria Santos.",
          "usuario": "Dr. Paulo Ribeiro",
          "modulo": "EXAMES",
          "ip": "192.168.1.45",
          "meta": "Módulo: EXAMES · Usuário: Dr. Paulo Ribeiro · Paciente: Maria Santos"
        }
      ],
      "paginacao": {
        "de": 1,
        "ate": 4,
        "total": 8
      }
    }
  },
  "cadastro-usuarios.html": "<div class=\"page active\" id=\"page-cadastro-usuarios\">\n  <div class=\"page-hd\">\n    <div>\n      <div class=\"breadcrumb\">Administração › <span>Cadastro de Usuários</span></div>\n      <div class=\"page-title\">Cadastro de Usuários</div>\n      <div class=\"page-sub\">Cadastre e gerencie os perfis de Cidadãos, Recepção, Profissionais da Saúde e Administradores (TI) no sistema. Contas de Cidadão têm acesso web só aos próprios dados (Agendamentos, Consultas e Exames, em modo visualização).</div>\n    </div>\n  </div>\n\n  <div style=\"display:grid;grid-template-columns:1fr 360px;gap:20px\">\n    <div>\n      <div class=\"card card-body\">\n        <h3 class=\"card-title\" style=\"margin-bottom:16px;color:var(--text)\">✏️ Formulário de Cadastro</h3>\n        <form id=\"form-cadastro-usuario\" onsubmit=\"return false;\">\n          \n          <div class=\"config-row\">\n            <div class=\"config-field\">\n              <label for=\"cad-nome\">Nome Completo</label>\n              <input type=\"text\" id=\"cad-nome\" placeholder=\"Digite o nome completo\" required>\n            </div>\n            <div class=\"config-field\">\n              <label for=\"cad-cpf\">CPF</label>\n              <input type=\"text\" id=\"cad-cpf\" placeholder=\"000.000.000-00\" maxlength=\"14\" required>\n            </div>\n          </div>\n\n          <div class=\"config-row\">\n            <div class=\"config-field\">\n              <label for=\"cad-email\">E-mail</label>\n              <input type=\"email\" id=\"cad-email\" placeholder=\"nome@exemplo.com\" pattern=\"[a-z0-9._%+\\-]+@[a-z0-9.\\-]+\\.[a-z]{2,}$\" title=\"Insira um e-mail válido, ex: nome@exemplo.com\" required>\n            </div>\n            <div class=\"config-field\">\n              <label for=\"cad-senha\">Senha de Acesso</label>\n              <input type=\"password\" id=\"cad-senha\" placeholder=\"Digite a senha\" required>\n            </div>\n          </div>\n\n          <div class=\"config-row\" style=\"margin-bottom:20px\">\n            <div class=\"config-field\" style=\"grid-column: span 2\">\n              <label for=\"cad-perfil\">Perfil do Usuário</label>\n              <select id=\"cad-perfil\" required>\n                <option value=\"\" disabled selected>Selecione o perfil...</option>\n                <option value=\"Cidadão\">Cidadão</option>\n                <option value=\"Recepção\">Recepção</option>\n                <option value=\"Profissional da Saúde\">Profissional da Saúde</option>\n                <option value=\"Administrador\">Administrador (TI)</option>\n              </select>\n            </div>\n          </div>\n\n          <!-- Campos Específicos do Cidadão -->\n          <div id=\"fields-paciente\" class=\"profile-fields-section\" style=\"display:none; border-top: 1px solid var(--border); padding-top: 16px; margin-top: 16px;\">\n            <h4 style=\"font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;\">Dados do Cidadão</h4>\n            <div class=\"config-row\">\n              <div class=\"config-field\">\n                <label for=\"cad-rg\">RG</label>\n                <input type=\"text\" id=\"cad-rg\" placeholder=\"Digite o RG\">\n              </div>\n              <div class=\"config-field\">\n                <label for=\"cad-sus\">Cartão SUS</label>\n                <input type=\"text\" id=\"cad-sus\" placeholder=\"000.0000.0000.0000\" maxlength=\"18\">\n              </div>\n            </div>\n            <div class=\"config-field\" style=\"margin-top:12px\">\n              <label for=\"cad-nascimento\">Data de Nascimento</label>\n              <input type=\"date\" id=\"cad-nascimento\">\n            </div>\n          </div>\n\n          <!-- Campos Específicos da Recepção -->\n          <div id=\"fields-recepcao\" class=\"profile-fields-section\" style=\"display:none; border-top: 1px solid var(--border); padding-top: 16px; margin-top: 16px;\">\n            <h4 style=\"font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;\">Dados da Recepção</h4>\n            <div class=\"config-field\">\n              <label for=\"cad-recep-unidade\">Unidade de Saúde</label>\n              <select id=\"cad-recep-unidade\">\n                <option value=\"\" disabled selected>Selecione a unidade...</option>\n                <option value=\"Unidade Central\">Unidade Central</option>\n                <option value=\"Unidade Oeste\">Unidade Oeste</option>\n                <option value=\"Unidade Sul\">Unidade Sul</option>\n                <option value=\"Unidade Norte\">Unidade Norte</option>\n                <option value=\"Unidade Leste\">Unidade Leste</option>\n              </select>\n            </div>\n          </div>\n\n          <!-- Campos Específicos do Profissional de Saúde -->\n          <div id=\"fields-profissional\" class=\"profile-fields-section\" style=\"display:none; border-top: 1px solid var(--border); padding-top: 16px; margin-top: 16px;\">\n            <h4 style=\"font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;\">Dados Profissionais</h4>\n            <div class=\"config-row\">\n              <div class=\"config-field\">\n                <label for=\"cad-registro\">Registro Profissional (CRM/COREN)</label>\n                <input type=\"text\" id=\"cad-registro\" placeholder=\"Ex: CRM/SP 123456\">\n              </div>\n              <div class=\"config-field\">\n                <label for=\"cad-especialidade\">Especialidade</label>\n                <select id=\"cad-especialidade\">\n                  <option value=\"\" disabled selected>Selecione a especialidade...</option>\n                  <option value=\"Clínica Geral\">Clínica Geral</option>\n                  <option value=\"Cardiologia\">Cardiologia</option>\n                  <option value=\"Pediatria\">Pediatria</option>\n                  <option value=\"Ginecologia\">Ginecologia</option>\n                  <option value=\"Ortopedia\">Ortopedia</option>\n                  <option value=\"Dermatologia\">Dermatologia</option>\n                  <option value=\"Enfermagem Geral\">Enfermagem Geral</option>\n                </select>\n              </div>\n            </div>\n            <div class=\"config-field\" style=\"margin-top:12px\">\n              <label for=\"cad-unidade\">Unidade de Saúde Atribuída</label>\n              <select id=\"cad-unidade\">\n                <option value=\"\" disabled selected>Selecione a unidade...</option>\n                <option value=\"Unidade Central\">Unidade Central</option>\n                <option value=\"Unidade Oeste\">Unidade Oeste</option>\n                <option value=\"Unidade Sul\">Unidade Sul</option>\n                <option value=\"Unidade Norte\">Unidade Norte</option>\n                <option value=\"Unidade Leste\">Unidade Leste</option>\n              </select>\n            </div>\n          </div>\n\n          <!-- Campos Específicos do Administrador -->\n          <div id=\"fields-administrador\" class=\"profile-fields-section\" style=\"display:none; border-top: 1px solid var(--border); padding-top: 16px; margin-top: 16px;\">\n            <h4 style=\"font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;\">Dados Administrativos</h4>\n            <div class=\"config-row\">\n              <div class=\"config-field\">\n                <label for=\"cad-setor\">Setor / Departamento</label>\n                <input type=\"text\" id=\"cad-setor\" placeholder=\"Ex: Gestão Geral, TI, Recursos Humanos\">\n              </div>\n              <div class=\"config-field\">\n                <label for=\"cad-cargo\">Cargo / Função</label>\n                <input type=\"text\" id=\"cad-cargo\" placeholder=\"Ex: Diretor Técnico, Supervisor, Analista\">\n              </div>\n            </div>\n          </div>\n\n          <div style=\"display:flex;justify-content:flex-end;margin-top:20px;gap:10px;border-top:1px solid var(--border);padding-top:16px\">\n            <button type=\"button\" class=\"btn btn-outline\" id=\"btn-limpar-cadastro\">Limpar</button>\n            <button type=\"submit\" class=\"btn btn-primary\" id=\"btn-salvar-usuario\">Cadastrar Usuário</button>\n          </div>\n        </form>\n      </div>\n    </div>\n\n    <div>\n      <div class=\"card\">\n        <div class=\"card-header\">\n          <span class=\"card-title\">Usuários Cadastrados</span>\n          <span class=\"badge b-blue\" id=\"users-count-badge\">0</span>\n        </div>\n        <div style=\"padding: 10px 20px; border-bottom: 1px solid var(--border); background: var(--bg);\">\n          <input type=\"text\" id=\"busca-usuarios-cadastrados\" placeholder=\"Filtrar por nome ou CPF...\" style=\"width: 100%; padding: 6px 10px; border-radius: var(--radius-sm); border: 1.5px solid var(--border); font-size: 12px;\">\n        </div>\n        <div style=\"max-height:480px; overflow-y:auto; padding: 10px 0;\" id=\"users-list-container\">\n          <!-- Renderizado dinamicamente -->\n          <div style=\"padding:20px; text-align:center; color:var(--text-muted); font-size:12.5px;\">Nenhum usuário cadastrado.</div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n",
  "configuracoes.html": "<div class=\"page active\" id=\"page-configuracoes\">\n  <div class=\"page-hd\">\n    <div>\n      <div class=\"breadcrumb\">Sistema › <span>Configurações</span></div>\n      <div class=\"page-title\">Configurações do Sistema</div>\n      <div class=\"page-sub\" data-box=\"subtitulo\">Personalize as preferências, perfil e parâmetros do sistema.</div>\n    </div>\n    <button class=\"btn btn-primary btn-sm\" id=\"btn-salvar-config\">Salvar Alterações</button>\n  </div>\n\n  <div class=\"config-card\">\n    <div class=\"config-header-tabs\">\n      <nav class=\"config-nav\" data-box=\"config-nav\" style=\"display:flex;gap:6px;width:100%\"></nav>\n    </div>\n\n    <div class=\"config-body\">\n      <section class=\"config-section active\" id=\"sec-perfil\" data-section=\"perfil\">\n        <h3 class=\"card-title\" style=\"margin-bottom:16px\">Perfil do Usuário</h3>\n        <div class=\"config-row\">\n          <div class=\"config-field\"><label>Nome Completo</label><input type=\"text\" id=\"cfg-nome\" value=\"Denilson Barrios\"></div>\n          <div class=\"config-field\"><label>E-mail</label><input type=\"email\" id=\"cfg-email\" value=\"denilson.barrios@saude.gov.br\"></div>\n        </div>\n        <div class=\"config-row\">\n          <div class=\"config-field\"><label>Cargo</label><input type=\"text\" id=\"cfg-cargo\" value=\"Gestor Geral\"></div>\n          <div class=\"config-field\"><label>Unidade</label><input type=\"text\" id=\"cfg-unidade\" value=\"Unidade Central\"></div>\n        </div>\n        <div class=\"config-field\"><label>Telefone</label><input type=\"tel\" id=\"cfg-telefone\" value=\"(11) 98765-4321\"></div>\n      </section>\n\n      <section class=\"config-section\" id=\"sec-sistema\" data-section=\"sistema\">\n        <h3 class=\"card-title\" style=\"margin-bottom:16px\">Preferências do Sistema</h3>\n        <div class=\"config-row\">\n          <div class=\"config-field\"><label>Idioma</label><select id=\"cfg-idioma\"><option value=\"pt-BR\">Português (Brasil)</option><option value=\"en-US\">English</option></select></div>\n          <div class=\"config-field\"><label>Fuso Horário</label><select id=\"cfg-fuso\"><option value=\"America/Sao_Paulo\">Brasília (GMT-3)</option></select></div>\n        </div>\n        <div class=\"config-row\">\n          <div class=\"config-field\"><label>Itens por Página</label><select id=\"cfg-itens\"><option value=\"10\">10</option><option value=\"25\">25</option><option value=\"50\">50</option></select></div>\n        </div>\n      </section>\n\n      <section class=\"config-section\" id=\"sec-notificacoes\" data-section=\"notificacoes\">\n        <h3 class=\"card-title\" style=\"margin-bottom:16px\">Notificações</h3>\n        <div data-box=\"notificacoes-list\"></div>\n      </section>\n\n      <section class=\"config-section\" id=\"sec-seguranca\" data-section=\"seguranca\">\n        <h3 class=\"card-title\" style=\"margin-bottom:16px\">Segurança</h3>\n        <div class=\"config-row\">\n          <div class=\"config-field\"><label>Timeout de Sessão (min)</label><input type=\"number\" id=\"cfg-timeout\" value=\"30\" min=\"5\" max=\"120\"></div>\n          <div class=\"config-field\"><label>Último Acesso</label><input type=\"text\" id=\"cfg-ultimo-acesso\" value=\"07/05/2026 09:31\" readonly></div>\n        </div>\n        <div class=\"toggle-row\">\n          <div class=\"toggle-info\"><strong>Autenticação em Dois Fatores (2FA)</strong><span>Camada extra de proteção via aplicativo autenticador</span></div>\n          <input type=\"checkbox\" id=\"cfg-2fa\">\n        </div>\n      </section>\n    </div>\n  </div>\n</div>\n",
  "json/configuracoes.json": {
    "layout": "configuracoes",
    "titulo": "Configurações",
    "breadcrumb": "Sistema › Configurações",
    "subtitulo": "Personalize o sistema, perfil e preferências de notificação.",
    "boxes": {
      "secoes": [
        {
          "id": "perfil",
          "label": "Perfil do Usuário"
        },
        {
          "id": "sistema",
          "label": "Sistema"
        },
        {
          "id": "notificacoes",
          "label": "Notificações"
        },
        {
          "id": "seguranca",
          "label": "Segurança"
        }
      ],
      "perfil": {
        "nome": "Denilson Barrios",
        "email": "denilson.barrios@saude.gov.br",
        "cargo": "Gestor Geral",
        "unidade": "Unidade Central",
        "telefone": "(11) 98765-4321"
      },
      "sistema": {
        "idioma": "pt-BR",
        "fuso": "America/Sao_Paulo",
        "itensPorPagina": 10
      },
      "notificacoes": [
        {
          "id": "email",
          "titulo": "Alertas por E-mail",
          "descricao": "Receber alertas críticos por e-mail",
          "ativo": true
        },
        {
          "id": "push",
          "titulo": "Notificações Push",
          "descricao": "Alertas em tempo real no navegador",
          "ativo": true
        },
        {
          "id": "estoque",
          "titulo": "Alertas de Estoque",
          "descricao": "Avisos quando insumos estiverem baixos",
          "ativo": true
        },
        {
          "id": "manutencao",
          "titulo": "Manutenção Programada",
          "descricao": "Avisos de indisponibilidade do sistema",
          "ativo": false
        }
      ],
      "seguranca": {
        "sessaoTimeout": 30,
        "doisFatores": false,
        "ultimoAcesso": "07/05/2026 09:31"
      }
    }
  },
  "perfil.html": "<div class=\"page active\" id=\"page-perfil\">\n  <div class=\"page-hd\">\n    <div>\n      <div class=\"breadcrumb\">Sistema › <span>Meu Perfil & Edição</span></div>\n      <div class=\"page-title\">Meu Perfil & Configurações da Conta</div>\n      <div class=\"page-sub\">Visualize suas credenciais, edite seus dados pessoais e personalize o sistema.</div>\n    </div>\n    <button class=\"btn btn-primary\" id=\"btn-salvar-perfil-top\">\n      <svg width=\"15\" height=\"15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" viewBox=\"0 0 24 24\"><path d=\"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z\"/><polyline points=\"17 21 17 13 7 13 7 21\"/><polyline points=\"7 3 7 8 15 8\"/></svg>\n      Salvar Alterações\n    </button>\n  </div>\n\n  <!-- Header Card do Perfil -->\n  <div class=\"card perfil-hdr-card\" style=\"padding:24px;margin-bottom:20px;display:flex;align-items:center;gap:20px\">\n    <div style=\"width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--accent));display:flex;align-items:center;justify-content:center;color:#fff;font-size:26px;font-weight:700;box-shadow:0 4px 14px rgba(10,110,189,0.3);flex-shrink:0\" id=\"perfil-avatar-big\">\n      DR\n    </div>\n    <div style=\"flex:1\">\n      <div style=\"display:flex;align-items:center;gap:10px\">\n        <h2 style=\"font-size:22px;font-weight:700;color:var(--text)\" id=\"perfil-nome-hdr\">Denilson Barrios</h2>\n        <span class=\"badge b-blue\" id=\"perfil-cargo-badge\">Gestor Geral</span>\n      </div>\n      <div style=\"font-size:13.5px;color:var(--text-muted);margin-top:4px\" id=\"perfil-meta-hdr\">\n        Matrícula: <strong class=\"mono\" style=\"color:var(--text)\">MAT-2026-9814</strong> · Registro/CRM: <strong class=\"mono\" style=\"color:var(--text)\">MS-88192-SP</strong> · Unidade: <strong style=\"color:var(--text)\" id=\"perfil-unidade-hdr\">Unidade Central UPA 24H</strong>\n      </div>\n    </div>\n  </div>\n\n  <div style=\"display:grid;grid-template-columns:1fr 340px;gap:20px\">\n    <div style=\"display:flex;flex-direction:column;gap:20px\">\n      <!-- Edição das Informações Pessoais do Usuário -->\n      <div class=\"card card-body\">\n        <h3 class=\"card-title\" style=\"margin-bottom:16px;display:flex;align-items:center;gap:8px;color:var(--text)\">\n          ✏️ Editar Informações do Usuário\n        </h3>\n        <form id=\"form-edit-perfil\" onsubmit=\"return false;\">\n          <div class=\"config-row\" style=\"margin-bottom:14px\">\n            <div class=\"config-field\">\n              <label>Nome Completo</label>\n              <input type=\"text\" id=\"perfil-edit-nome\" value=\"Denilson Barrios\" placeholder=\"Nome completo\">\n            </div>\n            <div class=\"config-field\">\n              <label>E-mail Institucional</label>\n              <input type=\"email\" id=\"perfil-edit-email\" value=\"denilson.barrios@saude.gov.br\" placeholder=\"email@saude.gov.br\">\n            </div>\n          </div>\n          <div class=\"config-row\" style=\"margin-bottom:14px\">\n            <div class=\"config-field\">\n              <label>Cargo / Função</label>\n              <input type=\"text\" id=\"perfil-edit-cargo\" value=\"Gestor Geral\" placeholder=\"Cargo profissional\">\n            </div>\n            <div class=\"config-field\">\n              <label>Unidade Principal</label>\n              <input type=\"text\" id=\"perfil-edit-unidade\" value=\"Unidade Central\" placeholder=\"Unidade de Saúde\">\n            </div>\n          </div>\n          <div class=\"config-row\" style=\"margin-bottom:14px\">\n            <div class=\"config-field\" style=\"grid-column: span 2\">\n              <label>Telefone de Contato</label>\n              <input type=\"tel\" id=\"perfil-edit-telefone\" value=\"(11) 98765-4321\" placeholder=\"(00) 00000-0000\">\n            </div>\n          </div>\n          <div style=\"display:flex;justify-content:flex-end;margin-top:10px\">\n            <button class=\"btn btn-primary\" id=\"btn-salvar-perfil\">Salvar Alterações do Perfil</button>\n          </div>\n        </form>\n      </div>\n\n    </div>\n\n    <div style=\"display:flex;flex-direction:column;gap:20px\">\n      <!-- Recuperação de Senha -->\n      <div class=\"card card-body\">\n        <h3 class=\"card-title\" style=\"margin-bottom:12px;color:var(--text)\">🔒 Recuperação de Senha</h3>\n        <button class=\"btn btn-outline btn-sm\" id=\"btn-esqueceu-senha\" style=\"width:100%;justify-content:center;margin-bottom:10px\" onclick=\"document.getElementById('form-recuperar-senha').style.display='block'; this.style.display='none';\">Esqueceu sua senha?</button>\n        <form id=\"form-recuperar-senha\" onsubmit=\"return false;\" style=\"display:none;\">\n          <div class=\"form-group\" style=\"margin-bottom:10px\">\n            <label style=\"color:var(--text-muted)\">Digite seu CPF para solicitar nova senha ao T.I</label>\n            <input type=\"text\" id=\"recupera-cpf\" placeholder=\"000.000.000-00\" required>\n          </div>\n          <button class=\"btn btn-primary btn-sm\" id=\"btn-confirmar-recuperacao\" style=\"width:100%;justify-content:center;margin-top:6px\">Confirmar solicitação</button>\n        </form>\n      </div>\n    </div>\n  </div>\n</div>\n",
  "json/perfil.json": {
    "layout": "perfil",
    "titulo": "Perfil do Usuário",
    "breadcrumb": "Sistema › Meu Perfil",
    "subtitulo": "Informações pessoais, credenciais médicas e escala de trabalho."
  }
};
