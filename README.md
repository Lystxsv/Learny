# Learny

App web de estudio: Pomodoro con descanso, flashcards con repaso espaciado (SM-2), método Feynman,
ruleta de temas, planificador inverso, estadísticas, un tutor socrático opcional con IA y **Lumi**,
un compañero de estudio opcional con seis apariencias (abeja pixelada, Eevee, WALL·E, Daniel Carreon, Yor Forger y Cat Black).
La interfaz está en inglés por defecto y se puede cambiar a español. Todo se guarda en el navegador de cada persona;
no hay cuentas ni servidor.

Versión actual del service worker: `learny-v62` · esquema de datos: `version: 4`.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html`, `style.css`, `motion.css`, `extras.js` y la carpeta `js/` (23 archivos) | La app completa (no necesita instalación ni compilación). `js/` reemplaza al antiguo `script.js`; ver «Estructura del código». |
| `sw.js`, `manifest.json` | Modo sin conexión e instalación como app (PWA). |
| `icon.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | Iconos de la app (ya subidos al repositorio). Son opcionales para `sw.js`, pero `manifest.json` los referencia. |
| `proxy-worker.example.js` | Ejemplo de proxy (Cloudflare Worker) para usar IA sin exponer tu clave. Es el único archivo de proxy: la copia `proxy-worker_example.js` era idéntica y se eliminó. |
| `CONTINUIDAD.md` | Cuaderno de trabajo de Lumi, del movimiento y de la auditoría: qué se hizo en cada bloque, decisiones, pruebas y pendientes. Léelo antes de tocar `js/16-lumi*.js`. |

## Estructura del código
El antiguo `script.js` está dividido en archivos dentro de `js/`, en el mismo orden en que se cargan. Son scripts clásicos (no módulos), así que `index.html` sigue funcionando con doble clic. Las partes 01–15 son la app; las 16 son Lumi (arte + controlador), la 17 es el movimiento y la 18 el idioma.

| Archivo | Contenido |
|---|---|
| `js/01-base.js` | Base: modo demo, constantes (incluida `MASCOT_AVATARS`), utilidades y el objeto `state`. |
| `js/02-datos.js` | Datos: tarjetas, migraciones, validación (`sanitizeSettings`), copias automáticas, datos de la demo y carga inicial. |
| `js/03-interfaz.js` | Interfaz base: confirmación, guardado, avisos (toast, que se coloca dentro del diálogo abierto) y deshacer, páginas, ventana modal, sonido. |
| `js/04-planificador.js` | Planificador: plan inverso, tareas diarias y reajuste si te atrasas. |
| `js/05-temporizador.js` | Temporizador: Pomodoro, sincronización entre pestañas, racha y pantalla «Hoy». Emite `learny:timer`. |
| `js/06-hoy.js` | Hoy: recomendación con motivo, saludo (`daysSinceActivity()`), cierre de sesión, «me cuesta arrancar» y cola del día. |
| `js/07-tarjetas.js` | Tarjetas: repaso espaciado (SM-2), simulacro, formulario y biblioteca. |
| `js/08-analisis.js` | Análisis: estadísticas por materia e informe. |
| `js/09-tutor-ia.js` | Tutor e IA: guía local, prompts, Gemini (clave o proxy) y chats. |
| `js/10-revision-ia-y-temas.js` | Revisión de IA y temas: bandeja de revisión, Feynman, temas y ruleta. |
| `js/11-apariencia.js` | Apariencia: temas (incluido Cromo), acentos con contraste y preferencias; avisa a Lumi y al idioma con `sync`. |
| `js/12-copias-e-importacion.js` | Copias e importación: exportar, validar e importar copias, mazos y CSV/Anki. |
| `js/13-ajustes.js` | Ajustes: estilos rápidos, ambientes, ventana de Ajustes (casilla de Lumi, selector de apariencia e idioma), recordatorios y contexto del tutor. |
| `js/14-eventos.js` | Eventos: `renderAll`, manejadores, service worker y la API `window.Learny` (46 claves). |
| `js/15-inicio.js` | Inicio: bienvenida, portada, banner de la demo y arranque. |
| `js/16-lumi-eevee.js`, `16-lumi-walle.js`, `16-lumi-daniel.js`, `16-lumi-yor.js`, `16-lumi-gato.js` | Solo el arte (SVG en pixel art) de cada apariencia de Lumi. Se cargan **antes** de `16-lumi.js`. |
| `js/16-lumi.js` | Lumi: la abeja pixelada (`lumiBeeSvg()`), el controlador `LumiCompanion`, estados, mensajes y reglas de frecuencia. |
| `motion.css` y `js/17-movimiento.js` | Movimiento de la interfaz (no de Lumi): tokens de duración, botones, modales, avisos; flashcards, listas, cambio de vista y barras con la Web Animations API. Todo vale 0 con movimiento reducido. |
| `js/18-idioma.js` | Idioma: inglés por defecto y español opcional (`settings.lang`). Diccionario es→en + reglas, traducción del DOM con `MutationObserver`, guía de uso en inglés, guía local del tutor en inglés y la IA responde en el idioma elegido. Botón EN/ES en la barra superior y selector en Ajustes → Apariencia. |

