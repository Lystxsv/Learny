// Clase en la nube (profesor): fusión con la cuenta, subidas, borrados explícitos y estados. Usa ?demo y una nube simulada en memoria (no toca Firebase).
const { test, expect } = require('@playwright/test');

const boot = async (page) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => window.LearnyClassCloud && typeof state !== 'undefined' && typeof deckKey === 'function');
  await page.evaluate(() => { state.settings.lang = 'es'; state.settings.welcomed = true; LearnyI18n.sync(state.settings); state.reports = []; state.received = []; });
};
/* Nube simulada: Firestore en memoria con el MISMO orden alfabético de campos que devuelve el SDK real. */
const fake = (page, { signedIn = true, reports = [], received = [], failPut = false } = {}) => page.evaluate(([si, rep, rec, fp]) => {
  const sortObj = (v) => (Array.isArray(v) ? v.map(sortObj) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortObj(v[k])])) : v);
  const C = window.__C = { reports: new Map(rep.map((d) => [d.id, sortObj(d.data)])), received: new Map(rec.map((d) => [d.id, sortObj(d.data)])), puts: [], removes: [], lists: 0, failPut: fp };
  window.LearnyCloud = Object.freeze({
    ready: true,
    account: { available: true, user: () => (si ? { uid: 'u1', email: 'a@b.co' } : null), whenReady: Promise.resolve(null), onChange: () => () => {} },
    teaching: {
      available: true,
      list: async (k) => { C.lists++; return [...C[k]].map(([id, d]) => ({ ...d, id })); },
      put: async (k, id, d) => { if (C.failPut) throw new Error('No hay conexión con el servicio. Revisa tu internet e inténtalo de nuevo.'); C.puts.push([k, id]); C[k].set(id, sortObj(d)); },
      remove: async (k, id) => { C.removes.push([k, id]); C[k].delete(id); }
    }
  });
  document.dispatchEvent(new Event('learny:account-ready'));
}, [signedIn, reports, received, failPut]);
const REP = (student, date, extra = {}) => ({ deckId: 'abc', deckName: 'Historia', version: 1, student, date, total: 3, cards: [{ k: 'k1', q: 'Pregunta', n: 2, a: 1, last: 'again', iv: 1 }], ...extra });

const waitSync = (page) => page.waitForFunction(() => window.LearnyClassCloud.status().status === 'ok' || window.LearnyClassCloud.status().status === 'error', null, { timeout: 8000 });

test('al iniciar sesión se trae lo de la nube y se fusiona con lo local', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { state.reports = [{ id: 'local1', deckId: 'abc', deckName: 'Historia', version: 1, student: 'Ana', date: '2026-01-10', total: 3, cards: [{ k: 'k1', q: 'P', n: 1, a: 0, last: 'easy', iv: 1 }] }]; });
  const key = await page.evaluate(() => deckKey('abc|ana'));
  await fake(page, { reports: [
    { id: key, data: REP('Ana', '2026-02-01') },                // más reciente que la local → gana la nube
    { id: 'otro', data: REP('Luis', '2026-01-05') }               // alumno nuevo
  ], received: [{ id: 'abc', data: { deckId: 'abc', name: 'Historia', author: 'Prof', description: '', version: 2, importedAt: '2026-01-01', keys: ['k1', 'k2'] } }] });
  await page.evaluate(() => LearnyClassCloud.sync()); await waitSync(page);
  const r = await page.evaluate(() => ({ reps: state.reports.map((x) => [x.student, x.date]), rec: state.received.map((x) => [x.deckId, x.version]) }));
  expect(r.reps).toEqual(expect.arrayContaining([['Ana', '2026-02-01'], ['Luis', '2026-01-05']]));
  expect(r.reps).toHaveLength(2);
  expect(r.rec).toEqual([['abc', 2]]);
});

test('lo local que falta en la nube se sube; lo que ya está igual no se vuelve a subir', async ({ page }) => {
  await boot(page);
  await fake(page);
  await page.evaluate(() => { state.reports = [{ id: 'x1', deckId: 'abc', deckName: 'Historia', version: 1, student: 'Marta', date: '2026-03-01', total: 3, cards: [{ k: 'k1', q: 'P', n: 2, a: 1, last: 'again', iv: 1 }] }]; state.received = [{ deckId: 'abc', name: 'Historia', author: '', description: '', version: 1, importedAt: '2026-03-01', keys: ['k1'] }]; });
  await page.evaluate(() => LearnyClassCloud.sync()); await waitSync(page);
  expect(await page.evaluate(() => __C.puts.map((p) => p[0]).sort())).toEqual(['received', 'reports']);
  const n = await page.evaluate(() => __C.puts.length);
  await page.evaluate(() => LearnyClassCloud.sync()); await waitSync(page);
  expect(await page.evaluate(() => __C.puts.length)).toBe(n); // segunda lectura: nada cambió, nada se sube
});

