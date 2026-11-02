# ESTADO · Learny

Versión `learny-v111` · etiqueta Git `v1.0` · 1 de noviembre de 2026. Este archivo es el único punto de entrada para retomar el proyecto: lo vigente (qué hace, qué falta, qué se decidió) está aquí. El historial de cada bloque, de la v33 a la v109, es un archivo congelado en `docs/historial/CONTINUIDAD.md`; no hace falta leerlo para retomar y ya no se actualiza, salvo una nota de cierre de la v110 a la v111 (lo vigente se anota en este archivo).

## 1. Qué hace Learny hoy

- App web de estudio (PWA, HTML/CSS/JS sin compilación) que guarda todo en el navegador, funciona sin conexión y está solo en español (el inglés se retiró y está en `idioma-ingles/`).
- Para estudiar: Pomodoro, tarjetas con repaso espaciado SM-2 (con «¿qué tan seguro estás?» opcional antes de revelar), método Feynman, planificador inverso para exámenes, estadísticas, metas para quien estudia por su cuenta y un tutor socrático con IA opcional.
- Es gratis y sin cuentas ni pagos (la nube está congelada); incluye a Lumi, una mascota opcional que viene desactivada.

## 2. Qué está terminado y qué no

**Terminado**
- Plan de correcciones C2 a C8: aviso de espacio y copia previa (C2), intervalos de «Dudé» y «Fácil» (C3), informe semanal (C4), Feynman con texto mínimo (C5), `id` y hora en cada repaso (C6) y contraste del placeholder en los seis temas (C8).
- Red de seguridad de errores (`js/00-errores.js`): registra los errores no capturados, avisa una vez y muestra un banner si falta una parte de la app. Pruebas en Node (14, pasan) y en navegador (`tests/errores.spec.js`, sin ejecutar).
- Nube aislada en `nube/` (1-11-2026): cuentas, clase en la nube, módulos de Firebase, reglas de Firestore y sus 25 pruebas salieron de `js/` y `tests/`. `index.html` y `sw.js` ya no las nombran, la app solo las menciona de forma defensiva en `js/20-pro.js`, y `node tests/run-node-nube.js` lo vigila (16 comprobaciones, 8 de ellas controles que deben fallar; pasan). Se parte de que, congelada, la nube no hacía nada visible; **comprobado el 1-11-2026 en Chromium** (a mano, no con la suite): la app arranca sin errores de consola sin la nube, por `file://` y por HTTP; falta el mismo control con la suite Playwright y en móvil. Para reactivarla: `nube/README.md`.
- Política de seguridad de contenido (CSP) en `index.html` (`<meta>`): scripts solo del propio sitio, sin `eval` ni código en línea. Se quitó el único `onclick` en línea (Guía local). Vigilante en Node: `node tests/run-node-csp.js` (16 comprobaciones, pasan; 12 son controles que deben fallar con ejemplos malos). Prueba en navegador: `tests/csp.spec.js` (sin ejecutar).
- Pruebas: 216 pasan (Playwright, Chromium) según el último informe, antes de este movimiento: 25 de ellas (`cuenta-perfil` y `clase-nube`) ya no están en `tests/` y se han añadido `errores`, `service-worker` y `csp`, así que el total actual está por recontar con `npx playwright test`. Bajan de 258 porque las del inglés salieron de `tests/` (están en `idioma-ingles/tests/`).
- Decisiones del dossier aplicadas: español por defecto, metas en todos los perfiles, Pro cancelado, nube congelada.

