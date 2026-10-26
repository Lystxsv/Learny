// Perfiles · Etapa 4: modo autodidacta (ritmo en lugar de fecha). Usa ?demo.
const { test, expect } = require('@playwright/test');
const boot = async (page, profile) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof actionCandidates === 'function' && typeof rhythmInfo === 'function');
  await page.evaluate((p) => { state.settings.profile = p; state.settings.welcomed = true; save(); renderAll(); }, profile);
};
const ids = (page) => page.evaluate(() => actionCandidates().map((c) => c.id));

test('con exam, teach o sin perfil actionCandidates() devuelve exactamente lo de siempre', async ({ page }) => {
  for (const p of ['exam', 'teach', '']) {
    await boot(page, p);
    const same = await page.evaluate(() => JSON.stringify(actionCandidates()) === JSON.stringify(actionCandidatesBase()));
    expect(same, `perfil «${p}»`).toBe(true);
  }
});

test('con self no se ofrece «añade la fecha de un examen» y el motivo habla del ritmo', async ({ page }) => {
  await boot(page, 'self');
  await page.evaluate(() => { state.deadlines = []; state.sessions = state.sessions.filter((s) => s.abandon); save(); renderAll(); });
  const list = await page.evaluate(() => actionCandidates());
  expect(list.map((c) => c.id)).not.toContain('deadline');
  const focus = list.find((c) => c.id === 'focus');
  expect(focus.why).toMatch(/llevas 0 de 3 sesiones/);
  // y en exam, sin fecha, sí aparece
  await boot(page, 'exam');
  await page.evaluate(() => { state.deadlines = []; save(); renderAll(); });
  expect(await ids(page)).toContain('deadline');
});

test('el ritmo cuenta solo bloques completados de los últimos 7 días y pasa la sesión al final al cumplirlo', async ({ page }) => {
  await boot(page, 'self');
  const r = await page.evaluate(() => {
    const mk = (date, abandon) => ({ id: `t${Math.random()}`, date, minutes: 25, label: '', abandon: !!abandon });
    state.sessions = [mk(today()), mk(addDays(today(), -2)), mk(addDays(today(), -3), true), mk(addDays(today(), -9))];
    save(); renderAll();
    const a = rhythmInfo(); const before = actionCandidates().map((c) => c.id);
    state.sessions.push(mk(addDays(today(), -1))); save(); renderAll();
    const b = rhythmInfo(); const after = actionCandidates().map((c) => c.id);
    return { a: [a.done, a.left, a.met], b: [b.done, b.met], before, after };
  });
  expect(r.a).toEqual([2, 1, false]); // la abandonada y la de hace 9 días no cuentan
  expect(r.b).toEqual([3, true]);
  if (r.before.includes('feynman')) { expect(r.before.indexOf('focus')).toBeLessThan(r.before.indexOf('feynman')); expect(r.after.indexOf('focus')).toBeGreaterThan(r.after.indexOf('feynman')); }
});

test('weeklyGoal se acota a 1–14 al leerlo', async ({ page }) => {
  await boot(page, 'self');
  const r = await page.evaluate(() => [0, 99, 'x', undefined, 5].map((v) => { state.settings.weeklyGoal = v; return weeklyGoal(); }));
  expect(r).toEqual([1, 14, 3, 3, 5]);
});

test('un tema sin tocar ≥ 4 días aparece como «Retomar» en Hoy y en Reforzar', async ({ page }) => {
  await boot(page, 'self');
  const name = await page.evaluate(() => {
    const c = state.cards.find((x) => !x.archived && !x.corrupt), s = c.subject;
    state.reviews = state.reviews.filter((r) => norm(r.subject) !== norm(s));
    state.sessions = state.sessions.filter((x) => norm(x.label) !== norm(s));
    state.cards.filter((x) => norm(x.subject) === norm(s)).forEach((x) => { x.lastReviewed = addDays(today(), -6); });
    // el resto de temas se tocan hoy para que este sea el único por retomar
    state.cards.filter((x) => norm(x.subject) !== norm(s)).forEach((x) => { x.lastReviewed = today(); });
    save(); renderAll(); return s;
  });
  expect(await page.evaluate(() => staleSubject()?.name)).toBe(name);
  await page.evaluate(() => showPage('analysis'));
  await expect(page.locator('#topic-progress-card')).toBeVisible();
  await expect(page.locator('#topic-progress-card [data-topic-quiz]')).toHaveCount(1);
  await expect(page.locator('#topic-progress-card .tag.urgent')).toHaveText('Retomar');
});

test('las tarjetas de ritmo y de progreso solo se ven con self; «Cambiar ritmo» guarda la meta', async ({ page }) => {
  await boot(page, 'exam');
  await page.evaluate(() => showPage('planner'));
  await expect(page.locator('#rhythm-card')).toBeHidden();
  await boot(page, 'self');
  await page.evaluate(() => showPage('planner'));
  await expect(page.locator('#rhythm-card')).toBeVisible();
  await expect(page.locator('#rhythm-card .week-cal .day')).toHaveCount(7);
  await page.locator('[data-rhythm="edit"]').click();
  await page.locator('#app-modal input[name="goal"]').fill('5');
  await page.locator('#app-modal button.primary-button').click();
  expect(await page.evaluate(() => state.settings.weeklyGoal)).toBe(5);
  await expect(page.locator('#rhythm-card .tag')).toContainText('de 5 sesiones');
});

test('en inglés los textos nuevos se traducen', async ({ page }) => {
  await boot(page, 'self');
  const t = await page.evaluate(() => { state.settings.lang = 'en'; LearnyI18n.sync(state.settings); return [
    LearnyI18n.t('Esta semana (últimos 7 días) llevas 1 de 3 sesiones. Una sesión de hoy te acerca a tu ritmo.'),
    LearnyI18n.t('Hace 5 días que no tocas «Química». Un mini quiz de 8 tarjetas te ayuda a retomarlo.'),
    LearnyI18n.t('2 de 3 sesiones'), LearnyI18n.t('Esta semana: 3 repasos, 20 min · último contacto hace 4 días')]; });
  expect(t[0]).toContain('you have done 1 of 3 sessions');
  expect(t[1]).toContain('haven\'t touched “Química” in 5 days');
  expect(t[2]).toBe('2 of 3 sessions');
  expect(t[3]).toBe('This week: 3 reviews, 20 min · last contact 4 days ago');
});
