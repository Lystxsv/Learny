// v70 · Fase 7a · crear varias tarjetas seguidas, tarjeta inversa y «Crear con IA» a la vista.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof cardForm === 'function' && typeof state !== 'undefined');
  await page.evaluate(() => cardForm());
});

const fill = async (page, q, a, subject) => {
  if (subject !== undefined) await page.fill('#modal-body [name="subject"]', subject);
  await page.fill('#modal-body [name="question"]', q);
  await page.fill('#modal-body [name="answer"]', a);
};
const count = (page) => page.evaluate(() => state.cards.length);

test('«Crear tarjeta» guarda y cierra la ventana (como siempre)', async ({ page }) => {
  const n = await count(page);
  await fill(page, 'P1', 'R1', 'Prueba');
  await page.click('#save-card');
  expect(await count(page)).toBe(n + 1);
  await expect(page.locator('#app-modal')).not.toHaveAttribute('open', '');
});

test('«Guardar y añadir otra»: guarda, mantiene la materia, vacía los campos y enfoca la pregunta', async ({ page }) => {
  const n = await count(page);
  await fill(page, 'P1', 'R1', 'Prueba');
  await page.click('#save-add-another');
  expect(await count(page)).toBe(n + 1);
  await expect(page.locator('#app-modal')).toHaveAttribute('open', '');
  await expect(page.locator('#modal-body [name="subject"]')).toHaveValue('Prueba');
  await expect(page.locator('#modal-body [name="question"]')).toHaveValue('');
  await expect(page.locator('#modal-body [name="answer"]')).toHaveValue('');
  await expect(page.locator('#modal-body [name="question"]')).toBeFocused();
  await expect(page.locator('#modal-body .modal-tip')).toContainText('1');
  await fill(page, 'P2', 'R2');
  await page.click('#save-add-another');
  expect(await count(page)).toBe(n + 2);
  await expect(page.locator('#modal-body .modal-tip')).toContainText('2');
});

test('Ctrl+Intro guarda y añade otra', async ({ page }) => {
  const n = await count(page);
  await fill(page, 'P1', 'R1', 'Prueba');
  await page.press('#modal-body [name="answer"]', 'Control+Enter');
  expect(await count(page)).toBe(n + 1);
  await expect(page.locator('#modal-body [name="question"]')).toBeFocused();
});

test('una validación fallida con «añadir otra» no deja el modo pegado: después «Crear tarjeta» cierra', async ({ page }) => {
  const n = await count(page);
  await page.fill('#modal-body [name="subject"]', 'Prueba');
  await page.click('#save-add-another'); // falta pregunta y respuesta: el navegador no envía
  expect(await count(page)).toBe(n);
  await fill(page, 'P1', 'R1');
  await page.click('#save-card');
  expect(await count(page)).toBe(n + 1);
  await expect(page.locator('#app-modal')).not.toHaveAttribute('open', '');
});

test('tarjeta inversa: crea la pareja con pregunta y respuesta intercambiadas, la inversa llega mañana', async ({ page }) => {
  const n = await count(page);
  await fill(page, 'Capital de Francia', 'París', 'Prueba');
  await page.check('#modal-body [name="reverse"]');
  await page.click('#save-card');
  const r = await page.evaluate(() => state.cards.slice(-2).map((c) => ({ q: c.question, a: c.answer, s: c.subject, due: c.nextReview, today: today(), tomorrow: addDays(today(), 1) })));
  expect(await count(page)).toBe(n + 2);
  expect(r[0]).toMatchObject({ q: 'Capital de Francia', a: 'París', s: 'Prueba' });
  expect(r[0].due).toBe(r[0].today);
  expect(r[1]).toMatchObject({ q: 'París', a: 'Capital de Francia', s: 'Prueba' });
  expect(r[1].due).toBe(r[1].tomorrow);
});

test('la casilla de inversa se conserva al añadir otra', async ({ page }) => {
  await fill(page, 'A', 'B', 'Prueba');
  await page.check('#modal-body [name="reverse"]');
  await page.click('#save-add-another');
  await expect(page.locator('#modal-body [name="reverse"]')).toBeChecked();
});

test('si la respuesta pasa de 500 caracteres, no se crea la inversa (y se guarda la normal)', async ({ page }) => {
  const n = await count(page);
  await fill(page, 'Larga', 'x'.repeat(600), 'Prueba');
  await page.check('#modal-body [name="reverse"]');
  await page.click('#save-card');
  expect(await count(page)).toBe(n + 1);
});

test('al editar no hay inversa ni «añadir otra»', async ({ page }) => {
  await page.evaluate(() => { closeModal(); });
  await page.evaluate(() => cardForm(state.cards[0]));
  await expect(page.locator('#modal-body [name="reverse"]')).toHaveCount(0);
  await expect(page.locator('#save-add-another')).toHaveCount(0);
});

test('«Crear con IA» está a la vista en Practicar y lanza el evento de siempre', async ({ page }) => {
  await page.evaluate(() => closeModal());
  await page.evaluate(() => showPage('practice'));
  await expect(page.locator('#gen-cards-top')).toBeVisible();
  const fired = await page.evaluate(() => new Promise((res) => { document.addEventListener('learny:gen-cards', () => res(true), { once: true }); document.getElementById('gen-cards-top').click(); }));
  expect(fired).toBe(true);
});