**Sin terminar o sin probar**
- Inglés: la revisión (bloques 0 a 2 hechos, 3 a 7 sin hacer) quedó congelada en `idioma-ingles/docs/`.
- Nada se ha probado en móvil real, con lector de pantalla, ni la actualización del service worker sobre una instalación anterior (el guion para hacerlo está en `docs/prueba-manual.md`).
- Las reglas de Firestore (`nube/firebase/firestore.rules`) **siguen sin ejecutarse contra el emulador**: las pruebas están escritas (`nube/tests/reglas-emulador.js`, 13 pruebas; se corren con `cd nube && npm run test:reglas`, pasos en `nube/README.md`) pero no se pudo ejecutar el emulador donde se escribieron. C9, C10 y M27 no aplican mientras la nube siga congelada.
- Metas: faltan Pomodoro y Feynman ligados a una etapa, biblioteca de recursos, bitácora, dudas, «Hoy» basado en metas y submetas en la interfaz.
- Gamificación: solo hay análisis (`docs/`), nada implementado.
- La predicción antes de revelar es una hipótesis: falta la prueba con 5 a 8 personas.
- Antes de lanzar al público: confirmar por escrito la autorización de los personajes de terceros de Lumi.
- **Service worker con conexión lenta (resuelto en v110, 1-11-2026):** si `index.html` sale de la caché (tarda más de 4 s, la red cae o el servidor da 404/5xx), los archivos sueltos de esa página (scripts, estilos) también salen de la caché, así no se mezcla un HTML viejo con scripts nuevos; con red buena la siguiente visita se actualiza. Límite: si el service worker se reinicia a mitad de la carga se pierde el apunte y todo queda como antes. **v111 (1-11-2026):** si la red tarda más del plazo y se sirve la caché, la respuesta tardía ya no se descarta: se guarda cuando llega, así la siguiente visita recibe la versión nueva aunque la conexión sea siempre lenta (comprobado con un servidor que retrasa `index.html` 6 s: con el `sw.js` anterior la caché seguía en la versión vieja; ahora se actualiza). Comprobado en Chromium con una prueba fuera de la suite (con el `sw.js` anterior se reproducía la mezcla; con el nuevo, no); la prueba permanente está en `tests/service-worker.spec.js` («red lenta…») y aún no se ha ejecutado con Playwright.
- **CSP, comprobada solo a mano en navegador (1-11-2026: sin violaciones en la consola al arrancar ni sin conexión); la suite aún no corre con ella:** es la primera vez que toda la suite corre con la política activa. Si una prueba antes verde falla ahora, sospecha de la CSP (mira la consola: «Refused to…»). Cuatro archivos (`errores`, `quiz`, `bloques-1-2`, `contraste-bienvenida`) usan `bypassCSP` porque ejecutan `eval`/`new Function` dentro de la página; `csp.spec.js` es el que demuestra que la política se aplica de verdad. Decisiones: `style-src` admite `'unsafe-inline'` (la app crea estilos en línea; el riesgo está en los scripts, que sí quedan cerrados) y `connect-src` admite `https:` porque la URL del proxy de IA la escribe cada persona. Un `<meta>` no admite `frame-ancestors`, así que la protección contra incrustación (clickjacking) no existe en GitHub Pages.
- La prueba de instalación, uso sin conexión y actualización del service worker está escrita (`tests/service-worker.spec.js`) pero aún no se ha ejecutado. Comprobado a mano el 1-11-2026 en Chromium (por HTTP): el service worker se instala con 45 entradas en caché, controla la página y la app abre sin conexión y sin errores; sigue pendiente ejecutar esta prueba con Playwright.
- Dos pruebas eran intermitentes y ya tienen corrección, pendiente de confirmar: `contraste-bienvenida:91` (agotaba los 30 s con la máquina cargada; ahora `test.slow()`) con `npx playwright test tests/contraste-bienvenida.spec.js --repeat-each=20`, y `cuenta-perfil` (carrera con los módulos de Firebase, que pisaban la cuenta simulada), que ahora vive en `nube/tests/` y solo se confirma al reactivar la nube.

## 3. Cómo correr las pruebas

```
npm install && npx playwright install chromium
npm test
```

## 4. Qué decidiste y por qué

