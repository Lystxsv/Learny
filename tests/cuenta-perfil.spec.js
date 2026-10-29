// Cuenta · Bloques 3 y 4 (plan y nombre): la ventana «Tu cuenta» muestra el plan leído de Firestore. Usa ?demo y simula LearnyCloud (no toca la nube).
const { test, expect } = require('@playwright/test');

const boot = async (page, lang = 'es') => {
  await page.goto('/?demo');
  await page.waitForFunction(() => window.LearnyAccount && typeof state !== 'undefined');
  await page.evaluate((l) => { state.settings.lang = l; state.settings.welcomed = true; save(); LearnyI18n.sync(state.settings); renderAll(); }, lang);
};
/* Simula sesión + perfil. profile: {status, current, error, pro}. Devuelve control para cambiarlo después. */
const fake = (page, cfg) => page.evaluate((c) => {
  const P = { status: c.status, current: c.current || null, error: c.error || '', refreshed: 0, saved: [], failSave: !!c.failSave };
  window.__P = P;
  window.LearnyCloud = Object.freeze({
    ready: true,
    account: { available: true, user: () => ({ uid: 'u1', email: 'a@b.co', emailVerified: false }), whenReady: Promise.resolve(null), onChange: () => () => {}, signOut: async () => {} },
    profile: {
      available: true, status: () => P.status, current: () => P.current, error: () => P.error,
      isProSync: () => !!P.current && P.current.plan === 'pro' && P.current.proStatus === 'active' && (P.current.proExpiresAt == null || P.current.proExpiresAt > Date.now()),
      refresh: async () => { P.refreshed++; },
      update: async (f) => { if (P.failSave) throw new Error('No hay permiso para guardar el nombre. Revisa que las reglas de Firestore estén publicadas.'); P.saved.push(f); P.current = { ...P.current, displayName: String(f.displayName).trim() }; document.dispatchEvent(new CustomEvent('learny:profile')); return P.current; }
    }
  });
  document.dispatchEvent(new Event('learny:account-ready'));
}, cfg);
const open = async (page) => { await page.click('#account-button'); await expect(page.locator('#modal-body h2')).toHaveText(/Tu cuenta|Your account/); };

test('plan gratis: muestra «Plan: Gratis» y nunca Pro', async ({ page }) => {
  await boot(page);
  await fake(page, { status: 'ready', current: { plan: 'free', proStatus: 'inactive', proExpiresAt: null } });
  await open(page);
  await expect(page.locator('#acc-plan')).toContainText('Plan: Gratis');
  await expect(page.locator('#acc-plan')).not.toContainText('Pro');
});

test('plan Pro activo con vencimiento', async ({ page }) => {
  await boot(page);
  await fake(page, { status: 'ready', current: { plan: 'pro', proStatus: 'active', proExpiresAt: Date.now() + 864e5 * 30 } });
  await open(page);
  await expect(page.locator('#acc-plan')).toContainText('Learny Pro');
  await expect(page.locator('#acc-plan')).toContainText('vence el');
});

test('Pro vencido se muestra como Gratis', async ({ page }) => {
  await boot(page);
  await fake(page, { status: 'ready', current: { plan: 'pro', proStatus: 'active', proExpiresAt: Date.now() - 1000 } });
  await open(page);
  await expect(page.locator('#acc-plan')).toContainText('Plan: Gratis');
});

test('cargando → listo: la ventana se actualiza sola con learny:profile', async ({ page }) => {
  await boot(page);
  await fake(page, { status: 'loading' });
  await open(page);
  await expect(page.locator('#acc-plan')).toContainText('Cargando tu plan');
  await page.evaluate(() => { __P.status = 'ready'; __P.current = { plan: 'free', proStatus: 'inactive', proExpiresAt: null }; document.dispatchEvent(new CustomEvent('learny:profile')); });
  await expect(page.locator('#acc-plan')).toContainText('Plan: Gratis');
});