Reglas para tocarlos:
- **El orden de los `<script>` en `index.html` importa.** Lo que se ejecuta al cargar solo puede usar nombres definidos en archivos anteriores; lo demás (manejadores, funciones) se resuelve cuando se usa.
- **Comparten el ámbito global** (no hay `import`/`export`): un nombre de nivel superior (`const`, `let` o `function`) no se puede repetir entre archivos, y las variables compartidas (`exam`, `currentPage`, `rev`…) son las mismas en todos.
- `extras.js` no ve esos nombres: solo usa la API `window.Learny` (46 claves), que se crea en `js/14-eventos.js`.
- Si añades, quitas o renombras un archivo de `js/`, cámbialo también en la lista `CORE` de `sw.js` y sube `CACHE`. La lista debe ser igual que los `<script>` de `index.html`.
- `sw.js` trata `extras.js` y `manifest.json` como **imprescindibles**: si falta uno en el servidor, `cache.addAll` falla y el service worker no se instala. Sube siempre todos los archivos.
- Si ya tenías `script.js` publicado, bórralo del repositorio: ya no se usa. Lo mismo con cualquier copia con sufijo «(2)» de un archivo de `js/`: ninguna se referencia.

## Lumi (compañero de estudio)
Lumi es un compañero **opcional** (activado por defecto) que acompaña en momentos concretos. No guarda datos propios: solo lee `state`/`timer` y respeta `settings.mascot` y `settings.mascotAvatar`. Se activa o desactiva con la casilla «Compañero de estudio: Lumi» en Ajustes ⚙️ → *Disposición*, o con el «×» junto al personaje (con «Deshacer»).

- **Apariencias** (`settings.mascotAvatar`): `bee` (predeterminada, «Abeja pixelada»), `eevee`, `walle`, `daniel`, `yor` y `gato` («Cat Black»). Se eligen en Ajustes → Disposición → «Apariencia de Lumi» con vista previa; cambiar de apariencia solo cambia el dibujo, no el comportamiento. Un valor desconocido, o un archivo de arte ausente, cae a la abeja. Cada apariencia tiene su caja y sus poses propias en `style.css`.
- **Dibujo:** SVG en pixel art (`crispEdges`, sin curvas, sin degradados, sin `id`) insertado por JS en `#lumi`. Los personajes de terceros se usan con la autorización que declara el responsable del proyecto; para retirar uno basta borrar su archivo de arte, su `<script>`, su línea en `CORE` de `sw.js` y su entrada en `MASCOT_AVATARS`.
- **Dock global:** `#lumi-dock` es un dock fijo (abajo a la derecha), visible en todas las secciones. Contiene `#lumi`, `#lumi-msg` y `#lumi-live` (región `aria-live` solo para lo que ningún aviso anuncia).
- **Estados y mensajes** (texto real; el dibujo es `aria-hidden`):
  - *Neutral*: «¿Empezamos con algo corto?», una vez por visita.
  - *Enfoque*: con el Pomodoro en marcha, sin mensajes ni animación.
  - *Celebrar*: «Bloque completado.» al cerrar la valoración de un bloque.
  - *Apoyo*: «Esta vuelve pronto. Sin prisa.» tras «No lo sabía».
  - *Progreso*: si en la misma tarjeta pasaste de «No lo sabía» a «Fácil».
  - *Bienvenida*: tras 3 o más días sin actividad (sesiones o repasos, mismo criterio que el saludo).
  - *Vacío*: «Crea tu primera tarjeta para empezar.» al entrar en Práctica sin tarjetas.
