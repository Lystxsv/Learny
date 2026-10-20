/* Learny · parte 5 de 15 · Temporizador
   Pomodoro, sincronización entre pestañas, racha y pantalla «Hoy».
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

/* =========================================================
   Pomodoro
   ========================================================= */
const timer = { mode: 'focus', running: false, endAt: 0, remaining: 0, total: 0, intention: '', label: '', id: null, started: false, runId: '', distractions: [] };
const phaseSeconds = (mode) => (mode === 'focus' ? state.settings.focus : state.settings.rest) * 60;

function resetTimer(mode = 'focus', persist = true) {
  clearInterval(timer.id); timer.id = null; timer.running = false; timer.mode = mode; timer.started = false; timer.runId = ''; timer.distractions = [];
  timer.total = timer.remaining = phaseSeconds(mode); renderTimer(); if (persist) persistTimer();
}

function persistTimer() {
  try {
    // En reposo también se escribe (started: false) para que las demás pestañas vean el cambio de modo.
    const raw = timer.started
      ? JSON.stringify({ mode: timer.mode, running: timer.running, endAt: timer.endAt, remaining: timer.remaining, total: timer.total, intention: timer.intention, label: timer.label, runId: timer.runId, distractions: timer.distractions })
      : JSON.stringify({ started: false, mode: timer.mode });
    lastTimerRaw = raw; localStorage.setItem(TIMER_KEY, raw);
  } catch { /* sin persistencia */ }
}

function restoreTimer(raw) {
  const t = parseJSON(raw);
  if (!t || !['focus', 'rest'].includes(t.mode)) return;
  clearInterval(timer.id); timer.id = null; timer.running = false;
  if (t.started === false) { // otra pestaña (o una recarga) dejó el temporizador en reposo
    Object.assign(timer, { mode: t.mode, started: false, runId: '', distractions: [], total: phaseSeconds(t.mode), remaining: phaseSeconds(t.mode) }); renderTimer(); return;
  }
  const total = num(t.total, 1, 10800, 0); if (!total) return;
  Object.assign(timer, { mode: t.mode, total, intention: String(t.intention || ''), label: String(t.label || ''), distractions: cleanNotes(t.distractions), started: true, runId: String(t.runId || `${t.mode}:${Number(t.endAt) || 0}:${total}`) });
  if (t.running && Number(t.endAt) > 0) {
    timer.endAt = Number(t.endAt); timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    if (timer.remaining <= 0) {
      if (Date.now() - timer.endAt < AWAY_MS) { finishPhase(); return; }
      discardAway(); return;
    }
    timer.running = true; timer.id = setInterval(tick, 500);
  } else timer.remaining = num(t.remaining, 0, total, total);
  $('#intention-input').value = timer.intention; $('#pomodoro-label').value = timer.label;
  renderTimer();
}

/* Lumi y otros extras: aviso de que el temporizador cambió de estado (solo cuando cambia, no en cada tick). */
let lastTimerKey = '';
function emitTimerState() {
  const key = `${timer.started}|${timer.running}|${timer.mode}`;
  if (key === lastTimerKey) return;
  lastTimerKey = key;
  document.dispatchEvent(new CustomEvent('learny:timer', { detail: { started: timer.started, running: timer.running, mode: timer.mode } }));
}
function renderTimer() {
  const focusMode = timer.mode === 'focus', fresh = timer.remaining >= timer.total;
  const clock = $('#timer-clock');
  clock.textContent = time(timer.remaining);
  $('#timer-clock').parentElement.setAttribute('aria-live', timer.running ? 'off' : 'polite');
  $('#pomodoro-profile').textContent = `${state.settings.focus}/${state.settings.rest} · ${focusMode ? 'Foco' : 'Descanso'}`;
  $('#pomodoro-button').textContent = timer.running ? 'Ⅱ Pausar' : focusMode ? (fresh ? '▶ Iniciar enfoque' : '▶ Continuar') : (fresh ? '☕ Iniciar descanso' : '▶ Continuar descanso');
  $('#pomodoro-skip').hidden = focusMode;
  $('#timer-note').textContent = focusMode
    ? (timer.intention ? `Intención: ${timer.intention}${timer.label ? ` · ${timer.label}` : ''}` : '¿Qué resultado concreto quieres lograr?')
    : 'Descanso: toma agua, respira lento, estira y mira a lo lejos.';
  document.title = (DEMO ? 'Demostración · ' : '') + (timer.running ? `${time(timer.remaining)} · Learny` : 'Learny · Estudia con intención');
  applySessionMode(); renderDistractions();
  const goal = num(state.settings.dailyGoal, 1, 12, 2);
  const done = cached('doneToday', () => state.sessions.filter((s) => s.date === today() && !s.abandon).length);
  $('#goal-progress').textContent = `Meta: ${goal} ${goal === 1 ? 'bloque' : 'bloques'} de ${state.settings.focus} minutos · hoy ${done}/${goal}. Racha: ${calcStreak().streak} días.`;
  $('#notify-hint').hidden = !(state.settings.notify && typeof Notification !== 'undefined' && Notification.permission === 'denied');
  const mini = $('#mini-timer');
  if (mini) {
    const show = timer.started && currentPage !== 'study';
    mini.hidden = !show; document.body.classList.toggle('has-mini', show);
    if (show) { mini.textContent = `${focusMode ? '🎯' : '☕'} ${time(timer.remaining)}${timer.running ? '' : ' · en pausa'}`; mini.setAttribute('aria-label', `Volver al temporizador. ${focusMode ? 'Foco' : 'Descanso'}: quedan ${time(timer.remaining)}${timer.running ? '' : ', en pausa'}`); }
  }
  emitTimerState();
}

