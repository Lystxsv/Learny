// Pruebas de las reglas de Firestore (nube/firebase/firestore.rules) contra el EMULADOR de Firestore.
// Se ejecutan con:  cd nube && npm run test:reglas   (pasos previos en nube/README.md → «Probar las reglas»).
//
// Cada prueba usa los mismos datos que envía el código real:
//   · users/{uid}              → js/firebase/firebase-profile.js  (create dentro de una transacción; update solo de displayName + updatedAt)
//   · users/{uid}/reports/{id} → js/firebase/firebase-teaching.js (setDoc / getDocs / deleteDoc), datos de js/24-clase-nube.js
//   · users/{uid}/received/{id}
// «assertSucceeds» = las reglas lo permiten; «assertFails» = las reglas lo rechazan (permission-denied).
// Mezclar lo que debe pasar con lo que debe fallar es a propósito: si todo «pasara», las reglas estarían abiertas.
//
// El nombre NO termina en .spec.js/.test.js a propósito: Playwright (npm test) no debe recogerlo. Funciona desde nube/tests/ (firebase/ está al lado, en nube/).

const { test, before, after, beforeEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc, runTransaction, serverTimestamp } = require('firebase/firestore');

const RULES = fs.readFileSync(path.join(__dirname, '..', 'firebase', 'firestore.rules'), 'utf8');
const ALICE = 'alice', BOB = 'bob';
let env;

// Cliente con sesión (con correo, como Google) o sin sesión.
const as = (uid) => env.authenticatedContext(uid, { email: `${uid}@example.com` }).firestore();
const anon = () => env.unauthenticatedContext().firestore();
// Escribe un documento saltándose las reglas (solo para preparar el escenario de una prueba).
const seed = (p, data) => env.withSecurityRulesDisabled((ctx) => setDoc(doc(ctx.firestore(), p), data));

