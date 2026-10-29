/* Learny · parte 4 de 15 · Planificador
   Plan inverso por fases, tareas diarias, reajuste si te atrasas y fechas de examen.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

/* =========================================================
   Planificador inverso + tareas diarias
   ========================================================= */
function phaseForProgress(p) {
  if (p < 0.25) return PHASES[0];
  if (p < 0.5) return PHASES[1];
  if (p < 0.7) return PHASES[2];
  if (p < 0.88) return PHASES[3];
  return PHASES[4];
}

function rebuildTasks(deadline, keepDone = true, fromToday = false) {
  const doneMap = {};
  if (keepDone) state.tasks.filter((t) => t.deadlineId === deadline.id && t.done && (!fromToday || t.date >= today())).forEach((t) => { doneMap[t.date] = true; });
  state.tasks = state.tasks.filter((t) => t.deadlineId !== deadline.id || (fromToday && t.date < today())); // fromToday conserva lo anterior a hoy
  const start = today();
  const span = Math.min(MAX_PLAN_DAYS, Math.max(1, daysUntil(deadline.date)));
  const cardTarget = Math.max(3, deadline.difficulty * 2);
  for (let i = 0; i <= span; i++) {
    const date = addDays(start, i);
    if (date > deadline.date) break;
    const p = i / Math.max(1, span);
    const phase = daysUntil(deadline.date) <= 0 ? PHASES[4] : phaseForProgress(p);
    const mins = deadline.dailyMinutes;
    const titles = {
      comprension: `Hoy debes crear ${cardTarget} tarjetas de ${deadline.subject} y leer lo esencial (${mins} min).`,
      practica: `Practica ${deadline.subject}: ejercicios activos ${mins} min y 5 preguntas en voz alta.`,
      repaso: `Repasa tarjetas de ${deadline.subject} y cierra huecos (${mins} min).`,
      simulacro: `Simulacro de ${deadline.subject}: ${Math.min(45, mins)} min cronometrados y anota errores.`,
      revision: `Revisión final de ${deadline.title}: conceptos débiles y un pase rápido.`
    };
    state.tasks.push({
      id: uid(), deadlineId: deadline.id, date, phase: phase.id,
      title: titles[phase.id], done: !!doneMap[date], cardTarget: phase.id === 'comprension' ? cardTarget : 0
    });
  }
}

const phaseLabel = (id) => PHASES.find((p) => p.id === id)?.label || id;
const shortDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'short' });
const hrs = (min) => (min / 60).toFixed(1);

/* Si te atrasas: se mueven a hoy las 2 tareas atrasadas más recientes de cada examen y se descartan las anteriores.
   Cada cambio queda registrado (state.planLog) y se explica en Planificar; lo descartado se cuenta en deadline.skipped. */
function redistributeIfBehind() {
  if (state.settings.lastRollover === today()) return; // una sola vez por día (y nunca dentro de un render): sin duplicados en el historial
  const before = JSON.stringify({ tasks: state.tasks, planLog: state.planLog, deadlines: state.deadlines });
  let moved = 0, dropped = 0;
  state.deadlines.forEach((d) => {
    if (daysUntil(d.date) < 0) return;
    const late = state.tasks.filter((t) => t.deadlineId === d.id && !t.done && t.date < today()).sort((a, b) => b.date.localeCompare(a.date));
    if (!late.length) return;
    const keep = late.slice(0, 2), drop = late.slice(2), dropIds = new Set(drop.map((t) => t.id));
    state.planLog.push({
      id: uid(), date: today(), deadlineId: d.id, title: d.title, kind: 'late', minutes: d.dailyMinutes,
      moved: keep.map((t) => ({ phase: t.phase, from: t.date })), dropped: drop.map((t) => ({ phase: t.phase, from: t.date }))
    });
    keep.forEach((t) => { t.date = today(); if (!t.title.startsWith('Recuperar:')) t.title = `Recuperar: ${t.title}`; });
    if (dropIds.size) { state.tasks = state.tasks.filter((t) => !dropIds.has(t.id)); d.debtMin = (d.debtMin ?? (d.skipped || 0) * d.dailyMinutes) + dropIds.size * d.dailyMinutes; d.skipped = (d.skipped || 0) + dropIds.size; }
    moved += keep.length; dropped += drop.length;
  });
  state.settings.lastRollover = today();
  state.planLog = state.planLog.slice(-30);
  save();
  if (!moved && !dropped) return;
  const msg = `Plan reajustado: moví ${plural(moved, 'tarea atrasada', 'tareas atrasadas')} a hoy${dropped ? ` y descarté ${plural(dropped, 'tarea', 'tareas')} que ya no cabían` : ''}. El detalle está en Planificar → Cambios en tu plan.`;
  const undo = () => { // deshacer: vuelve a las tareas, el historial y las deudas de antes; hoy no se reajusta otra vez
    clearUndo(); const b = JSON.parse(before); state.tasks = b.tasks; state.planLog = b.planLog; state.deadlines = b.deadlines;
    state.settings.lastRollover = today(); save(); renderAll();
  };
  queueToast(msg, 'ok', { label: 'Deshacer', run: undo }); // en cola: espera a los demás avisos de arranque
}