/* Fase 2: un bloque que terminó mientras la pestaña dormía o estaba cerrada (más de AWAY_MS después de su hora) no se registra como sesión completa: no hay forma de saber si estudiaste. */
const AWAY_MS = 20000;
function discardAway() {
  const wasFocus = timer.mode === 'focus';
  resetTimer('focus');
  if (wasFocus) toast('Un bloque de enfoque terminó mientras no estabas; no se contó como sesión.');
}
function tick() {
  timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
  if (timer.remaining <= 0) { if (Date.now() - timer.endAt > AWAY_MS) { clearInterval(timer.id); timer.id = null; discardAway(); return; } renderTimer(); finishPhase(); return; }
  renderTimer();
}

/* Etapa 2: notas de distracción del bloque en curso (viajan en learny.timer y se guardan en la sesión) */
function renderDistractions() {
  const zone = $('#distraction-zone'); if (!zone) return;
  zone.hidden = !(timer.started && timer.mode === 'focus');
  const n = timer.distractions.length, msg = n ? `${plural(n, 'distracción anotada', 'distracciones anotadas')}. La revisas al terminar el bloque.` : 'Anótala aquí en vez de seguirla; la revisas al terminar.';
  const c = $('#distraction-count'); if (c.textContent !== msg) c.textContent = msg;
  const list = $('#distraction-list'), key = timer.distractions.join('\u0001');
  if (list.dataset.key === key) return;
  list.dataset.key = key;
  list.replaceChildren(...timer.distractions.slice(-3).map((t) => Object.assign(document.createElement('li'), { textContent: t })));
}
function addDistraction() {
  const input = $('#distraction-input'), v = cleanNotes([input.value])[0];
  if (!v || !timer.started || timer.mode !== 'focus') return;
  if (timer.distractions.length >= 20) return toast('Ya anotaste 20 en este bloque. Sigue con tu foco.', 'error');
  timer.distractions.push(v); input.value = ''; persistTimer(); renderDistractions(); announce('Distracción anotada.'); input.focus();
}

function askAbandon(onContinue) {
  if (timer.mode !== 'focus' || !timer.started || timer.remaining >= timer.total) { onContinue(); return; }
  modal(`<h2>Reiniciar a mitad de bloque</h2><p>El bloque se descartará. ¿Qué pasó?</p>
      <fieldset class="choice-list"><div class="scale">
        <label><input type="radio" name="why" value="distraccion" required> Distracción</label>
        <label><input type="radio" name="why" value="cansancio"> Cansancio</label>
        <label><input type="radio" name="why" value="interrupcion"> Interrupción</label>
      </div></fieldset>
      <button class="primary-button">Guardar y reiniciar</button>`, (data) => {
    state.sessions.push({
      id: uid(), date: today(), minutes: Math.max(1, Math.round((timer.total - timer.remaining) / 60)),
      intention: timer.intention, label: timer.label, energy: null, abandon: data.get('why'), achieved: false, distractions: timer.distractions.slice()
    });
    save(); closeModal(); onContinue(); renderAll();
  });
}

function startPomodoro() {
  if (timer.running) {
    tick(); clearInterval(timer.id); timer.id = null; timer.running = false; renderTimer(); persistTimer(); announce('Temporizador en pausa.');
    return;
  }
  if (timer.mode === 'focus') {
    const intention = clean($('#intention-input').value, 140) || timer.intention;
    if (!intention) {
      if (currentPage !== 'study') { toast('Escribe un resultado concreto en «Hoy» antes de empezar un bloque.', 'error'); return; } // Fase 4: la tecla P no te saca de la sección en la que estás
      toast('Escribe un resultado concreto antes de empezar.', 'error'); newUserPomo = true; applySessionMode(); $('#intention-input').focus(); return;
    }
    timer.intention = intention;
    timer.label = clean($('#pomodoro-label').value, 60);
  }
  if (!timer.started || !timer.runId) timer.runId = uid();
  timer.started = true;
  timer.endAt = Date.now() + timer.remaining * 1000;
  timer.running = true;
  timer.id = setInterval(tick, 500);
  renderTimer(); persistTimer(); announce(timer.mode === 'focus' ? 'Bloque de enfoque iniciado.' : 'Descanso iniciado.');
}

