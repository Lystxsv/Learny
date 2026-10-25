// v69 · modelo de IA por defecto, migración de valores anteriores y textos de ayuda sobre Gemini.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof sanitizeSettings === 'function' && typeof DEFAULT_MODEL === 'string');
});

// El botón #lang-toggle muestra el idioma al que se cambiaría («ES» si ahora está en inglés, «EN» si está en español).
const setLang = async (page, lang) => {
  const btn = page.locator('#lang-toggle');
  if ((await btn.textContent()).trim() === (lang === 'es' ? 'ES' : 'EN')) await btn.click();
  await expect(page.locator('html')).toHaveAttribute('lang', lang);
};

test('el modelo por defecto es gemini-3.8-flash', async ({ page }) => {
  expect(await page.evaluate(() => DEFAULT_MODEL)).toBe('gemini-3.8-flash');
});

test('los modelos por defecto anteriores y el vacío pasan al nuevo', async ({ page }) => {
  const r = await page.evaluate(() => ['gemini-flash-latest', 'gemini-4-argon', '  ', ''].map((m) => { const s = { ...state.settings, model: m }; sanitizeSettings(s, state.settings); return s.model; }));
  expect(r).toEqual(Array(4).fill('gemini-3.8-flash'));
});

test('un modelo elegido a mano se respeta', async ({ page }) => {
  const m = await page.evaluate(() => { const s = { ...state.settings, model: 'gemini-3.5-flash-lite' }; sanitizeSettings(s, state.settings); return s.model; });
  expect(m).toBe('gemini-3.5-flash-lite');
});

test('Ajustes explica qué es Gemini y enlaza a la clave y a los modelos, justo bajo el campo de la clave', async ({ page }) => {
  await setLang(page, 'es');
  await page.evaluate(() => openSettings());
  await page.locator('#settings-advanced > summary').click();
  const tips = page.locator('#settings-advanced label:has(input[name="apikey"]) + p.modal-tip, #settings-advanced label:has(input[name="apikey"]) + p.modal-tip + p.modal-tip');
  await expect(tips).toHaveCount(2);
  await expect(tips.nth(0)).toContainText('Gemini es la inteligencia artificial de Google');
  await expect(tips.nth(0).locator('a')).toHaveAttribute('href', 'https://aistudio.google.com/apikey');
  await expect(tips.nth(1).locator('a')).toHaveAttribute('href', 'https://ai.google.dev/gemini-api/docs/models');
});

test('la guía de uso explica Gemini y enlaza a los modelos, en español y en inglés', async ({ page }) => {
  await setLang(page, 'es');
  await expect(page.locator('#guide h2', { hasText: 'Qué es Gemini' })).toHaveCount(1);
  await expect(page.locator('#guide a[href="https://ai.google.dev/gemini-api/docs/models"]')).toHaveCount(1);
  await setLang(page, 'en');
  await expect(page.locator('#guide h2', { hasText: 'What Gemini is' })).toHaveCount(1);
  await expect(page.locator('#guide a[href="https://ai.google.dev/gemini-api/docs/models"]')).toHaveCount(1);
});

test('en inglés, el texto de Ajustes bajo la clave está traducido', async ({ page }) => {
  await setLang(page, 'en');
  await page.evaluate(() => openSettings());
  await page.locator('#settings-advanced > summary').click();
  const tips = page.locator('#settings-advanced label:has(input[name="apikey"]) + p.modal-tip');
  await expect(tips).toContainText('Gemini is the Google artificial intelligence that Learny uses');
  await expect(page.locator('#settings-advanced')).toContainText('Available models:');
});
