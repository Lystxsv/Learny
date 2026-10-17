(() => {
  'use strict';

  const KEY = 'learny.v3';
  const LEGACY_KEYS = ['learny.v2', 'learny.v1'];
  const BACKUP_KEY = 'learny.backup';
  const DEFAULT_MODEL = 'gemini-flash-latest';
  const MAX_PROMPT = 9000;
  const MAX_INTERVAL = 180;
  const MAX_PLAN_DAYS = 730;
  const SCHEMA = 4;
  const TIMER_KEY = 'learny.timer';
  const MAX_REVIEWS = 5000;
  const MAX_CHATS = 20;
  const MIN_SAMPLE = 5; // con menos repasos no se afirma nada sobre una materia
  let rev = 0, currentPage = 'study', loadProblem = false, droppedCards = 0, migratedFrom = 0;
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
  const validDeadlineDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d)) && daysUntil(d) >= 0 && daysUntil(d) <= MAX_PLAN_DAYS;
  const addDays = (date, n) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + n); return dateStr(d); };
  const daysUntil = (date) => Math.round((new Date(`${date}T12:00:00`) - new Date(`${today()}T12:00:00`)) / 86400000);
  const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const fmt = (v) => esc(v).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  const num = (v, min, max, def) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
  const time = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const clean = (v, max = MAX_PROMPT) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
  const cleanMl = (v, max) => String(v || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
  const parseJSON = (raw) => { try { return JSON.parse(raw || 'null'); } catch { return null; } };
  const qualityOf = (rating) => ({ again: 1, hard: 3, easy: 5 }[rating] ?? 3);

  const debounce = (fn, ms = 150) => { let id; return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); }; };
  function validProxy(u) {
    const v = String(u || '').trim().slice(0, 200);
    return /^https:\/\/[^\s]+$/i.test(v) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/[^\s]*)?$/i.test(v) ? v : '';
  }
  const memo = {};
  const cached = (k, fn) => { const key = `${rev}|${today()}`; if (memo[k]?.key !== key) memo[k] = { key, v: fn() }; return memo[k].v; };

  const defaults = () => ({
    version: SCHEMA,
    settings: {
      focus: 25, rest: 5, roulettePrepare: 10, rouletteExplain: 1, fontSize: 16, font: 'sans',
      theme: 'dark', accent: 'sky', density: 'normal', reduceMotion: false, engine: 'gemini', model: DEFAULT_MODEL, skipAi: false,
      recentTurns: [], statsPeriod: '30', dailyGoal: 2, notify: false, sound: true, name: '', proxyUrl: '', lastExport: '', backupNag: '',
      tutor: { subject: '', level: '', known: '', goal: '', style: 'uni', career: '', mode: 'socratic' }, lastRemind: ''
    },
    notes: [], feynman: [], decks: [], sessions: [], cards: [], deadlines: [], reviews: [], topics: [], tasks: [], chats: [], exams: [], apiKey: '', drafts: {}
  });
  const state = defaults();
  let exam = null;

  const isBrokenCard = (c) => typeof c.question !== 'string' || !c.question.trim() || typeof c.answer !== 'string' || !c.answer.trim();
  const normalizeCard = (c) => ({
    id: c.id || uid(),
    corrupt: isBrokenCard(c),
    subject: String(c.subject || 'Sin materia'),
    question: String(c.question || ''),
    answer: String(c.answer || ''),
    nextReview: /^\d{4}-\d{2}-\d{2}$/.test(c.nextReview) ? c.nextReview : today(),
    lastReviewed: /^\d{4}-\d{2}-\d{2}$/.test(c.lastReviewed) ? c.lastReviewed : null,
    archived: !!c.archived,
    origin: c.origin === 'ia' ? 'ia' : '',
    easeFactor: Number(c.easeFactor ?? c.ease) || 2.5,
    interval: Number(c.interval) || 0,
    repetitions: Number(c.repetitions ?? c.reps) || 0,
    history: Array.isArray(c.history) ? c.history.slice(-40) : []
  });

  /* Migraciones: cada función recibe los datos de la versión N y devuelve los de N+1. */
  const arr = (v) => (Array.isArray(v) ? v : []);
  const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
  const MIGRATIONS = {
    1(d) { // v1 → v2: nombres de campo antiguos
      arr(d.cards).filter(isObj).forEach((c) => {
        if (c.easeFactor == null && c.ease != null) c.easeFactor = c.ease;
        if (c.repetitions == null && c.reps != null) c.repetitions = c.reps;
        delete c.ease; delete c.reps;
      });
      arr(d.sessions).filter(isObj).forEach((s) => { if (s.label == null && s.subject != null) s.label = s.subject; });
      return d;
    },
    2(d) { // v2 → v3: ids estables, tutor y valores por defecto de las fechas
      ['cards', 'sessions', 'deadlines', 'topics', 'tasks'].forEach((k) => arr(d[k]).filter(isObj).forEach((x) => { if (!x.id) x.id = uid(); }));
      arr(d.deadlines).filter(isObj).forEach((x) => { x.difficulty = num(x.difficulty, 1, 5, 3); x.dailyMinutes = num(x.dailyMinutes, 15, 240, 45); });
      d.settings = { ...(isObj(d.settings) ? d.settings : {}) };
      d.settings.tutor = { ...(isObj(d.settings.tutor) ? d.settings.tutor : {}) };
      return d;
    },
    3(d) { // v3 → v4: ids únicos, tareas huérfanas, prefijos repetidos, borradores
      const seen = new Set();
      ['cards', 'sessions', 'deadlines', 'topics', 'tasks'].forEach((k) => arr(d[k]).filter(isObj).forEach((x) => {
        if (!x.id || seen.has(x.id)) x.id = uid();
        seen.add(x.id);
      }));
      const alive = new Set(arr(d.deadlines).filter(isObj).map((x) => x.id));
      d.tasks = arr(d.tasks).filter((t) => isObj(t) && alive.has(t.deadlineId));
      d.tasks.forEach((t) => { t.title = String(t.title || '').replace(/^(Recuperar:\s*)+/, 'Recuperar: '); });
      if (!isObj(d.drafts)) d.drafts = {};
      return d;
    }
  };
  function migrate(src) {
    let d = JSON.parse(JSON.stringify(src)), v = Number(d.version);
    if (!Number.isInteger(v) || v < 1) v = 1;
    const from = v;
    while (v < SCHEMA) { d = MIGRATIONS[v](d); v++; d.version = v; }
    if (Object.keys(src).length && from < SCHEMA) migratedFrom = from;
    return d;
  }

  /* Los ajustes importados no son de fiar: se fuerzan tipos, rangos y valores permitidos. */
  function sanitizeSettings(s, d) {
    s.focus = num(s.focus, 1, 180, d.focus); s.rest = num(s.rest, 1, 60, d.rest);
    s.roulettePrepare = num(s.roulettePrepare, 1, 180, d.roulettePrepare); s.rouletteExplain = num(s.rouletteExplain, 1, 180, d.rouletteExplain);
    s.fontSize = num(s.fontSize, 14, 21, d.fontSize); s.dailyGoal = num(s.dailyGoal, 1, 12, d.dailyGoal);
    const pick = (v, list, def) => (list.includes(v) ? v : def);
    s.theme = pick(s.theme, ['dark', 'sepia', 'contrast'], 'dark'); s.font = pick(s.font, ['sans', 'dyslexic'], 'sans');
    s.accent = pick(s.accent, ['mint', 'violet', 'amber', 'sky', 'rose'], 'sky'); s.density = pick(s.density, ['normal', 'compact', 'roomy'], 'normal');
    s.statsPeriod = pick(s.statsPeriod, ['7', '30', 'all'], '30');
    s.engine = pick(s.engine, ['gemini', 'local', 'google', 'wikipedia', 'perplexity'], 'gemini');
    ['reduceMotion', 'notify', 'sound', 'skipAi'].forEach((k) => { s[k] = typeof s[k] === 'boolean' ? s[k] : d[k]; });
    ['name', 'model', 'lastExport', 'backupNag', 'lastRemind'].forEach((k) => { s[k] = typeof s[k] === 'string' ? s[k].slice(0, 100) : d[k]; });
    s.name = s.name.slice(0, 30); s.model = s.model.trim() || DEFAULT_MODEL;
    s.recentTurns = arr(s.recentTurns).filter((x) => typeof x === 'string').slice(0, 8);
    const t = isObj(s.tutor) ? s.tutor : {};
    s.tutor = { subject: String(t.subject || '').slice(0, 60), level: String(t.level || '').slice(0, 40), known: String(t.known || '').slice(0, 400), goal: String(t.goal || '').slice(0, 200),
      style: ['12', 'uni', 'carrera'].includes(t.style) ? t.style : 'uni', career: String(t.career || '').slice(0, 60), mode: t.mode === 'direct' ? 'direct' : 'socratic' };
  }

  function hydrate(raw) {
    const base = defaults();
    const src = migrate(raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {});
    Object.assign(state, base, src);
    state.version = SCHEMA; // migración: copias <4 no necesitan transformación, solo ganan campos nuevos
    rev++;
    state.settings = { ...base.settings, ...(src.settings || {}) };
    state.settings.tutor = { ...base.settings.tutor, ...(src.settings?.tutor || {}) };
    state.apiKey = typeof state.apiKey === 'string' ? state.apiKey : '';
    state.settings.proxyUrl = validProxy(state.settings.proxyUrl);
    sanitizeSettings(state.settings, base.settings);
    if (!state.drafts || typeof state.drafts !== 'object' || Array.isArray(state.drafts)) state.drafts = {};
    ['sessions', 'cards', 'deadlines', 'reviews', 'topics', 'tasks', 'chats', 'exams', 'notes', 'feynman', 'decks'].forEach((k) => {
      if (!Array.isArray(state[k])) state[k] = [];
    });
    if (!Array.isArray(state.settings.recentTurns)) state.settings.recentTurns = [];
    const rawCards = state.cards;
    state.cards = rawCards.filter((c) => c && typeof c === 'object' && !Array.isArray(c)).map(normalizeCard);
    droppedCards += rawCards.length - state.cards.length;
    state.sessions = state.sessions.filter((s) => s && /^\d{4}-\d{2}-\d{2}$/.test(s.date)).map((s) => ({
      ...s, id: s.id || uid(), minutes: Number(s.minutes) || 0, energy: s.energy ? Number(s.energy) : null,
      label: String(s.label || s.subject || ''), achieved: typeof s.achieved === 'boolean' ? s.achieved : null,
      abandon: s.abandon || null, intention: String(s.intention || '')
    }));
    state.deadlines = state.deadlines.filter((d) => d && d.title && /^\d{4}-\d{2}-\d{2}$/.test(d.date)).map((d) => ({
      id: d.id || uid(), title: String(d.title), subject: String(d.subject || ''), date: d.date,
      difficulty: num(d.difficulty, 1, 5, 3), dailyMinutes: num(d.dailyMinutes, 15, 240, 45)
    }));
    state.decks = state.decks.filter((d) => d && typeof d.name === 'string' && Array.isArray(d.cards));
    state.topics = state.topics.filter((t) => t && t.name).map((t) => ({ id: t.id || uid(), name: String(t.name), category: String(t.category || 'Personal') }));
    state.reviews = state.reviews.filter((r) => r && r.date).slice(-MAX_REVIEWS);
    state.tasks = state.tasks.filter((t) => t && t.deadlineId && t.date).map((t) => ({
      id: t.id || uid(), deadlineId: t.deadlineId, date: t.date, phase: t.phase || 'comprension',
      title: String(t.title || ''), done: !!t.done, cardTarget: Number(t.cardTarget) || 0
    }));
    state.chats = state.chats.filter((c) => c && c.topic).slice(-MAX_CHATS).map((c) => ({
      topic: String(c.topic).slice(0, 60), messages: Array.isArray(c.messages) ? c.messages.slice(-20) : []
    }));
  }

  function snapshot(reason) {
    try {
      const { apiKey, chats, ...safe } = state;
      localStorage.setItem(BACKUP_KEY, JSON.stringify({ at: new Date().toISOString(), reason, data: safe }));
    } catch { /* sin copia */ }
  }

  (function load() {
    let merged = {};
    try {
      LEGACY_KEYS.slice().reverse().forEach((k) => { const p = parseJSON(localStorage.getItem(k)); if (p && typeof p === 'object') merged = { ...merged, ...p, settings: { ...(merged.settings || {}), ...(p.settings || {}) } }; });
      const rawCurrent = localStorage.getItem(KEY), current = parseJSON(rawCurrent);
      if (rawCurrent && !current) { loadProblem = true; try { localStorage.setItem('learny.corrupt', rawCurrent); } catch { /* sin espacio */ } }
      if (current && typeof current === 'object') merged = { ...merged, ...current, settings: { ...(merged.settings || {}), ...(current.settings || {}) } };
    } catch { /* estado nuevo */ }
    if (Object.keys(merged).length && !(Number(merged.version) >= SCHEMA)) {
      try { const { apiKey, chats, ...safe } = merged; localStorage.setItem(BACKUP_KEY, JSON.stringify({ at: new Date().toISOString(), reason: `migración desde v${Number(merged.version) || 1}`, data: safe })); } catch { /* sin copia */ }
    }
    hydrate(merged);
  })();

  function confirmDialog({ title = '¿Seguro?', message = '', ok = 'Confirmar', danger = false } = {}) {
    return new Promise((resolve) => {
      const d = $('#confirm-modal'), okBtn = $('#confirm-ok');
      $('#confirm-title').textContent = title; $('#confirm-message').textContent = message;
      okBtn.textContent = ok; okBtn.className = danger ? 'danger-button' : 'primary-button';
      d.returnValue = 'cancel';
      d.addEventListener('close', () => resolve(d.returnValue === 'ok'), { once: true });
      d.showModal(); (danger ? $('#confirm-cancel') : okBtn).focus();
    });
  }

  function setSaved(ok) {
    const el = $('#save-status'); if (!el) return;
    el.textContent = ok ? `Guardado ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}` : 'No guardado';
    el.classList.toggle('bad', !ok);
  }
  const save = () => {
    rev++;
    if (state.reviews.length > MAX_REVIEWS + 200) state.reviews.splice(0, state.reviews.length - MAX_REVIEWS);
    try { localStorage.setItem(KEY, JSON.stringify(state)); setSaved(true); return true; }
    catch { setSaved(false); toast('No se pudo guardar: el navegador bloqueó el almacenamiento o está lleno. Descarga una copia en Ajustes ⚙️.', 'error'); return false; }
  };

  const announce = (msg) => { const el = $('#sr-live'); if (!el) return; el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 30); };
  const failedRenders = new Set();
  function safe(fn, name) {
    try { return fn(); } catch (error) {
      console.error(`Learny · ${name}`, error);
      if (!failedRenders.has(name)) { failedRenders.add(name); toast(`No se pudo mostrar «${name}». El resto de Learny sigue funcionando.`, 'error'); }
    }
  }

  /* Deshacer de un nivel: cada acción reversible ofrece «Deshacer» ~8 s (botón o tecla Z). Una acción nueva sustituye a la anterior. */
  let undoRun = null;
  function toast(message, type = 'ok', action = null) {
    const el = $('#toast');
    el.textContent = message;
    undoRun = action ? action.run : null;
    if (action) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'toast-action'; b.textContent = action.label;
      b.onclick = action.run; el.append(' ', b);
    }
    el.className = `toast show ${type}`;
    clearTimeout(toast.id);
    toast.id = setTimeout(() => { el.classList.remove('show'); undoRun = null; }, action ? 8000 : 4200);
  }
  function offerUndo(message, restore) {
    const run = () => {
      if (undoRun !== run) return; // ya caducó o la sustituyó otra acción
      undoRun = null; lastRateAt = 0; restore(); toast('Acción deshecha.');
    };
    toast(message, 'ok', { label: 'Deshacer', run });
  }
  const cardSnap = (c) => ({ nextReview: c.nextReview, lastReviewed: c.lastReviewed, easeFactor: c.easeFactor, interval: c.interval, repetitions: c.repetitions, history: [...(c.history || [])] });
  const dropReview = (rv) => { const i = state.reviews.lastIndexOf(rv); if (i >= 0) state.reviews.splice(i, 1); };

  function showPage(page) {
    const changed = page !== currentPage;
    currentPage = page;
    $$('.nav-button[data-page]').forEach((b) => {
      const on = b.dataset.page === page;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $$('.page').forEach((p) => p.classList.toggle('active', p.id === page));
    if (changed) { window.scrollTo(0, 0); $(`#${page} h1`)?.focus({ preventScroll: true }); }
    renderPage(page);
    renderTimer();
    document.dispatchEvent(new Event('learny:page'));
  }

  let modalCloseHandler = null, rouletteId = null;
  const modalOpen = () => $('#app-modal').open;
  const closeModal = () => { if (modalOpen()) $('#app-modal').close(); };
  function modal(html, onSubmit, onClose) {
    const dialog = $('#app-modal'), form = $('#modal-form');
    $('#modal-body').innerHTML = html;
    $('#modal-body').removeAttribute('aria-live');
    modalCloseHandler = onClose || null;
    form.onsubmit = (event) => { event.preventDefault(); onSubmit ? onSubmit(new FormData(form)) : closeModal(); };
    if (!dialog.open) dialog.showModal();
  }
  $('#app-modal').addEventListener('close', () => {
    if (modalOpen()) return; // se reabrió antes de que llegara el evento: no cancelar la IA ni ejecutar el onClose de la ventana nueva
    clearInterval(rouletteId); rouletteId = null; cancelAi();
    const handler = modalCloseHandler; modalCloseHandler = null; handler?.();
  });
  $('.modal-close').onclick = closeModal;
  $('#app-modal').addEventListener('click', (e) => { if (e.target.closest('[data-close-modal]')) closeModal(); });

  function beep() {
    try {
      if (state.settings.sound !== false) {
        const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
        const ctx = new Ctx(), osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(); osc.stop(ctx.currentTime + 0.8); setTimeout(() => ctx.close?.(), 1200);
      }
      navigator.vibrate?.(200);
    } catch { /* sin sonido */ }
  }

  function notify(title, body) {
    if (!state.settings.notify || typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    try { new Notification(title, { body, silent: false }); }
    catch { // Chrome para Android solo admite avisos desde el service worker
      try { navigator.serviceWorker?.ready.then((r) => r.showNotification(title, { body, icon: 'icon-192.png' })).catch(() => {}); } catch { /* ignorar */ }
    }
  }

  function subjects() {
    const set = new Set(state.cards.map((c) => c.subject).concat(state.deadlines.map((d) => d.subject)).filter(Boolean));
    $('#subject-list').innerHTML = [...set].map((s) => `<option value="${esc(s)}">`).join('');
    return [...set];
  }

  const dueCards = () => cached('due', () => state.cards.filter((c) => !c.archived && c.nextReview <= today()).sort((a, b) => a.nextReview.localeCompare(b.nextReview) || a.easeFactor - b.easeFactor));
  const overdueCards = () => cached('overdue', () => state.cards.filter((c) => !c.archived && c.nextReview < today()));

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

  function redistributeIfBehind() {
    let moved = 0;
    state.deadlines.forEach((d) => {
      if (daysUntil(d.date) < 0) return;
      const late = state.tasks.filter((t) => t.deadlineId === d.id && !t.done && t.date < today()).sort((a, b) => b.date.localeCompare(a.date));
      if (!late.length) return;
      const keep = late.slice(0, 2), drop = new Set(late.slice(2).map((t) => t.id));
      keep.forEach((t) => { t.date = today(); if (!t.title.startsWith('Recuperar:')) t.title = `Recuperar: ${t.title}`; });
      if (drop.size) state.tasks = state.tasks.filter((t) => !drop.has(t.id));
      moved += late.length;
    });
    if (moved) { save(); toast('Moví tus tareas atrasadas a hoy (máximo 2 por examen) para que el plan siga siendo realista.'); }
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
      <label>Fecha<input name="date" type="date" min="${today()}" max="${addDays(today(), MAX_PLAN_DAYS)}" required></label>
      <div class="form-row"><label>Dificultad (1-5)<input name="difficulty" type="number" min="1" max="5" value="3" required></label>
      <label>Minutos diarios<input name="mins" type="number" min="15" max="240" value="45" required></label></div>
      <button class="primary-button">Guardar y crear plan</button>`, (data) => {
      const item = {
        id: uid(), title: clean(data.get('title'), 80), subject: clean(data.get('subject'), 60),
        date: data.get('date'), difficulty: num(data.get('difficulty'), 1, 5, 3), dailyMinutes: num(data.get('mins'), 15, 240, 45)
      };
      if (!validDeadlineDate(item.date)) return toast('Elige una fecha entre hoy y los próximos 2 años.', 'error');
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
    timer.total = timer.remaining = phaseSeconds(mode); renderTimer(); persistTimer();
  }

  function persistTimer() {
    try {
      if (!timer.started) { localStorage.removeItem(TIMER_KEY); return; }
      localStorage.setItem(TIMER_KEY, JSON.stringify({ mode: timer.mode, running: timer.running, endAt: timer.endAt, remaining: timer.remaining, total: timer.total, intention: timer.intention, label: timer.label }));
    } catch { /* sin persistencia */ }
  }

  function restoreTimer(raw) {
    const t = parseJSON(raw);
    if (!t || !['focus', 'rest'].includes(t.mode)) return;
    const total = num(t.total, 1, 10800, 0); if (!total) return;
    Object.assign(timer, { mode: t.mode, total, intention: String(t.intention || ''), label: String(t.label || ''), started: true });
    if (t.running && Number(t.endAt) > 0) {
      timer.endAt = Number(t.endAt); timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
      if (timer.remaining <= 0) {
        if (Date.now() - timer.endAt < 600000) { finishPhase(); return; }
        resetTimer('focus'); toast('Un bloque anterior terminó mientras no estabas; no se contó.'); return;
      }
      timer.running = true; timer.id = setInterval(tick, 500);
    } else timer.remaining = num(t.remaining, 0, total, total);
    $('#intention-input').value = timer.intention; $('#pomodoro-label').value = timer.label;
    renderTimer();
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
    const done = cached('doneToday', () => state.sessions.filter((s) => s.date === today() && !s.abandon).length);
    $('#goal-progress').textContent = `Meta: ${goal} ${goal === 1 ? 'bloque' : 'bloques'} de ${state.settings.focus} minutos · hoy ${done}/${goal}. Racha: ${calcStreak().streak} días.`;
    $('#notify-hint').hidden = !(state.settings.notify && typeof Notification !== 'undefined' && Notification.permission === 'denied');
    const mini = $('#mini-timer');
    if (mini) {
      const show = timer.started && currentPage !== 'study';
      mini.hidden = !show;
      if (show) { mini.textContent = `${focusMode ? '🎯' : '☕'} ${time(timer.remaining)}${timer.running ? '' : ' · en pausa'}`; mini.setAttribute('aria-label', `Volver al temporizador. ${focusMode ? 'Foco' : 'Descanso'}: quedan ${time(timer.remaining)}${timer.running ? '' : ', en pausa'}`); }
    }
  }

  function tick() {
    timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    renderTimer(); if (timer.remaining <= 0) finishPhase();
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
        intention: timer.intention, label: timer.label, energy: null, abandon: data.get('why'), achieved: false
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
      if (!intention) { toast('Escribe un resultado concreto antes de empezar.', 'error'); showPage('study'); $('#intention-input').focus(); return; }
      timer.intention = intention;
      timer.label = clean($('#pomodoro-label').value, 60);
    }
    timer.started = true;
    timer.endAt = Date.now() + timer.remaining * 1000;
    timer.running = true;
    timer.id = setInterval(tick, 500);
    renderTimer(); persistTimer(); announce(timer.mode === 'focus' ? 'Bloque de enfoque iniciado.' : 'Descanso iniciado.');
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
    const clockEl = $('#timer-clock'); clockEl.classList.remove('pulse'); void clockEl.offsetWidth; clockEl.classList.add('pulse');
    announce('Bloque completado. Guarda cómo te fue.');
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
    }, () => { renderAll(); document.dispatchEvent(new Event('learny:pomodone')); });
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

  function nextAction() {
    const due = dueCards(), overdue = overdueCards().length;
    const tasks = state.tasks.filter((t) => t.date === today() && !t.done);
    const deadline = tasks.length ? state.deadlines.find((d) => d.id === tasks[0].deadlineId) : null;
    const weak = weakSubject();
    if (due.length) return { id: 'review', title: `Repasar ${plural(due.length, 'tarjeta', 'tarjetas')}`, minutes: Math.max(2, Math.ceil(due.length * 0.7)), cta: 'Repasar ahora', why: overdue ? `${plural(overdue, 'vencida', 'vencidas')}: repásalas antes de que se olviden.` : 'Son pocos minutos y mantienen tus tarjetas al día.' };
    if (tasks.length && deadline) return { id: 'plan', title: `Continuar plan de ${deadline.subject}`, minutes: deadline.dailyMinutes, cta: 'Ver plan de hoy', why: tasks[0].title };
    if (weak) return { id: 'weak', title: `Mini quiz de ${weak.name}`, minutes: 5, cta: 'Empezar quiz', why: `${weak.pct}% sin fallar (${weak.ok} de ${weak.total} repasos): es tu materia con más fallos.` };
    if (!state.cards.some((c) => !c.archived)) return { id: 'create', title: 'Crea tu primera tarjeta', minutes: 3, cta: 'Crear tarjeta', why: 'Con tarjetas, Learny agenda tus repasos por ti.' };
    return { id: 'focus', title: 'Haz un bloque de enfoque', minutes: state.settings.focus, cta: 'Ir al Pomodoro', why: 'No tienes repasos pendientes: avanza con material nuevo.' };
  }

  function renderGreeting() {
    const h = new Date().getHours(), name = state.settings.name;
    $('#greeting').textContent = `${h < 6 ? 'Buenas noches' : h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'}${name ? `, ${name}` : ''}`;
    const due = dueCards().length, overdue = overdueCards().length;
    const exam = state.deadlines.filter((d) => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 14).sort((a, b) => a.date.localeCompare(b.date))[0];
    const parts = [];
    if (due) parts.push(`${plural(due, 'tarjeta', 'tarjetas')} para hoy${overdue ? ` (${overdue} ${overdue === 1 ? 'vencida' : 'vencidas'})` : ''}`);
    if (exam) { const n = daysUntil(exam.date); parts.push(`${esc(exam.title)} ${n === 0 ? 'hoy' : `en ${plural(n, 'día', 'días')}`}`); }
    $('#home-summary').innerHTML = parts.length ? `Tienes ${parts.join(' y ')}.` : 'Hoy no tienes pendientes urgentes.';
    const last = [...state.sessions].reverse().find((s) => !s.abandon);
    if (last) {
      const ago = -daysUntil(last.date);
      $('#home-last').textContent = `Última vez: ${plural(last.minutes, 'minuto', 'minutos')}${last.label ? ` de ${last.label}` : ''} ${ago === 0 ? 'hoy' : ago === 1 ? 'ayer' : `hace ${ago} días`}.`;
    } else $('#home-last').textContent = 'Aún no has completado ningún bloque. Tu primer Pomodoro desbloquea tu progreso.';
  }

  function startSubjectQuiz(name, size = 8) {
    const pool = state.cards.filter((c) => !c.archived && !c.corrupt && c.subject === name);
    if (!pool.length) return toast(`No hay tarjetas activas de ${name}.`, 'error');
    const errs = pool.filter((c) => c.history.some((h) => h.rating === 'again'));
    showPage('practice'); startExam([...errs, ...pool.filter((c) => !errs.includes(c))].slice(0, size), size);
  }

  function renderTodayQueue() {
    renderGreeting();
    const a = nextAction();
    $('#today-queue').innerHTML = `
      <div class="card-head"><div><h2>Siguiente mejor acción</h2><p class="lead">${esc(a.why)}</p></div><span class="tag">≈ ${a.minutes} min</span></div>
      <p class="next-title">${esc(a.title)}</p>
      <div class="actions tight">
        <button id="next-action" class="primary-button" type="button">${esc(a.cta)}</button>
        <button id="smart-session" class="outline-button" type="button">Empezar sesión inteligente</button>
        <button id="jump-feynman" class="outline-button" type="button">Explicar un tema (Feynman)</button>
      </div>`;
    $('#next-action').onclick = () => {
      if (a.id === 'review') { showPage('practice'); $('#flashcard').scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      else if (a.id === 'plan') showPage('planner');
      else if (a.id === 'weak') startSubjectQuiz(weakSubject()?.name);
      else if (a.id === 'create') { showPage('practice'); cardForm(); }
      else $('#intention-input').focus();
    };
    $('#smart-session').onclick = () => document.dispatchEvent(new Event('learny:smart'));
    $('#jump-feynman').onclick = () => { showPage('practice'); $('#feynman-topic').value ||= weakSubject()?.name || ''; $('#feynman-topic').focus(); };
  }

  /* =========================================================
     SM-2
     ========================================================= */
  let activeCard = null, revealed = false, answered = false, lastRateAt = 0;

  function schedule(card, rating) {
    const q = qualityOf(rating);
    card.lastReviewed = today();
    card.history = [...(card.history || []), { date: today(), rating, quality: q }].slice(-40);
    if (card.nextReview > today() && q >= 3) return; // repaso anticipado: no adelanta el calendario ni infla el intervalo
    if (q < 3) {
      card.repetitions = 0; card.interval = 1; // SM-2: con calidad < 3 el factor de facilidad no cambia
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
    const due = dueCards(), prev = activeCard, wasRevealed = revealed && !answered;
    activeCard = due[0] || null;
    revealed = false; answered = false;
    $('#rating-row').hidden = true;
    $('#reveal-card').hidden = !activeCard;
    $('#card-tools').hidden = !activeCard;
    $('#card-count').textContent = `${due.length} para hoy`;
    $('#exam-exit').hidden = true;
    if (!activeCard) {
      const has = state.cards.some((c) => !c.archived);
      $('#flashcard').innerHTML = has
        ? '<div><b>No tienes repasos hoy.</b><br><span>Puedes adelantar 5 tarjetas o crear nuevas.</span><div class="actions center"><button class="outline-button" data-empty="advance" type="button">Adelantar 5 tarjetas</button><button class="outline-button" data-empty="create" type="button">Crear tarjeta</button></div></div>'
        : '<div><b>Aún no tienes tarjetas.</b><br><span>Crea una desde tus apuntes, pide 5 al tutor o añade un mazo de ejemplo.</span><div class="actions center"><button class="outline-button" data-empty="create" type="button">Crear tarjeta</button><button class="outline-button" data-empty="ai" type="button">Pedir 5 al tutor</button><button class="outline-button" data-empty="deck" type="button">Mazo de ejemplo</button></div></div>';
      return;
    }
    if (activeCard.corrupt) {
      $('#flashcard').innerHTML = '<div><b>Esta tarjeta no se pudo cargar.</b><br><span>Le falta la pregunta o la respuesta. Edítala para repararla, pospónla o elimínala.</span></div>';
      $('#reveal-card').hidden = true; return;
    }
    if (wasRevealed && prev && prev.id === activeCard.id) { revealCard(); return; } // un redibujado (p. ej. fin de Pomodoro) no oculta la respuesta
    $('#flashcard').innerHTML = `<div><small>${esc(activeCard.subject)}</small><br>${esc(activeCard.question)}</div>`;
  }

  function revealCard() {
    if (exam) { exam.revealed = true; renderExam(); document.dispatchEvent(new Event('learny:reveal')); return; }
    if (!activeCard || revealed || activeCard.corrupt) return;
    revealed = true;
    $('#flashcard').innerHTML = `<div><small>Pregunta</small><br>${esc(activeCard.question)}<hr><small>Respuesta</small><br>${esc(activeCard.answer)}</div>`;
    $('#reveal-card').hidden = true; $('#rating-row').hidden = false;
    document.dispatchEvent(new Event('learny:reveal'));
  }

  function rateCard(rating) {
    if (exam) return examRate(rating);
    if (!activeCard || !revealed || answered) return;
    const now = Date.now(); if (now - lastRateAt < 350) return; lastRateAt = now; // doble clic o tecla repetida
    answered = true; flashFeedback(rating);
    const card = activeCard, before = cardSnap(card);
    schedule(card, rating);
    const rv = { date: today(), cardId: card.id, subject: card.subject || 'Sin materia', rating, quality: qualityOf(rating) };
    state.reviews.push(rv);
    document.dispatchEvent(new Event('learny:rated'));
    save(); renderAll();
    offerUndo(`Volverá en ${plural(card.interval, 'día', 'días')}.`, () => { Object.assign(card, before); dropReview(rv); save(); renderAll(); });
  }

  function flashFeedback(rating) {
    const el = $('#flashcard'); el.classList.remove('fb-good', 'fb-soft'); void el.offsetWidth;
    el.classList.add(rating === 'easy' ? 'fb-good' : 'fb-soft');
  }

  function snoozeCard() {
    if (!activeCard) return;
    const card = activeCard, prev = card.nextReview;
    card.nextReview = addDays(today(), 1);
    save(); renderAll(); offerUndo('Pospuesta 1 día.', () => { card.nextReview = prev; save(); renderAll(); });
  }

  function startExam(custom, size = 20) {
    const pool = (Array.isArray(custom) ? custom : dueCards()).filter((c) => !c.corrupt);
    if (pool.length < 1) return toast('No hay tarjetas vencidas o de hoy para el examen.', 'error');
    exam = { cards: pool.slice(0, size), i: 0, score: 0, revealed: false, answers: [] };
    document.dispatchEvent(new Event('learny:examstart'));
    toast(`Modo examen: ${exam.cards.length} tarjetas.`);
    renderExam();
  }

  function renderExam() {
    const item = exam.cards[exam.i];
    $('#card-count').textContent = `Examen ${exam.i + 1}/${exam.cards.length}`;
    $('#card-tools').hidden = true; $('#exam-exit').hidden = false;
    if (!exam.revealed) {
      $('#flashcard').innerHTML = `<div><small>Modo examen · ${esc(item.subject)}</small><br>${esc(item.question)}</div>`;
      $('#reveal-card').hidden = false; $('#rating-row').hidden = true;
    } else {
      $('#flashcard').innerHTML = `<div><small>Respuesta</small><br>${esc(item.answer)}</div>`;
      $('#reveal-card').hidden = true; $('#rating-row').hidden = false;
    }
  }

  function examRate(rating) {
    if (!exam.revealed) return; // no se puede calificar sin ver la respuesta (evita dobles pulsaciones)
    const now = Date.now(); if (now - lastRateAt < 350) return; lastRateAt = now;
    document.dispatchEvent(new Event('learny:rated'));
    const ex = exam, item = exam.cards[exam.i], prev = { i: exam.i, score: exam.score }, before = cardSnap(item);
    const ok = rating === 'easy';
    if (ok) exam.score++;
    exam.answers.push({ id: item.id, rating }); flashFeedback(rating);
    schedule(item, rating);
    const rv = { date: today(), cardId: item.id, subject: item.subject, rating, quality: qualityOf(rating), exam: true };
    state.reviews.push(rv);
    exam.i++; exam.revealed = false;
    if (exam.i >= exam.cards.length) {
      const pct = Math.round((exam.score * 100) / exam.cards.length);
      state.exams.push({ date: today(), score: exam.score, total: exam.cards.length });
      exam = null; save();
      document.dispatchEvent(new Event('learny:examend'));
      $('#rating-row').hidden = true;
      { const r = state.exams[state.exams.length - 1]; toast(`Examen: ${pct}% (${r.score}/${r.total}).`); }
      renderAll();
      return;
    }
    save(); renderExam();
    offerUndo('Calificación guardada.', () => {
      if (exam !== ex) return;
      ex.i = prev.i; ex.score = prev.score; ex.answers.pop(); ex.revealed = true;
      Object.assign(item, before); dropReview(rv); save(); renderExam();
    });
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
      const values = { subject: clean(data.get('subject'), 60), question: cleanMl(data.get('question'), 500), answer: cleanMl(data.get('answer'), 1200) };
      if (!values.question || !values.answer) return toast('Pregunta y respuesta no pueden estar vacías.', 'error');
      if (card) Object.assign(card, values, { corrupt: false });
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
      if (!hasAi()) return toast('Añade tu clave de Gemini en Ajustes ⚙️ o usa una plantilla.', 'error');
      button.disabled = true; button.textContent = 'Generando…';
      try {
        const text = await askGemini(`Responde en español, máximo 3 frases, útil para flashcard. Pregunta: ${question}`);
        const out = $('#card-answer'); if (out) out.value = text;
      } catch (error) { toast(error.message, 'error'); }
      finally { if ($('#generate-answer')) { button.disabled = false; button.textContent = '✨ Generar respuesta con IA'; } }
    };
  }

  let libLimit = 40;
  function renderLibrary() {
    const q = clean($('#library-search')?.value || '', 60).toLowerCase();
    const all = state.cards.filter((c) => c.archived);
    const cards = q ? all.filter((c) => `${c.question} ${c.answer} ${c.subject}`.toLowerCase().includes(q)) : all;
    $('#library-count').textContent = q ? `${cards.length} de ${plural(all.length, 'tarjeta', 'tarjetas')}` : plural(all.length, 'tarjeta', 'tarjetas');
    const shown = cards.slice(0, libLimit);
    const html = shown.map((c) => {
      try {
        if (c.corrupt) return `<article class="library-card"><b>Esta tarjeta no se pudo cargar.</b><p>Le falta la pregunta o la respuesta.</p><span>${esc(c.subject)}</span><div class="row-actions"><button class="text-button" data-edit-card="${esc(c.id)}" type="button">Editar</button><button class="text-button danger" data-delete-card="${esc(c.id)}" type="button">Eliminar</button></div></article>`;
        return `<article class="library-card"><b>${esc(c.question)}</b><p>${esc(c.answer)}</p><span>${esc(c.subject)}${c.origin === 'ia' ? ' · generada con IA y revisada' : ''}</span><div class="row-actions"><button class="text-button" data-return-card="${esc(c.id)}" type="button">Devolver a rotación</button><button class="text-button" data-edit-card="${esc(c.id)}" type="button">Editar</button><button class="text-button danger" data-delete-card="${esc(c.id)}" type="button">Eliminar</button></div></article>`;
      } catch { return '<article class="library-card"><p>Esta tarjeta no se pudo cargar.</p></article>'; }
    }).join('');
    $('#library-list').innerHTML = shown.length
      ? html + (cards.length > shown.length ? `<button class="outline-button" id="library-more" type="button">Mostrar más (${cards.length - shown.length})</button>` : '')
      : `<p class="empty">${q ? 'Ninguna tarjeta coincide con tu búsqueda.' : 'Aún no hay archivo. Envía aquí las tarjetas que ya dominas.'}</p>`;
  }

  function deleteCard(card) {
    const idx = card ? state.cards.indexOf(card) : -1; if (idx < 0) return;
    if (exam && exam.cards.includes(card)) return toast('Termina o abandona el examen antes de eliminar esta tarjeta.', 'error');
    snapshot('delete-card');
    state.cards.splice(idx, 1); save(); renderAll();
    offerUndo('Tarjeta eliminada.', () => { state.cards.splice(Math.min(idx, state.cards.length), 0, card); save(); renderAll(); });
  }

  /* =========================================================
     Análisis
     ========================================================= */
  function subjectStats(list = state.reviews) {
    const map = {};
    list.forEach((r) => {
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

  const periodDays = () => ({ '7': 7, '30': 30 }[state.settings.statsPeriod] || null);
  const inPeriod = (date) => { const n = periodDays(); return !n || date >= addDays(today(), -(n - 1)); };
  const periodLabel = () => ({ '7': 'últimos 7 días', '30': 'últimos 30 días' }[state.settings.statsPeriod] || 'todo el historial guardado');
  const sampleNote = (a, b, what) => (b ? `${a} de ${b} ${what}${b < 10 ? ' · muestra pequeña' : ''}` : 'Sin datos en este periodo');
  const pctOf = (a, b) => (b ? `${Math.round((a * 100) / b)}%` : '—');

  function renderAnalysis() {
    $('#stats-period').value = state.settings.statsPeriod;
    $('#stats-period-note').textContent = `Periodo: ${periodLabel()}.`;
    const reviews = state.reviews.filter((r) => inPeriod(r.date));
    const easy = reviews.filter((r) => r.rating === 'easy').length;
    const correct = reviews.filter((r) => r.rating !== 'again').length;
    $('#retention-stat').textContent = pctOf(easy, reviews.length);
    $('#retention-note').textContent = sampleNote(easy, reviews.length, 'repasos marcados «Fácil»');
    $('#accuracy-stat').textContent = pctOf(correct, reviews.length);
    $('#accuracy-note').textContent = sampleNote(correct, reviews.length, 'repasos sin «No lo sabía»');
    const exams = state.exams.filter((e) => inPeriod(e.date)), exScore = exams.reduce((t, e) => t + e.score, 0), exTotal = exams.reduce((t, e) => t + e.total, 0);
    $('#exam-stat').textContent = pctOf(exScore, exTotal);
    $('#exam-note').textContent = exTotal ? `${exScore} de ${exTotal} respuestas «Fácil» en ${plural(exams.length, 'examen', 'exámenes')}${exTotal < 10 ? ' · muestra pequeña' : ''}` : 'Sin exámenes en este periodo';
    const activeDays = new Set([...state.sessions.filter((x) => !x.abandon), ...reviews].filter((x) => inPeriod(x.date)).map((x) => x.date));
    const span = periodDays() || Math.max(1, ...[...activeDays].map((d) => 1 - daysUntil(d)));
    $('#consistency-stat').textContent = `${activeDays.size} ${activeDays.size === 1 ? 'día' : 'días'}`;
    $('#consistency-note').textContent = `de ${span} días del periodo${calcStreak().graceUsed ? ' · día de gracia usado' : ' · día de gracia disponible'}`;
    const mins = state.sessions.filter((x) => !x.abandon && inPeriod(x.date)).reduce((t, x) => t + Number(x.minutes || 0), 0);
    $('#time-stat').textContent = `${mins} min`;
    $('#time-note').textContent = `de ${plural(state.sessions.filter((x) => !x.abandon && inPeriod(x.date)).length, 'bloque', 'bloques')} · tiempo en sesión, no aprendizaje`;
    $('#overdue-stat').textContent = overdueCards().length;

    const days = [], names = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    for (let i = 6; i >= 0; i--) {
      const date = addDays(today(), -i);
      days.push({ date, label: names[new Date(`${date}T12:00:00`).getDay()], mins: state.sessions.filter((s) => s.date === date && !s.abandon).reduce((t, s) => t + Number(s.minutes || 0), 0) });
    }
    const max = Math.max(30, ...days.map((d) => d.mins));
    $('#focus-chart').innerHTML = days.map((d) => `<div class="bar-col" title="${d.date}: ${d.mins} min"><div class="bar-area"><div class="bar" style="height:${d.mins ? Math.max(4, (d.mins / max) * 100) : 0}%"></div></div><span>${d.label}<br>${d.mins}</span></div>`).join('');
    const weekMin = days.reduce((t, d) => t + d.mins, 0), goalMin = state.settings.dailyGoal * state.settings.focus * 7;
    $('#focus-summary').textContent = state.sessions.some((x) => !x.abandon)
      ? `Esta semana: ${weekMin} min de ${goalMin} min.${weekMin >= goalMin ? ' ¡Meta cumplida!' : ` Te faltan ${goalMin - weekMin} min.`}`
      : 'Completa tu primer Pomodoro para ver tu progreso.';

    const stats = subjectStats(reviews);
    const areas = Object.entries(stats).map(([name, v]) => ({ name, pct: Math.round((v.ok * 100) / v.total), ok: v.ok, total: v.total, again: v.again })).sort((a, b) => a.pct - b.pct);
    if (!areas.length) {
      $('#weak-topics').innerHTML = '<p class="empty">Aún no hay repasos en este periodo. Repasa tus primeras tarjetas para ver qué materias reforzar.</p>';
      return;
    }
    $('#weak-topics').innerHTML = areas.map((a) => {
      const weakCards = state.cards.filter((c) => c.subject === a.name && (c.history || []).some((h) => h.rating === 'again')).slice(0, 5);
      const extra = weakCards.length ? `<small>Revisa: ${weakCards.map((c) => esc(c.question.slice(0, 40))).join(' · ')}</small>` : '';
      const tip = a.total < MIN_SAMPLE ? `${esc(a.name)}: pocos datos todavía. Repasa más para saber cómo vas.`
        : a.pct < 60 ? `${esc(a.name)}: ${a.pct}% sin fallar; priorízala mañana.` : `${esc(a.name)}: ${a.pct}% sin fallar.`;
      return `<div class="weak-topic"><span>${tip}<br>${extra}<button class="text-button" data-quiz-subject="${esc(a.name)}" type="button">Mini quiz de ${esc(a.name)}</button></span><b>${a.ok} de ${a.total}</b></div>`;
    }).join('');
  }

  function weekSlice() {
    const from = addDays(today(), -6);
    return {
      from, to: today(),
      minutes: state.sessions.filter((s) => s.date >= from && !s.abandon).map((s) => ({ date: s.date, minutes: s.minutes, label: s.label, intention: s.intention })),
      reviews: state.reviews.filter((r) => r.date >= from),
      overdue: overdueCards().map((c) => ({ subject: c.subject, question: c.question, nextReview: c.nextReview })),
      recuerdoDeclarado: { facil: state.reviews.filter((r) => r.rating === 'easy').length, repasos: state.reviews.length, nota: 'Autoevaluación: porcentaje de repasos marcados «Fácil», no una medida de retención.' }
    };
  }

  function download(name, text, type) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportReport() {
    modal(`<h2>Informe semanal</h2><p>Elige formato. Incluye minutos, etiquetas, intenciones y preguntas de tarjetas vencidas; no incluye tu clave.</p>
      <div class="actions"><button id="rep-json" class="primary-button" type="button">JSON</button>
      <button id="rep-csv" class="outline-button" type="button">CSV</button></div>`, () => closeModal());
    $('#rep-json').onclick = () => { download(`learny-semana-${today()}.json`, JSON.stringify(weekSlice(), null, 2), 'application/json'); closeModal(); toast('Informe JSON descargado.'); };
    $('#rep-csv').onclick = () => {
      const w = weekSlice();
      const rows = [['fecha', 'minutos', 'etiqueta']].concat(w.minutes.map((s) => [s.date, s.minutes, s.label]));
      download(`learny-semana-${today()}.csv`, rows.map((r) => r.map((x) => { const v = String(x); return `"${(/^[=+\-@\t\r]/.test(v) ? "'" : '') + v.replace(/"/g, '""')}"`; }).join(',')).join('\n'), 'text/csv');
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

  const BLOCK_KEYS = ['Pregunta guía', 'Pista', 'Explicación', 'Ejemplo', 'Siguiente reto', 'Lo que explicaste bien', 'Revisa esta afirmación', 'Falta este concepto', 'Pregunta para comprobar'];
  function parseBlocks(text) {
    const any = BLOCK_KEYS.join('|'), found = [];
    BLOCK_KEYS.forEach((k) => {
      const re = new RegExp(`\\*\\*${k}:?\\*\\*[\\s:\\-]*([\\s\\S]*?)(?=\\*\\*(?:${any}):?\\*\\*|$)`, 'i');
      const m = re.exec(text);
      if (m) found.push({ k, at: m.index, body: m[1].trim() });
    });
    found.sort((a, b) => a.at - b.at); // se muestran en el orden en que la IA los escribió
    const html = found.map((b) => `<section class="tutor-block"><h3>${b.k}</h3><p>${fmt(b.body)}</p></section>`).join('');
    return html || `<div class="ai-answer">${fmt(text)}</div>`;
  }

  function tutorContext() {
    const t = state.settings.tutor;
    return `Contexto: materia=${t.subject || 'no indicada'}; nivel=${t.level || 'no indicado'}; ya sabe=${t.known || 'no indicado'}; quiere lograr=${t.goal || 'no indicado'}.
Estilo de explicación: ${({ 12: 'como a alguien de 12 años', uni: 'nivel universitario', carrera: `con ejemplos de ${$('#tutor-career').value || 'su carrera'}` })[$('#tutor-style').value]}.`;
  }

  function socraticPrompt(query, mode = $('#tutor-mode').value) {
    if (mode === 'direct') {
      return `Actúa como tutor en español. El estudiante prefiere una explicación directa: responde con claridad desde el principio, sin hacerle adivinar. Si no estás seguro de algo, dilo.
Responde EXACTAMENTE con estos bloques, cada uno con el título en negrita:
**Explicación**
**Ejemplo**
**Pregunta guía**
**Siguiente reto**
En «Pregunta guía» pon una pregunta para comprobar que entendió.
${tutorContext()}
Consulta: ${query}`;
    }
    return `Actúa como tutor socrático en español. No des la respuesta completa primero; haz una pregunta guía, pide el razonamiento y corrige errores paso a paso. Si el estudiante pide explícitamente que se lo expliques, dáselo.
Responde EXACTAMENTE con estos bloques, cada uno con el título en negrita:
**Pregunta guía**
**Pista**
**Explicación**
**Ejemplo**
**Siguiente reto**
${tutorContext()}
Consulta: ${query}`;
  }

  function feynmanPrompt(topic, text) {
    return `Actúa como tutor en español. Un estudiante explicó un tema con sus propias palabras (método Feynman). Evalúa SOLO lo que escribió y no inventes errores. Sin puntuación numérica.
Responde EXACTAMENTE con estos bloques, cada uno con el título en negrita:
**Lo que explicaste bien**
(1 o 2 frases; cita entre comillas un fragmento breve suyo)
**Revisa esta afirmación**
(cita textualmente el fragmento dudoso o incorrecto, explica por qué y cómo mejorarlo; si no hay ninguno, escribe "No encontré afirmaciones incorrectas")
**Falta este concepto**
(el concepto importante que no mencionó)
**Pregunta para comprobar**
(una pregunta que permita comprobar su comprensión)
${tutorContext()}
Tema: ${topic || 'no indicado'}
Explicación del estudiante:
${text}`;
  }

  let aiController = null;
  const hasAi = () => !!(state.apiKey || state.settings.proxyUrl);
  const cancelAi = () => { if (aiController) aiController.abort(); };

  async function askGemini(prompt) {
    if (!hasAi()) throw new Error('Falta la clave de Gemini. Añádela en Ajustes ⚙️ o usa Guía local.');
    const text = cleanMl(prompt, MAX_PROMPT);
    if (!text) throw new Error('El texto está vacío o es demasiado corto.');
    const proxy = state.settings.proxyUrl, who = proxy ? 'El proxy' : 'La clave de Gemini';
    const model = (state.settings.model || DEFAULT_MODEL).trim();
    if (aiController) { aiController.stale = true; aiController.abort(); } // una consulta nueva sustituye a la anterior
    const controller = new AbortController(); aiController = controller;
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 30000);
    try {
      const response = await fetch(proxy || `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST', signal: controller.signal,
        headers: proxy ? { 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json', 'x-goog-api-key': state.apiKey },
        body: JSON.stringify(proxy ? { prompt: text } : { contents: [{ parts: [{ text }] }], generationConfig: { maxOutputTokens: 4096 } })
      });
      let data = {}; try { data = await response.json(); } catch { /* sin cuerpo */ }
      if (!response.ok) {
        const raw = data.error?.message || `Error ${response.status}`;
        if (response.status === 400 || response.status === 401 || response.status === 403) throw new Error(`${who} no es válido o no tiene permiso. (${raw})`);
        if (response.status === 404) throw new Error(`El modelo “${model}” no existe. Cámbialo en Ajustes ⚙️. (${raw})`);
        if (response.status === 429) throw new Error('Se agotó la cuota de la IA. Espera un rato e inténtalo de nuevo.');
        throw new Error(raw);
      }
      const out = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
      if (!out) throw new Error(data.candidates?.[0]?.finishReason === 'MAX_TOKENS' ? 'La IA agotó su límite de respuesta antes de escribir. Prueba otro modelo en Ajustes ⚙️ o una pregunta más corta.' : 'La IA no devolvió texto para esta consulta.');
      return out;
    } catch (error) {
      if (error.name === 'AbortError') { const e = new Error(timedOut ? 'La IA tardó demasiado. Inténtalo de nuevo.' : 'Consulta cancelada.'); e.cancelled = !timedOut; e.stale = !!controller.stale; throw e; }
      if (error instanceof TypeError) throw new Error('No hay conexión o el servicio no respondió. Puedes usar las preguntas guía locales.');
      throw error;
    } finally { clearTimeout(timeout); if (aiController === controller) aiController = null; }
  }

  function chatTopic() {
    return clean(state.settings.tutor.subject, 60) || 'general';
  }

  function saveChat(role, text) {
    const topic = chatTopic();
    let chat = state.chats.find((c) => c.topic.toLowerCase() === topic.toLowerCase());
    if (!chat) { chat = { topic, messages: [] }; state.chats.push(chat); if (state.chats.length > MAX_CHATS) state.chats.splice(0, state.chats.length - MAX_CHATS); }
    chat.messages = [...chat.messages, { role, text: String(text).slice(0, 3000), at: new Date().toISOString() }].slice(-20);
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

  let lastAi = null, lastFail = null;
  const closeButton = '<button class="primary-button" type="button" data-close-modal>Cerrar</button>';
  const aiActions = '<div class="actions"><button class="outline-button" type="button" data-ai-follow="direct">Explícamelo directamente</button><button class="outline-button" type="button" data-ai-follow="simple">Explicar más simple</button><button class="outline-button" type="button" data-ai-follow="exercise">Dame un ejercicio</button><button class="outline-button" type="button" data-ai-follow="cards">Crear tarjetas</button><button class="text-button" type="button" data-ai-follow="note">Guardar en notas</button></div>';

  async function gemini(prompt, title, fallback, onDone) {
    const showLocal = (note = '') => {
      const text = fallback?.() || localGuide(title);
      modal(`<h2>${esc(title)}</h2>${parseBlocks(text)}${note ? `<p class="modal-tip">${esc(note)}</p>` : ''}${closeButton}`);
      return { text, fromAi: false };
    };
    if (!hasAi()) {
      if (modalOpen()) { toast('Añade tu clave de Gemini en Ajustes ⚙️ o elige Guía local.', 'error'); return { text: fallback?.() || localGuide(title), fromAi: false }; }
      if (!state.settings.skipAi) return new Promise((resolve) => requestKey(async () => resolve(await gemini(prompt, title, fallback)), () => resolve(showLocal('Modo local activo.'))));
      return showLocal('Guía local. Añade tu clave en Ajustes ⚙️ para IA.');
    }
    modal(`<h2>${esc(title)}</h2><div class="skeleton" aria-hidden="true"></div><p class="lead">Consultando tutor…</p><button class="outline-button" type="button" data-cancel-ai>Cancelar</button>`);
    $('#modal-body').setAttribute('aria-live', 'polite');
    try {
      const text = await askGemini(prompt);
      lastAi = { prompt, title, text };
      $('#modal-body').innerHTML = `<h2>${esc(title)}</h2>${parseBlocks(text)}${aiActions}${closeButton}`;
      try { onDone?.(text); } catch (e) { console.error(e); }
      return { text, fromAi: true };
    } catch (error) {
      if (error.stale) return { text: '', fromAi: false, cancelled: true }; // ya hay otra consulta en curso: no tocar su ventana
      if (error.cancelled) { closeModal(); toast('Consulta cancelada.'); return { text: '', fromAi: false, cancelled: true }; }
      const text = fallback?.() || localGuide(title);
      lastFail = { prompt, title, fallback, onDone };
      $('#modal-body').innerHTML = `<h2>No se pudo completar</h2><p>${esc(error.message)}</p><p class="modal-tip">Tu pregunta se conserva. Puedes reintentar o usar las preguntas guía locales mientras tanto.</p>${parseBlocks(text)}<div class="actions"><button class="primary-button" type="button" data-ai-retry>Reintentar</button><button class="outline-button" type="button" data-close-modal>Cerrar</button></div>`;
      toast(error.message, 'error');
      return { text, fromAi: false, failed: true };
    }
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-cancel-ai]')) { cancelAi(); return; }
    if (e.target.closest('[data-ai-retry]') && lastFail) { const r = lastFail; lastFail = null; gemini(r.prompt, r.title, r.fallback, r.onDone); return; }
    if (e.target.closest('[data-feynman-retry]')) { feynman(); return; }
    if (e.target.closest('[data-feynman-cards]') && lastFey) { suggestCardsFromText(lastFey.topic, lastFey.text); return; }
    const f = e.target.closest('[data-ai-follow]')?.dataset.aiFollow;
    if (!f || !lastAi) return;
    const base = lastAi;
    if (f === 'direct') gemini(socraticPrompt(`Explícame esto directamente y con claridad:\n${base.text}`, 'direct'), 'Explicación directa', () => base.text);
    else if (f === 'simple') gemini(`Explica esto de forma más simple, con una analogía cotidiana, en máximo 120 palabras:\n${base.text}`, 'Explicación más simple', () => base.text);
    else if (f === 'exercise') gemini(`Crea un ejercicio práctico (solo el enunciado) para practicar lo siguiente:\n${base.text}`, 'Ejercicio de práctica', () => '**Siguiente reto**\nInventa un problema nuevo sobre este tema y resuélvelo sin mirar tus apuntes.');
    else if (f === 'cards') suggestCardsFromText(base.title === 'Tutor Learny' ? clean($('#tutor-subject').value, 60) || 'Tutor' : base.title, base.text, { origin: 'ia' });
    else if (f === 'note') { state.notes.push({ id: uid(), date: today(), text: base.text.slice(0, 2000) }); save(); renderAll(); toast('Respuesta guardada en Notas rápidas.'); }
  });

  function cloze(sentence, topic) {
    const word = sentence.split(/\s+/).map((x) => x.replace(/[^\p{L}\p{N}-]/gu, '')).filter((x) => x.length >= 5).sort((a, b) => b.length - a.length)[0];
    return word
      ? { question: `Completa: ${sentence.replace(word, '_____').slice(0, 400)}`, answer: `${word}. ${sentence}`.slice(0, 1200) }
      : { question: `¿Cómo explicarías esta idea de ${topic || 'tu tema'}?`, answer: sentence.slice(0, 1200) };
  }
  /* =========================================================
     Bandeja de revisión: ninguna tarjeta generada se guarda sin que la aceptes
     ========================================================= */
  const normText = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  // Palabras de la respuesta (≥5 letras) que no aparecen en los apuntes (se compara por raíz de 5 letras).
  function unsupportedShare(answer, source) {
    const src = normText(source), words = [...new Set(normText(answer).split(/[^\p{L}\p{N}]+/u).filter((x) => x.length >= 5))];
    if (!src || words.length < 4) return 0;
    return words.filter((w) => !src.includes(w.slice(0, 5))).length / words.length;
  }
  function reviewCards(items, { topic = '', source = '', origin = 'ia', intro = '' } = {}) {
    const srcNorm = normText(source);
    const warnText = (answer) => (source && unsupportedShare(answer, source) > 0.4 ? '⚠ Parte de la respuesta no aparece en tus apuntes: puede haberla añadido la IA. Revísala o corrígela.' : '');
    const srcLine = (it) => {
      if (it.fragment && source) return srcNorm.includes(normText(it.fragment))
        ? `Del apunte: “${esc(it.fragment)}”` : `⚠ El fragmento que cita la IA no aparece en tus apuntes: “${esc(it.fragment)}”`;
      return source ? 'Sin fragmento de respaldo en tus apuntes.' : 'Sin fuente: la IA la generó solo a partir del tema. Verifica la respuesta antes de aceptarla.';
    };
    modal(`<h2>Revisa las tarjetas</h2>
      <p>${esc(intro || 'Ninguna se guarda hasta que la aceptes. Puedes corregir el texto antes.')}</p>
      <label>Materia<input name="subject" required maxlength="60" value="${esc(topic)}"></label>
      ${items.map((it, i) => `<fieldset class="review-card">
        <div class="review-head"><span class="tag">Tarjeta ${i + 1}</span>
          <span class="seg-group"><label class="seg"><input type="radio" name="s${i}" value="accept"><span>Aceptar</span></label><label class="seg"><input type="radio" name="s${i}" value="discard"><span>Descartar</span></label></span></div>
        <label>Pregunta<textarea name="q${i}" maxlength="500" rows="2">${esc(it.question)}</textarea></label>
        <label>Respuesta<textarea name="a${i}" maxlength="1200" rows="3">${esc(it.answer)}</textarea></label>
        <p class="review-src">${srcLine(it)}</p><p class="review-warn" data-warn="${i}">${warnText(it.answer)}</p></fieldset>`).join('')}
      <button id="review-save" class="primary-button" disabled>Guardar aceptadas (0)</button>`, (data) => {
      const subject = clean(data.get('subject'), 60) || topic || 'Sin materia';
      let n = 0;
      items.forEach((_, i) => {
        if (data.get(`s${i}`) !== 'accept') return;
        const question = cleanMl(data.get(`q${i}`), 500), answer = cleanMl(data.get(`a${i}`), 1200);
        if (question && answer) { state.cards.push(normalizeCard({ subject, question, answer, nextReview: today(), origin })); n++; }
      });
      if (!n) return toast('Acepta al menos una tarjeta con pregunta y respuesta.', 'error');
      save(); closeModal(); renderAll(); toast(`${plural(n, 'tarjeta guardada', 'tarjetas guardadas')}. Aparecerán en tu repaso de hoy.`);
    }, () => { const b = $('#modal-body'); b.onchange = null; b.oninput = null; });
    const body = $('#modal-body'), btn = $('#review-save');
    body.onchange = () => {
      const n = items.filter((_, i) => body.querySelector(`input[name="s${i}"]:checked`)?.value === 'accept').length;
      btn.disabled = !n; btn.textContent = `Guardar aceptadas (${n})`;
    };
    body.oninput = (e) => { // al editar la respuesta se vuelve a comprobar contra los apuntes
      const m = /^a(\d+)$/.exec(e.target.name || ''); if (!m) return;
      const w = body.querySelector(`[data-warn="${m[1]}"]`); if (w) w.textContent = warnText(e.target.value);
    };
  }

  function suggestCardsFromText(topic, text, opts = {}) {
    const parts = text.replace(/\*\*/g, '').split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 20).slice(0, 5);
    if (!parts.length) return toast('No encontré ideas suficientes para convertir en tarjetas.', 'error');
    const items = parts.map((p) => ({ ...cloze(p, topic), fragment: p.slice(0, 200) }));
    reviewCards(items, { topic: topic || 'Feynman', source: text, origin: opts.origin || '', intro: `Detecté ${parts.length} ideas en el texto sobre ${topic || 'el tema'}. Corrige y acepta las que te sirvan.` });
  }

  let lastFey = null;
  const FEY_BTN = '<p><button class="outline-button" type="button" data-feynman-cards>Crear tarjetas con estas ideas</button></p>';
  async function feynman() {
    const topic = clean($('#feynman-topic').value, 80), text = clean($('#feynman-text').value, 4000), guide = $('#feynman-guide');
    if (!text) return toast('Escribe tu explicación.', 'error');
    const local = localGuide(topic, text);
    guide.innerHTML = parseBlocks(local);
    if (!hasAi()) {
      toast('Modo local: sin clave también recibes guía socrática.');
      lastFey = { topic, text }; guide.insertAdjacentHTML('beforeend', FEY_BTN);
      return;
    }
    guide.innerHTML += '<p><i>Consultando tutor…</i> <button class="text-button" type="button" data-cancel-ai>Cancelar</button></p>';
    try {
      const answer = await askGemini(feynmanPrompt(topic, cleanMl($('#feynman-text').value, 4000)));
      guide.innerHTML = parseBlocks(answer);
      saveChat('user', text); saveChat('tutor', answer);
      lastFey = { topic, text }; guide.insertAdjacentHTML('beforeend', FEY_BTN);
    } catch (error) {
      if (error.stale) return; // otra consulta tomó el relevo
      guide.innerHTML = parseBlocks(local) + (error.cancelled ? '<p><i>Consulta cancelada. Tu explicación sigue aquí.</i></p>' : `<p><i>${esc(error.message)} Tu explicación se conserva.</i></p>`);
      guide.insertAdjacentHTML('beforeend', `<p><button class="outline-button" type="button" data-feynman-retry>Reintentar</button></p>`);
      toast(error.cancelled ? 'Consulta cancelada.' : error.message, error.cancelled ? 'ok' : 'error');
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
    if (!hasAi()) { toast('Sin clave te sugerimos un tema al azar.'); return randomTopic(); }
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
      toast('Fase terminada. Ahora explica con Feynman.'); if ($('#feynman-text').value.trim()) $('#feynman-feedback').click();
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
  function syncTutorMode() { $('#ai-question').placeholder = $('#tutor-mode').value === 'direct' ? 'Pregunta y recibe una explicación directa…' : 'Pregunta a tu tutor socrático…'; }

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
    $('#tutor-style').value = t.style || 'uni'; $('#tutor-career').value = t.career || ''; $('#tutor-mode').value = t.mode || 'socratic'; syncTutorMode();
  }

  function isLearnyBackup(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
    return ['cards', 'sessions', 'deadlines', 'reviews', 'topics', 'settings', 'tasks'].some((k) => k in data);
  }

  function exportData(auto = false) {
    const { apiKey, ...safe } = state;
    download(`learny-copia-${today()}.json`, JSON.stringify(safe, null, 2), 'application/json');
    state.settings.lastExport = today(); save();
    if (!auto) toast('Copia descargada (sin clave API).');
  }

  function exportDeck() {
    const deck = state.cards.filter((c) => !c.corrupt).map(({ subject, question, answer }) => ({ subject, question, answer }));
    if (!deck.length && !state.decks.length) return toast('No hay tarjetas para compartir.', 'error');
    download(`learny-mazo-${today()}.json`, JSON.stringify({ type: 'learny-deck', cards: deck, decks: state.decks }, null, 2), 'application/json');
    toast('Mazo exportado sin progreso personal.');
  }

  const BACKUP_LISTS = ['cards', 'sessions', 'deadlines', 'reviews', 'topics', 'tasks', 'chats', 'exams', 'notes', 'feynman', 'decks'];
  function validateBackup(data) {
    if (data?.type === 'learny-deck') {
      if (!Array.isArray(data.cards)) return { ok: false, error: 'El mazo no contiene una lista de tarjetas.' };
      const good = data.cards.filter((c) => c && typeof c.question === 'string' && typeof c.answer === 'string' && c.question.trim() && c.answer.trim());
      const decks = (Array.isArray(data.decks) ? data.decks : []).filter((d) => d && typeof d.name === 'string' && Array.isArray(d.cards))
        .map((d) => ({ name: d.name.slice(0, 60), cards: d.cards.filter((c) => Array.isArray(c) && typeof c[0] === 'string' && typeof c[1] === 'string').map((c) => [c[0].slice(0, 500), c[1].slice(0, 1200)]) })).filter((d) => d.cards.length);
      return good.length || decks.length ? { ok: true, deck: good, decks, dropped: data.cards.length - good.length } : { ok: false, error: 'El mazo no tiene tarjetas válidas.' };
    }
    if (!isLearnyBackup(data)) return { ok: false, error: 'Ese archivo no parece una copia de Learny.' };
    if (Number(data.version) > SCHEMA) return { ok: false, error: `La copia es de una versión más nueva de Learny (v${data.version}). Actualiza la app e inténtalo de nuevo.` };
    const bad = BACKUP_LISTS.filter((k) => k in data && !Array.isArray(data[k]));
    if (bad.length) return { ok: false, error: `Estos campos tienen un formato inválido: ${bad.join(', ')}.` };
    if ('settings' in data && (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings))) return { ok: false, error: 'Los ajustes de la copia no son válidos.' };
    return { ok: true, cards: (data.cards || []).length, deadlines: (data.deadlines || []).length, sessions: (data.sessions || []).length };
  }

  function importData(file) {
    if (file.size > 15 * 1024 * 1024) return toast('El archivo es demasiado grande para ser una copia de Learny.', 'error');
    file.text().then(async (text) => {
      let data; try { data = JSON.parse(text); } catch { throw new Error('El archivo no es un JSON válido.'); }
      const check = validateBackup(data);
      if (!check.ok) throw new Error(check.error);
      const msg = check.deck
        ? `Se añadirán ${plural(check.deck.length, 'tarjeta', 'tarjetas')} a tu colección${check.dropped ? ` (${check.dropped} inválidas se omiten)` : ''}.`
        : `Esta copia REEMPLAZARÁ tus datos actuales por ${plural(check.cards, 'tarjeta', 'tarjetas')}, ${plural(check.deadlines, 'fecha', 'fechas')} y ${plural(check.sessions, 'sesión', 'sesiones')}.`;
      if (!(await confirmDialog({ title: check.deck ? 'Importar mazo' : 'Reemplazar tus datos', message: `${msg}\nAntes se guardará una copia automática en el navegador.`, ok: check.deck ? 'Importar' : 'Reemplazar', danger: !check.deck }))) return;
      snapshot('import');
      const keepProxy = state.settings.proxyUrl; // una copia ajena nunca redirige tu IA
      if (check.deck) { check.deck.forEach((c) => state.cards.push(normalizeCard({ ...c, nextReview: today() }))); (check.decks || []).forEach((d) => { if (!state.decks.some((x) => x.name === d.name)) state.decks.push(d); }); }
      else { exam = null; hydrate({ ...data, apiKey: state.apiKey }); state.settings.proxyUrl = keepProxy; }
      state.deadlines.forEach((d) => { if (!state.tasks.some((t) => t.deadlineId === d.id)) rebuildTasks(d, false); });
      save(); closeModal(); applyPreferences(); resetTimer('focus'); renderAll(); toast('Datos importados correctamente.');
    }).catch((error) => toast(error.message || 'Ese archivo no es una copia válida de Learny.', 'error'));
  }

  async function restoreBackup() {
    const b = parseJSON(localStorage.getItem(BACKUP_KEY));
    if (!b?.data) return toast('No hay copia automática para restaurar.', 'error');
    if (!(await confirmDialog({ title: 'Restaurar copia automática', message: `Copia del ${String(b.at || '').slice(0, 10)} (${b.reason || 'manual'}). Reemplazará tus datos actuales.`, ok: 'Restaurar', danger: true }))) return;
    const keepProxy = state.settings.proxyUrl, keepChats = state.chats;
    exam = null; hydrate({ ...b.data, chats: keepChats, apiKey: state.apiKey }); state.settings.proxyUrl = keepProxy;
    save(); closeModal(); applyPreferences(); resetTimer('focus'); renderAll(); toast('Copia automática restaurada.');
  }

  function detectDelimiter(text) {
    const m = text.match(/^#separator:\s*(\w+)/im);
    if (m) { const map = { tab: '\t', semicolon: ';', comma: ',', pipe: '|', space: ' ' }; if (map[m[1].toLowerCase()]) return map[m[1].toLowerCase()]; }
    const first = text.split(/\r?\n/).find((l) => l.trim() && !l.startsWith('#')) || '';
    const count = { '\t': 0, ';': 0, ',': 0 }; let q = false;
    for (const ch of first) { if (ch === '"') q = !q; else if (!q && ch in count) count[ch]++; }
    if (count['\t']) return '\t'; // Anki exporta con tabuladores
    return count[';'] > count[','] ? ';' : ',';
  }

  function parseCsv(text) {
    const d = detectDelimiter(text);
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else if (ch === '"') q = true;
      else if (ch === d) { row.push(cur.trim()); cur = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cur.trim()); cur = ''; rows.push(row); row = []; }
      else cur += ch;
    }
    row.push(cur.trim()); rows.push(row);
    return rows.filter((r) => r.some(Boolean) && !String(r[0]).startsWith('#'));
  }

  // Anki guarda HTML en los campos: <br> pasa a salto de línea y el resto de etiquetas se quita.
  const stripHtml = (v) => String(v || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(div|p|li)>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  function importCsv(file) {
    if (file.size > 5 * 1024 * 1024) return toast('El archivo es demasiado grande (máximo 5 MB).', 'error');
    file.text().then(async (text) => {
      const rows = parseCsv(text.replace(/^﻿/, ''));
      if (rows.length < 1) throw new Error('vacío');
      const header = rows[0].map((h) => h.toLowerCase());
      const body = header.some((h) => /pregunta|question|front|anverso/.test(h)) ? rows.slice(1) : rows;
      const key = (q, sub) => `${sub}\u0001${q}`.toLowerCase();
      const have = new Set(state.cards.map((c) => key(c.question, c.subject)));
      const fresh = []; let dup = 0, skipped = 0;
      for (const r of body.slice(0, 5000)) {
        const question = cleanMl(stripHtml(r[0]), 500), answer = cleanMl(stripHtml(r[1]), 1200), subject = clean(stripHtml(r[2]), 60) || 'Importado';
        if (!question || !answer) { skipped++; continue; }
        const k = key(question, subject);
        if (have.has(k)) { dup++; continue; }
        have.add(k); fresh.push({ question, answer, subject });
      }
      if (!fresh.length) return toast(dup ? (dup === 1 ? 'Esa tarjeta ya estaba en tu colección.' : `Las ${dup} tarjetas del archivo ya estaban en tu colección.`) : 'No encontré tarjetas válidas (pregunta, respuesta, materia).', 'error');
      const extra = [dup ? `${plural(dup, 'repetida se omite', 'repetidas se omiten')}` : '', skipped ? `${plural(skipped, 'fila incompleta se omite', 'filas incompletas se omiten')}` : ''].filter(Boolean).join(' · ');
      if (!(await confirmDialog({ title: 'Importar tarjetas', message: `Se añadirán ${plural(fresh.length, 'tarjeta', 'tarjetas')} a tu colección.${extra ? `\n${extra}.` : ''}\nAntes se guardará una copia automática.`, ok: 'Importar' }))) return;
      snapshot('import-csv');
      fresh.forEach((c) => state.cards.push(normalizeCard({ ...c, nextReview: today() })));
      save(); closeModal(); renderAll(); toast(`Importadas ${plural(fresh.length, 'tarjeta', 'tarjetas')} desde CSV.`);
    }).catch(() => toast('Archivo no válido. Usa pregunta, respuesta, materia (separados por coma, punto y coma o tabulador).', 'error'));
  }

  function openSettings() {
    modal(`<h2>Ajustes</h2>
      <label>Tu nombre (opcional, para el saludo)<input name="name" maxlength="30" autocomplete="given-name" value="${esc(state.settings.name)}"></label>
      <label>Tema<select name="theme"><option value="dark">Oscuro</option><option value="sepia">Sepia</option><option value="contrast">Alto contraste</option></select></label>
      <label>Fuente<select name="font"><option value="sans">Sans-serif legible</option><option value="dyslexic">Lectura fácil</option></select></label>
      <div class="form-row"><label>Color de acento (solo tema oscuro)<select name="accent"><option value="mint">Menta</option><option value="violet">Violeta</option><option value="amber">Ámbar</option><option value="sky">Cielo</option><option value="rose">Rosa</option></select></label>
      <label>Densidad<select name="density"><option value="normal">Normal</option><option value="compact">Compacta</option><option value="roomy">Amplia</option></select></label></div>
      <label class="check"><input name="reduce" type="checkbox"> Reducir animaciones</label>
      <label class="check"><input name="sound" type="checkbox"> Sonido al terminar</label>
      <label class="check"><input name="notify" type="checkbox"> Avisos al terminar bloques y un recordatorio diario al abrir la app (no llegan con la app cerrada)</label>
      <div class="form-row"><label>Pomodoro (min)<input name="focus" type="number" min="1" max="180" value="${state.settings.focus}"></label>
      <label>Descanso (min)<input name="rest" type="number" min="1" max="60" value="${state.settings.rest}"></label>
      <label>Ruleta: preparación<input name="prepare" type="number" min="1" max="180" value="${state.settings.roulettePrepare}"></label>
      <label>Ruleta: explicación<input name="explain" type="number" min="1" max="180" value="${state.settings.rouletteExplain}"></label></div>
      <label>Clave de Gemini (opcional)<input name="apikey" type="password" autocomplete="off" maxlength="200" placeholder="${state.apiKey ? 'Clave guardada (vacío = conservar)' : 'Pega aquí tu clave'}"></label>
      <p class="modal-tip">Tu clave se guarda solo en este navegador y no debe usarse en un equipo compartido. Va en el encabezado x-goog-api-key, no en la URL.</p>
      <label>Modelo de Gemini<input name="model" value="${esc(state.settings.model)}"></label>
      <label>URL de tu proxy (opcional, para no exponer la clave)<input name="proxy" type="url" inputmode="url" maxlength="200" placeholder="https://tu-worker.workers.dev" value="${esc(state.settings.proxyUrl)}"></label>
      <div class="actions">
        <button id="export-data" class="outline-button" type="button">Descargar copia</button>
        <button id="export-deck" class="outline-button" type="button">Compartir mazo</button>
        <label class="outline-button" style="cursor:pointer">Importar JSON<input id="import-file" type="file" accept="application/json,.json" hidden></label>
        <label class="outline-button" style="cursor:pointer">Importar CSV / Anki (.csv, .txt)<input id="import-csv" type="file" accept=".csv,.tsv,.txt,text/csv,text/plain,text/tab-separated-values" hidden></label>
        ${state.apiKey ? '<button id="clear-key" class="outline-button" type="button">Quitar clave guardada</button>' : ''}
        ${localStorage.getItem(BACKUP_KEY) ? '<button id="restore-backup" class="outline-button" type="button">Restaurar copia automática</button>' : ''}
        <button id="reset-data" class="outline-button" type="button">Borrar todo</button>
      </div>
      <p class="modal-tip">Comentarios: <a href="mailto:learnyxsv@gmail.com">learnyxsv@gmail.com</a></p>
      <button class="primary-button">Guardar preferencias</button>`, (data) => {
      if (clean(data.get('proxy'), 200) && !validProxy(data.get('proxy'))) return toast('La URL del proxy debe empezar por https:// (o http://localhost).', 'error');
      Object.assign(state.settings, {
        name: clean(data.get('name'), 30), proxyUrl: validProxy(data.get('proxy')),
        theme: data.get('theme'), accent: data.get('accent'), density: data.get('density'), font: data.get('font'), reduceMotion: data.get('reduce') === 'on',
        sound: data.get('sound') === 'on', notify: data.get('notify') === 'on',
        focus: num(data.get('focus'), 1, 180, 25), rest: num(data.get('rest'), 1, 60, 5),
        roulettePrepare: num(data.get('prepare'), 1, 180, 10), rouletteExplain: num(data.get('explain'), 1, 180, 1),
        model: clean(data.get('model'), 80) || DEFAULT_MODEL
      });
      const key = clean(data.get('apikey'), 200); if (key) { state.apiKey = key; state.settings.skipAi = false; }
      if (state.settings.notify && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();
      save(); applyPreferences(); closeModal(); if (!timer.started) resetTimer(timer.mode); else renderTimer(); renderAll(); toast('Preferencias guardadas.');
    });
    const form = $('#modal-form');
    form.theme.value = state.settings.theme; form.accent.value = state.settings.accent; form.density.value = state.settings.density; form.font.value = state.settings.font;
    const syncAccent = () => { form.accent.disabled = form.theme.value !== 'dark'; };
    form.theme.onchange = syncAccent; syncAccent();
    form.reduce.checked = !!state.settings.reduceMotion;
    form.sound.checked = state.settings.sound !== false;
    form.notify.checked = !!state.settings.notify;
    $('#export-data').onclick = () => exportData();
    if ($('#clear-key')) $('#clear-key').onclick = () => { state.apiKey = ''; save(); closeModal(); toast('Clave eliminada de este navegador.'); };
    if ($('#restore-backup')) $('#restore-backup').onclick = restoreBackup;
    $('#export-deck').onclick = exportDeck;
    $('#import-file').onchange = (e) => { if (e.target.files[0]) importData(e.target.files[0]); };
    $('#import-csv').onchange = (e) => { if (e.target.files[0]) importCsv(e.target.files[0]); };
    $('#reset-data').onclick = async () => {
      if (!(await confirmDialog({ title: 'Borrar todo', message: 'Se borrarán tarjetas, sesiones y fechas.\nAntes se descargará una copia y se guardará otra en el navegador.', ok: 'Borrar todo', danger: true }))) return;
      exportData(true); snapshot('reset');
      try { localStorage.removeItem(KEY); LEGACY_KEYS.forEach((k) => localStorage.removeItem(k)); } catch { /* ignorar */ }
      exam = null; hydrate({}); closeModal(); applyPreferences(); resetTimer('focus'); renderAll(); toast('Datos borrados. Descargaste una copia y puedes restaurar la automática desde Ajustes ⚙️.');
    };
  }

  function changeFont(delta) { state.settings.fontSize = Math.min(21, Math.max(14, state.settings.fontSize + delta)); save(); applyPreferences(); }

  function maybeRemind() {
    if (state.settings.lastRemind === today()) return; // una vez al día, no en cada recarga
    state.settings.lastRemind = today(); save();
    const due = dueCards().length;
    const soon = state.deadlines.filter((d) => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 3);
    if (due) notify('Learny', `Tienes ${plural(due, 'tarjeta', 'tarjetas')} para hoy.`);
    soon.forEach((d) => notify('Learny', `Examen: ${d.title} en ${plural(daysUntil(d.date), 'día', 'días')}.`));
  }

  function backupNag() {
    const s = state.settings;
    if (state.cards.length < 10 || s.backupNag === today()) return;
    const last = s.lastExport;
    if (last && -daysUntil(last) < 14) return;
    s.backupNag = today(); save();
    setTimeout(() => toast('Hace tiempo que no descargas una copia. Ajustes ⚙️ → Descargar copia.'), 2500);
  }

  function fillTutor(silent = false) {
    state.settings.tutor = {
      subject: clean($('#tutor-subject').value, 60),
      level: clean($('#tutor-level').value, 40),
      known: clean($('#tutor-known').value, 400),
      goal: clean($('#tutor-goal').value, 200),
      style: $('#tutor-style').value, career: clean($('#tutor-career').value, 60), mode: $('#tutor-mode').value === 'direct' ? 'direct' : 'socratic'
    };
    save();
    if (!silent) toast('Contexto del tutor guardado.');
  }

  /* =========================================================
     Eventos
     ========================================================= */
  const LAZY = { library: () => renderLibrary(), planner: () => renderDeadlines(), analysis: () => renderAnalysis(), practice: () => renderTopics() };
  const renderPage = (page) => { const fn = LAZY[page]; if (fn) safe(fn, page); };
  const renderAll = () => {
    safe(redistributeIfBehind, 'plan'); safe(subjects, 'materias'); safe(renderFocus, 'Hoy'); safe(renderCard, 'tarjetas'); safe(renderTodayQueue, 'siguiente acción');
    renderPage(currentPage);
    document.dispatchEvent(new Event('learny:render'));
  };

  $$('[data-page]').forEach((b) => { b.onclick = () => showPage(b.dataset.page); });
  $$('.page-heading h1').forEach((h) => { h.tabIndex = -1; });
  $('#mini-timer').onclick = () => showPage('study');
  $('#exam-exit').onclick = () => { window.Learny.endExam(); toast('Saliste del examen. Tus respuestas quedaron guardadas.'); };
  $('#flashcard').onclick = (e) => {
    const k = e.target.closest('[data-empty]')?.dataset.empty; if (!k) return;
    if (k === 'create') cardForm();
    else if (k === 'ai') document.dispatchEvent(new Event('learny:gen-cards'));
    else if (k === 'deck') { showPage('library'); toast('Elige un mazo de ejemplo en «Biblioteca de temas».'); }
    else if (k === 'advance') { const next = state.cards.filter((c) => !c.archived && !c.corrupt && c.lastReviewed !== today()).sort((a, b) => a.nextReview.localeCompare(b.nextReview)).slice(0, 5); if (!next.length) return toast('Ya repasaste hoy todas tus tarjetas. ¡Buen trabajo!'); startExam(next, 5); }
  };
  $('#weak-topics').onclick = (e) => { const n = e.target.dataset.quizSubject; if (n) startSubjectQuiz(n); };
  $('#library-search').oninput = debounce(() => { libLimit = 40; renderLibrary(); }, 150);
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
  $('#card-archive').onclick = () => { if (!activeCard) return; const card = activeCard; card.archived = true; save(); renderAll(); offerUndo('Tarjeta enviada a la Biblioteca.', () => { card.archived = false; save(); renderAll(); }); };
  $('#feynman-feedback').onclick = feynman;
  $('#spin-roulette').onclick = () => spin();
  $('#settings-button').onclick = openSettings;
  $('#font-up').onclick = () => changeFont(1);
  $('#font-down').onclick = () => changeFont(-1);
  $('#export-report').onclick = exportReport;
  $('#stats-period').onchange = (e) => { state.settings.statsPeriod = e.target.value; save(); renderAnalysis(); };
  $('#save-tutor-context').onclick = () => fillTutor(false);
  $('#tutor-mode').onchange = () => { syncTutorMode(); fillTutor(true); toast($('#tutor-mode').value === 'direct' ? 'El tutor te dará explicaciones directas.' : 'El tutor te guiará con preguntas.'); };
  $('#clear-tutor-history').onclick = () => {
    const topic = chatTopic();
    state.chats = state.chats.filter((c) => c.topic.toLowerCase() !== topic.toLowerCase());
    save(); toast(`Historial de “${topic}” borrado.`);
  };
  $('#topic-search').oninput = debounce(renderTopics, 120);
  $('#topic-search').onkeydown = (e) => { if (e.key === 'Enter') $('#add-topic').click(); };
  $('#add-topic').onclick = () => { if (addTopic($('#topic-search').value)) { $('#topic-search').value = ''; renderTopics(); toast('Tema añadido a tu ruleta.'); } else toast('Escribe cualquier tema primero.', 'error'); };
  $('#suggest-topic').onclick = suggestTopic;
  $('#topic-results').onclick = (e) => {
    const del = e.target.closest('[data-delete-topic]'); if (del) { state.topics = state.topics.filter((t) => t.id !== del.dataset.deleteTopic); save(); renderTopics(); return; }
    const chip = e.target.closest('[data-topic]'); if (chip) spin(chip.dataset.topic);
  };
  $('#library-list').onclick = (e) => {
    if (e.target.id === 'library-more') { libLimit += 40; renderLibrary(); return; }
    const find = (attr) => state.cards.find((c) => c.id === e.target.dataset[attr]);
    const back = find('returnCard'); if (back) { back.archived = false; back.nextReview = today(); save(); renderAll(); toast('Tarjeta devuelta a la rotación.'); return; }
    const edit = find('editCard'); if (edit) { cardForm(edit); return; }
    const del = find('deleteCard'); if (del) deleteCard(del);
  };
  $('#deadline-list').onclick = (e) => {
    const id = e.target.dataset.deleteDeadline;
    const idx = id ? state.deadlines.findIndex((d) => d.id === id) : -1; if (idx < 0) return;
    const dl = state.deadlines[idx], removed = state.tasks.filter((t) => t.deadlineId === id);
    snapshot('delete-deadline');
    state.deadlines.splice(idx, 1);
    state.tasks = state.tasks.filter((t) => t.deadlineId !== id);
    save(); renderAll();
    offerUndo(`«${dl.title}» y sus tareas eliminadas.`, () => { state.deadlines.splice(Math.min(idx, state.deadlines.length), 0, dl); state.tasks.push(...removed); save(); renderAll(); });
  };
  $('#today-tasks').onchange = (e) => {
    const id = e.target.dataset.task; if (!id) return;
    const task = state.tasks.find((t) => t.id === id); if (!task) return;
    const was = task.done; task.done = e.target.checked;
    save(); renderAll();
    offerUndo(task.done ? 'Tarea completada.' : 'Tarea reabierta.', () => { task.done = was; save(); renderAll(); });
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
      // Solo una respuesta real de la IA se guarda y limpia la pregunta; si falla o se cancela, la pregunta se conserva.
      await gemini(socraticPrompt(query), 'Tutor Learny', () => localGuide(query), (answer) => {
        saveChat('user', query); saveChat('tutor', answer);
        $('#ai-question').value = ''; $('#ai-question').dispatchEvent(new Event('input'));
      });
      return;
    }
    const urls = { google: `https://www.google.com/search?q=${encodeURIComponent(query)}`, wikipedia: `https://es.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`, perplexity: `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}` };
    window.open(urls[engine], '_blank', 'noopener');
  };
  $('#ai-question').onkeydown = (e) => { if (e.key === 'Enter') $('#ask-ai').click(); };

  document.addEventListener('keydown', (e) => {
    if (modalOpen() || $('#confirm-modal').open || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (e.key.toLowerCase() === 'z' && undoRun) { e.preventDefault(); undoRun(); return; }
    if (e.key.toLowerCase() === 'p') { e.preventDefault(); startPomodoro(); return; }
    if (currentPage !== 'practice' || (!activeCard && !exam)) return;
    const shown = exam ? exam.revealed : revealed;
    if (e.key === ' ' && !shown) { if (t.closest?.('button, a, summary')) return; e.preventDefault(); revealCard(); return; }
    const map = { 1: 'again', 2: 'hard', 3: 'easy' };
    if ((exam ? exam.revealed : (revealed && !answered)) && map[e.key]) { e.preventDefault(); rateCard(map[e.key]); }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* sin PWA si se abre como archivo */ });
    let hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) toast('Learny se actualizó. Recarga la página para usar la última versión.'); hadController = true; });
  }

  const syncOnline = () => { const el = $('#offline-note'); if (el) el.hidden = navigator.onLine; };
  window.addEventListener('online', syncOnline); window.addEventListener('offline', syncOnline); syncOnline();

  window.Learny = { validDeadlineDate, MAX_PLAN_DAYS, isExam: () => !!exam, endExam: () => { if (exam && exam.i) state.exams.push({ date: today(), score: exam.score, total: exam.i }); exam = null; save(); renderAll(); document.dispatchEvent(new Event('learny:examend')); }, state, save, toast, modal, closeModal, today, addDays, uid, clean, esc, fmt, plural, daysUntil, dueCards, startExam, cardForm, normalizeCard, suggestCards: suggestCardsFromText, reviewCards, askGemini, gemini, rebuildTasks, addDeadline, renderAll, hasAi, cancelAi, showPage, subjectStats, overdueCards, weakSubject, startSubjectQuiz, calcStreak, announce, debounce, currentPage: () => currentPage, timerStarted: () => timer.started, timerRunning: () => timer.running };
  const savedTimer = (() => { try { return localStorage.getItem(TIMER_KEY); } catch { return null; } })();
  applyPreferences(); resetTimer('focus'); restoreTimer(savedTimer); renderAll(); maybeRemind(); backupNag();
  { const hash = location.hash.slice(1); if (['study', 'practice', 'library', 'planner', 'analysis', 'guide'].includes(hash)) showPage(hash); }
  if (migratedFrom) toast(`Learny actualizó tus datos de la v${migratedFrom} a la v${SCHEMA}. Guardé una copia previa: Ajustes ⚙️ → Restaurar copia automática.`);
  if (droppedCards) toast(`${plural(droppedCards, 'registro ilegible se omitió', 'registros ilegibles se omitieron')} al cargar tus tarjetas.`, 'error');
  if (loadProblem) toast('Tus datos guardados estaban dañados. Guardé una copia del archivo original en el navegador (learny.corrupt) y empecé de cero.', 'error');
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ok */ }
})();
