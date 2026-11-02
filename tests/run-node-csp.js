// Vigilante de la política de seguridad de contenido (CSP), sin navegador:  node tests/run-node-csp.js
// Comprueba dos cosas: (1) que la política de index.html sigue siendo estricta donde importa (scripts), y
// (2) que el código no vuelve a usar nada que esa política bloquea (scripts en línea, onclick="…", eval, new Function).
// Cada comprobación se prueba también contra un ejemplo MALO, para demostrar que de verdad sabe fallar.
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const T = (n, f) => { try { f(); console.log('ok  ', n); } catch (e) { console.log('FAIL', n, '·', e.message); process.exitCode = 1; } };

// ── Comprobaciones reutilizables (devuelven la lista de problemas; vacía = bien) ──────────────────────────
function parsePolicy(html) {
  const m = html.match(/<meta[^>]+http-equiv="Content-Security-Policy"[^>]+content="([^"]*)"/i);
  if (!m) return null;
  const d = {};
  m[1].split(';').map((x) => x.trim()).filter(Boolean).forEach((x) => { const [k, ...v] = x.split(/\s+/); d[k.toLowerCase()] = v; });
  return { d, index: m.index };
}
function policyProblems(html) {
  const p = parsePolicy(html), out = [];
  if (!p) return ['index.html no tiene <meta http-equiv="Content-Security-Policy">'];
  const { d } = p, has = (k, v) => (d[k] || []).includes(v);
  if (JSON.stringify(d['script-src']) !== JSON.stringify(["'self'"])) out.push(`script-src debe ser solo 'self' y es: ${(d['script-src'] || ['(falta)']).join(' ')}`);
  if (JSON.stringify(d['default-src']) !== JSON.stringify(["'self'"])) out.push(`default-src debe ser solo 'self' y es: ${(d['default-src'] || ['(falta)']).join(' ')}`);
  if (!has('object-src', "'none'")) out.push("object-src debe ser 'none'");
  if (!has('base-uri', "'self'")) out.push("base-uri debe ser 'self'");
  for (const [k, v] of Object.entries(d)) if (v.includes("'unsafe-eval'")) out.push(`${k} permite 'unsafe-eval'`);
  for (const [k, v] of Object.entries(d)) if (k.startsWith('script-src') && v.includes("'unsafe-inline'")) out.push(`${k} permite 'unsafe-inline'`);
  const head = html.slice(0, p.index);
  if (/<(script|link|style)\b/i.test(head.replace(/<!--[\s\S]*?-->/g, ''))) out.push('hay <script>, <link> o <style> ANTES de la política: no quedarían protegidos');
  return out;
}
function htmlProblems(html) {
  const out = [], clean = html.replace(/<!--[\s\S]*?-->/g, '');
  for (const m of clean.matchAll(/<script\b([^>]*)>/gi)) if (!/\bsrc\s*=/.test(m[1])) out.push('<script> en línea (sin src)');
  if (/<[a-z][^>]*\son[a-z]{3,}\s*=/i.test(clean)) out.push('manejador en línea (onclick="…") en el HTML');
  if (/\b(href|src|action)\s*=\s*["']\s*javascript:/i.test(clean)) out.push('URL javascript: en el HTML');
  return out;
}
function jsProblems(code) {
  const out = [], clean = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\'"`])\/\/[^\n]*/g, '$1');
  if (/<[a-z][^<>]*\son[a-z]{3,}\s*=\s*\\?["']/i.test(clean)) out.push('manejador en línea (onclick="…") dentro de una plantilla');
  if (/\beval\s*\(/.test(clean)) out.push('eval(');
  if (/\bnew\s+Function\s*\(/.test(clean)) out.push('new Function(');
  if (/\bset(Timeout|Interval)\s*\(\s*["'`]/.test(clean)) out.push('setTimeout/setInterval con texto (equivale a eval)');
  if (/\b(href|src|action)\s*=\s*\\?["']\s*javascript:/i.test(clean)) out.push('URL javascript: dentro de una plantilla');
  if (/document\.write\s*\([^)]*<script/i.test(clean)) out.push('document.write con <script>');
  return out;
}

// ── La app real ───────────────────────────────────────────────────────────────────────────────────────────
const html = read('index.html');
T('la política de index.html es estricta (scripts solo del propio sitio, sin eval, sin objetos, base fija)', () => assert.deepStrictEqual(policyProblems(html), []));
T('index.html no tiene scripts en línea, onclick="…" ni URL javascript:', () => assert.deepStrictEqual(htmlProblems(html), []));

const files = [];
const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : /\.js$/.test(e.name) && files.push(path.join(dir, e.name))));
walk('js'); if (fs.existsSync(path.join(ROOT, 'nube/js'))) walk('nube/js'); // la nube no se carga, pero si se reactiva tiene que cumplir la misma política
files.push('extras.js', 'sw.js');
T(`ninguno de los ${files.length} JS del sitio usa eval, new Function ni manejadores en línea`, () => {
  const bad = files.flatMap((f) => jsProblems(read(f)).map((p) => `${f}: ${p}`));
  assert.deepStrictEqual(bad, []);
});
T('el service worker sigue precacheando index.html (así la política viaja con la copia en caché)', () => assert.ok(/['"]\.?\/?index\.html['"]|['"]\.\/['"]/.test(read('sw.js'))));

// ── Controles negativos: el vigilante tiene que saltar con cada uno de estos ejemplos malos ────────────────
const withPolicy = (policy) => `<head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${policy}"></head>`;
const OK = "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'";
T('control: sin política → falla', () => assert.ok(policyProblems('<head></head>').length));
T("control: script-src con 'unsafe-inline' → falla", () => assert.ok(policyProblems(withPolicy(OK.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'"))).length));
T("control: 'unsafe-eval' → falla", () => assert.ok(policyProblems(withPolicy(OK + " 'unsafe-eval'")).length));
T('control: script-src con https: → falla', () => assert.ok(policyProblems(withPolicy(OK.replace("script-src 'self'", 'script-src https:'))).length));
T('control: sin object-src none → falla', () => assert.ok(policyProblems(withPolicy(OK.replace("object-src 'none'; ", ''))).length));
T('control: un <script> antes de la política → falla', () => assert.ok(policyProblems('<head><script src="a.js"></script><meta http-equiv="Content-Security-Policy" content="' + OK + '"></head>').length));
T('control: la política correcta pasa', () => assert.deepStrictEqual(policyProblems(withPolicy(OK)), []));
T('control: <script> en línea → falla', () => assert.ok(htmlProblems('<script>alert(1)</script>').length));
T('control: onclick en el HTML → falla', () => assert.ok(htmlProblems('<button onclick="x()">a</button>').length));
T('control: onclick dentro de una plantilla JS → falla', () => assert.ok(jsProblems("el.innerHTML = `<button onclick=\"x()\">a</button>`;").length));
T('control: eval / new Function / setTimeout con texto → falla', () => { assert.ok(jsProblems('eval("1")').length); assert.ok(jsProblems('new Function("return 1")').length); assert.ok(jsProblems('setTimeout("x()", 5)').length); });
T('control: el código normal NO da falsos positivos (.onclick = función, comentarios, setTimeout con función)', () => assert.deepStrictEqual(jsProblems("btn.onclick = () => go(); // nunca eval(x) ni onclick=\"y\"\nsetTimeout(() => go(), 5);"), []));
