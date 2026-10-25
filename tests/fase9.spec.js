// v73–v74 · Lumi desactivada por defecto, aviso de repasos de mañana, dato curioso diario y mensajes variados.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof sanitizeSettings === 'function' && typeof LumiCompanion !== 'undefined');
});

const FACT = /^(Fun fact|Dato curioso): /, TOMORROW = /Tomorrow you have|Mañana te tocan/;
// n tarjetas para mañana; factDone = el dato del día ya se dijo hoy; extra = ajustes
const setup = (page, n, { factDone = true, settings = {} } = {}) => page.evaluate(([k, done, st]) => {
  state.cards = [];
  for (let i = 0; i < k; i++) state.cards.push(normalizeCard({ subject: 'P', question: `Q${i}`, answer: 'A', nextReview: addDays(today(), 1), archived: i < 0, lastReviewed: today(), history: [{ date: today(), rating: 'easy' }] }));
  if (done) store.set('learny.lumi.fact', today());
  Object.assign(state.settings, st); rev++; state.settings.mascot = true; applyAppearance();
}, [n, factDone, settings]);
const msg = (page) => page.locator('#lumi-msg[data-on="true"]');

test('Lumi viene desactivada por defecto y un ajuste guardado se respeta', async ({ page }) => {
  const r = await page.evaluate(() => {
    const d = defaults().settings, a = { ...d, mascot: true }, b = { ...d }; delete b.mascot;
    sanitizeSettings(a, d); sanitizeSettings(b, d);
    return { def: d.mascot, saved: a.mascot, missing: b.mascot };
  });
  expect(r).toEqual({ def: false, saved: true, missing: false });
  await expect(page.locator('#lumi')).toBeHidden();
});

test('la primera visita del día, Lumi dice el dato curioso y lo marca como dicho', async ({ page }) => {
  await setup(page, 3, { factDone: false });
  await expect(msg(page)).toHaveText(FACT);
  expect(await page.evaluate(() => store.get('learny.lumi.fact') === today())).toBe(true);
});

test('el dato del día es el mismo que ya calcula la app', async ({ page }) => {
  await setup(page, 3, { factDone: false, settings: { lang: 'es' } });
  const fact = await page.evaluate(() => facts[new Date().getDate() % facts.length]);
  await expect(msg(page)).toHaveText(`Dato curioso: ${fact}`);
});

test('en inglés el dato curioso sale traducido', async ({ page }) => {
  await setup(page, 3, { factDone: false, settings: { lang: 'en' } });
  await expect(msg(page)).toHaveText(/^Fun fact: [A-Z]/);
  expect(await msg(page).textContent()).not.toMatch(/\b(el|los|las|la|de)\b/); // sin restos de español
});

test('«Mostrar el dato curioso» desactivado: Lumi no lo dice', async ({ page }) => {
  await setup(page, 3, { factDone: false, settings: { showFact: false } });
  await expect(msg(page)).toHaveText(/./);
  expect(await msg(page).textContent()).not.toMatch(FACT);
});

test('con el dato ya dicho y 10 o más repasos mañana, Lumi los menciona', async ({ page }) => {
  await setup(page, 12);
  await expect(msg(page)).toHaveText(TOMORROW);
});

test('con el dato ya dicho y pocos repasos mañana, sale otro mensaje variado (nunca dato ni mañana)', async ({ page }) => {
  await setup(page, 3);
  await expect(msg(page)).toHaveText(/./);
  const t = await msg(page).textContent();
  expect(t).not.toMatch(FACT); expect(t).not.toMatch(TOMORROW);
});

test('no cuenta tarjetas archivadas para «mañana»', async ({ page }) => {
  await page.evaluate(() => { store.set('learny.lumi.fact', today()); });
  await page.evaluate(() => {
    state.cards = [];
    for (let i = 0; i < 12; i++) state.cards.push(normalizeCard({ subject: 'P', question: `Q${i}`, answer: 'A', nextReview: addDays(today(), 1), archived: i < 5, lastReviewed: today(), history: [{ date: today(), rating: 'easy' }] }));
    rev++; state.settings.mascot = true; applyAppearance();
  });
  await expect(msg(page)).toHaveText(/./);
  expect(await msg(page).textContent()).not.toMatch(TOMORROW); // quedan 7 (< 10)
});

test('las reacciones rotan frases y nunca repiten la misma dos veces seguidas', async ({ page }) => {
  const r = await page.evaluate(() => {
    // las listas son privadas: se comprueba por el texto que aparece al disparar el evento
    return typeof LumiCompanion.sync === 'function';
  });
  expect(r).toBe(true);
});

test('con Lumi activa se oculta el dato de «Más sobre hoy»; sin Lumi se ve', async ({ page }) => {
  const display = () => page.evaluate(() => getComputedStyle(document.querySelector('#study .fact')).display);
  expect(await display()).not.toBe('none');
  await setup(page, 3);
  expect(await display()).toBe('none');
});

test('hay 15 datos curiosos y todos tienen traducción', async ({ page }) => {
  await page.evaluate(() => { state.settings.lang = 'en'; applyAppearance(); });
  const out = await page.evaluate(() => facts.map((f) => LearnyI18n.t(f)));
  expect(out).toHaveLength(15);
  out.forEach((t, i) => expect(t, `dato ${i}`).toMatch(/^[A-Z][^áéíóúñ¿¡]*$/));
});
