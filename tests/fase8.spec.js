// v71 · Fase 8 · límite de nuevas, tarjetas difíciles, tareas concretas y retención real.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof dueSplit === 'function' && typeof isLeech === 'function' && typeof retentionReal === 'function');
});

const addNew = (page, n) => page.evaluate((k) => { for (let i = 0; i < k; i++) state.cards.push(normalizeCard({ subject: 'Prueba', question: `N${i}`, answer: `R${i}`, nextReview: today() })); rev++; }, n);

test('límite de nuevas: sobran en «held» y no se pierden', async ({ page }) => {
  const r = await page.evaluate(() => { state.cards = []; state.settings.newPerDay = 3; for (let i = 0; i < 7; i++) state.cards.push(normalizeCard({ subject: 'P', question: `Q${i}`, answer: 'A', nextReview: today() })); rev++; return { due: dueCards().length, held: heldNewCards().length, total: state.cards.length }; });
  expect(r).toEqual({ due: 3, held: 4, total: 7 });
});

test('las tarjetas ya vistas nunca se limitan y 0 = sin límite', async ({ page }) => {
  const r = await page.evaluate(() => {
    state.cards = []; state.settings.newPerDay = 1;
    for (let i = 0; i < 5; i++) state.cards.push(normalizeCard({ subject: 'P', question: `V${i}`, answer: 'A', nextReview: addDays(today(), -1), lastReviewed: addDays(today(), -3), history: [{ date: addDays(today(), -3), rating: 'easy' }] }));
    for (let i = 0; i < 4; i++) state.cards.push(normalizeCard({ subject: 'P', question: `N${i}`, answer: 'A', nextReview: today() })); rev++;
    const a = dueCards().length; state.settings.newPerDay = 0; rev++; return { a, b: dueCards().length };
  });
  expect(r).toEqual({ a: 6, b: 9 });
});

test('estrenar una tarjeta hoy gasta cupo', async ({ page }) => {
  const r = await page.evaluate(() => {
    state.cards = []; state.settings.newPerDay = 2;
    for (let i = 0; i < 4; i++) state.cards.push(normalizeCard({ subject: 'P', question: `Q${i}`, answer: 'A', nextReview: today() })); rev++;
    const before = dueCards().length; schedule(state.cards[0], 'easy'); rev++;
    return { before, after: dueCards().length, held: heldNewCards().length };
  });
  expect(r).toEqual({ before: 2, after: 1, held: 2 }); // una se estrenó, queda 1 cupo; las otras 2 esperan
});

test('Practicar ofrece adelantar nuevas cuando solo quedan retenidas', async ({ page }) => {
  await page.evaluate(() => { state.cards = []; state.settings.newPerDay = 1; for (let i = 0; i < 3; i++) state.cards.push(normalizeCard({ subject: 'P', question: `Q${i}`, answer: 'A', nextReview: today() })); schedule(state.cards[0], 'easy'); save(); showPage('practice'); renderAll(); });
  await expect(page.locator('[data-empty="more-new"]')).toBeVisible();
  await page.click('[data-empty="more-new"]');
  expect(await page.evaluate(() => !!exam)).toBe(true);
});

test('tarjeta difícil: 4 fallos la marcan; editarla la da por atendida', async ({ page }) => {
  const r = await page.evaluate(() => {
    const hist = [0, 1, 2, 3].map((i) => ({ date: addDays(today(), -10 + i), rating: 'again', quality: 1 }));
    state.cards = [normalizeCard({ subject: 'P', question: 'Q', answer: 'A', history: hist })]; rev++;
    const c = state.cards[0], a = isLeech(c), n = leechCards().length;
    c.leechSince = today(); rev++;
    return { a, n, after: isLeech(c), count: leechCount(c) };
  });
  expect(r).toEqual({ a: true, n: 1, after: false, count: 0 });
});

test('Reforzar lista las tarjetas difíciles y «Dejarla como está» se puede deshacer', async ({ page }) => {
  await page.evaluate(() => {
    const hist = [0, 1, 2, 3].map((i) => ({ date: addDays(today(), -10 + i), rating: 'again', quality: 1 }));
    state.cards = [normalizeCard({ subject: 'P', question: 'Difícil', answer: 'A', history: hist })]; save(); showPage('analysis'); renderAll();
  });
  await expect(page.locator('#leech-list [data-leech-open]')).toHaveCount(1);
  await page.click('#leech-list [data-leech-open]');
  await page.click('[data-leech="ignore"]');
  await expect(page.locator('#leech-list [data-leech-open]')).toHaveCount(0);
  await page.click('.toast-action');
  await expect(page.locator('#leech-list [data-leech-open]')).toHaveCount(1);
});

test('retención real: separa jóvenes y maduras con el intervalo del historial', async ({ page }) => {
  const r = await page.evaluate(() => {
    state.cards = [normalizeCard({ subject: 'P', question: 'Q', answer: 'A', history: [{ date: addDays(today(), -40), rating: 'easy' }, { date: addDays(today(), -15), rating: 'easy' }, { date: addDays(today(), -12), rating: 'again' }] })]; rev++;
    return retentionReal(() => true);
  });
  expect(r).toEqual({ young: { ok: 0, n: 1 }, mature: { ok: 1, n: 1 } });
});

test('dos repasos el mismo día no cuentan como retención', async ({ page }) => {
  const r = await page.evaluate(() => { state.cards = [normalizeCard({ subject: 'P', question: 'Q', answer: 'A', history: [{ date: today(), rating: 'again' }, { date: today(), rating: 'easy' }] })]; return retentionReal(() => true); });
  expect(r).toEqual({ young: { ok: 0, n: 0 }, mature: { ok: 0, n: 0 } });
});

test('tarea de repaso con cifra real y botón Empezar', async ({ page }) => {
  const r = await page.evaluate(() => {
    state.cards = []; state.settings.newPerDay = 0;
    for (let i = 0; i < 3; i++) state.cards.push(normalizeCard({ subject: 'Biología', question: `Q${i}`, answer: 'A', nextReview: today() }));
    const d = { id: 'd1', title: 'Parcial', subject: 'Biología', date: addDays(today(), 5), difficulty: 3, dailyMinutes: 40 };
    state.deadlines = [d]; state.tasks = [{ id: 't1', deadlineId: 'd1', date: today(), phase: 'repaso', title: 'x', done: false, cardTarget: 0 }]; rev++;
    return taskDetail(state.tasks[0], d);
  });
  expect(r).toEqual({ text: 'Hoy: 3 tarjetas de Biología por repasar.', go: 'due' });
  await page.evaluate(() => { showPage('planner'); renderAll(); });
  await expect(page.locator('#today-tasks .task-go')).toContainText('3 tarjetas de Biología');
  await page.click('[data-task-go="t1"]');
  expect(await page.evaluate(() => !!exam)).toBe(true);
});

test('el ajuste se valida: fuera de rango se acota', async ({ page }) => {
  const r = await page.evaluate(() => ['x', -5, 999, 7].map((v) => { const s = { ...state.settings, newPerDay: v }; sanitizeSettings(s, defaults().settings); return s.newPerDay; }));
  expect(r).toEqual([20, 0, 200, 7]);
});
