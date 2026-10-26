/* Learny · parte 14b · Modo autodidacta (Perfiles · Etapa 4)
   Para quien estudia sin fecha de examen (settings.profile === 'self'): ritmo en lugar de plan inverso.
   · Ritmo semanal: «N sesiones por semana» (settings.weeklyGoal, 3 por defecto, 1–14). Una sesión es un bloque de enfoque completado; se cuentan los últimos 7 días (igual que el resto de resúmenes semanales).
   · Hoy: actionCandidates() devuelve, para este perfil, repasos pendientes → errores → la sesión que toca por ritmo → un tema que lleve días sin tocarse → el resto.
     No se ofrece «Añade la fecha de un examen». Con el ritmo ya cumplido, la sesión pasa al final y se dice que una más es opcional.
   · Planificar: tarjeta «Tu ritmo de esta semana» con los 7 últimos días y un botón para cambiar la meta.
   · Reforzar: tarjeta «Progreso por tema» (repasos y minutos de esta semana, último contacto) con mini quiz para los temas sin tocar.
   Con cualquier otro perfil (examen, enseño o sin elegir) nada cambia: actionCandidates() devuelve lo mismo que antes y las dos tarjetas quedan ocultas.
   No cambia el esquema de datos ni SM-2. Se carga con <script defer> DESPUÉS de 14-eventos.js y ANTES de 15-inicio.js (15-inicio.js llama a renderAll() al arrancar y ya necesita actionCandidates()).
   Comparte el ámbito global con las demás partes (no hay import/export). 06-hoy.js define actionCandidatesBase() (antes actionCandidates()); aquí se define actionCandidates(). */
'use strict';

const SELF_STALE_DAYS = 4;     // días sin tocar un tema para sugerir retomarlo
const SELF_GOAL_DEFAULT = 3;   // sesiones por semana por defecto
const isSelf = () => profileOf() === 'self';
const weeklyGoal = () => num(state.settings.weeklyGoal, 1, 14, SELF_GOAL_DEFAULT); // se valida al leer: copias antiguas o editadas a mano no pueden dar un valor fuera de rango
const SELF_DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/* Sesiones completadas (no abandonadas) en los últimos 7 días, día a día. */
function rhythmInfo() {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today(), i - 6)), goal = weeklyGoal();
  const per = days.map((d) => state.sessions.filter((s) => s.date === d && !s.abandon).length);
  const done = per.reduce((t, n) => t + n, 0);
  return { goal, done, left: Math.max(0, goal - done), met: done >= goal, days, per };
}

/* Actividad por tema (materia con al menos una tarjeta activa): último contacto = último repaso de una de sus tarjetas o última sesión con esa etiqueta; repasos y minutos de los últimos 7 días. */
function subjectActivity() {
  return cached('subjAct', () => {
    const from = addDays(today(), -6), by = new Map();
    state.cards.filter((c) => !c.archived && !c.corrupt).forEach((c) => {
      const k = norm(c.subject); if (!by.has(k)) by.set(k, { name: c.subject, cards: 0, last: '', week: 0, mins: 0 });
      const a = by.get(k); a.cards++; if (isDay(c.lastReviewed) && c.lastReviewed > a.last) a.last = c.lastReviewed;
    });
    state.reviews.forEach((r) => { const a = by.get(norm(r.subject)); if (!a || !isDay(r.date)) return; if (r.date > a.last) a.last = r.date; if (r.date >= from) a.week++; });
    state.sessions.filter((s) => !s.abandon && s.label).forEach((s) => { const a = by.get(norm(s.label)); if (!a || !isDay(s.date)) return; if (s.date > a.last) a.last = s.date; if (s.date >= from) a.mins += Number(s.minutes) || 0; });
    return [...by.values()].map((a) => ({ ...a, days: a.last ? Math.max(0, -daysUntil(a.last)) : null }));
  });
}
const isStale = (a) => !!a.last && a.days >= SELF_STALE_DAYS;
const staleSubject = () => subjectActivity().filter(isStale).sort((a, b) => b.days - a.days || a.name.localeCompare(b.name))[0] || null;