test('error: muestra el mensaje, nunca asume Pro, y «Reintentar» recarga', async ({ page }) => {
  await boot(page);
  await fake(page, { status: 'error', error: 'No hay permiso para leer o crear tu perfil. Revisa que las reglas de Firestore estén publicadas.' });
  await open(page);
  await expect(page.locator('#acc-plan')).toContainText('No hay permiso');
  await expect(page.locator('#acc-plan')).not.toContainText('Pro');
  await page.click('#acc-plan [data-acc="retry"]');
  expect(await page.evaluate(() => __P.refreshed)).toBe(1);
});

test('en inglés: «Plan: Free»', async ({ page }) => {
  await boot(page, 'en');
  await fake(page, { status: 'ready', current: { plan: 'free', proStatus: 'inactive', proExpiresAt: null } });
  await open(page);
  await expect(page.locator('#acc-plan')).toContainText('Free');
  await expect(page.locator('#acc-plan')).not.toContainText('Gratis');
});

const FREE = { plan: 'free', proStatus: 'inactive', proExpiresAt: null, displayName: '' };

test('Bloque 4: guardar el nombre llama a profile.update solo con displayName y avisa', async ({ page }) => {
  await boot(page);
  await fake(page, { status: 'ready', current: { ...FREE } });
  await open(page);
  await page.fill('#acc-name [name="displayName"]', '  Ana  ');
  await page.click('#acc-name .primary-button');
  await expect(page.locator('#toast-stack, .toast').first()).toContainText('Nombre guardado');
  expect(await page.evaluate(() => __P.saved)).toEqual([{ displayName: '  Ana  ' }]); // la limpieza final la hace profile.update, nunca se mandan otros campos
  await expect(page.locator('#acc-name [name="displayName"]')).toHaveValue('Ana');
});

test('Bloque 4: el campo limita a 40 caracteres y muestra el nombre guardado', async ({ page }) => {
  await boot(page);
  await fake(page, { status: 'ready', current: { ...FREE, displayName: 'Marta' } });
  await open(page);
  await expect(page.locator('#modal-body')).toContainText('Marta');
  await expect(page.locator('#acc-name [name="displayName"]')).toHaveAttribute('maxlength', '40');
});

test('Bloque 4: si guardar falla se muestra el error y el botón se reactiva', async ({ page }) => {
  await boot(page);
  await fake(page, { status: 'ready', current: { ...FREE }, failSave: true });
  await open(page);
  await page.fill('#acc-name [name="displayName"]', 'Ana');
  await page.click('#acc-name .primary-button');
  await expect(page.locator('.toast').first()).toContainText('No hay permiso para guardar el nombre');
  await expect(page.locator('#acc-name .primary-button')).toBeEnabled();
});

test('Bloque 4: sin perfil cargado (cargando o error) no hay formulario de nombre', async ({ page }) => {
  await boot(page);
  await fake(page, { status: 'loading' });
  await open(page);
  await expect(page.locator('#acc-name [name="displayName"]')).toHaveCount(0);
});

test('Bloque 4: en inglés el formulario se traduce', async ({ page }) => {
  await boot(page, 'en');
  await fake(page, { status: 'ready', current: { ...FREE } });
  await open(page);
  await expect(page.locator('#acc-name')).toContainText('Name (optional)');
  await expect(page.locator('#acc-name .primary-button')).toHaveText('Save name');
});

/* ---------- Bloque 5: sección Learny Pro protegida ---------- */
const signedOut = (page) => page.evaluate(() => {
  window.LearnyCloud = Object.freeze({ ready: true, account: { available: true, user: () => null, whenReady: Promise.resolve(null), onChange: () => () => {}, signOut: async () => {} } });
  document.dispatchEvent(new Event('learny:account-ready'));
});

test('Bloque 5: sin cuentas disponibles (demo) la sección Pro no se ofrece', async ({ page }) => {
  await boot(page);
  await expect(page.locator('.nav-button[data-page="pro"]')).toBeHidden();
});

