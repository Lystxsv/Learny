# Learny

App web de estudio: Pomodoro con descanso, flashcards con repaso espaciado (SM-2), método Feynman,
ruleta de temas, planificador inverso, estadísticas, un tutor socrático opcional con IA, metas para quien estudia por su cuenta y **Lumi**,
un compañero de estudio opcional con ocho apariencias (abeja pixelada, Eevee, WALL·E, Daniel Carreon, Yor Forger, Cat Black, Miku Nakano y Alisa Kujou).
La interfaz está solo en español (el inglés se retiró el 1-11-2026 y se guarda aparte en `idioma-ingles/`). Todo se guarda en el navegador de cada persona;
las cuentas con Firebase están **congeladas**: su código vive aparte, en `nube/` (ver `nube/README.md`), y la app ni lo carga ni lo precachea.

> **Aviso:** Proyecto personal, gratuito y sin fines comerciales, no afiliado a los titulares de los personajes de Lumi; esos personajes pertenecen a sus dueños. El mismo texto se muestra en la app (pantalla de inicio, menú lateral y Ajustes → Disposición → Apariencia de Lumi). Para retirar un personaje: borra su archivo de arte, su `<script>`, su línea en `CORE` de `sw.js` y su entrada en `MASCOT_AVATARS`.

Versión actual del service worker: `learny-v113` · esquema de datos: `version: 4`.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html`, `style.css`, `motion.css`, `extras.js` y la carpeta `js/` (33 archivos) | La app completa (no necesita instalación ni compilación). `js/` reemplaza al antiguo `script.js`; ver «Estructura del código». |
| `package.json`, `playwright.config.js`, `tests/` | Pruebas automáticas (solo para quien desarrolla; la app no las necesita). Ver «Pruebas». |
| `sw.js`, `manifest.json` | Modo sin conexión e instalación como app (PWA). |
| `icon.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | Iconos de la app (ya subidos al repositorio). Son opcionales para `sw.js`, pero `manifest.json` los referencia. |
| `proxy-worker.example.js` | Ejemplo de proxy (Cloudflare Worker) para usar IA sin exponer tu clave. Es el único archivo de proxy: la copia `proxy-worker_example.js` era idéntica y se eliminó. |
| `ESTADO.md` | Punto de entrada para retomar: qué hace Learny, qué está terminado y qué no, cómo correr las pruebas y qué se decidió. Empieza por aquí. |
| `docs/historial/CONTINUIDAD.md` | Archivo histórico congelado en la v109 (con una nota de cierre sobre la v110 y la v111 al final): cuaderno de trabajo de Lumi, del movimiento, de la auditoría, de los perfiles, de Pro, de las metas y de Firebase (qué se hizo en cada bloque, decisiones, pruebas y pendientes). Consúltalo antes de tocar `js/16-lumi*.js` o `js/22-metas.js`; no se actualiza más allá de esa nota. |
| `nube/` | Cuentas con Firebase y clase en la nube, **congeladas** (movidas fuera de `js/` el 1-11-2026): `nube/js/` (cuenta, clase en la nube y módulos de Firebase), `nube/firebase/` y `nube/firebase.json` (reglas de Firestore, sin probar con el emulador), `nube/tests/` (25 pruebas que ya no corren con la suite) y `nube/restaurar-nube.patch`. `index.html` y `sw.js` no la nombran. Para reactivarla, sigue `nube/README.md`. |

## Estructura del código
El antiguo `script.js` está dividido en archivos dentro de `js/`, en el mismo orden en que se cargan. Son scripts clásicos (no módulos), así que `index.html` sigue funcionando con doble clic. Las partes 01–15 son la app; las 16 son Lumi (arte + controlador), la 17 es el movimiento, la 18 (el idioma) ya no está en la app: vive en `idioma-ingles/`, la 19 la copia automática a archivo, la 20 es exportar/imprimir (con lo que queda del plan Pro, cancelado), la 21 el quiz y el simulacro y la 22 las metas del modo autodidacta; la 23 (cuenta) y los módulos de Firebase están congelados en `nube/`.

