// Pro · Bloque 2 · quiz y simulacro (js/21-quiz.js). Usa ?demo: todo en memoria.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => window.LearnyQuiz && typeof requirePro === 'function' && typeof state !== 'undefined');
});

const pro = (page) => page.evaluate(() => { setPro(true); showPage('practice'); });
const go = async (page, kind, type = 'mixed', n = 5) => {
  await pro(page);
  await page.selectOption('#quiz-type', type); await page.selectOption('#quiz-n', String(n));
  await page.click(`[data-quiz-go="${kind}"]`);
};
const seeded = `(() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })()`;

test('build: con menos de 4 tarjetas no hay quiz; opción múltiple trae 4 opciones distintas y el índice correcto', async ({ page }) => {
  const r = await page.evaluate((src) => {
    const rng = eval(src), c = (i) => ({ id: `c${i}`, subject: 'M', question: `Q${i}`, answer: `Respuesta única ${i}` });
    const few = LearnyQuiz.build([c(1), c(2), c(3)], { rng });
    const qs = LearnyQuiz.build([1, 2, 3, 4, 5, 6].map(c), { n: 6, type: 'mc', rng });
    return { few: few.length, n: qs.length, ok: qs.every((q) => q.options.length === 4 && new Set(q.options).size === 4 && q.options[q.correct] === q.a) };
  }, seeded);
  expect(r).toEqual({ few: 0, n: 6, ok: true });
});

test('shortMatch acepta la respuesta con las palabras clave y rechaza la vacía o la errónea', async ({ page }) => {
  const r = await page.evaluate(() => [
    LearnyQuiz.shortMatch('la mitocondria produce ATP', 'La mitocondria, mediante la respiración celular.').pass,
    LearnyQuiz.shortMatch('', 'algo').pass,
    LearnyQuiz.shortMatch('el núcleo', 'La mitocondria produce energía').pass,
    LearnyQuiz.shortMatch('1789', '1789, con la toma de la Bastilla').pass]);
  expect(r).toEqual([true, false, false, true]);
});

test('grade y summarize: sin responder cuenta como fallada', async ({ page }) => {
  const r = await page.evaluate(() => {
    const qs = [{ id: 'a', type: 'mc', correct: 1 }, { id: 'b', type: 'tf', truth: true }, { id: 'c', type: 'mc', correct: 0 }];
    const ans = [LearnyQuiz.grade(qs[0], 1), LearnyQuiz.grade(qs[1], false)];
    const s = LearnyQuiz.summarize(qs, ans);
    return { ok: s.ok, pct: s.pct, failed: s.failed };
  });
  expect(r).toEqual({ ok: 1, pct: 33, failed: ['b', 'c'] });
});

test('sin Pro, «Empezar quiz» abre la ventana Pro y al activarla empieza el quiz', async ({ page }) => {
  await page.evaluate(() => showPage('practice'));
  await page.click('[data-quiz-go="practice"]');
  await expect(page.locator('#modal-body [data-pro-on]')).toBeVisible();
  await page.click('[data-pro-on]');
  await expect(page.locator('#modal-body h2')).toContainText(/Question 1 of|Pregunta 1 de/);
});

test('quiz: responder «No lo sé» a todo da 0 aciertos, guarda historial y NO cambia el calendario de repaso', async ({ page }) => {
  const before = await page.evaluate(() => JSON.stringify(state.cards.map((c) => [c.id, c.nextReview, c.interval, c.easeFactor])));
  await go(page, 'practice', 'mixed', 5);
  for (let i = 0; i < 5; i++) {
    await page.click('[data-quiz="skip"]');
    await page.click('#modal-body button[type="submit"]');
  }
  await expect(page.locator('#modal-body .next-title')).toContainText(/0 of 5|0 de 5/);
  const h = await page.evaluate(() => JSON.parse(store.get('learny.quizzes')));
  expect(h).toHaveLength(1); expect(h[0]).toMatchObject({ mode: 'practice', n: 5, ok: 0 });
  expect(await page.evaluate(() => JSON.stringify(state.cards.map((c) => [c.id, c.nextReview, c.interval, c.easeFactor])))).toBe(before);
});

test('simulacro: no muestra comentario entre preguntas, tiene reloj y «Entregar ya» da resultado', async ({ page }) => {
  await go(page, 'exam', 'mixed', 5);
  await expect(page.locator('#quiz-clock')).toBeVisible();
  await page.click('[data-quiz="skip"]');
  await expect(page.locator('#modal-body h2')).toContainText(/Question 2 of|Pregunta 2 de/); // sin pantalla de comentario
  await page.click('[data-quiz="stop"]');
  await expect(page.locator('#modal-body h2')).toContainText(/Mock exam result|Resultado del simulacro/);
  expect(await page.evaluate(() => LearnyQuiz.session() && LearnyQuiz.session().tid)).toBe(0); // el reloj se detuvo
});

test('el reloj entrega el simulacro solo al acabarse el tiempo', async ({ page }) => {
  await go(page, 'exam', 'mixed', 5);
  await page.evaluate(() => { LearnyQuiz.session().endAt = Date.now() + 700; });
  await expect(page.locator('#modal-body h2')).toContainText(/Mock exam result|Resultado del simulacro/, { timeout: 4000 });
});

test('respuesta corta: se puede cambiar el resultado a mano y el historial se actualiza', async ({ page }) => {
  await go(page, 'practice', 'short', 5);
  await page.fill('#modal-body textarea[name="a"]', 'xyz');
  await page.click('#modal-body button[type="submit"]');
  await page.click('[data-quiz="ov"]');
  await expect(page.locator('#modal-body .modal-tip')).toContainText(/Correct|Incorrect/);
  await page.click('[data-quiz="stop"]');
  const h = await page.evaluate(() => JSON.parse(store.get('learny.quizzes')));
  expect(h.at(-1)).toMatchObject({ n: 1, ok: 1 });
});

test('cerrar con Esc a mitad limpia la sesión y se puede empezar otro quiz', async ({ page }) => {
  await go(page, 'practice', 'mixed', 5);
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => LearnyQuiz.session())).toBeNull();
  await page.click('[data-quiz-go="practice"]');
  await expect(page.locator('#modal-body h2')).toContainText(/Question 1 of|Pregunta 1 de/);
});

test('«Borrar todo» (learny:reset) vacía el historial y la tarjeta se ve traducida en inglés', async ({ page }) => {
  await page.evaluate(() => { store.set('learny.quizzes', JSON.stringify([{ date: today(), mode: 'practice', subject: '', n: 5, ok: 3, secs: 40 }])); showPage('practice'); renderAll(); });
  await expect(page.locator('#quiz-card')).toContainText('3 of 5 correct (60 %)');
  await expect(page.locator('#quiz-card h2')).toContainText('Quiz and mock exam');
  await page.evaluate(() => document.dispatchEvent(new Event('learny:reset')));
  expect(await page.evaluate(() => store.get('learny.quizzes'))).toBeNull();
});
