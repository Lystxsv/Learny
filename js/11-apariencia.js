/* Learny · parte 11 de 15 · Apariencia
   Modo del tutor, temas, acentos con contraste y preferencias.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

/* =========================================================
   Ajustes / import-export
   ========================================================= */
function syncTutorMode() { $('#ai-question').placeholder = $('#tutor-mode').value === 'direct' ? 'Pregunta y recibe una explicación directa…' : 'Pregunta a tu tutor socrático…'; }

/* ===== Apariencia (v16): applyAppearance solo toca estilos; applyPreferences además rellena los campos del tutor desde state (salvo keepTutor) ===== */
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
  try { window.LumiCompanion?.sync(s); } catch (e) { console.error('Learny · Lumi', e); } // la mascota sigue la preferencia (también en la vista previa de Ajustes)
}
try { // el tema Automático sigue al sistema
  const mq = window.matchMedia('(prefers-color-scheme: dark)'), onScheme = () => { if (liveSettings?.theme === 'auto') applyAppearance(liveSettings); };
  if (mq.addEventListener) mq.addEventListener('change', onScheme); else mq.addListener?.(onScheme);
} catch { /* sin matchMedia */ }
function applyPreferences({ keepTutor = false } = {}) { // keepTutor: no reescribe los campos del tutor (guardar Ajustes no cambia el contexto del tutor)
  applyAppearance();
  $('#daily-goal-input').value = state.settings.dailyGoal || 2;
  if (keepTutor) return;
  const t = state.settings.tutor;
  $('#tutor-subject').value = t.subject; $('#tutor-level').value = t.level; $('#tutor-known').value = t.known; $('#tutor-goal').value = t.goal;
  $('#tutor-style').value = t.style || 'uni'; $('#tutor-career').value = t.career || ''; $('#tutor-mode').value = t.mode || 'socratic'; syncTutorMode();
}
