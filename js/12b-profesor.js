/* Learny · parte 12b · Profesor y alumnos, sin servidor (Etapa 6a)
   Todo se hace con ARCHIVOS: no hay cuentas, grupos ni servidor, y nada sale del navegador salvo lo que la persona descarga.
   1) El profesor comparte un mazo con nombre, autor, descripción y versión («Compartir mazo»): { type: 'learny-deck', name, author, description, deckVersion, deckId, cards, decks }.
      El deckId sale de nombre + autor: al actualizar un mazo hay que conservar ambos y subir la versión.
   2) El alumno lo importa (12-copias-e-importacion.js lo registra en state.received con la huella de cada pregunta) y, cuando quiere, descarga un
      «Informe para mi profesor»: { type: 'learny-report', deckId, student, date, cards: [{ k huella, q pregunta, n repasos, a fallos, last, iv }] }. Solo tarjetas de ese mazo.
   3) El profesor importa los informes (el mismo «Importar JSON» los reconoce) y ve en Reforzar quién ha repasado, el % sin fallar y las tarjetas que más se fallan en la clase.
   Datos nuevos (opcionales, sin cambio de esquema): state.received (mazos recibidos) y state.reports (informes de alumnos, máx. 40); se validan en hydrate (02-datos.js).
   Se carga con <script defer> después de 12-copias-e-importacion.js y antes de 15-inicio.js (renderAll se ejecuta al arrancar y ya necesita estas funciones). */
'use strict';

const SHARE_FORMAT = 1;
/* Huella corta y estable de un texto (djb2 sobre el texto normalizado: sin tildes ni mayúsculas). No es criptográfica: solo empareja preguntas entre el mazo del profesor y las tarjetas del alumno. */
const deckKey = (q) => { const s = normText(q); let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); };
const deckIdOf = (name, author) => deckKey(`${name}|${author}`);
function deckMeta(d) {
  const name = clean(d && d.name, 80), author = clean(d && d.author, 60);
  return { name, author, description: cleanMl(d && d.description, 300), version: num(d && d.deckVersion, 1, 999, 1), id: name ? deckIdOf(name, author) : '' };
}