- **Reglas de frecuencia** (en `LUMI_CONFIG`): mensaje visible 5 s; un solo mensaje proactivo por visita; 90 s mínimo entre apoyos y entre progresos; prioridad reacción > contexto > genérico; sin cola (una reacción en espera caduca a los 20 s). Las reacciones salen en cualquier sección; los mensajes proactivos dependen de la página. Nada durante un examen, un bloque de enfoque, una ventana abierta, la portada o con la pestaña oculta.
- **Gestos** (solo CSS, un ciclo de ≤ 400 ms, sin esperar a `animationend`): salto, aleteo, saludo y movimientos de las partes de cada personaje. Se anulan con movimiento reducido (del sistema o de Learny), con la pestaña oculta y en enfoque.
- **Accesibilidad:** las reacciones no se anuncian aparte (ya las cubren los avisos existentes); sin `alert` y sin mover el foco. Temas: oscuro, negro, claro, sepia, alto contraste y Cromo.
- **Datos:** `settings.mascot` (activación) y `settings.mascotAvatar` (dibujo), ambos validados en `sanitizeSettings`, también al importar copias.
- **Eventos que usa** (ninguno nuevo para la app): `learny:timer`, `learny:pomodone`, `learny:rated`, `learny:examstart`, `learny:examend`, `learny:page`, `learny:render`.

## Probarla en tu computador
Abre `index.html` con doble clic. (El modo sin conexión/PWA solo se activa servida por `https://` o `localhost`.) Con `index.html?demo` ves Learny con datos de ejemplo, todo en memoria.

## Publicarla gratis en GitHub Pages
1. Crea un repositorio público en GitHub y sube **todos los archivos** (incluidos `js/`, `extras.js`, `manifest.json`, los iconos y `icon.svg`).
2. Settings → Pages → "Deploy from a branch" → rama `main`, carpeta `/ (root)` → Save.
3. En 1 o 2 minutos estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. Al publicar una versión nueva, sube también `sw.js` (cambia `CACHE` si modificas archivos; ahora es `learny-v62`).

