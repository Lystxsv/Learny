const { test } = require('@playwright/test');
test('dbg', async ({ page }) => {
  page.on('console', m => { if (m.text().startsWith('X')) console.log(m.text()); });
  await page.goto('/'); await page.waitForFunction(() => window.LearnyAccount && typeof isPro === 'function');
  await page.evaluate(() => { state.settings.welcomed = true; window.LearnyCloud = Object.freeze({ ready: true, account: { available: true, user: () => ({uid:'u',email:'a@b.co'}), whenReady: Promise.resolve(null), onChange: () => () => {} }, profile: { available: true, status: () => 'ready', current: () => ({plan:'free',proStatus:'inactive'}), error: () => '', isProSync: () => false, isPro: async () => false, refresh: async () => null } }); document.dispatchEvent(new Event('learny:account-ready'));
    const sp = showPage; window.showPage = function (p) { console.log('X showPage', p, new Error().stack.split('\n').slice(2,4).join('|')); return sp(p); }; });
  await page.evaluate(() => { requirePro('quiz', () => {}); });
  await page.click('#modal-body [data-pro-plan]');
  await page.waitForTimeout(400);
  console.log('X after', await page.evaluate(() => currentPage));
});
