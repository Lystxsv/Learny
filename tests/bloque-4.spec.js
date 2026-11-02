// Bloque 4 · C6: cada repaso lleva id y hora exacta; los antiguos reciben id y quedan sin hora; SCHEMA no cambia.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo'); // demo: almacenamiento en memoria
  await page.waitForFunction(() => typeof hydrate === 'function' && typeof rateCard === 'function' && typeof reviewStamp === 'function');
});

test('un repaso nuevo guarda id y la hora en que se hizo', async ({ page }) => {
  const r = await page.evaluate(() => {
    state.reviews = []; state.cards = [normalizeCard({ subject: 'Bio', question: 'Q', answer: 'A', nextReview: '2000-01-01' })];
    const antes = Date.now();
    activeCard = state.cards[0]; revealed = true; answered = false; lastRateAt = 0;
    rateCard('easy');
    const despues = Date.now();
    const rv = state.reviews[0];
    return { n: state.reviews.length, id: rv.id, at: rv.at, enRango: rv.at >= antes && rv.at <= despues, date: rv.date, hoy: today(), rating: rv.rating };
  });
  expect(r.n).toBe(1);
  expect(typeof r.id).toBe('string'); expect(r.id.length).toBeGreaterThan(5);
  expect(r.enRango).toBe(true);
  expect(r.date).toBe(r.hoy); expect(r.rating).toBe('easy');
});

test('los ids de repasos distintos son distintos aunque se pidan en el mismo milisegundo', async ({ page }) => {
  const st = await page.evaluate(() => Array.from({ length: 5000 }, () => reviewStamp()));
  expect(new Set(st.map((x) => x.id)).size).toBe(5000);
  expect(st.every((x, i) => i === 0 || x.at > st[i - 1].at)).toBe(true); // la hora nunca retrocede ni se repite
});

test('«Deshacer» quita el repaso y no deja un id suelto', async ({ page }) => {
  const r = await page.evaluate(() => {
    state.reviews = []; state.cards = [normalizeCard({ subject: 'Bio', question: 'Q', answer: 'A', nextReview: '2000-01-01' })];
    activeCard = state.cards[0]; revealed = true; answered = false; lastRateAt = 0;
    rateCard('hard'); const rv = state.reviews[0]; dropReview(rv);
    return state.reviews.length;
  });
  expect(r).toBe(0);
});

test('repasos antiguos sin id ni hora: se conservan, reciben id y no se inventa la hora', async ({ page }) => {
  const r = await page.evaluate(() => {
    hydrate({ version: 4, reviews: [
      { date: '2026-01-02', cardId: 'a', subject: 'X', rating: 'easy', quality: 5 },
      { date: '2026-01-03', cardId: 'b', subject: 'X', rating: 'again', quality: 1 }
    ] });
    return state.reviews.map((x) => ({ id: x.id, at: x.at, date: x.date, rating: x.rating, cardId: x.cardId }));
  });
  expect(r).toHaveLength(2);
  expect(r[0].id).toBeTruthy(); expect(r[1].id).toBeTruthy(); expect(r[0].id).not.toBe(r[1].id);
  expect(r.every((x) => x.at === undefined)).toBe(true);
  expect(r.map((x) => [x.date, x.rating, x.cardId])).toEqual([['2026-01-02', 'easy', 'a'], ['2026-01-03', 'again', 'b']]);
});

test('ids repetidos o hora inválida (importaciones o datos dañados) se corrigen sin perder repasos', async ({ page }) => {
  const r = await page.evaluate(() => {
    hydrate({ version: 4, reviews: [
      { id: 'abc123', at: 1767312000000, date: '2026-01-02', cardId: 'a', subject: 'X', rating: 'easy' },
      { id: 'abc123', at: 1767312000001, date: '2026-01-02', cardId: 'b', subject: 'X', rating: 'hard' },
      { id: 'x', at: 'ayer', date: '2026-01-03', cardId: 'c', subject: 'X', rating: 'again' },
      { id: '<script>', at: -5, date: '2026-01-03', cardId: 'd', subject: 'X', rating: 'easy' },
      { id: 'ok-1', at: 1e300, date: '2026-01-04', cardId: 'e', subject: 'X', rating: 'easy' }
    ] });
    return state.reviews.map((x) => ({ id: x.id, at: x.at, cardId: x.cardId }));
  });
  expect(r).toHaveLength(5);
  expect(new Set(r.map((x) => x.id)).size).toBe(5);
  expect(r[0]).toMatchObject({ id: 'abc123', at: 1767312000000 });
  expect(r[1].at).toBe(1767312000001);
  expect(r.slice(2).every((x) => x.at === undefined)).toBe(true);
  expect(r.every((x) => /^[a-z0-9-]{3,}$/i.test(x.id))).toBe(true);
});

test('el esquema no cambia y guardar y volver a cargar conserva id y hora', async ({ page }) => {
  const r = await page.evaluate(() => {
    const antes = SCHEMA;
    hydrate({ version: 4, reviews: [{ id: 'keep1', at: 1767312000000, date: '2026-01-02', cardId: 'a', subject: 'X', rating: 'easy' }] });
    const json = JSON.parse(JSON.stringify(state)); hydrate(json);
    return { antes, ahora: SCHEMA, rv: state.reviews[0], version: state.version };
  });
  expect(r.antes).toBe(4); expect(r.ahora).toBe(4); expect(r.version).toBe(4);
  expect(r.rv).toMatchObject({ id: 'keep1', at: 1767312000000, date: '2026-01-02', rating: 'easy' });
});

test('el coste de espacio es pequeño: menos de 60 caracteres extra por repaso', async ({ page }) => {
  const extra = await page.evaluate(() => { const s = reviewStamp(); return JSON.stringify({ id: s.id, at: s.at }).length; });
  expect(extra).toBeLessThan(60);
});

test('el informe semanal incluye id y hora de los repasos de la semana', async ({ page }) => {
  const w = await page.evaluate(() => { state.reviews = [{ ...reviewStamp(), date: today(), cardId: 'a', subject: 'X', rating: 'easy', quality: 5 }]; return weekSlice(); });
  expect(w.reviews).toHaveLength(1);
  expect(typeof w.reviews[0].id).toBe('string');
  expect(typeof w.reviews[0].at).toBe('number');
});
