(() => {
  'use strict';

  /* Etapa 7: demo aislada. Se decide por la URL (?demo) antes de tocar ningún almacenamiento.
     En demo, `localStorage` (solo dentro de este archivo) es un almacén EN MEMORIA: ninguna clave real
     (learny.v3, .timer, .backup, .corrupt…) se lee, escribe ni borra, y recargar reinicia la demo. */
  const DEMO = /[?&]demo(?:[=&#]|$)/.test(location.search);
  const localStorage = (() => {
    if (DEMO) {
      const m = new Map();
      return { getItem: (k) => (m.has(String(k)) ? m.get(String(k)) : null), setItem: (k, v) => { m.set(String(k), String(v)); }, removeItem: (k) => { m.delete(String(k)); }, clear: () => m.clear() };
    }
    try { return window.localStorage; } catch { return null; }
  })();

  const KEY = 'learny.v3';
  const LEGACY_KEYS = ['learny.v2', 'learny.v1'];
  const BACKUP_KEY = 'learny.backup';
  const MAX_BACKUPS = 3;
  const DEFAULT_MODEL = 'gemini-flash-latest';
  const MAX_PROMPT = 9000;
  const MAX_INTERVAL = 180;
  const MAX_PLAN_DAYS = 730;
  const SCHEMA = 4;
  const TIMER_KEY = 'learny.timer';
  const MAX_REVIEWS = 5000;
  const MAX_CHATS = 20;
  const MIN_SAMPLE = 5; // con menos repasos no se afirma nada sobre una materia
  let rev = 0, currentPage = 'study', loadProblem = false, droppedCards = 0, migratedFrom = 0, lastSavedRaw = null, lastTimerRaw = null, corruptRaw = null, corruptKept = true, bootHold = false, saveErrorShown = false;
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
  const cleanNotes = (a) => (Array.isArray(a) ? a : []).map((x) => String(x == null ? '' : x).trim().slice(0, 140)).filter(Boolean).slice(0, 20); // notas de distracción
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
      theme: 'dark', accent: 'sky', accentCustom: '#5b84ff', density: 'normal', reduceMotion: false, immersiveDim: true, radius: 'soft', cardStyle: 'border', bgStyle: 'grid', headFont: 'serif', lineHeight: 'normal', letterSpacing: 'normal', cardText: 'normal', contentWidth: 'normal', sidebar: 'full', showMissions: true, showFact: true, engine: 'gemini', model: DEFAULT_MODEL, skipAi: false,
      recentTurns: [], statsPeriod: '30', dailyGoal: 2, notify: false, sound: true, name: '', proxyUrl: '', lastExport: '', backupNag: '',
      tutor: { subject: '', level: '', known: '', goal: '', style: 'uni', career: '', mode: 'socratic' }, lastRemind: '', welcomed: false
    },
    notes: [], feynman: [], decks: [], planLog: [], sessions: [], cards: [], deadlines: [], reviews: [], topics: [], tasks: [], chats: [], exams: [], apiKey: '', drafts: {}
  });
  const state = defaults();
  /* Etapa 5: ¿hay algo que el usuario ya haya creado o configurado? (función hoisted: se usa al cargar, antes de isNewUser) */
  function hasUserData() {
    const s = state.settings || {}, t = s.tutor || {};
    return ['cards', 'sessions', 'deadlines', 'reviews', 'notes', 'feynman', 'decks', 'topics', 'tasks', 'planLog', 'chats', 'exams'].some((k) => Array.isArray(state[k]) && state[k].length > 0)
      || !!(s.name || t.subject || t.goal || t.level || t.known || t.career || s.proxyUrl || s.lastExport || state.apiKey)
      || (state.drafts && typeof state.drafts === 'object' && Object.keys(state.drafts).length > 0);
  }
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
    easeFactor: Math.min(4, Math.max(1.3, Number(c.easeFactor ?? c.ease) || 2.5)),
    interval: Math.min(365, Math.max(0, Number(c.interval) || 0)),
    repetitions: Math.min(1000, Math.max(0, Number(c.repetitions ?? c.reps) || 0)),
    history: Array.isArray(c.history) ? c.history.filter((h) => isObj(h) && typeof h.rating === 'string').slice(-40) : []
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
    s.fontSize = num(s.fontSize, 13, 24, d.fontSize); s.dailyGoal = num(s.dailyGoal, 1, 12, d.dailyGoal);
    const pick = (v, list, def) => (list.includes(v) ? v : def);
    s.theme = pick(s.theme, ['auto', 'dark', 'oled', 'light', 'sepia', 'contrast'], 'dark'); s.font = pick(s.font, ['sans', 'humanist', 'serif', 'rounded', 'mono', 'dyslexic'], 'sans');
    s.headFont = pick(s.headFont, ['serif', 'same'], 'serif'); s.radius = pick(s.radius, ['sharp', 'soft', 'round'], 'soft'); s.cardStyle = pick(s.cardStyle, ['border', 'shadow'], 'border'); s.bgStyle = pick(s.bgStyle, ['grid', 'dots', 'plain'], 'grid');
    s.lineHeight = pick(s.lineHeight, ['compact', 'normal', 'roomy'], 'normal'); s.letterSpacing = pick(s.letterSpacing, ['normal', 'wide', 'wider'], 'normal'); s.cardText = pick(s.cardText, ['normal', 'large', 'xlarge'], 'normal');
    s.contentWidth = pick(s.contentWidth, ['narrow', 'normal', 'wide'], 'normal'); s.sidebar = pick(s.sidebar, ['full', 'icons'], 'full');
    s.accentCustom = typeof s.accentCustom === 'string' && /^#[0-9a-f]{6}$/i.test(s.accentCustom) ? s.accentCustom.toLowerCase() : d.accentCustom;
    s.accent = pick(s.accent, ['mint', 'violet', 'amber', 'sky', 'rose', 'custom'], 'sky'); s.density = pick(s.density, ['normal', 'compact', 'roomy'], 'normal');
    s.statsPeriod = pick(s.statsPeriod, ['7', '30', 'all'], '30');
    s.engine = pick(s.engine, ['gemini', 'local', 'google', 'wikipedia', 'perplexity'], 'gemini');
    ['reduceMotion', 'immersiveDim', 'notify', 'sound', 'skipAi', 'showMissions', 'showFact', 'welcomed'].forEach((k) => { s[k] = typeof s[k] === 'boolean' ? s[k] : d[k]; });
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
    ['sessions', 'cards', 'deadlines', 'reviews', 'topics', 'tasks', 'chats', 'exams', 'notes', 'feynman', 'decks', 'planLog'].forEach((k) => {
      if (!Array.isArray(state[k])) state[k] = [];
    });
    if (!Array.isArray(state.settings.recentTurns)) state.settings.recentTurns = [];
    const rawCards = state.cards;
    state.cards = rawCards.filter((c) => c && typeof c === 'object' && !Array.isArray(c)).map(normalizeCard);
    droppedCards += rawCards.length - state.cards.length;
    state.sessions = state.sessions.filter((s) => s && /^\d{4}-\d{2}-\d{2}$/.test(s.date)).map((s) => ({
      ...s, id: s.id || uid(), minutes: Number(s.minutes) || 0, energy: s.energy ? Number(s.energy) : null,
      label: String(s.label || s.subject || ''), achieved: typeof s.achieved === 'boolean' ? s.achieved : null,
      abandon: s.abandon || null, intention: String(s.intention || ''), distractions: cleanNotes(s.distractions)
    }));
    state.deadlines = state.deadlines.filter((d) => d && d.title && /^\d{4}-\d{2}-\d{2}$/.test(d.date)).map((d) => ({
      id: d.id || uid(), title: String(d.title), subject: String(d.subject || ''), date: d.date,
      difficulty: num(d.difficulty, 1, 5, 3), dailyMinutes: num(d.dailyMinutes, 15, 240, 45), skipped: num(d.skipped, 0, 999, 0),
      debtMin: d.debtMin == null ? num(d.skipped, 0, 999, 0) * num(d.dailyMinutes, 15, 240, 45) : num(d.debtMin, 0, 240000, 0)
    }));
    state.decks = state.decks.filter((d) => d && typeof d.name === 'string' && Array.isArray(d.cards));
    const dayOf = (x) => /^\d{4}-\d{2}-\d{2}$/.test(String(x));
    const taskRef = (m) => ({ phase: String(m?.phase || '').slice(0, 20), from: dayOf(m?.from) ? m.from : today() });
    state.planLog = state.planLog.filter((e) => e && dayOf(e.date)).slice(-30).map((e) => ({
      id: e.id || uid(), date: e.date, deadlineId: String(e.deadlineId || ''), title: String(e.title || '').slice(0, 80), kind: e.kind === 'replan' ? 'replan' : 'late',
      minutes: num(e.minutes, 0, 240, 0), moved: arr(e.moved).slice(0, 10).map(taskRef), dropped: arr(e.dropped).slice(0, 40).map(taskRef)
    }));
    state.topics = state.topics.filter((t) => t && t.name).map((t) => ({ id: t.id || uid(), name: String(t.name), category: String(t.category || 'Personal') }));
    state.reviews = state.reviews.filter((r) => r && r.date).slice(-MAX_REVIEWS);
    state.tasks = state.tasks.filter((t) => t && t.deadlineId && t.date).map((t) => ({
      id: t.id || uid(), deadlineId: t.deadlineId, date: t.date, phase: t.phase || 'comprension',
      title: String(t.title || ''), done: !!t.done, cardTarget: Number(t.cardTarget) || 0
    }));
    const liveDl = new Set(state.deadlines.map((d) => d.id)); state.tasks = state.tasks.filter((t) => liveDl.has(t.deadlineId)); // sin fecha no hay tarea
    state.chats = state.chats.filter((c) => c && c.topic).slice(-MAX_CHATS).map((c) => ({
      topic: String(c.topic).slice(0, 60), messages: Array.isArray(c.messages) ? c.messages.slice(-20) : []
    }));
  }

  /* Fase 1: acceso a localStorage siempre protegido (puede ser null o lanzar) y copias automáticas ROTATIVAS (las últimas MAX_BACKUPS, de la más nueva a la más vieja). */
  const store = {
    get(k) { try { return localStorage ? localStorage.getItem(k) : null; } catch { return null; } },
    set(k, v) { try { if (!localStorage) return false; localStorage.setItem(k, v); return true; } catch { return false; } },
    del(k) { try { if (localStorage) localStorage.removeItem(k); } catch { /* ignorar */ } }
  };
  function readBackups() {
    const p = parseJSON(store.get(BACKUP_KEY));
    const list = Array.isArray(p) ? p : (p && typeof p === 'object' ? [p] : []); // acepta el formato antiguo (una sola copia)
    return list.filter((b) => b && typeof b === 'object' && b.data && typeof b.data === 'object').slice(0, MAX_BACKUPS);
  }
  function pushBackup(reason, data) {
    const entry = { at: new Date().toISOString(), reason, data };
    let list = [entry, ...readBackups()].slice(0, MAX_BACKUPS);
    while (list.length) { // si no cabe, se descartan las copias más viejas (nunca el archivo dañado ni tus datos)
      if (store.set(BACKUP_KEY, JSON.stringify(list))) return true;
      list = list.slice(0, -1);
    }
    return false;
  }
  function snapshot(reason) {
    const { apiKey, chats, ...safe } = state;
    return pushBackup(reason, safe);
  }

  /* Etapa 7: datos de ejemplo, creados en código y relativos a hoy. Se escriben solo en el almacén en memoria y pasan por load()/hydrate() como cualquier copia. */
  function seedDemo() {
    const off = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return dateStr(d); };
    const Q = { again: 1, hard: 3, easy: 5 };
    const mk = (i, subject, question, answer, next, last, ease, interval, reps, hist) => ({
      id: `demo-c${i}`, subject, question, answer, nextReview: off(next), lastReviewed: last == null ? null : off(last),
      archived: false, origin: '', easeFactor: ease, interval, repetitions: reps,
      history: hist.map(([d, r]) => ({ date: off(d), rating: r, quality: Q[r] }))
    });
    const cards = [
      mk(1, 'Biología', '¿Qué orgánulo produce la mayor parte del ATP en la célula?', 'La mitocondria, mediante la respiración celular.', -2, -8, 2.5, 6, 2, [[-14, 'easy'], [-8, 'easy']]),
      mk(2, 'Biología', '¿Qué ocurre en la fase luminosa de la fotosíntesis?', 'La luz se convierte en energía química (ATP y NADPH) y se libera O₂.', -1, -7, 2.36, 6, 2, [[-13, 'hard'], [-7, 'easy']]),
      mk(3, 'Biología', '¿Cuál es la diferencia entre mitosis y meiosis?', 'La mitosis da 2 células idénticas; la meiosis da 4 células con la mitad de cromosomas.', 0, -1, 2.18, 1, 1, [[-1, 'again'], [-1, 'hard']]),
      mk(4, 'Biología', '¿Qué es el ADN y dónde se encuentra en una célula eucariota?', 'La molécula que guarda la información genética; está sobre todo en el núcleo.', 4, -2, 2.6, 6, 2, [[-8, 'easy'], [-2, 'easy']]),
      mk(5, 'Biología', '¿Qué función tiene el ribosoma?', 'Sintetizar proteínas a partir del ARN mensajero.', 9, -5, 2.7, 14, 3, [[-19, 'easy'], [-12, 'easy'], [-5, 'easy']]),
      mk(6, 'Historia', '¿En qué año comenzó la Revolución Francesa?', '1789, con la toma de la Bastilla el 14 de julio.', -3, -9, 2.2, 1, 1, [[-10, 'again'], [-9, 'hard']]),
      mk(7, 'Historia', '¿Qué fue el Tratado de Versalles (1919)?', 'El acuerdo que puso fin a la Primera Guerra Mundial e impuso duras condiciones a Alemania.', 0, -4, 2.04, 1, 0, [[-6, 'again'], [-4, 'again']]),
      mk(8, 'Historia', '¿Qué causó la caída del Imperio romano de Occidente?', 'Varias causas: crisis económica, presión de pueblos germánicos y debilidad política (476 d. C.).', 0, null, 2.5, 0, 0, []),
      mk(9, 'Historia', '¿Qué fue la Guerra Fría?', 'Una rivalidad política e ideológica entre EE. UU. y la URSS, sin combate directo entre ambos.', 3, -3, 2.5, 6, 2, [[-9, 'hard'], [-3, 'easy']]),
      mk(10, 'Inglés', '¿Cuál es el pasado simple de «go»?', '«Went».', -1, -7, 2.5, 6, 2, [[-13, 'easy'], [-7, 'easy']]),
      mk(11, 'Inglés', 'Completa: «If I ___ more time, I would travel.»', '«had» (segundo condicional).', 5, -1, 2.6, 6, 2, [[-7, 'easy'], [-1, 'easy']]),
      mk(12, 'Inglés', '¿Qué significa «although»?', 'Aunque / a pesar de que.', 12, -10, 2.7, 22, 4, [[-30, 'easy'], [-22, 'easy'], [-14, 'easy'], [-10, 'easy']]),
      mk(13, 'Inglés', '¿Cuándo se usa el present perfect?', 'Para acciones pasadas con relación al presente: «I have lived here for 3 years».', 0, null, 2.5, 0, 0, [])
    ];
    const pattern = [['Biología', 'easy'], ['Historia', 'again'], ['Inglés', 'easy'], ['Biología', 'hard'], ['Historia', 'hard'], ['Inglés', 'easy'], ['Biología', 'easy'], ['Historia', 'again']];
    const first = { Biología: 1, Historia: 6, Inglés: 10 };
    const reviews = [];
    for (let d = 12; d >= 1; d--) for (let k = 0; k < 2 + (d % 3); k++) {
      const [subject, rating] = pattern[(d * 3 + k) % pattern.length];
      reviews.push({ date: off(-d), cardId: `demo-c${first[subject] + (k % 3)}`, subject, rating, quality: Q[rating] });
    }
    const ses = (n, date, minutes, intention, label, energy, achieved) => ({ id: `demo-s${n}`, date: off(date), minutes, intention, label, energy, abandon: null, achieved, distractions: [] });
    const sessions = [
      ses(1, -5, 25, 'Repasar la fotosíntesis', 'Biología', 4, true), ses(2, -4, 25, 'Línea de tiempo de la Revolución Francesa', 'Historia', 3, true),
      ses(3, -3, 25, 'Verbos irregulares', 'Inglés', 4, true), ses(4, -2, 25, 'Mitosis y meiosis', 'Biología', 3, false),
      ses(5, -1, 25, 'Tratado de Versalles', 'Historia', 2, true)
    ];
    const deadlines = [{ id: 'demo-d1', title: 'Parcial de Biología', subject: 'Biología', date: off(9), difficulty: 3, dailyMinutes: 40, skipped: 0, debtMin: 0 }];
    const data = {
      version: SCHEMA,
      settings: { name: 'Ejemplo', welcomed: true, engine: 'local', skipAi: true, sound: false, notify: false, proxyUrl: '', lastRemind: off(0), backupNag: off(0), tutor: { subject: 'Biología', goal: 'Aprobar el parcial', mode: 'socratic' } },
      cards, reviews, sessions, deadlines, topics: [{ id: 'demo-t1', name: 'Biología', category: 'Ciencias' }], apiKey: ''
    };
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* en memoria: no falla */ }
  }
  if (DEMO) seedDemo();

  (function load() {
    let merged = {};
    try {
      LEGACY_KEYS.slice().reverse().forEach((k) => { const p = parseJSON(localStorage.getItem(k)); if (p && typeof p === 'object') merged = { ...merged, ...p, settings: { ...(merged.settings || {}), ...(p.settings || {}) } }; });
      const rawCurrent = localStorage.getItem(KEY), current = parseJSON(rawCurrent);
      if (rawCurrent && !current) { loadProblem = true; corruptRaw = rawCurrent; corruptKept = store.set('learny.corrupt', rawCurrent); }
      if (current && typeof current === 'object') merged = { ...merged, ...current, settings: { ...(merged.settings || {}), ...(current.settings || {}) } };
    } catch { /* estado nuevo */ }
    if (Object.keys(merged).length && !(Number(merged.version) >= SCHEMA)) {
      const { apiKey, chats, ...safe } = merged; pushBackup(`migración desde v${Number(merged.version) || 1}`, safe);
    }
    bootHold = loadProblem && !corruptKept; // datos dañados sin copia: ningún guardado automático del arranque pisa la clave principal
    hydrate(merged);
    // Etapa 5: quien ya tiene datos (o cuyo archivo estaba dañado) nunca verá la bienvenida; se marca una vez y se guarda al final del arranque.
    if (!state.settings.welcomed && (loadProblem || hasUserData())) state.settings.welcomed = true;
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
    if (DEMO) { el.textContent = 'Demo: no se guarda'; el.classList.remove('bad'); return; }
    el.textContent = ok ? `Guardado ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}` : 'No guardado';
    el.classList.toggle('bad', !ok);
  }
  const save = () => {
    if (bootHold) return true;
    rev++;
    if (state.reviews.length > MAX_REVIEWS + 200) state.reviews.splice(0, state.reviews.length - MAX_REVIEWS);
    let json = null;
    try { json = JSON.stringify(state); localStorage.setItem(KEY, json); lastSavedRaw = json; setSaved(true); saveErrorShown = false; return true; }
    catch {
      try { // almacenamiento lleno: se van soltando copias automáticas (de la más vieja a la más nueva) antes de perder tus datos nuevos; learny.corrupt NO se toca
        if (json && localStorage) {
          let list = readBackups();
          while (list.length) { list = list.slice(0, -1); if (list.length) store.set(BACKUP_KEY, JSON.stringify(list)); else store.del(BACKUP_KEY); try { localStorage.setItem(KEY, json); lastSavedRaw = json; setSaved(true); saveErrorShown = false; return true; } catch { /* sigue */ } }
          localStorage.setItem(KEY, json); lastSavedRaw = json; setSaved(true); saveErrorShown = false; return true;
        }
      } catch { /* sigue */ }
      setSaved(false);
      if (!saveErrorShown) { saveErrorShown = true; toast('No se pudo guardar: el navegador bloqueó el almacenamiento o está lleno. Descarga una copia en Ajustes ⚙️.', 'error'); }
      return false; }
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
    const el = $('#toast'), isErr = type === 'error';
    el.setAttribute('role', isErr ? 'alert' : 'status'); el.setAttribute('aria-live', isErr ? 'assertive' : 'polite'); // los errores se anuncian de inmediato
    undoRun = action ? action.run : null;
    el.className = `toast show ${type}`; // primero se hace visible y luego se escribe el texto: los lectores de pantalla solo anuncian cambios en regiones visibles
    clearTimeout(toast.fillId);
    toast.fillId = setTimeout(() => {
      el.textContent = message;
      if (action) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'toast-action'; b.textContent = action.label; b.setAttribute('aria-keyshortcuts', 'z'); b.title = 'Atajo: Z';
        b.onclick = action.run; el.append(' ', b);
      }
    }, 40);
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
    applySessionMode();
    if (changed) { window.scrollTo(0, 0); $(`#${page} h1`)?.focus({ preventScroll: true }); }
    renderPage(page);
    renderTimer();
    document.dispatchEvent(new Event('learny:page'));
  }

  let modalCloseHandler = null, rouletteId = null, modalTeardown = null;
  const runTeardown = () => { const t = modalTeardown; modalTeardown = null; if (t) { try { t(); } catch (e) { console.error(e); } } }; // limpieza que se ejecuta al cerrar O al reemplazar el diálogo
  const modalOpen = () => $('#app-modal').open;
  const closeModal = () => { if (modalOpen()) $('#app-modal').close(); };
  /* Foco: al abrir una ventana se recuerda qué la abrió y al cerrarla el foco vuelve ahí (si ese botón se redibujó, se busca su equivalente). */
  let modalOpener = null;
  const openerSelector = (el) => {
    if (el.id) return `#${el.id}`;
    const a = [...el.attributes].find((x) => x.name.startsWith('data-'));
    return a ? `${el.tagName.toLowerCase()}[${a.name}="${a.value.replace(/"/g, '\\"')}"]` : '';
  };
  const shown = (el) => !!el && el.isConnected && el.getClientRects().length > 0;
  function restoreOpenerFocus() {
    const o = modalOpener; modalOpener = null; if (!o) return;
    const ae = document.activeElement;
    if (ae && ae !== document.body && shown(ae)) return; // el navegador ya devolvió el foco
    let el = shown(o.el) ? o.el : (o.sel ? document.querySelector(o.sel) : null);
    if (!shown(el)) el = $('.page.active h1');
    el?.focus({ preventScroll: true });
  }
  function modal(html, onSubmit, onClose) {
    const dialog = $('#app-modal'), form = $('#modal-form');
    runTeardown();
    if (!dialog.open) { const ae = document.activeElement; modalOpener = ae && ae !== document.body ? { el: ae, sel: openerSelector(ae) } : null; }
    $('#modal-body').innerHTML = html;
    $('#modal-body').removeAttribute('aria-live');
    modalCloseHandler = onClose || null;
    form.onsubmit = (event) => { event.preventDefault(); onSubmit ? onSubmit(new FormData(form)) : closeModal(); };
    if (!dialog.open) dialog.showModal();
    const body = $('#modal-body'), h = body.querySelector('h2');
    if (h) { h.id = 'modal-title'; h.tabIndex = -1; dialog.setAttribute('aria-labelledby', 'modal-title'); dialog.removeAttribute('aria-label'); }
    else { dialog.removeAttribute('aria-labelledby'); dialog.setAttribute('aria-label', 'Ventana de Learny'); }
    // Foco inicial: primer campo (en táctil, el título, para no abrir el teclado virtual), si no, el botón principal
    const coarse = window.matchMedia?.('(pointer: coarse)').matches;
    const field = coarse ? null : [...body.querySelectorAll('input:not([type=hidden]):not([type=file]),textarea,select')].find((e) => !e.disabled && !e.closest('details:not([open])'));
    (field || (coarse ? h : body.querySelector('.primary-button,.danger-button')) || h)?.focus({ preventScroll: true });
  }
  $('#app-modal').addEventListener('close', () => {
    if (modalOpen()) return; // se reabrió antes de que llegara el evento: no cancelar la IA ni ejecutar el onClose de la ventana nueva
    runTeardown();
    clearInterval(rouletteId); rouletteId = null; cancelAi();
    const handler = modalCloseHandler; modalCloseHandler = null; handler?.();
    if (!modalOpen() && !$('#confirm-modal').open) restoreOpenerFocus();
  });
  $('.modal-close').onclick = closeModal;
  $('#app-modal').addEventListener('click', (e) => { if (e.target.closest('[data-close-modal]')) closeModal(); });

  function beep() {
    try {
      if (state.settings.sound !== false && !DEMO) {
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
    if (DEMO || !state.settings.notify || typeof Notification === 'undefined') return;
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

  function rebuildTasks(deadline, keepDone = true, fromToday = false) {
    const doneMap = {};
    if (keepDone) state.tasks.filter((t) => t.deadlineId === deadline.id && t.done && (!fromToday || t.date >= today())).forEach((t) => { doneMap[t.date] = true; });
    state.tasks = state.tasks.filter((t) => t.deadlineId !== deadline.id || (fromToday && t.date < today())); // fromToday conserva lo anterior a hoy
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

  const phaseLabel = (id) => PHASES.find((p) => p.id === id)?.label || id;
  const shortDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  const hrs = (min) => (min / 60).toFixed(1);

  /* Si te atrasas: se mueven a hoy las 2 tareas atrasadas más recientes de cada examen y se descartan las anteriores.
     Cada cambio queda registrado (state.planLog) y se explica en Planificar; lo descartado se cuenta en deadline.skipped. */
  function redistributeIfBehind() {
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
    if (!moved && !dropped) return;
    state.planLog = state.planLog.slice(-30);
    save();
    toast(`Plan reajustado: moví ${plural(moved, 'tarea atrasada', 'tareas atrasadas')} a hoy${dropped ? ` y descarté ${plural(dropped, 'tarea', 'tareas')} que ya no cabían` : ''}. El detalle está en Planificar → Cambios en tu plan.`);
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
    if (r.fits) return `✔ Cabe: quedan ${hrs(r.needed)} h de trabajo y hay ${hrs(r.available)} h disponibles hasta el examen.`;
    return `⚠ Ya no cabe a este ritmo: quedan ${hrs(r.needed)} h de trabajo (${plural(r.open, 'sesión pendiente', 'sesiones pendientes')}${r.skipped ? ` y ${plural(r.skipped, 'descartada', 'descartadas')}` : ''}) y solo hay ${hrs(r.available)} h hasta el examen. ${r.canFix ? `Con ${r.need} min/día sí cabe.` : 'Ni con 240 min/día cabe: cambia la fecha o recorta el temario.'}`;
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
      <p class="modal-tip">Ahora: ${d.dailyMinutes} min/día. ${esc(loadMessage(r))}</p>
      <button class="primary-button">Replanificar</button>`, (data) => {
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
      offerUndo(absorbs ? 'Plan recalculado.' : `Plan recalculado, pero con ${d.dailyMinutes} min/día aún no cabe todo lo pendiente (harían falta ≈ ${Math.ceil(rr.needed / rr.days / 5) * 5}).`, () => {
        d.dailyMinutes = before.mins; d.skipped = before.skipped; d.debtMin = before.debt;
        state.tasks = state.tasks.filter((t) => t.deadlineId !== d.id).concat(before.tasks);
        state.planLog = state.planLog.filter((e) => e.id !== entry.id); save(); renderAll();
      });
    });
  }

  function pendingHours(deadline) {
    const left = state.tasks.filter((t) => t.deadlineId === deadline.id && !t.done);
    return (left.length * deadline.dailyMinutes) / 60;
  }

  function renderDeadlines() {
    redistributeIfBehind(); renderPlanLog();
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
      return `<div class="session-item"><b>${esc(x.title)}</b> ${tag}<br><span>${esc(x.subject)} · ${esc(x.date)} · dificultad ${x.difficulty}/5 · ${x.dailyMinutes} min/día<br>${done}/${total} tareas · fases: comprensión → práctica → repaso → simulacro → revisión</span>${d >= 0 ? `<br><span class="plan-load ${loadReport(x).fits ? 'ok' : 'warn'}">${esc(loadMessage(loadReport(x)))}</span>` : ''}<br>${d >= 0 ? `<button class="text-button" data-replan="${esc(x.id)}" type="button">Replanificar desde hoy</button> ` : ''}<button class="text-button danger" data-delete-deadline="${esc(x.id)}" type="button">Eliminar</button></div>`;
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
  }

  function tick() {
    timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    renderTimer(); if (timer.remaining <= 0) finishPhase();
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
      if (!intention) { toast('Escribe un resultado concreto antes de empezar.', 'error'); showPage('study'); newUserPomo = true; applySessionMode(); $('#intention-input').focus(); return; }
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
    undoRun = null; // las acciones de deshacer apuntan a objetos que ya no son los actuales
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
      exam = null; undoRun = null; lastSavedRaw = null; hydrate({}); applyPreferences(); resetTimer('focus', false); renderAll();
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
    const due = dueCards(), by = {};
    state.cards.filter((c) => !c.archived && !c.corrupt).forEach((c) => { by[c.subject] = by[c.subject] || { name: c.subject, n: 0, due: 0 }; by[c.subject].n++; });
    due.forEach((c) => { if (by[c.subject]) by[c.subject].due++; });
    return Object.values(by).sort((a, b) => b.due - a.due || b.n - a.n).slice(0, 8);
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
    const act = [...state.sessions.filter((x) => !x.abandon).map((x) => x.date), ...state.reviews.map((x) => x.date)].filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().pop(), gap = act ? -daysUntil(act) : 0;
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

  const cardCtl = () => { const ae = document.activeElement; return !!ae && (ae.id === 'reveal-card' || ae.id === 'exam-exit' || $('#rating-row').contains(ae)); };
  function settleCardFocus(had) { // si el botón que tenía el foco se oculta, el foco pasa al siguiente control útil
    if (!had) return;
    const ae = document.activeElement;
    if (ae && ae !== document.body && shown(ae)) return;
    (!$('#rating-row').hidden ? $('#rating-row button') : !$('#reveal-card').hidden ? $('#reveal-card') : $('#flashcard')).focus({ preventScroll: true });
  }
  function renderCard() { const had = cardCtl(); try { renderCardBody(); } finally { settleCardFocus(had); } }
  function renderExam() { const had = cardCtl(); try { renderExamBody(); } finally { settleCardFocus(had); } }
  function renderCardBody() {
    applySessionMode();
    if (exam) return renderExam();
    const due = dueCards(), prev = activeCard, wasRevealed = revealed && !answered;
    activeCard = due[0] || null;
    if ((prev?.id ?? null) !== (activeCard?.id ?? null)) document.dispatchEvent(new Event('learny:cardchange')); // otra tarjeta: se limpia lo que escribiste para la anterior
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
    const had = cardCtl();
    revealed = true;
    $('#flashcard').innerHTML = `<div><small>Pregunta</small><br>${esc(activeCard.question)}<hr><small>Respuesta</small><br>${esc(activeCard.answer)}</div>`;
    $('#reveal-card').hidden = true; $('#rating-row').hidden = false;
    settleCardFocus(had);
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

  function renderExamBody() {
    applySessionMode();
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
      { const r = state.exams[state.exams.length - 1]; showClosure('exam', { score: r.score, total: r.total }); }
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
      if (card) { // se busca por id al guardar: el estado pudo reemplazarse (otra pestaña) mientras el formulario estaba abierto
        const target = state.cards.find((c) => c.id === card.id);
        if (!target) { closeModal(); return toast('Esa tarjeta ya no existe (otra pestaña la cambió). No se guardaron los cambios.', 'error'); }
        Object.assign(target, values, { corrupt: false });
      } else state.cards.push(normalizeCard({ ...values, nextReview: today() }));
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
    const map = Object.create(null); // sin prototipo: una materia llamada «constructor» ya no rompe nada
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
  const hasAi = () => !DEMO && !!(state.apiKey || state.settings.proxyUrl); // Etapa 7: la demo nunca usa IA
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
      }).catch((e) => { if (e.name === 'AbortError') throw e; throw new Error('No hay conexión o el servicio no respondió. Puedes usar las preguntas guía locales.'); }); // solo un fallo de red se presenta como «sin conexión»
      let data = {}; try { data = await response.json(); } catch { /* sin cuerpo */ }
      if (!response.ok) {
        const raw = data.error?.message || `Error ${response.status}`;
        if (response.status === 401 || response.status === 403 || (response.status === 400 && /api[ _-]?key/i.test(raw))) throw new Error(`${who} no es válido o no tiene permiso. (${raw})`);
        if (response.status === 400) throw new Error(`La consulta no es válida. (${raw})`);
        if (response.status === 404) throw new Error(`El modelo “${model}” no existe. Cámbialo en Ajustes ⚙️. (${raw})`);
        if (response.status === 429) throw new Error('Se agotó la cuota de la IA. Espera un rato e inténtalo de nuevo.');
        throw new Error(raw);
      }
      const out = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
      if (!out) throw new Error(data.candidates?.[0]?.finishReason === 'MAX_TOKENS' ? 'La IA agotó su límite de respuesta antes de escribir. Prueba otro modelo en Ajustes ⚙️ o una pregunta más corta.' : 'La IA no devolvió texto para esta consulta.');
      return out;
    } catch (error) {
      if (error.name === 'AbortError') { const e = new Error(timedOut ? 'La IA tardó demasiado. Inténtalo de nuevo.' : 'Consulta cancelada.'); e.cancelled = !timedOut; e.stale = !!controller.stale; throw e; }
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
    if (DEMO) { toast('La demostración no usa IA: tienes la guía local.'); state.settings.skipAi = true; return onLocal(); } // Etapa 7
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
      if (!state.settings.skipAi) return new Promise((resolve) => requestKey(async () => resolve(await gemini(prompt, title, fallback, onDone)), () => resolve(showLocal('Modo local activo.'))));
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
      ? { question: `Completa: ${sentence.split(word).join('_____').slice(0, 400)}`, answer: `${word}. ${sentence}`.slice(0, 1200) }
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
      body.querySelectorAll('.review-card').forEach((f) => f.classList.toggle('discarded', !!f.querySelector('input[value="discard"]:checked')));
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
    reviewCards(items, { topic: topic || 'Feynman', source: text.replace(/\*\*/g, ''), origin: opts.origin || '', intro: `Detecté ${parts.length} ideas en el texto sobre ${topic || 'el tema'}. Corrige y acepta las que te sirvan.` });
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

  /* ===== Apariencia (v16): solo estilos; nunca toca los campos de texto del tutor ===== */
  let liveSettings = null;
  const THEME_META = { dark: '#0e1220', oled: '#000000', light: '#f4f5fa', sepia: '#302a20', contrast: '#000000' };
  const SURF = { dark: ['#171d38', '#202850', '#232d5e'], oled: ['#0b0b0f', '#16161d', '#1b1f3a'], light: ['#ffffff', '#eceff7', '#e3e8fb'] }; // surface, surface2, tag-bg
  const ACCENTS = {
    dark: { mint: ['#a7f3d0', '#46c793'], violet: ['#c4b5fd', '#8b5cf6'], amber: ['#fcd34d', '#f59e0b'], sky: ['#9db8ff', '#5b84ff'], rose: ['#fda4af', '#f43f5e'] },
    light: { sky: ['#2748c4', '#2748c4'], mint: ['#0a744e', '#0a744e'], violet: ['#5b34d6', '#5b34d6'], amber: ['#8a5200', '#8a5200'], rose: ['#b81d3f', '#b81d3f'] }
  };
  const DARK_ON = '#0b1230';
  const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lumOf = (h) => { const [r, g, b] = rgbOf(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const contrast = (a, b) => { const x = lumOf(a), y = lumOf(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const mixHex = (a, b, t) => { const p = rgbOf(a), q = rgbOf(b); return `#${p.map((v, i) => Math.round(v + (q[i] - v) * t).toString(16).padStart(2, '0')).join('')}`; };
  const onAccentFor = (c) => (contrast(c, '#ffffff') >= contrast(c, DARK_ON) ? '#ffffff' : DARK_ON);
  /* Acento personalizado: se mezcla con blanco (temas oscuros) o negro (claro) hasta llegar a 4,5:1 sobre las superficies y con su texto. */
  function fitAccent(hex, theme) {
    const bgs = SURF[theme] || SURF.dark, to = theme === 'light' ? '#000000' : '#ffffff';
    for (let i = 0; i <= 50; i++) { const c = mixHex(hex, to, i / 50); if (bgs.every((b) => contrast(c, b) >= 4.5) && contrast(c, onAccentFor(c)) >= 4.5) return c; }
    return to;
  }
  const resolveTheme = (t) => (t === 'auto' ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : t);
  function applyAppearance(s = state.settings) {
    liveSettings = s;
    const root = document.documentElement, b = document.body, th = resolveTheme(s.theme);
    root.style.setProperty('--base', `${(s.fontSize / 16) * 100}%`); // porcentaje: respeta el tamaño de texto del navegador
    const acc = s.accent === 'custom' ? (() => { const c = fitAccent(s.accentCustom, th); return [c, c]; })() : ((th === 'light' ? ACCENTS.light : ACCENTS.dark)[s.accent] || ACCENTS.dark.sky);
    root.style.setProperty('--accent', acc[0]); root.style.setProperty('--accent2', acc[1]); root.style.setProperty('--on-accent', onAccentFor(acc[0]));
    const R = { sharp: ['2px', '2px'], soft: ['14px', '9px'], round: ['24px', '16px'] }[s.radius] || ['14px', '9px'];
    root.style.setProperty('--r-card', R[0]); root.style.setProperty('--r-ctl', R[1]); root.style.setProperty('--radius', R[0]);
    ['light', 'oled', 'sepia', 'contrast'].forEach((t) => b.classList.toggle(`theme-${t}`, th === t));
    root.style.colorScheme = th === 'light' ? 'light' : 'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_META[th] || THEME_META.dark);
    Object.assign(b.dataset, { density: s.density || 'normal', cards: s.cardStyle, bg: s.bgStyle, font: s.font, headfont: s.headFont, lh: s.lineHeight, ls: s.letterSpacing, cardtext: s.cardText, width: s.contentWidth, sidebar: s.sidebar });
    b.classList.toggle('font-dyslexic', s.font === 'dyslexic'); b.classList.toggle('reduce-motion', !!s.reduceMotion);
    b.classList.toggle('no-dim', s.immersiveDim === false); b.classList.toggle('hide-missions', !s.showMissions); b.classList.toggle('hide-fact', !s.showFact);
    $$('.sidebar .nav-button').forEach((btn) => { // menú de iconos: el texto sigue en el DOM; el tooltip lo repite
      const label = [...btn.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      if (s.sidebar === 'icons' && label) btn.title = label; else btn.removeAttribute('title');
    });
  }
  try { // el tema Automático sigue al sistema
    const mq = window.matchMedia('(prefers-color-scheme: dark)'), onScheme = () => { if (liveSettings?.theme === 'auto') applyAppearance(liveSettings); };
    if (mq.addEventListener) mq.addEventListener('change', onScheme); else mq.addListener?.(onScheme);
  } catch { /* sin matchMedia */ }
  function applyPreferences() {
    applyAppearance();
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
    if (DEMO) { if (!auto) toast('En la demostración no se descargan copias.', 'error'); return; } // Etapa 7
    const { apiKey, ...safe } = state;
    download(`learny-copia-${today()}.json`, JSON.stringify(safe, null, 2), 'application/json');
    state.settings.lastExport = today(); save();
    if (!auto) toast('Copia descargada (sin clave API).');
  }

  function exportDeck() {
    if (DEMO) return toast('En la demostración no se comparten mazos.', 'error'); // Etapa 7
    const deck = state.cards.filter((c) => !c.corrupt).map(({ subject, question, answer }) => ({ subject, question, answer }));
    if (!deck.length && !state.decks.length) return toast('No hay tarjetas para compartir.', 'error');
    download(`learny-mazo-${today()}.json`, JSON.stringify({ type: 'learny-deck', cards: deck, decks: state.decks }, null, 2), 'application/json');
    toast('Mazo exportado sin progreso personal.');
  }

  const BACKUP_LISTS = ['cards', 'sessions', 'deadlines', 'reviews', 'topics', 'tasks', 'chats', 'exams', 'notes', 'feynman', 'decks', 'planLog'];
  function validateBackup(data) {
    if (data?.type === 'learny-deck') {
      if (!Array.isArray(data.cards)) return { ok: false, error: 'El mazo no contiene una lista de tarjetas.' };
      const good = data.cards.filter((c) => c && typeof c.question === 'string' && typeof c.answer === 'string' && c.question.trim() && c.answer.trim());
      const decks = (Array.isArray(data.decks) ? data.decks : []).filter((d) => d && typeof d.name === 'string' && Array.isArray(d.cards))
        .map((d) => ({ name: d.name.slice(0, 60), cards: d.cards.filter((c) => Array.isArray(c) && typeof c[0] === 'string' && typeof c[1] === 'string').map((c) => [c[0].slice(0, 500), c[1].slice(0, 1200)]) })).filter((d) => d.cards.length);
      return { ok: true, deck: good, decks, dropped: data.cards.length - good.length }; // los errores se detallan en la vista previa
    }
    if (!isLearnyBackup(data)) return { ok: false, error: 'Ese archivo no parece una copia de Learny.' };
    if (Number(data.version) > SCHEMA) return { ok: false, error: `La copia es de una versión más nueva de Learny (v${data.version}). Actualiza la app e inténtalo de nuevo.` };
    const bad = BACKUP_LISTS.filter((k) => k in data && !Array.isArray(data[k]));
    if (bad.length) return { ok: false, error: `Estos campos tienen un formato inválido: ${bad.join(', ')}.` };
    if ('settings' in data && (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings))) return { ok: false, error: 'Los ajustes de la copia no son válidos.' };
    return { ok: true, cards: (data.cards || []).length, deadlines: (data.deadlines || []).length, sessions: (data.sessions || []).length };
  }

  /* Vista previa antes de modificar datos: cifras, errores detallados y «Importar válidas». Devuelve true si el usuario confirma. */
  function importPreview({ title, intro, counts, groups = [], okLabel, canImport = true, danger = false }) {
    return new Promise((resolve) => {
      let done = false; const finish = (v) => { if (!done) { done = true; resolve(v); } };
      const group = (g) => `<details class="import-group ${g.cls || ''}"><summary>${esc(g.title)} (${g.lines.length})</summary><ol class="import-list">${g.lines.slice(0, 25).map((l) => `<li>${esc(l)}</li>`).join('')}${g.lines.length > 25 ? `<li>… y ${g.lines.length - 25} más</li>` : ''}</ol></details>`;
      modal(`<h2>${esc(title)}</h2><p>${intro}</p>
        <ul class="import-sum">${counts.map((c) => `<li class="${c.cls || ''}"><b>${c.n}</b> ${esc(c.label)}</li>`).join('')}</ul>
        ${groups.filter((g) => g.lines.length).map(group).join('')}
        <p class="modal-tip">${canImport ? 'Antes de modificar tus datos se guarda una copia automática (Ajustes ⚙️ → Restaurar copia automática).' : 'No hay nada que importar.'}</p>
        <div class="actions"><button class="outline-button" type="button" data-close-modal>${canImport ? 'Cancelar' : 'Cerrar'}</button>${canImport ? `<button class="${danger ? 'danger-button' : 'primary-button'}">${esc(okLabel)}</button>` : ''}</div>`,
      () => finish(true), () => finish(false));
    });
  }

  function analyzeCards(records) {
    const key = (q, s) => `${s}\u0001${q}`.toLowerCase();
    const have = new Set(state.cards.map((c) => key(c.question, c.subject))), seen = new Set(), A = { fresh: [], dups: [], errors: [] };
    records.forEach((r) => {
      const tag = `${r.label} ${r.n}`;
      if (r.bad) { A.errors.push(`${tag}: ${r.bad}`); return; }
      if (!r.question && !r.answer) { A.errors.push(`${tag}: no tiene texto utilizable`); return; }
      if (!r.question) { A.errors.push(`${tag}: falta la pregunta (respuesta: «${r.answer.slice(0, 50)}»)`); return; }
      if (!r.answer) { A.errors.push(`${tag}: falta la respuesta (pregunta: «${r.question.slice(0, 50)}»)`); return; }
      const k = key(r.question, r.subject);
      if (have.has(k)) { A.dups.push(`${tag}: «${r.question.slice(0, 60)}» ya está en tu colección`); return; }
      if (seen.has(k)) { A.dups.push(`${tag}: «${r.question.slice(0, 60)}» está repetida en el archivo`); return; }
      seen.add(k); A.fresh.push({ question: r.question, answer: r.answer, subject: r.subject });
    });
    return A;
  }

  const previewCards = (title, total, A, { extra = [], over = 0 } = {}) => {
    const errN = A.errors.length + over;
    return importPreview({
      title, intro: `Se leyeron <b>${total}</b> ${total === 1 ? 'registro' : 'registros'} del archivo.`,
      counts: [{ n: A.fresh.length, label: A.fresh.length === 1 ? 'nueva' : 'nuevas', cls: 'ok' }, { n: A.dups.length, label: A.dups.length === 1 ? 'posible duplicada' : 'posibles duplicadas' }, { n: errN, label: errN === 1 ? 'con error' : 'con errores', cls: errN ? 'err' : '' }, ...extra],
      groups: [{ title: 'Revisar errores', lines: [...A.errors, ...(over ? [`${plural(over, 'registro', 'registros')} después del límite de 5 000 no se leerán`] : [])], cls: 'err' }, { title: 'Ver duplicadas', lines: A.dups }],
      okLabel: `Importar ${plural(A.fresh.length, 'válida', 'válidas')}`, canImport: A.fresh.length > 0 || extra.some((x) => x.n > 0)
    });
  };

  function importData(file) {
    if (DEMO) return toast('En la demostración no se importan archivos.', 'error'); // Etapa 7
    if (file.size > 15 * 1024 * 1024) return toast('El archivo es demasiado grande para ser una copia de Learny.', 'error');
    file.text().then(async (text) => {
      let data; try { data = JSON.parse(text); } catch { throw new Error('El archivo no es un JSON válido.'); }
      const check = validateBackup(data);
      if (!check.ok) throw new Error(check.error);
      if (check.deck) {
        const records = data.cards.map((c, i) => (isObj(c)
          ? { n: i + 1, label: 'Tarjeta', question: cleanMl(typeof c.question === 'string' ? c.question : '', 500), answer: cleanMl(typeof c.answer === 'string' ? c.answer : '', 1200), subject: clean(typeof c.subject === 'string' ? c.subject : '', 60) || 'Sin materia' }
          : { n: i + 1, label: 'Tarjeta', bad: 'no es una tarjeta' }));
        const A = analyzeCards(records), newDecks = (check.decks || []).filter((d) => !state.decks.some((x) => x.name === d.name));
        if (!(await previewCards('Importar mazo', records.length, A, { extra: newDecks.length ? [{ n: newDecks.length, label: newDecks.length === 1 ? 'mazo propio nuevo' : 'mazos propios nuevos' }] : [] }))) return;
        snapshot('import');
        A.fresh.forEach((c) => state.cards.push(normalizeCard({ ...c, nextReview: today() }))); newDecks.forEach((d) => state.decks.push(d));
        save(); closeModal(); renderAll(); toast(`Mazo importado: ${plural(A.fresh.length, 'tarjeta nueva', 'tarjetas nuevas')}.`);
        return;
      }
      const brokenCards = arr(data.cards).map((c, i) => [c, i]).filter(([c]) => !isObj(c) || isBrokenCard(c)).map(([c, i]) => `Tarjeta ${i + 1}: ${isObj(c) ? 'le falta la pregunta o la respuesta' : 'no es una tarjeta'} (se importará marcada como dañada)`);
      const badDeadlines = arr(data.deadlines).map((d, i) => [d, i]).filter(([d]) => !(isObj(d) && d.title && /^\d{4}-\d{2}-\d{2}$/.test(d.date))).map(([, i]) => `Fecha ${i + 1}: sin nombre o con fecha no válida (se omitirá)`);
      const problems = brokenCards.length + badDeadlines.length;
      if (!(await importPreview({
        title: 'Reemplazar tus datos', intro: 'Esta copia <b>reemplazará</b> tus datos actuales.',
        counts: [{ n: check.cards, label: `tarjetas (ahora: ${state.cards.length})` }, { n: check.deadlines, label: `fechas (ahora: ${state.deadlines.length})` }, { n: check.sessions, label: `sesiones (ahora: ${state.sessions.length})` }, ...(problems ? [{ n: problems, label: problems === 1 ? 'con error' : 'con errores', cls: 'err' }] : [])],
        groups: [{ title: 'Revisar errores', lines: [...brokenCards, ...badDeadlines], cls: 'err' }], okLabel: 'Reemplazar mis datos', danger: true
      }))) return;
      snapshot('import');
      const keepProxy = state.settings.proxyUrl; // una copia ajena nunca redirige tu IA
      exam = null; hydrate({ ...data, apiKey: state.apiKey }); state.settings.proxyUrl = keepProxy;
      state.deadlines.forEach((d) => { if (!state.tasks.some((t) => t.deadlineId === d.id)) rebuildTasks(d, false); });
      save(); closeModal(); applyPreferences(); resetTimer('focus'); renderAll(); toast('Datos importados correctamente.');
    }).catch((error) => { console.error(error); toast(error.message || 'Ese archivo no es una copia válida de Learny.', 'error'); });
  }

  function restoreBackup() {
    if (DEMO) return toast('En la demostración no hay copias que restaurar.', 'error'); // Etapa 7
    const list = readBackups();
    if (!list.length) return toast('No hay copia automática para restaurar.', 'error');
    modal(`<h2>Restaurar copia automática</h2>
      <p class="hint">Elige una copia. Reemplazará tus datos actuales (se guarda antes una copia de lo que tienes ahora).</p>
      <div class="backup-list">${list.map((b, i) => `<button class="outline-button" type="button" data-backup="${i}">${esc(String(b.at || '').replace('T', ' ').slice(0, 16))} · ${esc(String(b.reason || 'manual'))} · ${plural((b.data.cards || []).length, 'tarjeta', 'tarjetas')}</button>`).join('')}</div>`);
    document.querySelectorAll('[data-backup]').forEach((btn) => { btn.onclick = () => applyBackup(Number(btn.dataset.backup)); });
  }
  async function applyBackup(i) {
    const b = readBackups()[i];
    if (!b?.data) return toast('Esa copia ya no está disponible.', 'error');
    if (!(await confirmDialog({ title: 'Restaurar copia automática', message: `Copia del ${String(b.at || '').slice(0, 10)} (${b.reason || 'manual'}). Reemplazará tus datos actuales.`, ok: 'Restaurar', danger: true }))) return;
    snapshot('antes de restaurar'); // lo actual no se pierde: queda como la copia más reciente
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
    return rows.filter((r) => r.some(Boolean) && !/^#[A-Za-z][\w ]*:/.test(String(r[0])));
  }

  // Anki guarda HTML en los campos: <br> pasa a salto de línea y el resto de etiquetas se quita.
  const stripHtml = (v) => String(v || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(div|p|li)>/gi, '\n').replace(/<!--[\s\S]*?-->/g, '').replace(/<\/?[A-Za-z][^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  function importCsv(file) {
    if (DEMO) return toast('En la demostración no se importan archivos.', 'error'); // Etapa 7
    if (file.size > 5 * 1024 * 1024) return toast('El archivo es demasiado grande (máximo 5 MB).', 'error');
    file.text().then(async (text) => {
      const rows = parseCsv(text.replace(/^\uFEFF/, ''));
      if (rows.length < 1) throw new Error('vacío');
      const header = rows[0].map((h) => h.toLowerCase());
      const body = header.some((h) => /^(pregunta|question|front|anverso|respuesta|answer|back|reverso|materia|subject|tema)$/.test(h.trim())) ? rows.slice(1) : rows;
      const records = body.slice(0, 5000).map((r, i) => ({ n: i + 1, label: 'Registro', question: cleanMl(stripHtml(r[0]), 500), answer: cleanMl(stripHtml(r[1]), 1200), subject: clean(stripHtml(r[2]), 60) || 'Importado' }));
      const A = analyzeCards(records);
      if (!(await previewCards('Importar tarjetas', body.length, A, { over: Math.max(0, body.length - 5000) }))) return;
      snapshot('import-csv');
      A.fresh.forEach((c) => state.cards.push(normalizeCard({ ...c, nextReview: today() })));
      save(); closeModal(); renderAll(); toast(`Importadas ${plural(A.fresh.length, 'tarjeta', 'tarjetas')} desde CSV.`);
    }).catch((e) => { console.error(e); toast('Archivo no válido. Usa pregunta, respuesta, materia (separados por coma, punto y coma o tabulador).', 'error'); });
  }

  const APP_KEYS = ['theme', 'accent', 'accentCustom', 'radius', 'cardStyle', 'bgStyle', 'density', 'font', 'headFont', 'fontSize', 'lineHeight', 'letterSpacing', 'cardText', 'contentWidth', 'sidebar', 'showMissions', 'showFact', 'reduceMotion', 'immersiveDim'];
  /* Estilos rápidos (Ajustes) y ambientes de estudio: Noche = noche, Minimalista = enfoque, Biblioteca = nuevo (cálido, sobre Sepia + serif). */
  const QS_KEEP = ['accent', 'accentCustom', 'showMissions', 'showFact', 'reduceMotion', 'immersiveDim'];
  const QS_DEF = {
    cuaderno: {},
    noche: { theme: 'oled', font: 'serif', lineHeight: 'roomy', fontSize: 19, bgStyle: 'plain', cardText: 'large' },
    papel: { theme: 'light', font: 'serif', bgStyle: 'dots' },
    enfoque: { theme: 'dark', bgStyle: 'plain', radius: 'sharp', contentWidth: 'narrow', sidebar: 'icons' },
    biblioteca: { theme: 'sepia', font: 'serif', lineHeight: 'roomy', bgStyle: 'plain', cardText: 'large' }
  };
  function quickStyle(name) {
    const base = defaults().settings, o = {};
    APP_KEYS.filter((k) => !QS_KEEP.includes(k)).forEach((k) => { o[k] = base[k]; });
    return { ...o, ...(QS_DEF[name] || {}) };
  }
  const AMBIENT_NAME = { biblioteca: 'Biblioteca', noche: 'Noche', enfoque: 'Minimalista' };
  function setAmbient(name) {
    if (!QS_DEF[name]) return;
    const before = {}; APP_KEYS.forEach((k) => { before[k] = state.settings[k]; });
    Object.assign(state.settings, quickStyle(name)); sanitizeSettings(state.settings, defaults().settings); save(); applyAppearance();
    offerUndo(`Ambiente «${AMBIENT_NAME[name]}» aplicado. Sin sonido.`, () => { Object.assign(state.settings, before); save(); applyAppearance(); });
  }
  function openSettings() {
    const base = defaults().settings;
    const sel = (name, label, list) => `<label>${label}<select name="${name}">${list.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>`;
    const form = $('#modal-form'), f = form.elements;
    const read = () => { const o = {}; APP_KEYS.forEach((k) => { const el = f[k]; o[k] = el.type === 'checkbox' ? el.checked : k === 'fontSize' ? Number(el.value) : el.value; }); return o; };
    const put = (o) => Object.entries(o).forEach(([k, v]) => { const el = f[k]; if (!el) return; if (el.type === 'checkbox') el.checked = !!v; else el.value = String(v); });
    const QS = Object.fromEntries(Object.keys(QS_DEF).map((k) => [k, quickStyle(k)]));
    const sync = () => {
      const plain = ['sepia', 'contrast'].includes(f.theme.value); // en Sepia y Alto contraste el acento es fijo
      f.accent.disabled = plain; f.accentCustom.disabled = plain || f.accent.value !== 'custom';
      $('#accent-custom-wrap').hidden = f.accent.value !== 'custom'; $('#fs-out').textContent = `${f.fontSize.value} px`;
    };
    const preview = () => { sync(); const d = { ...state.settings, ...read() }; sanitizeSettings(d, base); applyAppearance(d); };
    modal(`<h2>Ajustes</h2>
      <details class="more-inline settings-group" open><summary>Apariencia</summary>
        <p class="hint">Los cambios se ven al instante y solo se guardan con «Guardar preferencias».</p>
        <p class="hint"><b>Estilos rápidos</b></p>
        <div class="actions" role="group" aria-label="Estilos rápidos"><button class="outline-button" type="button" data-qs="cuaderno">Cuaderno</button><button class="outline-button" type="button" data-qs="noche">Lectura nocturna</button><button class="outline-button" type="button" data-qs="papel">Papel</button><button class="outline-button" type="button" data-qs="biblioteca">Biblioteca</button><button class="outline-button" type="button" data-qs="enfoque">Enfoque</button><button class="text-button" type="button" id="reset-look">Restablecer apariencia</button></div>
        ${sel('theme', 'Tema', [['auto', 'Automático (según tu sistema)'], ['dark', 'Oscuro'], ['oled', 'Negro (OLED)'], ['light', 'Claro'], ['sepia', 'Sepia'], ['contrast', 'Alto contraste']])}
        <div class="form-row">${sel('accent', 'Color de acento (no en Sepia ni Alto contraste)', [['sky', 'Cielo'], ['mint', 'Menta'], ['violet', 'Violeta'], ['amber', 'Ámbar'], ['rose', 'Rosa'], ['custom', 'Personalizado']])}
        <label id="accent-custom-wrap" hidden>Color personalizado<input name="accentCustom" type="color"></label></div>
        <div class="form-row">${sel('radius', 'Esquinas', [['sharp', 'Rectas'], ['soft', 'Suaves'], ['round', 'Redondeadas']])}${sel('cardStyle', 'Tarjetas', [['border', 'Con borde'], ['shadow', 'Con sombra']])}</div>
        <div class="form-row">${sel('bgStyle', 'Fondo', [['grid', 'Cuadriculado'], ['dots', 'Puntos'], ['plain', 'Liso']])}${sel('density', 'Densidad', [['normal', 'Normal'], ['compact', 'Compacta'], ['roomy', 'Amplia']])}</div>
      </details>
      <details class="more-inline settings-group"><summary>Tipografía y lectura</summary>
        <p class="hint">Solo fuentes del sistema: no se descarga nada.</p>
        ${sel('font', 'Fuente del texto', [['sans', 'Sistema (sans)'], ['humanist', 'Humanista'], ['serif', 'Serif de lectura'], ['rounded', 'Redondeada'], ['mono', 'Monoespaciada'], ['dyslexic', 'Lectura fácil (OpenDyslexic si está instalada; si no, Verdana)']])}
        ${sel('headFont', 'Fuente de los títulos', [['serif', 'Serif (actual)'], ['same', 'La misma del texto']])}
        <label>Tamaño de texto: <output id="fs-out"></output><input name="fontSize" type="range" min="13" max="24" step="1"></label>
        <div class="form-row">${sel('lineHeight', 'Interlineado', [['compact', 'Compacto'], ['normal', 'Normal'], ['roomy', 'Amplio']])}${sel('letterSpacing', 'Espaciado de letras', [['normal', 'Normal'], ['wide', 'Amplio'], ['wider', 'Muy amplio']])}</div>
        ${sel('cardText', 'Texto de las tarjetas de estudio', [['normal', 'Normal'], ['large', 'Grande'], ['xlarge', 'Muy grande']])}
      </details>
      <details class="more-inline settings-group"><summary>Disposición</summary>
        <div class="form-row">${sel('contentWidth', 'Ancho del contenido', [['narrow', 'Estrecho (1000 px)'], ['normal', 'Normal (1240 px)'], ['wide', 'Ancho (1600 px)']])}${sel('sidebar', 'Menú lateral (escritorio)', [['full', 'Completo'], ['icons', 'Solo iconos']])}</div>
        <label class="check"><input name="showMissions" type="checkbox"> Mostrar las misiones de hoy</label>
        <label class="check"><input name="showFact" type="checkbox"> Mostrar el dato curioso</label>
        <label class="check"><input name="reduceMotion" type="checkbox"> Reducir animaciones</label>
        <label class="check"><input name="immersiveDim" type="checkbox"> Atenuar el menú y la barra superior durante un bloque o examen</label>
      </details>
      <details class="more-inline settings-group"><summary>Estudio y avisos</summary>
        <label>Tu nombre (opcional, para el saludo)<input name="name" maxlength="30" autocomplete="given-name" value="${esc(state.settings.name)}"></label>
        <p class="modal-tip">Materia y objetivo de estudio: se editan en «Contexto del tutor», arriba en la página.</p>
        <label class="check"><input name="sound" type="checkbox"> Sonido al terminar</label>
        <label class="check"><input name="notify" type="checkbox"> Avisos al terminar bloques y un recordatorio diario al abrir la app (no llegan con la app cerrada)</label>
        <div class="form-row"><label>Pomodoro (min)<input name="focus" type="number" min="1" max="180" value="${state.settings.focus}"></label>
        <label>Descanso (min)<input name="rest" type="number" min="1" max="60" value="${state.settings.rest}"></label></div>
        <div class="form-row"><label>Ruleta: preparación<input name="prepare" type="number" min="1" max="180" value="${state.settings.roulettePrepare}"></label>
        <label>Ruleta: explicación<input name="explain" type="number" min="1" max="180" value="${state.settings.rouletteExplain}"></label></div>
      </details>
      <details class="more-inline settings-group" id="settings-advanced"><summary>Inteligencia artificial</summary>
        <label>Clave de Gemini (opcional)<input name="apikey" type="password" autocomplete="off" maxlength="200" placeholder="${state.apiKey ? 'Clave guardada (vacío = conservar)' : 'Pega aquí tu clave'}"></label>
        <p class="modal-tip">Tu clave se guarda solo en este navegador y no debe usarse en un equipo compartido. Va en el encabezado x-goog-api-key, no en la URL.</p>
        <label>Modelo de Gemini<input name="model" value="${esc(state.settings.model)}"></label>
        <label>URL de tu proxy (opcional, para no exponer la clave)<input name="proxy" type="url" inputmode="url" maxlength="200" placeholder="https://tu-worker.workers.dev" value="${esc(state.settings.proxyUrl)}"></label>
      </details>
      <details class="more-inline settings-group"><summary>Datos y copias</summary>
        <div class="actions">
        <button id="export-data" class="outline-button" type="button">Descargar copia</button>
        <button id="export-deck" class="outline-button" type="button">Compartir mazo</button>
        <button id="import-json-btn" class="outline-button" type="button">Importar JSON</button><input id="import-file" type="file" accept="application/json,.json" hidden aria-label="Archivo JSON a importar">
        <button id="import-csv-btn" class="outline-button" type="button">Importar CSV / Anki (.csv, .txt)</button><input id="import-csv" type="file" accept=".csv,.tsv,.txt,text/csv,text/plain,text/tab-separated-values" hidden aria-label="Archivo CSV o Anki a importar">
        ${state.apiKey ? '<button id="clear-key" class="outline-button" type="button">Quitar clave guardada</button>' : ''}
        ${readBackups().length ? '<button id="restore-backup" class="outline-button" type="button">Restaurar copia automática</button>' : ''}
        <button id="reset-data" class="outline-button" type="button">${DEMO ? 'Reiniciar demo' : 'Borrar todo'}</button>
        </div>
      </details>
      <p class="modal-tip">Comentarios: <a href="mailto:learnyxsv@gmail.com">learnyxsv@gmail.com</a></p>
      <button class="primary-button">Guardar preferencias</button>`, (data) => {
      if (clean(data.get('proxy'), 200) && !validProxy(data.get('proxy'))) return toast('La URL del proxy debe empezar por https:// (o http://localhost).', 'error');
      Object.assign(state.settings, {
        name: clean(data.get('name'), 30), proxyUrl: validProxy(data.get('proxy')), ...read(),
        sound: data.get('sound') === 'on', notify: data.get('notify') === 'on',
        focus: num(data.get('focus'), 1, 180, 25), rest: num(data.get('rest'), 1, 60, 5),
        roulettePrepare: num(data.get('prepare'), 1, 180, 10), rouletteExplain: num(data.get('explain'), 1, 180, 1),
        model: clean(data.get('model'), 80) || DEFAULT_MODEL
      });
      sanitizeSettings(state.settings, base); // lo que llega del formulario también se valida
      if (DEMO) { state.apiKey = ''; state.settings.proxyUrl = ''; state.settings.notify = false; } // Etapa 7
      const key = clean(data.get('apikey'), 200); if (key) { state.apiKey = key; state.settings.skipAi = false; }
      if (!DEMO && state.settings.notify && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();
      save(); applyPreferences(); closeModal(); if (!timer.started) resetTimer(timer.mode); else renderTimer(); renderAll(); toast('Preferencias guardadas.');
    });
    modalTeardown = () => { const b = $('#modal-body'); b.oninput = null; b.onchange = null; $('#app-modal').onclick = null; applyAppearance(); }; // cerrar o reemplazar sin guardar revierte la vista previa
    put(state.settings); f.fontSize.value = String(state.settings.fontSize); sync();
    $('#modal-body').oninput = $('#modal-body').onchange = preview;
    { const dlg = $('#app-modal'); dlg.onclick = (e) => { if (e.target === dlg) closeModal(); }; } // clic fuera (solo en Ajustes): cierra y revierte la vista previa
    $$('#modal-body [data-qs]').forEach((b) => { b.onclick = () => { put(QS[b.dataset.qs]); preview(); }; });
    $('#reset-look').onclick = () => { const o = {}; APP_KEYS.filter((k) => k !== 'reduceMotion').forEach((k) => { o[k] = base[k]; }); put(o); preview(); toast('Apariencia restablecida. Pulsa «Guardar preferencias» para conservarla.'); };
    $('#export-data').onclick = () => exportData();
    if ($('#clear-key')) $('#clear-key').onclick = () => { state.apiKey = ''; save(); closeModal(); toast('Clave eliminada de este navegador.'); };
    if ($('#restore-backup')) $('#restore-backup').onclick = restoreBackup;
    $('#export-deck').onclick = exportDeck;
    $('#import-json-btn').onclick = () => $('#import-file').click();
    $('#import-csv-btn').onclick = () => $('#import-csv').click();
    $('#import-file').onchange = (e) => { if (e.target.files[0]) importData(e.target.files[0]); };
    $('#import-csv').onchange = (e) => { if (e.target.files[0]) importCsv(e.target.files[0]); };
    if (DEMO) ['apikey', 'proxy', 'notify'].forEach((n) => { const el = $(`#modal-form [name="${n}"]`); if (el) el.disabled = true; }); // Etapa 7: sin IA ni avisos en demo
    $('#reset-data').onclick = async () => {
      if (DEMO) { // Etapa 7: «Reiniciar demo» solo recarga la demo; no toca ningún dato real
        if (await confirmDialog({ title: 'Reiniciar demo', message: 'Se restauran los datos de ejemplo. Tus datos reales no se tocan.', ok: 'Reiniciar' })) location.reload();
        return;
      }
      if (!(await confirmDialog({ title: 'Borrar todo', message: 'Se borrarán tarjetas, sesiones y fechas.\nAntes se descargará una copia y se guardará otra en el navegador.', ok: 'Borrar todo', danger: true }))) return;
      exportData(true); snapshot('reset');
      [KEY, ...LEGACY_KEYS, 'learny.corrupt', 'learny.drafts', TIMER_KEY, DONE_KEY].forEach((k) => store.del(k));
      document.dispatchEvent(new Event('learny:reset')); // extras.js vacía sus borradores en memoria (si no, se reescribirían al teclear)
      exam = null; hydrate({}); closeModal(); applyPreferences(); resetTimer('focus'); renderAll(); toast('Datos borrados. Descargaste una copia y puedes restaurar la automática desde Ajustes ⚙️.');
    };
  }

  function changeFont(delta) { state.settings.fontSize = Math.min(24, Math.max(13, state.settings.fontSize + delta)); save(); applyAppearance(); }

  function maybeRemind() {
    if (DEMO) return; // Etapa 7
    if (state.settings.lastRemind === today()) return; // una vez al día, no en cada recarga
    state.settings.lastRemind = today(); save();
    const due = dueCards().length;
    const soon = state.deadlines.filter((d) => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 3);
    if (due) notify('Learny', `Tienes ${plural(due, 'tarjeta', 'tarjetas')} para hoy.`);
    soon.forEach((d) => notify('Learny', `Examen: ${d.title} en ${plural(daysUntil(d.date), 'día', 'días')}.`));
  }

  function backupNag() {
    if (DEMO) return; // Etapa 7
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
  { const nav = $('.bottom-nav'); if (nav && typeof ResizeObserver !== 'undefined') new ResizeObserver(() => document.documentElement.style.setProperty('--nav-h', `${nav.offsetHeight}px`)).observe(nav); } // altura real de la barra: nada queda tapado
  { const head = $('.sidebar'); if (head && typeof ResizeObserver !== 'undefined') new ResizeObserver(() => document.documentElement.style.setProperty('--head-h', `${head.offsetHeight}px`)).observe(head); } // y de la cabecera móvil: el temporizador fijo no se solapa
  $$('.page-heading h1').forEach((h) => { h.tabIndex = -1; });
  $('#mini-timer').onclick = () => showPage('study');
  $('#today-queue').onclick = (e) => { const b = e.target.closest('button[data-action]'); if (b && ACTIONS[b.dataset.action]) ACTIONS[b.dataset.action](b); };
  $('#modal-form').addEventListener('invalid', (e) => reveal(e.target), true); // un campo inválido dentro de «Avanzado» abre su bloque para poder corregirlo
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
  $('#distraction-add').onclick = addDistraction;
  $('#distraction-input').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); addDistraction(); } };
  $$('[data-ambient]').forEach((b) => { b.onclick = () => setAmbient(b.dataset.ambient); });
  $('#intention-input').onkeydown = (e) => { if (e.key === 'Enter' && !timer.running) { e.preventDefault(); startPomodoro(); } }; // teclado: Enter en el resultado concreto inicia el bloque
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
  $('#plan-log-clear').onclick = () => { state.planLog = []; save(); renderPlanLog(); };
  $('#deadline-list').onclick = (e) => {
    if (e.target.dataset.replan) { replanDeadline(e.target.dataset.replan); return; }
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
    if (landingOn || modalOpen() || $('#confirm-modal').open || e.ctrlKey || e.metaKey || e.altKey) return; // Etapa 6: con la portada visible, los atajos no actúan
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
  /* Si la app sigue abierta al pasar la medianoche, «hoy» se recalcula (cola, tarjetas vencidas, plan). */
  let lastDay = today();
  const checkNewDay = () => { if (today() !== lastDay) { lastDay = today(); renderAll(); } };
  setInterval(checkNewDay, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkNewDay(); });

  window.Learny = { isDemo: DEMO, reveal, pullFromStorage, validDeadlineDate, MAX_PLAN_DAYS, isExam: () => !!exam, endExam: () => { if (exam && exam.i) state.exams.push({ date: today(), score: exam.score, total: exam.i }); exam = null; save(); renderAll(); document.dispatchEvent(new Event('learny:examend')); }, state, save, toast, modal, closeModal, today, addDays, uid, clean, esc, fmt, plural, daysUntil, dueCards, startExam, cardForm, normalizeCard, suggestCards: suggestCardsFromText, reviewCards, askGemini, gemini, rebuildTasks, addDeadline, renderAll, hasAi, cancelAi, showPage, subjectStats, overdueCards, weakSubject, startSubjectQuiz, calcStreak, announce, debounce, currentPage: () => currentPage, timerStarted: () => timer.started, timerRunning: () => timer.running };
  /* Etapa 5: bienvenida opcional (4 pasos, todo opcional). Solo si no hay datos; Omitir, × o Esc la cierran y no vuelve sola.
     Los pasos ya confirmados con «Siguiente» se conservan; lo escrito en el paso abierto al omitir no se guarda. */
  function welcomeFlow() {
    if (DEMO || state.settings.welcomed || hasUserData() || modalOpen()) return; // Etapa 7: la demo nunca abre la bienvenida
    const TIMES = [[10, '10 min', 'Algo corto'], [25, '25 min', 'Un Pomodoro'], [45, '45 min', 'Sesión larga']];
    const a = { name: '', subject: '', goal: '', minutes: 0 }, body = $('#modal-body');
    let i = 0, ended = false;
    const read = () => {
      const d = new FormData($('#modal-form')), v = (max) => clean(d.get('v') || '', max);
      if (i === 0) a.name = v(30); else if (i === 1) a.subject = v(60); else if (i === 2) a.goal = v(200);
      else { const m = Number(d.get('t')); if (TIMES.some((t) => t[0] === m)) a.minutes = m; }
    };
    const apply = () => { // solo campos que la bienvenida posee (estaban vacíos); el tiempo solo si se eligió uno
      const s = state.settings;
      s.name = a.name; s.tutor = { ...s.tutor, subject: a.subject, goal: a.goal };
      if (a.minutes) s.focus = a.minutes;
    };
    const end = (completed) => {
      if (ended) return; ended = true;
      body.removeEventListener('click', onClick);
      if (completed) apply();
      state.settings.welcomed = true; save();
      applyPreferences(); if (!timer.started) resetTimer(timer.mode); else renderTimer(); renderAll(); // applyPreferences refresca los campos del tutor: así fillTutor no pisa lo guardado con valores viejos
      closeModal();
      setTimeout(() => $('.page.active h1')?.focus({ preventScroll: true }), 0);
      if (completed) toast(`${a.name ? `Listo, ${a.name}. ` : 'Listo. '}Puedes cambiar todo esto en Ajustes ⚙️.`);
    };
    function onClick(e) {
      const b = e.target.closest('[data-w]'); if (!b) return;
      if (b.dataset.w === 'skip') end(false);
      else if (b.dataset.w === 'back' && i > 0) { read(); i--; render(); }
    }
    function render() {
      const last = i === 3, label = ['Nombre', 'Materia', 'Objetivo', 'Tiempo'][i];
      const field = [
        () => `<label>Tu nombre<input name="v" maxlength="30" autocomplete="given-name" enterkeyhint="next" value="${esc(a.name)}"></label>`,
        () => `<label>Materia o tema<input name="v" maxlength="60" placeholder="p. ej. Química" enterkeyhint="next" value="${esc(a.subject)}"></label>`,
        () => `<label>Objetivo<input name="v" maxlength="200" placeholder="p. ej. Aprobar el parcial del viernes" enterkeyhint="next" value="${esc(a.goal)}"></label>`,
        () => `<fieldset class="welcome-times"><legend class="sr-only">Tiempo de hoy</legend>${TIMES.map(([m, t, sub]) => `<label class="welcome-time"><input type="radio" name="t" value="${m}"${a.minutes === m ? ' checked' : ''}><span><b>${esc(t)}</b><small>${esc(sub)}</small></span></label>`).join('')}</fieldset>`
      ][i]();
      const title = ['¿Cómo quieres que te llame?', '¿Qué quieres estudiar?', '¿Qué quieres lograr?', '¿Cuánto tiempo tienes hoy?'][i];
      modal(`<p class="eyebrow">Paso ${i + 1} de 4 · ${esc(label)}</p><h2>${esc(title)}</h2>
        ${field}
        <p class="modal-tip">Todo es opcional y lo puedes cambiar después en Ajustes ⚙️.${last ? ' El tiempo ajusta la duración de tu Pomodoro.' : ''}</p>
        <div class="actions welcome-actions"><button class="text-button" type="button" data-w="skip">Omitir</button>${i ? '<button class="outline-button" type="button" data-w="back">Atrás</button>' : ''}<button class="primary-button" type="submit">${last ? 'Terminar' : 'Siguiente'}</button></div>`,
      () => { read(); if (last) end(true); else { apply(); save(); i++; render(); } },
      () => end(false)); // × o Esc: cerrar sin completar cuenta como omitir
    }
    body.addEventListener('click', onClick);
    render();
  }

  /* Etapa 6: portada pública. Capa aparte (#landing) sobre la app: no cambia datos ni claves. «Probar Learny» la cierra y abre la bienvenida (etapa 5). */
  let landingOn = false;
  function showLanding() {
    const el = $('#landing'); if (!el || DEMO) return; // Etapa 7: la demo no muestra la portada
    landingOn = true; el.hidden = false; document.body.classList.add('show-landing');
    window.scrollTo(0, 0); $('#landing-title')?.focus({ preventScroll: true });
  }
  function enterFromLanding() {
    if (!landingOn) return;
    landingOn = false; $('#landing').hidden = true; document.body.classList.remove('show-landing');
    window.scrollTo(0, 0); showPage('study'); $('#study h1')?.focus({ preventScroll: true });
    setTimeout(welcomeFlow, 150);
  }
  $('#landing')?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-landing]'); if (!b) return;
    if (b.dataset.landing === 'start') enterFromLanding();
    else if (b.dataset.landing === 'demo') location.href = `${location.pathname}?demo`; // Etapa 7: entra a la demo (nueva carga, sin tocar datos reales)
    else if (b.dataset.landing === 'tour') {
      const t = $('#landing-tour'), calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      t?.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' }); t?.focus({ preventScroll: true });
    }
  });

  /* Etapa 7: banner permanente, plan del examen de ejemplo y salida. Salir recarga sin ?demo: el espacio real (o la portada) decide solo. */
  if (DEMO) {
    state.deadlines.forEach((d) => rebuildTasks(d, false));
    document.body.classList.add('is-demo');
    document.title = `Demostración · ${document.title}`;
    const bar = $('#demo-banner');
    if (bar) {
      bar.hidden = false;
      const fit = () => document.documentElement.style.setProperty('--demo-h', `${bar.offsetHeight}px`);
      fit(); window.addEventListener('resize', fit); if (window.ResizeObserver) new ResizeObserver(fit).observe(bar);
      $('#demo-exit').onclick = () => { location.href = location.pathname; };
      $('#demo-reset').onclick = async () => {
        if (await confirmDialog({ title: 'Reiniciar demo', message: 'Se restauran los datos de ejemplo. Tus datos reales no se tocan.', ok: 'Reiniciar' })) location.reload();
      };
    }
  }

  const savedTimer = (() => { try { return localStorage.getItem(TIMER_KEY); } catch { return null; } })();
  applyPreferences(); resetTimer('focus', false); lastTimerRaw = savedTimer; restoreTimer(savedTimer); renderAll(); maybeRemind(); backupNag();
  { const hash = location.hash.slice(1); if (['study', 'practice', 'library', 'planner', 'analysis', 'guide'].includes(hash)) showPage(hash); }
  // Etapa 6: la portada es solo para quien nunca entró (sin datos, sin bienvenida, sin temporizador y sin enlace directo a una sección)
  if (!state.settings.welcomed && !hasUserData() && !timer.started && !location.hash.slice(1)) showLanding();
  if (migratedFrom) toast(`Learny actualizó tus datos de la v${migratedFrom} a la v${SCHEMA}. Guardé una copia previa: Ajustes ⚙️ → Restaurar copia automática.`);
  if (droppedCards) toast(`${plural(droppedCards, 'registro ilegible se omitió', 'registros ilegibles se omitieron')} al cargar tus tarjetas.`, 'error');
  if (loadProblem) {
    if (corruptKept) toast('Tus datos guardados estaban dañados. Guardé una copia del archivo original en el navegador (learny.corrupt) y empecé de cero.', 'error');
    else toast('Tus datos guardados estaban dañados y NO pude guardar una copia (sin espacio o almacenamiento bloqueado). No los he tocado hasta que hagas un cambio: descarga el archivo original ahora.', 'error', { label: 'Descargar original', run: () => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([corruptRaw || ''], { type: 'text/plain' })); a.download = 'learny-datos-danados.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } });
  }
  bootHold = false;
  if (corruptKept || !loadProblem) { try { const json = JSON.stringify(state); localStorage.setItem(KEY, json); lastSavedRaw = json; } catch { /* ok */ } } // con datos dañados y sin copia, no se pisa la clave principal en el arranque
  if (!state.settings.welcomed && !landingOn) setTimeout(welcomeFlow, 350); // Etapa 5 (con portada, la bienvenida abre al pulsar «Probar Learny»)
})();
