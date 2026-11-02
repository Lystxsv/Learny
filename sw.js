const CACHE = 'learny-v113';
// Imprescindibles: si falta uno, la instalación falla. Los iconos son opcionales y no bloquean el modo sin conexión.
const CORE = [
  './', './index.html', './style.css', './motion.css', './extras.js', './manifest.json', './material-symbols.woff2',
  // Partes de la app (antes script.js); mantén esta lista igual que los <script> de index.html.
  './js/00-errores.js',
  './js/01c-metas-datos.js',
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
  './js/12b-profesor.js',
  './js/13-ajustes.js',
  './js/14-eventos.js',
  './js/14b-autodidacta.js',
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
  './js/19-copia-archivo.js',
  './js/20-pro.js',
  './js/21-quiz.js',
  './js/22-metas.js'
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
//
// Coherencia (v110): si un index.html sale de la caché (red lenta, caída o servidor roto), esa página es de una versión anterior;
// mezclarla con scripts nuevos de la red podía romperla. Por eso apuntamos qué página (clientId) recibió su index de la caché
// y sus archivos sueltos (scripts, estilos) salen también de la caché: una versión vieja pero completa. En la siguiente visita
// con red buena todo se actualiza. Si el service worker se reinicia a mitad de carga se pierde el apunte y todo funciona como antes.
const staleClients = new Set();      // clientId de las páginas servidas desde la caché
let staleUntil = 0;                  // respaldo si el navegador no da resultingClientId: ventana corta para cualquier archivo suelto
const STALE_WINDOW = 20000;
const markStale = (event) => {
  if (event.resultingClientId) { if (staleClients.size > 50) staleClients.clear(); staleClients.add(event.resultingClientId); }
  else staleUntil = Date.now() + STALE_WINDOW;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isNavigation = request.mode === 'navigate';

  // Archivo suelto de una página que vino de la caché: primero la caché, para no mezclar versiones. Si no está en la caché, sigue la ruta normal.
  const pageIsStale = !isNavigation && ((event.clientId && staleClients.has(event.clientId)) || Date.now() < staleUntil);
  if (pageIsStale) {
    event.respondWith(caches.match(request, { ignoreSearch: true }).then((cached) => cached || fetchNormally(event, request, false)));
    return;
  }
  event.respondWith(fetchNormally(event, request, isNavigation));
});

function fetchNormally(event, request, isNavigation) {
  // Navegación: 4 s. Archivos sueltos: 10 s (la red ya respondió al index; así no se mezcla un index nuevo con un script viejo).
  // cache: 'no-cache' revalida contra el servidor y se salta la caché HTTP de GitHub Pages (~10 min).
  // v111: la petición a la red es una sola y sigue viva aunque el plazo venza. Si tarda más que el plazo se sirve la caché (como antes),
  // pero la respuesta tardía se guarda igual en cuanto llega: así, con una conexión siempre lenta, la siguiente visita sí recibe la versión nueva.
  // waitUntil mantiene vivo el service worker hasta que la petición termine; el guardado se registra dentro de ese plazo.
  const net = fetch(request, { cache: 'no-cache' }).then((res) => {
    if (res && res.ok && res.type === 'basic') {
      const copy = res.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => { /* sin espacio: la respuesta se sirve igual */ })); // JS-015: sin waitUntil el navegador podía parar el service worker antes de que terminara de guardar
    }
    return res;
  });
  event.waitUntil(net.then(() => {}, () => {}));
  const fromNetwork = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), isNavigation ? NETWORK_TIMEOUT : ASSET_TIMEOUT);
    net.then((res) => { clearTimeout(timer); resolve(res); }, (err) => { clearTimeout(timer); reject(err); });
  });

  const offline = async () => {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) { if (isNavigation) markStale(event); return cached; }
    if (isNavigation) { const index = await caches.match('./index.html'); if (index) { markStale(event); return index; } }
    return Response.error();
  };
  /* JS-015: un 404 o 5xx del servidor (despliegue a medias, caída de GitHub Pages) también cae a la caché; si no hay copia, se devuelve esa respuesta tal cual.
     Otros 4xx (401, 403…) se devuelven sin más. Solo se guardan respuestas correctas (arriba). */
  return fromNetwork.then(async (res) => {
    if (res.status === 404 || res.status >= 500) {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) { if (isNavigation) markStale(event); return cached; }
    }
    return res;
  }, offline);
}

// Al pulsar un aviso: enfoca Learny si ya está abierta; si no, la abre.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    const mine = list.find((c) => c.url.startsWith(self.registration.scope));
    return mine ? mine.focus() : self.clients.openWindow('./index.html');
  }));
});
