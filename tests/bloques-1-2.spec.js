// Bloques 1 y 2 · C2 (aviso de copia/espacio), C3 (SM-2), C4 (informe semanal) y C5 (Feynman con texto real).
const { test, expect } = require('@playwright/test');
test.use({ bypassCSP: true }); // estas pruebas ejecutan eval/new Function dentro de la página (la CSP de index.html lo bloquea a propósito); el resto de la suite corre con la política activa

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo'); // demo: almacenamiento en memoria, nunca toca datos reales
  await page.waitForFunction(() => typeof snapshotOrWarn === 'function' && typeof weekSlice === 'function' && typeof warnStorage === 'function');
});

// El aviso escribe su texto con un pequeño retraso; para contar cuántas veces se llama a toast() se vigila la función.
const spyToast = () => { window.__toasts = []; const t0 = window.toast; window.toast = (m, ...r) => { window.__toasts.push(String(m)); return t0(m, ...r); }; };

test('C2: si la copia previa a un borrado no cabe, se avisa una sola vez', async ({ page }) => {
  const r = await page.evaluate((spy) => {
    eval(`(${spy})()`);
    const real = store.set; store.set = () => false; // simula «almacenamiento lleno»
    const first = snapshotOrWarn('delete-card'), second = snapshotOrWarn('delete-card');
    store.set = real;
    return { first, second, toasts: window.__toasts };
  }, spyToast.toString());
  expect(r.first).toBe(false);
  expect(r.second).toBe(false);
  expect(r.toasts).toHaveLength(1); // solo una vez por sesión
  expect(r.toasts[0]).toContain('No se pudo guardar la copia automática previa');
});

test('C2: no avisa cuando la copia no se crea por diseño (3 copias importantes ocupan todo)', async ({ page }) => {
  const r = await page.evaluate((spy) => {
    eval(`(${spy})()`);
    ['import', 'reset', 'import-csv'].forEach((why) => pushBackup(why, { x: 1 }));
    const ok = snapshotOrWarn('delete-card');
    return { ok, toasts: window.__toasts };
  }, spyToast.toString());
  expect(r.ok).toBe(false);
  expect(r.toasts).toHaveLength(0);
});

test('C2: aviso temprano cuando los datos pasan de ~2,2 M de caracteres, una vez por sesión', async ({ page }) => {
  const r = await page.evaluate((spy) => {
    eval(`(${spy})()`);
    warnStorage(1000000); const a = window.__toasts.length;
    warnStorage(2300000); const b = window.__toasts.length;
    warnStorage(2900000); const c = window.__toasts.length;
    return { a, b, c, msg: window.__toasts[0] || '' };
  }, spyToast.toString());
  expect(r).toEqual({ a: 0, b: 1, c: 1, msg: r.msg });
  expect(r.msg).toContain('ocupan mucho espacio');
});

test('C3: «Dudé» y «Fácil» dan intervalos distintos en los dos primeros pasos', async ({ page }) => {
  const r = await page.evaluate(() => {
    const c = (o) => ({ interval: 0, repetitions: 0, easeFactor: 2.5, nextReview: '2000-01-01', ...o });
    return {
      h0: nextSchedule(c({}), 'hard').interval, e0: nextSchedule(c({}), 'easy').interval,
      h1: nextSchedule(c({ repetitions: 1, interval: 1 }), 'hard').interval, e1: nextSchedule(c({ repetitions: 1, interval: 1 }), 'easy').interval
    };
  });
  expect(r.h0).toBeLessThan(r.e0);
  expect(r.h1).toBeLessThan(r.e1);
  expect(r).toEqual({ h0: 1, e0: 3, h1: 3, e1: 6 });
});

test('C4: el informe semanal cuenta solo los repasos de la semana', async ({ page }) => {
  const w = await page.evaluate(() => {
    const old = addDays(today(), -30);
    state.reviews = [
      { date: today(), cardId: 'a', subject: 'X', rating: 'easy', quality: 5 },
      { date: today(), cardId: 'b', subject: 'X', rating: 'hard', quality: 3 },
      { date: addDays(today(), -2), cardId: 'c', subject: 'X', rating: 'easy', quality: 5 },
      { date: old, cardId: 'd', subject: 'X', rating: 'easy', quality: 5 },
      { date: old, cardId: 'e', subject: 'X', rating: 'easy', quality: 5 },
      { date: old, cardId: 'f', subject: 'X', rating: 'again', quality: 1 }
    ];
    return weekSlice();
  });
  expect(w.reviews).toHaveLength(3);
  expect(w.recuerdoDeclarado.repasos).toBe(3);
  expect(w.recuerdoDeclarado.facil).toBe(2);
});

test('C5: el Feynman del día solo cuenta con una explicación real', async ({ page }) => {
  const click = (text) => page.evaluate((t) => {
    state.feynman = [];
    document.querySelector('#feynman-topic').value = 'Fotosíntesis';
    document.querySelector('#feynman-text').value = t;
    document.querySelector('#feynman-feedback').click();
    return state.feynman.includes(today());
  }, text);
  expect(await click('asdf')).toBe(false);
  expect(await click('bla bla bla bla bla bla bla bla bla bla')).toBe(false); // larga pero repetida
  expect(await click('   ')).toBe(false);
  expect(await click('Las plantas convierten la luz del sol en azúcar usando agua y dióxido de carbono; por ejemplo, una hoja verde.')).toBe(true);
});

test('C5: una explicación corta muestra por qué no cuenta', async ({ page }) => {
  await page.evaluate(() => { document.querySelector('#feynman-text').value = 'asdf'; document.querySelector('#feynman-feedback').click(); });
  await page.waitForFunction(() => [...document.querySelectorAll('#toast, .modal-alert, .modal-live')].some((e) => /muy corta|too short/.test(e.textContent)), null, { timeout: 3000 });
});
