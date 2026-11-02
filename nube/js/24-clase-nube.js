/* Learny · parte 24 · Clase en la nube (Etapa 6a, opcional)
   Script clásico. Si hay sesión, refleja en la cuenta los informes de alumnos (state.reports) y los mazos recibidos (state.received) para tenerlos en otro navegador.
   Sin sesión (o en la demostración, sin configurar o sin conexión) no hace nada y Learny se comporta como antes: los datos siguen en este navegador.
   Reglas de la fusión (nada se pierde por sincronizar):
   · Al iniciar sesión (y al volver a la pestaña, como mucho una vez por minuto) se LEE la nube y se fusiona: un informe es «mazo + alumno» y gana el más reciente (si empatan, el local);
     un mazo recibido es su deckId y gana la versión más alta. Lo que llega se valida de nuevo (cleanReports / cleanReceived): la nube no es de fiar.
   · Después se SUBE lo local que falta o cambió. Subir nunca borra: solo se borra de la nube cuando la persona quita un informe o un mazo recibido (evento learny:class-removed).
     Restaurar una copia, importar o «Borrar todo» NO borran la nube; tras «Borrar todo» no se vuelve a traer nada hasta recargar o volver a iniciar sesión.
   · Límite honesto: si quitas algo estando SIN sesión, la nube lo conserva y volverá a aparecer en el siguiente inicio de sesión.
   Privacidad: los informes llevan el nombre de cada alumno; guardarlos en tu cuenta es tu responsabilidad (pídeles permiso). Se carga con <script defer> después de 23-cuenta.js. */
'use strict';