test('quitar un informe lo borra de la cuenta; deshacer lo vuelve a subir', async ({ page }) => {
  await boot(page);
  await fake(page);
  await page.evaluate(() => { state.reports = [{ id: 'x1', deckId: 'abc', deckName: 'Historia', version: 1, student: 'Marta', date: '2026-03-01', total: 3, cards: [{ k: 'k1', q: 'P', n: 2, a: 1, last: 'again', iv: 1 }] }]; renderAll(); });
  await page.evaluate(() => LearnyClassCloud.sync()); await waitSync(page);
  expect(await page.evaluate(() => __C.reports.size)).toBe(1);
  await page.evaluate(() => { const r = state.reports[0]; state.reports.splice(0, 1); document.dispatchEvent(new CustomEvent('learny:class-removed', { detail: { kind: 'reports', item: r } })); });
  await expect.poll(() => page.evaluate(() => __C.reports.size)).toBe(0);
  expect(await page.evaluate(() => __C.removes.length)).toBe(1);
  // deshacer: la persona recupera el informe en local y la siguiente sincronización lo sube otra vez
  await page.evaluate(() => { state.reports.push({ id: 'x1', deckId: 'abc', deckName: 'Historia', version: 1, student: 'Marta', date: '2026-03-01', total: 3, cards: [{ k: 'k1', q: 'P', n: 2, a: 1, last: 'again', iv: 1 }] }); renderAll(); });
  await expect.poll(() => page.evaluate(() => __C.reports.size)).toBe(1);
});

test('restaurar o «Borrar todo» NO borra la nube, y tras borrar no se trae nada hasta recargar', async ({ page }) => {
  await boot(page);
  const key = await page.evaluate(() => deckKey('abc|ana'));
  await fake(page, { reports: [{ id: key, data: REP('Ana', '2026-02-01') }] });
  await page.evaluate(() => LearnyClassCloud.sync()); await waitSync(page);
  expect(await page.evaluate(() => state.reports.length)).toBe(1);
  await page.evaluate(() => { state.reports = []; document.dispatchEvent(new Event('learny:reset')); renderAll(); });
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => [__C.reports.size, __C.removes.length, state.reports.length])).toEqual([1, 0, 0]);
  await expect(page.locator('#class-sync')).toContainText('en pausa');
});

test('sin sesión no se toca la nube y se invita a iniciar sesión; los datos locales siguen', async ({ page }) => {
  await boot(page);
  await fake(page, { signedIn: false });
  await page.evaluate(() => { state.reports = [{ id: 'x1', deckId: 'abc', deckName: 'Historia', version: 1, student: 'Marta', date: '2026-03-01', total: 3, cards: [] }]; renderAll(); });
  await page.waitForTimeout(1500);
  expect(await page.evaluate(() => [__C.lists, __C.puts.length, state.reports.length])).toEqual([0, 0, 1]);
  await page.evaluate(() => showPage('analysis'));
  await expect(page.locator('#class-sync')).toContainText('Inicia sesión');
});

test('datos dañados que llegan de la nube se limpian y no rompen la app', async ({ page }) => {
  await boot(page);
  await fake(page, { reports: [
    { id: 'm1', data: { deckName: 'Historia', student: '<b>Zoe</b>', date: 'no-fecha', cards: [{ k: 'k', q: 'x', n: 1, a: 5, last: 'zzz' }, 'basura'], total: 'mil' } },
    { id: 'm2', data: { deckName: '', student: '', date: '2026-01-01', cards: [] } }
  ], received: [{ id: 'q', data: { deckId: 'q', name: '', version: 'x', keys: 5 } }] });
  await page.evaluate(() => LearnyClassCloud.sync()); await waitSync(page);
  const r = await page.evaluate(() => ({ reps: state.reports.map((x) => [x.student, x.date.length, x.cards.length]), rec: state.received.length }));
  expect(r.reps).toEqual([['<b>Zoe</b>', 10, 0]]); // la tarjeta con más fallos que repasos se descarta; el informe sin alumno o mazo, también
  expect(r.rec).toBe(0);
});

test('un fallo al subir muestra el error, no pierde datos locales y Reintentar lo resuelve', async ({ page }) => {
  await boot(page);
  await fake(page, { failPut: true });
  await page.evaluate(() => { state.reports = [{ id: 'x1', deckId: 'abc', deckName: 'Historia', version: 1, student: 'Marta', date: '2026-03-01', total: 3, cards: [] }]; renderAll(); });
  await page.evaluate(() => LearnyClassCloud.sync().catch(() => {})); await waitSync(page);
  expect(await page.evaluate(() => LearnyClassCloud.status().status)).toBe('error');
  await page.evaluate(() => showPage('analysis'));
  await expect(page.locator('#class-sync')).toContainText('No hay conexión');
  await page.evaluate(() => { __C.failPut = false; });
  await page.click('#class-sync [data-cloud-retry]'); await waitSync(page);
  expect(await page.evaluate(() => [LearnyClassCloud.status().status, __C.reports.size, state.reports.length])).toEqual(['ok', 1, 1]);
});

test('en inglés el estado se traduce', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { state.settings.lang = 'en'; LearnyI18n.sync(state.settings); });
  await fake(page, { signedIn: false });
  await page.evaluate(() => showPage('analysis'));
  await expect(page.locator('#class-sync')).toContainText('Sign in to also save this data');
});
