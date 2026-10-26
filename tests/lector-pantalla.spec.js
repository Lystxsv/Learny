// v82 · correcciones R1–R6 del guion de lector de pantalla (Etapa 3c): foco, avisos y traducciones. No sustituyen la prueba con una persona.
const { test, expect } = require('@playwright/test');

async function openStep2(page) {
  await page.goto('/');
  await page.waitForFunction(() => typeof welcomeFlow === 'function');
  const landing = page.locator('#landing button').first();
  if (await landing.isVisible().catch(() => false)) await landing.click();
  await page.locator('[data-profile="self"]').click();
  await expect(page.locator('[name="fs"]')).toHaveCount(3);
}

test('R1: al revelar la respuesta el foco pasa a la tarjeta y la respuesta está dentro', async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof revealCard === 'function');
  await page.evaluate(() => { showPage('practice'); });
  await page.click('#reveal-card');
  expect(await page.evaluate(() => document.activeElement.id)).toBe('flashcard');
  expect(await page.evaluate(() => document.querySelector('#flashcard').textContent.includes(activeCard.answer))).toBe(true);
  await expect(page.locator('#rating-row')).toBeVisible();
});

test('R1: un redibujado con la respuesta ya revelada no roba el foco a los botones de calificar', async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof revealCard === 'function');
  await page.evaluate(() => showPage('practice'));
  await page.click('#reveal-card');
  await page.locator('#rating-row button').first().focus();
  await page.evaluate(() => renderAll());
  expect(await page.evaluate(() => document.activeElement.closest('#rating-row') !== null)).toBe(true);
});

test('R2: el selector de tiempo conserva el foco en el botón pulsado y anuncia el filtro', async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof renderTodayQueue === 'function');
  await page.evaluate(() => showPage('study'));
  await page.click('[data-action="mode"][data-mode="session"]');
  expect(await page.evaluate(() => document.activeElement.dataset.mode)).toBe('session');
  await expect(page.locator('[data-mode="session"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#sr-live')).toHaveText(/Filter applied|Filtro aplicado/);
});

test('R3: renderAll no reescribe el reloj ni sus notas si no cambiaron, y role=timer sigue en aria-live off', async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof renderAll === 'function');
  const n = await page.evaluate(async () => {
    const el = document.querySelector('.timer'); let c = 0;
    const o = new MutationObserver((r) => { c += r.length; }); o.observe(el, { childList: true, characterData: true, subtree: true, attributes: true });
    renderAll(); renderAll(); await new Promise((r) => setTimeout(r, 100)); o.disconnect(); return c;
  });
  expect(n).toBe(0);
  await expect(page.locator('.timer')).toHaveAttribute('aria-live', 'off');
});

test('R4: el paso «Personalizar» enfoca su título', async ({ page }) => {
  await openStep2(page);
  await expect(page.locator('#modal-title')).toBeFocused();
});

test('R5: Intro sobre un radio o una casilla no cierra la bienvenida', async ({ page }) => {
  await openStep2(page);
  await page.locator('[name="fs"][value="19"]').focus(); await page.keyboard.press('Enter');
  await page.locator('[name="calm"]').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#app-modal')).toHaveAttribute('open', '');
  await expect(page.locator('[name="fs"]')).toHaveCount(3);
});

test('R6: en inglés se traducen Skip, Back, Today\'s time y las duraciones; el botón de idioma lleva lang', async ({ page }) => {
  await openStep2(page);
  await expect(page.locator('[data-w="skip"]')).toHaveText('Skip');
  await expect(page.locator('[data-w="back"]')).toHaveText('Back');
  await expect(page.locator('legend.sr-only', { hasText: "Today's time" })).toHaveCount(1);
  await expect(page.locator('.welcome-time small', { hasText: 'Something short' })).toHaveCount(1);
  await expect(page.locator('.welcome-time small', { hasText: 'One Pomodoro' })).toHaveCount(1);
  await expect(page.locator('.welcome-time small', { hasText: 'Long session' })).toHaveCount(1);
  await expect(page.locator('#lang-toggle')).toHaveAttribute('lang', 'es');
});

