// v84 · Etapa 6a · modo profesor sin servidor: mazo con nombre/versión, informe del alumno y panel de resultados.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('learny.v3')) localStorage.setItem('learny.v3', JSON.stringify({ version: 4, settings: { welcomed: true, profile: 'teach', lang: 'es' }, notes: [{ text: 'x' }] })); });
  await page.goto('/');
  await page.waitForFunction(() => typeof shareDeckForm === 'function' && typeof importReport === 'function');
});

const seed = (page) => page.evaluate(() => {
  state.cards = ['Capital de Francia|París', 'Raíz de 9|3', 'H2O|Agua'].map((x, i) => normalizeCard({ subject: 'Mate', question: x.split('|')[0], answer: x.split('|')[1], nextReview: today() }));
  save(); rev++;
});
const deckFile = (over = {}) => ({ type: 'learny-deck', name: 'Repaso 1', author: 'Prof. Ana', description: 'Unidad 1', deckVersion: 2, cards: [{ subject: 'Mate', question: 'Capital de Francia', answer: 'París' }, { subject: 'Mate', question: 'Raíz de 9', answer: '3' }], ...over });
const toFile = (obj) => ({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(obj)) });

test('compartir mazo: descarga un archivo con nombre, autor, descripción, versión y sin progreso', async ({ page }) => {
  await seed(page);
  await page.evaluate(() => shareDeckForm());
  await page.fill('#modal-body [name="name"]', 'Repaso 1');
  await page.fill('#modal-body [name="author"]', 'Prof. Ana');
  await page.fill('#modal-body [name="description"]', 'Unidad 1');
  await page.fill('#modal-body [name="v"]', '3');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#modal-body .primary-button')]);
  expect(dl.suggestedFilename()).toMatch(/^learny-mazo-repaso-1-\d{4}-\d{2}-\d{2}\.json$/);
  const data = JSON.parse(require('fs').readFileSync(await dl.path(), 'utf8'));
  expect(data).toMatchObject({ type: 'learny-deck', name: 'Repaso 1', author: 'Prof. Ana', description: 'Unidad 1', deckVersion: 3 });
  expect(data.cards).toHaveLength(3);
  expect(Object.keys(data.cards[0]).sort()).toEqual(['answer', 'question', 'subject']);
  expect(data.deckId).toMatch(/^[0-9a-z]{1,8}$/);
});

test('compartir mazo: sin nombre o sin materias no descarga', async ({ page }) => {
  await seed(page);
  await page.evaluate(() => shareDeckForm());
  await page.uncheck('#modal-body [name="sub"]');
  await page.fill('#modal-body [name="name"]', 'X');
  await page.click('#modal-body .primary-button');
  await expect(page.locator('#app-modal')).toHaveAttribute('open', '');
});

test('importar un mazo con nombre lo registra como recibido y se conserva al recargar', async ({ page }) => {
  await page.evaluate(() => { state.cards = []; save(); });
  await page.setInputFiles('#lib-file', toFile(deckFile()));
  await expect(page.locator('#app-modal')).toContainText('Repaso 1');
  await expect(page.locator('#app-modal')).toContainText('v2');
  await page.click('#modal-body .primary-button');
  const r = await page.evaluate(() => ({ n: state.cards.length, rec: state.received.map((x) => ({ name: x.name, v: x.version, keys: x.keys.length })) }));
  expect(r).toEqual({ n: 2, rec: [{ name: 'Repaso 1', v: 2, keys: 2 }] });
  await page.reload(); await page.waitForFunction(() => typeof state !== 'undefined' && state.received.length === 1);
});

test('un mazo ya importado con las mismas tarjetas se puede registrar, pero la misma versión no se repite', async ({ page }) => {
  await page.evaluate(() => { state.cards = [normalizeCard({ subject: 'Mate', question: 'Capital de Francia', answer: 'París' }), normalizeCard({ subject: 'Mate', question: 'Raíz de 9', answer: '3' })]; save(); });
  await page.setInputFiles('#lib-file', toFile(deckFile()));
  await expect(page.locator('#modal-body .primary-button')).toHaveText('Registrar mazo');
  await page.click('#modal-body .primary-button');
  expect(await page.evaluate(() => state.received.length)).toBe(1);
  await page.setInputFiles('#lib-file', toFile(deckFile()));
  await expect(page.locator('#modal-body')).toContainText('No hay nada que importar');
});

test('informe del alumno: solo tarjetas del mazo, con repasos y fallos, sin clave', async ({ page }) => {
  const rep = await page.evaluate(() => {
    state.apiKey = 'AIza-SECRETA'; state.cards = [];
    const rec = { deckId: 'abc', name: 'Repaso 1', author: 'Prof', description: '', version: 2, importedAt: today(), keys: [deckKey('Capital de Francia'), deckKey('Raíz de 9')] };
    state.received = [rec];
    state.cards.push(normalizeCard({ subject: 'Mate', question: 'Capital de Francia', answer: 'París', history: [{ date: today(), rating: 'again' }, { date: today(), rating: 'easy' }] }));
    state.cards.push(normalizeCard({ subject: 'Otra', question: 'Pregunta privada', answer: 'x', history: [{ date: today(), rating: 'again' }] }));
    return buildStudentReport(rec, 'Luis');
  });
  expect(rep).toMatchObject({ type: 'learny-report', deckId: 'abc', student: 'Luis', total: 2 });
  expect(rep.cards).toHaveLength(1);
  expect(rep.cards[0]).toMatchObject({ n: 2, a: 1, last: 'easy' });
  expect(JSON.stringify(rep)).not.toContain('SECRETA');
  expect(JSON.stringify(rep)).not.toContain('privada');
});

