// Bloque 3 · decisiones del 30-10-2026 y 01-11-2026: español como único idioma (sin pregunta de idioma ni selector; el inglés está en idioma-ingles/),
// metas visibles en todos los perfiles, Pro cancelado (todo gratis) y cuentas/nube congeladas.
const { test, expect } = require('@playwright/test');
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('learny.v3') || '{}'));

async function nuevo(page) {
  await page.goto('/');
  await page.waitForFunction(() => typeof welcomeFlow === 'function');
  const landing = page.locator('#landing button').first();
  if (await landing.isVisible().catch(() => false)) await landing.click();
}

test('usuario nuevo: la bienvenida empieza en el perfil y no pregunta el idioma', async ({ page }) => {
  await nuevo(page);
  await expect(page.locator('[data-profile]')).toHaveCount(3);
  await expect(page.locator('[data-lang]')).toHaveCount(0);
  await expect(page.locator('#modal-body h2')).toHaveText('¿Para qué usas Learny?');
  expect(await page.evaluate(() => [state.settings.lang, document.documentElement.lang])).toEqual(['es', 'es']);
});

test('«Decidir después» cierra la bienvenida y el idioma sigue siendo el español', async ({ page }) => {
  await nuevo(page);
  await page.locator('[data-w="later"]').click();
  const s = (await stored(page)).settings;
  expect(s.lang).toBe('es'); expect(s.welcomed).toBe(true);
});

test('quien tenía inglés guardado pasa a español al abrir la app', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof state === 'object' && typeof save === 'function');
  await page.evaluate(() => { state.settings.lang = 'en'; state.settings.welcomed = true; save(); });
  await page.reload();
  await page.waitForFunction(() => typeof state === 'object' && document.documentElement.lang);
  expect(await page.evaluate(() => [state.settings.lang, document.documentElement.lang])).toEqual(['es', 'es']);
});

test('sanitizeSettings fuerza el español con cualquier valor (copias antiguas con «en», basura o nada)', async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof sanitizeSettings === 'function');
  const r = await page.evaluate(() => ['en', 'fr', '', null, undefined, 5].map((l) => { const s = { ...state.settings, lang: l }; sanitizeSettings(s, state.settings); return s.lang; }));
  expect(r).toEqual(Array(6).fill('es'));
});

test('Ajustes no ofrece elegir idioma y la barra superior no tiene el botón EN/ES', async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof openSettings === 'function' && typeof state === 'object');
  await page.evaluate(() => openSettings());
  await expect(page.locator('#modal-body h2', { hasText: 'Ajustes' })).toHaveCount(1);
  await expect(page.locator('#modal-body [name="lang"]')).toHaveCount(0);
  await expect(page.locator('#lang-toggle')).toHaveCount(0);
  expect(await page.evaluate(() => typeof window.LearnyI18n)).toBe('undefined');
});

test('datos guardados sin idioma abren en español y sin la pregunta', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof state === 'object' && typeof save === 'function');
  await page.evaluate(() => { state.cards.push(normalizeCard({ subject: 'X', question: 'Q', answer: 'A' })); state.settings.welcomed = true; save(); const d = JSON.parse(localStorage.getItem('learny.v3')); delete d.settings.lang; localStorage.setItem('learny.v3', JSON.stringify(d)); });
  await page.reload();
  await page.waitForFunction(() => typeof state === 'object' && document.documentElement.lang);
  expect(await page.evaluate(() => [state.settings.lang, document.documentElement.lang])).toEqual(['es', 'es']);
  await expect(page.locator('[data-lang]')).toHaveCount(0);
});

test('con datos de usuario la bienvenida no se abre aunque no se haya marcado como vista', async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof welcomeFlow === 'function' && typeof state === 'object');
  expect(await page.evaluate(() => { state.settings.welcomed = false; state.cards.push(normalizeCard({ subject: 'X', question: 'Q', answer: 'A' })); welcomeFlow(); return !!document.querySelector('[data-profile]'); })).toBe(false);
});

test('las metas se ofrecen en todos los perfiles, también en el de examen', async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof showPage === 'function' && typeof state === 'object');
  for (const perfil of ['exam', 'self', 'teach']) {
    await page.evaluate((p) => { state.settings.profile = p; save(); renderAll(); showPage('planner'); }, perfil);
    await expect(page.locator('#goals-card'), perfil).toBeVisible();
    await expect(page.locator('#goals-card [data-g="new"]'), perfil).toBeVisible();
  }
});

test('Pro cancelado: exportar y quiz funcionan sin plan, sin etiqueta Pro y sin ventana de planes', async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof requirePro === 'function' && typeof state === 'object');
  expect(await page.evaluate(() => { let n = 0; requirePro('export', () => { n++; }); requirePro('quiz', () => { n++; }); return [n, isPro()]; })).toEqual([2, true]);
  await page.evaluate(() => showPage('library'));
  await expect(page.locator('#pro-export-card h2 .tag')).toHaveCount(0);
  await page.evaluate(() => showPage('practice'));
  await expect(page.locator('#quiz-card h2 .tag')).toHaveCount(0);
  await expect(page.locator('#quiz-card')).not.toContainText(/Ver qué incluye Pro|See what Pro includes/);
  await expect(page.locator('#pro-export-card')).not.toContainText(/Ver qué incluye Pro|See what Pro includes/);
});

test('cuentas y nube congeladas: Firebase no se inicializa y no hay botón «Entrar» ni sección Pro', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof state === 'object' && typeof showPage === 'function');
  expect(await page.evaluate(() => [typeof window.LearnyCloud, typeof window.LearnyAccount, typeof window.LearnyClassCloud])).toEqual(['undefined', 'undefined', 'undefined']); // el código de la nube vive en nube/ y no se carga
  await expect(page.locator('#account-button')).toBeHidden();
  await expect(page.locator('.nav-button[data-page="pro"]')).toBeHidden();
});
