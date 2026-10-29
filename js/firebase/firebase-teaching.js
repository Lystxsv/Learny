/* Learny · Firebase · Datos del profesor en Firestore (Etapa 6a en la nube)
   Módulo ES. Importa firebase-profile.js (que importa firebase-auth.js → firebase-init.js) y añade LearnyCloud.teaching.
   Guarda dos colecciones DE LA PROPIA CUENTA (las reglas de firebase/firestore.rules lo exigen):
     users/{uid}/reports/{id}   informes de alumnos   { deckId, deckName, version, student, date, total, cards }
     users/{uid}/received/{id}  mazos recibidos       { deckId, name, author, description, version, importedAt, keys }
   Aquí solo hay lectura, escritura y borrado de documentos: la fusión con los datos locales está en js/24-clase-nube.js (script clásico).
   Sin Firebase (demo, sin configurar, sin conexión) la API existe pero es inerte: available = false. */

import './firebase-profile.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.14.1';
const base = window.LearnyCloud, account = base.account;
const KINDS = new Set(['reports', 'received']);
let fs = null;

let teaching;
if (!base.ready || !account.available) {
  const off = async () => { throw new Error('Las cuentas no están disponibles ahora mismo.'); };
  teaching = Object.freeze({ available: false, list: off, put: off, remove: off });
} else {
  const friendly = (e) => {
    const c = String((e && e.code) || '').replace('firestore/', '');
    if (c === 'permission-denied') return 'No hay permiso para sincronizar con tu cuenta. Revisa que las reglas de Firestore estén publicadas.';
    if (c === 'unavailable' || c === 'failed-precondition') return 'No hay conexión con el servicio. Revisa tu internet e inténtalo de nuevo.';
    if (c === 'resource-exhausted') return 'Se alcanzó el límite diario gratuito de Firestore. Se reintentará más tarde.';
    return 'No se pudo sincronizar con tu cuenta. Inténtalo de nuevo.';
  };
  const ctx = async (kind, id) => {
    if (!KINDS.has(kind)) throw new Error('Tipo de dato no válido.');
    const u = account.user(); if (!u) throw new Error('Inicia sesión para sincronizar.');
    fs = fs || await import(`${SDK}/firebase-firestore.js`);
    return { u, F: fs, db: base.db, ok: (id == null || /^[0-9A-Za-z_-]{1,40}$/.test(String(id))) };
  };
  const wrap = async (fn) => { try { return await fn(); } catch (e) { if (e && e.message && !e.code) throw e; console.warn('Learny · sincronización', e && e.code, e); throw Object.assign(new Error(friendly(e)), { code: e && e.code }); } };
  teaching = Object.freeze({
    available: true,
    /* Todos los documentos de la colección de la cuenta con sesión: [{ id, ...datos }]. */
    list: (kind) => wrap(async () => { const { u, F, db } = await ctx(kind); const snap = await F.getDocs(F.collection(db, 'users', u.uid, kind)); return snap.docs.map((d) => ({ ...d.data(), id: d.id })); }),
    put: (kind, id, data) => wrap(async () => { const { u, F, db, ok } = await ctx(kind, id); if (!ok) throw new Error('Identificador no válido.'); await F.setDoc(F.doc(db, 'users', u.uid, kind, String(id)), data); }),
    remove: (kind, id) => wrap(async () => { const { u, F, db, ok } = await ctx(kind, id); if (!ok) throw new Error('Identificador no válido.'); await F.deleteDoc(F.doc(db, 'users', u.uid, kind, String(id))); })
  });
}

window.LearnyCloud = Object.freeze({ ...window.LearnyCloud, teaching });
document.dispatchEvent(new Event('learny:teaching-ready'));