| Archivo | Contenido |
|---|---|
| `js/00-errores.js` | Red de seguridad: registra los errores que nadie capturó (últimos 20, sin claves, nada en disco en la demo), avisa una vez con un mensaje claro y, si falta `toast`, muestra un banner. Se carga primero. Consulta: `LearnyErrors.text()` en la consola. |
| `js/01c-metas-datos.js` | Metas del modo autodidacta (capa de datos, v85): contenedor `state.learning` (con su propia versión `learning.v`), topes, `sanitizeLearning()` y cifras. La interfaz está en `js/22-metas.js`. Va ANTES de `01-base.js`. |
| `js/01-base.js` | Base: modo demo, constantes (incluida `MASCOT_AVATARS`), utilidades y el objeto `state`. |
| `js/01b-perfil-textos.js` | Textos según el perfil (`exam` / `self` / `teach`): tabla única `PROFILE_TEXT` y `ptxt()`. Va justo después de `01-base.js`. |
| `js/02-datos.js` | Datos: tarjetas, migraciones, validación (`sanitizeSettings`), copias automáticas, datos de la demo y carga inicial. |
| `material-symbols.woff2` | Fuente de iconos (Material Symbols, subconjunto de 26 iconos) guardada en el repo: funciona sin conexión y no descarga nada. |
| `js/03-interfaz.js` | Interfaz base: confirmación, guardado, avisos (toast, que se coloca dentro del diálogo abierto) y deshacer, páginas, ventana modal, sonido. |
| `js/04-planificador.js` | Planificador: plan inverso, tareas diarias y reajuste si te atrasas. |
| `js/05-temporizador.js` | Temporizador: Pomodoro, sincronización entre pestañas, racha y pantalla «Hoy». Emite `learny:timer`. |
| `js/06-hoy.js` | Hoy: recomendación con motivo, saludo (`daysSinceActivity()`), cierre de sesión, «me cuesta arrancar» y cola del día. |
| `js/07-tarjetas.js` | Tarjetas: repaso espaciado (SM-2; `nextSchedule()` calcula sin modificar y `schedule()` aplica), intervalo en los botones de calificar, simulacro, formulario y biblioteca. |
| `js/08-analisis.js` | Análisis: estadísticas por materia, previsión de repasos de 7 días e informe. |
| `js/09-tutor-ia.js` | Tutor e IA: guía local, prompts, Gemini (clave o proxy) y chats. |
| `js/10-revision-ia-y-temas.js` | Revisión de IA y temas: bandeja de revisión, Feynman, temas y ruleta. |
| `js/11-apariencia.js` | Apariencia: temas (incluido Cromo), acentos con contraste y preferencias; avisa a Lumi con `sync`. |
| `js/12-copias-e-importacion.js` | Copias e importación: exportar, validar e importar copias, mazos y CSV/Anki. |
| `js/12b-profesor.js` | Profesor y alumnos sin servidor (Etapa 6a): compartir mazo con nombre/autor/versión, mazos recibidos, informe del alumno y panel de resultados de la clase. Va después de `12` y antes de `13`. |
| `nube/js/24-clase-nube.js` y `nube/js/firebase/firebase-teaching.js` | Clase en la nube (congelada, no se carga): con sesión, los informes de alumnos y los mazos recibidos se guardan también en tu cuenta (`users/{uid}/reports` y `users/{uid}/received`). Sin sesión no hacen nada. |
| `js/13-ajustes.js` | Ajustes: estilos rápidos, ambientes, ventana de Ajustes (casilla de Lumi y selector de apariencia), recordatorios y contexto del tutor. |
| `js/14-eventos.js` | Eventos: `renderAll`, manejadores, service worker y la API `window.Learny` (48 claves). |
| `js/14b-autodidacta.js` | Modo autodidacta (v84): con `settings.profile === 'self'`, ritmo semanal en lugar de fecha de examen (Hoy, Planificar y Reforzar). Con otros perfiles no cambia nada. Va entre 14 y 15. |
| `js/15-inicio.js` | Inicio: bienvenida (con opciones de accesibilidad), portada, banner de la demo y arranque. |
| `js/16-lumi-eevee.js`, `16-lumi-walle.js`, `16-lumi-daniel.js`, `16-lumi-yor.js`, `16-lumi-gato.js`, `16-lumi-cc.js`, `16-lumi-alisa.js` | Solo el arte (SVG en pixel art) de cada apariencia de Lumi. Se cargan **antes** de `16-lumi.js`. |
| `js/16-lumi.js` | Lumi: la abeja pixelada (`lumiBeeSvg()`), el controlador `LumiCompanion`, estados, mensajes y reglas de frecuencia. |
| `motion.css` y `js/17-movimiento.js` | Movimiento de la interfaz (no de Lumi): tokens de duración, botones, modales, avisos; flashcards, listas (escalonado y borrado continuo), fundido cruzado entre páginas, velo al calificar y barras con la Web Animations API. Con movimiento reducido solo quedan fundidos de opacidad de 80–100 ms (sin desplazamientos ni escalas). |
| `idioma-ingles/` | Todo lo del inglés como idioma elegible, **fuera de la app** (no se carga ni se precachea): `js/18-idioma.js`, el CSS del botón EN/ES, sus pruebas y los documentos de revisión. Cómo volver a activarlo: `idioma-ingles/README.md`. |
| `js/19-copia-archivo.js` | Copia automática a un archivo (Chrome/Edge de escritorio). |
| `js/20-pro.js` | Exportar e imprimir (Anki, CSV, papel) y lo que queda del plan Pro, cancelado el 30-10-2026: `isPro()` devuelve siempre `true` y `requirePro()` no bloquea nada. Siguen en el código, sin función real, `PRO_FEATURES`, `isUserPro()` y el texto de la página `#pro` (en `index.html`): el botón está oculto y, desde la v112, escribir `#pro` en la URL ya no abre esa página. Limpieza completa pendiente y opcional. |
| `js/21-quiz.js` | Quiz y simulacro desde tus tarjetas, sin IA. Va DESPUÉS de `20-pro.js`. |
| `js/22-metas.js` | Metas del modo autodidacta (interfaz): tarjeta «Mis metas» en Planificar (solo con el perfil «por mi cuenta»), etapas, autoevaluación, evidencias y, desde la v90, tarjetas ligadas a una etapa. Usa `state.learning` de `01c-metas-datos.js`. Expone `window.LearnyGoals`. Va después de `21-quiz.js` y antes de `extras.js`. |
| `nube/js/23-cuenta.js` | Cuenta (congelada, no se carga; v93+): botón `#account-button`, ventanas de inicio de sesión y «Tu cuenta» (plan y nombre), páginas privadas con `LearnyAccount.protectPage` y la sección `#pro` (Learny Pro). Expone `window.LearnyAccount`. |
| `nube/js/firebase/firebase-config.js`, `firebase-init.js`, `firebase-auth.js`, `firebase-profile.js` | Módulos de Firebase (congelados, no se cargan; SDK 10.14.1 desde la CDN de Google). Al reactivarla, `index.html` carga `firebase-teaching.js` (`type="module"`), que importa a los otros. Exponen `window.LearnyCloud` (con `?demo` y sin configuración quedan inertes). `firebase-profile.js` lee/crea `users/{uid}` y permite editar `displayName`; el navegador nunca puede activar Pro. |

Reglas para tocarlos:
- **El orden de los `<script>` en `index.html` importa.** Lo que se ejecuta al cargar solo puede usar nombres definidos en archivos anteriores; lo demás (manejadores, funciones) se resuelve cuando se usa.
- **Comparten el ámbito global** (no hay `import`/`export`): un nombre de nivel superior (`const`, `let` o `function`) no se puede repetir entre archivos, y las variables compartidas (`exam`, `currentPage`, `rev`…) son las mismas en todos.
- `extras.js` no ve esos nombres: solo usa la API `window.Learny` (48 claves), que se crea en `js/14-eventos.js`.
- Si añades, quitas o renombras un archivo de `js/`, cámbialo también en la lista `CORE` de `sw.js` y sube `CACHE`. `CORE` debe incluir todo lo que carga `index.html` y todo lo de `CORE` debe existir; `tests/service-worker.spec.js` lo comprueba sin navegador.
- `sw.js` trata `extras.js` y `manifest.json` como **imprescindibles**: si falta uno en el servidor, `cache.addAll` falla y el service worker no se instala. Sube siempre todos los archivos.
- Si ya tenías `script.js` publicado, bórralo del repositorio: ya no se usa. Lo mismo con cualquier copia con sufijo «(2)» de un archivo de `js/`: ninguna se referencia.

## Lumi (compañero de estudio)
Lumi es un compañero **opcional** (desactivado por defecto desde la v73; quien ya la tenía activada la conserva) que acompaña en momentos concretos. No guarda datos propios: solo lee `state`/`timer` y respeta `settings.mascot` y `settings.mascotAvatar`. Se activa o desactiva con la casilla «Compañero de estudio: Lumi» en Ajustes → *Disposición*, o con el «×» junto al personaje (con «Deshacer»).

