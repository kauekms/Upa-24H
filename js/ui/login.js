/**
 * Tela de login (overlay de autenticação).
 *
 * Método do objeto App separado de js/app.js. Anexado com Object.assign,
 * então continua sendo chamado como App.showLoginOverlay().
 */
Object.assign(App, {
  // Contas de demonstração exibidas como atalho de preenchimento.
  CONTAS_DEMO: [
    { rotulo: 'Administrador', usuario: '111.444.777-35', senha: 'admin', icone: '🛡️' },
    { rotulo: 'Profissional da Saúde', usuario: '222.555.888-46', senha: 'prof123', icone: '🩺' },
    { rotulo: 'Recepção', usuario: '444.777.000-83', senha: 'recep123', icone: '🗂️' },
    { rotulo: 'Cidadão', usuario: '333.666.999-57', senha: 'paciente123', icone: '👤' }
  ],

  showLoginOverlay() {
    document.getElementById('login-overlay')?.remove();
    document.body.classList.remove('autenticado');
    this.closeModal();

    const overlay = document.createElement('div');
    overlay.id = 'login-overlay';
    overlay.className = 'login-overlay';
    overlay.innerHTML = `
      <section class="login-brand" aria-hidden="true">
        <div class="login-brand-top">
          <span class="brand-mark brand-mark-lg"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
          <div>
            <strong>UPA 24H</strong>
            <span>Saúde Pública Digital</span>
          </div>
        </div>
        <div class="login-brand-body">
          <h1>Atendimento integrado, do agendamento ao laudo.</h1>
          <p>Gestão de agendamentos, consultas, exames, vacinação e unidades de saúde em um só lugar — com controle de acesso por perfil e trilha de auditoria completa.</p>
          <ul class="login-features">
            <li><span>✓</span> Regras de antecedência e conflito de horário</li>
            <li><span>✓</span> Controle de estoque de vacinas com alertas</li>
            <li><span>✓</span> Registro de auditoria de todas as ações</li>
          </ul>
        </div>
        <div class="login-brand-foot">Sistema Único de Saúde · Unidade de Pronto Atendimento</div>
      </section>

      <section class="login-panel">
        <div class="login-card">
          <img src="assets/logo.png" alt="UPA 24h — Unidade de Pronto Atendimento" class="login-logo" onerror="this.remove()">
          <h2>Acesse sua conta</h2>
          <p class="login-sub">Entre com seu CPF, e-mail ou usuário.</p>

          <div id="login-error-msg" class="callout callout-danger" role="alert" hidden></div>

          <form id="login-form-element" class="login-form" novalidate>
            <div class="form-group">
              <label for="login-username">CPF, e-mail ou usuário</label>
              <div class="input-icone">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input type="text" id="login-username" placeholder="000.000.000-00" required autocomplete="username" inputmode="text">
              </div>
            </div>

            <div class="form-group">
              <div class="label-linha">
                <label for="login-password">Senha</label>
                <button type="button" class="link-btn" id="btn-esqueci-senha">Esqueci minha senha</button>
              </div>
              <div class="input-icone">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input type="password" id="login-password" placeholder="Digite sua senha" required autocomplete="current-password">
                <button type="button" class="input-acao" id="btn-toggle-pwd" aria-label="Mostrar senha">Mostrar</button>
              </div>
            </div>

            <button type="submit" id="btn-submit-login" class="btn btn-primary btn-lg btn-block">Entrar no sistema</button>
          </form>

          <div id="login-recuperar" class="login-recuperar" hidden>
            <p>Informe seu CPF. A equipe de TI será notificada para redefinir sua senha.</p>
            <div class="login-recuperar-linha">
              <input type="text" id="recupera-cpf" placeholder="000.000.000-00" maxlength="14" inputmode="numeric">
              <button type="button" class="btn btn-outline" id="btn-confirmar-recuperacao">Solicitar</button>
            </div>
          </div>

          <div class="login-demo">
            <span class="login-demo-titulo">Contas de demonstração</span>
            <div class="login-demo-lista">
              ${this.CONTAS_DEMO.map(c => `
                <button type="button" class="chip-demo" data-user="${Util.esc(c.usuario)}" data-pass="${Util.esc(c.senha)}">
                  <span>${c.icone}</span>${Util.esc(c.rotulo)}
                </button>`).join('')}
            </div>
          </div>
        </div>
      </section>`;

    document.body.appendChild(overlay);

    const $ = id => document.getElementById(id);
    const inputUser = $('login-username');
    const inputPass = $('login-password');
    const errMsg = $('login-error-msg');
    const submit = $('btn-submit-login');

    const mostrarErro = msg => {
      errMsg.textContent = msg;
      errMsg.hidden = !msg;
    };

    const autenticar = async () => {
      const usuario = inputUser.value.trim();
      const senha = inputPass.value;
      if (!usuario || !senha) {
        mostrarErro('Informe o usuário e a senha.');
        (usuario ? inputPass : inputUser).focus();
        return;
      }
      mostrarErro('');
      submit.disabled = true;
      submit.classList.add('carregando');
      submit.textContent = 'Autenticando…';
      try {
        const res = await window.AuthAPI.login(usuario, senha);
        if (!res.body.success || !res.body.user) {
          mostrarErro(res.body.error || 'Credenciais inválidas. Verifique os dados.');
          inputPass.select();
          return;
        }
        overlay.remove();
        await this.entrarNoSistema(res.body.user);
      } catch (err) {
        mostrarErro('Erro ao processar login: ' + (err.message || err));
      } finally {
        submit.disabled = false;
        submit.classList.remove('carregando');
        submit.textContent = 'Entrar no sistema';
      }
    };

    $('login-form-element').addEventListener('submit', e => {
      e.preventDefault();
      autenticar();
    });

    $('btn-toggle-pwd').addEventListener('click', e => {
      const mostrar = inputPass.type === 'password';
      inputPass.type = mostrar ? 'text' : 'password';
      e.currentTarget.textContent = mostrar ? 'Ocultar' : 'Mostrar';
      e.currentTarget.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
    });

    overlay.querySelectorAll('.chip-demo').forEach(btn => {
      btn.addEventListener('click', () => {
        inputUser.value = btn.dataset.user;
        inputPass.value = btn.dataset.pass;
        mostrarErro('');
        submit.focus();
      });
    });

    // Máscara de CPF apenas quando o usuário está digitando números
    inputUser.addEventListener('input', e => {
      const v = e.target.value;
      if (/^[\d.\-]+$/.test(v)) e.target.value = Util.mascararCPF(v);
    });

    // "Esqueci minha senha": registra a solicitação na auditoria para o TI
    const recuperar = $('login-recuperar');
    $('btn-esqueci-senha').addEventListener('click', () => {
      recuperar.hidden = !recuperar.hidden;
      if (!recuperar.hidden) $('recupera-cpf').focus();
    });
    $('recupera-cpf').addEventListener('input', e => { e.target.value = Util.mascararCPF(e.target.value); });
    $('btn-confirmar-recuperacao').addEventListener('click', () => {
      const cpf = $('recupera-cpf').value;
      const valido = window.UsuariosAPI?.validarCPF(cpf);
      if (!valido?.valido) {
        this.toast(valido?.mensagem || 'Informe um CPF válido.', 'warning');
        return;
      }
      window.AuditoriaService?.registrar({
        usuario: 'Não autenticado',
        acao: 'Solicitação de redefinição de senha',
        tipo: 'Aviso',
        modulo: 'AUTH',
        descricao: `Pedido de redefinição de senha para o CPF final ${valido.limpo.slice(-4)}.`
      });
      // Resposta neutra: não revela se o CPF existe na base.
      this.toast('Solicitação registrada. Se o CPF estiver cadastrado, o TI entrará em contato.', 'success');
      $('recupera-cpf').value = '';
      recuperar.hidden = true;
    });

    setTimeout(() => inputUser.focus(), 50);
  }
});