/* ¿Cabe lo que queda? Trabajo pendiente (tareas abiertas de hoy en adelante + las descartadas) frente al tiempo disponible hasta el examen. */
function loadReport(d) {
  const days = daysUntil(d.date) + 1, mins = d.dailyMinutes, skipped = d.skipped || 0;
  const open = state.tasks.filter((t) => t.deadlineId === d.id && !t.done && t.date >= today()).length;
  const debt = d.debtMin ?? skipped * mins; // minutos de las sesiones descartadas, con el tamaño que tenían al descartarlas
  const needed = open * mins + debt, available = days * mins;
  const need = Math.ceil(needed / days / 5) * 5;
  return { days, open, skipped, needed, available, fits: needed <= available, need, canFix: need <= 240 };
}
function loadMessage(r) {
  if (r.fits) return `Cabe: quedan ${hrs(r.needed)} h de trabajo y hay ${hrs(r.available)} h disponibles hasta el examen.`;
  return `Ya no cabe a este ritmo: quedan ${hrs(r.needed)} h de trabajo (${plural(r.open, 'sesión pendiente', 'sesiones pendientes')}${r.skipped ? ` y ${plural(r.skipped, 'descartada', 'descartadas')}` : ''}) y solo hay ${hrs(r.available)} h hasta el examen. ${r.canFix ? `Con ${r.need} min/día sí cabe.` : 'Ni con 240 min/día cabe: cambia la fecha o recorta el temario.'}`;
}

function renderPlanLog() {
  const box = $('#plan-log'); if (!box) return;
  const list = state.planLog.slice(-6).reverse();
  $('#plan-log-clear').hidden = !list.length;
  const names = (arr2) => arr2.map((m) => `${phaseLabel(m.phase)} (${shortDate(m.from)})`).join(', ');
  box.innerHTML = list.length ? list.map((e) => {
    const head = `<b>${esc(shortDate(e.date))} · ${esc(e.title)}</b>`;
    if (e.kind === 'replan') return `<div class="session-item">${head}<br><span>Replanificado desde hoy a ${e.minutes} min/día. Lo completado antes de hoy se conservó.</span></div>`;
    return `<div class="session-item">${head}<br><span>Estabas atrasado: moví a hoy ${esc(names(e.moved))}.${e.dropped.length ? ` Descarté ${esc(names(e.dropped))} porque ya no cabían (≈ ${hrs(e.dropped.length * e.minutes)} h).` : ''}</span></div>`;
  }).join('') : '<p class="empty">Todavía no hubo cambios. Si te atrasas, aquí verás qué tareas movió o descartó Learny y por qué.</p>';
}

function replanDeadline(id) {
  const d = state.deadlines.find((x) => x.id === id); if (!d) return;
  const r = loadReport(d), suggested = Math.min(240, Math.max(d.dailyMinutes, r.fits ? d.dailyMinutes : r.need));
  modal(`<h2>Replanificar «${esc(d.title)}»</h2>
      <p>Se recalculan las tareas desde hoy hasta el ${esc(d.date)}. Lo que completaste antes de hoy se conserva${r.skipped ? `. ${plural(r.skipped, 'sesión descartada se recupera', 'sesiones descartadas se recuperan')} solo si los minutos diarios alcanzan` : ''}.</p>
      <label>Minutos diarios<input name="mins" type="number" min="15" max="240" value="${suggested}" required></label>
      <p class="modal-tip">Ahora: ${d.dailyMinutes} min/día. ${icon(r.fits ? 'check' : 'warning')} ${esc(loadMessage(r))}</p>
      <button class="primary-button">Replanificar</button>`, (data) => {
    const d = state.deadlines.find((x) => x.id === id); // otra pestaña pudo sustituir state.deadlines mientras el formulario estaba abierto: se trabaja con el objeto vigente
    if (!d) { closeModal(); return toast('Esa fecha ya no existe (otra pestaña la cambió). No se replanificó nada.', 'error'); }
    const rr = loadReport(d); // con los minutos actuales: cuánto trabajo queda, incluido lo descartado
    const before = { mins: d.dailyMinutes, skipped: d.skipped || 0, debt: d.debtMin, tasks: state.tasks.filter((t) => t.deadlineId === d.id).map((t) => ({ ...t })) };
    const debt = rr.needed - rr.open * before.mins;
    d.dailyMinutes = num(data.get('mins'), 15, 240, d.dailyMinutes);
    const absorbs = debt <= 0 || d.dailyMinutes * rr.days >= rr.needed;
    if (absorbs) { d.skipped = 0; d.debtMin = 0; } else d.debtMin = debt; // si no alcanza, la deuda se conserva y el aviso sigue
    rebuildTasks(d, true, true);
    const entry = { id: uid(), date: today(), deadlineId: d.id, title: d.title, kind: 'replan', minutes: d.dailyMinutes, moved: [], dropped: [] };
    state.planLog = [...state.planLog, entry].slice(-30);
    save(); closeModal(); renderAll();
    offerUndo(absorbs ? 'Plan recalculado.' : `Plan recalculado, pero con ${d.dailyMinutes} min/día aún no cabe todo lo pendiente (harían falta ≈ ${Math.ceil(rr.needed / rr.days / 5) * 5} min/día).`, () => {
      d.dailyMinutes = before.mins; d.skipped = before.skipped; d.debtMin = before.debt;
      state.tasks = state.tasks.filter((t) => t.deadlineId !== d.id).concat(before.tasks);
      state.planLog = state.planLog.filter((e) => e.id !== entry.id); save(); renderAll();
    });
  });
}

