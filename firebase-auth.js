/* Learny · Firebase · Cuentas (Bloque 2): registro, inicio y cierre de sesión, recuperación de contraseña y protección de páginas.
   Módulo ES. Importa firebase-init.js (que crea window.LearnyCloud) y le añade LearnyCloud.account.
   Aquí NO hay interfaz: la ventana de login vive en js/23-cuenta.js (script clásico). Aquí no se guarda nada en Firestore (eso es el Bloque 3).
   Si Firebase no está disponible (demo, sin configurar o sin conexión), account existe pero available = false y no hace nada. */

import './firebase-init.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.14.1';
const base = window.LearnyCloud;
const listeners = new Set();
let current = null, account;

/* Traduce los códigos de error de Firebase a mensajes claros. Un solo mensaje para «correo o contraseña incorrectos»:
   no se revela si un correo está registrado (evita que alguien pruebe correos ajenos). */
const MESSAGES = {
  'auth/invalid-email': 'El correo no es válido. Revisa que esté bien escrito.',
  'auth/missing-email': 'Escribe tu correo electrónico.',
  'auth/missing-password': 'Escribe tu contraseña.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Prueba a iniciar sesión.',
  'auth/weak-password': 'La contraseña es demasiado débil. Usa al menos 8 caracteres.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': 'No hay conexión con el servicio. Revisa tu internet e inténtalo de nuevo.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  'auth/operation-not-allowed': 'El inicio de sesión con correo no está activado en este proyecto.'
};
const friendly = (e) => MESSAGES[e && e.code] || 'No se pudo completar la operación. Inténtalo de nuevo.';
const fail = (e) => { console.warn('Learny · cuenta', e && e.code, e); throw Object.assign(new Error(friendly(e)), { code: e && e.code }); };
const cleanEmail = (v) => String(v || '').trim().toLowerCase().slice(0, 120);
const view = (u) => (u ? { uid: u.uid, email: u.email || '', emailVerified: !!u.emailVerified } : null); // solo lo necesario: nunca se expone el objeto completo ni el token

if (!base.ready) {
  /* Sin Firebase: API inerte para que el resto de Learny no tenga que comprobar nada. */
  account = Object.freeze({
    available: false, reason: base.reason, user: () => null, whenReady: Promise.resolve(null), onChange: () => () => {},
    signUp: async () => { throw new Error('Las cuentas no están disponibles ahora mismo.'); }, signIn: async () => { throw new Error('Las cuentas no están disponibles ahora mismo.'); },
    signOut: async () => {}, resetPassword: async () => { throw new Error('Las cuentas no están disponibles ahora mismo.'); }
  });
} else {
  const A = await import(`${SDK}/firebase-auth.js`), auth = base.auth;
  let ready, resolved = false; const whenReady = new Promise((r) => { ready = r; });
  const settle = (u) => { current = u; if (!resolved) { resolved = true; ready(view(u)); } };
  A.onAuthStateChanged(auth, (u) => {
    settle(u);
    listeners.forEach((fn) => { try { fn(view(u)); } catch (e) { console.error(e); } });
    document.dispatchEvent(new CustomEvent('learny:account', { detail: { signedIn: !!u } }));
  }, (e) => { console.warn('Learny · sesión', e); settle(null); }); // si falla la lectura de la sesión, se trata como «sin sesión»

  account = Object.freeze({
    available: true, reason: null,
    user: () => view(current),
    whenReady,                                     // se resuelve cuando ya se sabe si hay sesión (evita parpadeos al abrir)
    onChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    async signUp(email, password) { try { return view((await A.createUserWithEmailAndPassword(auth, cleanEmail(email), String(password))).user); } catch (e) { fail(e); } },
    async signIn(email, password) { try { return view((await A.signInWithEmailAndPassword(auth, cleanEmail(email), String(password))).user); } catch (e) { fail(e); } },
    async signOut() { try { await A.signOut(auth); } catch (e) { fail(e); } },
    /* Siempre responde igual exista o no la cuenta (no revela qué correos están registrados). */
    async resetPassword(email) { try { await A.sendPasswordResetEmail(auth, cleanEmail(email)); } catch (e) { if (e && (e.code === 'auth/user-not-found')) return; fail(e); } }
  });
}

window.LearnyCloud = Object.freeze({ ...base, account });
document.dispatchEvent(new Event('learny:account-ready'));
