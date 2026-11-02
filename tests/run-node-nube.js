// Vigilante del aislamiento de la nube, sin navegador:  node tests/run-node-nube.js
// La nube (cuentas, Firebase, clase en la nube) está congelada y su código vive en nube/. Esto comprueba que:
//  (1) index.html y sw.js no cargan ni precachean nada de nube/;
//  (2) el resto de la app no depende de ella: solo js/20-pro.js la nombra, y siempre de forma defensiva (|| {} o ?.);
//  (3) nube/ está completa, sigue congelada (CLOUD_ENABLED = false) y se puede restaurar.
// Si algún día restauras la nube (nube/js/23-cuenta.js ya no está ahí), el vigilante se apaga solo. Cada comprobación se prueba también con un ejemplo MALO.
const fs = require('fs'), path = require('path'), assert = require('assert');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const exists = (f) => fs.existsSync(path.join(ROOT, f));
const T = (n, f) => { try { f(); console.log('ok  ', n); } catch (e) { console.log('FAIL', n, '·', e.message); process.exitCode = 1; } };
const stripComments = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\'"`])\/\/[^\n]*/g, '$1');

// ── Comprobaciones reutilizables (devuelven los problemas; lista vacía = bien) ──────────────────────────
const CLOUD_PATH = /23-cuenta|24-clase-nube|firebase|(^|\/)nube\//i;
const cloudInLoadList = (paths) => paths.filter((p) => CLOUD_PATH.test(p));
const indexRefs = (html) => [...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<(?:script|link)[^>]*?(?:src|href)="([^"#?]+)"/g)].map((m) => m[1]);
const swRefs = (sw) => [...sw.matchAll(/'(\.\/[^']+)'/g)].map((m) => m[1]);
// Usos de los globales de la nube que NO son defensivos: el global tiene que ir seguido de « || {}» o de «?.».
const unsafeCloudUses = (code) => {
  const c = stripComments(code), out = [];
  for (const m of c.matchAll(/\bLearny(Cloud|Account|ClassCloud)\b/g)) {
    const rest = c.slice(m.index + m[0].length);
    if (!(rest.startsWith(' || {}') || rest.startsWith('?.'))) out.push(`${m[0]}${rest.slice(0, 18).replace(/\n/g, ' ')}…`);
  }
  return out;
};
const mentions = (code) => /\bLearny(Cloud|Account|ClassCloud)\b|account-button|learny:cloud-ready/.test(stripComments(code));

if (!exists('nube/js/23-cuenta.js')) { console.log('ok   nube/js/23-cuenta.js ya no está en nube/: la nube está restaurada en la app y este vigilante no aplica (bórralo de verificar.sh)'); return; }

// ── La app real ───────────────────────────────────────────────────────────────────────────────────────────
T('index.html no carga nada de la nube (23-cuenta, 24-clase-nube, firebase)', () => assert.deepStrictEqual(cloudInLoadList(indexRefs(read('index.html'))), []));
T('sw.js no precachea nada de la nube', () => assert.deepStrictEqual(cloudInLoadList(swRefs(read('sw.js'))), []));

const jsFiles = fs.readdirSync(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js')).map((f) => 'js/' + f).concat('extras.js');
T(`de los ${jsFiles.length} JS de la app, solo js/20-pro.js nombra la nube`, () => assert.deepStrictEqual(jsFiles.filter((f) => mentions(read(f))), ['js/20-pro.js']));
T('js/20-pro.js usa la nube solo de forma defensiva (window.LearnyCloud || {} y LearnyAccount?.)', () => assert.deepStrictEqual(unsafeCloudUses(read('js/20-pro.js')), []));
T('js/ no contiene subcarpetas de nube (js/firebase)', () => assert.strictEqual(exists('js/firebase'), false));

const NUBE = ['nube/README.md', 'nube/restaurar-nube.patch', 'nube/firebase.json', 'nube/firebase/firestore.rules', 'nube/firebase/firestore.indexes.json',
  'nube/js/23-cuenta.js', 'nube/js/24-clase-nube.js', 'nube/js/firebase/firebase-config.js', 'nube/js/firebase/firebase-init.js', 'nube/js/firebase/firebase-auth.js',
  'nube/js/firebase/firebase-profile.js', 'nube/js/firebase/firebase-teaching.js', 'nube/tests/cuenta-perfil.spec.js', 'nube/tests/clase-nube.spec.js', 'nube/tests/reglas-emulador.js', 'nube/package.json'];
T('nube/ está completa (código, reglas, pruebas, README y parche para restaurar)', () => assert.deepStrictEqual(NUBE.filter((f) => !exists(f)), []));
T('nube/restaurar-nube.patch no está vacío', () => assert.ok(read('nube/restaurar-nube.patch').split('\n').filter((l) => l.startsWith('diff --git')).length >= 3));
T('la nube sigue congelada: CLOUD_ENABLED = false', () => assert.ok(/export const CLOUD_ENABLED = false;/.test(read('nube/js/firebase/firebase-config.js'))));

// ── Controles negativos: el vigilante tiene que saltar con cada uno de estos ejemplos malos ────────────────
T('control: un <script> de la nube en index.html → falla', () => assert.ok(cloudInLoadList(indexRefs('<script src="js/23-cuenta.js" defer></script>')).length));
T('control: un módulo de Firebase en index.html → falla', () => assert.ok(cloudInLoadList(indexRefs('<script type="module" src="js/firebase/firebase-teaching.js"></script>')).length));
T('control: la nube precacheada en sw.js → falla', () => assert.ok(cloudInLoadList(swRefs("const CORE = ['./index.html', './js/24-clase-nube.js'];")).length));
T('control: index.html normal NO da falsos positivos (ni el comentario que menciona la nube)', () => assert.deepStrictEqual(cloudInLoadList(indexRefs('<!-- la nube vive en nube/ -->\n<script src="js/20-pro.js" defer></script><link rel="stylesheet" href="style.css">')), []));
T('control: window.LearnyCloud.account (sin protección) → falla', () => assert.ok(unsafeCloudUses('const a = window.LearnyCloud.account;').length));
T('control: window.LearnyAccount.requireAuth() sin ?. → falla', () => assert.ok(unsafeCloudUses('await window.LearnyAccount.requireAuth({});').length));
T('control: los usos defensivos y los comentarios NO dan falsos positivos', () => assert.deepStrictEqual(unsafeCloudUses("const cloud = () => window.LearnyCloud || {};\nawait window.LearnyAccount?.requireAuth({});\n// LearnyCloud.profile se lee de Firestore"), []));
T('control: otro archivo que nombra la nube → se detecta', () => assert.ok(mentions('if (window.LearnyAccount) go();') && mentions("$('#account-button')") && !mentions('const x = 1; // LearnyCloud')));