- **Apariencias** (`settings.mascotAvatar`): `bee` (predeterminada, «Abeja pixelada»), `eevee`, `walle`, `daniel`, `yor` y `gato` («Cat Black»), `cc` («Miku Nakano») y `alisa` («Alisa Kujou»). Se eligen en Ajustes → Disposición → «Apariencia de Lumi» con vista previa; cambiar de apariencia solo cambia el dibujo, no el comportamiento. Un valor desconocido, o un archivo de arte ausente, cae a la abeja. Cada apariencia tiene su caja y sus poses propias en `style.css`.
- **Dibujo:** SVG en pixel art (`crispEdges`, sin curvas, sin degradados, sin `id`) insertado por JS en `#lumi`. Los personajes de terceros se usan con la autorización que declara el responsable del proyecto; para retirar uno basta borrar su archivo de arte, su `<script>`, su línea en `CORE` de `sw.js` y su entrada en `MASCOT_AVATARS`.
- **Dock global:** `#lumi-dock` es un dock fijo (abajo a la derecha), visible en todas las secciones. Contiene `#lumi`, `#lumi-msg` y `#lumi-live` (región `aria-live` solo para lo que ningún aviso anuncia).
- **Estados y mensajes** (texto real; el dibujo es `aria-hidden`):
  - *Neutral*: «¿Empezamos con algo corto?», una vez por visita.
  - *Enfoque*: con el Pomodoro en marcha, sin mensajes ni animación.
  - *Celebrar*: «Bloque completado.» al cerrar la valoración de un bloque.
  - *Apoyo*: «Esta vuelve pronto. Sin prisa.» tras «No lo sabía».
  - *Progreso*: si en la misma tarjeta pasaste de «No lo sabía» a «Fácil».
  - *Bienvenida*: tras 3 o más días sin actividad (sesiones o repasos, mismo criterio que el saludo).
  - *Dato curioso* (v74): el dato del día lo dice Lumi (la primera visita a Hoy de cada día; 9 s en pantalla) y, con Lumi activa, ya no se muestra en «Más sobre hoy». «Mostrar el dato curioso» en Ajustes también lo apaga. Ahora hay 15 datos.
  - *Mensajes variados* (v74): en las demás visitas a Hoy, uno al azar entre el neutro, un consejo de estudio, los días que faltan para el próximo examen (≤ 7), el progreso de la meta de hoy y la racha (≥ 2), sin repetir el anterior. Celebrar, apoyo y progreso rotan entre 3, 3 y 2 frases.
  - *Mañana* (v73): «Mañana te tocan N repasos.» en Hoy si hay 10 o más programados para mañana (`tomorrowMin` en `LUMI_CONFIG`); ocupa el lugar del mensaje neutro, así que sigue habiendo un solo proactivo por visita.
  - *Vacío*: «Crea tu primera tarjeta para empezar.» al entrar en Práctica sin tarjetas.
- **Reglas de frecuencia** (en `LUMI_CONFIG`): mensaje visible 5 s; un solo mensaje proactivo por visita; 90 s mínimo entre apoyos y entre progresos; prioridad reacción > contexto > genérico; sin cola (una reacción en espera caduca a los 20 s). Las reacciones salen en cualquier sección; los mensajes proactivos dependen de la página. Nada durante un examen, un bloque de enfoque, una ventana abierta, la portada o con la pestaña oculta.
- **Reposo** (solo CSS): movimientos pequeños y espaciados mientras hay actividad; tras 30 s sin ella se detienen (`data-anim="rest"`) y se reanudan al interactuar.
- **Gestos** (solo CSS, un ciclo de ≤ 400 ms, sin esperar a `animationend`): salto, aleteo, saludo y movimientos de las partes de cada personaje. Se anulan con movimiento reducido (del sistema o de Learny), con la pestaña oculta y en enfoque.
- **Accesibilidad:** las reacciones no se anuncian aparte (ya las cubren los avisos existentes); sin `alert` y sin mover el foco. Temas: oscuro, negro, claro, sepia, alto contraste y Cromo.
- **Datos:** `settings.mascot` (activación) y `settings.mascotAvatar` (dibujo), ambos validados en `sanitizeSettings`, también al importar copias.
- **Eventos que usa** (ninguno nuevo para la app): `learny:timer`, `learny:pomodone`, `learny:rated`, `learny:examstart`, `learny:examend`, `learny:page`, `learny:render`.

## Probarla en tu computador
Abre `index.html` con doble clic. (El modo sin conexión/PWA solo funciona servido por `https://` o `localhost`; con doble clic todo lo demás funciona, solo en local.) Con `index.html?demo` ves Learny con datos de ejemplo, todo en memoria.

## Publicarla gratis en GitHub Pages
1. Crea un repositorio público en GitHub y sube **todos los archivos** (incluidos `js/`, `extras.js`, `manifest.json`, los iconos y `icon.svg`).
2. Settings → Pages → "Deploy from a branch" → rama `main`, carpeta `/ (root)` → Save.
3. En 1 o 2 minutos estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. Al publicar una versión nueva, sube también `sw.js` (cambia `CACHE` si modificas archivos; ahora es `learny-v111`).

## Nube (congelada)
Las cuentas y la clase en la nube no forman parte de la app actual. Para reactivarlas, incluida la publicación de las reglas de Firestore, sigue `nube/README.md`. Las reglas siguen sin ejecutarse contra el emulador.

