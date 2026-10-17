(() => {
  'use strict';

  const KEY = 'learny.v3';
  const LEGACY_KEYS = ['learny.v2', 'learny.v1'];
  const BACKUP_KEY = 'learny.backup';
  const DEFAULT_MODEL = 'gemini-flash-latest';
  const MAX_PROMPT = 3500;
  const MAX_INTERVAL = 180;
  const PHASES = [
    { id: 'comprension', label: 'Comprensión' },
    { id: 'practica', label: 'Práctica' },
    { id: 'repaso', label: 'Repaso' },
    { id: 'simulacro', label: 'Simulacro' },
    { id: 'revision', label: 'Revisión final' }
  ];
  const TEMPLATES = {
    definicion: { question: '¿Qué es [concepto]?', answer: '[concepto] es…' },
    ejemplo: { question: 'Concepto: [X]\n¿Qué ejemplo lo demuestra?', answer: 'Ejemplo: …' },
    problema: { question: 'Problema: …', answer: 'Solución: …' }
  };
  const LOCAL_GUIDES = [
    { pregunta: '¿Cuál es la idea central en una frase?', pista: 'Quita adornos y quédate con la causa o la definición.', reto: 'Explícalo a alguien de 12 años en 20 segundos.' },
    { pregunta: '¿Qué ejemplo propio demuestra esto?', pista: 'Evita el ejemplo del libro; usa uno de tu vida.', reto: 'Cambia una variable y predice qué pasa.' },
    { pregunta: '¿Dónde se rompe esta idea?', pista: 'Busca un contraejemplo o un caso límite.', reto: 'Escribe la duda que aún no puedes resolver.' }
  ];

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, '0');
  const dateStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => dateStr();
  const addDays = (date, n) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + n); return dateStr(d); };
  const daysUntil = (date) => Math.round((new Date(`${date}T12:00:00`) - new Date(`${today()}T12:00:00`)) / 86400000);
  const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const fmt = (v) => esc(v).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  const num = (v, min, max, def) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
  const time = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const clean = (v, max = MAX_PROMPT) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const parseJSON = (raw) => { try { return JSON.parse(raw || 'null'); } catch { return null; } };
  const qualityOf = (rating) => ({ again: 1, hard: 3, easy: 5 }[rating] ?? 3);

  const defaults = () => ({
    version: 3,
    settings: {
      focus: 25, rest: 5, roulettePrepare: 10, rouletteExplain: 1, fontSize: 16, font: 'sans',
      theme: 'dark', accent: 'sky', density: 'normal', reduceMotion: false, engine: 'gemini', model: DEFAULT_MODEL, skipAi: false,
      recentTurns: [], dailyGoal: 2, notify: false, sound: true,
      tutor: { subject: '', level: '', known: '', goal: '' }
    },
    notes: [], feynman: [], sessions: [], cards: [], deadlines: [], reviews: [], topics: [], tasks: [], chats: [], exams: [], apiKey: ''
  });
  const state = defaults();
  let exam = null;

  const normalizeCard = (c) => ({
    id: c.id || uid(),
    subject: String(c.subject || 'Sin materia'),
    question: String(c.question || ''),
    answer: String(c.answer || ''),
    nextReview: /^\d{4}-\d{2}-\d{2}$/.test(c.nextReview) ? c.nextReview : today(),
    lastReviewed: /^\d{4}-\d{2}-\d{2}$/.test(c.lastReviewed) ? c.lastReviewed : null,
    archived: !!c.archived,
    easeFactor: Number(c.easeFactor ?? c.ease) || 2.5,
    interval: Number(c.interval) || 0,
    repetitions: Number(c.repetitions ?? c.reps) || 0,
    history: Array.isArray(c.history) ? c.history.slice(-40) : []
  });

  function hydrate(raw) {
    const base = defaults();
    const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    Object.assign(state, base, src);
    state.version = 3;
    state.settings = { ...base.settings, ...(src.settings || {}) };
    state.settings.tutor = { ...base.settings.tutor, ...(src.settings?.tutor || {}) };
    state.apiKey = typeof state.apiKey === 'string' ? state.apiKey : '';
    ['sessions', 'cards', 'deadlines', 'reviews', 'topics', 'tasks', 'chats', 'exams', 'notes', 'feynman'].forEach((k) => {
      if (!Array.isArray(state[k])) state[k] = [];
    });
    if (!Array.isArray(state.settings.recentTurns)) state.settings.recentTurns = [];
    state.cards = state.cards.filter((c) => c && typeof c === 'object' && c.question).map(normalizeCard);
    state.sessions = state.sessions.filter((s) => s && /^\d{4}-\d{2}-\d{2}$/.test(s.date)).map((s) => ({
      ...s, id: s.id || uid(), minutes: Number(s.minutes) || 0, energy: s.energy ? Number(s.energy) : null,
      label: String(s.label || s.subject || ''), achieved: s.achieved !== false,
      abandon: s.abandon || null, intention: String(s.intention || '')
    }));
    state.deadlines = state.deadlines.filter((d) => d && d.title && /^\d{4}-\d{2}-\d{2}$/.test(d.date)).map((d) => ({
      id: d.id || uid(), title: String(d.title), subject: String(d.subject || ''), date: d.date,
      difficulty: num(d.difficulty, 1, 5, 3), dailyMinutes: num(d.dailyMinutes, 15, 240, 45)
    }));
    state.topics = state.topics.filter((t) => t && t.name).map((t) => ({ id: t.id || uid(), name: String(t.name), category: String(t.category || 'Personal') }));
    state.reviews = state.reviews.filter((r) => r && r.date);
    state.tasks = state.tasks.filter((t) => t && t.deadlineId && t.date).map((t) => ({
      id: t.id || uid(), deadlineId: t.deadlineId, date: t.date, phase: t.phase || 'comprension',
      title: String(t.title || ''), done: !!t.done, cardTarget: Number(t.cardTarget) || 0
    }));
    state.chats = state.chats.filter((c) => c && c.topic).map((c) => ({
      topic: String(c.topic), messages: Array.isArray(c.messages) ? c.messages.slice(-20) : []
    }));
  }

  function snapshot(reason) {
    try {
      const { apiKey, ...safe } = state;
      localStorage.setItem(BACKUP_KEY, JSON.stringify({ at: new Date().toISOString(), reason, data: safe }));
    } catch { /* sin copia */ }
  }

  (function load() {
    let merged = {};
    try {
      LEGACY_KEYS.slice().reverse().forEach((k) => { const p = parseJSON(localStorage.getItem(k)); if (p && typeof p === 'object') merged = { ...merged, ...p, settings: { ...(merged.settings || {}), ...(p.settings || {}) } }; });
      const current = parseJSON(localStorage.getItem(KEY));
      if (current && typeof current === 'object') merged = { ...merged, ...current, settings: { ...(merged.settings || {}), ...(current.settings || {}) } };
    } catch { /* estado nuevo */ }
    hydrate(merged);
  })();

  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch { toast('No se pudo guardar: el navegador bloqueó el almacenamiento.', 'error'); }
  };

  function toast(message, type = 'ok') {
    const el = $('#toast');
    el.textContent = message;
    el.className = `toast show ${type}`;
    clearTimeout(toast.id);
    toast.id = setTimeout(() => el.classList.remove('show'), 4200);
  }

  function showPage(page) {
    $$('.nav-button').forEach((b) => {
      const on = b.dataset.page === page;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $$('.page').forEach((p) => p.classList.toggle('active', p.id === page));
  }

  let modalCloseHandler = null, rouletteId = null;
  const modalOpen = () => $('#app-modal').open;
  const closeModal = () => { if (modalOpen()) $('#app-modal').close(); };
  function modal(html, onSubmit, onClose) {
    const dialog = $('#app-modal'), form = $('#modal-form');
    $('#modal-body').innerHTML = html;
    modalCloseHandler = onClose || null;
    form.onsubmit = (event) => { event.preventDefault(); onSubmit ? onSubmit(new FormData(form)) : closeModal(); };
    if (!dialog.open) dialog.showModal();
  }
  $('#app-modal').addEventListener('close', () => {
    clearInterval(rouletteId); rouletteId = null;
    const handler = modalCloseHandler; modalCloseHandler = null; handler?.();
  });
  $('.modal-close').onclick = closeModal;

  function beep() {
    try {
      if (state.settings.sound !== false) {
        const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
        const ctx = new Ctx(), osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(); osc.stop(ctx.currentTime + 0.8);
      }
      navigator.vibrate?.(200);
    } catch { /* sin sonido */ }
  }

  function notify(title, body) {
    if (!state.settings.notify) return;
    if (Notification.permission === 'granted') {
      try { new Notification(title, { body, silent: false }); } catch { /* ignorar */ }
    }
  }

  function subjects() {
    const set = new Set(state.cards.map((c) => c.subject).concat(state.deadlines.map((d) => d.subject)).filter(Boolean));
    $('#subject-list').innerHTML = [...set].map((s) => `<option value="${esc(s)}">`).join('');
    return [...set];
  }

  const dueCards = () => state.cards.filter((c) => !c.archived && c.nextReview <= today()).sort((a, b) => a.nextReview.localeCompare(b.nextReview) || a.easeFactor - b.easeFactor);
  const overdueCards = () => state.cards.filter((c) => !c.archived && c.nextReview < today());

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

  function rebuildTasks(deadline, keepDone = true) {
    const doneMap = {};
    if (keepDone) state.tasks.filter((t) => t.deadlineId === deadline.id && t.done).forEach((t) => { doneMap[t.date] = true; });
    state.tasks = state.tasks.filter((t) => t.deadlineId !== deadline.id);
    const days = Math.max(1, daysUntil(deadline.date));
    const start = today();
    const span = Math.max(1, daysUntil(deadline.date));
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

  function redistributeIfBehind() {
    state.deadlines.forEach((d) => {
      if (daysUntil(d.date) < 0) return;
      const pending = state.tasks.filter((t) => t.deadlineId === d.id && !t.done && t.date < today());
      if (!pending.length) return;
      pending.forEach((t) => { t.date = today(); t.title = `Recuperar: ${t.title}`; });
    });
  }

  function pendingHours(deadline) {
    const left = state.tasks.filter((t) => t.deadlineId === deadline.id && !t.done);
    return (left.length * deadline.dailyMinutes) / 60;
  }

  function renderDeadlines() {
    redistributeIfBehind();
    const entries = [...state.deadlines].sort((a, b) => a.date.localeCompare(b.date));
    const alert = $('#planner-alert');
    const urgent = entries.find((d) => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 3);
    if (urgent) {
      const hours = pendingHours(urgent).toFixed(1);
      alert.hidden = false;
      alert.textContent = `Te quedan ${plural(daysUntil(urgent.date), 'día', 'días')} para “${urgent.title}” y tienes ${hours} h pendientes.`;
    } else alert.hidden = true;

    $('#deadline-list').innerHTML = entries.length ? entries.map((x) => {
      const d = daysUntil(x.date);
      const tag = d < 0 ? '<span class="tag">Pasada</span>' : `<span class="tag ${d <= 3 ? 'urgent' : ''}">${d === 0 ? 'Hoy' : `en ${plural(d, 'día', 'días')}`}</span>`;
      const done = state.tasks.filter((t) => t.deadlineId === x.id && t.done).length;
      const total = state.tasks.filter((t) => t.deadlineId === x.id).length;
      return `<div class="session-item"><b>${esc(x.title)}</b> ${tag}<br><span>${esc(x.subject)} · ${esc(x.date)} · dificultad ${x.difficulty}/5 · ${x.dailyMinutes} min/día<br>${done}/${total} tareas · fases: comprensión → práctica → repaso → simulacro → revisión</span><br><button class="text-button danger" data-delete-deadline="${esc(x.id)}" type="button">Eliminar</button></div>`;
    }).join('') : '<p class="empty">Añade una fecha de examen para generar tareas diarias conectadas a temas y tarjetas.</p>';

    const next = entries.find((x) => daysUntil(x.date) >= 0) || entries[0];
    const todayPhase = PHASES.find((p) => p.id === (state.tasks.find((t) => t.deadlineId === next?.id && t.date === today())?.phase || 'comprension'));
    $('#calendar-summary').innerHTML = next
      ? `<b>${esc(next.title)}</b><p class="lead">Hoy toca la fase de ${esc(todayPhase?.label || 'comprensión')}.</p>`
      : 'Añade una fecha importante para ver el plan inverso del día.';

    const tasks = state.tasks.filter((t) => t.date === today()).sort((a, b) => a.title.localeCompare(b.title));
    $('#today-tasks').innerHTML = tasks.length ? tasks.map((t) => {
      const d = state.deadlines.find((x) => x.id === t.deadlineId);
      const phase = PHASES.find((p) => p.id === t.phase)?.label || t.phase;
      return `<label class="task-row"><input type="checkbox" data-task="${esc(t.id)}" ${t.done ? 'checked' : ''}><span><b>${esc(phase)}</b> · ${esc(d?.title || '')}<br>${esc(t.title)}</span></label>`;
    }).join('') : '<p class="empty">Cuando tengas un examen, aquí aparecerán las tareas de hoy.</p>';
  }

  function addDeadline() {
    modal(`<h2>Nueva fecha</h2>
      <label>Nombre<input name="title" required maxlength="80"></label>
      <label>Materia<input name="subject" required maxlength="60"></label>
      <label>Fecha<input name="date" type="date" required></label>
      <div class="form-row"><label>Dificultad (1-5)<input name="difficulty" type="number" min="1" max="5" value="3" required></label>
      <label>Minutos diarios<input name="mins" type="number" min="15" max="240" value="45" required></label></div>
      <button class="primary-button">Guardar y crear plan</button>`, (data) => {
      const item = {
        id: uid(), title: clean(data.get('title'), 80), subject: clean(data.get('subject'), 60),
        date: data.get('date'), difficulty: num(data.get('difficulty'), 1, 5, 3), dailyMinutes: num(data.get('mins'), 15, 240, 45)
      };
      state.deadlines.push(item);
      rebuildTasks(item, false);
      save(); closeModal(); renderAll(); toast('Plan inverso creado con tareas diarias.');
    });
  }

  /* =========================================================
     Pomodoro
     ========================================================= */
  const timer = { mode: 'focus', running: false, endAt: 0, remaining: 0, total: 0, intention: '', label: '', id: null, started: false };
  const phaseSeconds = (mode) => (mode === 'focus' ? state.settings.focus : state.settings.rest) * 60;

  function resetTimer(mode = 'focus') {
    clearInterval(timer.id); timer.id = null; timer.running = false; timer.mode = mode; timer.started = false;
    timer.total = timer.remaining = phaseSeconds(mode); renderTimer();
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
    document.title = timer.running ? `${time(timer.remaining)} · Learny` : 'Learny · Estudia con intención';
    const goal = num(state.settings.dailyGoal, 1, 12, 2);
    const done = state.sessions.filter((s) => s.date === today() && !s.abandon).length;
    $('#goal-progress').textContent = `Meta: ${goal} ${goal === 1 ? 'bloque' : 'bloques'} de ${state.settings.focus} minutos · hoy ${done}/${goal}. Racha: ${calcStreak().streak} días.`;
    $('#notify-hint').hidden = !(state.settings.notify && typeof Notification !== 'undefined' && Notification.permission === 'denied');
  }

  function tick() {
    timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    renderTimer(); if (timer.remaining <= 0) finishPhase();
  }

  function askAbandon(onContinue) {
    if (timer.mode !== 'focus' || !timer.started || timer.remaining >= timer.total) { onContinue(); return; }
    modal(`<h2>Pausa a mitad de bloque</h2><p>¿Qué pasó?</p>
      <fieldset class="choice-list"><div class="scale">
        <label><input type="radio" name="why" value="distraccion" required> Distracción</label>
        <label><input type="radio" name="why" value="cansancio"> Cansancio</label>
        <label><input type="radio" name="why" value="interrupcion"> Interrupción</label>
      </div></fieldset>
      <button class="primary-button">Guardar y pausar</button>`, (data) => {
      state.sessions.push({
        id: uid(), date: today(), minutes: Math.max(1, Math.round((timer.total - timer.remaining) / 60)),
        intention: timer.intention, label: timer.label, energy: null, abandon: data.get('why'), achieved: false
      });
      save(); closeModal(); onContinue(); renderAll();
    }, () => onContinue());
  }

  function startPomodoro() {
    if (timer.running) {
      tick(); clearInterval(timer.id); timer.id = null; timer.running = false; renderTimer();
      return;
    }
    if (timer.mode === 'focus') {
      const intention = clean($('#intention-input').value, 140) || timer.intention;
      if (!intention) { toast('Escribe un resultado concreto antes de empezar.', 'error'); $('#intention-input').focus(); return; }
      timer.intention = intention;
      timer.label = clean($('#pomodoro-label').value, 60);
    }
    timer.started = true;
    timer.endAt = Date.now() + timer.remaining * 1000;
    timer.running = true;
    timer.id = setInterval(tick, 500);
    renderTimer();
  }

  function finishPhase() {
    clearInterval(timer.id); timer.id = null; timer.running = false; beep();
    notify('Learny', timer.mode === 'focus' ? 'Bloque de foco terminado.' : 'Descanso terminado.');
    if (timer.mode === 'rest') { toast('Descanso terminado. ¡Listo para otro bloque!'); resetTimer('focus'); return; }
    const session = {
      id: uid(), date: today(), minutes: Math.max(1, Math.round(timer.total / 60)),
      intention: timer.intention, label: timer.label, energy: null, abandon: null, achieved: null
    };
    state.sessions.push(session); save();
    resetTimer('rest'); renderAll();
    modal(`<h2>¡Bloque completado!</h2>
      <p>Sumaste ${plural(session.minutes, 'minuto', 'minutos')}${session.label ? ` en ${esc(session.label)}` : ''}.</p>
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
    }, () => renderAll());
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
      save(); closeModal(); if (!timer.running) resetTimer(timer.mode); else renderTimer(); renderAll();
    });
  }

  function calcStreak() {
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

  function renderTodayQueue() {
    const due = dueCards();
    const tasks = state.tasks.filter((t) => t.date === today() && !t.done);
    const overdue = overdueCards().length;
    $('#today-queue').innerHTML = `
      <div class="card-head"><div><h2>Hoy</h2><p class="lead">Cola diaria, sin buscar qué toca.</p></div>
        <span class="tag">${plural(due.length, 'tarjeta', 'tarjetas')}</span></div>
      <p><b>Tienes ${due.length} tarjetas para hoy</b>${overdue ? ` (${overdue} vencidas)` : ''}.</p>
      <p class="lead">${tasks.length ? `${plural(tasks.length, 'tarea pendiente', 'tareas pendientes')} del plan inverso.` : 'Sin tareas de examen: añade una fecha en Planificar.'}</p>
      <div class="actions tight">
        <button id="jump-review" class="primary-button" type="button">Repasar ahora</button>
        <button id="jump-plan" class="outline-button" type="button">Ver plan de hoy</button>
      </div>`;
    $('#jump-review').onclick = () => { showPage('practice'); $('#flashcard').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    $('#jump-plan').onclick = () => showPage('planner');
  }

  /* =========================================================
     SM-2
     ========================================================= */
  let activeCard = null, revealed = false, answered = false;

  function schedule(card, rating) {
    const q = qualityOf(rating);
    card.lastReviewed = today();
    card.history = [...(card.history || []), { date: today(), rating, quality: q }].slice(-40);
    if (q < 3) {
      card.repetitions = 0;
      card.interval = 1;
      card.easeFactor = Math.max(1.3, +(card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))).toFixed(2));
    } else {
      if (card.repetitions === 0) card.interval = 1;
      else if (card.repetitions === 1) card.interval = 6;
      else card.interval = Math.round(Math.max(1, card.interval) * card.easeFactor);
      card.repetitions += 1;
      card.easeFactor = Math.max(1.3, +(card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))).toFixed(2));
    }
    const cap = Math.min(MAX_INTERVAL + Math.max(0, card.repetitions - 4) * 15, 365);
    card.interval = Math.min(cap, Math.max(1, card.interval));
    card.nextReview = addDays(today(), card.interval);
  }

  function renderCard() {
    if (exam) return renderExam();
    const due = dueCards();
    activeCard = due[0] || null;
    revealed = false; answered = false;
    $('#rating-row').hidden = true;
    $('#reveal-card').hidden = !activeCard;
    $('#card-tools').hidden = !activeCard;
    $('#card-count').textContent = `${due.length} para hoy`;
    if (!activeCard) {
      const has = state.cards.some((c) => !c.archived);
      $('#flashcard').innerHTML = has
        ? 'No hay tarjetas pendientes hoy.<br><span>Vuelve en tu próxima fecha de repaso o crea más en comprensión.</span>'
        : 'Crea tu primera tarjeta para activar el repaso inteligente.';
      return;
    }
    $('#flashcard').innerHTML = `<div><small>${esc(activeCard.subject)} · EF ${activeCard.easeFactor.toFixed(2)}</small><br>${esc(activeCard.question)}</div>`;
  }

  function revealCard() {
    if (exam) { exam.revealed = true; renderExam(); document.dispatchEvent(new Event('learny:reveal')); return; }
    if (!activeCard || revealed) return;
    revealed = true;
    $('#flashcard').innerHTML = `<div><small>Pregunta</small><br>${esc(activeCard.question)}<hr><small>Respuesta</small><br>${esc(activeCard.answer)}</div>`;
    $('#reveal-card').hidden = true; $('#rating-row').hidden = false;
    document.dispatchEvent(new Event('learny:reveal'));
  }

  function rateCard(rating) {
    if (exam) return examRate(rating);
    if (!activeCard || !revealed || answered) return;
    answered = true;
    schedule(activeCard, rating);
    state.reviews.push({ date: today(), cardId: activeCard.id, subject: activeCard.subject || 'Sin materia', rating, quality: qualityOf(rating) });
    document.dispatchEvent(new Event('learny:rated'));
    save(); toast(`Volverá en ${plural(activeCard.interval, 'día', 'días')}.`); renderAll();
  }

  function snoozeCard() {
    if (!activeCard) return;
    activeCard.nextReview = addDays(today(), 1);
    save(); toast('Pospuesta 1 día. Sigue con la cola de hoy.'); renderAll();
  }

  function startExam(custom, size = 20) {
    const pool = Array.isArray(custom) ? custom : dueCards();
    if (pool.length < 1) return toast('No hay tarjetas vencidas o de hoy para el examen.', 'error');
    exam = { cards: pool.slice(0, size), i: 0, score: 0, revealed: false, answers: [] };
    toast(`Modo examen: ${exam.cards.length} tarjetas.`);
    renderExam();
  }

  function renderExam() {
    const item = exam.cards[exam.i];
    $('#card-count').textContent = `Examen ${exam.i + 1}/${exam.cards.length}`;
    $('#card-tools').hidden = true;
    if (!exam.revealed) {
      $('#flashcard').innerHTML = `<div><small>Modo examen · ${esc(item.subject)}</small><br>${esc(item.question)}</div>`;
      $('#reveal-card').hidden = false; $('#rating-row').hidden = true;
    } else {
      $('#flashcard').innerHTML = `<div><small>Respuesta</small><br>${esc(item.answer)}</div>`;
      $('#reveal-card').hidden = true; $('#rating-row').hidden = false;
    }
  }

  function examRate(rating) {
    document.dispatchEvent(new Event('learny:rated'));
    const item = exam.cards[exam.i];
    const ok = rating === 'easy';
    if (ok) exam.score++;
    exam.answers.push({ id: item.id, rating });
    schedule(item, rating);
    state.reviews.push({ date: today(), cardId: item.id, subject: item.subject, rating, quality: qualityOf(rating), exam: true });
    exam.i++; exam.revealed = false;
    if (exam.i >= exam.cards.length) {
      const pct = Math.round((exam.score * 100) / exam.cards.length);
      state.exams.push({ date: today(), score: exam.score, total: exam.cards.length });
      exam = null; save();
      $('#rating-row').hidden = true;
      toast(`Examen: ${pct}% (${state.exams.at(-1).score}/${state.exams.at(-1).total}).`);
      renderAll();
      return;
    }
    save(); renderExam();
  }

  function cardForm(card = null, preset = null) {
    const q0 = preset?.question || card?.question || '';
    const a0 = preset?.answer || card?.answer || '';
    modal(`<h2>${card ? 'Editar' : 'Nueva'} flashcard</h2>
      <label>Plantilla<select id="card-template"><option value="">Ninguna</option>
        <option value="definicion">Definición</option>
        <option value="ejemplo">Concepto → ejemplo</option>
        <option value="problema">Problema → solución</option></select></label>
      <label>Materia<input name="subject" required maxlength="60" value="${esc(card?.subject || $('#tutor-subject').value || '')}"></label>
      <label>Pregunta<textarea name="question" required maxlength="500">${esc(q0)}</textarea></label>
      <label>Respuesta<textarea id="card-answer" name="answer" required maxlength="1200">${esc(a0)}</textarea></label>
      <button id="generate-answer" class="outline-button" type="button">✨ Generar respuesta con IA</button>
      <button class="primary-button">${card ? 'Guardar cambios' : 'Crear tarjeta'}</button>`, (data) => {
      const values = { subject: clean(data.get('subject'), 60), question: clean(data.get('question'), 500), answer: clean(data.get('answer'), 1200) };
      if (!values.question || !values.answer) return toast('Pregunta y respuesta no pueden estar vacías.', 'error');
      if (card) Object.assign(card, values);
      else state.cards.push(normalizeCard({ ...values, nextReview: today() }));
      save(); closeModal(); renderAll(); toast(card ? 'Tarjeta actualizada.' : 'Tarjeta creada.');
    });
    $('#card-template').onchange = (e) => {
      const t = TEMPLATES[e.target.value]; if (!t) return;
      $('[name="question"]').value = t.question; $('#card-answer').value = t.answer;
    };
    $('#generate-answer').onclick = async () => {
      const question = clean($('[name="question"]').value, 500), button = $('#generate-answer');
      if (!question) return toast('Escribe primero una pregunta.', 'error');
      if (!state.apiKey) return toast('Añade tu clave de Gemini en Ajustes ⚙️ o usa una plantilla.', 'error');
      button.disabled = true; button.textContent = 'Generando…';
      try {
        const text = await askGemini(`Responde en español, máximo 3 frases, útil para flashcard. Pregunta: ${question}`);
        const out = $('#card-answer'); if (out) out.value = text;
      } catch (error) { toast(error.message, 'error'); }
      finally { if ($('#generate-answer')) { button.disabled = false; button.textContent = '✨ Generar respuesta con IA'; } }
    };
  }

  function renderLibrary() {
    const cards = state.cards.filter((c) => c.archived);
    $('#library-count').textContent = plural(cards.length, 'tarjeta', 'tarjetas');
    $('#library-list').innerHTML = cards.length ? cards.map((c) => `<article class="library-card"><b>${esc(c.question)}</b><p>${esc(c.answer)}</p><span>${esc(c.subject)}</span><div class="row-actions"><button class="text-button" data-return-card="${esc(c.id)}" type="button">Devolver a rotación</button><button class="text-button" data-edit-card="${esc(c.id)}" type="button">Editar</button><button class="text-button danger" data-delete-card="${esc(c.id)}" type="button">Eliminar</button></div></article>`).join('') : '<p class="empty">Aún no hay archivo. Envía aquí las tarjetas que ya dominas.</p>';
  }

  function deleteCard(card) {
    if (!card || !confirm('¿Eliminar esta tarjeta definitivamente? Se guardará una copia automática.')) return;
    snapshot('delete-card');
    state.cards = state.cards.filter((c) => c.id !== card.id); save(); renderAll(); toast('Tarjeta eliminada. Hay copia automática.');
  }

  /* =========================================================
     Análisis
     ========================================================= */
  function subjectStats() {
    const map = {};
    state.reviews.forEach((r) => {
      const k = r.subject || 'Sin materia';
      map[k] ||= { total: 0, easy: 0, ok: 0, again: 0, cards: new Set() };
      map[k].total++;
      if (r.rating === 'easy') map[k].easy++;
      if (r.rating !== 'again') map[k].ok++;
      else map[k].again++;
      if (r.cardId) map[k].cards.add(r.cardId);
    });
    return map;
  }

  function renderAnalysis() {
    const reviews = state.reviews;
    const easy = reviews.filter((r) => r.rating === 'easy').length;
    const correct = reviews.filter((r) => r.rating !== 'again').length;
    $('#retention-stat').textContent = reviews.length ? `${Math.round((easy * 100) / reviews.length)}%` : '0%';
    $('#accuracy-stat').textContent = reviews.length ? `${Math.round((correct * 100) / reviews.length)}%` : '0%';
    $('#reviewed-stat').textContent = reviews.length;
    $('#overdue-stat').textContent = overdueCards().length;
    $('#grace-stat').textContent = calcStreak().graceUsed ? '0' : '1';

    const days = [], names = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    for (let i = 6; i >= 0; i--) {
      const date = addDays(today(), -i);
      days.push({ date, label: names[new Date(`${date}T12:00:00`).getDay()], mins: state.sessions.filter((s) => s.date === date && !s.abandon).reduce((t, s) => t + Number(s.minutes || 0), 0) });
    }
    const max = Math.max(30, ...days.map((d) => d.mins));
    $('#focus-chart').innerHTML = days.map((d) => `<div class="bar-col" title="${d.date}: ${d.mins} min"><div class="bar-area"><div class="bar" style="height:${d.mins ? Math.max(4, (d.mins / max) * 100) : 0}%"></div></div><span>${d.label}<br>${d.mins}</span></div>`).join('');
    $('#focus-summary').textContent = `Total de la semana: ${days.reduce((t, d) => t + d.mins, 0)} min. Objetivo semanal: ${state.settings.dailyGoal * 7} bloques.`;

    const stats = subjectStats();
    const areas = Object.entries(stats).map(([name, s]) => ({ name, pct: Math.round((s.ok * 100) / s.total), again: s.again })).sort((a, b) => a.pct - b.pct);
    if (!areas.length) {
      $('#weak-topics').innerHTML = '<p class="empty">Repasa tarjetas para ver retención por materia y sugerencias concretas.</p>';
      return;
    }
    $('#weak-topics').innerHTML = areas.map((a) => {
      const weakCards = state.cards.filter((c) => c.subject === a.name && (c.history || []).some((h) => h.rating === 'again')).slice(0, 5);
      const extra = weakCards.length ? `<small>Revisa: ${weakCards.map((c) => esc(c.question.slice(0, 40))).join(' · ')}</small>` : '';
      const tip = a.pct < 60 ? `${esc(a.name)} tiene ${a.pct}% de aciertos; priorízala mañana.` : `${esc(a.name)}: ${a.pct}% de aciertos.`;
      return `<div class="weak-topic"><span>${tip}<br>${extra}</span><b>${a.pct}%</b></div>`;
    }).join('');
  }

  function weekSlice() {
    const from = addDays(today(), -6);
    return {
      from, to: today(),
      minutes: state.sessions.filter((s) => s.date >= from && !s.abandon).map((s) => ({ date: s.date, minutes: s.minutes, label: s.label, intention: s.intention })),
      reviews: state.reviews.filter((r) => r.date >= from),
      overdue: overdueCards().map((c) => ({ subject: c.subject, question: c.question, nextReview: c.nextReview })),
      retention: state.reviews.length ? Math.round((state.reviews.filter((r) => r.rating === 'easy').length * 100) / state.reviews.length) : 0
    };
  }

  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportReport() {
    modal(`<h2>Informe semanal</h2><p>Elige formato. No incluye tu clave ni datos personales extra.</p>
      <div class="actions"><button id="rep-json" class="primary-button" type="button">JSON</button>
      <button id="rep-csv" class="outline-button" type="button">CSV</button></div>`, () => closeModal());
    $('#rep-json').onclick = () => { download(`learny-semana-${today()}.json`, JSON.stringify(weekSlice(), null, 2), 'application/json'); closeModal(); toast('Informe JSON descargado.'); };
    $('#rep-csv').onclick = () => {
      const w = weekSlice();
      const rows = [['fecha', 'minutos', 'etiqueta']].concat(w.minutes.map((s) => [s.date, s.minutes, s.label]));
      download(`learny-semana-${today()}.csv`, rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
      closeModal(); toast('Informe CSV descargado.');
    };
  }

  /* =========================================================
     IA
     ========================================================= */
  function localGuide(topic, extra = '') {
    const g = LOCAL_GUIDES[Math.abs([...`${topic}${extra}`].reduce((a, c) => a + c.charCodeAt(0), 0)) % LOCAL_GUIDES.length];
    return `**Pregunta guía**\n${g.pregunta}\n\n**Pista**\n${g.pista}\n\n**Explicación**\nSobre “${topic || 'este tema'}”: di la idea central, un ejemplo propio y una duda.\n\n**Ejemplo**\nSi estudias ${topic || 'el tema'}, compara un caso típico con un caso límite.\n\n**Siguiente reto**\n${g.reto}${extra ? `\n\nTu texto: ${extra.slice(0, 180)}…` : ''}`;
  }

  function parseBlocks(text) {
    const keys = ['Pregunta guía', 'Pista', 'Explicación', 'Ejemplo', 'Siguiente reto'];
    const html = keys.map((k) => {
      const re = new RegExp(`\\*\\*${k}\\*\\*[\\s:\\-]*([\\s\\S]*?)(?=\\*\\*(?:${keys.join('|')})\\*\\*|$)`, 'i');
      const m = text.match(re);
      return m ? `<section class="tutor-block"><h3>${k}</h3><p>${fmt(m[1].trim())}</p></section>` : '';
    }).join('');
    return html || `<div class="ai-answer">${fmt(text)}</div>`;
  }

  function socraticPrompt(query) {
    const t = state.settings.tutor;
    return `Actúa como tutor socrático en español. No des la respuesta completa primero; haz una pregunta guía, pide el razonamiento y corrige errores paso a paso.
Responde EXACTAMENTE con estos bloques, cada uno con el título en negrita:
**Pregunta guía**
**Pista**
**Explicación**
**Ejemplo**
**Siguiente reto**
Contexto: materia=${t.subject || 'no indicada'}; nivel=${t.level || 'no indicado'}; ya sabe=${t.known || 'no indicado'}; quiere lograr=${t.goal || 'no indicado'}.
Estilo de explicación: ${({ 12: 'como a alguien de 12 años', uni: 'nivel universitario', carrera: `con ejemplos de ${$('#tutor-career').value || 'su carrera'}` })[$('#tutor-style').value]}.
Consulta: ${query}`;
  }

  async function askGemini(prompt) {
    if (!state.apiKey) throw new Error('Falta la clave de Gemini. Añádela en Ajustes ⚙️ o usa Guía local.');
    const text = clean(prompt, MAX_PROMPT);
    if (!text) throw new Error('El texto está vacío o es demasiado corto.');
    const model = (state.settings.model || DEFAULT_MODEL).trim();
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': state.apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text }] }] })
      });
      let data = {}; try { data = await response.json(); } catch { /* sin cuerpo */ }
      if (!response.ok) {
        const raw = data.error?.message || `Error ${response.status}`;
        if (response.status === 400 || response.status === 401 || response.status === 403) throw new Error(`La clave de Gemini no es válida o no tiene permiso. (${raw})`);
        if (response.status === 404) throw new Error(`El modelo “${model}” no existe. Cámbialo en Ajustes ⚙️. (${raw})`);
        if (response.status === 429) throw new Error('Se agotó la cuota de Gemini. Espera un rato e inténtalo de nuevo.');
        throw new Error(raw);
      }
      const out = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
      if (!out) throw new Error('Gemini no devolvió texto para esta consulta.');
      return out;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Gemini tardó demasiado. Inténtalo de nuevo.');
      if (error instanceof TypeError) throw new Error('No hay conexión. Revisa tu internet o usa Guía local.');
      throw error;
    } finally { clearTimeout(timeout); }
  }

  function chatTopic() {
    return clean(state.settings.tutor.subject || $('#ai-question').value || 'general', 60) || 'general';
  }

  function saveChat(role, text) {
    const topic = chatTopic();
    let chat = state.chats.find((c) => c.topic.toLowerCase() === topic.toLowerCase());
    if (!chat) { chat = { topic, messages: [] }; state.chats.push(chat); }
    chat.messages = [...chat.messages, { role, text, at: new Date().toISOString() }].slice(-20);
    save();
  }

  function requestKey(onKey, onLocal) {
    modal(`<h2>Conecta Gemini</h2>
      <p>Consigue una clave gratuita en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a>.</p>
      <p class="modal-tip"><b>Tu clave se guarda solo en este navegador y no debe usarse en un equipo compartido.</b> Cualquiera con DevTools podría verla. En producción usa un proxy (ver proxy-worker.example.js).</p>
      <label>API key<input name="key" type="password" autocomplete="off" required maxlength="200"></label>
      <p class="lead">La clave viaja en el encabezado x-goog-api-key, no en la URL.</p>
      <button class="primary-button">Guardar clave</button>
      <button id="use-local" class="outline-button" type="button">Continuar sin IA</button>`, (data) => {
      state.apiKey = clean(data.get('key'), 200); save(); closeModal(); onKey();
    });
    $('#use-local').onclick = () => { state.settings.skipAi = true; save(); closeModal(); onLocal(); };
  }

  async function gemini(prompt, title, fallback) {
    const showLocal = (note = '') => {
      const text = fallback?.() || localGuide(title);
      modal(`<h2>${esc(title)}</h2>${parseBlocks(text)}${note ? `<p class="modal-tip">${esc(note)}</p>` : ''}<button class="primary-button" type="button" onclick="this.closest('dialog').close()">Cerrar</button>`);
      return { text, fromAi: false };
    };
    if (!state.apiKey) {
      if (modalOpen()) { toast('Añade tu clave de Gemini en Ajustes ⚙️ o elige Guía local.', 'error'); return { text: fallback?.() || localGuide(title), fromAi: false }; }
      if (!state.settings.skipAi) return new Promise((resolve) => requestKey(async () => resolve(await gemini(prompt, title, fallback)), () => resolve(showLocal('Modo local activo.'))));
      return showLocal('Guía local. Añade tu clave en Ajustes ⚙️ para IA.');
    }
    modal(`<h2>${esc(title)}</h2><p class="lead">Pensando…</p>`);
    try {
      const text = await askGemini(prompt);
      $('#modal-body').innerHTML = `<h2>${esc(title)}</h2>${parseBlocks(text)}<button class="primary-button" type="button" onclick="this.closest('dialog').close()">Cerrar</button>`;
      return { text, fromAi: true };
    } catch (error) {
      const text = fallback?.() || localGuide(title);
      $('#modal-body').innerHTML = `<h2>Usamos la guía local</h2><p>${esc(error.message)}</p>${parseBlocks(text)}<button class="primary-button" type="button" onclick="this.closest('dialog').close()">Cerrar</button>`;
      toast(error.message, 'error');
      return { text, fromAi: false };
    }
  }

  function suggestCardsFromText(topic, text) {
    const parts = text.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 20).slice(0, 3);
    if (!parts.length) return;
    modal(`<h2>¿Guardar conceptos como tarjetas?</h2>
      <p>Detecté ${parts.length} ideas de tu explicación sobre ${esc(topic || 'el tema')}.</p>
      ${parts.map((p, i) => `<label class="check"><input type="checkbox" name="c${i}" checked> ${esc(p.slice(0, 140))}</label>`).join('')}
      <button class="primary-button">Crear seleccionadas</button>`, (data) => {
      parts.forEach((p, i) => {
        if (data.get(`c${i}`) === 'on') state.cards.push(normalizeCard({ subject: topic || 'Feynman', question: `Explica: ${p.slice(0, 80)}`, answer: p, nextReview: today() }));
      });
      save(); closeModal(); renderAll(); toast('Tarjetas sugeridas guardadas.');
    });
  }

  async function feynman() {
    const topic = clean($('#feynman-topic').value, 80), text = clean($('#feynman-text').value, 4000), guide = $('#feynman-guide');
    if (!text) return toast('Escribe tu explicación.', 'error');
    const local = localGuide(topic, text);
    guide.innerHTML = parseBlocks(local);
    if (!state.apiKey) {
      toast('Modo local: sin clave también recibes guía socrática.');
      suggestCardsFromText(topic, text);
      return;
    }
    guide.innerHTML += '<p><i>Pidiendo feedback al tutor…</i></p>';
    try {
      const answer = await askGemini(socraticPrompt(`Evalúa esta explicación sobre ${topic || 'un tema'} y guía al estudiante.\n\n${text}`));
      guide.innerHTML = parseBlocks(answer);
      saveChat('user', text); saveChat('tutor', answer);
      suggestCardsFromText(topic, text);
    } catch (error) {
      guide.innerHTML = parseBlocks(local) + `<p><i>${esc(error.message)}</i></p>`;
      toast(error.message, 'error');
    }
  }

  /* =========================================================
     Temas / ruleta
     ========================================================= */
  const worldPool = ['teoría de juegos', 'célula eucariota', 'ética de Aristóteles', 'recursión', 'teorema de Bayes', 'cambio climático', 'mercados competitivos', 'sistema inmunitario', 'poesía modernista', 'criptografía asimétrica', 'composición musical', 'derechos humanos'];
  function addTopic(name, category = 'Personal') {
    const cleanName = clean(name, 80); if (!cleanName) return false;
    if (!state.topics.some((t) => t.name.toLowerCase() === cleanName.toLowerCase())) state.topics.push({ id: uid(), name: cleanName, category });
    save(); renderTopics(); return true;
  }
  function renderTopics() {
    const query = $('#topic-search').value.trim().toLowerCase();
    const topics = state.topics.filter((t) => !query || t.name.toLowerCase().includes(query));
    $('#topic-results').innerHTML = topics.length ? topics.map((t) => `<span class="topic-wrap"><button class="topic-chip" data-topic="${esc(t.name)}" type="button">${esc(t.name)} <small>· ${esc(t.category)}</small></button><button class="chip-x" data-delete-topic="${esc(t.id)}" type="button" aria-label="Quitar ${esc(t.name)}">×</button></span>`).join('') : '<p class="empty">No hay coincidencias. Añade el tema que quieras estudiar hoy.</p>';
  }
  async function suggestTopic() {
    const subject = clean($('#topic-search').value, 80);
    const randomTopic = () => { const pick = worldPool[Math.floor(Math.random() * worldPool.length)]; addTopic(pick, 'Mundial'); toast(`Tema añadido: ${pick}`); };
    if (!subject) return randomTopic();
    if (!state.apiKey) { toast('Sin clave te sugerimos un tema al azar.'); return randomTopic(); }
    const result = await gemini(`Sugiere tres subtemas concretos y estudiables sobre: ${subject}. Una línea por subtema.`, 'Sugerencias de estudio', () => 'Añade tus propios temas con el botón “Añadir”.');
    if (!result.fromAi) return;
    result.text.split('\n').map((x) => x.replace(/^[-•*\d.)\s]+/, '').replace(/\*\*/g, '').trim()).filter(Boolean).slice(0, 3).forEach((x) => addTopic(x, subject));
    renderTopics();
  }
  function spin(topic) {
    const seen = new Set(state.settings.recentTurns || []);
    const all = topic ? [topic] : state.topics.map((t) => t.name);
    if (!all.length) return toast('Añade cualquier tema para girar la ruleta.', 'error');
    const fresh = all.filter((name) => !seen.has(name)), choices = fresh.length ? fresh : all;
    const chosen = choices[Math.floor(Math.random() * choices.length)];
    state.settings.recentTurns = [chosen, ...(state.settings.recentTurns || []).filter((x) => x !== chosen)].slice(0, 8); save();
    runRoulettePhase(chosen, 'preparación', state.settings.roulettePrepare, () => runRoulettePhase(chosen, 'explicación', state.settings.rouletteExplain, () => {
      closeModal(); showPage('practice'); $('#feynman-topic').value = chosen; $('#feynman-text').focus();
      toast('Fase terminada. Ahora explica con Feynman.'); $('#feynman-feedback').click();
    }));
  }
  function runRoulettePhase(topic, phase, minutes, next) {
    const explain = phase === 'explicación', total = num(minutes, 1, 180, 1) * 60, endAt = Date.now() + total * 1000;
    modal(`<h2>Ruleta: ${esc(topic)}</h2><p>Fase de <b>${phase}</b>. ${explain ? 'Explícalo en voz alta y deja una versión escrita si quieres revisión.' : 'Estudia y recupera ideas clave.'}</p>${explain ? '<textarea id="roulette-explanation" maxlength="4000" placeholder="Escribe aquí tu explicación…"></textarea>' : ''}<div id="roulette-timer" class="roulette-timer">${time(total)}</div><button id="finish-roulette" class="outline-button" type="button">Terminar fase</button>`);
    let finished = false;
    const done = () => {
      if (finished) return; finished = true; clearInterval(rouletteId); rouletteId = null; beep();
      const box = $('#roulette-explanation'); if (explain && box?.value.trim()) $('#feynman-text').value = box.value.trim();
      next();
    };
    clearInterval(rouletteId);
    rouletteId = setInterval(() => { const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000)), el = $('#roulette-timer'); if (el) el.textContent = time(left); if (left <= 0) done(); }, 500);
    $('#finish-roulette').onclick = done;
  }

  /* =========================================================
     Ajustes / import-export
     ========================================================= */
  function applyPreferences() {
    document.documentElement.style.setProperty('--base', `${state.settings.fontSize}px`);
    const ACC = { mint: ['#a7f3d0', '#46c793'], violet: ['#c4b5fd', '#8b5cf6'], amber: ['#fcd34d', '#f59e0b'], sky: ['#9db8ff', '#5b84ff'], rose: ['#fda4af', '#f43f5e'] }[state.settings.accent] || ['#a7f3d0', '#46c793'];
    document.documentElement.style.setProperty('--accent', ACC[0]); document.documentElement.style.setProperty('--accent2', ACC[1]);
    document.body.dataset.density = state.settings.density || 'normal';
    document.body.classList.toggle('theme-sepia', state.settings.theme === 'sepia');
    document.body.classList.toggle('theme-contrast', state.settings.theme === 'contrast');
    document.body.classList.toggle('font-dyslexic', state.settings.font === 'dyslexic');
    document.body.classList.toggle('reduce-motion', !!state.settings.reduceMotion);
    $('#daily-goal-input').value = state.settings.dailyGoal || 2;
    const t = state.settings.tutor;
    $('#tutor-subject').value = t.subject; $('#tutor-level').value = t.level; $('#tutor-known').value = t.known; $('#tutor-goal').value = t.goal;
  }

  function isLearnyBackup(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    return ['cards', 'sessions', 'deadlines', 'reviews', 'topics', 'settings', 'tasks'].some((k) => k in data);
  }

  function exportData() {
    const { apiKey, ...safe } = state;
    download(`learny-copia-${today()}.json`, JSON.stringify(safe, null, 2), 'application/json');
    toast('Copia descargada (sin clave API).');
  }

  function exportDeck() {
    const deck = state.cards.filter((c) => !c.archived).map(({ subject, question, answer }) => ({ subject, question, answer }));
    if (!deck.length) return toast('No hay tarjetas para compartir.', 'error');
    download(`learny-mazo-${today()}.json`, JSON.stringify({ type: 'learny-deck', cards: deck }, null, 2), 'application/json');
    toast('Mazo exportado sin progreso personal.');
  }

  function importData(file) {
    file.text().then((text) => {
      const data = JSON.parse(text);
      if (!isLearnyBackup(data) && data.type !== 'learny-deck') throw new Error('formato');
      if (!confirm('Esto puede reemplazar o añadir datos. Se guardará una copia automática. ¿Continuar?')) return;
      snapshot('import');
      if (data.type === 'learny-deck' && Array.isArray(data.cards)) {
        data.cards.forEach((c) => { if (c.question && c.answer) state.cards.push(normalizeCard({ ...c, nextReview: today() })); });
      } else hydrate({ ...data, apiKey: state.apiKey });
      state.deadlines.forEach((d) => { if (!state.tasks.some((t) => t.deadlineId === d.id)) rebuildTasks(d, false); });
      save(); closeModal(); applyPreferences(); resetTimer('focus'); renderAll(); toast('Datos importados. Había copia de seguridad automática.');
    }).catch(() => toast('Ese archivo no es una copia válida de Learny.', 'error'));
  }

  function parseCsv(text) {
    return text.split(/\r?\n/).map((line) => {
      const cols = []; let cur = '', q = false;
      for (const ch of line) {
        if (ch === '"') { q = !q; continue; }
        if (ch === ',' && !q) { cols.push(cur.trim()); cur = ''; continue; }
        cur += ch;
      }
      cols.push(cur.trim());
      return cols;
    }).filter((r) => r.some(Boolean));
  }

  function importCsv(file) {
    file.text().then((text) => {
      const rows = parseCsv(text);
      if (rows.length < 1) throw new Error('vacío');
      snapshot('import-csv');
      const header = rows[0].map((h) => h.toLowerCase());
      const hasHeader = header.some((h) => /pregunta|question|front|anverso/.test(h));
      const body = hasHeader ? rows.slice(1) : rows;
      let n = 0;
      body.forEach((r) => {
        const question = r[0], answer = r[1], subject = r[2] || 'Importado';
        if (question && answer) { state.cards.push(normalizeCard({ question, answer, subject, nextReview: today() })); n++; }
      });
      save(); closeModal(); renderAll(); toast(`Importadas ${plural(n, 'tarjeta', 'tarjetas')} desde CSV.`);
    }).catch(() => toast('CSV no válido. Usa pregunta,respuesta,materia', 'error'));
  }

  function openSettings() {
    modal(`<h2>Ajustes</h2>
      <label>Tema<select name="theme"><option value="dark">Oscuro</option><option value="sepia">Sepia</option><option value="contrast">Alto contraste</option></select></label>
      <label>Fuente<select name="font"><option value="sans">Sans-serif legible</option><option value="dyslexic">Lectura fácil</option></select></label>
      <div class="form-row"><label>Color de acento<select name="accent"><option value="mint">Menta</option><option value="violet">Violeta</option><option value="amber">Ámbar</option><option value="sky">Cielo</option><option value="rose">Rosa</option></select></label>
      <label>Densidad<select name="density"><option value="normal">Normal</option><option value="compact">Compacta</option><option value="roomy">Amplia</option></select></label></div>
      <label class="check"><input name="reduce" type="checkbox"> Reducir animaciones</label>
      <label class="check"><input name="sound" type="checkbox"> Sonido al terminar</label>
      <label class="check"><input name="notify" type="checkbox"> Recordatorios locales (repasos y exámenes)</label>
      <div class="form-row"><label>Pomodoro (min)<input name="focus" type="number" min="1" max="180" value="${state.settings.focus}"></label>
      <label>Descanso (min)<input name="rest" type="number" min="1" max="60" value="${state.settings.rest}"></label>
      <label>Ruleta: preparación<input name="prepare" type="number" min="1" max="180" value="${state.settings.roulettePrepare}"></label>
      <label>Ruleta: explicación<input name="explain" type="number" min="1" max="180" value="${state.settings.rouletteExplain}"></label></div>
      <label>Clave de Gemini (opcional)<input name="apikey" type="password" autocomplete="off" maxlength="200" placeholder="${state.apiKey ? 'Clave guardada (vacío = conservar)' : 'Pega aquí tu clave'}"></label>
      <p class="modal-tip">Tu clave se guarda solo en este navegador y no debe usarse en un equipo compartido. Va en el encabezado x-goog-api-key, no en la URL.</p>
      <label>Modelo de Gemini<input name="model" value="${esc(state.settings.model)}"></label>
      <div class="actions">
        <button id="export-data" class="outline-button" type="button">Descargar copia</button>
        <button id="export-deck" class="outline-button" type="button">Compartir mazo</button>
        <label class="outline-button" style="cursor:pointer">Importar JSON<input id="import-file" type="file" accept="application/json,.json" hidden></label>
        <label class="outline-button" style="cursor:pointer">Importar CSV/Anki<input id="import-csv" type="file" accept=".csv,text/csv" hidden></label>
        <button id="reset-data" class="outline-button" type="button">Borrar todo</button>
      </div>
      <p class="modal-tip">Comentarios: <a href="mailto:learnyxsv@gmail.com">learnyxsv@gmail.com</a></p>
      <button class="primary-button">Guardar preferencias</button>`, (data) => {
      Object.assign(state.settings, {
        theme: data.get('theme'), accent: data.get('accent'), density: data.get('density'), font: data.get('font'), reduceMotion: data.get('reduce') === 'on',
        sound: data.get('sound') === 'on', notify: data.get('notify') === 'on',
        focus: num(data.get('focus'), 1, 180, 25), rest: num(data.get('rest'), 1, 60, 5),
        roulettePrepare: num(data.get('prepare'), 1, 180, 10), rouletteExplain: num(data.get('explain'), 1, 180, 1),
        model: clean(data.get('model'), 80) || DEFAULT_MODEL
      });
      const key = clean(data.get('apikey'), 200); if (key) { state.apiKey = key; state.settings.skipAi = false; }
      if (state.settings.notify && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();
      save(); applyPreferences(); closeModal(); if (!timer.running) resetTimer(timer.mode); renderAll(); toast('Preferencias guardadas.');
    });
    const form = $('#modal-form');
    form.theme.value = state.settings.theme; form.accent.value = state.settings.accent; form.density.value = state.settings.density; form.font.value = state.settings.font;
    form.reduce.checked = !!state.settings.reduceMotion;
    form.sound.checked = state.settings.sound !== false;
    form.notify.checked = !!state.settings.notify;
    $('#export-data').onclick = exportData;
    $('#export-deck').onclick = exportDeck;
    $('#import-file').onchange = (e) => { if (e.target.files[0]) importData(e.target.files[0]); };
    $('#import-csv').onchange = (e) => { if (e.target.files[0]) importCsv(e.target.files[0]); };
    $('#reset-data').onclick = () => {
      if (!confirm('Se borrarán tarjetas, sesiones y fechas. Se guardará una copia automática. ¿Seguro?')) return;
      snapshot('reset');
      try { localStorage.removeItem(KEY); LEGACY_KEYS.forEach((k) => localStorage.removeItem(k)); } catch { /* ignorar */ }
      hydrate({}); closeModal(); applyPreferences(); resetTimer('focus'); renderAll(); toast('Datos borrados. Puedes restaurar desde learny.backup si hace falta.');
    };
  }

  function changeFont(delta) { state.settings.fontSize = Math.min(21, Math.max(14, state.settings.fontSize + delta)); save(); applyPreferences(); }

  function maybeRemind() {
    const due = dueCards().length;
    const soon = state.deadlines.filter((d) => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 3);
    if (due) notify('Learny', `Tienes ${plural(due, 'tarjeta', 'tarjetas')} para hoy.`);
    soon.forEach((d) => notify('Learny', `Examen: ${d.title} en ${plural(daysUntil(d.date), 'día', 'días')}.`));
  }

  function fillTutor(silent = false) {
    state.settings.tutor = {
      subject: clean($('#tutor-subject').value, 60),
      level: clean($('#tutor-level').value, 40),
      known: clean($('#tutor-known').value, 400),
      goal: clean($('#tutor-goal').value, 200)
    };
    save();
    if (!silent) toast('Contexto del tutor guardado.');
  }

  /* =========================================================
     Eventos
     ========================================================= */
  const renderAll = () => {
    subjects(); renderFocus(); renderDeadlines(); renderCard(); renderAnalysis(); renderLibrary(); renderTopics(); renderTodayQueue();
    document.dispatchEvent(new Event('learny:render'));
  };

  $$('.nav-button').forEach((b) => { b.onclick = () => showPage(b.dataset.page); });
  $('#pomodoro-button').onclick = startPomodoro;
  $('#pomodoro-skip').onclick = () => resetTimer('focus');
  $('#pomodoro-reset').onclick = () => {
    if (timer.started && timer.mode === 'focus' && timer.remaining < timer.total) askAbandon(() => resetTimer('focus'));
    else resetTimer('focus');
  };
  $('#pomodoro-config').onclick = configurePomodoro;
  $('#daily-goal-input').onchange = () => { state.settings.dailyGoal = num($('#daily-goal-input').value, 1, 12, 2); save(); renderTimer(); };
  $('#add-deadline').onclick = addDeadline;
  $('#add-card').onclick = () => cardForm();
  $('#exam-mode').onclick = () => startExam();
  $('#reveal-card').onclick = revealCard;
  $$('#rating-row button').forEach((b) => { b.onclick = () => rateCard(b.dataset.rating); });
  $('#card-snooze').onclick = snoozeCard;
  $('#card-edit').onclick = () => activeCard && cardForm(activeCard);
  $('#card-delete').onclick = () => deleteCard(activeCard);
  $('#card-archive').onclick = () => { if (!activeCard) return; activeCard.archived = true; save(); renderAll(); toast('Tarjeta enviada a la Biblioteca.'); };
  $('#feynman-feedback').onclick = feynman;
  $('#spin-roulette').onclick = () => spin();
  $('#settings-button').onclick = openSettings;
  $('#font-up').onclick = () => changeFont(1);
  $('#font-down').onclick = () => changeFont(-1);
  $('#export-report').onclick = exportReport;
  $('#save-tutor-context').onclick = () => fillTutor(false);
  $('#clear-tutor-history').onclick = () => {
    const topic = chatTopic();
    state.chats = state.chats.filter((c) => c.topic.toLowerCase() !== topic.toLowerCase());
    save(); toast(`Historial de “${topic}” borrado.`);
  };
  $('#topic-search').oninput = renderTopics;
  $('#topic-search').onkeydown = (e) => { if (e.key === 'Enter') $('#add-topic').click(); };
  $('#add-topic').onclick = () => { if (addTopic($('#topic-search').value)) { $('#topic-search').value = ''; renderTopics(); toast('Tema añadido a tu ruleta.'); } else toast('Escribe cualquier tema primero.', 'error'); };
  $('#suggest-topic').onclick = suggestTopic;
  $('#topic-results').onclick = (e) => {
    const del = e.target.closest('[data-delete-topic]'); if (del) { state.topics = state.topics.filter((t) => t.id !== del.dataset.deleteTopic); save(); renderTopics(); return; }
    const chip = e.target.closest('[data-topic]'); if (chip) spin(chip.dataset.topic);
  };
  $('#library-list').onclick = (e) => {
    const find = (attr) => state.cards.find((c) => c.id === e.target.dataset[attr]);
    const back = find('returnCard'); if (back) { back.archived = false; back.nextReview = today(); save(); renderAll(); toast('Tarjeta devuelta a la rotación.'); return; }
    const edit = find('editCard'); if (edit) { cardForm(edit); return; }
    const del = find('deleteCard'); if (del) deleteCard(del);
  };
  $('#deadline-list').onclick = (e) => {
    const id = e.target.dataset.deleteDeadline;
    if (id) {
      snapshot('delete-deadline');
      state.deadlines = state.deadlines.filter((d) => d.id !== id);
      state.tasks = state.tasks.filter((t) => t.deadlineId !== id);
      save(); renderDeadlines(); toast('Fecha eliminada.');
    }
  };
  $('#today-tasks').onchange = (e) => {
    const id = e.target.dataset.task; if (!id) return;
    const task = state.tasks.find((t) => t.id === id); if (!task) return;
    task.done = e.target.checked;
    save(); renderDeadlines(); toast(task.done ? 'Tarea completada. El plan se actualiza.' : 'Tarea reabierta.');
  };

  $('#search-engine').value = state.settings.engine;
  $('#search-engine').onchange = (e) => { state.settings.engine = e.target.value; save(); };
  $('#ask-ai').onclick = async () => {
    const query = clean($('#ai-question').value, 800), engine = $('#search-engine').value;
    if (!query) return toast('Escribe una consulta.', 'error');
    fillTutor(true);
    if (engine === 'local') {
      const text = localGuide(query);
      modal(`<h2>Guía local</h2>${parseBlocks(text)}<button class="primary-button" type="button" onclick="this.closest('dialog').close()">Cerrar</button>`);
      saveChat('user', query); saveChat('tutor', text);
      return;
    }
    if (engine === 'gemini') {
      const result = await gemini(socraticPrompt(query), 'Tutor Learny', () => localGuide(query));
      saveChat('user', query); saveChat('tutor', result.text);
      return;
    }
    const urls = { google: `https://www.google.com/search?q=${encodeURIComponent(query)}`, wikipedia: `https://es.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`, perplexity: `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}` };
    window.open(urls[engine], '_blank', 'noopener');
  };
  $('#ai-question').onkeydown = (e) => { if (e.key === 'Enter') $('#ask-ai').click(); };

  document.addEventListener('keydown', (e) => {
    if (e.target !== document.body || modalOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.toLowerCase() === 'p') { e.preventDefault(); startPomodoro(); return; }
    if (!activeCard && !exam) return;
    if (e.key === ' ' && !(exam ? exam.revealed : revealed)) { e.preventDefault(); revealCard(); return; }
    const map = { 1: 'again', 2: 'hard', 3: 'easy' };
    const open = exam ? exam.revealed : (revealed && !answered);
    if (open && map[e.key]) rateCard(map[e.key]);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* sin PWA si se abre como archivo */ });
  }

  window.Learny = { state, save, toast, modal, closeModal, today, addDays, uid, clean, esc, fmt, plural, daysUntil, dueCards, startExam, cardForm, normalizeCard, suggestCards: suggestCardsFromText, askGemini, gemini, rebuildTasks, addDeadline, renderAll };
  applyPreferences(); resetTimer('focus'); renderAll(); maybeRemind();
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ok */ }
})();
