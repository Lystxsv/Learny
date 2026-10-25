/* Learny · parte 1 de 15 · Base
   Modo demo, constantes, utilidades de fecha y texto, valores por defecto y el objeto `state`.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
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
const DEFAULT_MODEL = 'gemini-3.8-flash'; const OLD_DEFAULT_MODELS = ['gemini-flash-latest', 'gemini-4-argon']; // v69: nuevo modelo por defecto; quien conservaba un valor anterior se migra en sanitizeSettings
const MAX_PROMPT = 9000;
const MAX_INTERVAL = 180;
const MAX_PLAN_DAYS = 730;
const SCHEMA = 4;
const TIMER_KEY = 'learny.timer';
const MAX_REVIEWS = 5000;
const MAX_CHATS = 20;
const MASCOT_AVATARS = ['bee', 'eevee', 'walle', 'daniel', 'yor', 'gato', 'cc']; // apariencias de Lumi (la primera es la predeterminada); las usan 02-datos, 13-ajustes y 16-lumi
const MIN_SAMPLE = 5; // con menos repasos no se afirma nada sobre una materia
let rev = 0, currentPage = 'study', loadProblem = false, droppedCards = 0, migratedFrom = 0, newerFrom = 0, newerKept = true, lastSavedRaw = null, lastTimerRaw = null, corruptRaw = null, corruptKept = true, bootHold = false, saveErrorShown = false;
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
const composing = (e) => !!(e.isComposing || e.keyCode === 229); // Enter dentro de una composición IME (japonés, chino…) no debe enviar nada
const pad = (n) => String(n).padStart(2, '0');
const dateStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dateStr();
/* Fase 2: una fecha válida es REAL (no 2026-02-31 ni 2026-13-01): se comprueba ida y vuelta con Date. */
const isDay = (x) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(x)); if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3], t = new Date(Date.UTC(y, mo - 1, d));
  return y >= 1970 && y <= 2200 && t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
};
const validDeadlineDate = (d) => isDay(d) && daysUntil(d) >= 0 && daysUntil(d) <= MAX_PLAN_DAYS;
const addDays = (date, n) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + n); return dateStr(d); };
const daysUntil = (date) => Math.round((new Date(`${date}T12:00:00`) - new Date(`${today()}T12:00:00`)) / 86400000);
const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const esc = (v = '') => String(v).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const fmt = (v) => esc(v).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
const cleanNotes = (a) => (Array.isArray(a) ? a : []).map((x) => String(x == null ? '' : x).trim().slice(0, 140)).filter(Boolean).slice(0, 20); // notas de distracción
const num = (v, min, max, def) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
const time = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
/* Fase 3: quita una viñeta («- », «• », «* ») o una numeración («1. », «2) ») al inicio, pero NUNCA dígitos que son parte del texto («1789 fue…», «3,14 es…»). */
const stripBullet = (line) => String(line || '').replace(/^\s*(?:[-•*–]\s+|•\s*|\d{1,3}[.)]\s+)/, '').replace(/^\s*(?:[-•*–]\s+|\d{1,3}[.)]\s+)/, '');
const clean = (v, max = MAX_PROMPT) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanMl = (v, max) => String(v || '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
/* Fase 3: toda lectura de JSON ajeno descarta la clave «__proto__» (Object.assign la trataría como un cambio de prototipo del estado). */
const noProto = (k, v) => (k === '__proto__' ? undefined : v);
const parseJSON = (raw) => { try { return JSON.parse(raw || 'null', noProto); } catch { return null; } };
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
    theme: 'dark', accent: 'sky', accentCustom: '#5b84ff', density: 'normal', reduceMotion: false, immersiveDim: true, radius: 'soft', cardStyle: 'border', bgStyle: 'grid', headFont: 'serif', lineHeight: 'normal', letterSpacing: 'normal', cardText: 'normal', contentWidth: 'normal', sidebar: 'full', showMissions: true, showFact: true, engine: 'gemini', model: DEFAULT_MODEL, skipAi: false, mascot: true, mascotAvatar: 'bee', lang: 'en',
    recentTurns: [], statsPeriod: '30', dailyGoal: 2, notify: false, sound: true, name: '', proxyUrl: '', lastExport: '', backupNag: '',
    tutor: { subject: '', level: '', known: '', goal: '', style: 'uni', career: '', mode: 'socratic' }, lastRemind: '', lastRollover: '', welcomed: false
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
