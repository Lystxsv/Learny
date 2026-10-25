// Perfiles · Etapa 3a: opciones de accesibilidad en el paso «Personalizar» de la bienvenida.
const { test, expect } = require('@playwright/test');

const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('learny.v3') || '{}'));
const base = (page) => page.evaluate(() => document.documentElement.style.getPropertyValue('--base'));

// Abre la bienvenida (estado limpio) y llega al paso «Personalizar» eligiendo un perfil.
async function toPersonalize(page, opts = {}) {
  await page.goto('/');
  await page.waitForFunction(() => typeof welcomeFlow === 'function');
  const landing = page.locator('#landing button').first();
  if (await landing.isVisible().catch(() => false)) await landing.click();
  await page.locator('[data-profile="self"]').click();
  await expect(page.locator('[name="fs"]')).toHaveCount(3);
}
const pick = (page, sel) => page.locator(sel).check({ force: true });

test('el paso «Personalizar» ofrece tamaño de texto, lectura fácil y reducir animaciones', async ({ page }) => {
  await toPersonalize(page);
  await expect(page.locator('[name="fs"]')).toHaveCount(3);
  await expect(page.locator('[name="fs"][value="16"]')).toBeChecked();
  await expect(page.locator('[name="easy"]')).not.toBeChecked();
  await expect(page.locator('[name="calm"]')).not.toBeChecked();
  // el grupo de tamaño tiene nombre accesible
  await expect(page.getByRole('group', { name: /text size|tamaño de texto/i })).toHaveCount(1);
});

test('elegir «Grande» cambia el texto al instante y «Terminar» lo guarda', async ({ page }) => {
  await toPersonalize(page);
  await pick(page, '[name="fs"][value="19"]');
  expect(await base(page)).toBe('118.75%');
  expect((await stored(page)).settings.fontSize).toBe(16); // aún no se guardó
  await page.locator('#modal-body button[type="submit"]').click();
  expect((await stored(page)).settings.fontSize).toBe(19);
  expect(await base(page)).toBe('118.75%');
});

test('«Lectura fácil» aplica la fuente y se guarda', async ({ page }) => {
  await toPersonalize(page);
  await pick(page, '[name="easy"]');
  await expect(page.locator('body')).toHaveAttribute('data-font', 'dyslexic');
  await page.locator('#modal-body button[type="submit"]').click();
  expect((await stored(page)).settings.font).toBe('dyslexic');
});

test('«Reducir animaciones» se aplica y se guarda', async ({ page }) => {
  await toPersonalize(page);
  await pick(page, '[name="calm"]');
  await expect(page.locator('body')).toHaveClass(/reduce-motion/);
  await page.locator('#modal-body button[type="submit"]').click();
  expect((await stored(page)).settings.reduceMotion).toBe(true);
});

test('Omitir revierte la vista previa y no guarda las opciones', async ({ page }) => {
  await toPersonalize(page);
  await pick(page, '[name="fs"][value="22"]'); await pick(page, '[name="easy"]'); await pick(page, '[name="calm"]');
  await page.locator('[data-w="skip"]').click();
  expect(await base(page)).toBe('100%');
  await expect(page.locator('body')).not.toHaveClass(/reduce-motion/);
  await expect(page.locator('body')).not.toHaveAttribute('data-font', 'dyslexic');
  const s = (await stored(page)).settings;
  expect(s).toMatchObject({ fontSize: 16, font: 'sans', reduceMotion: false, welcomed: true });
});

test('Esc revierte la vista previa', async ({ page }) => {
  await toPersonalize(page);
  await pick(page, '[name="fs"][value="22"]');
  expect(await base(page)).toBe('137.5%');
  await page.keyboard.press('Escape');
  expect(await base(page)).toBe('100%');
  expect((await stored(page)).settings.fontSize).toBe(16);
});

test('Atrás y volver conserva lo elegido', async ({ page }) => {
  await toPersonalize(page);
  await pick(page, '[name="fs"][value="19"]'); await pick(page, '[name="easy"]');
  await page.locator('[data-w="back"]').click();
  await page.locator('[data-profile="self"]').click();
  await expect(page.locator('[name="fs"][value="19"]')).toBeChecked();
  await expect(page.locator('[name="easy"]')).toBeChecked();
});

test('con movimiento reducido en el sistema se muestra el aviso', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await toPersonalize(page);
  await expect(page.locator('#modal-body .hint', { hasText: /sistema|system/i })).toHaveCount(1);
});

test('sin movimiento reducido en el sistema no hay aviso', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await toPersonalize(page);
  await expect(page.locator('#modal-body .hint', { hasText: /sistema|system/i })).toHaveCount(0);
});

test('«Terminar» sin tocar nada deja los ajustes de siempre', async ({ page }) => {
  await toPersonalize(page);
  await page.locator('#modal-body button[type="submit"]').click();
  expect((await stored(page)).settings).toMatchObject({ fontSize: 16, font: 'sans', reduceMotion: false, profile: 'self', welcomed: true });
});

test('sin desborde horizontal a 320 px con texto muy grande', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await toPersonalize(page);
  await pick(page, '[name="fs"][value="22"]');
  const over = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(over).toBe(false);
});