/* ---------- 1) Compartir mazo ---------- */
function shareDeckForm() {
  if (DEMO) return toast('En la demostración no se comparten mazos.', 'error');
  const by = new Map(); state.cards.filter((c) => !c.corrupt).forEach((c) => by.set(c.subject, (by.get(c.subject) || 0) + 1));
  if (!by.size && !state.decks.length) return toast('No hay tarjetas para compartir.', 'error');
  modal(`<h2>Compartir mazo</h2>
      <p>Se crea un archivo con tus tarjetas (sin tu progreso) para que otra persona lo importe en su Learny.</p>
      <label>Nombre del mazo<input name="name" required maxlength="80"></label>
      <label>Autor (opcional)<input name="author" maxlength="60" value="${esc(state.settings.name)}"></label>
      <label>Descripción (opcional)<textarea name="description" maxlength="300" rows="2"></textarea></label>
      <label>Versión<input name="v" type="number" min="1" max="999" value="1" required></label>
      ${by.size ? `<fieldset class="choice-list"><legend>Materias que incluir</legend><div class="scale">${[...by].map(([s, n]) => `<label class="check"><input type="checkbox" name="sub" value="${esc(s)}" checked> <span translate="no">${esc(s)}</span> <small>· ${plural(n, 'tarjeta', 'tarjetas')}</small></label>`).join('')}</div></fieldset>` : ''}
      ${state.decks.length ? `<label class="check"><input name="decks" type="checkbox" checked> Incluir mis mazos propios (${state.decks.length})</label>` : ''}
      <p class="modal-tip">Para actualizar un mazo que ya compartiste, conserva el nombre y el autor y sube la versión. El archivo no incluye tu progreso, tus notas ni tu clave.</p>
      <button class="primary-button">Descargar mazo</button>`, (d) => {
    const name = clean(d.get('name'), 80), author = clean(d.get('author'), 60);
    if (!name) return toast('Escribe un nombre para el mazo.', 'error');
    const chosen = new Set(d.getAll('sub')), withDecks = d.get('decks') === 'on';
    const cards = state.cards.filter((c) => !c.corrupt && chosen.has(c.subject)).map(({ subject, question, answer }) => ({ subject, question, answer }));
    const decks = withDecks ? state.decks : [];
    if (!cards.length && !decks.length) return toast('Elige al menos una materia o incluye tus mazos propios.', 'error');
    const payload = { type: 'learny-deck', format: SHARE_FORMAT, name, author, description: cleanMl(d.get('description'), 300), deckVersion: num(d.get('v'), 1, 999, 1), deckId: deckIdOf(name, author), createdAt: today(), cards, decks };
    const slug = normText(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'mazo';
    download(`learny-mazo-${slug}-${today()}.json`, JSON.stringify(payload, null, 2), 'application/json');
    closeModal(); toast('Mazo exportado sin progreso personal.');
  });
}

/* ---------- 2) Mazos recibidos (alumno) ---------- */
function registerReceived(meta, rawCards) { // llamado por importData al importar un mazo con nombre
  if (!meta || !meta.id) return;
  const keys = [...new Set(arr(rawCards).filter((c) => c && typeof c.question === 'string').map((c) => deckKey(cleanMl(c.question, 500))))].slice(0, 1000);
  const rec = { deckId: meta.id, name: meta.name, author: meta.author, description: meta.description, version: meta.version, importedAt: today(), keys };
  const i = state.received.findIndex((r) => r.deckId === meta.id);
  if (i >= 0) state.received[i] = rec; else state.received.push(rec);
  state.received = state.received.slice(-30);
}
function renderReceived() {
  const box = $('#lib-received'); if (!box) return;
  if (state.settings.profile === 'teach' && !renderReceived.opened) { renderReceived.opened = true; const d = $('#share-more'); if (d) d.open = true; } // a un profesor se le muestra abierto la primera vez
  box.innerHTML = state.received.length ? state.received.map((r) => `<div class="weak-topic"><span><b translate="no">${esc(r.name)}</b><br><small>${r.author ? `<span translate="no">${esc(r.author)}</span> · ` : ''}v${r.version} · ${plural(r.keys.length, 'tarjeta', 'tarjetas')}</small>${r.description ? `<br><small translate="no">${esc(r.description)}</small>` : ''}<br><button class="text-button" type="button" data-forget-deck="${esc(r.deckId)}">Quitar de la lista</button></span></div>`).join('')
    : '<p class="empty">Aún no has recibido ningún mazo con nombre.</p>';
}

/* ---------- 3) Informe del alumno ---------- */
function buildStudentReport(rec, student) {
  const keys = new Set(rec.keys);
  const cards = state.cards.filter((c) => !c.corrupt && keys.has(deckKey(c.question))).map((c) => {
    const h = c.history || [], n = h.length;
    return { k: deckKey(c.question), q: c.question.slice(0, 80), n, a: h.filter((x) => x.rating === 'again').length, last: n ? h[n - 1].rating : '', iv: c.interval || 0 };
  }).sort((x, y) => y.a - x.a || y.n - x.n).slice(0, 200); // si el mazo es enorme, se conservan las que más importan al profesor
  return { type: 'learny-report', format: SHARE_FORMAT, deckId: rec.deckId, deckName: rec.name, deckVersion: rec.version, student: clean(student, 40), date: today(), total: rec.keys.length, cards };
}
function studentReportForm() {
  if (DEMO) return toast('En la demostración no se descargan informes.', 'error');
  if (!state.received.length) return toast('Importa primero un mazo de tu profesor (Biblioteca → Compartir con alumnos o con tu profesor).', 'error');
  modal(`<h2>Informe para mi profesor</h2>
      <p>Descarga un archivo con tus resultados en un mazo que recibiste y envíaselo a tu profesor.</p>
      <label>Mazo<select name="deck" translate="no">${state.received.map((r) => `<option value="${esc(r.deckId)}">${esc(r.name)}${r.author ? ` · ${esc(r.author)}` : ''}</option>`).join('')}</select></label>
      <label>Tu nombre<input name="student" required maxlength="40" value="${esc(state.settings.name)}"></label>
      <p class="modal-tip">Incluye solo las tarjetas de ese mazo: la pregunta, cuántas veces las repasaste y cuántas fallaste. No incluye tus notas, otras materias ni tu clave.</p>
      <button class="primary-button">Descargar informe</button>`, (d) => {
    const rec = state.received.find((r) => r.deckId === d.get('deck')), student = clean(d.get('student'), 40);
    if (!rec) return toast('Ese mazo ya no está en tu lista.', 'error');
    if (!student) return toast('Escribe tu nombre para el informe.', 'error');
    const rep = buildStudentReport(rec, student);
    download(`learny-informe-${normText(student).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 20) || 'alumno'}-${today()}.json`, JSON.stringify(rep, null, 2), 'application/json');
    closeModal(); toast('Informe descargado.');
  });
}

/* ---------- 4) Informes de alumnos (profesor) ---------- */
function importReport(data) { // lo llama importData; lanza Error con un mensaje para el usuario si el archivo no vale
  if (DEMO) throw new Error('En la demostración no se importan archivos.');
  const r = normalizeReport(data); if (!r) throw new Error('El informe no tiene el formato esperado.');
  const id = (x) => x.deckId || x.deckName, same = (x) => id(x) === id(r) && normText(x.student) === normText(r.student);
  const i = state.reports.findIndex(same);
  if (i >= 0 && state.reports[i].date > r.date) return toast('Ya tienes un informe más reciente de ese alumno.', 'error');
  if (i >= 0) state.reports[i] = r; else state.reports.push(r);
  state.reports = state.reports.slice(-40); classDeck = id(r);
  save(); renderAll(); toast(i >= 0 ? 'Informe actualizado (reemplaza el anterior de ese alumno).' : 'Informe importado.');
}

let classDeck = '';
const reportDeck = (r) => r.deckId || r.deckName;
const repStat = (r) => ({ n: r.cards.reduce((t, c) => t + c.n, 0), a: r.cards.reduce((t, c) => t + c.a, 0), rev: r.cards.filter((c) => c.n > 0).length });
function renderClass() {
  const card = $('#class-card'); if (!card) return;
  const R = state.reports, show = R.length > 0 || state.settings.profile === 'teach';
  card.hidden = !show; if (!show) return;
  $('#class-count').textContent = plural(R.length, 'informe', 'informes');
  const decks = new Map(); R.forEach((r) => decks.set(reportDeck(r), r.deckName));
  if (!decks.has(classDeck)) classDeck = [...decks.keys()].pop() || '';
  const sel = $('#class-deck'), opts = [...decks].map(([k, n]) => `<option value="${esc(k)}">${esc(n)}</option>`).join('');
  $('#class-deck-wrap').hidden = decks.size < 2;
  if (sel.dataset.sig !== opts) { sel.innerHTML = opts; sel.dataset.sig = opts; }
  sel.value = classDeck;
  const mine = R.filter((r) => reportDeck(r) === classDeck), list = $('#class-list'), hard = $('#class-hard'), sum = $('#class-summary');
  $('#class-export').disabled = !R.length;
  if (!mine.length) { sum.textContent = 'Aún no has importado informes. Pide a tus alumnos que usen «Informe para mi profesor» en su Learny e impórtalos aquí.'; list.innerHTML = ''; hard.innerHTML = ''; return; }
  let N = 0, A = 0;
  list.innerHTML = [...mine].sort((x, y) => x.student.localeCompare(y.student)).map((r) => {
    const s = repStat(r); N += s.n; A += s.a;
    return `<div class="weak-topic"><span><b translate="no">${esc(r.student)}</b><br><small>${esc(r.date)} · ${s.rev} de ${Math.max(r.total, r.cards.length)} tarjetas repasadas · v${r.version}</small><br><button class="text-button danger" type="button" data-del-report="${esc(r.id)}" aria-label="Quitar informe de ${esc(r.student)}">Quitar informe</button></span><b>${s.n ? `${Math.round(((s.n - s.a) * 100) / s.n)}%` : '—'}</b></div>`;
  }).join('');
  sum.textContent = N ? `${plural(mine.length, 'alumno', 'alumnos')} · ${Math.round(((N - A) * 100) / N)}% sin fallar en conjunto (${N - A} de ${N} repasos)${N < 10 ? ' · muestra pequeña' : ''}` : 'Ningún alumno ha repasado este mazo todavía.';
  const agg = new Map();
  mine.forEach((r) => r.cards.forEach((c) => { const g = agg.get(c.k) || { q: c.q, n: 0, a: 0, st: 0, fs: 0 }; g.n += c.n; g.a += c.a; if (c.n > 0) g.st++; if (c.a > 0) g.fs++; agg.set(c.k, g); }));
  const top = [...agg.values()].filter((g) => g.n >= 3 && g.a > 0).sort((x, y) => y.a / y.n - x.a / x.n || y.a - x.a).slice(0, 5);
  hard.innerHTML = top.length ? top.map((g) => `<div class="weak-topic"><span><b translate="no">${esc(g.q)}</b><br><small>Fallada por ${g.fs} de ${plural(g.st, 'alumno', 'alumnos')} · ${plural(g.a, 'fallo', 'fallos')} en ${plural(g.n, 'repaso', 'repasos')}</small></span><b>${Math.round((g.a * 100) / g.n)}%</b></div>`).join('')
    : '<p class="empty">Ninguna tarjeta destaca todavía: hacen falta al menos 3 repasos de una tarjeta con algún fallo.</p>';
}
function exportClass() {
  if (DEMO) return toast('En la demostración no se descargan informes.', 'error');
  if (!state.reports.length) return toast('No hay informes que exportar.', 'error');
  const rows = [['alumno', 'fecha', 'mazo', 'version', 'tarjetas_del_mazo', 'tarjetas_repasadas', 'repasos', 'fallos', 'sin_fallar_pct']].concat(state.reports.map((r) => { const s = repStat(r); return [r.student, r.date, r.deckName, r.version, Math.max(r.total, r.cards.length), s.rev, s.n, s.a, s.n ? Math.round(((s.n - s.a) * 100) / s.n) : '']; }));
  download(`learny-clase-${today()}.csv`, rows.map((r) => r.map((x) => { const v = String(x); return `"${(/^[=+\-@\t\r]/.test(v) ? "'" : '') + v.replace(/"/g, '""')}"`; }).join(',')).join('\n'), 'text/csv');
  toast('Resumen descargado.');
}

/* ---------- Eventos ---------- */
$('#lib-share')?.addEventListener('click', shareDeckForm);
$('#lib-report')?.addEventListener('click', studentReportForm);
$('#lib-import')?.addEventListener('click', () => $('#lib-file').click());
$('#lib-file')?.addEventListener('change', (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) importData(f); });
$('#class-import')?.addEventListener('click', () => $('#class-file').click());
$('#class-file')?.addEventListener('change', (e) => { const fs = [...e.target.files]; e.target.value = ''; fs.forEach((f) => importData(f)); });
$('#class-export')?.addEventListener('click', exportClass);
$('#class-deck')?.addEventListener('change', (e) => { classDeck = e.target.value; renderClass(); });
$('#class-list')?.addEventListener('click', (e) => {
  const id = e.target.closest('[data-del-report]')?.dataset.delReport; if (!id) return;
  const i = state.reports.findIndex((r) => r.id === id); if (i < 0) return;
  const r = state.reports[i]; state.reports.splice(i, 1); save(); renderAll();
  document.dispatchEvent(new CustomEvent('learny:class-removed', { detail: { kind: 'reports', item: r } })); // js/24-clase-nube.js lo borra también de la cuenta
  offerUndo('Informe quitado.', () => { state.reports.splice(Math.min(i, state.reports.length), 0, r); save(); renderAll(); });
});
$('#lib-received')?.addEventListener('click', (e) => {
  const id = e.target.closest('[data-forget-deck]')?.dataset.forgetDeck; if (!id) return;
  const gone = state.received.find((r) => r.deckId === id); state.received = state.received.filter((r) => r.deckId !== id); save(); renderReceived();
  if (gone) document.dispatchEvent(new CustomEvent('learny:class-removed', { detail: { kind: 'received', item: gone } }));
   toast('Mazo quitado de la lista. Tus tarjetas no se borran.');
});
