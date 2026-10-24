// Fase 6 · lógica de intervalos (SM-2). nextSchedule() es pura; schedule() aplica su resultado.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo'); // demo: almacenamiento en memoria, nunca toca datos reales
  await page.waitForFunction(() => typeof nextSchedule === 'function' && typeof schedule === 'function');
});

// Calcula en la página: tarjeta de ejemplo + calificación → resultado
const calc = (page, card, rating) => page.evaluate(([c, r]) => nextSchedule(c, r), [card, rating]);
const card = (o = {}) => ({ interval: 0, repetitions: 0, easeFactor: 2.5, nextReview: '2000-01-01', ...o }); // vencida (fecha pasada)

test('tarjeta nueva: la primera vez vuelve en 1 día, la segunda en 6', async ({ page }) => {
  expect((await calc(page, card(), 'easy')).interval).toBe(1);
  const r1 = await calc(page, card({ repetitions: 1, interval: 1 }), 'easy');
  expect(r1.interval).toBe(6);
  expect(r1.repetitions).toBe(2);
});

test('tarjeta madura: «Fácil» multiplica por el factor de facilidad', async ({ page }) => {
  const r = await calc(page, card({ repetitions: 2, interval: 6 }), 'easy');
  expect(r.interval).toBe(15); // 6 × 2.5
  expect(r.repetitions).toBe(3);
  expect(r.easeFactor).toBe(2.6);
});

test('«Dudé» baja el factor; en tarjeta madura crece solo ×1,2 y no suma repeticiones', async ({ page }) => {
  const r = await calc(page, card({ repetitions: 2, interval: 6 }), 'hard');
  expect(r.interval).toBe(7); // round(6 × 1.2)
  expect(r.repetitions).toBe(2);
  expect(r.easeFactor).toBe(2.36);
});

test('«No lo sabía» reinicia: 1 día, 0 repeticiones y el factor no cambia', async ({ page }) => {
  const r = await calc(page, card({ repetitions: 5, interval: 40, easeFactor: 2.1 }), 'again');
  expect(r).toMatchObject({ interval: 1, repetitions: 0, easeFactor: 2.1, early: false });
});

test('el intervalo nunca pasa de 180 días', async ({ page }) => {
  const r = await calc(page, card({ repetitions: 9, interval: 170, easeFactor: 2.5 }), 'easy');
  expect(r.interval).toBe(180);
});

test('el factor de facilidad nunca baja de 1,3', async ({ page }) => {
  const r = await calc(page, card({ repetitions: 3, interval: 10, easeFactor: 1.3 }), 'hard');
  expect(r.easeFactor).toBe(1.3);
});

test('repaso anticipado (aún no vence) con «Dudé»/«Fácil»: no cambia nada', async ({ page }) => {
  const c = await page.evaluate(() => ({ interval: 6, repetitions: 2, easeFactor: 2.5, nextReview: addDays(today(), 3) }));
  for (const rating of ['hard', 'easy']) {
    const r = await calc(page, c, rating);
    expect(r).toMatchObject({ early: true, interval: 6, repetitions: 2, easeFactor: 2.5, nextReview: c.nextReview });
  }
  expect((await calc(page, c, 'again')).early).toBe(false); // fallar sí reprograma
});

test('nextSchedule no modifica la tarjeta', async ({ page }) => {
  const same = await page.evaluate(() => {
    const c = { interval: 6, repetitions: 2, easeFactor: 2.5, nextReview: '2000-01-01' }, before = JSON.stringify(c);
    ['again', 'hard', 'easy'].forEach((r) => nextSchedule(c, r));
    return JSON.stringify(c) === before;
  });
  expect(same).toBe(true);
});

test('schedule aplica exactamente lo que muestra nextSchedule y guarda el historial', async ({ page }) => {
  const out = await page.evaluate(() => {
    const res = [];
    for (const rating of ['again', 'hard', 'easy']) {
      const c = { interval: 6, repetitions: 2, easeFactor: 2.5, nextReview: '2000-01-01', history: [] };
      const n = nextSchedule(c, rating); schedule(c, rating);
      res.push({ ok: c.interval === n.interval && c.nextReview === n.nextReview && c.repetitions === n.repetitions && c.easeFactor === n.easeFactor, hist: c.history.length, last: c.lastReviewed === today() });
    }
    return res;
  });
  for (const o of out) expect(o).toEqual({ ok: true, hist: 1, last: true });
});

test('el historial de una tarjeta se limita a 40 repasos', async ({ page }) => {
  const n = await page.evaluate(() => {
    const c = { interval: 6, repetitions: 2, easeFactor: 2.5, nextReview: '2000-01-01', history: [] };
    for (let i = 0; i < 60; i++) { c.nextReview = '2000-01-01'; schedule(c, 'easy'); }
    return c.history.length;
  });
  expect(n).toBe(40);
});

test('propiedad: con cualquier estado y botón, el resultado es válido', async ({ page }) => {
  const bad = await page.evaluate(() => {
    let bad = 0;
    for (let i = 0; i < 5000; i++) {
      const c = { interval: 1 + Math.floor(Math.random() * 180), repetitions: Math.floor(Math.random() * 12), easeFactor: +(1.3 + Math.random() * 1.7).toFixed(2), nextReview: addDays(today(), Math.floor(Math.random() * 20) - 10) };
      const r = nextSchedule(c, ['again', 'hard', 'easy'][i % 3]);
      if (!(r.interval >= 1 && r.interval <= 180) || r.easeFactor < 1.3 || r.repetitions < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(r.nextReview)) bad++;
    }
    return bad;
  });
  expect(bad).toBe(0);
});
