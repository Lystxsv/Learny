/* Learny · Firebase · Configuración pública del proyecto
   IMPORTANTE: estos valores NO son secretos. Identifican tu proyecto de Firebase y viajan al navegador por diseño.
   La seguridad real está en las reglas de Firestore (firebase/firestore.rules), no en ocultar esta configuración.
   NUNCA pongas aquí claves de Stripe, Wompi, claves privadas ni cuentas de servicio.
   Sustituye los textos «REEMPLAZAR» por los valores de Firebase Console → Configuración del proyecto → Tus apps → Web. */

export const firebaseConfig = Object.freeze({
  apiKey: 'REEMPLAZAR_API_KEY',
  authDomain: 'REEMPLAZAR_PROJECT_ID.firebaseapp.com',
  projectId: 'REEMPLAZAR_PROJECT_ID',
  storageBucket: 'REEMPLAZAR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'REEMPLAZAR_SENDER_ID',
  appId: 'REEMPLAZAR_APP_ID'
});

/* Mientras haya «REEMPLAZAR», Firebase no se inicializa y Learny sigue funcionando como siempre (solo local). */
export const isFirebaseConfigured = Object.values(firebaseConfig).every((v) => typeof v === 'string' && v && !v.includes('REEMPLAZAR'));
