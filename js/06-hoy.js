/* Learny · parte 6 de 15 · Hoy
   Recomendación con motivo, saludo, cierre de sesión, «me cuesta arrancar» y cola del día.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

/* ===== Etapa 6A: una recomendación con su motivo y como máximo dos alternativas ===== */
const lastOf = (a) => a[a.length - 1];
const norm = (v) => String(v || '').trim().toLowerCase();
const errorCards = () => cached('errcards', () => state.cards.filter((c) => !c.archived && !c.corrupt && lastOf(c.history || [])?.rating === 'again'));
const upcoming = () => state.deadlines.filter((d) => daysUntil(d.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
const whenLabel = (date) => { const n = daysUntil(date); return n === 0 ? 'hoy' : n === 1 ? 'mañana' : n < 7 ? `el ${new Date(`${date}T12:00:00`).toLocaleDateString('es', { weekday: 'long' })}` : `el ${shortDate(date)}`; };
const isNewUser = () => !state.cards.length && !state.deadlines.length && !state.sessions.length && !state.reviews.length && !state.notes.length && !state.feynman.length;
const reveal = (target) => { const el = typeof target === 'string' ? $(target) : target; for (let d = el?.closest('details'); d; d = d.parentElement?.closest('details')) d.open = true; return el; };

/* Devuelve las acciones posibles ordenadas por prioridad; cada una trae su motivo calculado con datos reales. */
function actionCandidates() {
  const out = [], due = dueCards(), overdue = overdueCards().length, upc = upcoming(), fresh = isNewUser();
  const done = state.sessions.filter((s) => s.date === today() && !s.abandon).length, goal = num(state.settings.dailyGoal, 1, 12, 2);
  const weak = weakSubject(), hasCards = state.cards.some((c) => !c.archived);
  if (due.length) {
    const n = due.length, one = n === 1;
    const exam = upc.find((d) => daysUntil(d.date) <= 14 && due.some((c) => norm(c.subject) === norm(d.subject)));
    const inExam = exam ? due.filter((c) => norm(c.subject) === norm(exam.subject)).length : 0;
    const state1 = overdue === n ? (one ? 'está vencida' : 'están vencidas')
      : overdue > 0 ? `${overdue} ${overdue === 1 ? 'está vencida' : 'están vencidas'} y ${n - overdue} ${n - overdue === 1 ? 'toca' : 'tocan'} hoy`
      : (one ? 'le toca repaso hoy' : 'les toca repaso hoy') + ' según tu calendario';
    const examPart = !exam || !inExam ? '.' : inExam === n ? ` y ${one ? 'pertenece' : 'pertenecen'} a «${exam.title}», que es ${whenLabel(exam.date)}.` : `. ${inExam} ${inExam === 1 ? 'es' : 'son'} de «${exam.title}», que es ${whenLabel(exam.date)}.`;
    out.push({ id: 'review', title: `Repasar ${plural(n, 'tarjeta', 'tarjetas')}`, minutes: Math.max(2, Math.ceil(n * 0.7)), cta: 'Repasar ahora', why: `Te sugerimos repasar ${one ? 'esta tarjeta' : `estas ${n} tarjetas`} porque ${state1}${examPart}` });
  }
  const tasks = state.tasks.filter((t) => t.date === today() && !t.done);
  const planDl = upc.find((d) => tasks.some((t) => t.deadlineId === d.id));
  if (planDl) {
    const mine = tasks.filter((t) => t.deadlineId === planDl.id), r = loadReport(planDl);
    out.push({ id: 'plan', title: `Continuar plan de ${planDl.subject || planDl.title}`, minutes: planDl.dailyMinutes, cta: 'Ver plan de hoy',
      why: `Hoy tienes ${plural(mine.length, 'tarea', 'tareas')} de «${planDl.title}», que es ${whenLabel(planDl.date)}: ${mine[0].title.replace(/[.\s]+$/, '')}.${r.fits ? '' : ' A este ritmo ya no cabe todo lo que queda: revisa o replanifica.'}` });
  }
  const dueIds = new Set(due.map((c) => c.id)), errs = errorCards().filter((c) => !dueIds.has(c.id));
  if (errs.length) {
    const subs = [...new Set(errs.map((c) => c.subject))];
    out.push({ id: 'errors', title: `Repasar ${plural(errs.length, 'tarjeta fallada', 'tarjetas falladas')}`, minutes: Math.max(2, Math.ceil(Math.min(10, errs.length) * 0.7)), cta: 'Repasar errores',
      why: `Marcaste «No lo sabía» en ${errs.length === 1 ? 'esta tarjeta' : `estas ${errs.length} tarjetas`} la última vez${subs.length === 1 ? ` (${subs[0]})` : ''}. Volver a verlas pronto es lo que más ayuda a fijarlas.` });
  }
  if (weak) out.push({ id: 'weak', title: `Mini quiz de ${weak.name}`, minutes: 5, cta: 'Empezar quiz', why: `${weak.pct}% sin fallar (${weak.ok} de ${weak.total} repasos): es tu materia con más fallos. El quiz empieza por tus errores.` });
  if (!hasCards) out.push({ id: 'create', title: 'Crea tu primera tarjeta', minutes: 3, cta: 'Crear tarjeta', why: 'Aún no tienes tarjetas. Con ellas Learny agenda tus repasos por ti; la primera tarda un minuto.' });
  if (!hasCards) out.push({ id: 'deck', title: 'Probar con un mazo de ejemplo', minutes: 2, cta: 'Ver mazos', why: 'Añade unas pocas tarjetas ya hechas para ver cómo funciona el repaso sin escribir nada.' });
  if (!fresh) out.push({ id: 'focus', title: 'Haz un bloque de enfoque', minutes: state.settings.focus, cta: 'Ir al Pomodoro', why: `${due.length ? '' : 'No tienes repasos pendientes. '}Hoy llevas ${done} de ${goal} ${goal === 1 ? 'bloque' : 'bloques'} de tu meta; escribe un resultado concreto y empieza.` });
  if (!upc.length) out.push({ id: 'deadline', title: 'Añade la fecha de un examen', minutes: 3, cta: 'Planificar', why: 'No tienes ninguna fecha próxima. Con una fecha, Learny reparte tareas diarias hasta el examen.' });
  if (!fresh) out.push({ id: 'feynman', title: 'Explícalo con tus palabras (Feynman)', minutes: 10, cta: 'Explicar un tema', why: `${weak ? `Explicar «${weak.name}», tu materia con más fallos,` : 'Explicar un tema de hoy'} revela lo que todavía no entiendes.` });
  return out;
}

let newUserPomo = false;
const ACTIONS = {
  review() { showPage('practice'); $('#flashcard').scrollIntoView({ behavior: 'smooth', block: 'center' }); const b = $('#reveal-card'); if (!b.hidden) b.focus({ preventScroll: true }); },
  plan() { showPage('planner'); },
  errors() { const list = errorCards().slice(0, 10); if (!list.length) return; showPage('practice'); startExam(list, 10); },
  weak() { startSubjectQuiz(weakSubject()?.name); },
  create() { showPage('practice'); cardForm(); },
  deck() { showPage('library'); reveal('#topic-library'); toast('Elige un mazo de ejemplo y púlsalo para añadir sus tarjetas.'); $('#topic-library .topic-chip')?.focus(); },
  focus() { showPage('study'); (timer.started ? $('#pomodoro-button') : $('#intention-input')).focus(); },
  deadline() { showPage('planner'); addDeadline(); },
  feynman() { showPage('practice'); $('#feynman-topic').value ||= weakSubject()?.name || ''; $('#feynman-topic').focus(); },
  smart() { document.dispatchEvent(new Event('learny:smart')); },
  newpomo() { newUserPomo = true; applySessionMode(); $('#intention-input').focus(); },
  quick5() { showPage('practice'); $('#quick-five')?.click(); },
  subject(b) { if (b?.dataset.subject) startSubjectQuiz(b.dataset.subject); },
  mode(b) { const m = b?.dataset.mode; homeMode = homeMode === m ? 'any' : m; renderTodayQueue(); },
  stuck() { stuckHelp(); }
};

/* Etapa 1: el selector de tiempo FILTRA las candidatas existentes (no inventa datos). Solo en memoria, sin clave nueva. */
let homeMode = 'any';
const MODE_NAME = { five: 'Solo 5 minutos', session: 'Una sesión', topic: 'Elegir tema' };
function modeCandidates(list, mode) {
  if (mode === 'five') {
    const dn = dueCards().length;
    return list.map((c) => (c.id === 'review' && c.minutes > 5
      ? { id: 'quick5', title: 'Repaso rápido de 5 tarjetas', minutes: 4, cta: 'Repasar 5 tarjetas', why: `Tienes ${dn} tarjetas para hoy. Este repaso toma 5 de ellas; el resto sigue pendiente.` } : c)).filter((c) => c.minutes <= 5);
  }
  if (mode === 'session') return list.filter((c) => c.minutes >= 8);
  return list;
}
function subjectList() {
  const due = dueCards(), by = new Map(); // Map: una materia llamada «constructor» o «__proto__» no choca con el prototipo
  state.cards.filter((c) => !c.archived && !c.corrupt).forEach((c) => { if (!by.has(c.subject)) by.set(c.subject, { name: c.subject, n: 0, due: 0 }); by.get(c.subject).n++; });
  due.forEach((c) => { if (by.has(c.subject)) by.get(c.subject).due++; });
  return [...by.values()].sort((a, b) => b.due - a.due || b.n - a.n).slice(0, 8);
}

/* Modo sesión: durante un bloque o un examen solo se ve la actividad actual y sus controles. */
function applySessionMode() {
  const b = document.body, fresh = isNewUser(), ae = document.activeElement;
  b.dataset.page = currentPage;
  if (!fresh) newUserPomo = false;
  b.classList.toggle('session-study', currentPage === 'study' && !!timer.started);
  b.classList.toggle('session-practice', currentPage === 'practice' && !!exam);
  b.classList.toggle('new-user', fresh);
  b.classList.toggle('new-pomo', newUserPomo || !!timer.started);
  if (ae && ae !== document.body && ae.isConnected && ae.closest('.page') && !ae.getClientRects().length) { // el control con foco quedó oculto
    const t = currentPage === 'study' ? $('#pomodoro-button') : currentPage === 'practice' ? ($('#exam-exit').hidden ? $('#reveal-card') : $('#exam-exit')) : null;
    if (shown(t)) t.focus({ preventScroll: true });
  }
}

function renderGreeting() {
  const h = new Date().getHours(), name = state.settings.name;
  $('#greeting').textContent = `${h < 6 ? 'Buenas noches' : h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'}${name ? `, ${name}` : ''}`;
  const due = dueCards().length, overdue = overdueCards().length;
  const exam = state.deadlines.filter((d) => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 14).sort((a, b) => a.date.localeCompare(b.date))[0];
  const parts = [];
  if (due) parts.push(`${plural(due, 'tarjeta', 'tarjetas')} para hoy${overdue ? ` (${overdue} ${overdue === 1 ? 'vencida' : 'vencidas'})` : ''}`);
  if (exam) { const n = daysUntil(exam.date); parts.push(`${esc(exam.title)} ${n === 0 ? 'hoy' : `en ${plural(n, 'día', 'días')}`}`); }
  const act = [...state.sessions.filter((x) => !x.abandon).map((x) => x.date), ...state.reviews.map((x) => x.date)].filter((d) => isDay(d)).sort().pop(), gap = act ? -daysUntil(act) : 0;
  const back = gap >= 3 ? ` Bienvenido de vuelta: han pasado ${plural(gap, 'día', 'días')} desde tu última sesión, y no pasa nada. Puedes retomar con «Solo 5 minutos».` : ''; // sin culpa: no menciona rachas
  $('#home-summary').innerHTML = (isNewUser() ? 'Bienvenido a Learny. Te propongo un primer paso para empezar.' : parts.length ? `Tienes ${parts.join(' y ')}.` : 'Hoy no tienes pendientes urgentes.') + back;
  const last = [...state.sessions].reverse().find((s) => !s.abandon);
  if (last) {
    const ago = Math.max(0, -daysUntil(last.date));
    $('#home-last').textContent = `Última vez: ${plural(last.minutes, 'minuto', 'minutos')}${last.label ? ` de ${last.label}` : ''} ${ago === 0 ? 'hoy' : ago === 1 ? 'ayer' : `hace ${ago} días`}.`;
  } else $('#home-last').textContent = 'Aún no has completado ningún bloque. Tu primer Pomodoro desbloquea tu progreso.';
}

function startSubjectQuiz(name, size = 8) {
  if (!name) return toast('Esa materia ya no tiene suficientes datos para un quiz.', 'error');
  const pool = state.cards.filter((c) => !c.archived && !c.corrupt && c.subject === name);
  if (!pool.length) return toast(`No hay tarjetas activas de ${name}.`, 'error');
  const errs = pool.filter((c) => c.history.some((h) => h.rating === 'again'));
  showPage('practice'); startExam([...errs, ...pool.filter((c) => !errs.includes(c))].slice(0, size), size);
}

/* Etapa 3: cierre de sesión con SOLO datos de esa sesión. No afirma dominio por tiempo de uso. */
function showClosure(kind, d) {
  if (modalOpen()) return; // otro flujo (p. ej. la sesión inteligente) ya abrió su ventana
  const next = actionCandidates().find((c) => !(kind === 'focus' && c.id === 'focus')) || null;
  const rows = [];
  if (kind === 'focus') {
    rows.push(`<li><b>Tiempo:</b> ${plural(d.minutes, 'minuto', 'minutos')} de foco${d.label ? ` en ${esc(d.label)}` : ''}.</li>`);
    if (d.intention) rows.push(`<li><b>Tu intención:</b> «${esc(d.intention)}» · ${d.achieved === true ? 'dijiste que la lograste' : d.achieved === false ? 'dijiste que aún no' : 'sin valorar'}.</li>`);
    if (d.distractions?.length) rows.push(`<li><b>Para mirar después:</b> ${d.distractions.map(esc).join(' · ')}.</li>`);
  } else {
    rows.push(`<li><b>Tarjetas respondidas:</b> ${d.total}.</li><li><b>Marcadas «Fácil»:</b> ${d.score} de ${d.total} (es tu autoevaluación).</li>`);
  }
  modal(`<h2>${kind === 'focus' ? 'Cierre del bloque' : 'Cierre del examen'}</h2>
      <ul class="closure-list">${rows.join('')}</ul>
      <p class="why">${next ? `<b>Siguiente paso:</b> ${esc(next.title)} (≈ ${next.minutes} min). ${esc(next.why)}` : 'No tienes nada urgente pendiente. Descansar también es parte de estudiar.'}</p>
      <p class="modal-tip">El tiempo mide dedicación, no aprendizaje. Aquí solo ves lo de esta sesión.</p>
      <div class="actions"><button class="primary-button" type="button" data-closure="done">Terminar por hoy</button>${next ? '<button class="outline-button" type="button" data-closure="more">Seguir un poco más</button>' : ''}</div>`);
  $('#modal-body').onclick = (e) => {
    const b = e.target.closest('[data-closure]'); if (!b) return;
    $('#modal-body').onclick = null; closeModal();
    if (b.dataset.closure === 'more' && next && ACTIONS[next.id]) ACTIONS[next.id]();
    else toast('Listo por hoy. Lo que estudiaste ya está guardado.');
  };
}

/* Etapa 4: «Hoy me cuesta arrancar». Solo ofrece acciones reales y pequeñas; cerrar no guarda ni cambia nada. */
function stuckHelp() {
  const live = state.cards.filter((c) => !c.archived && !c.corrupt), due = dueCards(), n = Math.min(3, due.length);
  const opt = (id, title, sub) => `<button class="stuck-opt" type="button" data-stuck="${id}"><b>${esc(title)}</b><small>${esc(sub)}</small></button>`;
  const list = [];
  if (n) list.push(opt('cards', n === 1 ? 'Repasar 1 tarjeta' : `Repasar ${n} tarjetas`, `Solo ${n === 1 ? 'la primera que toca' : `las ${n} primeras que tocan`} hoy. ≈ ${Math.max(1, Math.ceil(n * 0.7))} min.`));
  list.push(opt('ask', 'Hacer una pregunta', 'Escribe una duda, por pequeña que sea. Funciona también sin internet (guía local).'));
  if (live.length) list.push(opt('short', 'Una sesión breve de 5 minutos', 'Un repaso corto; puedes salir del examen cuando quieras.'));
  list.push(opt('feynman', 'Explicar una idea con tus palabras', 'Método Feynman: solo una idea, sin nota.'));
  if (!live.length) { list.push(opt('create', 'Crear una tarjeta pequeña', 'Una pregunta y una respuesta; tarda un minuto.')); list.push(opt('deck', 'Probar un mazo de ejemplo', 'Tarjetas ya hechas para ver cómo funciona el repaso.')); }
  modal(`<h2>Hoy me cuesta arrancar</h2>
      <p>Es normal. No hace falta hacer mucho: elige una cosa pequeña, o ninguna.</p>
      <div class="stuck-list">${list.join('')}</div>
      <p class="modal-tip">Cerrar esta ventana no cambia nada: tu plan y tus datos siguen igual.</p>
      <div class="actions"><button class="outline-button" type="button" data-close-modal>Ahora no</button></div>`);
  $('#modal-body').onclick = (e) => {
    const b = e.target.closest('[data-stuck]'); if (!b) return;
    const k = b.dataset.stuck; $('#modal-body').onclick = null; closeModal();
    if (k === 'cards') { const pool = dueCards().slice(0, 3); if (pool.length) { showPage('practice'); startExam(pool, pool.length); } }
    else if (k === 'ask') setTimeout(() => { toast('Escribe tu duda arriba y pulsa «Consultar».'); $('#ai-question')?.focus(); }, 60);
    else if (k === 'short') ACTIONS.quick5();
    else if (ACTIONS[k]) ACTIONS[k]();
  };
}

let lastQueueHtml = '';
function renderTodayQueue() {
  renderGreeting(); applySessionMode();
  const all = actionCandidates(), fresh = isNewUser(), mode = fresh ? 'any' : homeMode;
  const subs = mode === 'topic' ? subjectList() : [];
  let list = mode === 'topic' ? all.filter((c) => c.id === 'feynman' || c.id === 'weak') : modeCandidates(all, mode), note = '';
  if (mode === 'topic' && !subs.length) { list = all; note = 'Aún no tienes materias con tarjetas. Empieza por esto:'; }
  else if (mode !== 'any' && mode !== 'topic' && !list.length) { list = all; note = `Ahora mismo no hay nada que encaje con «${MODE_NAME[mode]}». Te muestro lo recomendado:`; }
  const a = list[0], alts = list.slice(mode === 'topic' && subs.length ? 0 : 1, mode === 'topic' && subs.length ? 2 : 3), next = upcoming()[0];
  const picker = fresh ? '' : `<div class="mode-picker" role="group" aria-label="¿Cuánto tiempo tienes?">${Object.entries(MODE_NAME).map(([m, l]) => `<button class="seg-btn" type="button" data-action="mode" data-mode="${m}" aria-pressed="${mode === m}">${esc(l)}</button>`).join('')}</div>`;
  const subjHtml = subs.length ? `<p class="eyebrow">Elige un tema</p><h2 class="next-title">¿Qué materia quieres trabajar?</h2><div class="subject-chips">${subs.map((s) => `<button class="topic-chip" type="button" data-action="subject" data-subject="${esc(s.name)}">${esc(s.name)} <small>· ${plural(s.due, 'para hoy', 'para hoy')}</small></button>`).join('')}</div><p class="why">Empieza un mini quiz de 8 tarjetas de la materia, con tus errores primero.</p>` : '';
  const dateBtn = !fresh && next && a?.id !== 'plan' ? `<button class="text-button" type="button" data-action="plan">Próxima fecha: ${esc(next.title)} · ${esc(whenLabel(next.date))}</button>` : '';
  const dateLink = `<p class="quick-links">${dateBtn}<button class="text-button" type="button" data-action="stuck">Hoy me cuesta arrancar</button></p>`;
  const altHtml = (c) => `<li class="alt"><div class="alt-text"><b>${esc(c.title)}</b> <span class="tag">≈ ${c.minutes} min</span><p class="why">${esc(c.why)}</p></div><button class="outline-button" type="button" data-action="${esc(c.id)}" aria-label="${esc(`${c.cta}: ${c.title}`)}">${esc(c.cta)}</button></li>`;
  const more = fresh
    ? '<button class="outline-button" type="button" data-action="newpomo">Probar un Pomodoro sin tarjetas</button>'
    : '<button id="smart-session" class="outline-button" type="button" data-action="smart">Empezar sesión inteligente</button><button id="jump-feynman" class="outline-button" type="button" data-action="feynman">Explicar un tema (Feynman)</button>';
  const primary = subs.length ? subjHtml : `
      ${note ? `<p class="why">${esc(note)}</p>` : ''}
      <div class="card-head"><div><p class="eyebrow">${fresh ? 'Tu primer paso' : mode === 'any' || note ? 'Recomendado para ahora' : esc(MODE_NAME[mode])}</p><h2 class="next-title">${esc(a.title)}</h2></div><span class="tag" title="Tiempo estimado">≈ ${a.minutes} min</span></div>
      <p class="why"><b>Por qué:</b> ${esc(a.why)}</p>
      <div class="actions tight"><button id="next-action" class="primary-button big" type="button" data-action="${esc(a.id)}">${esc(a.cta)}</button></div>`;
  const html = `${picker}${primary}
      ${alts.length ? `<h3 class="alts-head">${subs.length ? 'O prueba otra cosa' : 'O elige otra opción'}</h3><ul class="alt-list">${alts.map(altHtml).join('')}</ul>` : ''}
      ${dateLink}${fresh ? '' : '<p class="hint">≈ Los tiempos son estimaciones.</p>'}
      <details class="more-inline" id="today-more-options"><summary>Más opciones</summary><div class="actions">${more}</div></details>`;
  if (html === lastQueueHtml) return; // sin cambios: no se redibuja (así no se pierde el foco ni se cierra «Más opciones»)
  const box = $('#today-queue'), ae = document.activeElement, focusSel = ae && box.contains(ae) && ae.dataset.action ? `[data-action="${ae.dataset.action}"]` : '';
  const open = $('#today-more-options')?.open;
  box.innerHTML = html; lastQueueHtml = html;
  if (open) $('#today-more-options').open = true;
  if (focusSel) box.querySelector(focusSel)?.focus({ preventScroll: true });
}
