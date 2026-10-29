// Metas · interfaz (Fase 2): recorrido de la feria (crear meta, añadir etapa, practicar y guardar evidencia). Usa ?demo.
const { test, expect } = require('@playwright/test');

const boot = async (page, profile = 'self') => {
  await page.goto('/?demo');
  await page.waitForFunction(() => window.LearnyGoals && typeof state !== 'undefined');
  await page.evaluate((p) => { state.settings.profile = p; state.settings.lang = 'es'; state.settings.welcomed = true; save(); renderAll(); showPage('planner'); }, profile);
};
const modalBtn = (page, g) => page.locator(`#modal-body [data-g="${g}"]`);

test('la tarjeta «Mis metas» solo existe con el perfil «por mi cuenta»', async ({ page }) => {
  await boot(page, 'exam');
  await expect(page.locator('#goals-card')).toBeHidden();
  await boot(page, 'self');
  await expect(page.locator('#goals-card')).toBeVisible();
});

test('recorrido: crear meta con plantilla, añadir etapa, evidencia y comprobar', async ({ page }) => {
  await boot(page);
  await page.click('#goals-card [data-g="new"]');
  await page.fill('#modal-body [name="title"]', 'Aprender guitarra');
  await page.selectOption('#modal-body [name="tpl"]', 'basic');
  await page.click('#modal-body button.primary-button');
  await expect(page.locator('#modal-body h2')).toHaveText('Aprender guitarra');
  expect(await page.evaluate(() => state.learning.goals[0].stages.length)).toBe(4);
  // añadir una etapa propia
  await modalBtn(page, 'addstage').click();
  await page.fill('#modal-body [name="title"]', 'Tocar una canción completa');
  await page.click('#modal-body button.primary-button');
  expect(await page.evaluate(() => state.learning.goals[0].stages.length)).toBe(5);
  // abrir la primera etapa: no se puede comprobar sin evidencia
  await page.locator('#modal-body [data-g="stage"]').first().click();
  await expect(modalBtn(page, 'check')).toBeDisabled();
  // autoevaluación ≠ comprobación
  await modalBtn(page, 'level').click();
  await page.check('#modal-body input[value="alone"]');
  await page.click('#modal-body button.primary-button');
  expect(await page.evaluate(() => { const s = state.learning.goals[0].stages[0]; return [s.level, s.status, s.checked]; })).toEqual(['alone', 'doing', false]);
  // evidencia en texto y comprobación
  await modalBtn(page, 'evi').click();
  await page.fill('#modal-body [name="text"]', 'Grabé un video tocando los acordes');
  await page.click('#modal-body button.primary-button');
  await modalBtn(page, 'check').click();
  const s = await page.evaluate(() => state.learning.goals[0].stages[0]);
  expect(s).toMatchObject({ checked: true, checkedHow: 'practice', status: 'done' });
  expect(s.evidence).toHaveLength(1);
  // quitar la única evidencia quita la comprobación
  await page.locator('#modal-body [data-g="evdel"]').click();
  expect(await page.evaluate(() => state.learning.goals[0].stages[0].checked)).toBe(false);
});

test('la meta se guarda en state.learning y pasa por sanitizeLearning sin cambios', async ({ page }) => {
  await boot(page);
  const same = await page.evaluate(() => {
    window.LearnyGoals.form(); document.querySelector('#modal-body [name="title"]').value = 'Meta A'; document.querySelector('#modal-form').requestSubmit();
    const a = JSON.stringify(state.learning), b = JSON.stringify(sanitizeLearning(JSON.parse(a)));
    return [state.learning.goals.length, a === b];
  });
  expect(same).toEqual([1, true]);
});

