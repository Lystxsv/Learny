// v69 · modelo de IA por defecto y migración del valor antiguo.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof sanitizeSettings === 'function' && typeof DEFAULT_MODEL === 'string');
});

test('el modelo por defecto es gemini-4-argon', async ({ page }) => {
  expect(await page.evaluate(() => DEFAULT_MODEL)).toBe('gemini-4-argon');
});

test('quien tenía el modelo antiguo pasa al nuevo; vacío también', async ({ page }) => {
  const r = await page.evaluate(() => ['gemini-flash-latest', '  ', ''].map((m) => { const s = { ...state.settings, model: m }; sanitizeSettings(s, state.settings); return s.model; }));
  expect(r).toEqual(['gemini-4-argon', 'gemini-4-argon', 'gemini-4-argon']);
});

test('un modelo elegido a mano se respeta', async ({ page }) => {
  const m = await page.evaluate(() => { const s = { ...state.settings, model: 'gemini-2.5-flash-lite' }; sanitizeSettings(s, state.settings); return s.model; });
  expect(m).toBe('gemini-2.5-flash-lite');
});