- **Pro cancelado, funciones gratis:** Learny aún no tiene usuarios y el proyecto se centra en estudiar y en ser defendible como portafolio, así que pagos, Pro y modo profesor salen del camino crítico (el código del modo profesor sigue y sus pruebas pasan).
- **Cuentas y nube congeladas y aparte (`CLOUD_ENABLED = false` en `nube/js/firebase/firebase-config.js`):** sin pagos ni cuentas, todo queda local. Su código no se carga ni se precachea: así un fallo de Firebase o de la CDN no puede afectar a la app. Reactivarla ya no es solo poner `true`: sigue `nube/README.md`.
- **Reactivar la nube exige ampliar la CSP** (la política actual no permite Firebase): la lista de cambios, sin probar, está en `nube/README.md`.
- **Español como único idioma (1-11-2026):** se quitó el inglés elegible (botón EN/ES, selector de Ajustes, pregunta de bienvenida). `settings.lang` queda siempre en `'es'`, y quien tenía inglés guardado pasa a español. Todo lo del inglés está en `idioma-ingles/`, que es autónomo.
- **Metas visibles desde cualquier perfil:** antes solo se veían en el perfil autodidacta, y la decisión es que cualquiera pueda usarlas.
- **Público: primero quien prepara exámenes, después el autodidacta, y el profesor en segundo plano:** es la forma de contar el proyecto como portafolio.
- **Sin compilación, scripts clásicos en `js/`:** la app abre con doble clic, y dividir el antiguo `script.js` hace más fácil corregir una cosa sin leer todo.
- **Esquema de datos en 4:** los campos nuevos de los repasos (`id`, `at`, `pred`) son opcionales, así que no hace falta migrar y una versión anterior los ignora sin perder nada.
- **«Fácil» se separa de «Dudé» desde el primer repaso (C3):** antes daban casi lo mismo; las tarjetas ya programadas conservan su fecha.
- **Predicción antes de revelar, opcional y con tres niveles (se puede desactivar):** es una hipótesis sin evidencia todavía, y por eso no se impone.
- **Lumi viene desactivada y cada novedad decorativa exige antes una mejora del núcleo de estudio:** la mascota es opcional y el núcleo va primero (regla de proporción: cada novedad ornamental —Lumi, temas, animaciones— exige antes una mejora del núcleo de estudio: repaso, tarjetas, copias o pruebas).

## 5. Revisión de código (1-11-2026)

Se revisaron los ~550 KB de JavaScript de `js/` y `extras.js`; `nube/` e `idioma-ingles/` no, porque no se cargan. Resultado: **sin errores graves ni críticos**.

**Hallazgos, de mayor a menor**
1. **Media-baja, arreglado en v111:** si la red tardaba más de 4 s, `sw.js` servía la caché y descartaba la respuesta tardía, así que con una conexión siempre lenta la app nunca se actualizaba. Ahora la respuesta se guarda al llegar.
2. **Baja:** el almacenamiento (`localStorage`) tiene un techo de unos 5 MB. Con 3000 tarjetas de tamaño máximo se usan 4,8 MB y no queda sitio para las copias automáticas. La app lo maneja (borra las copias más viejas antes de perder datos y avisa); con tarjetas más cortas cabe más, pero el techo es fijo.
3. **Baja:** la racha se corta en 400 días (`calcStreakRaw`, `js/05-temporizador.js`).
4. **Baja, sin verificar:** si el navegador no da `resultingClientId`, `sw.js` sirve desde la caché cualquier archivo suelto de cualquier pestaña durante 20 s (`staleUntil`).

**Descartado con pruebas:** errores de sintaxis; llamadas a funciones inexistentes tras sacar el inglés y la nube; XSS (todo texto del usuario, de la IA o de archivos importados se escapa antes de llegar a `innerHTML`); fechas con desfase de zona horaria (probado en hora de Barranquilla); arranque con 9 conjuntos de datos corruptos (nulos, tipos erróneos, fechas inválidas, contaminación de prototipo, versión futura, 3000 tarjetas), sin ningún error de ejecución; listeners acumulados e intervalos sin limpiar; clave de IA (va en la cabecera y se excluye de exportaciones y copias); fórmula SM-2.

**Cómo se hizo:** análisis automático de todos los archivos, lectura de las funciones más delicadas (service worker, SM-2, guardado con cuota llena, racha, importación, manejo de la clave) y pruebas en Chromium.

**Sin revisar a fondo:** los archivos de Lumi (`js/16-lumi-*.js`, unos 110 KB, casi todo arte SVG), `js/17-movimiento.js`, `js/21-quiz.js`, `js/22-metas.js`, `js/12b-profesor.js` y `js/14b-autodidacta.js`. La suite Playwright no se ejecutó (faltaba `@playwright/test`) y no hubo móvil real.