test('mover, dividir y saltar etapas', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { state.learning.goals.push({ id: 'g1', parentId: '', title: 'M', why: '', current: '', outcome: '', weeklyMin: 0, targetDate: '', subjects: [], status: 'active', created: '', stages: ['A', 'B'].map((t, i) => ({ id: 's' + i, title: t, learn: '', practice: '', check: '', status: 'todo', level: '', subject: '', checked: false, checkedHow: '', checkedAt: '', evidence: [], origin: '' })) }); renderAll(); window.LearnyGoals.open('g1'); });
  await page.locator('#modal-body [data-g="down"]').first().click();
  expect(await page.evaluate(() => state.learning.goals[0].stages.map((s) => s.title))).toEqual(['B', 'A']);
  await page.locator('#modal-body [data-g="split"]').first().click();
  expect(await page.evaluate(() => state.learning.goals[0].stages.map((s) => s.title))).toEqual(['B', 'B (2)', 'A']);
  await page.locator('#modal-body [data-g="skip"]').first().click();
  expect(await page.evaluate(() => state.learning.goals[0].stages[0].status)).toBe('skipped');
});

test('«Esto ya lo sé» sin comprobar deja la etapa como sabida y no comprobada', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { state.learning.goals.push({ id: 'g1', parentId: '', title: 'M', why: '', current: '', outcome: '', weeklyMin: 0, targetDate: '', subjects: [], status: 'active', created: '', stages: [{ id: 's0', title: 'A', learn: '', practice: '', check: '', status: 'todo', level: '', subject: '', checked: false, checkedHow: '', checkedAt: '', evidence: [], origin: '' }] }); renderAll(); window.LearnyGoals.open('g1'); });
  await modalBtn(page, 'stage').click();
  await modalBtn(page, 'known').click();
  await page.click('[data-g="known-skip"]');
  expect(await page.evaluate(() => { const s = state.learning.goals[0].stages[0]; return [s.status, s.checked]; })).toEqual(['known', false]);
});

test('un enlace no http(s) se rechaza', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { state.learning.goals.push({ id: 'g1', parentId: '', title: 'M', why: '', current: '', outcome: '', weeklyMin: 0, targetDate: '', subjects: [], status: 'active', created: '', stages: [{ id: 's0', title: 'A', learn: '', practice: '', check: '', status: 'todo', level: '', subject: '', checked: false, checkedHow: '', checkedAt: '', evidence: [], origin: '' }] }); renderAll(); window.LearnyGoals.open('g1'); });
  await modalBtn(page, 'stage').click(); await modalBtn(page, 'evi').click();
  await page.fill('#modal-body [name="url"]', 'ftp://x.org/a'); await page.click('#modal-body button.primary-button');
  expect(await page.evaluate(() => state.learning.goals[0].stages[0].evidence.length)).toBe(0);
});

test('con contenedor de versión más nueva no se puede crear nada', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { learningStatus.newer = true; window.LearnyGoals.form(); });
  expect(await page.evaluate(() => state.learning.goals.length)).toBe(0);
  await expect(page.locator('#app-modal')).not.toHaveAttribute('open', '');
});

test('eliminar una meta se puede deshacer', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => { state.learning.goals.push({ id: 'g1', parentId: '', title: 'M', why: '', current: '', outcome: '', weeklyMin: 0, targetDate: '', subjects: [], status: 'active', created: '', stages: [] }); renderAll(); window.LearnyGoals.open('g1'); });
  await modalBtn(page, 'delgoal').click();
  await page.click('#confirm-ok');
  await expect.poll(() => page.evaluate(() => state.learning.goals.length)).toBe(0); // la confirmación se resuelve con el evento «close», asíncrono
  await page.click('.toast-action');
  expect(await page.evaluate(() => state.learning.goals.length)).toBe(1);
});