test('importar informes: se validan, se reemplaza el del mismo alumno y no se pisa uno más reciente', async ({ page }) => {
  const rep = (over = {}) => ({ type: 'learny-report', deckId: 'abc', deckName: 'Repaso 1', deckVersion: 2, student: 'Luis', date: '2026-05-10', total: 2, cards: [{ k: 'k1', q: 'Capital de Francia', n: 4, a: 2, last: 'again', iv: 1 }, { k: 'k2', q: 'Raíz de 9', n: 2, a: 0, last: 'easy', iv: 6 }], ...over });
  await page.setInputFiles('#lib-file', toFile(rep()));
  await expect.poll(() => page.evaluate(() => state.reports.length)).toBe(1);
  await page.setInputFiles('#lib-file', toFile(rep({ date: '2026-05-12' })));
  await expect.poll(() => page.evaluate(() => state.reports[0].date)).toBe('2026-05-12');
  await page.setInputFiles('#lib-file', toFile(rep({ date: '2026-05-01' })));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => [state.reports.length, state.reports[0].date])).toEqual([1, '2026-05-12']);
  await page.setInputFiles('#lib-file', toFile(rep({ student: 'Marta', cards: [{ k: 'k1', n: 1, a: 5 }, { n: 1, a: 0 }] })));
  await expect.poll(() => page.evaluate(() => state.reports.length)).toBe(2);
  expect(await page.evaluate(() => state.reports.find((r) => r.student === 'Marta').cards.length)).toBe(0); // a > n y sin huella: descartadas
  await page.setInputFiles('#lib-file', toFile({ type: 'learny-report', cards: [] }));
  await expect(page.locator('#toast')).toContainText('formato');
});

test('el panel de Reforzar muestra alumnos, % sin fallar y las tarjetas que más se fallan', async ({ page }) => {
  await page.evaluate(() => {
    const mk = (student, a1) => normalizeReport({ type: 'learny-report', deckId: 'abc', deckName: 'Repaso 1', student, date: today(), total: 2, cards: [{ k: 'k1', q: 'Capital de Francia', n: 4, a: a1, last: 'again', iv: 1 }, { k: 'k2', q: 'Raíz de 9', n: 4, a: 0, last: 'easy', iv: 6 }] });
    state.reports = [mk('Luis', 2), mk('Marta', 4)]; save(); showPage('analysis'); renderAll();
  });
  await expect(page.locator('#class-card')).toBeVisible();
  await expect(page.locator('#class-list .weak-topic')).toHaveCount(2);
  await expect(page.locator('#class-summary')).toContainText('2 alumnos');
  await expect(page.locator('#class-hard .weak-topic')).toHaveCount(1);
  await expect(page.locator('#class-hard')).toContainText('Capital de Francia');
  await page.click('[data-del-report]');
  await expect(page.locator('#class-list .weak-topic')).toHaveCount(1);
  await page.click('.toast-action');
  await expect(page.locator('#class-list .weak-topic')).toHaveCount(2);
});

test('un perfil que no es profesor no ve el panel hasta importar un informe', async ({ page }) => {
  await page.evaluate(() => { state.settings.profile = 'exam'; save(); showPage('analysis'); renderAll(); });
  await expect(page.locator('#class-card')).toBeHidden();
});

test('Hoy propone compartir un mazo (profesor con tarjetas) y luego ver resultados', async ({ page }) => {
  await seed(page);
  const ids = await page.evaluate(() => { const a = actionCandidates().map((c) => c.id); state.reports = [normalizeReport({ type: 'learny-report', deckName: 'D', student: 'A', cards: [] })]; return [a, actionCandidates().map((c) => c.id)]; });
  expect(ids[0]).toContain('share'); expect(ids[0]).not.toContain('class');
  expect(ids[1]).toContain('class'); expect(ids[1]).not.toContain('share');
});

test('copias antiguas sin received/reports cargan bien y los datos dañados se limpian', async ({ page }) => {
  const r = await page.evaluate(() => { hydrate({ version: 4, settings: {} }); const a = [state.received, state.reports]; hydrate({ version: 4, received: [{ deckId: 'a b', name: '' }, 5], reports: [{ type: 'x' }, { student: 'A', deckName: 'D', cards: [{ k: 'z', n: 1, a: 3 }] }] }); return [a, state.received.length, state.reports.length]; });
  expect(r[0]).toEqual([[], []]); expect(r[1]).toBe(0); expect(r[2]).toBe(1);
});

test('el CSV de resumen protege contra fórmulas', async ({ page }) => {
  await page.evaluate(() => { state.reports = [normalizeReport({ type: 'learny-report', deckName: 'D', student: '=CMD()', cards: [] })]; });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => exportClass())]);
  expect(require('fs').readFileSync(await dl.path(), 'utf8')).toContain('"\'=CMD()"');
});
