// Política de seguridad de contenido (<meta> de index.html) en el navegador real.
// OJO: este archivo NO usa bypassCSP, a propósito: aquí la política se aplica de verdad.
const { test, expect } = require('@playwright/test');

// Anota cada violación que el navegador detecta (el evento llega aunque la consola no lo muestre).
const boot = async (page) => {
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ← ${e.blockedURI || 'en línea'}`));
  });
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof state !== 'undefined' && typeof showPage === 'function' && typeof openSettings === 'function');
};
const violations = (page) => page.evaluate(() => window.__csp);

test('la política está puesta y el navegador la aplica: bloquea eval y scripts en línea', async ({ page }) => {
  await boot(page);
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);
  const r = await page.evaluate(() => {
    const out = { eval: '' };
    try { out.eval = String(eval('1 + 1')); } catch (e) { out.eval = e.name; }
    window.__inline = 0;
    const s = document.createElement('script'); s.textContent = 'window.__inline = 1'; document.head.append(s);
    out.inline = window.__inline;
    return out;
  });
  expect(r.eval).toBe('EvalError'); // si dice «2», la política no se está aplicando (¿se activó bypassCSP?)
  expect(r.inline).toBe(0);
  await expect.poll(async () => (await violations(page)).length).toBeGreaterThanOrEqual(2); // se registraron las dos violaciones provocadas
});

test('recorrer pantallas, Ajustes y la guía local no provoca ninguna violación ni recurso bloqueado', async ({ page }) => {
  const consola = [], fallos = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) consola.push(m.text()); });
  page.on('requestfailed', (r) => { if (r.url().startsWith('http://localhost')) fallos.push(`${r.url()} · ${r.failure()?.errorText}`); });
  await boot(page);

  for (const p of ['practice', 'library', 'planner', 'analysis', 'guide', 'study']) await page.evaluate((n) => showPage(n), p);

  await page.evaluate(() => openSettings());
  await expect(page.locator('#app-modal')).toHaveAttribute('open', '');
  await page.evaluate(() => document.querySelector('#app-modal').close());
  await expect(page.locator('#app-modal')).not.toHaveAttribute('open', '');

  // La «Guía local» tenía un onclick en línea (lo bloquea la política): ahora el botón Cerrar usa un listener.
  await page.selectOption('#search-engine', 'local');
  await page.fill('#ai-question', 'cómo estudiar mejor');
  await page.click('#ask-ai');
  await expect(page.locator('#app-modal [data-guide-close]')).toBeVisible();
  await page.click('[data-guide-close]');
  await expect(page.locator('#app-modal')).not.toHaveAttribute('open', '');

  expect(await violations(page)).toEqual([]);
  expect(consola).toEqual([]);
  expect(fallos).toEqual([]);
});
