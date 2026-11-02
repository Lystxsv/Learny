// Bloque 5 · PC1: predecir antes de revelar (opcional, 3 niveles), guardado en el repaso y resumen «Confianza frente a acierto».
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof renderConfidence === 'function' && typeof rateCard === 'function' && typeof state === 'object');
  await page.evaluate(() => {
    state.settings.lang = 'es'; state.settings.predict = true; state.reviews = [];
    state.cards = ['uno', 'dos', 'tres'].map((q) => normalizeCard({ subject: 'Bio', question: q, answer: q.toUpperCase(), nextReview: '2000-01-01' }));
    applyAppearance(); renderAll(); showPage('practice');
  });
});
const rate = async (page, rating) => { await page.locator('#reveal-card').click(); await page.locator(`#rating-row [data-rating="${rating}"]`).click(); };
const last = (page) => page.evaluate(() => state.reviews[state.reviews.length - 1]);

test('antes de revelar hay tres opciones con nombre accesible y son opcionales', async ({ page }) => {
  await expect(page.locator('#predict-row')).toBeVisible();
  await expect(page.locator('#predict-row [data-pred]')).toHaveCount(3);
  await expect(page.getByRole('group', { name: /qué tan seguro estás/i })).toBeVisible();
  for (const b of await page.locator('#predict-row [data-pred]').all()) await expect(b).toHaveAttribute('aria-pressed', 'false');
});

test('omitir: revelar y calificar sin elegir no guarda predicción', async ({ page }) => {
  await rate(page, 'easy');
  const rv = await last(page);
  expect(rv.rating).toBe('easy');
  expect(rv.pred).toBeUndefined();
});

test('elegir «Lo sé» lo guarda en el repaso, se ve tras revelar y la fila se oculta', async ({ page }) => {
  await page.locator('#predict-row [data-pred="know"]').click();
  await expect(page.locator('#predict-row [data-pred="know"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#reveal-card').click();
  await expect(page.locator('#predict-row')).toBeHidden();
  await expect(page.locator('#flashcard')).toContainText('Tu predicción:');
  await expect(page.locator('#flashcard')).toContainText('Lo sé');
  await page.locator('#rating-row [data-rating="again"]').click();
  expect(await last(page)).toMatchObject({ rating: 'again', pred: 'know' });
});

test('pulsar la misma opción otra vez la quita, y cambiar de opción la sustituye', async ({ page }) => {
  const b = (k) => page.locator(`#predict-row [data-pred="${k}"]`);
  await b('unsure').click(); await b('unsure').click();
  await expect(b('unsure')).toHaveAttribute('aria-pressed', 'false');
  await b('unsure').click(); await b('no').click();
  await expect(b('unsure')).toHaveAttribute('aria-pressed', 'false');
  await expect(b('no')).toHaveAttribute('aria-pressed', 'true');
  await rate(page, 'hard');
  expect((await last(page)).pred).toBe('no');
});

test('la predicción no pasa a la tarjeta siguiente', async ({ page }) => {
  await page.locator('#predict-row [data-pred="know"]').click();
  await rate(page, 'easy');
  for (const b of await page.locator('#predict-row [data-pred]').all()) await expect(b).toHaveAttribute('aria-pressed', 'false');
  await page.waitForTimeout(400); // la aplicación ignora dos calificaciones en menos de 350 ms
  await rate(page, 'easy');
  expect(await page.evaluate(() => state.reviews.length)).toBe(2);
  expect((await last(page)).pred).toBeUndefined();
});

test('un redibujado de la pantalla no pierde la elección ni la respuesta ya revelada', async ({ page }) => {
  await page.locator('#predict-row [data-pred="unsure"]').click();
  await page.evaluate(() => renderAll());
  await expect(page.locator('#predict-row [data-pred="unsure"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#reveal-card').click();
  await page.evaluate(() => renderAll());
  await expect(page.locator('#flashcard')).toContainText('Dudo');
});

test('en el modo examen no se pregunta', async ({ page }) => {
  await page.evaluate(() => startExam(undefined, 3));
  await expect(page.locator('#predict-row')).toBeHidden();
});

test('se puede desactivar en Ajustes y la opción está activada por defecto', async ({ page }) => {
  await page.evaluate(() => { document.querySelector('#open-settings, [data-open-settings]')?.click(); });
  const def = await page.evaluate(() => defaults().settings.predict);
  expect(def).toBe(true);
  await page.evaluate(() => { state.settings.predict = false; renderAll(); });
  await expect(page.locator('#predict-row')).toBeHidden();
  await page.evaluate(() => { state.settings.predict = true; renderAll(); });
  await expect(page.locator('#predict-row')).toBeVisible();
});

test('datos: una predicción inválida se descarta y las válidas se conservan', async ({ page }) => {
  const r = await page.evaluate(() => {
    hydrate({ version: 4, reviews: ['know', 'unsure', 'no', 'otra', 7, null].map((p, i) => ({ date: '2026-01-02', cardId: 'c' + i, subject: 'X', rating: 'easy', pred: p })) });
    return state.reviews.map((x) => x.pred);
  });
  expect(r).toEqual(['know', 'unsure', 'no', undefined, undefined, undefined]);
});

test('resumen: cuenta solo repasos con predicción y fuera del examen, y compara con lo recordado', async ({ page }) => {
  const c = await page.evaluate(() => {
    const d = today(), mk = (pred, rating, extra = {}) => ({ ...reviewStamp(), date: d, cardId: 'x', subject: 'X', rating, quality: qualityOf(rating), ...(pred ? { pred } : {}), ...extra });
    state.reviews = [
      ...Array.from({ length: 8 }, (_, i) => mk('know', i < 7 ? 'easy' : 'again')), // 7 de 8
      ...Array.from({ length: 6 }, (_, i) => mk('no', i < 2 ? 'hard' : 'again')),   // 2 de 6
      mk('unsure', 'hard'),
      mk(null, 'easy'),                                  // sin predicción: no cuenta
      mk('know', 'easy', { exam: true })                 // examen: no cuenta
    ];
    return confidenceStats(() => true);
  });
  expect(c).toEqual({ know: { ok: 7, n: 8 }, unsure: { ok: 1, n: 1 }, no: { ok: 2, n: 6 }, total: 15 });
});

test('la tarjeta del análisis muestra los porcentajes y la diferencia', async ({ page }) => {
  await page.evaluate(() => {
    const d = today(), mk = (pred, rating) => ({ ...reviewStamp(), date: d, cardId: 'x', subject: 'X', rating, quality: qualityOf(rating), pred });
    state.reviews = [...Array.from({ length: 8 }, (_, i) => mk('know', i < 7 ? 'easy' : 'again')), ...Array.from({ length: 6 }, (_, i) => mk('no', i < 2 ? 'hard' : 'again'))];
    document.querySelector('#stats-period').value = 'all'; renderAll(); showPage('analysis');
  });
  const card = page.locator('#confidence-card');
  await expect(card).toContainText('Confianza frente a acierto');
  await expect(card).toContainText('88%');   // 7 de 8
  await expect(card).toContainText('33%');   // 2 de 6
  await expect(card).toContainText('55 puntos'); // 88 − 33
  await expect(page.locator('#confidence-tag')).toHaveText('14 predicciones');
});

test('con pocas predicciones avisa de que la cifra aún no es fiable', async ({ page }) => {
  await page.evaluate(() => { state.reviews = []; document.querySelector('#stats-period').value = 'all'; renderAll(); showPage('analysis'); });
  await expect(page.locator('#confidence-note')).toContainText('aún no es fiable');
});
