// Pruebas sin navegador de js/00-errores.js (red de seguridad de errores):  node tests/run-node-errores.js
const vm = require('vm'), fs = require('fs'), assert = require('assert');
const code = fs.readFileSync(__dirname + '/../js/00-errores.js', 'utf8');
function make(search, { toast = true, vis = 'visible', stored = null, now = null } = {}) {
  const handlers = {}, store = new Map(); if (stored) store.set('learny.errors', stored);
  const body = { children: [], append(x) { this.children.push(x); } };
  const doc = { visibilityState: vis, body, getElementById: (id) => body.children.find((c) => c.id === id) || null, createElement: () => ({ style: {}, setAttribute() {}, id: '' }) };
  const win = { addEventListener: (t, f) => { handlers[t] = f; }, localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) } };
  win.toasts = []; if (toast) win.toast = (m, t) => win.toasts.push([m, t]);
  const FakeDate = class extends Date { static now() { return now ? now.t : Date.now(); } }; // reloj controlable
  const ctx = { window: win, document: doc, location: { search }, Date: FakeDate, JSON, Math, Number, String, Array, Object, Map };
  vm.createContext(ctx); vm.runInContext(code, ctx); return { win, handlers, store, body };
}
const T = (n, f) => { try { f(); console.log('ok  ', n); } catch (e) { console.log('FAIL', n, e.message); process.exitCode = 1; } };
T('error no capturado: registra y avisa una vez', () => { const { win, handlers } = make(''); handlers.error({ target: win, message: 'boom', filename: 'http://x/js/06-hoy.js?v=1', lineno: 7 }); assert.equal(win.LearnyErrors.list().length, 1); assert.equal(win.LearnyErrors.list()[0].s, '06-hoy.js:7'); assert.equal(win.toasts.length, 1); assert.equal(win.toasts[0][1], 'error'); });
T('repetidos se agrupan (×n) y no repiten aviso', () => { const { win, handlers } = make(''); for (let i = 0; i < 5; i++) handlers.error({ target: win, message: 'igual', filename: 'a.js', lineno: 1 }); assert.equal(win.LearnyErrors.list().length, 1); assert.equal(win.LearnyErrors.list()[0].n, 5); assert.equal(win.toasts.length, 1); });
T('rechazo de red: se registra pero NO avisa', () => { const { win, handlers } = make(''); handlers.unhandledrejection({ reason: new TypeError('Failed to fetch') }); assert.equal(win.LearnyErrors.list().length, 1); assert.equal(win.toasts.length, 0); });
T('claves limpias', () => { const { win, handlers } = make(''); handlers.unhandledrejection({ reason: new Error('fallo https://g.com/v1?key=AIzaSyA1234567890123456789012345&x=1 y AIzaSyB1234567890123456789012345') }); const t = win.LearnyErrors.text(); assert(!/AIza/.test(t)); assert(/key=\*\*\*/.test(t)); });
T('demo: nada en disco', () => { const { win, handlers, store } = make('?demo'); handlers.error({ target: win, message: 'x' }); assert.equal(store.has('learny.errors'), false); });
T('fuera de demo: se guarda y se recarga', () => { const a = make(''); a.handlers.error({ target: a.win, message: 'persistente', filename: 'a.js', lineno: 2 }); const raw = a.store.get('learny.errors'); assert(raw); const b = make('', { stored: raw }); assert.equal(b.win.LearnyErrors.list()[0].m, 'persistente'); });
T('registro anterior corrupto no rompe', () => { assert.equal(make('', { stored: '{no es json' }).win.LearnyErrors.list().length, 0); });
T('un aviso cada 30 s y máximo 3 por sesión', () => {
  const clock = { t: 1e12 }, { win, handlers } = make('', { now: clock });
  handlers.error({ target: win, message: 'a' }); clock.t += 10000; handlers.error({ target: win, message: 'b' }); assert.equal(win.toasts.length, 1, 'a los 10 s no hay aviso nuevo');
  for (const m of ['c', 'd', 'e']) { clock.t += 31000; handlers.error({ target: win, message: m }); }
  assert.equal(win.toasts.length, 3, 'tope de 3 por sesión'); assert.equal(win.LearnyErrors.shown(), 3);
});
T('sin toast: banner de emergencia (una sola vez)', () => { const { win, handlers, body } = make('', { toast: false }); handlers.error({ target: win, message: 'no cargó 03' }); assert.equal(body.children.length, 1); assert.equal(body.children[0].id, 'learny-error-banner'); handlers.error({ target: win, message: 'otro' }); assert.equal(body.children.length, 1); });
T('pestaña oculta: sin aviso pero se registra', () => { const { win, handlers } = make('', { vis: 'hidden' }); handlers.error({ target: win, message: 'x' }); assert.equal(win.toasts.length, 0); assert.equal(win.LearnyErrors.list().length, 1); });
T('ruido de ResizeObserver y extensiones se ignoran', () => { const { win, handlers } = make(''); handlers.error({ target: win, message: 'ResizeObserver loop completed with undelivered notifications.' }); handlers.error({ target: win, message: 'ext', filename: 'chrome-extension://abc/x.js' }); assert.equal(win.LearnyErrors.list().length, 0); });
T('fallo al cargar un recurso (target ≠ window) se ignora', () => { const { win, handlers } = make(''); handlers.error({ target: { tagName: 'IMG' }, message: '' }); assert.equal(win.LearnyErrors.list().length, 0); });
T('un toast que lanza no rompe: pasa al banner', () => { const { win, handlers, body } = make(''); win.toast = () => { throw new Error('toast roto'); }; handlers.error({ target: win, message: 'x' }); assert.equal(body.children.length, 1); });
T('el registro se limita a 20 entradas', () => { const { win, handlers } = make(''); for (let i = 0; i < 30; i++) handlers.error({ target: win, message: 'e' + i }); assert.equal(win.LearnyErrors.list().length, 20); assert.equal(win.LearnyErrors.list()[19].m, 'e29'); });
