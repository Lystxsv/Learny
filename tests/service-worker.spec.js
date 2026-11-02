// Service worker: instalación, uso sin conexión y actualización desde una instalación anterior.
// La config global bloquea los service workers; aquí se activan y se usa un servidor propio sobre una COPIA temporal del proyecto,
// así «desplegar» una versión nueva es solo reescribir sw.js en esa copia (sin depender de page.route, que no ve el sw.js).
const { test, expect } = require('@playwright/test');
const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');

const ROOT = path.resolve(__dirname, '..');
const SW_SRC = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const CACHE = (SW_SRC.match(/const CACHE = '([^']+)'/) || [])[1];
const CORE = [...SW_SRC.slice(SW_SRC.indexOf('const CORE'), SW_SRC.indexOf('const OPTIONAL')).matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };

// ── Estáticas (sin navegador): la lista del service worker debe coincidir con lo que carga index.html ──
test.describe('lista del service worker', () => {
  test.use({ serviceWorkers: 'block' });
  test('todo lo que carga index.html está en CORE y todo CORE existe en disco', () => {
    expect(CACHE, 'sw.js debe declarar const CACHE').toBeTruthy();
    expect(CORE.length).toBeGreaterThan(20);
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const used = [...html.matchAll(/<(?:script|link)[^>]*?(?:src|href)="([^"#?]+)"/g)].map((m) => m[1]).filter((u) => !/^(https?:)?\/\//.test(u) && !/^(data:|mailto:)/.test(u));
    // Los iconos son OPTIONAL (no bloquean la instalación); el resto debe estar en CORE.
    const optional = [...SW_SRC.matchAll(/OPTIONAL = \[([^\]]*)\]/g)].flatMap((m) => [...m[1].matchAll(/'\.\/([^']+)'/g)].map((x) => x[1]));
    const missingInCore = used.filter((u) => !CORE.includes(u) && !optional.includes(u));
    expect(missingInCore, 'cargado por index.html pero ausente de CORE en sw.js').toEqual([]);
    const missingOnDisk = [...CORE, ...optional].filter((f) => !fs.existsSync(path.join(ROOT, f)));
    expect(missingOnDisk, 'listado en sw.js pero no existe: la instalación del service worker fallaría').toEqual([]);
  });
});

// ── Con navegador ──
test.describe('service worker en el navegador', () => {
  test.use({ serviceWorkers: 'allow' });
  let dir, server, base, delayIndex = 0; // delayIndex: milisegundos que tarda el servidor en entregar index.html

  const sockets = new Set();
  const start = async () => {
    server = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
      const file = path.join(dir, rel);
      if (!file.startsWith(dir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('no'); }
      const send = () => { res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(fs.readFileSync(file)); };
      rel === 'index.html' && delayIndex ? setTimeout(send, delayIndex) : send();
    });
    server.on('connection', (s) => { sockets.add(s); s.on('close', () => sockets.delete(s)); });
    await new Promise((r) => server.listen(base ? Number(new URL(base).port) : 0, '127.0.0.1', r));
    base = `http://127.0.0.1:${server.address().port}/`;
  };
  const stop = async () => { for (const s of sockets) s.destroy(); await new Promise((r) => server.close(r)); server = null; };

  test.beforeEach(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learny-sw-'));
    fs.cpSync(ROOT, dir, { recursive: true, filter: (s) => !/[\\/](node_modules|\.git|tests|docs|idioma-ingles|nube|test-results|playwright-report)([\\/]|$)/.test(s) });
    base = null; delayIndex = 0; await start();
  });
  test.afterEach(async () => { if (server) await stop(); fs.rmSync(dir, { recursive: true, force: true }); });

  const controlled = (page) => page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 });
  const cacheNames = (page) => page.evaluate(() => caches.keys());

  test('la primera visita instala y guarda en caché todos los archivos imprescindibles', async ({ page }) => {
    await page.goto(base);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await controlled(page);
    expect(await cacheNames(page)).toEqual([CACHE]);
    const missing = await page.evaluate(async ({ CACHE, CORE }) => {
      const c = await caches.open(CACHE), out = [];
      for (const f of CORE) if (!(await c.match('./' + f))) out.push(f);
      return out;
    }, { CACHE, CORE });
    expect(missing).toEqual([]);
  });

  test('sin conexión, recargar sigue abriendo Learny desde la caché', async ({ page }) => {
    await page.goto(base);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await controlled(page);
    await stop(); // red de verdad caída (más fiable que setOffline con service workers)
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof toast === 'function' && typeof openSettings === 'function', null, { timeout: 15000 });
    await expect(page.locator('#toast')).toHaveCount(1);
  });

  test('actualización desde una instalación vieja: borra la caché anterior, avisa y conserva los datos', async ({ page }) => {
    // 1) «Instalación anterior»: misma app con otro nombre de caché.
    const swPath = path.join(dir, 'sw.js');
    fs.writeFileSync(swPath, SW_SRC.replace(`const CACHE = '${CACHE}'`, "const CACHE = 'learny-v0-vieja'"));
    await page.goto(base);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await controlled(page);
    expect(await cacheNames(page)).toEqual(['learny-v0-vieja']);
    await page.evaluate(() => localStorage.setItem('prueba.centinela', 'sigo-aqui'));
    const antes = await page.evaluate(() => localStorage.getItem('learny.v3'));

    // 2) «Despliegue»: llega el sw.js actual.
    fs.writeFileSync(swPath, SW_SRC);
    await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });

    // 3) El nuevo se activa, borra la caché vieja y la app avisa.
    await page.waitForFunction((c) => caches.keys().then((k) => k.length === 1 && k[0] === c), CACHE, { timeout: 15000 });
    await expect(page.locator('#toast')).toContainText('se actualizó', { timeout: 10000 });
    expect(await page.evaluate(() => localStorage.getItem('prueba.centinela'))).toBe('sigo-aqui');
    if (antes !== null) expect(await page.evaluate(() => localStorage.getItem('learny.v3'))).not.toBeNull();

    // 4) Tras recargar, la versión nueva funciona (con y sin red).
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof toast === 'function', null, { timeout: 15000 });
    await stop();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof toast === 'function', null, { timeout: 15000 });
  });
  test('red lenta: si el index sale de la caché, los scripts también (no se mezclan versiones)', async ({ page }) => {
    test.slow(); // el index tarda 6 s a propósito (el service worker espera 4 s)
    const extras = path.join(dir, 'extras.js'), original = fs.readFileSync(extras, 'utf8');
    fs.writeFileSync(extras, original + "\nwindow.__marker = 'viejo';");
    await page.goto(base);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await controlled(page);
    expect(await page.evaluate(() => window.__marker)).toBe('viejo');

    // «Despliegue»: el servidor ya tiene un script nuevo, pero el index tarda más que el límite del service worker.
    fs.writeFileSync(extras, original + "\nwindow.__marker = 'nuevo';");
    delayIndex = 6000;
    await page.reload({ waitUntil: 'load', timeout: 30000 });
    expect(await page.evaluate(() => window.__marker), 'index viejo de la caché con script nuevo de la red = mezcla de versiones').toBe('viejo');

    // Con red normal la app se actualiza sola.
    delayIndex = 0;
    await page.reload({ waitUntil: 'load' });
    expect(await page.evaluate(() => window.__marker)).toBe('nuevo');
  });
});
