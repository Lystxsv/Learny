/* Learny · parte 23 · Cuenta (Bloque 2: interfaz de registro, inicio de sesión y recuperación)
   Script clásico. Usa window.LearnyCloud.account (js/firebase/firebase-auth.js). Mientras Firebase no esté disponible (demo, sin configurar o sin conexión) el botón «Entrar» queda oculto
   y Learny se comporta exactamente como antes. El inicio de sesión es OPCIONAL: solo las secciones registradas como privadas lo piden (protectPage; en el Bloque 5 se registrará la de Learny Pro).
   Este archivo no guarda nada en Firestore (Bloque 3) ni decide quién es Pro (Bloque 6). Se carga con <script defer> después de extras.js. */
'use strict';

(() => {
  const btn = $('#account-button'); if (!btn) return;
  const PRIVATE = new Set();   // ids de páginas que exigen sesión
  let waiter = null;           // requireAuth pendiente: { resolve }
  let busy = false;

  const acc = () => window.LearnyCloud && window.LearnyCloud.account;
  const avail = () => !!(acc() && acc().available);
  const settle = (u) => { const w = waiter; waiter = null; if (w) w.resolve(u); };

  /* Botón de la barra superior: «Entrar» sin sesión, «Cuenta» con sesión. Oculto si las cuentas no están disponibles. */
  function paint() {
    btn.hidden = !avail();
    if (!avail()) return;
    const u = acc().user();
    btn.textContent = u ? 'Cuenta' : 'Entrar';
    if (u) btn.setAttribute('aria-label', `Cuenta: ${u.email}`); else btn.removeAttribute('aria-label');
  }

  const field = (name, label, type, extra = '') => `<label>${label}<input name="${name}" type="${type}" required ${extra}></label>`;
  const link = (k, text) => `<button class="text-button" type="button" data-acc="${k}">${text}</button>`;

  function dialog(mode, opts = {}) {
    if (!avail()) return toast('Las cuentas no están disponibles ahora mismo.', 'error');
    if (modalOpen() && !$('#modal-body [data-acc-form]')) return settle(null);
    const email = esc(opts.email || '');
    const note = opts.note ? `<p class="modal-tip">${esc(opts.note)}</p>` : '';
    const forms = {
      login: { title: 'Iniciar sesión', go: 'Entrar',
        html: `${field('email', 'Correo electrónico', 'email', `autocomplete="email" maxlength="120" value="${email}"`)}${field('pw', 'Contraseña', 'password', 'autocomplete="current-password" maxlength="200"')}`,
        foot: `${link('register', 'Crear una cuenta')} ${link('reset', 'Olvidé mi contraseña')}` },
      register: { title: 'Crear una cuenta', go: 'Crear cuenta',
        html: `${field('email', 'Correo electrónico', 'email', `autocomplete="email" maxlength="120" value="${email}"`)}${field('pw', 'Contraseña (mínimo 8 caracteres)', 'password', 'autocomplete="new-password" minlength="8" maxlength="200"')}${field('pw2', 'Repite la contraseña', 'password', 'autocomplete="new-password" minlength="8" maxlength="200"')}`,
        foot: link('login', 'Ya tengo una cuenta') },
      reset: { title: 'Recuperar contraseña', go: 'Enviar enlace',
        html: `<p>Escribe tu correo y te enviaremos un enlace para elegir una contraseña nueva.</p>${field('email', 'Correo electrónico', 'email', `autocomplete="email" maxlength="120" value="${email}"`)}`,
        foot: link('login', 'Volver a iniciar sesión') }
    }[mode];
    modal(`<h2>${forms.title}</h2>${note}<div data-acc-form="${mode}">${forms.html}</div>
      <div class="actions"><button class="primary-button" type="submit">${forms.go}</button></div><div class="actions">${forms.foot}</div>
      <p class="hint">Tu cuenta es opcional: Learny gratis sigue funcionando sin ella.</p>`, (d) => submit(mode, d), () => { $('#modal-body').onclick = null; settle(acc().user()); });
    $('#modal-body').onclick = (e) => { const k = e.target.closest('[data-acc]')?.dataset.acc; if (!k || busy) return; const em = $('#modal-body [name="email"]')?.value || ''; dialog(k, { email: em, note: opts.note }); };
  }

  async function submit(mode, d) {
    if (busy) return;
    const email = String(d.get('email') || '').trim(), pw = String(d.get('pw') || '');
    if (!email) return toast('Escribe tu correo electrónico.', 'error');
    if (mode === 'register') {
      if (pw.length < 8) return toast('La contraseña es demasiado débil. Usa al menos 8 caracteres.', 'error');
      if (pw !== String(d.get('pw2') || '')) return toast('Las contraseñas no coinciden.', 'error');
    } else if (mode === 'login' && !pw) return toast('Escribe tu contraseña.', 'error');
    busy = true; const go = $('#modal-body .primary-button'); if (go) { go.disabled = true; go.setAttribute('aria-busy', 'true'); }
    try {
      if (mode === 'reset') { await acc().resetPassword(email); toast('Si existe una cuenta con ese correo, te enviamos un enlace para cambiar la contraseña. Revisa también el correo no deseado.'); busy = false; dialog('login', { email }); return; }
      const u = mode === 'register' ? await acc().signUp(email, pw) : await acc().signIn(email, pw);
      busy = false; closeModal(); toast(mode === 'register' ? 'Cuenta creada. Ya iniciaste sesión.' : 'Sesión iniciada.');
      settle(u); paint();
    } catch (e) { toast(e.message, 'error'); busy = false; if (go) { go.disabled = false; go.removeAttribute('aria-busy'); } }
  }

  function accountDialog() {
    const u = acc().user(); if (!u) return dialog('login');
    modal(`<h2>Tu cuenta</h2><p>Sesión iniciada como <b translate="no">${esc(u.email)}</b>.</p>
      <p class="modal-tip">Tus tarjetas y demás datos siguen guardados en este navegador. Aún no se sincronizan con la nube.</p>
      <div class="actions"><button class="primary-button" type="button" data-acc="out">Cerrar sesión</button><button class="outline-button" type="button" data-close-modal>Cerrar</button></div>`, undefined, () => { $('#modal-body').onclick = null; });
    $('#modal-body').onclick = async (e) => {
      if (!e.target.closest('[data-acc="out"]')) return;
      try { await acc().signOut(); closeModal(); toast('Sesión cerrada.'); } catch (err) { toast(err.message, 'error'); }
    };
  }

  /* Pide sesión y devuelve una promesa con el usuario (o null si se cierra la ventana sin iniciar). Si ya hay sesión, devuelve al usuario al instante. */
  async function requireAuth(opts = {}) {
    if (!avail()) { toast('Las cuentas no están disponibles ahora mismo.', 'error'); return null; }
    await acc().whenReady;
    const u = acc().user(); if (u) return u;
    if (waiter) settle(null);
    return new Promise((resolve) => { waiter = { resolve }; dialog('login', opts); });
  }

  /* Protección de páginas: una página registrada como privada redirige a Hoy y abre el inicio de sesión si no hay sesión. */
  async function guard() {
    if (!PRIVATE.has(currentPage)) return;
    if (!avail()) { showPage('study'); toast('Las cuentas no están disponibles ahora mismo.', 'error'); return; }
    await acc().whenReady;
    if (acc().user() || !PRIVATE.has(currentPage)) return;
    const wanted = currentPage; showPage('study');
    const u = await requireAuth({ note: 'Inicia sesión para entrar en esta sección.' });
    if (u) showPage(wanted);
  }

  btn.onclick = () => { if (avail()) (acc().user() ? accountDialog() : requireAuth()); };
  document.addEventListener('learny:page', guard);
  document.addEventListener('learny:account', () => { paint(); guard(); });
  document.addEventListener('learny:account-ready', () => { paint(); const a = acc(); if (a && a.available) a.whenReady.then(paint); });
  paint();

  window.LearnyAccount = Object.freeze({ requireAuth, protectPage: (id) => { PRIVATE.add(String(id)); }, open: () => (acc()?.user() ? accountDialog() : dialog('login')) });
})();