/* Hoy para el perfil «por mi cuenta»: quita lo que habla de exámenes, reescribe el motivo de «bloque de enfoque» con el ritmo y añade el tema sin tocar. Devuelve una lista nueva. */
function selfCandidates(list) {
  const r = rhythmInfo(), out = list.filter((c) => c.id !== 'deadline').map((c) => ({ ...c }));
  const f = out.find((c) => c.id === 'focus');
  if (f) {
    const lead = f.why.startsWith('No tienes repasos pendientes. ') ? 'No tienes repasos pendientes. ' : '';
    f.why = lead + (r.met
      ? `Ya cumpliste tu ritmo de ${plural(r.goal, 'sesión', 'sesiones')} esta semana. Una sesión más es opcional.`
      : `Esta semana (últimos 7 días) llevas ${r.done} de ${plural(r.goal, 'sesión', 'sesiones')}. Una sesión de hoy te acerca a tu ritmo.`);
  }
  const st = staleSubject(), weak = weakSubject();
  if (st && !(weak && norm(weak.name) === norm(st.name))) {
    out.push({ id: 'stale', title: `Retomar ${st.name}`, minutes: 5, cta: 'Empezar quiz', why: `Hace ${plural(st.days, 'día', 'días')} que no tocas «${st.name}». Un mini quiz de 8 tarjetas te ayuda a retomarlo.` });
  }
  // Orden estable: repasos y errores primero; la sesión del ritmo antes que el tema sin tocar mientras falten sesiones, y al final cuando ya se cumplió.
  const rank = { review: 1, plan: 2, errors: 3, create: 3.5, deck: 3.6, focus: r.met ? 9.5 : 4, stale: 5, weak: 6, feynman: 9 };
  return out.sort((a, b) => (rank[a.id] ?? 10) - (rank[b.id] ?? 10));
}
function actionCandidates() { const list = actionCandidatesBase(); return isSelf() ? selfCandidates(list) : list; }
ACTIONS.stale = () => startSubjectQuiz(staleSubject()?.name);

/* ===== Tarjetas de Planificar y de Reforzar (se crean aquí: index.html no cambia) ===== */
const mkCard = (id, beforeSel) => {
  const at = $(beforeSel); if (!at) return null;
  const el = document.createElement('article'); el.className = 'card'; el.id = id; el.hidden = true;
  at.insertAdjacentElement('beforebegin', el); return el;
};
const rhythmCard = mkCard('rhythm-card', '#week-calendar-card');
const topicCard = mkCard('topic-progress-card', '#retention-card');
const lastHtml = { rhythm: '', topic: '' }; // no se reescribe si nada cambió (así no se pierde el foco de los botones)