/* Varias pestañas pueden detectar a la vez que el bloque terminó: solo una lo registra.
   Reclamo atómico con Web Locks (si existe) + marca en localStorage con el id de la ejecución; una pestaña oculta espera 1,2 s para que mande la visible. */
const DONE_KEY = 'learny.timer.done';
let finishing = false;
async function claimFinish(id) {
  const take = () => { try { if (localStorage.getItem(DONE_KEY) === id) return false; localStorage.setItem(DONE_KEY, id); } catch { /* sin almacenamiento: seguimos */ } return true; };
  if (document.hidden) await new Promise((r) => setTimeout(r, 1200));
  if (navigator.locks?.request) { try { return await navigator.locks.request(DEMO ? 'learny-finish-demo' : 'learny-finish', take); } catch { /* sin Web Locks */ } }
  return take();
}
function finishPhase() {
  if (finishing) return;
  finishing = true; clearInterval(timer.id); timer.id = null; timer.running = false;
  const id = timer.runId || `${timer.mode}:${timer.endAt}:${timer.total}`;
  claimFinish(id).then((won) => {
    finishing = false;
    if (!won || !timer.started) { pullFromStorage(); return; } // otra pestaña ya lo registró (o se reinició mientras esperaba)
    completePhase();
  });
}
function completePhase() {
  beep();
  notify('Learny', timer.mode === 'focus' ? 'Bloque de foco terminado.' : 'Descanso terminado.');
  if (timer.mode === 'rest') { toast('Descanso terminado. ¡Listo para otro bloque!'); resetTimer('focus'); return; }
  const session = {
    id: uid(), date: today(), minutes: Math.max(1, Math.round(timer.total / 60)),
    intention: timer.intention, label: timer.label, energy: null, abandon: null, achieved: null, distractions: timer.distractions.slice()
  };
  state.sessions.push(session); save();
  resetTimer('rest'); renderAll();
  const clockEl = $('#timer-clock'); clockEl.classList.remove('pulse'); void clockEl.offsetWidth; clockEl.classList.add('pulse');
  announce('Bloque completado. Guarda cómo te fue.');
  const showDone = () => modal(`<h2>¡Bloque completado!</h2>
      <p>Sumaste ${plural(session.minutes, 'minuto', 'minutos')}${session.label ? ` en ${esc(session.label)}` : ''}.</p>
      ${session.distractions.length ? `<p class="modal-tip">Para mirar después: ${session.distractions.map(esc).join(' · ')}</p>` : ''}
      <fieldset class="choice-list"><legend>¿Lograste el resultado concreto?</legend>
        <div class="scale"><label><input type="radio" name="achieved" value="yes" required> Sí</label>
        <label><input type="radio" name="achieved" value="no"> Aún no</label></div></fieldset>
      <fieldset class="choice-list"><legend>Concentración</legend>
        <div class="scale">${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="energy" value="${n}" ${n === 3 ? 'required' : ''}> ${n}</label>`).join('')}</div>
      </fieldset>
      <p class="modal-tip">1 = muy baja · 5 = muy alta. Ya puedes iniciar tu descanso de ${plural(state.settings.rest, 'minuto', 'minutos')}.</p>
      <button class="primary-button">Guardar</button>`,
  (data) => {
    session.energy = data.get('energy') ? Number(data.get('energy')) : null;
    session.achieved = data.get('achieved') === 'yes';
    save(); closeModal(); renderAll();
  }, () => { renderAll(); document.dispatchEvent(new Event('learny:pomodone')); showClosure('focus', session); });
  if (!modalOpen()) { showDone(); return; }
  // Hay otra ventana abierta (p. ej. un formulario a medias): no la pisamos; la valoración aparece al cerrarla.
  toast('Bloque completado. Cuando cierres esta ventana podrás valorarlo.');
  const dlg = $('#app-modal');
  const later = () => { if (modalOpen()) return; dlg.removeEventListener('close', later); showDone(); };
  dlg.addEventListener('close', later);
}

function configurePomodoro() {
  modal(`<h2>Personaliza el temporizador</h2>
      <div class="form-row"><label>Foco (min)<input name="focus" type="number" min="1" max="180" value="${state.settings.focus}" required></label>
      <label>Descanso (min)<input name="rest" type="number" min="1" max="60" value="${state.settings.rest}" required></label></div>
      <label>Meta diaria (bloques)<input name="goal" type="number" min="1" max="12" value="${state.settings.dailyGoal}"></label>
      <button class="primary-button">Guardar</button>`, (data) => {
    state.settings.focus = num(data.get('focus'), 1, 180, 25);
    state.settings.rest = num(data.get('rest'), 1, 60, 5);
    state.settings.dailyGoal = num(data.get('goal'), 1, 12, 2);
    $('#daily-goal-input').value = state.settings.dailyGoal;
    save(); closeModal(); if (!timer.started) resetTimer(timer.mode); else renderTimer(); renderAll();
  });
}

/* ---- Varias pestañas: el temporizador y los datos se sincronizan; los datos nunca se pisan con una copia vieja ---- */
function adoptRemoteState(raw) {
  const data = parseJSON(raw);
  if (!data || typeof data !== 'object' || Array.isArray(data) || Number(data.version) > SCHEMA) return;
  lastSavedRaw = raw;
  hydrate(data);
  if (exam) { exam.cards = exam.cards.map((c) => state.cards.find((x) => x.id === c.id)).filter(Boolean); if (exam.i >= exam.cards.length) exam = null; }
  clearUndo(); // las acciones de deshacer apuntan a objetos que ya no son los actuales
  applyAppearance(); renderAll();
  const el = $('#save-status'); if (el) { el.textContent = `Sincronizado ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`; el.classList.remove('bad'); }
}
function pullFromStorage() {
  try {
    const raw = localStorage.getItem(KEY); if (raw && raw !== lastSavedRaw) adoptRemoteState(raw);
    const t = localStorage.getItem(TIMER_KEY); if (t && t !== lastTimerRaw) { lastTimerRaw = t; restoreTimer(t); }
  } catch { /* sin almacenamiento */ }
}
window.addEventListener('storage', (e) => {
  if (e.storageArea !== localStorage) return;
  if (e.key === TIMER_KEY) { lastTimerRaw = e.newValue; restoreTimer(e.newValue || JSON.stringify({ started: false, mode: 'focus' })); }
  else if (e.key === KEY && e.newValue) adoptRemoteState(e.newValue);
  else if ((e.key === KEY && !e.newValue) || e.key === null) { // otra pestaña borró todo (o limpió el almacenamiento): no resucitar los datos
    exam = null; clearUndo(); lastSavedRaw = null; hydrate({}); applyPreferences(); resetTimer('focus', false); renderAll();
  }
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) { pullFromStorage(); if (timer.running) tick(); } });

function calcStreak() { return cached('streak', calcStreakRaw); }
function calcStreakRaw() {
  const studied = new Set(state.sessions.filter((s) => !s.abandon).map((s) => s.date));
  let streak = 0, graceUsed = false, cursor = today();
  if (!studied.has(cursor)) cursor = addDays(cursor, -1);
  for (let i = 0; i < 400; i++) {
    if (studied.has(cursor)) streak++;
    else if (!graceUsed && studied.has(addDays(cursor, -1))) graceUsed = true;
    else break;
    cursor = addDays(cursor, -1);
  }
  return { streak, graceUsed };
}

const facts = ['Los pulpos tienen tres corazones.', 'La miel puede conservarse durante miles de años.', 'Tu cerebro consolida recuerdos mientras duermes.', 'Los árboles intercambian nutrientes mediante redes de hongos.', 'La luz solar tarda unos 8 minutos en llegar a la Tierra.', 'Los tiburones existen desde antes que los árboles.', 'Un día en Venus dura más que un año en Venus.', 'Explicar algo con tus palabras revela lo que realmente entiendes.', 'Repasar justo antes de olvidar fortalece más la memoria que releer sin pausa.'];

function renderFocus() {
  const sessions = state.sessions.filter((s) => s.date === today() && !s.abandon);
  const minutes = sessions.reduce((t, s) => t + Number(s.minutes || 0), 0);
  const energy = sessions.filter((s) => s.energy).map((s) => Number(s.energy));
  $('#focus-today').textContent = `${minutes} min`;
  $('#daily-rhythm').textContent = sessions.length ? `${plural(sessions.length, 'bloque completado', 'bloques completados')} hoy.` : 'Aún no has completado bloques hoy. Empieza con una intención breve.';
  $('#average-energy').textContent = energy.length ? `${(energy.reduce((a, b) => a + b, 0) / energy.length).toFixed(1)}/5` : '—';
  $('#current-streak').textContent = plural(calcStreak().streak, 'día', 'días');
  $('#daily-fact').textContent = facts[new Date().getDate() % facts.length];
  renderTimer();
}

function weakSubject() {
  return cached('weak', () => {
    const a = Object.entries(subjectStats()).filter(([, v]) => v.total >= MIN_SAMPLE).map(([name, v]) => ({ name, pct: Math.round((v.ok * 100) / v.total), ok: v.ok, total: v.total })).sort((x, y) => x.pct - y.pct)[0];
    return a && a.pct < 60 ? a : null;
  });
}
