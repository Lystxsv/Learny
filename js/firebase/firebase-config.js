/* Learny · Firebase · Configuración pública del proyecto
   IMPORTANTE: estos valores NO son secretos. Identifican tu proyecto de Firebase y viajan al navegador por diseño.
   La seguridad real está en las reglas de Firestore (firebase/firestore.rules), no en ocultar esta configuración.
   NUNCA pongas aquí claves de Stripe, Wompi, claves privadas ni cuentas de servicio.
   Sustituye los textos «REEMPLAZAR» por los valores de Firebase Console → Configuración del proyecto → Tus apps → Web. */

export const firebaseConfig = Object.freeze({
  apiKey: 'AIzaSyBSEYYw83y2xuEPdseWd-tOFIJ3gSirQns',
  authDomain: 'learny-c6666.firebaseapp.com',
  projectId: 'learny-c6666',
  storageBucket: 'learny-c6666.firebasestorage.app',
  messagingSenderId: '1097284137627',
  appId: '1:1097284137627:web:bf5c6e0b2cbb0d7b98cc3e',
  measurementId: 'G-4T0GT4WBJY'
});

/* Mientras haya «REEMPLAZAR», Firebase no se inicializa y Learny sigue funcionando como siempre (solo local). */
export const isFirebaseConfigured = Object.values(firebaseConfig).every((v) => typeof v === 'string' && v && !v.includes('REEMPLAZAR'));
