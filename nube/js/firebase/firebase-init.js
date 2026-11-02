/* Learny · Firebase · Inicialización modular (App, Auth y Firestore)
   Se carga con <script type="module">. Los módulos no comparten el ámbito global con el resto de Learny,
   así que se expone una API mínima en window.LearnyCloud (igual que window.Learny).
   Versión del SDK fija: evita cambios inesperados; actualízala a propósito cuando quieras.
   Si la CDN no responde (sin conexión), el import falla y Learny sigue funcionando en local: se captura abajo. */

const SDK = 'https://www.gstatic.com/firebasejs/10.14.1';
const isDemo = /[?&]demo(?:[=&#]|$)/.test(location.search); // la demo nunca toca la nube

let app = null, auth = null, db = null, reason = null;

try {
  const { firebaseConfig, isFirebaseConfigured } = await import('./firebase-config.js');
  if (isDemo) reason = 'demo';
  else if (!isFirebaseConfigured) reason = 'sin-configurar';
  else {
    const [{ initializeApp }, { getAuth }, { getFirestore }] = await Promise.all([
      import(`${SDK}/firebase-app.js`), import(`${SDK}/firebase-auth.js`), import(`${SDK}/firebase-firestore.js`)
    ]);
    app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app);
  }
} catch (e) {
  reason = 'fallo-inicializacion'; // sin conexión o SDK bloqueado
  console.warn('Learny · Firebase no está disponible; la app sigue en modo local.', e);
}

/* API pública para el resto de Learny (scripts clásicos). Los siguientes bloques añaden aquí login, perfil e isUserPro(). */
window.LearnyCloud = Object.freeze({ ready: !!(app && auth && db), reason, app, auth, db });
document.dispatchEvent(new Event('learny:cloud-ready'));
