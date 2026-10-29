/* Learny · parte 20 · Pro (Bloque 1: base Pro + Exportar e imprimir)
   Catálogo de funciones Pro y puerta única isPro()/requirePro(). Lo que ya era gratis (SM-2, Pomodoro, tutor socrático, plan inverso, importar, copias) NO se bloquea.
   Bloque 6 (Firebase): fuera de la demo, el plan es SOLO el de la cuenta (LearnyCloud.profile, leído de Firestore): isUserPro() / isPro(). El navegador no puede activar Pro; la clave local learny.pro ya no cuenta y se borra al arrancar.
   En la demostración (?demo) se conserva el interruptor en memoria («Activar Pro en este navegador») para poder enseñar las funciones y para las pruebas. El cobro y la activación por el servidor son el Bloque 7: mientras tanto, para probar Pro se edita users/{uid} desde Firebase Console (plan 'pro', proStatus 'active').
   Bloque 1: Exportar a Anki (.txt) y CSV, e imprimir tarjetas u hoja de preguntas (con respuestas al final) desde Biblioteca.
   Bloque 2 (v87): el quiz y el simulacro (21-quiz.js) ya están disponibles (quiz: ready).
   Se carga con <script defer> después de 19-copia-archivo.js (comparte el ámbito global; no hay import/export). */
'use strict';

const PRO_KEY = 'learny.pro';
const PRO_FEATURES = Object.freeze([
  { id: 'export', title: 'Exportar e imprimir (Anki, CSV, papel)', ready: true },
  { id: 'quiz', title: 'Quizzes y exámenes simulados', ready: true },
  { id: 'files', title: 'Flashcards con IA desde PDF y fotos', ready: false },
  { id: 'docs', title: 'Tutor IA sobre tus documentos, con citas', ready: false },
  { id: 'maps', title: 'Resúmenes y mapas conceptuales con IA', ready: false },
  { id: 'weak', title: 'Repaso dirigido a tus puntos débiles', ready: false },
  { id: 'xp', title: 'Gamificación: XP, niveles y medallas', ready: false },
  { id: 'audio', title: 'Audio-resumen', ready: false },
  { id: 'groups', title: 'Grupos de estudio', ready: false }
]);
if (!DEMO) store.del(PRO_KEY); // clave de la etapa de pruebas: ya no se usa
const cloud = () => window.LearnyCloud || {};
/* ¿La cuenta con sesión es Pro? Con lo ya cargado de Firestore (plan 'pro', estado 'active' y sin vencer). Sin sesión, sin perfil cargado o ante un error: nunca. */
const isUserPro = () => { const pr = cloud().profile; return !!(pr && pr.available && pr.isProSync()); };
/* Misma comprobación pero pidiéndola de nuevo a Firestore (para acciones que importan; la seguridad real de funciones costosas irá en el servidor, Bloque 7). */
const isUserProVerified = async () => { const pr = cloud().profile; try { return !!(pr && pr.available && await pr.isPro()); } catch { return false; } };
const isPro = () => (DEMO ? store.get(PRO_KEY) === '1' : isUserPro());
function setPro(on) { if (!DEMO) return; if (on) store.set(PRO_KEY, '1'); else store.del(PRO_KEY); renderProCard(); document.dispatchEvent(new Event('learny:pro')); }
/* Puerta única: las funciones Pro se ejecutan con requirePro(id, run). Sin Pro se muestra qué falta (iniciar sesión, plan gratis…) y, si al volver ya es Pro, se ejecuta lo que se había pedido. */
function requirePro(id, run) { if (isPro()) return run(); proModal(id, run); }
/* Pie de las tarjetas Pro (Biblioteca y Practicar). attr = data-pro-x o data-quiz-x. */
const proHint = (attr) => {
  if (isPro()) return DEMO ? `Plan Pro activo en este navegador. <button class="text-button" type="button" ${attr}="off">Volver al plan gratis</button>` : 'Plan Pro activo en tu cuenta.';
  return `Función Pro. <button class="text-button" type="button" ${attr}="plans">Ver qué incluye Pro</button>`;
};

