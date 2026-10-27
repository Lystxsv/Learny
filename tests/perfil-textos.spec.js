// Perfiles · Etapa 2: textos según el perfil (js/01b-perfil-textos.js). Usa ?demo.
const { test, expect } = require('@playwright/test');
test.beforeEach(async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof ptxt === 'function' && typeof applyProfileTexts === 'function');
});
const setProfile = (page, p, lang = 'es') => page.evaluate(([p, l]) => { state.settings.profile = p; state.settings.lang = l; applyAppearance(); }, [p, lang]);

test('ptxt devuelve la variante del perfil y exam por defecto', async ({ page }) => {
  const r = await page.evaluate(() => ['exam', 'self', 'teach', '', 'zzz'].map((p) => ptxt('realExam', { profile: p })));
  expect(r).toEqual(['Examen real', 'Prueba cronometrada', 'Prueba cronometrada', 'Examen real', 'Examen real']);
});
test('una clave desconocida devuelve la propia clave', async ({ page }) => {
  expect(await page.evaluate(() => ptxt('noExiste'))).toBe('noExiste');
});
test('cada clave tiene las tres variantes con español e inglés', async ({ page }) => {
  const bad = await page.evaluate(() => Object.entries(PROFILE_TEXT).filter(([, v]) => !PROFILE_IDS.every((p) => Array.isArray(v[p]) && v[p].length === 2 && v[p][0] && v[p][1])).map(([k]) => k));
  expect(bad).toEqual([]);
});
test('los elementos con data-ptxt cambian al cambiar el perfil (español)', async ({ page }) => {
  await setProfile(page, 'self');
  await expect(page.locator('#real-exam')).toHaveText('Prueba cronometrada');
  await setProfile(page, 'exam');
  await expect(page.locator('#real-exam')).toHaveText('Examen real');
});
test('en inglés se muestra la variante traducida', async ({ page }) => {
  await setProfile(page, 'self', 'en');
  await expect(page.locator('#real-exam')).toHaveText('Timed test');
});
test('«Hoy me cuesta arrancar» sigue el perfil', async ({ page }) => {
  await setProfile(page, 'self');
  await page.evaluate(() => { showPage('study'); renderAll(); });
  await expect(page.locator('[data-action="stuck"]')).toHaveText('Hoy me cuesta empezar');
});
test('window.Learny expone ptxt', async ({ page }) => {
  expect(await page.evaluate(() => typeof window.Learny.ptxt)).toBe('function');
});
test('el plan de recuperación usa el prefijo del perfil', async ({ page }) => {
  await setProfile(page, 'teach');
  await page.evaluate(() => showPage('planner'));
  await page.fill('#recovery-subject', 'Álgebra'); await page.fill('#recovery-miss', 'Factorizar');
  await page.click('#recovery-plan');
  const t = await page.evaluate(() => state.deadlines.at(-1).title);
  expect(t).toBe('Refuerzo: Álgebra');
});
