/* Learny · parte 23 · Cuenta (Bloque 2: interfaz de registro, inicio de sesión y recuperación)
   Script clásico. Usa window.LearnyCloud.account (js/firebase/firebase-auth.js). Mientras Firebase no esté disponible (demo, sin configurar o sin conexión) el botón «Entrar» queda oculto
   y Learny se comporta exactamente como antes. El inicio de sesión es OPCIONAL: solo las secciones registradas como privadas lo piden (protectPage; en el Bloque 5 se registrará la de Learny Pro).
   Bloque 5: la página «Learny Pro» (#pro) es privada: sin sesión redirige a Hoy y abre el inicio de sesión; con sesión muestra el plan de la cuenta y el catálogo.
   Bloque 4: en esa ventana se puede cambiar el nombre (LearnyCloud.profile.update; el correo y el plan no se editan aquí).
   Bloque 3: la ventana «Tu cuenta» muestra el plan leído de Firestore (LearnyCloud.profile, solo lectura; el navegador nunca activa Pro). Este archivo no escribe en Firestore ni decide quién es Pro (Bloque 6). Se carga con <script defer> después de extras.js. */
'use strict';

(() => {
  const btn = $('#account-button'); if (!btn) return;
  const PRIVATE = new Set(['pro']); // ids de páginas que exigen sesión (Bloque 5: la sección Learny Pro)
  let waiter = null;           // requireAuth pendiente: { resolve }
  let busy = false;

  const acc = () => window.LearnyCloud && window.LearnyCloud.account;
  const avail = () => !!(acc() && acc().available);
  const settle = (u) => { const w = waiter; waiter = null; if (w) w.resolve(u); };

  /* Botón de la barra superior: «Entrar» sin sesión, «Cuenta» con sesión. Oculto si las cuentas no están disponibles. */
  function paint() {
    btn.hidden = !avail();
    $$('.nav-button[data-page="pro"], .nav-label[data-for="pro"]').forEach((el) => { el.hidden = !avail(); }); // sin cuentas disponibles (demo, sin configurar, sin conexión) la sección Pro no se ofrece
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
      busy = false; settle(u); closeModal(); // primero se avisa de que hay sesión y luego se cierra la ventana
      toast(mode === 'register' ? 'Cuenta creada. Ya iniciaste sesión.' : 'Sesión iniciada.');
      paint();
    } catch (e) { toast(e.message, 'error'); busy = false; if (go) { go.disabled = false; go.removeAttribute('aria-busy'); } }
  }

  /* Plan de la cuenta (Bloque 3): se pinta con lo que dice LearnyCloud.profile. Sin perfil cargado nunca se asume Pro. */
  const prof = () => window.LearnyCloud && window.LearnyCloud.profile;
  function planHtml() {
    const pr = prof(); if (!pr || !pr.available) return '';
    const st = pr.status();
    if (st === 'loading') return '<p>Cargando tu plan…</p>';
    if (st === 'error') return `<p class="modal-tip">${esc(pr.error() || 'No se pudo cargar tu plan.')}</p><div class="actions"><button class="outline-button" type="button" data-acc="retry">Reintentar</button></div>`;
    const p = pr.current(); if (!p) return '';
    if (!pr.isProSync()) return '<p>Plan: <b>Gratis</b></p>';
    const until = p.proExpiresAt ? ` · vence el ${esc(new Date(p.proExpiresAt).toLocaleDateString(state.settings.lang === 'en' ? 'en' : 'es'))}` : '';
    return `<p>Plan: <b>Learny Pro</b>${until}</p>`;
  }
  function paintPlan() { const box = $('#acc-plan'); if (box && modalOpen()) box.innerHTML = planHtml(); paintName(); }

  /* Bloque 4: formulario del nombre (solo con perfil cargado). El correo no se cambia aquí. */
  function nameHtml() {
    const pr = prof(); if (!pr || !pr.available || pr.status() !== 'ready' || !pr.current()) return '';
    return `<label>Nombre (opcional)<input name="displayName" type="text" maxlength="40" autocomplete="nickname" value="${esc(pr.current().displayName || '')}"></label>
      <div class="actions"><button class="primary-button" type="submit">Guardar nombre</button></div>`;
  }
  function paintName() { const box = $('#acc-name'); if (box && modalOpen()) { const had = box.querySelector('input'); if (!had || !box.contains(document.activeElement)) box.innerHTML = nameHtml(); } }

  async function saveName(d) {
    if (busy) return;
    const pr = prof(); if (!pr || !pr.available) return;
    busy = true; const go = $('#acc-name .primary-button'); if (go) { go.disabled = true; go.setAttribute('aria-busy', 'true'); }
    try { await pr.update({ displayName: d.get('displayName') }); const inp = $('#acc-name [name="displayName"]'); if (inp) inp.value = pr.current()?.displayName || ''; toast('Nombre guardado.'); }
    catch (e) { toast(e.message, 'error'); }
    finally { busy = false; const g = $('#acc-name .primary-button'); if (g) { g.disabled = false; g.removeAttribute('aria-busy'); } }
  }

  function accountDialog() {
    const u = acc().user(); if (!u) return dialog('login');
    const pc = prof()?.current?.();
    const who = pc && pc.displayName ? `<b translate="no">${esc(pc.displayName)}</b> (<span translate="no">${esc(u.email)}</span>)` : `<b translate="no">${esc(u.email)}</b>`;
    modal(`<h2>Tu cuenta</h2><p>Sesión iniciada como ${who}.</p>
      <div id="acc-plan" aria-live="polite">${planHtml()}</div>
      <div id="acc-name">${nameHtml()}</div>
      <p class="modal-tip">Tus tarjetas y demás datos siguen guardados en este navegador. Aún no se sincronizan con la nube.</p>
      <div class="actions"><button class="outline-button" type="button" data-acc="out">Cerrar sesión</button><button class="outline-button" type="button" data-close-modal>Cerrar</button></div>`, saveName, () => { $('#modal-body').onclick = null; });
    $('#modal-body').onclick = async (e) => {
      if (e.target.closest('[data-acc="retry"]')) { const pr = prof(); if (pr && pr.available) pr.refresh(); return; }
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

  /* Bloque 5: contenido de la página Learny Pro. El plan sale de Firestore (solo lectura); el catálogo, de PRO_FEATURES (js/20-pro.js). */
  function renderProPage() {
    const a = $('#pro-account-card'), f = $('#pro-features-card'); if (!a || !f) return;
    const u = acc()?.user();
    if (!u) { a.innerHTML = '<h2>Inicia sesión</h2><p>Para ver tu plan necesitas una cuenta.</p>'; f.innerHTML = ''; return; }
    a.innerHTML = `<div class="card-head"><div><h2>Tu plan</h2><p class="lead">Cuenta: <span translate="no">${esc(u.email)}</span></p></div></div>
      <div id="pro-plan" aria-live="polite">${planHtml() || '<p>Plan: <b>Gratis</b></p>'}</div>
      <p class="hint">El plan lo guarda el servidor: este navegador no puede activar Pro en tu cuenta. El cobro todavía no existe.</p>`;
    const rows = (typeof PRO_FEATURES !== 'undefined' ? PRO_FEATURES : []).map((x) => `<li><b>${esc(x.title)}</b> <span class="tag">${x.ready ? 'Disponible' : 'Próximamente'}</span></li>`).join('');
    f.innerHTML = `<h2>Qué incluye Learny Pro</h2><ul class="closure-list">${rows}</ul>
      <p class="hint">Todo lo que ya usas (repaso SM-2, Pomodoro, tutor socrático, plan inverso, importar y copias) sigue siendo gratis.</p>`;
  }
  const repaintPro = () => { if (currentPage === 'pro') renderProPage(); };

  $('#pro-account-card')?.addEventListener('click', (e) => { if (e.target.closest('[data-acc="retry"]')) { const pr = prof(); if (pr && pr.available) pr.refresh(); } });
  btn.onclick = () => { if (avail()) (acc().user() ? accountDialog() : requireAuth()); };
  document.addEventListener('learny:page', guard);
  document.addEventListener('learny:account', () => { paint(); guard(); });
  document.addEventListener('learny:profile', () => { paintPlan(); repaintPro(); });
  document.addEventListener('learny:page', repaintPro);
  document.addEventListener('learny:account', repaintPro);
  document.addEventListener('learny:account-ready', () => { paint(); const a = acc(); if (a && a.available) a.whenReady.then(paint); });
  paint();

  window.LearnyAccount = Object.freeze({ requireAuth, protectPage: (id) => { PRIVATE.add(String(id)); }, open: () => (acc()?.user() ? accountDialog() : dialog('login')) });
})();
