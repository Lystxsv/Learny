const CACHE = 'learny-v19';
// Imprescindibles: si falta uno, la instalación falla. Los iconos son opcionales y no bloquean el modo sin conexión.
const CORE = ['./', './index.html', './style.css', './script.js', './extras.js', './manifest.json'];
const OPTIONAL = ['./icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
const NETWORK_TIMEOUT = 4000;
const ASSET_TIMEOUT = 10000;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then(async (cache) => { await cache.addAll(CORE.map((u) => new Request(u, { cache: 'reload' }))); await Promise.allSettled(OPTIONAL.map((u) => cache.add(new Request(u, { cache: 'reload' })))); }).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
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
      caches.open(CACHE).then((cache) => cache.put(request, copy));
    }
    return res;
  });

  event.respondWith(
    fromNetwork.catch(async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;
      if (request.mode === 'navigate') return (await caches.match('./index.html')) || Response.error();
      return Response.error();
    })
  );
});

// Al pulsar un aviso: enfoca Learny si ya está abierta; si no, la abre.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const mine = list.find((c) => c.url.startsWith(self.registration.scope));
    return mine ? mine.focus() : self.clients.openWindow('./index.html');
  }));
});