## IA (opcional)
Hay dos formas; sin ninguna, Learny funciona con su guía local.
- **Clave propia:** cada persona pega su clave gratuita de Gemini en Ajustes ⚙️ (https://aistudio.google.com/apikey).
  Queda solo en su navegador y nunca se incluye en copias ni mazos. No la uses en un equipo compartido.
- **Proxy (recomendado en producción):** despliega `proxy-worker.example.js`, define `GEMINI_API_KEY` y
  `ALLOWED_ORIGIN` como secretos/variables y pega la URL del Worker en Ajustes ⚙️ → "URL de tu proxy".
  Con proxy activo no hace falta ninguna clave en el navegador. Opcionales: `MODEL` (por defecto `gemini-flash-latest`) y un binding `RATE_LIMITER`.
  El Worker limita también el tamaño de peticiones sin `Content-Length`; si lo desplegaste antes de la v53, vuelve a desplegarlo.

Si Google cambia el nombre del modelo, se puede cambiar en Ajustes sin tocar el código. La demo nunca usa IA. Con el idioma en inglés, la IA recibe la instrucción de responder en inglés.

## Funciones principales
- **Hoy:** una acción recomendada con su motivo y como máximo dos alternativas; Pomodoro con intención, notas de distracción y ambientes (Biblioteca, Noche, Minimalista); misiones, meta diaria y racha con día de gracia.
- **Practicar:** repaso SM-2 con tres calificaciones (No lo sabía = 1, Dudé = 3, Fácil = 5), modo examen, *Intercalar*, *5 minutos*, *Examen real*, *Crear con IA* con bandeja de revisión, tutor socrático o directo, Feynman, ruleta de temas, notas, lectura y dictado.
- **Biblioteca:** tarjetas archivadas, mazos iniciales y propios, importación de CSV/Anki y de mazos JSON con vista previa.
- **Planificar:** plan inverso por fases (comprensión → práctica → repaso → simulacro → revisión), reajuste si te atrasas con explicación, comprobación de carga y *Replanificar desde hoy*.
- **Reforzar:** seis indicadores honestos con su muestra y periodo (7 días, 30 días o todo), materias débiles y mini quiz; informe semanal en JSON o CSV.
- **Ajustes ⚙️:** idioma, apariencia, tipografía, disposición, estudio y avisos, IA y datos/copias; casilla y selector de Lumi.
- **Apariencia:** temas Automático, Oscuro, Negro (OLED), Claro, Sepia, Alto contraste y **Cromo**; acento Cielo/Menta/Violeta/Ámbar/Rosa o personalizado con contraste 4,5:1; cinco **estilos rápidos** (Cuaderno, Lectura nocturna, Papel, Biblioteca, Enfoque).
- **Idioma:** inglés (predeterminado) o español, con botón EN/ES en la barra superior (en móvil, en Ajustes).
- **Portada, bienvenida y demo:** quien nunca entró ve una portada con «Probar Learny»; la bienvenida de 4 pasos es opcional.

## Atajos
`Espacio` revela · `1` `2` `3` califican · `P` inicia/pausa el Pomodoro · `Z` deshace · `Esc` cierra ventanas. `P` y `Z` ignoran la repetición de tecla.

## Rendimiento
Los resultados de cálculo se memorizan y solo se dibuja la sección visible; pensado para colecciones de miles de tarjetas (sin medición independiente). El historial de repasos se limita a 5 000 registros.
Los archivos no están minificados (se cachean al primer uso); si quieres, puedes pasarlos por `terser`/`lightningcss`.

## Estado y pendientes
- Cada bloque de Lumi, de movimiento y de la auditoría, con su lista de pruebas, está en `CONTINUIDAD.md`. Se probaron con Chromium headless (`?demo`, 1280, 390 y 320 px).
- **Pendiente en navegador o dispositivo real:** lector de pantalla, alto contraste real del sistema operativo, movimiento reducido del sistema, varias pestañas, actualización del service worker en una instalación existente (hasta la v62), importar un JSON real desde el selector de archivos, nitidez de los personajes en pantallas de 1×, los seis temas a ojo y revisar cada sección en inglés buscando textos que sigan en español (se amplían en `EX`/`RULES` de `js/18-idioma.js`).
- **Límites conocidos:** `BUILTIN_DECK_NAMES` en `js/12-copias-e-importacion.js` duplica los nombres de `DECKS` de `extras.js` (hay que mantenerlos iguales); `learny.corrupt` y `learny.newer` guardan el texto original en el navegador, con la clave de Gemini si la había («Borrar todo» sí los elimina); con datos de una versión más nueva, esta versión es de solo lectura hasta que se actualice la app.
- Los comentarios de cabecera de `js/01` a `js/15` dicen «parte N de 15» y los de `js/16` «de 16»; es solo texto.

## Novedades

### v62 · Fondo de las ventanas
El velo oscuro detrás de las ventanas ahora se desvanece al abrir y al cerrar (antes aparecía y desaparecía de golpe). Solo CSS en `motion.css`.

### v61 · Avisos al abrir una ventana
Un aviso lanzado justo al abrir una ventana ya no salta de sitio (≈49 px en escritorio): si el diálogo está animando su entrada, el aviso espera unos 260 ms.

### v60 · Lumi se mueve en reposo
Las seis apariencias de Lumi hacen ahora movimientos pequeños y espaciados cuando está en reposo (respiración, parpadeo, cola, orejas, alas o cabeza, según el personaje). Se apagan en enfoque, durante un examen, con la pestaña oculta y con movimiento reducido (del sistema o de Learny: **Ajustes → Disposición → Reducir animaciones**). Los gestos de las reacciones no cambian. Solo CSS.

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