/* v71 (Fase 8): lo que dice una tarea de hoy en cifras reales (tarjetas de esa materia ahora mismo). Se calcula al dibujar, no se guarda: cambia solo cuando repasas.
   go: qué hace el botón «Empezar» (due = las vencidas de la materia; quiz = mini quiz con errores primero; '' = nada que lanzar). La fase de comprensión ya trae su cifra en el título. */
function taskDetail(t, d) {
  const sub = String(d?.subject || '').trim(); if (!sub || t.done || t.phase === 'comprension') return null;
  const mine = state.cards.filter((c) => !c.archived && !c.corrupt && norm(c.subject) === norm(sub));
  if (!mine.length) return { text: `Aún no hay tarjetas de ${sub}: crea algunas para poder practicar.`, go: '' };
  const due = dueCards().filter((c) => norm(c.subject) === norm(sub));
  if (t.phase === 'repaso') return due.length ? { text: `Hoy: ${plural(due.length, 'tarjeta', 'tarjetas')} de ${sub} por repasar.`, go: 'due' } : { text: `Hoy no hay tarjetas de ${sub} por repasar.`, go: '' };
  if (t.phase === 'practica') return { text: `Hoy: práctica con ${plural(Math.min(10, mine.length), 'tarjeta', 'tarjetas')} de ${sub}, tus errores primero.`, go: 'quiz10' };
  if (t.phase === 'simulacro') return { text: `Simulacro: ${plural(Math.min(20, mine.length), 'tarjeta', 'tarjetas')} de ${sub}.`, go: 'quiz20' };
  const errs = mine.filter((c) => lastOf(c.history || [])?.rating === 'again').length;
  return errs ? { text: `Revisión: ${plural(errs, 'tarjeta', 'tarjetas')} de ${sub} con fallos recientes.`, go: 'quiz10' } : { text: `Revisión: sin fallos recientes en ${sub}; repasa por encima.`, go: '' };
}
function taskGo(id) {
  const t = state.tasks.find((x) => x.id === id), d = t && state.deadlines.find((x) => x.id === t.deadlineId), det = t && taskDetail(t, d); if (!det || !det.go) return;
  if (det.go === 'due') { const pool = dueCards().filter((c) => norm(c.subject) === norm(d.subject)); if (pool.length) { showPage('practice'); startExam(pool.slice(0, 20), 20); } }
  else startSubjectQuiz(state.cards.find((c) => !c.archived && !c.corrupt && norm(c.subject) === norm(d.subject))?.subject, det.go === 'quiz20' ? 20 : 10);
}

function pendingHours(deadline) {
  const left = state.tasks.filter((t) => t.deadlineId === deadline.id && !t.done);
  return (left.length * deadline.dailyMinutes) / 60;
}