## IA (opcional)
Hay dos formas; sin ninguna, Learny funciona con su guía local.
- **Clave propia:** cada persona pega su clave gratuita de Gemini en Ajustes (https://aistudio.google.com/apikey).
  Queda solo en su navegador y nunca se incluye en copias ni mazos. No la uses en un equipo compartido.
- **Proxy (recomendado en producción):** despliega `proxy-worker.example.js`, define `GEMINI_API_KEY` y
  `ALLOWED_ORIGIN` como secretos/variables y pega la URL del Worker en Ajustes → "URL de tu proxy".
  Con proxy activo no hace falta ninguna clave en el navegador. Opcionales: `MODEL` (por defecto `gemini-3.8-flash`) y un binding `RATE_LIMITER`.
  El Worker limita también el tamaño de peticiones sin `Content-Length`; si lo desplegaste antes de la v53, vuelve a desplegarlo.

Si Google cambia el nombre del modelo, se puede cambiar en Ajustes sin tocar el código. La demo nunca usa IA.

## Funciones principales
- **Hoy:** una acción recomendada con su motivo y como máximo dos alternativas; Pomodoro con intención, notas de distracción y ambientes (Biblioteca, Noche, Minimalista); misiones, meta diaria y racha con día de gracia.
- **Practicar:** repaso SM-2 con tres calificaciones (No lo sabía = 1, Dudé = 3, Fácil = 5; cada botón muestra en cuántos días volverá la tarjeta), modo examen, *Intercalar*, *5 minutos*, *Examen real*, *Crear con IA* con bandeja de revisión, **quiz y simulacro**, tutor socrático o directo, Feynman, ruleta de temas, notas, lectura y dictado.
- **Biblioteca:** tarjetas archivadas, mazos iniciales y propios, importación de CSV/Anki y de mazos JSON con vista previa; **exportar e imprimir**.
- **Planificar:** plan inverso por fases (comprensión → práctica → repaso → simulacro → revisión), reajuste si te atrasas con explicación, comprobación de carga y *Replanificar desde hoy*. Con el perfil «Estudio por mi cuenta»: **ritmo semanal** y **«Mis metas»** (etapas, autoevaluación, evidencias y tarjetas ligadas a cada etapa).
- **Reforzar:** seis indicadores honestos con su muestra y periodo (7 días, 30 días o todo), retención real frente al objetivo, tarjetas que se te resisten, previsión de los repasos ya programados para los próximos 7 días, materias débiles y mini quiz; con el perfil «por mi cuenta», progreso por tema; informe semanal en JSON o CSV.
- **Ajustes:** apariencia, tipografía, disposición, estudio y avisos, IA y datos/copias; casilla y selector de Lumi.
- **Apariencia:** temas Automático, Oscuro, Negro (OLED), Claro, Sepia, Alto contraste y **Cromo**; acento Cielo/Menta/Violeta/Ámbar/Rosa o personalizado con contraste 4,5:1; cinco **estilos rápidos** (Cuaderno, Lectura nocturna, Papel, Biblioteca, Enfoque).
- **Idioma:** solo español. El inglés está desactivado y guardado en `idioma-ingles/`.
- **Cuentas y Pro (cancelados):** no hay cuentas ni plan de pago; todo se guarda en el navegador y todas las funciones son gratis. El código de cuentas y Firebase está congelado en `nube/`.
- **Portada, bienvenida y demo:** quien nunca entró ve una portada con «Probar Learny»; la bienvenida pregunta para qué usas Learny (examen / por mi cuenta / enseño) y tiene un paso opcional «Personalizar» con tamaño de texto, lectura fácil y reducir animaciones.

## Atajos
`Espacio` revela · `1` `2` `3` califican · `P` inicia/pausa el Pomodoro · `Z` deshace · `Esc` cierra ventanas. `P` y `Z` ignoran la repetición de tecla.

## Rendimiento
Los resultados de cálculo se memorizan y solo se dibuja la sección visible; pensado para colecciones de miles de tarjetas (sin medición independiente). El historial de repasos se limita a 5 000 registros.
Los archivos no están minificados (se cachean al primer uso); si quieres, puedes pasarlos por `terser`/`lightningcss`.

## Pruebas
> Las pruebas de la nube (`cuenta-perfil.spec.js` y `clase-nube.spec.js`) están en `nube/tests/` y ya no corren con `npm test`; vuelven con la nube (ver `nube/README.md`).

Solo hace falta para desarrollar (la app sigue sin instalación). Requiere Node.js:
```
npm install
npx playwright install chromium
npx playwright test
```
Las pruebas viven en `tests/` y usan `?demo` (salvo las que necesitan datos reales), así que nunca tocan datos reales. Por tema: `sm2.spec.js` (intervalos de repaso), `copia-archivo.spec.js` (copia automática a archivo con una API simulada), `modelo.spec.js`, `crear-tarjetas.spec.js`, `fase8.spec.js`, `fase9.spec.js`, `perfil.spec.js`, `perfil-textos.spec.js`, `autodidacta.spec.js`, `accesibilidad-bienvenida.spec.js`, `contraste-bienvenida.spec.js`, `lector-pantalla.spec.js`, `quiz.spec.js`, `metas-datos.spec.js`, `metas-ui.spec.js` y `bloques-1-2.spec.js` (avisos de espacio y copia, intervalos SM-2, informe semanal y Feynman con texto real) `bloque-5.spec.js` (predecir antes de revelar y resumen de confianza), `bloque-4.spec.js` (id y hora de cada repaso) y `contraste-placeholder.spec.js` (contraste del texto de ejemplo en los seis temas), `bloque-3.spec.js` (español como único idioma, metas en todos los perfiles, Pro cancelado y nube congelada). Según `CONTINUIDAD.md`, en la v99 pasa la suite completa (167 pruebas); las reglas de Firestore **no** se han probado con el emulador (ver «Estado y pendientes»).
Además, `node tests/run-node.js` prueba el saneado de metas (`js/01c-metas-datos.js`) sin navegador.  Y `node tests/run-node-errores.js` prueba `js/00-errores.js` sin navegador. Y `node tests/run-node-csp.js` vigila la política de seguridad de contenido de `index.html` y que el código no use nada que ella bloquea (`eval`, `new Function`, `onclick="…"`, scripts en línea). Si añades un script nuevo, no lo escribas en línea: ponlo en `js/` y en `index.html` y `sw.js`.

## Estado y pendientes
- Cada bloque de Lumi, de movimiento, de la auditoría, de perfiles, de Pro y de metas, con su lista de pruebas, está en `docs/historial/CONTINUIDAD.md`. La suite completa pasó con 167 pruebas en la v99 y con 216 en el último informe, antes de mover la nube y el inglés fuera de `tests/` (1-11-2026); el total actual está por recontar con `npx playwright test`. El 1-11-2026 se comprobó además a mano en Chromium, sin la suite: arranque sin errores, service worker instalado y uso sin conexión. Las notas «escritas pero no ejecutadas» de versiones anteriores son históricas. Siguen sin probarse: las reglas de Firestore con el emulador o el «Simulador de reglas» de la consola, y todo lo que exige un dispositivo real (ver más abajo).
- **Metas (modo autodidacta):** hechas la capa de datos (v85), la interfaz (v89) y las tarjetas ligadas a una etapa (v90). Pendientes: Pomodoro y Feynman ligados a una etapa, biblioteca de recursos, bitácora, dudas, Hoy basado en metas y submetas en la interfaz (el dato ya las admite).
- **Cuentas y Pro (cancelados y congelados):** el código de cuentas y Firebase está en `nube/` (no se carga ni se precachea; para reactivarlo, `nube/README.md`) y las reglas de Firestore siguen sin probarse con el emulador. Quedan restos de Pro en `js/20-pro.js` y `index.html` (ver la tabla de archivos).
- **Gamificación (nada implementado):** hoy solo hay versiones parciales: racha con «día de gracia» automático (cuenta las sesiones del temporizador, no los repasos ni los quizzes), «Práctica nivel N» por materia, 3 misiones fijas y el aviso «Buen resultado en X». XP, monedas, insignias y escudos no tienen dónde guardarse (haría falta un contenedor propio con versión, como `state.learning`), y las funciones sociales (ligas, duelos, rankings) necesitarían un servidor.
- **Antes de lanzar al público:** probar con lector de pantalla y en móvil real, confirmar por escrito la autorización de los personajes de terceros de Lumi.
- **Pendiente en navegador o dispositivo real:** alto contraste real del sistema operativo, movimiento reducido del sistema, varias pestañas, actualización del service worker en una instalación existente, importar un JSON real desde el selector de archivos, nitidez de los personajes en pantallas de 1× y los seis temas a ojo. La revisión de textos en inglés ya no aplica: el inglés está fuera de la app (`idioma-ingles/`).
- **Límites conocidos:** `BUILTIN_DECK_NAMES` en `js/12-copias-e-importacion.js` duplica los nombres de `DECKS` de `extras.js` (hay que mantenerlos iguales); `learny.corrupt` y `learny.newer` guardan el texto original en el navegador, con la clave de Gemini si la había («Borrar todo» sí los elimina); con datos de una versión más nueva, esta versión es de solo lectura hasta que se actualice la app.
- Los comentarios de cabecera de `js/01` a `js/15` dicen «parte N de 15» y los de `js/16` «de 16»; es solo texto.

## Novedades

> **Nota (1-11-2026):** las entradas v93 a v99 sobre cuentas y Firebase describen cómo estaba el código entonces. Desde la v109 la nube está congelada y su código vive en `nube/` (no se carga ni se precachea); las rutas `js/23-cuenta.js`, `js/24-clase-nube.js`, `js/firebase/` y `firebase/` de este diario ahora son `nube/js/…` y `nube/firebase/`. Este registro llega hasta la v99; lo posterior (v100 a v111) está en `ESTADO.md` y en `docs/historial/CONTINUIDAD.md`.

### v99 · Corrección de pruebas y cableado perdido
La suite completa pasa (167 pruebas; antes fallaban 20). Regresiones reales: faltaba `settings.newPerDay` (20, validado 0–200) y su campo «Tarjetas nuevas por día» en Ajustes → Estudio y avisos; faltaba el manejador de `data-empty="more-new"`; los clics de `data-task-go` (Planificar → «Empezar») y `data-leech-open` («Tarjetas que se te resisten») se dibujaban pero nadie los escuchaba; en `js/09-tutor-ia.js` `settleResult()` nunca movía el foco al resultado de la IA (R11); el campo de nombre y «Atrás» de la bienvenida no llevaban la clase `w-edge` (contraste ≥ 3:1). El resto fueron pruebas mal escritas, no la app.

### v98 · Firebase, Bloque 6: `isPro()` desde la cuenta
Fuera de la demo, `isPro()` es `isUserPro()`: solo el plan de la cuenta (Firestore, plan `pro`, estado `active` y sin vencer). La marca local `learny.pro` se borra al arrancar y «Activar Pro en este navegador» queda solo en `?demo`. `proModal` distingue demo, cuentas no disponibles, sin sesión y plan Gratis. Pruebas: `tests/cuenta-perfil.spec.js` (22).

### v97 · Firebase, Bloque 5: sección Learny Pro protegida
Página `#pro` (botón «Learny Pro» en la barra lateral, oculto hasta que haya cuentas): sin sesión redirige a Hoy y abre el inicio de sesión; con sesión muestra el plan y el catálogo `PRO_FEATURES`.

### v96 · Firebase, Bloque 4: editar nombre
«Tu cuenta» permite poner o cambiar el nombre (≤ 40). Las reglas de Firestore abren `update` solo para `displayName` y `updatedAt`. **Hay que volver a publicar las reglas.**

### v95 · Firebase, Bloque 3: perfil en Firestore
Al iniciar sesión se lee `users/{uid}` y, si no existe, se crea con plan `free` y Pro inactivo. «Tu cuenta» muestra el plan, el estado de carga y los errores con «Reintentar».

### v93–v94 · Cuentas integradas y reorganización de archivos
`23-cuenta.js` y los módulos de Firebase quedan cargados en `index.html` y en `CORE`; los archivos de Firebase se reorganizan en `js/firebase/` y `firebase/` (coinciden con las rutas de `sw.js`, `index.html` y `firebase.json`); `firebase-config.js` se rellena con el proyecto `learny-c6666`.

### v92 · Limpieza y documentación
`window.Learny` expone **48** claves (los textos decían 47; recontado contra `js/14-eventos.js`). `js/18-idioma.js`: se quitaron 7 entradas duplicadas del diccionario `EX` (mismo valor que la otra, sin cambio de traducciones). Comentarios de CSS de Alisa Kujou corregidos (caja de 128 / 90 / 64 px en rejilla 200×200). Nuevo `nube/firebase/firestore.rules` (en la v92 denegaba todo; desde la v95–v96 permite crear el perfil y editar el nombre, ver arriba). `CONTINUIDAD.md` suma las notas de la v90, la v91 y esta. Sin cambios de lógica ni de datos.

### v91 · (sin notas)
La caché del service worker estaba en `learny-v91` pero ni este README ni `CONTINUIDAD.md` describían el cambio. Si lo recuerdas, añade aquí qué incluyó.

### v90 · Metas, Fase 3a: tarjetas ligadas a una etapa
Cada etapa de una meta puede vincularse a **una materia de tarjetas** (`stage.subject`, que `sanitizeLearning` ya validaba contra `goal.subjects`; sin cambio de esquema). Desde la etapa se ve cuántas tarjetas tiene esa materia, cuántas tocan hoy, cuántas se repasaron y cuántas se recordaron; se pueden repasar las de hoy, practicar con los errores primero y crear una tarjeta con la materia ya puesta. «Comprobar con tarjetas» exige al menos 3, todas repasadas y ninguna marcada «No lo sabía» la última vez; al comprobarla deja una evidencia automática y se puede deshacer. Quitar el vínculo no borra tarjetas. SM-2, Pomodoro, Feynman, estadísticas y `SCHEMA` no cambian. Textos en inglés incluidos (`18-idioma.js`). Pruebas en `tests/metas-ui.spec.js`, ejecutadas y pasando desde la v99.

### v89 · Metas, Fase 2: interfaz
Nuevo `js/22-metas.js`: tarjeta «Mis metas» en Planificar (solo con el perfil «Estudio por mi cuenta»). Crear, editar y eliminar metas (solo «¿qué quieres aprender?» es obligatoria; plantilla opcional de 4 etapas), ruta de etapas que se añaden, suben, bajan, dividen y saltan, «Esto ya lo sé», autoevaluación en 5 niveles y evidencias en texto o enlace http(s) (máx. 5 por etapa). Autoevaluarse y comprobar son cosas distintas: comprobar exige al menos una evidencia, y no hay un botón único de «dominado». Eliminar una meta guarda una copia automática y se puede deshacer. Un contenedor de una versión más nueva queda de solo lectura. Pruebas en `tests/metas-ui.spec.js`.

### v88 · Correcciones
`21-quiz.js` se carga en `index.html`; el quiz tiene traducción al inglés; los textos por perfil (v78) se aplican de verdad (`applyProfileTexts` desde `applyAppearance` y al elegir perfil, `ptxt` en Hoy y en el plan de recuperación, `ptxt` en `window.Learny`); README al día. Nueva prueba `tests/perfil-textos.spec.js`.

### v87 · Pro, Bloque 2: quiz y simulacro
Opción múltiple, verdadero/falso y respuesta corta generados desde tus tarjetas; simulacro de 60 s por pregunta. No cambia SM-2 ni `state`. Pruebas en `tests/quiz.spec.js`.

### v86 · Pro, Bloque 1
Base Pro (`learny.pro`) y exportar/imprimir tarjetas.

### v85 · Metas, Fase 1: capa de datos
Nuevo contenedor `state.learning` (metas con etapas, recursos, dudas y bitácora) con saneado completo, topes y versión propia; no sube `SCHEMA` (sigue en 4). Se guarda, exporta, importa y sincroniza entre pestañas con el resto de los datos; la vista previa de importar muestra «metas (ahora: N)»; «Borrar todo» las borra; quien solo tiene una meta no es «usuario nuevo». Un contenedor de una versión más nueva se conserva intacto y de solo lectura. La interfaz llegó en la v89. Pruebas: `node tests/run-node.js` (rápidas, sin navegador) y `tests/metas-datos.spec.js`. Ver `CONTINUIDAD.md`.

### v84 · Perfiles, etapa 4: modo autodidacta
Para el perfil «Estudio por mi cuenta»: ritmo semanal (`settings.weeklyGoal`, 3 por defecto, 1–14; una sesión = un bloque de enfoque completado en los últimos 7 días) en lugar de fecha de examen. Hoy no ofrece «Añade la fecha de un examen» y propone «Retomar» un tema con 4 o más días sin tocar; Planificar muestra «Tu ritmo de esta semana» y Reforzar «Progreso por tema». Con los demás perfiles nada cambia. Pruebas en `tests/autodidacta.spec.js` (7). Ver `CONTINUIDAD.md`.

### v83 · Lector de pantalla: correcciones R7–R12 del guion de la Etapa 3c
Salen de leer el código (el guion aún no se ha ejecutado con una persona). R7: al volver con «Atrás» la opción elegida lleva `aria-pressed` y borde grueso. R8: cada misión dice «Completada»/«Pendiente» en texto oculto. R9: «Accesibilidad» es un `h3` y el botón de cierre va después del contenido en el DOM (sigue arriba a la derecha). R10: cada ventana lleva regiones vivas propias (`.modal-live`, `.modal-alert`); los avisos y `announce()` escriben ahí mientras haya una ventana abierta (la página queda inerte y `#sr-live` no se lee). R11: al llegar la respuesta de la IA el foco pasa al título del resultado. R12: tamaño de texto, lectura fácil y animaciones se anuncian al cambiarlos y el texto de ayuda ya no presupone ver la pantalla. Pruebas en `tests/lector-pantalla.spec.js`, ejecutadas y pasando desde la v99.

### v82 · Lector de pantalla: correcciones R1–R6 del guion de la Etapa 3c
Salen de leer el código (el guion aún no se ha ejecutado con una persona): al revelar una tarjeta el foco pasa a la propia tarjeta para que se lea la respuesta (R1); el selector de tiempo de Hoy conserva el foco en el botón pulsado y anuncia el filtro (R2); el reloj y sus notas solo se reescriben si cambia el texto y `role="timer"` queda siempre en `aria-live="off"` (R3); el paso «Personalizar» de la bienvenida enfoca su título (R4) y no se cierra con Intro sobre un radio o una casilla (R5); en inglés se traducen Skip, Back, Today's time y las tres duraciones, y el botón EN/ES lleva `lang` (R6). Pruebas en `tests/lector-pantalla.spec.js`, ejecutadas y pasando desde la v99.

### v81 · Perfiles, etapa 3: accesibilidad en la bienvenida
En el paso «Personalizar» de la bienvenida hay un grupo «Accesibilidad» (tamaño de texto, lectura fácil y reducir animaciones) con vista previa en vivo; se guarda al pulsar «Terminar» y Omitir, × o Esc lo revierten. Los bordes de los controles de la bienvenida (opciones de perfil, tiempo, tamaño de texto, nombre y «Atrás») pasan a un contraste de al menos 3:1 en todos los temas (`--ui-edge`). Pruebas en `tests/accesibilidad-bienvenida.spec.js`, ejecutadas y pasando desde la v99.

### v78 · Perfiles, etapa 2: textos según el perfil
Las frases más cargadas de «presión de examen» (Examen real, Informe de examen, «Hoy me cuesta arrancar», «fallos»…) tienen tres variantes (examen / por mi cuenta / enseño) en una sola tabla, `js/01b-perfil-textos.js`. Solo cambia lo que se lee, no la lógica. El inglés sale de la misma tabla.

### v80 · Alisa Kujou en alta resolución
El dibujo de Alisa Kujou se remuestreó a 115×179 celdas (rejilla 200×200, 36 colores) para conservar pelo, ojos, lazo y pliegues. Cajas de 128 px en escritorio, 90 px en móvil y 64 px en enfoque; los pivotes de las poses se recalcularon. La miniatura de Ajustes mide 64 px como las demás (v79).

### v77 · Lumi: apariencia «Alisa Kujou»
Nueva apariencia de Lumi (`settings.mascotAvatar = 'alisa'`): una chica chibi de pelo plateado con ahoge, lazo rojo y uniforme, en pixel art (`js/16-lumi-alisa.js`; en la v77 eran 62×96 celdas en rejilla 100×100 y desde la v80 son 115×179 en rejilla 200×200) con poses propias (ojos, cabeza, lazo, ahoge y brazo) y reposo. Solo representación: sin cambios de lógica, textos ni esquema. Caché `learny-v77`.

### v76 · Perfiles, etapa 1: bienvenida de una pregunta
`welcomeFlow()` ahora muestra una sola pantalla con tres botones (examen / por mi cuenta / enseño) y guarda `settings.profile` (`'exam' | 'self' | 'teach'`, `''` = sin elegir). Nombre y tiempo pasan a un paso opcional «Personalizar». Quien ya tenía datos o copia antigua recibe `'exam'` en `hydrate`/`load`. Selector «Uso principal» en Ajustes. Sin cambio de esquema.

### v75 · Iconos Material Symbols en lugar de emojis
- Todos los emojis y símbolos-icono de la interfaz (menú, barra móvil, botones, temporizador, estados, cerrar) pasan a **Material Symbols**, con la fuente `material-symbols.woff2` dentro del repo (también en la caché del service worker): sin conexión y sin descargar nada de internet.
- Uso: `<span class="material-symbols-outlined" aria-hidden="true" translate="no">nombre</span>`; desde JS, `icon('nombre')` (js/01-base.js). Solo existen los 26 iconos del subconjunto; para otro hay que regenerar la fuente.
- «Ajustes ⚙️» dentro de frases pasa a «Ajustes» a secas (también en js/18-idioma.js). Los avisos de error del tema Chrome conservan el texto «Error:» sin icono.
- Las claves de traducción ya no llevan emojis; los botones del temporizador se traducen con el diccionario `ONLY` (solo texto completo).

### v74 · Lumi dice el dato curioso y tiene más mensajes
- **El dato curioso diario lo dice Lumi** (una vez al día, en la primera visita a Hoy; con Lumi activa se oculta el de «Más sobre hoy»). Se amplían los datos de 9 a 15.
- **Más mensajes:** consejos de estudio, días hasta el próximo examen, progreso de la meta y racha, y frases alternativas al celebrar, apoyar y marcar progreso. Sigue habiendo UN mensaje proactivo por visita y nada en enfoque ni examen.

### v73 · Lumi más útil y opcional (Fase 9, parcial)
- **Aviso de repasos de mañana:** Lumi dice «Mañana te tocan N repasos.» cuando hay 10 o más programados para mañana (misma cifra que la previsión de Reforzar). Sustituye al mensaje neutro; respeta un proactivo por visita y no sale en enfoque, examen ni con una ventana abierta.
- **Lumi desactivada por defecto** para quien empieza de cero (pruebas con estudiantes). Quien ya la tenía activada la conserva; se activa en Ajustes → Disposición.

### v71 · Plan y datos útiles (Fase 8)
- **Límite de tarjetas nuevas por día** (Ajustes → Estudio y avisos, 20 por defecto, 0 = sin límite): una tarjeta es nueva si nunca se repasó. Las que sobran esperan a otro día y siguen siendo «de hoy»; los repasos de tarjetas ya vistas nunca se limitan. Desde Practicar se pueden adelantar («Aprender algunas nuevas ahora»). Nada se borra ni se reprograma.
- **Tarjetas que se te resisten** (Reforzar): las que acumulan 4 fallos («No lo sabía») desde que se atendieron. Cada una ofrece reescribir, dividir o dejarla como está (con «Deshacer»). Reescribirla la da por atendida (campo opcional `leechSince` en la tarjeta; sin cambio de esquema).
- **Tareas del plan con cifras reales:** cada tarea de hoy en Planificar dice cuántas tarjetas de la materia toca («Hoy: 12 tarjetas de Biología por repasar») y tiene un botón «Empezar». La recomendación de Hoy cita la misma cifra. Se calcula al dibujar; no se guarda.
- **Retención real frente al objetivo** (Reforzar): de los repasos de tarjetas ya vistas, cuántos no fueron «No lo sabía», separando jóvenes (volvían en menos de 21 días) y maduras. El intervalo real sale del historial de cada tarjeta. El 90 % es solo una referencia. No cambia SM-2.

### v70 · Crear tarjetas con menos fricción (Fase 7a)
- **Crear varias seguidas:** el formulario de nueva tarjeta tiene «Guardar y añadir otra» (y Ctrl+Intro / ⌘+Intro): guarda, mantiene la materia, vacía pregunta y respuesta y deja el foco en la pregunta. Muestra cuántas llevas en la tanda. Intro y «Crear tarjeta» siguen guardando y cerrando.
- **Tarjeta inversa:** casilla opcional que crea además la tarjeta respuesta → pregunta. Es una tarjeta normal (sin cambios de esquema) y llega al día siguiente para que no salga justo detrás de su pareja. Si la respuesta pasa de 500 caracteres no se crea y se avisa.
- **«Crear con IA» a la vista** junto a «+ Crear» en Practicar (antes solo en «Más formas de repasar»; ese botón se conserva). Sin clave, hace lo de siempre: avisa y lleva a la Biblioteca.
- No cambian SM-2, datos, copias ni migraciones. Los cloze quedan para una fase propia (7b) porque sí cambian el modelo.

### v69 · Modelo de IA por defecto y ayuda sobre Gemini
`DEFAULT_MODEL` pasa a `gemini-3.8-flash` (quien conservaba el valor por defecto anterior se migra; un modelo elegido a mano se respeta). Ajustes explica qué es Gemini y enlaza a Google AI Studio y a la lista de modelos; la guía de uso tiene una tarjeta «Qué es Gemini y cómo conseguir tu clave».

### v68 · Red de seguridad (Fase 6)
Suite de pruebas Playwright (`tests/`) y copia automática a un archivo (`js/19-copia-archivo.js`, solo en Chrome/Edge de escritorio): se reescribe cada ~60 s si hay cambios, sin la clave de Gemini.

### v67 · Visibilidad del repaso
Cada botón de calificar muestra en cuántos días volverá la tarjeta («Dudé · 3 d», «Fácil · 12 d»; «sin cambio» en un repaso anticipado). Se calcula con la misma función que aplica SM-2 (`nextSchedule()` en `js/07-tarjetas.js`), así que lo mostrado coincide con lo que ocurre. En «Reforzar» hay una previsión de los repasos ya programados para los próximos 7 días. Solo representación: el algoritmo, los datos y las copias no cambian.

### v66 · Pulido
- Las listas escalonan ~30 ms la entrada de los elementos nuevos (máx. 6; sin escalonado con movimiento reducido).
- Al calificar una tarjeta aparece un velo breve de opacidad (acento para «Fácil», neutro más leve para el resto). Solo representación.

### v65 · Continuidad visual
Al cambiar de sección, la página que sale se desvanece (~120 ms) mientras entra la nueva (sin cambios en el orden de tabulación, el foco ni los atajos: la capa saliente es inerte y oculta para lectores de pantalla). Al borrar un elemento de una lista, el fantasma colapsa su altura y el hueco entre filas, así que lo de abajo sube de forma continua en vez de saltar. Con movimiento reducido solo hay fundidos. Solo representación; `js/17-movimiento.js` y `motion.css`.

### v64 · Menos trabajo en segundo plano
Los movimientos de reposo de Lumi se detienen tras 30 s sin actividad (al final de un ciclo de respiración) y vuelven al tocar, pulsar una tecla o con cualquier evento de la app; se ajusta con `restAfterMs` en `LUMI_CONFIG` (0 = nunca). `js/17-movimiento.js` lee los tokens de `motion.css` una sola vez (se vuelven a leer solo al cambiar el movimiento reducido) y descarta antes las páginas inactivas. Solo representación: sin cambios de mensajes, frecuencias ni datos.

### v63 · Movimiento reducido sin perder legibilidad
Con «reducir movimiento» (sistema o Ajustes → Disposición → Reducir animaciones) ya no desaparece todo: se quitan desplazamientos, escalas, el pulso del temporizador y las barras animadas, y se conservan fundidos de opacidad de 80–100 ms en vistas, ventanas, tarjetas, avisos y listas. Se retiró la regla global de `style.css` que lo apagaba todo y las animaciones CSS antiguas que `motion.css` ya anulaba (`card-in`, `fb-good`, `fb-soft`, `done-pulse`, `sheet-up`, transiciones de botón y de aviso). Lumi no cambia.

### v62 · Fondo de las ventanas
El velo oscuro detrás de las ventanas ahora se desvanece al abrir y al cerrar (antes aparecía y desaparecía de golpe). Solo CSS en `motion.css`.

### v61 · Avisos al abrir una ventana
Un aviso lanzado justo al abrir una ventana ya no salta de sitio (≈49 px en escritorio): si el diálogo está animando su entrada, el aviso espera unos 260 ms.

### v60 · Lumi se mueve en reposo
Las seis apariencias de Lumi (entonces) hacen movimientos pequeños y espaciados cuando está en reposo (respiración, parpadeo, cola, orejas, alas o cabeza, según el personaje). Se apagan en enfoque, durante un examen, con la pestaña oculta y con movimiento reducido (del sistema o de Learny: **Ajustes → Disposición → Reducir animaciones**). Los gestos de las reacciones no cambian. Solo CSS.

### v59 · Guardado más ligero
`save()` ya no relee todo `learny.v3` en cada guardado: la protección contra datos de una versión más nueva se activa al arrancar y por el evento `storage` / al volver a la pestaña. Los chats del tutor guardan como máximo 12 mensajes de 1 500 caracteres por tema (antes 20 de 3 000).

### v58 · Correcciones de la segunda auditoría
El botón «×» de Lumi deja el foco en el título visible; «Generar estudio» y Feynman ya no se quedan en «Consultando…» si otra consulta toma el relevo; un bloque nuevo no hereda el resultado anterior; las sesiones se fechan cuando terminó el bloque; el contexto del tutor se refresca al sincronizar pestañas; fases de tarea validadas; confirmaciones en cola; el aviso de «Plan reajustado» ya no adelanta a los avisos graves de arranque; la clave de Gemini se valida (ASCII) y «Quitar clave» también la purga de `learny.corrupt`/`learny.newer`; el texto del usuario en Planificar no se traduce.

### v57 · Cat Black se mueve
Poses propias de Cat Black, solo CSS: parpadeo y meneo de cola al aparecer; al celebrar, salto + cola + oreja + parpadeo; al dar la bienvenida, saludo + cola + oreja; apoyo, progreso y estado vacío con gestos mínimos; estático en enfoque. Sin cambios de lógica, textos, frecuencias, datos ni esquema.

### v56 · Cat Black
Sexta apariencia de Lumi (`'gato'`): un gato negro de ojos blancos en pixel art (`js/16-lumi-gato.js`).

### v54–v55 · Yor Forger
Quinta apariencia de Lumi (`'yor'`) y sus poses (adornos, ojos y gestos de cuerpo entero), solo representación.

### v45–v47 · Idioma y Daniel Carreon
- **v45:** inglés por defecto y español opcional (`settings.lang`, `js/18-idioma.js`).
- **v46–v47:** cuarta apariencia, Daniel Carreon (`'daniel'`), y sus poses.

### v48–v53 · Auditoría de fiabilidad
- **Avisos y mazos (v48):** los avisos de validación ya se ven dentro de ventanas abiertas; crear mazos conserva las barras `|` de la respuesta; «Estudio inteligente» valida nombre y materia.
- **Temporizador y sesiones (v49):** un bloque que terminó con la app en segundo plano más de 2 minutos ya no se descarta en silencio: pregunta «¿Estudiaste este bloque?». Guardar la valoración y replanificar escriben en el objeto vigente aunque otra pestaña haya cambiado los datos.
- **Arranque y protección de datos (v50):** con datos de una versión más nueva no se sobrescribe nada; los ids son siempre cadenas únicas; el archivo dañado descargable no incluye tu clave.
- **Importaciones (v51):** el CSV no confunde columnas de metadatos con la materia ni pierde filas que empiezan por `#algo:`; importar mazos aplica los mismos límites que una copia completa y omite nombres repetidos.
- **Robustez de interfaz (v52):** Ajustes abre aunque falle Lumi; `P` y `Z` ignoran la repetición de tecla; «Borrar todo» en otra pestaña vacía los borradores de esta; mejoras de traducción y dictado en el idioma elegido.
- **Infraestructura (v53):** el service worker guarda en caché dentro de `waitUntil` y, ante un 404/5xx del servidor, sirve la copia guardada; el proxy limita el tamaño del cuerpo también sin `Content-Length`.

### v38–v44 · Más apariencias y movimiento
Eevee (v38) y WALL·E (v39) con sus poses (v40); movimiento de la interfaz (`motion.css`, `js/17-movimiento.js`, v41); dock global de Lumi (v42), reacciones en cualquier sección (v43) y WALL·E en el precaché (v44).

### v30–v37 · Lumi y tema Cromo
Componente Lumi con estados neutral, enfoque, celebrar, apoyo, progreso, bienvenida y vacío; tema Cromo (v34); abeja redibujada fiel a la referencia con poses (v36).

### v25 · Código dividido en archivos
`script.js` se dividió en archivos dentro de `js/`. No cambió el comportamiento ni los datos.

### v24 · Etapas 5, 6 y 7
- **Bienvenida:** guía opcional de 4 pasos (nombre, materia, objetivo y tiempo) y el botón «Hoy me cuesta arrancar».
- **Portada:** quien nunca ha entrado ve primero una portada con «Probar Learny».
- **Demostración:** `index.html?demo` muestra Learny con datos de ejemplo, todo en memoria.
- **Revisión de fiabilidad:** copias automáticas rotativas, copia del archivo dañado, importación más segura, avisos de arranque en cola, mejoras de móvil y de lectores de pantalla.

### v16 · Apariencia y tipografía
Ajustes reorganizados en bloques plegables; temas Automático, Oscuro, Negro, Claro, Sepia y Alto contraste; acento personalizado con contraste garantizado; solo fuentes del sistema; vista previa en vivo que solo se guarda con «Guardar preferencias».

### v15 · Reducir la complejidad visible
*Hoy* muestra una acción recomendada con su motivo y dos alternativas; lo avanzado queda en bloques plegables; modo sesión durante un bloque o examen; revisión de móvil (320–390 px), teclado y accesibilidad.

### v14 · Planificador transparente, importación con vista previa y varias pestañas
El planificador explica cada reajuste y comprueba si lo que queda cabe; CSV/Anki, mazos JSON y copias completas muestran una vista previa antes de tocar datos; el temporizador y los datos se sincronizan entre pestañas.

### v10–v13 · Protección, estadísticas honestas, tutor y revisión de tarjetas
Deshacer en las acciones habituales; «Recuerdo declarado» en lugar de «Retención», con su muestra y periodo; tutor socrático o directo y Feynman con comentarios concretos; bandeja de revisión para tarjetas generadas con IA.

### v7–v9 · Flujo diario y correcciones
Pantalla *Hoy*, sesión inteligente, esquema de datos `version: 4` con migraciones reales, tarjetas dañadas conservadas, diálogos de confirmación propios, correcciones de móvil, tutor, importación, SM-2 y proxy.

## Modo profesor (Etapa 6a, v100)
El perfil «enseño» ya no cambia solo el vocabulario: todo se hace con archivos, sin cuentas ni servidor.
- **Profesor:** Biblioteca → «Compartir con alumnos o con tu profesor» → «Compartir mazo» (elige materias, nombre, autor, descripción y versión; el archivo no lleva progreso, notas ni clave). En **Reforzar** aparece «Resultados de tus alumnos»: importa los informes (varios a la vez), ve quién ha repasado, el % sin fallar y las tarjetas que más se fallan en la clase, y exporta un CSV. Con el perfil «enseño», **Hoy** propone «Prepara un mazo para tus alumnos» y, con informes importados, «Mira cómo van tus alumnos».
- **Alumno:** importa el mazo (queda en «Mazos recibidos»; una versión igual o más antigua no se repite) y descarga «Informe para mi profesor» con sus repasos y fallos de ese mazo.
- **Formatos:** mazo `{type:'learny-deck', name, author, description, deckVersion, deckId, cards, decks}`; informe `{type:'learny-report', deckId, deckName, student, date, total, cards:[{k,q,n,a,last,iv}]}`. Datos nuevos opcionales `state.received` y `state.reports` (máx. 40), sin cambio de esquema. No funcionan en la demostración. Pruebas: `tests/profesor.spec.js`.

### Clase en la nube (opcional, v101)
Con sesión iniciada, lo que hace el modo profesor se refleja en tu cuenta para verlo en otro navegador; sin sesión todo sigue solo en el navegador. Debajo de «Resultados de tus alumnos» y de «Mazos recibidos» se ve el estado (sincronizando, guardado, error con «Reintentar»).
- **Fusión:** al iniciar sesión (y al volver a la pestaña, como mucho cada minuto) se lee la nube: un informe es «mazo + alumno» y gana el más reciente; un mazo recibido gana por versión. Después se sube lo local que falte. Subir nunca borra.
- **Borrados:** solo «Quitar informe» y «Quitar de la lista» borran también en la cuenta. Restaurar copias, importar y «Borrar todo» no tocan la nube (tras «Borrar todo» queda en pausa hasta recargar). Si quitas algo sin sesión, volverá a aparecer al iniciar sesión.
- **Privacidad:** los informes llevan el **nombre de cada alumno**. Guardarlos en tu cuenta te hace responsable de esos datos (pide permiso a tus alumnos o a sus familias, y más si son menores). Para quitarlos de la nube basta «Quitar informe».
- **Cuotas (plan Spark):** cada sincronización lee hasta 70 documentos y escribe solo lo que cambió; el cupo gratuito es de 50.000 lecturas y 20.000 escrituras al día. Tras un error no se reintenta en cada cambio: se espera 1 minuto o «Reintentar».
- **Reglas:** **hay que volver a publicar `nube/firebase/firestore.rules`** (añade las dos subcolecciones, con forma y tamaños validados).
