// Perfiles · Etapa 1: bienvenida de una pregunta y settings.profile.
const { test, expect } = require('@playwright/test');
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('learny.v3') || '{}'));

test('estado limpio: perfil vacío hasta elegir y bienvenida con tres botones', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof welcomeFlow === 'function');
  expect(await page.evaluate(() => state.settings.profile)).toBe('');
  const landing = page.locator('#landing button').first();
  if (await landing.isVisible().catch(() => false)) await landing.click();
  await expect(page.locator('[data-profile]')).toHaveCount(3);
});

test('elegir «Estudio por mi cuenta» guarda el perfil y Omitir cierra sin perderlo', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof welcomeFlow === 'function');
  const landing = page.locator('#landing button').first();
  if (await landing.isVisible().catch(() => false)) await landing.click();
  await page.locator('[data-profile="self"]').click();
  expect((await stored(page)).settings.profile).toBe('self');
  await page.locator('[data-w="skip"]').click();
  const s = (await stored(page)).settings;
  expect(s.profile).toBe('self'); expect(s.welcomed).toBe(true);
});

test('«Decidir después» deja el perfil en exam', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => typeof welcomeFlow === 'function');
  const landing = page.locator('#landing button').first();
  if (await landing.isVisible().catch(() => false)) await landing.click();
  await page.locator('[data-w="later"]').click();
  expect((await stored(page)).settings.profile).toBe('exam');
});

test('sanitizeSettings valida el perfil', async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof sanitizeSettings === 'function');
  const r = await page.evaluate(() => {
    const d = defaults().settings, out = {};
    for (const v of ['exam', 'self', 'teach', 'admin', 7, null, undefined]) { const s = { ...d, profile: v }; sanitizeSettings(s, d); out[String(v)] = s.profile; }
    return out;
  });
  expect(r).toEqual({ exam: 'exam', self: 'self', teach: 'teach', admin: '', 7: '', null: '', undefined: '' });
});

test('copia antigua sin perfil: con datos queda en exam; las nuevas conservan el perfil', async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof hydrate === 'function');
  const r = await page.evaluate(() => {
    hydrate({ version: 4, settings: { welcomed: true, name: 'Ana' }, notes: [{ text: 'x' }] }); const a = state.settings.profile;
    hydrate({ version: 4, settings: { welcomed: true, profile: 'teach' } }); const b = state.settings.profile;
    hydrate({ version: 4, settings: { profile: 'zzz', welcomed: false } }); const c = state.settings.profile;
    return [a, b, c];
  });
  expect(r).toEqual(['exam', 'teach', '']);
});

test('quien ya tiene datos no ve la bienvenida y recibe exam', async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('learny.v3')) localStorage.setItem('learny.v3', JSON.stringify({ version: 4, settings: { name: 'Eli' }, notes: [{ text: 'hola' }] })); });
  await page.goto('/');
  await page.waitForFunction(() => typeof welcomeFlow === 'function');
  await expect(page.locator('[data-profile]')).toHaveCount(0);
  expect(await page.evaluate(() => state.settings.profile)).toBe('exam');
});