function renderDeadlines() {
  renderPlanLog();
  const entries = [...state.deadlines].sort((a, b) => a.date.localeCompare(b.date));
  const alert = $('#planner-alert');
  const urgent = entries.find((d) => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 3);
  const parts = [];
  if (urgent) parts.push(`Te quedan ${plural(daysUntil(urgent.date), 'día', 'días')} para “${urgent.title}” y tienes ${pendingHours(urgent).toFixed(1)} h pendientes.`);
  const over = entries.filter((d) => daysUntil(d.date) >= 0 && !loadReport(d).fits);
  if (over.length) parts.push(`${over.map((d) => `«${d.title}»`).join(', ')} ya no ${over.length > 1 ? 'caben' : 'cabe'} a tu ritmo diario: revisa «Próximas fechas» y replanifica.`);
  alert.hidden = !parts.length; alert.textContent = parts.join(' ');

  $('#deadline-list').innerHTML = entries.length ? entries.map((x) => {
    const d = daysUntil(x.date);
    const tag = d < 0 ? '<span class="tag">Pasada</span>' : `<span class="tag ${d <= 3 ? 'urgent' : ''}">${d === 0 ? 'Hoy' : `en ${plural(d, 'día', 'días')}`}</span>`;
    const done = state.tasks.filter((t) => t.deadlineId === x.id && t.done).length;
    const total = state.tasks.filter((t) => t.deadlineId === x.id).length;
    return `<div class="session-item"><b translate="no">${esc(x.title)}</b> ${tag}<br><span><span translate="no">${esc(x.subject)}</span> · ${esc(x.date)} · dificultad ${x.difficulty}/5 · ${x.dailyMinutes} min/día<br>${done}/${total} tareas · fases: comprensión → práctica → repaso → simulacro → revisión</span>${d >= 0 ? `<br><span class="plan-load ${loadReport(x).fits ? 'ok' : 'warn'}">${esc(loadMessage(loadReport(x)))}</span>` : ''}<br>${d >= 0 ? `<button class="text-button" data-replan="${esc(x.id)}" type="button">Replanificar desde hoy</button> ` : ''}<button class="text-button danger" data-delete-deadline="${esc(x.id)}" type="button">Eliminar</button></div>`;
  }).join('') : '<p class="empty">Añade una fecha de examen para generar tareas diarias conectadas a temas y tarjetas.</p>';

  const next = entries.find((x) => daysUntil(x.date) >= 0) || entries[0];
  const todayPhase = PHASES.find((p) => p.id === (state.tasks.find((t) => t.deadlineId === next?.id && t.date === today())?.phase || 'comprension'));
  $('#calendar-summary').innerHTML = next
    ? `<b translate="no">${esc(next.title)}</b><p class="lead">Hoy toca la fase de ${esc(todayPhase?.label || 'comprensión')}.</p>`
    : 'Añade una fecha importante para ver el plan inverso del día.';

  const tasks = state.tasks.filter((t) => t.date === today()).sort((a, b) => a.title.localeCompare(b.title));
  $('#today-tasks').innerHTML = tasks.length ? tasks.map((t) => {
    const d = state.deadlines.find((x) => x.id === t.deadlineId);
    const phase = PHASES.find((p) => p.id === t.phase)?.label || t.phase;
    const det = taskDetail(t, d), extra = det ? `<p class="task-go">${esc(det.text)}${det.go ? ` <button class="text-button" type="button" data-task-go="${esc(t.id)}">Empezar</button>` : ''}</p>` : '';
    return `<div class="task-item"><label class="task-row"><input type="checkbox" data-task="${esc(t.id)}" ${t.done ? 'checked' : ''}><span><b>${esc(phase)}</b> · <span translate="no">${esc(d?.title || '')}</span><br>${esc(t.title)}</span></label>${extra}</div>`;
  }).join('') : '<p class="empty">Cuando tengas un examen, aquí aparecerán las tareas de hoy.</p>';
}

function addDeadline() {
  modal(`<h2>Nueva fecha</h2>
      <label>Nombre<input name="title" required maxlength="80"></label>
      <label>Materia<input name="subject" required maxlength="60"></label>
      <label>Fecha<input name="date" type="date" min="${today()}" max="${addDays(today(), MAX_PLAN_DAYS)}" required></label>
      <div class="form-row"><label>Dificultad (1-5)<input name="difficulty" type="number" min="1" max="5" value="3" required></label>
      <label>Minutos diarios<input name="mins" type="number" min="15" max="240" value="45" required></label></div>
      <button class="primary-button">Guardar y crear plan</button>`, (data) => {
    const item = {
      id: uid(), title: clean(data.get('title'), 80), subject: clean(data.get('subject'), 60),
      date: data.get('date'), difficulty: num(data.get('difficulty'), 1, 5, 3), dailyMinutes: num(data.get('mins'), 15, 240, 45)
    };
    if (!item.title || !item.subject) return toast('Escribe un nombre y una materia (no pueden quedar en blanco).', 'error');
    if (!validDeadlineDate(item.date)) return toast('Elige una fecha real entre hoy y los próximos 2 años.', 'error');
    state.deadlines.push(item);
    rebuildTasks(item, false);
    save(); closeModal(); renderAll(); toast('Plan inverso creado con tareas diarias.');
  });
}