// ---- v83 · R7–R12 ----
test('R7: al volver con «Atrás» el perfil elegido queda marcado con aria-pressed', async ({ page }) => {
  await openStep2(page);
  await page.locator('[data-w="back"]').click();
  await expect(page.locator('[data-profile="self"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-profile="exam"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-profile="teach"]')).toHaveAttribute('aria-pressed', 'false');
});

test('R8: cada misión dice si está completada o pendiente en texto oculto', async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof renderAll === 'function');
  await page.evaluate(() => showPage('study'));
  const t = await page.locator('#missions-list .task-row .sr-only').allTextContents();
  expect(t).toHaveLength(3);
  t.forEach((x) => expect(x).toMatch(/Pending|Completed|Pendiente|Completada/));
});

test('R9: «Accesibilidad» es un encabezado y el botón de cierre va después del contenido', async ({ page }) => {
  await openStep2(page);
  await expect(page.getByRole('heading', { name: /Accessibility|Accesibilidad/ })).toHaveCount(1);
  const after = await page.evaluate(() => !!(document.querySelector('#modal-body').compareDocumentPosition(document.querySelector('.modal-close')) & Node.DOCUMENT_POSITION_FOLLOWING));
  expect(after).toBe(true);
});

test('R10: con una ventana abierta, el aviso se anuncia en la región viva del diálogo', async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof cardForm === 'function');
  await page.evaluate(() => cardForm());
  await page.evaluate(() => toast('Campo obligatorio vacío.', 'error'));
  await expect(page.locator('#app-modal .modal-alert')).toHaveText('Campo obligatorio vacío.');
  await expect(page.locator('#toast')).toHaveAttribute('aria-hidden', 'true');
  await page.evaluate(() => toast('Hecho.'));
  await expect(page.locator('#app-modal .modal-live')).toHaveText('Hecho.');
});

test('R10: sin ventana abierta el aviso conserva su rol y no se oculta', async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof toast === 'function');
  await page.evaluate(() => toast('Hola.', 'error'));
  await expect(page.locator('#toast')).toHaveAttribute('role', 'alert');
  await expect(page.locator('#toast')).not.toHaveAttribute('aria-hidden', 'true');
});

test('R11: al llegar la respuesta de la IA el foco pasa al título del resultado', async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('learny.v3')) localStorage.setItem('learny.v3', JSON.stringify({ version: 4, apiKey: 'AIzaTEST', settings: { welcomed: true, profile: 'exam' }, notes: [{ text: 'x' }] })); });
  await page.route('https://generativelanguage.googleapis.com/**', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text: '**Explicación**\nHola' }] } }] }) }));
  await page.goto('/');
  await page.waitForFunction(() => typeof gemini === 'function');
  await page.evaluate(() => { gemini('p', 'Mi título'); });
  await expect(page.locator('#modal-title')).toHaveText('Mi título');
  await expect(page.locator('#modal-title')).toBeFocused();
  await expect(page.locator('#modal-body')).not.toHaveAttribute('aria-live', /./);
});

test('R12: cambiar el tamaño de texto o una casilla se anuncia dentro de la ventana', async ({ page }) => {
  await openStep2(page);
  await page.locator('[name="fs"][value="19"]').check({ force: true });
  await expect(page.locator('#app-modal .modal-live')).toHaveText(/Text size: Large|Tamaño de texto: Grande/);
  await page.locator('[name="easy"]').check({ force: true });
  await expect(page.locator('#app-modal .modal-live')).toHaveText(/Easy reading turned on|Lectura fácil activada/);
  await page.locator('[name="calm"]').check({ force: true });
  await expect(page.locator('#app-modal .modal-live')).toHaveText(/Animations reduced|Animaciones reducidas/);
});