// ── Datos válidos, tal como los envía la app ──
const perfilNuevo = (uid) => ({
  email: `${uid}@example.com`, createdAt: serverTimestamp(), plan: 'free', proStatus: 'inactive',
  proSince: null, proExpiresAt: null, paymentProvider: null, customerId: null, subscriptionId: null
});
const perfilGuardado = (uid) => ({ ...perfilNuevo(uid), createdAt: new Date('2026-11-01T00:00:00Z') }); // como queda en el servidor
const informe = (extra = {}) => ({ deckId: 'abc123', deckName: 'Biología', version: 1, student: 'Ana', date: '2026-11-01', total: 3, cards: [{ q: 'a', r: 'b' }], ...extra });
const recibido = (extra = {}) => ({ deckId: 'abc123', name: 'Biología', author: 'Profe', description: 'Mazo de prueba', version: 1, importedAt: '2026-11-01', keys: ['k1', 'k2'], ...extra });
const sin = (obj, ...campos) => { const o = { ...obj }; campos.forEach((c) => delete o[c]); return o; };

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-learny', firestore: { rules: RULES } }); // el host sale de FIRESTORE_EMULATOR_HOST (lo pone emulators:exec)
});
after(async () => { if (env) await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

// ───────────────────────── users/{uid} ─────────────────────────
test('users: leer', async () => {
  await seed(`users/${ALICE}`, perfilGuardado(ALICE));
  await assertSucceeds(getDoc(doc(as(ALICE), 'users', ALICE)));
  await assertFails(getDoc(doc(as(BOB), 'users', ALICE)));      // otra persona
  await assertFails(getDoc(doc(anon(), 'users', ALICE)));       // sin sesión
});

test('users: crear el perfil inicial (la transacción real de firebase-profile.js)', async () => {
  const db = as(ALICE), ref = doc(db, 'users', ALICE);
  await assertSucceeds(runTransaction(db, async (tx) => { if ((await tx.get(ref)).exists()) return; tx.set(ref, perfilNuevo(ALICE)); }));
});

test('users: crear con valores no permitidos', async () => {
  const mala = (cambios) => assertFails(setDoc(doc(as(ALICE), 'users', ALICE), { ...perfilNuevo(ALICE), ...cambios }));
  await mala({ plan: 'pro' });                                   // nadie se crea Pro
  await mala({ proStatus: 'active' });
  await mala({ proSince: new Date() });
  await mala({ proExpiresAt: new Date() });
  await mala({ paymentProvider: 'stripe' });
  await mala({ customerId: 'cus_1' });
  await mala({ subscriptionId: 'sub_1' });
  await mala({ email: 'otro@example.com' });                     // el correo debe ser el de la sesión
  await mala({ createdAt: new Date('2020-01-01') });             // la fecha la pone el servidor, no el cliente
  await mala({ extra: 'campo no previsto' });
  await assertFails(setDoc(doc(as(ALICE), 'users', ALICE), sin(perfilNuevo(ALICE), 'customerId'))); // faltan campos: las comparaciones con null fallan
  await assertFails(setDoc(doc(as(BOB), 'users', ALICE), perfilNuevo(ALICE)));      // crear el de otra persona
  await assertFails(setDoc(doc(anon(), 'users', ALICE), perfilNuevo(ALICE)));       // sin sesión
});

test('users: actualizar solo displayName y updatedAt', async () => {
  await seed(`users/${ALICE}`, perfilGuardado(ALICE));
  const ref = doc(as(ALICE), 'users', ALICE);
  await assertSucceeds(updateDoc(ref, { displayName: 'Ana', updatedAt: serverTimestamp() }));   // lo que hace firebase-profile.js
  await assertSucceeds(updateDoc(ref, { displayName: '', updatedAt: serverTimestamp() }));      // nombre vacío (0 caracteres)
  await assertSucceeds(updateDoc(ref, { displayName: 'x'.repeat(40), updatedAt: serverTimestamp() }));
});

test('users: actualizar lo que no se debe', async () => {
  await seed(`users/${ALICE}`, perfilGuardado(ALICE));
  const ref = doc(as(ALICE), 'users', ALICE);
  const ok = { displayName: 'Ana', updatedAt: serverTimestamp() };
  await assertFails(updateDoc(ref, { ...ok, displayName: 'x'.repeat(41) }));   // demasiado largo
  await assertFails(updateDoc(ref, { ...ok, displayName: 123 }));               // no es texto
  await assertFails(updateDoc(ref, { ...ok, updatedAt: new Date() }));          // la hora no es la del servidor
  await assertFails(updateDoc(ref, { ...ok, plan: 'pro' }));                    // volverse Pro
  await assertFails(updateDoc(ref, { ...ok, proStatus: 'active' }));
  await assertFails(updateDoc(ref, { ...ok, email: 'otro@example.com' }));
  await assertFails(updateDoc(ref, { ...ok, createdAt: serverTimestamp() }));
  await assertFails(updateDoc(ref, { plan: 'pro' }));                           // sin displayName
  await assertFails(updateDoc(doc(as(BOB), 'users', ALICE), ok));               // otra persona
  await assertFails(updateDoc(doc(anon(), 'users', ALICE), ok));                // sin sesión
});

test('users: borrar, nadie', async () => {
  await seed(`users/${ALICE}`, perfilGuardado(ALICE));
  await assertFails(deleteDoc(doc(as(ALICE), 'users', ALICE)));
  await assertFails(deleteDoc(doc(as(BOB), 'users', ALICE)));
});

// ───────────────────────── users/{uid}/reports/{id} ─────────────────────────
test('reports: guardar, leer, listar y borrar los propios', async () => {
  const db = as(ALICE), ref = doc(db, 'users', ALICE, 'reports', 'r1');
  await assertSucceeds(setDoc(ref, informe()));
  await assertSucceeds(setDoc(ref, informe({ student: 'Ana María' })));         // sustituir (update)
  await assertSucceeds(setDoc(doc(db, 'users', ALICE, 'reports', 'r2'), sin(informe(), 'deckId', 'version', 'total'))); // solo los obligatorios
  await assertSucceeds(getDoc(ref));
  await assertSucceeds(getDocs(collection(db, 'users', ALICE, 'reports')));
  await assertSucceeds(deleteDoc(ref));
});

test('reports: de otra persona o sin sesión', async () => {
  await seed(`users/${ALICE}/reports/r1`, informe());
  await assertFails(getDoc(doc(as(BOB), 'users', ALICE, 'reports', 'r1')));
  await assertFails(getDocs(collection(as(BOB), 'users', ALICE, 'reports')));
  await assertFails(setDoc(doc(as(BOB), 'users', ALICE, 'reports', 'r2'), informe()));
  await assertFails(deleteDoc(doc(as(BOB), 'users', ALICE, 'reports', 'r1')));
  await assertFails(getDoc(doc(anon(), 'users', ALICE, 'reports', 'r1')));
  await assertFails(setDoc(doc(anon(), 'users', ALICE, 'reports', 'r2'), informe()));
});

test('reports: datos no válidos', async () => {
  const put = (id, datos) => assertFails(setDoc(doc(as(ALICE), 'users', ALICE, 'reports', id), datos));
  await put('r1', informe({ extra: 1 }));                       // campo no previsto
  await put('r1', sin(informe(), 'student'));                   // falta un obligatorio
  await put('r1', sin(informe(), 'cards'));
  await put('r1', informe({ deckName: '' }));
  await put('r1', informe({ deckName: 'x'.repeat(81) }));
  await put('r1', informe({ student: '' }));
  await put('r1', informe({ student: 'x'.repeat(41) }));
  await put('r1', informe({ date: '2026-11-1' }));              // 9 caracteres
  await put('r1', informe({ date: '2026-11-011' }));            // 11 caracteres
  await put('r1', informe({ cards: 'no es lista' }));
  await put('r1', informe({ cards: new Array(201).fill({ q: 'a' }) }));
  await put('r1', informe({ deckId: 'x'.repeat(13) }));
  await put('r1', informe({ deckId: 5 }));
  await put('r1', informe({ version: 0 }));
  await put('r1', informe({ version: 1000 }));
  await put('r1', informe({ total: -1 }));
  await put('r1', informe({ total: 5001 }));
  await put('x'.repeat(41), informe());                         // identificador demasiado largo
  await put('con espacio', informe());                          // caracteres no permitidos
  await assertSucceeds(setDoc(doc(as(ALICE), 'users', ALICE, 'reports', 'x'.repeat(40)), informe())); // 40 sí
  await assertSucceeds(setDoc(doc(as(ALICE), 'users', ALICE, 'reports', 'A_b-9'), informe({ cards: new Array(200).fill({ q: 'a' }) }))); // 200 tarjetas sí
});

// ───────────────────────── users/{uid}/received/{id} ─────────────────────────
test('received: guardar, leer, listar y borrar los propios', async () => {
  const db = as(ALICE), ref = doc(db, 'users', ALICE, 'received', 'abc123');
  await assertSucceeds(setDoc(ref, recibido()));
  await assertSucceeds(setDoc(ref, recibido({ version: 2 })));
  await assertSucceeds(setDoc(doc(db, 'users', ALICE, 'received', 'z9'), { deckId: 'z9', name: 'Mínimo', version: 1, keys: [] })); // solo los obligatorios
  await assertSucceeds(getDoc(ref));
  await assertSucceeds(getDocs(collection(db, 'users', ALICE, 'received')));
  await assertSucceeds(deleteDoc(ref));
});

test('received: de otra persona o sin sesión', async () => {
  await seed(`users/${ALICE}/received/abc123`, recibido());
  await assertFails(getDoc(doc(as(BOB), 'users', ALICE, 'received', 'abc123')));
  await assertFails(setDoc(doc(as(BOB), 'users', ALICE, 'received', 'abc999'), recibido({ deckId: 'abc999' })));
  await assertFails(deleteDoc(doc(as(BOB), 'users', ALICE, 'received', 'abc123')));
  await assertFails(getDoc(doc(anon(), 'users', ALICE, 'received', 'abc123')));
});

test('received: datos no válidos', async () => {
  const put = (id, datos) => assertFails(setDoc(doc(as(ALICE), 'users', ALICE, 'received', id), datos));
  await put('abc123', recibido({ extra: 1 }));
  await put('abc123', recibido({ deckId: 'otro' }));            // deckId debe ser igual al id del documento
  await put('abc123', sin(recibido(), 'name'));
  await put('abc123', sin(recibido(), 'keys'));
  await put('abc123', sin(recibido(), 'version'));
  await put('abc123', recibido({ name: '' }));
  await put('abc123', recibido({ name: 'x'.repeat(81) }));
  await put('abc123', recibido({ author: 'x'.repeat(61) }));
  await put('abc123', recibido({ description: 'x'.repeat(301) }));
  await put('abc123', recibido({ version: 0 }));
  await put('abc123', recibido({ version: 1000 }));
  await put('abc123', recibido({ importedAt: '2026-11-1' }));
  await put('abc123', recibido({ keys: new Array(1001).fill('k') }));
  await put('abc123', recibido({ keys: 'no es lista' }));
  await put('ABC123', recibido({ deckId: 'ABC123' }));          // el id de «received» solo admite minúsculas y números
  await put('a'.repeat(13), recibido({ deckId: 'a'.repeat(13) })); // más de 12 caracteres
  await assertSucceeds(setDoc(doc(as(ALICE), 'users', ALICE, 'received', 'abc123'), recibido({ keys: new Array(1000).fill('k'), author: 'x'.repeat(60), description: 'x'.repeat(300), name: 'x'.repeat(80) }))); // en el límite sí
});

// ───────────────────────── todo lo demás, cerrado ─────────────────────────
test('cualquier otra ruta está cerrada', async () => {
  const db = as(ALICE);
  await assertFails(setDoc(doc(db, 'users', ALICE, 'otra', 'x'), { a: 1 }));      // subcolección no prevista
  await assertFails(getDoc(doc(db, 'users', ALICE, 'otra', 'x')));
  await assertFails(setDoc(doc(db, 'publico', 'x'), { a: 1 }));                    // colección no prevista
  await assertFails(getDoc(doc(db, 'publico', 'x')));
  await assertFails(getDocs(collection(db, 'users')));                             // listar a todos los usuarios
});
