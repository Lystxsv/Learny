/* Learny · Firebase · Perfil del usuario en Firestore (Bloque 3)
   Módulo ES. Importa firebase-auth.js (que a su vez importa firebase-init.js) y añade LearnyCloud.profile.
   Qué hace:
   · Cuando hay sesión, lee users/{uid}. Si el documento NO existe (cuenta nueva, o cuenta creada antes de este bloque), lo crea con plan «free» y proStatus «inactive».
   · Ofrece el perfil actual, si el usuario es Pro y avisos de cambio. Nada se guarda en localStorage: el estado de Pro viene solo de Firestore.
   · El navegador NUNCA activa Pro: el único documento que escribe es el inicial, con valores fijos que las reglas (firebase/firestore.rules) exigen. Pro lo activará el servidor (Bloque 7).
   Sin Firebase (demo, sin configurar, sin conexión) la API existe pero es inerte: available = false y todo devuelve «sin perfil». */

import './firebase-auth.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.14.1';
const base = window.LearnyCloud, account = base.account;
const listeners = new Set();
let current = null, status = 'signed-out', lastError = '', fs = null, tokenSeq = 0, inflight = null, inflightUid = '';
// status: signed-out | loading | ready | error

/* Mensajes claros para los fallos más comunes de Firestore. */
const friendly = (e) => {
  const c = String((e && e.code) || '').replace('firestore/', '');
  if (c === 'permission-denied') return 'No hay permiso para leer o crear tu perfil. Revisa que las reglas de Firestore estén publicadas.';
  if (c === 'unavailable' || c === 'failed-precondition') return 'No hay conexión con el servicio. Revisa tu internet e inténtalo de nuevo.';
  if (c === 'not-found') return 'No se encontró la base de datos de Firestore. Comprueba que esté creada en Firebase Console.';
  return 'No se pudo cargar tu perfil. Inténtalo de nuevo.';
};

/* Convierte lo que llega de Firestore en un objeto simple: las fechas (Timestamp) pasan a milisegundos y solo se copian los campos conocidos. */
const ms = (t) => (t && typeof t.toMillis === 'function' ? t.toMillis() : typeof t === 'number' ? t : null);
const clean = (d) => ({
  email: String(d.email || ''), createdAt: ms(d.createdAt),
  plan: d.plan === 'pro' ? 'pro' : 'free', proStatus: typeof d.proStatus === 'string' ? d.proStatus : 'inactive',
  proSince: ms(d.proSince), proExpiresAt: ms(d.proExpiresAt),
  paymentProvider: d.paymentProvider || null, customerId: d.customerId || null, subscriptionId: d.subscriptionId || null
});

/* ¿Es Pro este perfil? Plan «pro», estado «active» y, si hay fecha de vencimiento, que no haya pasado. (El Bloque 6 expone esto como isUserPro().) */
const isProProfile = (p) => !!p && p.plan === 'pro' && p.proStatus === 'active' && (p.proExpiresAt == null || p.proExpiresAt > Date.now());

const emit = () => {
  const detail = { status, profile: current, error: lastError };
  listeners.forEach((fn) => { try { fn(detail); } catch (e) { console.error(e); } });
  document.dispatchEvent(new CustomEvent('learny:profile', { detail }));
};
const set = (st, profile, err = '') => { status = st; current = profile; lastError = err; emit(); };

let profile;
if (!base.ready || !account.available) {
  profile = Object.freeze({
    available: false, status: () => 'signed-out', current: () => null, error: () => '', isPro: async () => false, isProSync: () => false,
    get: async () => null, refresh: async () => null, onChange: () => () => {}
  });
} else {
  /* Crea el documento inicial SOLO si no existe (transacción: nunca pisa uno existente). Estos valores son los únicos que las reglas permiten crear. */
  async function create(F, ref, u) {
    await F.runTransaction(base.db, async (tx) => {
      if ((await tx.get(ref)).exists()) return;
      tx.set(ref, {
        email: u.email, createdAt: F.serverTimestamp(), plan: 'free', proStatus: 'inactive',
        proSince: null, proExpiresAt: null, paymentProvider: null, customerId: null, subscriptionId: null
      });
    });
  }

  async function load(u, seq) {
    try {
      fs = fs || await import(`${SDK}/firebase-firestore.js`);
      const ref = fs.doc(base.db, 'users', u.uid);
      let snap = await fs.getDoc(ref);
      if (!snap.exists()) { await create(fs, ref, u); snap = await fs.getDoc(ref); } // documento ausente: se crea (cuenta nueva o anterior al Bloque 3)
      if (seq !== tokenSeq) return current; // mientras tanto cambió la sesión: se descarta este resultado
      if (!snap.exists()) throw Object.assign(new Error('sin documento'), { code: 'not-found' });
      set('ready', clean(snap.data()));
    } catch (e) {
      console.warn('Learny · perfil', e && e.code, e);
      if (seq === tokenSeq) set('error', null, friendly(e)); // ante un fallo nunca se asume Pro
    }
    return current;
  }

  /* Carga (o recarga) el perfil del usuario con sesión. Varias llamadas a la vez comparten la misma consulta. */
  function refresh() {
    const u = account.user();
    if (!u) { tokenSeq++; inflight = null; inflightUid = ''; set('signed-out', null); return Promise.resolve(null); }
    if (inflight && inflightUid === u.uid) return inflight;
    const seq = ++tokenSeq; inflightUid = u.uid; set('loading', null);
    inflight = load(u, seq).finally(() => { if (seq === tokenSeq) { inflight = null; inflightUid = ''; } });
    return inflight;
  }

  account.onChange((u) => { if (u) refresh(); else { tokenSeq++; inflight = null; inflightUid = ''; set('signed-out', null); } });
  account.whenReady.then((u) => { if (u && status === 'signed-out') refresh(); }); // sesión restaurada antes de que este módulo se registrara

  profile = Object.freeze({
    available: true, status: () => status, current: () => current, error: () => lastError,
    get: async () => (status === 'ready' ? current : refresh()),       // perfil del usuario actual (o null si no hay sesión o falló)
    refresh,
    isPro: async () => isProProfile(await profile.get()),               // verificación contra Firestore
    isProSync: () => isProProfile(current),                              // con lo ya cargado (para pintar la interfaz sin esperar)
    onChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); }
  });
}

window.LearnyCloud = Object.freeze({ ...window.LearnyCloud, profile });
document.dispatchEvent(new Event('learny:profile-ready'));
