// Pro · Bloque 2 · quiz y simulacro (js/21-quiz.js). Usa ?demo: todo en memoria.
const { test, expect } = require('@playwright/test');
test.use({ bypassCSP: true }); // estas pruebas ejecutan eval/new Function dentro de la página (la CSP de index.html lo bloquea a propósito); el resto de la suite corre con la política activa

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
    LearnyQuiz.shortMatch('la mitocondria y la respiración celular', 'La mitocondria, mediante la respiración celular.').pass,
    LearnyQuiz.shortMatch('', 'algo').pass,
    LearnyQuiz.shortMatch('el núcleo', 'La mitocondria produce energía').pass,
    LearnyQuiz.shortMatch('1789 toma de la Bastilla', '1789, con la toma de la Bastilla').pass]);
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

test('sin plan Pro (cancelado), «Empezar quiz» empieza directamente, sin ventana Pro', async ({ page }) => {
  await page.evaluate(() => showPage('practice'));
  await page.click('[data-quiz-go="practice"]');
  await expect(page.locator('#modal-body [data-pro-on]')).toHaveCount(0);
  await expect(page.locator('#modal-body h2')).toContainText(/Question 1 of|Pregunta 1 de/);
});

test('«Borrar todo» (learny:reset) vacía el historial de quizzes', async ({ page }) => {
  await page.evaluate(() => { store.set('learny.quizzes', JSON.stringify([{ date: today(), mode: 'practice', subject: '', n: 5, ok: 3, secs: 40 }])); showPage('practice'); renderAll(); });
  await expect(page.locator('#quiz-card')).toContainText('3 de 5');
  await expect(page.locator('#quiz-card h2')).toContainText('Quiz y examen simulado');
  await page.evaluate(() => document.dispatchEvent(new Event('learny:reset')));
  expect(await page.evaluate(() => store.get('learny.quizzes'))).toBeNull();
});