function renderRhythm() {
  if (!rhythmCard) return;
  const r = rhythmInfo();
  const cols = r.days.map((d, i) => `<div class="day${i === 6 ? ' today' : ''}"><b>${SELF_DAYS[new Date(`${d}T12:00:00`).getDay()]} ${Number(d.slice(8))}</b><small>${r.per[i] ? `${icon('check')} ${plural(r.per[i], 'sesión', 'sesiones')}` : 'Sin sesión'}</small></div>`).join('');
  const note = r.met
    ? `Cumpliste tu ritmo de la semana: ${r.done} de ${plural(r.goal, 'sesión', 'sesiones')}. Una sesión más es opcional.`
    : `Te ${r.left === 1 ? 'falta' : 'faltan'} ${plural(r.left, 'sesión', 'sesiones')} para llegar a tu ritmo de ${r.goal} por semana. Se cuentan los últimos 7 días.`;
  const html = `<div class="card-head"><div><h2>Tu ritmo de esta semana</h2><p class="lead">Sin fecha de examen: lo que cuenta es volver con regularidad. Una sesión es un bloque de enfoque completado.</p></div><span class="tag">${r.done} de ${plural(r.goal, 'sesión', 'sesiones')}</span></div>
    <div class="week-cal">${cols}</div><p class="lead">${note}</p>
    <div class="actions"><button class="primary-button" type="button" data-rhythm="start">Empezar una sesión</button><button class="outline-button" type="button" data-rhythm="edit">Cambiar ritmo</button></div>`;
  if (html !== lastHtml.rhythm) { rhythmCard.innerHTML = html; lastHtml.rhythm = html; }
}
if (rhythmCard) rhythmCard.onclick = (e) => {
  const k = e.target.closest('[data-rhythm]')?.dataset.rhythm;
  if (k === 'start') ACTIONS.focus(); else if (k === 'edit') editRhythm();
};
function editRhythm() {
  modal(`<h2>Tu ritmo semanal</h2><p>¿Cuántas sesiones (bloques de enfoque) quieres hacer por semana?</p>
      <label>Sesiones por semana<input name="goal" type="number" min="1" max="14" value="${weeklyGoal()}" required></label>
      <p class="modal-tip">Se cuentan los últimos 7 días. Puedes cambiarlo cuando quieras.</p>
      <button class="primary-button">Guardar</button>`, (d) => {
    state.settings.weeklyGoal = num(d.get('goal'), 1, 14, SELF_GOAL_DEFAULT); save(); closeModal(); renderAll(); toast('Ritmo guardado.');
  });
}

function renderTopicProgress() {
  if (!topicCard) return;
  const list = subjectActivity().slice().sort((a, b) => {
    const k = (x) => (isStale(x) ? 0 : !x.last ? 1 : 2);
    return k(a) - k(b) || (isStale(a) ? b.days - a.days : (a.days ?? 0) - (b.days ?? 0)) || a.name.localeCompare(b.name);
  });
  const lastTxt = (a) => (a.days === null ? 'sin repasos todavía' : a.days === 0 ? 'último contacto hoy' : a.days === 1 ? 'último contacto ayer' : `último contacto hace ${plural(a.days, 'día', 'días')}`);
  const rows = list.map((a) => `<div class="weak-topic"><span><strong translate="no">${esc(a.name)}</strong><br><small>Esta semana: ${plural(a.week, 'repaso', 'repasos')}, ${a.mins} min · ${lastTxt(a)}</small>${isStale(a) ? `<br><button class="text-button" type="button" data-topic-quiz="${esc(a.name)}">Mini quiz de <span translate="no">${esc(a.name)}</span></button>` : ''}</span><span class="tag${isStale(a) ? ' urgent' : ''}">${isStale(a) ? 'Retomar' : a.last ? 'Al día' : 'Sin empezar'}</span></div>`).join('');
  const html = `<div class="card-head"><div><h2>Progreso por tema</h2><p class="lead">Qué has tocado esta semana en cada tema y cuánto hace de lo último. Aquí no hay fechas: solo constancia.</p></div><span class="tag">${plural(list.length, 'tema', 'temas')}</span></div>${rows || '<p class="empty">Crea tarjetas para ver tu progreso por tema.</p>'}`;
  if (html !== lastHtml.topic) { topicCard.innerHTML = html; lastHtml.topic = html; }
}
if (topicCard) topicCard.onclick = (e) => { const n = e.target.closest('[data-topic-quiz]')?.dataset.topicQuiz; if (n) startSubjectQuiz(n); };

function renderSelf() {
  const on = isSelf();
  if (rhythmCard) rhythmCard.hidden = !on;
  if (topicCard) topicCard.hidden = !on;
  if (!on) return;
  try { if (currentPage === 'planner') renderRhythm(); if (currentPage === 'analysis') renderTopicProgress(); } catch (e) { console.error('Learny · modo autodidacta', e); }
}
document.addEventListener('learny:render', renderSelf);
document.addEventListener('learny:page', renderSelf);
