// Perfiles · Etapa 3b: contraste, foco, orden de tabulación, nombres accesibles y desborde de la bienvenida.
const { test, expect } = require('@playwright/test');

const THEMES = ['dark', 'oled', 'light', 'sepia', 'contrast', 'chrome'];

async function openWelcome(page, step) {
  await page.goto('/');
  await page.waitForFunction(() => typeof welcomeFlow === 'function');
  const landing = page.locator('#landing button').first();
  if (await landing.isVisible().catch(() => false)) await landing.click();
  await expect(page.locator('[data-profile]')).toHaveCount(3);
  if (step === 1) { await page.locator('[data-profile="self"]').click(); await expect(page.locator('[name="fs"]')).toHaveCount(3); }
  await settle(page);
}
const settle = (page) => page.waitForFunction(() => { const d = document.querySelector('#app-modal'); return d.open && d.getAnimations().every((a) => a.playState !== 'running'); });
const setTheme = async (page, t) => { await page.evaluate((x) => { state.settings.theme = x; applyAppearance(); }, t); await settle(page); };

/* Funciones de medición que viven en la página (usan los colores calculados reales). */
const MEASURE = () => {
  const parse = (c) => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const [r, g, b] = [c.r, c.g, c.b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const effBg = (el) => { for (let n = el; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.backgroundImage !== 'none') return null; const c = parse(cs.backgroundColor); if (c && c.a >= 1) return c; } return null; }; // null = fondo con degradado: no se mide
  const visible = (el) => el.getClientRects().length > 0 && !el.closest('.sr-only');
  return { parse, ratio, effBg, visible };
};

async function textFailures(page) {
  return page.evaluate(([src]) => {
    const { parse, ratio, effBg, visible } = new Function(`return (${src})()`)();
    const out = [], tw = document.createTreeWalker(document.querySelector('#modal-body'), NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = n.nextNode()) {
      const t = n.data.trim(); if (!t || !/\p{L}/u.test(t)) continue;
      const el = n.parentElement; if (!visible(el)) continue;
      const bg = effBg(el); if (!bg) continue;
      const fg = parse(getComputedStyle(el).color), r = ratio(fg, bg);
      if (r < 4.5) out.push(`${t.slice(0, 40)} → ${r.toFixed(2)}`);
    }
    return out;
  }, [MEASURE.toString()]);
}

async function edgeFailures(page) {
  return page.evaluate(([src]) => {
    const { parse, ratio, effBg } = new Function(`return (${src})()`)();
    const sels = ['button.profile-opt', '.welcome-time input:not(:checked) + span', 'input[name="v"]', '[data-w="back"]'], out = [];
    sels.forEach((s) => document.querySelectorAll(s).forEach((el) => {
      if (!el.getClientRects().length) return;
      const cs = getComputedStyle(el); if (parseFloat(cs.borderTopWidth) < 1) { out.push(`${s}: sin borde`); return; }
      const edge = parse(cs.borderTopColor), outer = effBg(el.parentElement), own = effBg(el);
      [['exterior', outer], ['interior', own]].forEach(([w, bg]) => { if (bg && ratio(edge, bg) < 3) out.push(`${s} frente al fondo ${w}: ${ratio(edge, bg).toFixed(2)}`); });
    }));
    return out;
  }, [MEASURE.toString()]);
}

for (const theme of THEMES) {
  test(`tema ${theme}: texto ≥ 4,5:1 y bordes de controles ≥ 3:1 en los dos pasos`, async ({ page }) => {
    await openWelcome(page, 0); await setTheme(page, theme);
    expect(await textFailures(page), 'paso 1, texto').toEqual([]);
    expect(await edgeFailures(page), 'paso 1, bordes').toEqual([]);
    await page.locator('[data-profile="self"]').click(); await settle(page);
    expect(await textFailures(page), 'paso 2, texto').toEqual([]);
    expect(await edgeFailures(page), 'paso 2, bordes').toEqual([]);
  });
}

test('foco inicial: el título en el paso 1 y el campo de nombre en el paso 2 (en táctil, el título)', async ({ page }) => {
  await openWelcome(page, 0);
  expect(await page.evaluate(() => document.activeElement.id)).toBe('modal-title');
  await page.locator('[data-profile="exam"]').click();
  await expect(page.locator('input[name="v"]')).toBeFocused();
});