function proModal(featureId, run) {
  const rows = PRO_FEATURES.map((f) => `<li><b>${esc(f.title)}</b> <span class="tag">${f.ready ? 'Disponible' : 'Próximamente'}</span></li>`).join('');
  const acct = cloud().account, pr = cloud().profile;
  let note, action = '';
  if (DEMO) { note = 'En la demostración, Pro se activa solo en este navegador.'; action = '<button class="primary-button" type="button" data-pro-on>Activar Pro en este navegador</button>'; }
  else if (!acct || !acct.available) note = 'Las cuentas no están disponibles ahora mismo, así que no se puede comprobar tu plan.';
  else if (!acct.user()) { note = 'Pro va ligado a tu cuenta: inicia sesión para comprobar tu plan.'; action = '<button class="primary-button" type="button" data-pro-login>Iniciar sesión</button>'; }
  else { note = pr && pr.available && pr.status() === 'ready' ? 'Tu plan es Gratis y el cobro todavía no está disponible.' : 'No se pudo comprobar tu plan ahora mismo. Inténtalo de nuevo desde «Learny Pro».'; action = '<button class="primary-button" type="button" data-pro-plan>Ver mi plan</button>'; }
  modal(`<h2>Learny Pro</h2>${featureId ? '<p>Esta función es Pro.</p>' : ''}
      <p>Learny Pro reúne las herramientas para preparar y llevar tu material más lejos. Se irán sumando por bloques.</p>
      <ul class="closure-list">${rows}</ul>
      <p class="modal-tip">Todo lo que ya usas (repaso SM-2, Pomodoro, tutor socrático, plan inverso, importar y copias) sigue siendo gratis.</p>
      <p class="modal-tip">${note}</p>
      <div class="actions"><button class="outline-button" type="button" data-close-modal>Ahora no</button>${action}</div>`,
    undefined, () => { $('#modal-body').onclick = null; });
  $('#modal-body').onclick = async (e) => {
    if (e.target.closest('[data-pro-on]')) { $('#modal-body').onclick = null; setPro(true); closeModal(); toast('Pro activado en este navegador.'); if (run) run(); return; }
    if (e.target.closest('[data-pro-plan]')) { $('#modal-body').onclick = null; closeModal(); showPage('pro'); return; }
    if (e.target.closest('[data-pro-login]')) {
      $('#modal-body').onclick = null; closeModal();
      const u = await window.LearnyAccount?.requireAuth({ note: 'Inicia sesión para usar las funciones Pro.' });
      if (!u) return;
      if (await isUserProVerified()) { if (run) run(); } else proModal(featureId, run);
    }
  };
}

/* ---------- Exportar ---------- */
const proCards = (subject) => state.cards.filter((c) => !c.corrupt && (!subject || c.subject === subject));
/* Anki (texto con tabuladores): directivas #separator/#html/#deck column; el HTML solo escapa & < > y los saltos de línea pasan a <br>. Es el mismo formato que Learny ya sabe importar. */
const ankiField = (v) => {
  const s = String(v == null ? '' : v).replace(/\t/g, ' ').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r?\n/g, '<br>');
  return s.startsWith('"') ? `"${s.replace(/"/g, '""')}"` : s;
};
const ankiText = (cards) => ['#separator:tab', '#html:true', '#deck column:3', ...cards.map((c) => [c.question, c.answer, c.subject].map(ankiField).join('\t'))].join('\n') + '\n';
const csvCell = (v) => { const s = String(v == null ? '' : v); return `"${(/^[=+\-@\t\r]/.test(s) ? "'" : '') + s.replace(/"/g, '""')}"`; }; // mismo resguardo contra fórmulas que el informe semanal
const csvText = (cards) => `\uFEFF${[['pregunta', 'respuesta', 'materia'], ...cards.map((c) => [c.question, c.answer, c.subject])].map((r) => r.map(csvCell).join(',')).join('\r\n')}\r\n`;