test('Bloque 5: con cuentas y sin sesión, abrir Pro redirige a Hoy y pide iniciar sesión', async ({ page }) => {
  await boot(page);
  await signedOut(page);
  await expect(page.locator('.nav-button[data-page="pro"]')).toBeVisible();
  await page.click('.nav-button[data-page="pro"]');
  await expect(page.locator('#modal-body h2')).toHaveText('Iniciar sesión');
  await expect(page.locator('#modal-body')).toContainText('Inicia sesión para entrar en esta sección.');
  expect(await page.evaluate(() => currentPage)).toBe('study');
  await expect(page.locator('#pro-features-card')).toBeEmpty();
});

test('Bloque 5: con sesión, la página Pro muestra el plan de la cuenta y el catálogo', async ({ page }) => {
  await boot(page);
  await fake(page, { status: 'ready', current: { ...FREE } });
  await page.click('.nav-button[data-page="pro"]');
  await expect(page.locator('#pro.page.active')).toBeVisible();
  expect(await page.evaluate(() => currentPage)).toBe('pro');
  await expect(page.locator('#pro-plan')).toContainText('Plan: Gratis');
  await expect(page.locator('#pro-account-card')).toContainText('a@b.co');
  await expect(page.locator('#pro-features-card')).toContainText('Quizzes y exámenes simulados');
});

test('Bloque 5: si el plan cambia mientras está abierta, la página se actualiza; un error nunca muestra Pro', async ({ page }) => {
  await boot(page);
  await fake(page, { status: 'loading' });
  await page.click('.nav-button[data-page="pro"]');
  await expect(page.locator('#pro-plan')).toContainText('Cargando tu plan');
  await page.evaluate(() => { __P.status = 'error'; __P.error = 'No hay conexión con el servicio. Revisa tu internet e inténtalo de nuevo.'; document.dispatchEvent(new CustomEvent('learny:profile')); });
  await expect(page.locator('#pro-plan')).toContainText('No hay conexión');
  await expect(page.locator('#pro-plan')).not.toContainText('Learny Pro');
  await page.click('#pro-plan [data-acc="retry"]');
  expect(await page.evaluate(() => __P.refreshed)).toBe(1);
  await page.evaluate(() => { __P.status = 'ready'; __P.current = { plan: 'pro', proStatus: 'active', proExpiresAt: null, displayName: '' }; document.dispatchEvent(new CustomEvent('learny:profile')); });
  await expect(page.locator('#pro-plan')).toContainText('Learny Pro');
});

test('Bloque 5: en inglés la sección se traduce', async ({ page }) => {
  await boot(page, 'en');
  await fake(page, { status: 'ready', current: { ...FREE } });
  await page.click('.nav-button[data-page="pro"]');
  await expect(page.locator('#pro h1')).toHaveText('Your plan and what Pro includes.');
  await expect(page.locator('#pro-features-card h2')).toHaveText('What Learny Pro includes');
});

/* ---------- Bloque 6: isPro() sale del plan de la cuenta (fuera de la demo) ---------- */
const bootReal = async (page, legacyPro = false) => {
  if (legacyPro) await page.addInitScript(() => { try { localStorage.setItem('learny.pro', '1'); } catch { /* sin almacenamiento */ } });
  await page.goto('/'); // sin ?demo; Firebase no carga en las pruebas (sin red a gstatic) y se simula la cuenta
  await page.waitForFunction(() => window.LearnyAccount && typeof state !== 'undefined' && typeof isPro === 'function' && window.LearnyCloud && window.LearnyCloud.profile); // espera a que los módulos de Firebase terminen (fallan sin red): si no, sobrescribirían la cuenta simulada
  await page.evaluate(() => { state.settings.lang = 'es'; state.settings.welcomed = true; LearnyI18n.sync(state.settings); renderAll(); });
};
const fakeReal = (page, { user = true, plan = null, status = 'ready' } = {}) => page.evaluate(([u, pl, st]) => {
  const P = { current: pl, status: st };
  window.__P = P;
  window.LearnyCloud = Object.freeze({
    ready: true,
    account: { available: true, user: () => (u ? { uid: 'u1', email: 'a@b.co', emailVerified: false } : null), whenReady: Promise.resolve(null), onChange: () => () => {}, signOut: async () => {} },
    profile: {
      available: true, status: () => P.status, current: () => P.current, error: () => '',
      isProSync: () => !!P.current && P.current.plan === 'pro' && P.current.proStatus === 'active' && (P.current.proExpiresAt == null || P.current.proExpiresAt > Date.now()),
      isPro: async () => !!P.current && P.current.plan === 'pro' && P.current.proStatus === 'active', refresh: async () => P.current
    }
  });
  document.dispatchEvent(new Event('learny:account-ready'));
}, [user, plan, status]);