test('el diálogo tiene nombre accesible y todos los controles y grupos también', async ({ page }) => {
  for (const step of [0, 1]) {
    await openWelcome(page, step);
    const bad = await page.evaluate(() => {
      const d = document.querySelector('#app-modal'), out = [];
      const lab = d.getAttribute('aria-labelledby'); if (!lab || !document.getElementById(lab)?.textContent.trim()) out.push('diálogo sin nombre');
      const nameOf = (el) => (el.getAttribute('aria-label') || [...(el.labels || [])].map((l) => l.textContent).join(' ') || (el.getAttribute('aria-labelledby') && document.getElementById(el.getAttribute('aria-labelledby'))?.textContent) || el.textContent || '').trim();
      d.querySelectorAll('#modal-body button, #modal-body input, .modal-close').forEach((el) => { if (!nameOf(el)) out.push(`sin nombre: ${el.outerHTML.slice(0, 60)}`); });
      d.querySelectorAll('#modal-body fieldset').forEach((f) => { const n = f.querySelector(':scope > legend')?.textContent.trim() || (f.getAttribute('aria-labelledby') && document.getElementById(f.getAttribute('aria-labelledby'))?.textContent.trim()); if (!n) out.push('fieldset sin nombre'); });
      return out;
    });
    expect(bad, `paso ${step + 1}`).toEqual([]);
  }
});

test('orden de tabulación del paso 2 y anillo de foco visible en cada parada, en los seis temas', async ({ page }) => {
  for (const theme of THEMES) {
    await openWelcome(page, 1); await setTheme(page, theme);
    const seen = [], bad = [];
    await page.locator('input[name="v"]').focus();
    for (let i = 0; i < 9; i++) {
      const r = await page.evaluate(([src]) => {
        const { parse, ratio, effBg } = new Function(`return (${src})()`)();
        const el = document.activeElement; if (!el.closest('#app-modal')) return { label: 'FUERA DEL DIÁLOGO', ok: false };
        const label = el.name || el.dataset.w || el.getAttribute('aria-label') || el.type || el.tagName;
        const t = el.matches('.welcome-time input') ? el.nextElementSibling : el, cs = getComputedStyle(t);
        const w = parseFloat(cs.outlineWidth), ring = parse(cs.outlineColor), bg = effBg(t);
        const ok = cs.outlineStyle !== 'none' && w >= 2 && (!bg || ratio(ring, bg) >= 3);
        return { label, ok, why: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}` };
      }, [MEASURE.toString()]);
      seen.push(r.label); if (!r.ok) bad.push(`${theme} · ${r.label}: ${r.why}`);
      await page.keyboard.press('Tab');
    }
    expect(seen.slice(0, 9), theme).toEqual(['v', 't', 'fs', 'easy', 'calm', 'skip', 'back', 'submit', 'Cerrar']);
    expect(bad).toEqual([]);
  }
});

test('Esc cierra la bienvenida y el foco queda en el título de la página', async ({ page }) => {
  await openWelcome(page, 1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#app-modal')).not.toHaveAttribute('open', '');
  await expect.poll(() => page.evaluate(() => document.activeElement.tagName)).toBe('H1');
});

for (const [w, h] of [[320, 640], [390, 844], [1000, 800]]) {
  test(`sin desborde horizontal ni botones fuera de pantalla a ${w}px con texto de 24 px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    for (const step of [0, 1]) {
      await openWelcome(page, step);
      await page.evaluate(() => document.documentElement.style.setProperty('--base', '150%')); // 24 px
      await settle(page);
      const r = await page.evaluate(() => {
        const d = document.querySelector('#app-modal'), de = document.documentElement;
        const outside = [...d.querySelectorAll('#modal-body button, #modal-body input[type="text"], #modal-body input:not([type])')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && (b.left < -1 || b.right > de.clientWidth + 1); }).length;
        return { page: de.scrollWidth - de.clientWidth, dialog: d.scrollWidth - d.clientWidth, outside };
      });
      expect(r.page, `página, paso ${step + 1}`).toBeLessThanOrEqual(0);
      expect(r.dialog, `diálogo, paso ${step + 1}`).toBeLessThanOrEqual(0);
      expect(r.outside, `controles fuera, paso ${step + 1}`).toBe(0);
    }
  });
}

test('con texto de 24 px el botón «Terminar» se alcanza desplazando el diálogo', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await openWelcome(page, 1);
  await page.evaluate(() => document.documentElement.style.setProperty('--base', '150%'));
  await page.locator('#modal-body button[type="submit"]').scrollIntoViewIfNeeded();
  await expect(page.locator('#modal-body button[type="submit"]')).toBeInViewport();
});