/* Hoja imprimible. 'cards': tarjetas en dos columnas. 'quiz': preguntas numeradas con espacio para responder y las respuestas en una página aparte. */
function printSheet(cards, mode, label) {
  const w = window.open('', '_blank');
  if (!w) return toast('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes para Learny.', 'error');
  const title = `Learny · ${mode === 'quiz' ? 'Hoja de preguntas' : 'Tarjetas'} · ${label}`;
  const body = mode === 'quiz'
    ? `<ol>${cards.map((c) => `<li><small>${esc(c.subject)}</small>${esc(c.question)}<div class="line"></div><div class="line"></div></li>`).join('')}</ol><h2 class="brk">Respuestas</h2><ol>${cards.map((c) => `<li>${esc(c.answer)}</li>`).join('')}</ol>`
    : `<div class="grid">${cards.map((c) => `<div class="c"><small>${esc(c.subject)}</small>${esc(c.question)}<hr>${esc(c.answer)}</div>`).join('')}</div>`;
  const css = 'body{font:14px/1.5 system-ui,sans-serif;margin:24px;color:#111}h1{font-size:20px;margin:0 0 4px}h2{font-size:17px}.sub{color:#555;margin:0 0 16px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.c{border:1px solid #888;border-radius:6px;padding:10px;break-inside:avoid;white-space:pre-line}small{display:block;color:#555;margin-bottom:4px}hr{border:0;border-top:1px dashed #888;margin:8px 0}li{margin-bottom:14px;break-inside:avoid;white-space:pre-line}.line{border-bottom:1px solid #888;height:26px}.brk{break-before:page}@media print{body{margin:0}}';
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body><h1>${esc(title)}</h1><p class="sub">${esc(plural(cards.length, 'tarjeta', 'tarjetas'))} · ${esc(today())}</p>${body}</body></html>`);
  w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch { /* el usuario puede imprimir a mano */ } }, 300);
}

let proScope = '', lastProHtml = '';
function runExport(kind) {
  if (DEMO) return toast('En la demostración no se descargan archivos.', 'error');
  const cards = proCards(proScope);
  if (!cards.length) return toast('No hay tarjetas para exportar.', 'error');
  const label = proScope || 'Todas las materias';
  if (kind === 'anki') { download(`learny-anki-${today()}.txt`, ankiText(cards), 'text/plain;charset=utf-8'); toast(`Exportadas ${plural(cards.length, 'tarjeta', 'tarjetas')} a Anki.`); }
  else if (kind === 'csv') { download(`learny-tarjetas-${today()}.csv`, csvText(cards), 'text/csv;charset=utf-8'); toast(`Exportadas ${plural(cards.length, 'tarjeta', 'tarjetas')} a CSV.`); }
  else if (kind === 'print-cards') printSheet(cards, 'cards', label);
  else if (kind === 'print-quiz') printSheet(cards, 'quiz', label);
}

/* ---------- Tarjeta en Biblioteca (creada aquí: index.html no cambia) ---------- */
const proCard = (() => {
  const at = $('#decks-more'); if (!at) return null;
  const el = document.createElement('article'); el.className = 'card'; el.id = 'pro-export-card'; at.insertAdjacentElement('beforebegin', el); return el;
})();
function renderProCard() {
  if (!proCard || currentPage !== 'library') return;
  const subs = [...new Set(state.cards.filter((c) => !c.corrupt).map((c) => c.subject))].sort((a, b) => a.localeCompare(b));
  if (proScope && !subs.includes(proScope)) proScope = '';
  const n = proCards(proScope).length, off = n ? '' : ' disabled';
  const html = `<div class="card-head"><div><h2>Exportar e imprimir <span class="tag">Pro</span></h2><p class="lead">Lleva tus tarjetas a Anki, a una hoja de cálculo o al papel.</p></div><span class="tag">${plural(n, 'tarjeta', 'tarjetas')}</span></div>
    <label class="field">Qué exportar<select id="pro-scope"><option value="">Todas las materias</option>${subs.map((s) => `<option value="${esc(s)}"${s === proScope ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
    <div class="actions"><button class="outline-button" type="button" data-pro-x="anki"${off}>Anki (.txt)</button><button class="outline-button" type="button" data-pro-x="csv"${off}>CSV</button><button class="outline-button" type="button" data-pro-x="print-cards"${off}>Imprimir tarjetas</button><button class="outline-button" type="button" data-pro-x="print-quiz"${off}>Imprimir hoja de preguntas</button></div>
    <p class="hint">${proHint('data-pro-x')}</p>`;
  if (html !== lastProHtml) { proCard.innerHTML = html; lastProHtml = html; }
}
if (proCard) {
  proCard.onchange = (e) => { if (e.target.id === 'pro-scope') { proScope = e.target.value; renderProCard(); } };
  proCard.onclick = (e) => {
    const k = e.target.closest('[data-pro-x]')?.dataset.proX; if (!k) return;
    if (k === 'plans') return proModal();
    if (k === 'off') { setPro(false); return toast('Plan gratis. Tus datos no cambian.'); }
    requirePro('export', () => runExport(k));
  };
}
document.addEventListener('learny:render', () => { try { renderProCard(); } catch (e) { console.error('Learny · Pro', e); } });
document.addEventListener('learny:profile', () => { try { renderProCard(); document.dispatchEvent(new Event('learny:pro')); } catch (e) { console.error('Learny · Pro', e); } }); // el plan de la cuenta cambió: se repintan las tarjetas Pro
document.addEventListener('learny:page', () => { try { renderProCard(); } catch (e) { console.error('Learny · Pro', e); } });