test('Bloque 6: plan Pro de la cuenta → isPro() verdadero y requirePro ejecuta al instante', async ({ page }) => {
  await bootReal(page);
  await fakeReal(page, { plan: { plan: 'pro', proStatus: 'active', proExpiresAt: null } });
  expect(await page.evaluate(() => [isPro(), isUserPro()])).toEqual([true, true]);
  expect(await page.evaluate(() => { let ran = 0; requirePro('quiz', () => { ran++; }); return ran; })).toBe(1);
});

test('Bloque 6: plan gratis → no ejecuta y explica que el plan es Gratis (sin botón para activar Pro)', async ({ page }) => {
  await bootReal(page);
  await fakeReal(page, { plan: { plan: 'free', proStatus: 'inactive', proExpiresAt: null } });
  expect(await page.evaluate(() => { let ran = 0; requirePro('quiz', () => { ran++; }); return ran; })).toBe(0);
  await expect(page.locator('#modal-body')).toContainText('Tu plan es Gratis y el cobro todavía no está disponible.');
  await expect(page.locator('#modal-body [data-pro-on]')).toHaveCount(0);
  await page.click('#modal-body [data-pro-plan]');
  expect(await page.evaluate(() => currentPage)).toBe('pro');
});

test('Bloque 6: sin sesión ofrece iniciar sesión; con error de perfil nunca es Pro', async ({ page }) => {
  await bootReal(page);
  await fakeReal(page, { user: false });
  expect(await page.evaluate(() => isPro())).toBe(false);
  await page.evaluate(() => requirePro('export', () => {}));
  await expect(page.locator('#modal-body [data-pro-login]')).toBeVisible();
  await fakeReal(page, { plan: null, status: 'error' });
  expect(await page.evaluate(() => isPro())).toBe(false);
});

test('Bloque 6: Pro vencido no cuenta, y la marca local antigua «learny.pro» ya no activa Pro', async ({ page }) => {
  await bootReal(page, true);
  expect(await page.evaluate(() => isPro())).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem('learny.pro'))).toBeNull();
  await fakeReal(page, { plan: { plan: 'pro', proStatus: 'active', proExpiresAt: Date.now() - 1000 } });
  expect(await page.evaluate(() => isPro())).toBe(false);
  expect(await page.evaluate(() => { setPro(true); return isPro(); })).toBe(false); // fuera de la demo setPro no hace nada
});

test('Bloque 6: la tarjeta Pro se repinta cuando llega el plan', async ({ page }) => {
  await bootReal(page);
  await fakeReal(page, { plan: { plan: 'free', proStatus: 'inactive', proExpiresAt: null } });
  await page.evaluate(() => showPage('library'));
  await expect(page.locator('#pro-export-card .hint')).toContainText('Función Pro');
  await page.evaluate(() => { __P.current = { plan: 'pro', proStatus: 'active', proExpiresAt: null }; document.dispatchEvent(new CustomEvent('learny:profile')); });
  await expect(page.locator('#pro-export-card .hint')).toContainText('Plan Pro activo en tu cuenta.');
});

test('Bloque 6: en la demostración se conserva el interruptor local', async ({ page }) => {
  await boot(page);
  expect(await page.evaluate(() => { setPro(true); return isPro(); })).toBe(true);
  expect(await page.evaluate(() => { setPro(false); return isPro(); })).toBe(false);
});
