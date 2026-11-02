// Fase 6 · copia automática a archivo (File System Access API simulada) y degradación sin la API.
const { test, expect } = require('@playwright/test');

// Simula showSaveFilePicker: el «archivo» vive en window.__file
const FAKE_API = () => {
  window.__file = { text: null, writes: 0, perm: 'granted' };
  window.showSaveFilePicker = async () => ({
    kind: 'file', name: 'x.json',
    queryPermission: async () => window.__file.perm,
    requestPermission: async () => { window.__file.perm = 'granted'; return 'granted'; },
    createWritable: async () => { let buf = ''; return { write: async (t) => { buf += t; }, close: async () => { window.__file.text = buf; window.__file.writes++; }, abort: async () => {} }; }
  });
};

test('sin la API: no aparece el botón y «Descargar copia» sigue ahí', async ({ page }) => {
  await page.addInitScript(() => { delete window.showSaveFilePicker; });
  await page.goto('/');
  await page.waitForFunction(() => typeof LearnyFileBackup !== 'undefined');
  expect(await page.evaluate(() => LearnyFileBackup.supported)).toBe(false);
  await page.evaluate(() => openSettings());
  await expect(page.locator('#export-data')).toHaveCount(1); // «Descargar copia» sigue en Ajustes
  await expect(page.locator('#file-backup-box, #fb-choose')).toHaveCount(0);
});

test('en la demo nunca se activa, aunque exista la API', async ({ page }) => {
  await page.addInitScript(FAKE_API);
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof LearnyFileBackup !== 'undefined');
  expect(await page.evaluate(() => LearnyFileBackup.supported)).toBe(false);
});

test('con la API: Ajustes ofrece el botón para elegir archivo', async ({ page }) => {
  await page.addInitScript(FAKE_API);
  await page.goto('/');
  await page.waitForFunction(() => typeof LearnyFileBackup !== 'undefined' && LearnyFileBackup.supported);
  await page.evaluate(() => openSettings());
  await expect(page.locator('#fb-choose')).toHaveCount(1);
});

test('con la API: elegir archivo escribe una copia sin clave API y solo reescribe si hay cambios', async ({ page }) => {
  await page.addInitScript(FAKE_API);
  await page.goto('/');
  await page.waitForFunction(() => typeof LearnyFileBackup !== 'undefined' && LearnyFileBackup.supported);
  const r = await page.evaluate(async () => {
    state.apiKey = 'AIza-SECRETA-123'; save();
    const box = document.createElement('div'); document.body.appendChild(box); LearnyFileBackup.mount(box);
    box.querySelector('#fb-choose').click();
    await new Promise((res) => setTimeout(res, 300));
    const first = { writes: window.__file.writes, text: window.__file.text, status: LearnyFileBackup.status };
    const again = await LearnyFileBackup.write(false); // sin cambios
    state.settings.name = 'Cambiada'; save();
    const changed = await LearnyFileBackup.write(false);
    return { first, again, changed, writes: window.__file.writes, hasName: window.__file.text.includes('Cambiada') };
  });
  expect(r.first.writes).toBe(1);
  expect(r.first.status).toBe('ok');
  expect(r.first.text).not.toContain('SECRETA');
  expect(JSON.parse(r.first.text).cards).toBeDefined();
  expect(r.again).toBe(false);
  expect(r.changed).toBe(true);
  expect(r.writes).toBe(2);
  expect(r.hasName).toBe(true);
});

test('sin permiso: no escribe, queda «en pausa»; al reactivar vuelve a escribir', async ({ page }) => {
  await page.addInitScript(FAKE_API);
  await page.goto('/');
  await page.waitForFunction(() => typeof LearnyFileBackup !== 'undefined' && LearnyFileBackup.supported);
  const r = await page.evaluate(async () => {
    const box = document.createElement('div'); document.body.appendChild(box); LearnyFileBackup.mount(box);
    box.querySelector('#fb-choose').click(); await new Promise((res) => setTimeout(res, 300));
    window.__file.perm = 'prompt'; state.settings.name = 'Otra'; save();
    const w = await LearnyFileBackup.write(false); const paused = LearnyFileBackup.status; const before = window.__file.writes;
    box.querySelector('#fb-reactivate').click(); await new Promise((res) => setTimeout(res, 300));
    return { w, paused, before, after: window.__file.writes, status: LearnyFileBackup.status };
  });
  expect(r.w).toBe(false);
  expect(r.paused).toBe('permission');
  expect(r.after).toBe(r.before + 1);
  expect(r.status).toBe('ok');
});

test('con datos protegidos (bootHold) no escribe nada', async ({ page }) => {
  await page.addInitScript(FAKE_API);
  await page.goto('/');
  await page.waitForFunction(() => typeof LearnyFileBackup !== 'undefined' && LearnyFileBackup.supported);
  const r = await page.evaluate(async () => {
    const box = document.createElement('div'); document.body.appendChild(box); LearnyFileBackup.mount(box);
    box.querySelector('#fb-choose').click(); await new Promise((res) => setTimeout(res, 300));
    const before = window.__file.writes; bootHold = true; state.settings.name = 'Z'; save();
    const w = await LearnyFileBackup.write(false); bootHold = false;
    return { w, same: window.__file.writes === before };
  });
  expect(r).toEqual({ w: false, same: true });
});
