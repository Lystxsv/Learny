const CACHE = 'learny-v80';
// Imprescindibles: si falta uno, la instalación falla. Los iconos son opcionales y no bloquean el modo sin conexión.
const CORE = [
  './', './index.html', './style.css', './motion.css', './extras.js', './manifest.json', './material-symbols.woff2',
  // Partes de la app (antes script.js); mantén esta lista igual que los <script> de index.html.
  './js/01-base.js',
  './js/01b-perfil-textos.js',
  './js/02-datos.js',
  './js/03-interfaz.js',
  './js/04-planificador.js',
  './js/05-temporizador.js',
  './js/06-hoy.js',
  './js/07-tarjetas.js',
  './js/08-analisis.js',
  './js/09-tutor-ia.js',
  './js/10-revision-ia-y-temas.js',
  './js/11-apariencia.js',
  './js/12-copias-e-importacion.js',
  './js/13-ajustes.js',
  './js/14-eventos.js',
  './js/15-inicio.js',
  './js/16-lumi-eevee.js',
  './js/16-lumi-walle.js',
  './js/16-lumi-daniel.js',
  './js/16-lumi-yor.js',
  './js/16-lumi-gato.js',
  './js/16-lumi-cc.js',
  './js/16-lumi-alisa.js',
  './js/16-lumi.js',
  './js/17-movimiento.js',
  './js/18-idioma.js',
  './js/19-copia-archivo.js'
];
const OPTIONAL = ['./icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
const NETWORK_TIMEOUT = 4000;
const ASSET_TIMEOUT = 10000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(async (cache) => { await cache.addAll(CORE.map((u) => new Request(u, { cache: 'reload' }))); await Promise.allSettled(OPTIONAL.map((u) => cache.add(new Request(u, { cache: 'reload' })))); }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('learny-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

// Red primero (siempre la versión más nueva); si falla o tarda, usa la caché.
// Solo se guardan respuestas correctas, y sin red una navegación recibe index.html.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegación: 4 s. Archivos sueltos: 10 s (la red ya respondió al index; así no se mezcla un index nuevo con un script viejo).
  // cache: 'no-cache' revalida contra el servidor y se salta la caché HTTP de GitHub Pages (~10 min).
  const fromNetwork = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), request.mode === 'navigate' ? NETWORK_TIMEOUT : ASSET_TIMEOUT);
    fetch(request, { cache: 'no-cache' }).then((res) => { clearTimeout(timer); resolve(res); }, (err) => { clearTimeout(timer); reject(err); });
  }).then((res) => {
    if (res && res.ok && res.type === 'basic') {
      const copy = res.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => { /* sin espacio: la respuesta se sirve igual */ })); // JS-015: sin waitUntil el navegador podía parar el service worker antes de que terminara de guardar
    }
    return res;
  });

  const offline = async () => {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    if (request.mode === 'navigate') return (await caches.match('./index.html')) || Response.error();
    return Response.error();
  };
  /* JS-015: un 404 o 5xx del servidor (despliegue a medias, caída de GitHub Pages) también cae a la caché; si no hay copia, se devuelve esa respuesta tal cual.
     Otros 4xx (401, 403…) se devuelven sin más. Solo se guardan respuestas correctas (arriba). */
  event.respondWith(fromNetwork.then(async (res) => (res.status === 404 || res.status >= 500 ? ((await caches.match(request, { ignoreSearch: true })) || res) : res), offline));
});

// Al pulsar un aviso: enfoca Learny si ya está abierta; si no, la abre.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const mine = list.find((c) => c.url.startsWith(self.registration.scope));
    return mine ? mine.focus() : self.clients.openWindow('./index.html');
  }));
});
