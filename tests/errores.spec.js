// Red de seguridad de errores (js/00-errores.js) en el navegador real.
const { test, expect } = require('@playwright/test');
test.use({ bypassCSP: true }); // estas pruebas ejecutan eval/new Function dentro de la página (la CSP de index.html lo bloquea a propósito); el resto de la suite corre con la política activa

const boot = async (page, url = '/?demo') => {
  await page.goto(url);
  await page.waitForFunction(() => window.LearnyErrors && typeof state !== 'undefined' && typeof toast === 'function');
  // Aviso de arranque (si lo hubo) fuera de en medio: así se ve solo lo que provoca cada prueba.
  await page.evaluate(() => { const t = document.querySelector('#toast'); t.className = 'toast'; t.textContent = ''; });
};
const later = (page, js) => page.evaluate((src) => { setTimeout(new Function(src), 0); }, js); // el error ocurre fuera de evaluate, como uno real
const shown = (page) => page.locator('#toast.show');

test('un error no capturado se registra y avisa con un mensaje claro', async ({ page }) => {
  await boot(page);
  await later(page, "throw new Error('prueba-error')");
  await expect(shown(page)).toContainText('Algo no salió como esperaba');
  const l = await page.evaluate(() => LearnyErrors.list());
  expect(l.length).toBe(1);
  expect(l[0].m).toContain('prueba-error');
});

test('una promesa rechazada sin capturar también se registra y avisa', async ({ page }) => {
  await boot(page);
  await later(page, "Promise.reject(new Error('rechazo-prueba'))");
  await expect(shown(page)).toContainText('Algo no salió como esperaba');
  expect(await page.evaluate(() => LearnyErrors.text())).toContain('rechazo-prueba');
});

test('un fallo de red normal se registra pero no molesta', async ({ page }) => {
  await boot(page);
  await later(page, "Promise.reject(new TypeError('Failed to fetch'))");
  await expect.poll(() => page.evaluate(() => LearnyErrors.list().length)).toBe(1);
  await page.waitForTimeout(400); // el aviso, si existiera, tarda ~40 ms en escribirse
  await expect(shown(page)).toHaveCount(0);
});

test('nunca se guarda una clave de API en el registro', async ({ page }) => {
  await boot(page);
  await later(page, "throw new Error('fallo https://g.com/v1?key=AIzaSyA1234567890123456789012345&x=1')");
  await expect.poll(() => page.evaluate(() => LearnyErrors.list().length)).toBe(1);
  const t = await page.evaluate(() => LearnyErrors.text());
  expect(t).not.toContain('AIza');
  expect(t).toContain('key=***');
});

test('una ráfaga de errores da un solo aviso', async ({ page }) => {
  await boot(page);
  await later(page, "for (let i = 0; i < 6; i++) setTimeout(() => { throw new Error('rafaga-' + i); }, 0);");
  await expect.poll(() => page.evaluate(() => LearnyErrors.list().length)).toBe(6);
  expect(await page.evaluate(() => LearnyErrors.shown())).toBe(1);
});

test('en la demo no se escribe nada en disco; fuera de la demo sí queda el registro', async ({ page }) => {
  await boot(page, '/?demo');
  await later(page, "throw new Error('solo-memoria')");
  await expect.poll(() => page.evaluate(() => LearnyErrors.list().length)).toBe(1);
  expect(await page.evaluate(() => window.localStorage.getItem('learny.errors'))).toBeNull();

  await boot(page, '/');
  await later(page, "throw new Error('queda-en-disco')");
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('learny.errors') || '')).toContain('queda-en-disco');
});

test('si otra parte de la app no carga, aparece un banner en vez de fallar en silencio', async ({ page }) => {
  await page.route('**/js/03-interfaz.js', (r) => r.abort()); // sin esta parte no existe toast()
  await page.goto('/?demo');
  const b = page.locator('#learny-error-banner');
  await expect(b).toBeVisible();
  await expect(b).toHaveAttribute('role', 'alert');
  await expect(b).toContainText('no pudo cargar por completo');
});
