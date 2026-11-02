// Fase 1 · capa de datos de metas. Corre sanitizeLearning dentro de la app real (?demo) y comprueba que sobrevive a guardar/recargar.
const { test, expect } = require('@playwright/test');
const abrir = async (page) => { await page.goto('/?demo'); await page.waitForFunction(() => typeof sanitizeLearning === 'function' && typeof state !== 'undefined'); };

test('estado nuevo trae learning vacío v1', async ({ page }) => {
  await abrir(page);
  const l = await page.evaluate(() => state.learning);
  expect(l).toEqual({ v: 1, goals: [], resources: [], doubts: [], log: [] });
});

test('saneado: tipos, enums, __proto__, javascript:, topes', async ({ page }) => {
  await abrir(page);
  const r = await page.evaluate(() => {
    const a = sanitizeLearning(JSON.parse('{"__proto__":{"x":1},"goals":[{"id":"a","title":"A","status":"zz","stages":[{"title":"e","level":9}]},{"id":"a","title":"B"},{"title":""}],"resources":[{"goalId":"a","title":"r","url":"javascript:alert(1)"}]}'));
    const b = sanitizeLearning({ goals: Array.from({ length: 45 }, (_, i) => ({ title: 'm' + i })) });
    return { a, polluted: ({}).x, b: b.goals.length, omitted: learningStatus.omitted };
  });
  expect(r.polluted).toBeUndefined();
  expect(r.a.goals).toHaveLength(2);
  expect(r.a.goals[0].status).toBe('active');
  expect(r.a.goals[0].stages[0].level).toBe('');
  expect(r.a.goals[0].id).not.toBe(r.a.goals[1].id);
  expect(r.a.resources[0].url).toBe('');
  expect(r.b).toBe(40); expect(r.omitted).toBe(5);
});

test('submetas: tercer nivel, rota, ciclo y tope de 12', async ({ page }) => {
  await abrir(page);
  const m = await page.evaluate(() => {
    const g = (id, parentId) => ({ id, parentId, title: id });
    const r = sanitizeLearning({ goals: [g('a', ''), g('b', 'a'), g('c', 'b'), g('d', 'zz'), g('x', 'y'), g('y', 'x'), g('m', ''), ...Array.from({ length: 15 }, (_, i) => g('k' + i, 'm'))] });
    return { p: Object.fromEntries(r.goals.map((x) => [x.id, x.parentId])), hijas: r.goals.filter((x) => x.parentId === 'm').length };
  });
  expect(m.p).toMatchObject({ a: '', b: 'a', c: '', d: '', x: '', y: '' });
  expect(m.hijas).toBe(12);
});

test('contenedor de versión más nueva se conserva idéntico y queda solo lectura', async ({ page }) => {
  await abrir(page);
  const r = await page.evaluate(() => {
    const raw = { v: 99, goals: [{ raro: 1 }], futuro: { a: [1] } };
    const out = sanitizeLearning(raw);
    return { igual: JSON.stringify(out) === JSON.stringify(raw), ro: learningReadOnly(), room: learningRoom('goal').ok };
  });
  expect(r).toEqual({ igual: true, ro: true, room: false });
});

test('log: conserva las 80 más recientes y descarta entradas vacías', async ({ page }) => {
  await abrir(page);
  const r = await page.evaluate(() => {
    const out = sanitizeLearning({ goals: [{ id: 'a', title: 'A' }], log: [{ goalId: 'a' }, ...Array.from({ length: 90 }, (_, i) => ({ goalId: 'a', next: 'n' + i }))] });
    return { n: out.log.length, first: out.log[0].next, last: out.log[79].next };
  });
  expect(r).toEqual({ n: 80, first: 'n10', last: 'n89' });
});

test('learning sobrevive a guardar y recargar (sin demo: la demo vive en memoria y se reinicia al recargar)', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof sanitizeLearning === 'function' && typeof state !== 'undefined');
  await page.evaluate(() => { state.learning.goals.push({ id: 'g1', parentId: '', title: 'Aprender inglés', why: '', current: '', outcome: '', weeklyMin: 0, targetDate: '', subjects: [], status: 'active', created: '', stages: [] }); save(); });
  await page.reload();
  await page.waitForFunction(() => typeof state !== 'undefined' && typeof sanitizeLearning === 'function');
  expect(await page.evaluate(() => state.learning.goals.map((g) => g.title))).toEqual(['Aprender inglés']);
  // quien solo tiene una meta ya no es «usuario nuevo» ni ve la bienvenida
  expect(await page.evaluate(() => [hasUserData(), isNewUser(), state.settings.welcomed])).toEqual([true, false, true]);
});

test('importar: una copia con learning no objeto se rechaza; la vista previa cuenta metas', async ({ page }) => {
  await abrir(page);
  const r = await page.evaluate(() => [validateBackup({ cards: [], learning: 5 }).ok, validateBackup({ cards: [], learning: [] }).ok, validateBackup({ cards: [] }).ok, validateBackup({ cards: [], learning: { v: 1, goals: [] } }).ok, learningGoalsOf({ goals: [{}, {}] }), learningGoalsOf(null)]);
  expect(r).toEqual([false, false, true, true, 2, 0]);
});

test('hydrate sanea state.learning en cualquier carga (también al adoptar datos de otra pestaña)', async ({ page }) => {
  await abrir(page);
  const r = await page.evaluate(() => { hydrate({ version: 4, learning: 'basura' }); const a = JSON.stringify(state.learning), bad = learningStatus.bad; hydrate({ version: 4, learning: { goals: [{ title: 'X', status: 'zz' }] } }); return { a, bad, st: state.learning.goals[0].status }; });
  expect(r).toEqual({ a: JSON.stringify({ v: 1, goals: [], resources: [], doubts: [], log: [] }), bad: true, st: 'active' });
});

test('exportar → importar conserva las metas (clave learning en la copia)', async ({ page }) => {
  await abrir(page);
  const r = await page.evaluate(() => { state.learning.goals.push({ id: 'a', title: 'Meta A' }); const { apiKey, ...safe } = state; const copy = JSON.parse(JSON.stringify(safe)); hydrate({ ...copy, apiKey: '' }); return state.learning.goals.map((g) => g.title); });
  expect(r).toEqual(['Meta A']);
});