(() => {
  const cloud = () => window.LearnyCloud && window.LearnyCloud.teaching;
  const user = () => { const a = window.LearnyCloud && window.LearnyCloud.account; return a && a.available ? a.user() : null; };
  const live = () => { const c = cloud(); return !!(c && c.available && user()); };
  const avail = () => { const c = cloud(), a = window.LearnyCloud && window.LearnyCloud.account; return !!(c && c.available && a && a.available); };

  let status = 'off', lastOk = '', err = '', busy = false, again = false, needPull = true, suspended = false, lastPull = 0, owner = '', cheap = '', timer = 0, force = false, errAt = 0;
  const known = { reports: new Map(), received: new Map() }; // id de la nube → texto del documento tal como está allí

  /* Identidad en la nube: un informe es «mazo + alumno» (igual en todos los navegadores); un mazo recibido, su deckId. */
  const cloudId = { reports: (r) => deckKey(`${reportDeck(r)}|${normText(r.student)}`), received: (r) => String(r.deckId) };
  const toDoc = {
    reports: (r) => ({ deckId: r.deckId, deckName: r.deckName, version: r.version, student: r.student, date: r.date, total: r.total, cards: r.cards }),
    received: (r) => ({ deckId: r.deckId, name: r.name, author: r.author, description: r.description, version: r.version, importedAt: r.importedAt, keys: r.keys })
  };
  /* Texto canónico (claves ordenadas): Firestore devuelve los campos en otro orden, y sin esto todo parecería «cambiado» tras cada lectura. */
  const canon = (v) => (Array.isArray(v) ? `[${v.map(canon).join(',')}]` : v && typeof v === 'object' ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}` : JSON.stringify(v === undefined ? null : v));
  const doc = (kind, r) => canon(toDoc[kind](r));
  const cheapSig = () => state.reports.map((r) => `${r.id}${r.date}${r.cards.length}`).join(',') + '|' + state.received.map((r) => `${r.deckId}${r.version}${r.keys.length}`).join(',');

  /* ---- Fusión de lo que llega de la nube con lo local ---- */
  function mergeReports(list) {
    let changed = 0;
    cleanReports(list.map((d) => ({ ...d, id: '' }))).forEach((c) => {
      const key = cloudId.reports(c), i = state.reports.findIndex((r) => cloudId.reports(r) === key);
      if (i < 0) { state.reports.push(c); changed++; } else if (c.date > state.reports[i].date) { state.reports[i] = { ...c, id: state.reports[i].id }; changed++; }
    });
    state.reports = state.reports.slice(-40); return changed;
  }
  function mergeReceived(list) {
    let changed = 0;
    cleanReceived(list).forEach((c) => {
      const i = state.received.findIndex((r) => r.deckId === c.deckId);
      if (i < 0) { state.received.push(c); changed++; } else if (c.version > state.received[i].version) { state.received[i] = c; changed++; }
    });
    state.received = state.received.slice(-30); return changed;
  }

  async function pull(c) {
    const [rep, rec] = await Promise.all([c.list('reports'), c.list('received')]);
    known.reports = new Map(rep.map((d) => { const { id, ...rest } = d; return [id, canon(rest)]; })); known.received = new Map(rec.map((d) => { const { id, ...rest } = d; return [id, canon(rest)]; }));
    const n = mergeReports(rep) + mergeReceived(rec);
    if (n) { save(); renderAll(); }
    lastPull = Date.now(); needPull = false;
  }

  /* Sube lo local que falta en la nube o que cambió. Nunca borra. */
  async function push(c) {
    for (const kind of ['reports', 'received']) {
      for (const r of state[kind]) {
        const id = cloudId[kind](r), text = doc(kind, r);
        if (known[kind].get(id) === text) continue;
        await c.put(kind, id, JSON.parse(text)); known[kind].set(id, text);
      }
    }
  }

  async function run() {
    if (!live()) { status = 'off'; paint(); return; }
    if (busy) { again = true; return; }
    const uid = user().uid;
    if (uid !== owner) { owner = uid; needPull = true; known.reports.clear(); known.received.clear(); suspended = false; }
    if (suspended) { paint(); return; }
    if (status === 'error' && !force && Date.now() - errAt < 60000) return; // tras un fallo no se insiste en cada cambio de pantalla: se espera 1 minuto o «Reintentar»
    const sig = cheapSig();
    if (!needPull && sig === cheap && status !== 'error') return;
    force = false;
    busy = true; status = 'syncing'; paint();
    try {
      const c = cloud();
      if (needPull) await pull(c);
      await push(c);
      cheap = cheapSig(); status = 'ok'; err = ''; lastOk = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) { status = 'error'; errAt = Date.now(); err = e.message || 'No se pudo sincronizar con tu cuenta. Inténtalo de nuevo.'; }
    finally { busy = false; paint(); if (again) { again = false; schedule(); } }
  }
  const schedule = (ms = 800) => { clearTimeout(timer); timer = setTimeout(() => { run().catch((e) => console.error('Learny · clase en la nube', e)); }, ms); };

  /* ---- Borrados explícitos: se reflejan en la nube ---- */
  document.addEventListener('learny:class-removed', async (e) => {
    const d = e.detail; if (!d || !live() || !d.item || !(d.kind in cloudId)) return;
    const id = cloudId[d.kind](d.item);
    cheap = ''; // la nube ya no lo tiene: si se deshace el borrado, la próxima sincronización debe subirlo aunque lo local quede igual que antes
    try { await cloud().remove(d.kind, id); known[d.kind].delete(id); } catch (x) { status = 'error'; errAt = Date.now(); err = x.message; paint(); }
  });

  /* ---- Texto de estado (en #class-sync y #lib-sync; si no hay cuentas disponibles, no se muestra) ---- */
  function paint() {
    ['#class-sync', '#lib-sync'].forEach((sel) => {
      const el = $(sel); if (!el) return;
      if (!avail()) { el.hidden = true; return; }
      el.hidden = false;
      if (!user()) el.innerHTML = 'Inicia sesión para guardar también estos datos en tu cuenta y verlos en otro navegador.';
      else if (status === 'syncing') el.textContent = 'Sincronizando con tu cuenta…';
      else if (status === 'error') el.innerHTML = `${esc(err)} <button class="text-button" type="button" data-cloud-retry>Reintentar</button>`;
      else if (suspended) el.textContent = 'Sincronización en pausa hasta que recargues la página o vuelvas a iniciar sesión.';
      else el.textContent = `Guardado también en tu cuenta${lastOk ? ` (sincronizado a las ${lastOk})` : ''}. Los informes incluyen los nombres de tus alumnos: pídeles permiso.`;
    });
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-cloud-retry]')) { needPull = true; force = true; run(); } });

  /* ---- Cuándo sincronizar ---- */
  document.addEventListener('learny:render', () => { paint(); if (live()) schedule(); });
  document.addEventListener('learny:account', () => { needPull = true; suspended = false; paint(); schedule(300); });
  document.addEventListener('learny:account-ready', () => { paint(); schedule(300); });
  document.addEventListener('learny:teaching-ready', () => { paint(); schedule(300); });
  document.addEventListener('learny:profile', () => { paint(); schedule(300); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && live() && Date.now() - lastPull > 60000) { needPull = true; schedule(300); } });
  document.addEventListener('learny:reset', () => { suspended = true; known.reports.clear(); known.received.clear(); cheap = ''; paint(); }); // «Borrar todo» no toca la nube
  paint();

  window.LearnyClassCloud = Object.freeze({ sync: () => { needPull = true; force = true; return run(); }, status: () => ({ status, error: err, lastOk }) });
})();
