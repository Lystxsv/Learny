/* Learny · parte 2 de 15 · Datos
   Tarjetas, migraciones de esquema, validación de ajustes, hidratación, copias automáticas, datos de la demo y carga inicial.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

const isBrokenCard = (c) => typeof c.question !== 'string' || !c.question.trim() || typeof c.answer !== 'string' || !c.answer.trim();
const normalizeCard = (c) => ({
  id: c.id || uid(),
  corrupt: isBrokenCard(c),
  subject: String(c.subject || 'Sin materia'),
  question: String(c.question || ''),
  answer: String(c.answer || ''),
  nextReview: isDay(c.nextReview) ? c.nextReview : today(),
  lastReviewed: isDay(c.lastReviewed) ? c.lastReviewed : null,
  archived: !!c.archived,
  origin: c.origin === 'ia' ? 'ia' : '',
  easeFactor: Math.min(4, Math.max(1.3, Number(c.easeFactor ?? c.ease) || 2.5)),
  interval: Math.min(MAX_INTERVAL, Math.max(0, Number(c.interval) || 0)),
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
  let d = JSON.parse(JSON.stringify(src), noProto), v = Number(d.version);
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
  s.theme = pick(s.theme, ['auto', 'dark', 'oled', 'light', 'sepia', 'contrast', 'chrome'], 'dark'); s.font = pick(s.font, ['sans', 'humanist', 'serif', 'rounded', 'mono', 'dyslexic'], 'sans');
  s.headFont = pick(s.headFont, ['serif', 'same'], 'serif'); s.radius = pick(s.radius, ['sharp', 'soft', 'round'], 'soft'); s.cardStyle = pick(s.cardStyle, ['border', 'shadow'], 'border'); s.bgStyle = pick(s.bgStyle, ['grid', 'dots', 'plain'], 'grid');
  s.lineHeight = pick(s.lineHeight, ['compact', 'normal', 'roomy'], 'normal'); s.letterSpacing = pick(s.letterSpacing, ['normal', 'wide', 'wider'], 'normal'); s.cardText = pick(s.cardText, ['normal', 'large', 'xlarge'], 'normal');
  s.contentWidth = pick(s.contentWidth, ['narrow', 'normal', 'wide'], 'normal'); s.sidebar = pick(s.sidebar, ['full', 'icons'], 'full');
  s.accentCustom = typeof s.accentCustom === 'string' && /^#[0-9a-f]{6}$/i.test(s.accentCustom) ? s.accentCustom.toLowerCase() : d.accentCustom;
  s.accent = pick(s.accent, ['mint', 'violet', 'amber', 'sky', 'rose', 'custom'], 'sky'); s.density = pick(s.density, ['normal', 'compact', 'roomy'], 'normal');
  s.statsPeriod = pick(s.statsPeriod, ['7', '30', 'all'], '30');
  s.engine = pick(s.engine, ['gemini', 'local', 'google', 'wikipedia', 'perplexity'], 'gemini');
  ['reduceMotion', 'immersiveDim', 'notify', 'sound', 'skipAi', 'showMissions', 'showFact', 'welcomed', 'mascot'].forEach((k) => { s[k] = typeof s[k] === 'boolean' ? s[k] : d[k]; });
  ['name', 'model', 'lastExport', 'backupNag', 'lastRemind', 'lastRollover'].forEach((k) => { s[k] = typeof s[k] === 'string' ? s[k].slice(0, 100) : d[k]; });
  s.name = s.name.slice(0, 30); s.model = s.model.trim() || DEFAULT_MODEL;
  s.recentTurns = arr(s.recentTurns).filter((x) => typeof x === 'string').slice(0, 8);
  const t = isObj(s.tutor) ? s.tutor : {};
  s.tutor = { subject: String(t.subject || '').slice(0, 60), level: String(t.level || '').slice(0, 40), known: String(t.known || '').slice(0, 400), goal: String(t.goal || '').slice(0, 200),
    style: ['12', 'uni', 'carrera'].includes(t.style) ? t.style : 'uni', career: String(t.career || '').slice(0, 60), mode: t.mode === 'direct' ? 'direct' : 'socratic' };
}

/* Fase 3: forma válida de cada lista del respaldo (las mismas reglas validan la vista previa y hydrate). */
const okNote = (n) => isObj(n) && typeof n.text === 'string' && n.text.trim() !== '';
const okExam = (e) => isObj(e) && isDay(e.date) && Number.isFinite(Number(e.score)) && Number.isFinite(Number(e.total)) && Number(e.total) >= 1 && Number(e.score) >= 0 && Number(e.score) <= Number(e.total);
const okDeckCards = (cs) => arr(cs).filter((c) => Array.isArray(c) && typeof c[0] === 'string' && typeof c[1] === 'string' && c[0].trim() && c[1].trim());
const okDeck = (d) => isObj(d) && typeof d.name === 'string' && d.name.trim() !== '' && okDeckCards(d.cards).length > 0;
const okReview = (r) => isObj(r) && isDay(r.date) && ['again', 'hard', 'easy'].includes(r.rating);
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
  state.sessions = state.sessions.filter((s) => s && isDay(s.date)).map((s) => ({
    ...s, id: s.id || uid(), minutes: Number(s.minutes) || 0, energy: s.energy ? Number(s.energy) : null,
    label: String(s.label || s.subject || ''), achieved: typeof s.achieved === 'boolean' ? s.achieved : null,
    abandon: s.abandon || null, intention: String(s.intention || ''), distractions: cleanNotes(s.distractions)
  }));
  state.deadlines = state.deadlines.filter((d) => d && String(d.title || '').trim() && isDay(d.date)).map((d) => ({
    id: d.id || uid(), title: String(d.title), subject: String(d.subject || ''), date: d.date,
    difficulty: num(d.difficulty, 1, 5, 3), dailyMinutes: num(d.dailyMinutes, 15, 240, 45), skipped: num(d.skipped, 0, 999, 0),
    debtMin: d.debtMin == null ? num(d.skipped, 0, 999, 0) * num(d.dailyMinutes, 15, 240, 45) : num(d.debtMin, 0, 240000, 0)
  }));
  { const seenDeck = new Set(); state.decks = state.decks.filter(okDeck).map((d) => ({ name: d.name.trim().slice(0, 60), cards: okDeckCards(d.cards).slice(0, 500).map((c) => [c[0].slice(0, 500), c[1].slice(0, 1200)]) })).filter((d) => !seenDeck.has(d.name) && seenDeck.add(d.name)); }
  const dayOf = isDay;
  const taskRef = (m) => ({ phase: String(m?.phase || '').slice(0, 20), from: dayOf(m?.from) ? m.from : today() });
  state.planLog = state.planLog.filter((e) => e && dayOf(e.date)).slice(-30).map((e) => ({
    id: e.id || uid(), date: e.date, deadlineId: String(e.deadlineId || ''), title: String(e.title || '').slice(0, 80), kind: e.kind === 'replan' ? 'replan' : 'late',
    minutes: num(e.minutes, 0, 240, 0), moved: arr(e.moved).slice(0, 10).map(taskRef), dropped: arr(e.dropped).slice(0, 40).map(taskRef)
  }));
  state.topics = state.topics.filter((t) => t && String(t.name || '').trim()).map((t) => ({ id: t.id || uid(), name: String(t.name), category: String(t.category || 'Personal') }));
  state.reviews = state.reviews.filter(okReview).slice(-MAX_REVIEWS).map((r) => ({ ...r, subject: String(r.subject || ''), cardId: String(r.cardId || ''), quality: qualityOf(r.rating) }));
  state.notes = state.notes.filter(okNote).map((n) => ({ id: String(n.id || uid()), date: isDay(n.date) ? n.date : today(), text: n.text.trim().slice(0, 2000) })).slice(-500);
  state.exams = state.exams.filter(okExam).map((e) => ({ date: e.date, score: Math.round(Number(e.score)), total: Math.round(Number(e.total)) })).slice(-500);
  state.feynman = [...new Set(state.feynman.filter(isDay))].slice(-1000);
  state.tasks = state.tasks.filter((t) => t && t.deadlineId && isDay(t.date)).map((t) => ({
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
const ROUTINE = new Set(['delete-card', 'delete-deadline']); // copias de borrados puntuales (ya tienen «Deshacer»): nunca desplazan a las importantes (importar, migrar, restaurar, borrar todo)
const isRoutine = (b) => ROUTINE.has(b.reason);
function dropOneBackup(list) { // para liberar sitio: primero la copia rutinaria más vieja y, si no hay, la más vieja de todas
  const i = list.map(isRoutine).lastIndexOf(true);
  list.splice(i >= 0 ? i : list.length - 1, 1); return list;
}
function pushBackup(reason, data) {
  const entry = { at: new Date().toISOString(), reason, data }, routine = ROUTINE.has(reason);
  let old = readBackups();
  if (routine) { old = old.filter((b) => !isRoutine(b)); if (old.length >= MAX_BACKUPS) return false; } // solo una copia rutinaria (sustituye a la anterior); si ocuparía el sitio de una importante, no se crea
  const list = [entry, ...old];
  while (list.length > MAX_BACKUPS) dropOneBackup(list);
  while (list.length) { // si no cabe, se sueltan copias (rutinarias primero; nunca el archivo dañado ni tus datos)
    if (store.set(BACKUP_KEY, JSON.stringify(list))) return true;
    if (routine) return false;
    dropOneBackup(list);
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

let migrationBackup = true; // ¿se pudo guardar la copia previa a la migración? (15-inicio.js ajusta el aviso)
(function load() {
  let merged = {};
  try {
    LEGACY_KEYS.slice().reverse().forEach((k) => { const p = parseJSON(localStorage.getItem(k)); if (p && typeof p === 'object') merged = { ...merged, ...p, settings: { ...(merged.settings || {}), ...(p.settings || {}) } }; });
    const rawCurrent = localStorage.getItem(KEY), current = parseJSON(rawCurrent);
    if (rawCurrent && !current) { loadProblem = true; corruptRaw = rawCurrent; corruptKept = store.set('learny.corrupt', rawCurrent); }
    if (current && typeof current === 'object' && Number(current.version) > SCHEMA) { newerFrom = Number(current.version); newerKept = store.set('learny.newer', rawCurrent); } // datos de una versión más nueva: se guarda el original intacto antes de que esta versión los reescriba
    if (current && typeof current === 'object') merged = { ...merged, ...current, settings: { ...(merged.settings || {}), ...(current.settings || {}) } };
  } catch { /* estado nuevo */ }
  if (Object.keys(merged).length && !(Number(merged.version) >= SCHEMA)) {
    const { apiKey, chats, ...safe } = merged; migrationBackup = pushBackup(`migración desde v${Number(merged.version) || 1}`, safe);
  }
  bootHold = loadProblem && !corruptKept; // datos dañados sin copia: ningún guardado automático del arranque pisa la clave principal
  hydrate(merged);
  // Etapa 5: quien ya tiene datos (o cuyo archivo estaba dañado) nunca verá la bienvenida; se marca una vez y se guarda al final del arranque.
  if (!state.settings.welcomed && (loadProblem || hasUserData())) state.settings.welcomed = true;
})();