// ---- Fase 3a · tarjetas ligadas a una etapa ----
const seedGoal = (page, subj = '') => page.evaluate((sub) => {
  state.learning.goals.push({ id: 'g1', parentId: '', title: 'M', why: '', current: '', outcome: '', weeklyMin: 0, targetDate: '', subjects: sub ? [sub] : [], status: 'active', created: '', stages: [{ id: 's0', title: 'A', learn: '', practice: '', check: '', status: 'todo', level: '', subject: sub, checked: false, checkedHow: '', checkedAt: '', evidence: [], origin: '' }] });
  renderAll(); window.LearnyGoals.open('g1');
}, subj);
const mkCards = (page, subject, n, history = []) => page.evaluate(([s, k, h]) => { state.cards = []; for (let i = 0; i < k; i++) state.cards.push(normalizeCard({ subject: s, question: 'Q' + i, answer: 'A', nextReview: today(), history: h })); rev++; }, [subject, n, history]);

test('vincular una materia guarda stage.subject y la añade a goal.subjects (sanea sin cambios)', async ({ page }) => {
  await boot(page); await seedGoal(page);
  await modalBtn(page, 'stage').click();
  await modalBtn(page, 'cardlink').click();
  await page.fill('#modal-body [name="subject"]', 'Guitarra');
  await page.click('#modal-body button.primary-button');
  const r = await page.evaluate(() => { const g = state.learning.goals[0]; return [g.stages[0].subject, g.subjects, JSON.stringify(sanitizeLearning(JSON.parse(JSON.stringify(state.learning)))) === JSON.stringify(state.learning)]; });
  expect(r).toEqual(['Guitarra', ['Guitarra'], true]);
  await modalBtn(page, 'cardunlink').click();
  expect(await page.evaluate(() => state.learning.goals[0].stages[0].subject)).toBe('');
});

test('la etapa cuenta las tarjetas de su materia y «Repasar las de hoy» abre un examen solo con ellas', async ({ page }) => {
  await boot(page); await mkCards(page, 'Guitarra', 4); await seedGoal(page, 'Guitarra');
  await page.evaluate(() => { state.cards.push(normalizeCard({ subject: 'Otra', question: 'X', answer: 'Y', nextReview: today() })); rev++; });
  await modalBtn(page, 'stage').click();
  await expect(page.locator('#modal-body')).toContainText(/Tarjetas: 4 · |Cards: 4 · /);
  await modalBtn(page, 'cardrev').click();
  expect(await page.evaluate(() => [!!exam, exam && exam.cards.every((c) => c.subject === 'Guitarra'), exam && exam.cards.length])).toEqual([true, true, 4]);
});

test('«+ Crear tarjeta» abre el formulario con la materia de la etapa', async ({ page }) => {
  await boot(page); await seedGoal(page, 'Guitarra');
  await modalBtn(page, 'stage').click(); await modalBtn(page, 'cardnew').click();
  await expect(page.locator('#modal-body [name="subject"]')).toHaveValue('Guitarra');
});

test('comprobar con tarjetas: exige 3 repasadas y ninguna fallada; deja una evidencia automática', async ({ page }) => {
  await boot(page); await seedGoal(page, 'Guitarra');
  await mkCards(page, 'Guitarra', 3); // sin repasar
  await modalBtn(page, 'stage').click();
  await expect(modalBtn(page, 'cardcheck')).toBeDisabled();
  await page.evaluate(() => { state.cards.forEach((c, i) => { c.history = [{ date: today(), rating: i ? 'easy' : 'again', quality: 1 }]; }); rev++; window.LearnyGoals.open('g1'); });
  await modalBtn(page, 'stage').click();
  await expect(modalBtn(page, 'cardcheck')).toBeDisabled(); // una quedó en «No lo sabía»
  await page.evaluate(() => { state.cards[0].history.push({ date: today(), rating: 'hard', quality: 3 }); rev++; window.LearnyGoals.open('g1'); });
  await modalBtn(page, 'stage').click();
  await modalBtn(page, 'cardcheck').click();
  const s = await page.evaluate(() => state.learning.goals[0].stages[0]);
  expect(s).toMatchObject({ checked: true, checkedHow: 'cards', status: 'done' });
  expect(s.evidence).toHaveLength(1); expect(s.evidence[0].text).toContain('3 de 3');
});
