// C8: el texto de ejemplo (placeholder) de todos los campos llega a 4,5:1 contra su fondo real, en los seis temas.
const { test, expect } = require('@playwright/test');

const TEMAS = ['dark', 'light', 'oled', 'sepia', 'contrast', 'chrome'];

test.beforeEach(async ({ page }) => {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof applyAppearance === 'function' && !!document.querySelector('input[placeholder]'));
});

for (const tema of TEMAS) {
  test(`el placeholder de cada campo tiene contraste ≥ 4,5:1 en el tema ${tema}`, async ({ page }) => {
    const r = await page.evaluate((t) => {
      const lum = (m) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
      const num = (c) => c.match(/[\d.]+/g).map(Number);
      const mezcla = (fg, bg) => { const a = fg[3] === undefined ? 1 : fg[3]; return [0, 1, 2].map((i) => fg[i] * a + bg[i] * (1 - a)); };
      // Fondo real: el primer ancestro con color opaco (los semitransparentes se mezclan con lo de detrás).
      const fondo = (el) => {
        const capas = [];
        for (let n = el; n; n = n.parentElement) {
          const c = num(getComputedStyle(n).backgroundColor);
          if (c.length === 3 || c[3] > 0) capas.push(c);
          if (c.length === 3 || c[3] === 1) break;
        }
        let base = [0, 0, 0];
        for (let i = capas.length - 1; i >= 0; i--) base = mezcla(capas[i], base);
        return base;
      };
      state.settings.theme = t; applyAppearance();
      const campos = [...document.querySelectorAll('input[placeholder], textarea[placeholder]')];
      const filas = campos.map((e) => {
        const ph = getComputedStyle(e, '::placeholder');
        const tinta = num(ph.color); const op = parseFloat(ph.opacity);
        const bg = fondo(e);
        const fg = mezcla([tinta[0], tinta[1], tinta[2], (tinta[3] === undefined ? 1 : tinta[3]) * op], bg);
        const a = lum(fg), b = lum(bg);
        return { campo: e.id || e.name || e.placeholder.slice(0, 20), ratio: +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2) };
      });
      return { n: filas.length, mal: filas.filter((f) => f.ratio < 4.5), min: Math.min(...filas.map((f) => f.ratio)) };
    }, tema);
    expect(r.n).toBeGreaterThan(10);
    expect(r.mal, `campos bajo 4,5:1 en ${tema}: ${JSON.stringify(r.mal)}`).toEqual([]);
  });
}

test('en el tema de alto contraste el placeholder se distingue del texto escrito', async ({ page }) => {
  const r = await page.evaluate(() => {
    state.settings.theme = 'contrast'; applyAppearance();
    const e = document.querySelector('input[placeholder]');
    return { texto: getComputedStyle(e).color, ph: getComputedStyle(e, '::placeholder').color };
  });
  expect(r.ph).not.toBe(r.texto);
});
