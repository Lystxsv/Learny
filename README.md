# Learny

App web de estudio: Pomodoro con descanso, flashcards con repaso espaciado (SM-2), método Feynman,
ruleta de temas, planificador inverso, estadísticas, un tutor socrático opcional con IA y **Lumi**,
un compañero de estudio opcional con ocho apariencias (abeja pixelada, Eevee, WALL·E, Daniel Carreon, Yor Forger, Cat Black, Miku Nakano y Alisa Kujou).
La interfaz está en inglés por defecto y se puede cambiar a español. Todo se guarda en el navegador de cada persona;
no hay cuentas ni servidor.

Versión actual del service worker: `learny-v81` · esquema de datos: `version: 4`.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html`, `style.css`, `motion.css`, `extras.js` y la carpeta `js/` (27 archivos) | La app completa (no necesita instalación ni compilación). `js/` reemplaza al antiguo `script.js`; ver «Estructura del código». |
| `package.json`, `playwright.config.js`, `tests/` | Pruebas automáticas (solo para quien desarrolla; la app no las necesita). Ver «Pruebas». |
| `sw.js`, `manifest.json` | Modo sin conexión e instalación como app (PWA). |
| `icon.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | Iconos de la app (ya subidos al repositorio). Son opcionales para `sw.js`, pero `manifest.json` los referencia. |
| `proxy-worker.example.js` | Ejemplo de proxy (Cloudflare Worker) para usar IA sin exponer tu clave. Es el único archivo de proxy: la copia `proxy-worker_example.js` era idéntica y se eliminó. |
| `CONTINUIDAD.md` | Cuaderno de trabajo de Lumi, del movimiento y de la auditoría: qué se hizo en cada bloque, decisiones, pruebas y pendientes. Léelo antes de tocar `js/16-lumi*.js`. |

## Estructura del código
El antiguo `script.js` está dividido en archivos dentro de `js/`, en el mismo orden en que se cargan. Son scripts clásicos (no módulos), así que `index.html` sigue funcionando con doble clic. Las partes 01–15 son la app; las 16 son Lumi (arte + controlador), la 17 es el movimiento, la 18 el idioma y la 19 la copia automática a archivo.

| Archivo | Contenido |
|---|---|
| `js/01-base.js` | Base: modo demo, constantes (incluida `MASCOT_AVATARS`), utilidades y el objeto `state`. |
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
| `js/11-apariencia.js` | Apariencia: temas (incluido Cromo), acentos con contraste y preferencias; avisa a Lumi y al idioma con `sync`. |
| `js/12-copias-e-importacion.js` | Copias e importación: exportar, validar e importar copias, mazos y CSV/Anki. |
| `js/13-ajustes.js` | Ajustes: estilos rápidos, ambientes, ventana de Ajustes (casilla de Lumi, selector de apariencia e idioma), recordatorios y contexto del tutor. |
| `js/14-eventos.js` | Eventos: `renderAll`, manejadores, service worker y la API `window.Learny` (46 claves). |
| `js/15-inicio.js` | Inicio: bienvenida, portada, banner de la demo y arranque. |
| `js/16-lumi-eevee.js`, `16-lumi-walle.js`, `16-lumi-daniel.js`, `16-lumi-yor.js`, `16-lumi-gato.js`, `16-lumi-cc.js`, `16-lumi-alisa.js` | Solo el arte (SVG en pixel art) de cada apariencia de Lumi. Se cargan **antes** de `16-lumi.js`. |
| `js/16-lumi.js` | Lumi: la abeja pixelada (`lumiBeeSvg()`), el controlador `LumiCompanion`, estados, mensajes y reglas de frecuencia. |
| `motion.css` y `js/17-movimiento.js` | Movimiento de la interfaz (no de Lumi): tokens de duración, botones, modales, avisos; flashcards, listas (escalonado y borrado continuo), fundido cruzado entre páginas, velo al calificar y barras con la Web Animations API. Con movimiento reducido solo quedan fundidos de opacidad de 80–100 ms (sin desplazamientos ni escalas). |
| `js/18-idioma.js` | Idioma: inglés por defecto y español opcional (`settings.lang`). Diccionario es→en + reglas, traducción del DOM con `MutationObserver`, guía de uso en inglés, guía local del tutor en inglés y la IA responde en el idioma elegido. Botón EN/ES en la barra superior y selector en Ajustes → Apariencia. |

Reglas para tocarlos:
- **El orden de los `<script>` en `index.html` importa.** Lo que se ejecuta al cargar solo puede usar nombres definidos en archivos anteriores; lo demás (manejadores, funciones) se resuelve cuando se usa.
- **Comparten el ámbito global** (no hay `import`/`export`): un nombre de nivel superior (`const`, `let` o `function`) no se puede repetir entre archivos, y las variables compartidas (`exam`, `currentPage`, `rev`…) son las mismas en todos.
- `extras.js` no ve esos nombres: solo usa la API `window.Learny` (46 claves), que se crea en `js/14-eventos.js`.
- Si añades, quitas o renombras un archivo de `js/`, cámbialo también en la lista `CORE` de `sw.js` y sube `CACHE`. La lista debe ser igual que los `<script>` de `index.html`.
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
Abre `index.html` con doble clic. (El modo sin conexión/PWA solo se activa servida por `https://` o `localhost`.) Con `index.html?demo` ves Learny con datos de ejemplo, todo en memoria.

## Publicarla gratis en GitHub Pages
1. Crea un repositorio público en GitHub y sube **todos los archivos** (incluidos `js/`, `extras.js`, `manifest.json`, los iconos y `icon.svg`).
2. Settings → Pages → "Deploy from a branch" → rama `main`, carpeta `/ (root)` → Save.
3. En 1 o 2 minutos estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. Al publicar una versión nueva, sube también `sw.js` (cambia `CACHE` si modificas archivos; ahora es `learny-v81`).

## IA (opcional)
Hay dos formas; sin ninguna, Learny funciona con su guía local.
- **Clave propia:** cada persona pega su clave gratuita de Gemini en Ajustes (https://aistudio.google.com/apikey).
  Queda solo en su navegador y nunca se incluye en copias ni mazos. No la uses en un equipo compartido.
- **Proxy (recomendado en producción):** despliega `proxy-worker.example.js`, define `GEMINI_API_KEY` y
  `ALLOWED_ORIGIN` como secretos/variables y pega la URL del Worker en Ajustes → "URL de tu proxy".
  Con proxy activo no hace falta ninguna clave en el navegador. Opcionales: `MODEL` (por defecto `gemini-3.8-flash`) y un binding `RATE_LIMITER`.
  El Worker limita también el tamaño de peticiones sin `Content-Length`; si lo desplegaste antes de la v53, vuelve a desplegarlo.

Si Google cambia el nombre del modelo, se puede cambiar en Ajustes sin tocar el código. La demo nunca usa IA. Con el idioma en inglés, la IA recibe la instrucción de responder en inglés.

## Funciones principales
- **Hoy:** una acción recomendada con su motivo y como máximo dos alternativas; Pomodoro con intención, notas de distracción y ambientes (Biblioteca, Noche, Minimalista); misiones, meta diaria y racha con día de gracia.
- **Practicar:** repaso SM-2 con tres calificaciones (No lo sabía = 1, Dudé = 3, Fácil = 5; cada botón muestra en cuántos días volverá la tarjeta), modo examen, *Intercalar*, *5 minutos*, *Examen real*, *Crear con IA* con bandeja de revisión, tutor socrático o directo, Feynman, ruleta de temas, notas, lectura y dictado.
- **Biblioteca:** tarjetas archivadas, mazos iniciales y propios, importación de CSV/Anki y de mazos JSON con vista previa.
- **Planificar:** plan inverso por fases (comprensión → práctica → repaso → simulacro → revisión), reajuste si te atrasas con explicación, comprobación de carga y *Replanificar desde hoy*.
- **Reforzar:** seis indicadores honestos con su muestra y periodo (7 días, 30 días o todo), previsión de los repasos ya programados para los próximos 7 días, materias débiles y mini quiz; informe semanal en JSON o CSV.
- **Ajustes:** idioma, apariencia, tipografía, disposición, estudio y avisos, IA y datos/copias; casilla y selector de Lumi.
- **Apariencia:** temas Automático, Oscuro, Negro (OLED), Claro, Sepia, Alto contraste y **Cromo**; acento Cielo/Menta/Violeta/Ámbar/Rosa o personalizado con contraste 4,5:1; cinco **estilos rápidos** (Cuaderno, Lectura nocturna, Papel, Biblioteca, Enfoque).
- **Idioma:** inglés (predeterminado) o español, con botón EN/ES en la barra superior (en móvil, en Ajustes).
- **Portada, bienvenida y demo:** quien nunca entró ve una portada con «Probar Learny»; la bienvenida de 4 pasos es opcional.

## Atajos
`Espacio` revela · `1` `2` `3` califican · `P` inicia/pausa el Pomodoro · `Z` deshace · `Esc` cierra ventanas. `P` y `Z` ignoran la repetición de tecla.

## Rendimiento
Los resultados de cálculo se memorizan y solo se dibuja la sección visible; pensado para colecciones de miles de tarjetas (sin medición independiente). El historial de repasos se limita a 5 000 registros.
Los archivos no están minificados (se cachean al primer uso); si quieres, puedes pasarlos por `terser`/`lightningcss`.

## Pruebas
Solo hace falta para desarrollar (la app sigue sin instalación). Requiere Node.js:
```
npm install
npx playwright install chromium
npx playwright test
```
`tests/sm2.spec.js` prueba los intervalos de repaso (`nextSchedule()` / `schedule()`); `tests/copia-archivo.spec.js` prueba la copia automática a archivo con una API simulada. Usan `?demo`, así que nunca tocan datos reales.

## Estado y pendientes
- Cada bloque de Lumi, de movimiento y de la auditoría, con su lista de pruebas, está en `CONTINUIDAD.md`. Se probaron con Chromium headless (`?demo`, 1280, 390 y 320 px).
- **Fase 6 · red de seguridad (v68):** suite Playwright (`tests/`) y copia automática a un archivo (`js/19-copia-archivo.js`, solo en Chrome/Edge de escritorio). Ver `CONTINUIDAD.md`.
- **Siguiente:** decidir las Fases 7–10 tras probar la app con 3–4 estudiantes. Regla de proporción: cada novedad ornamental exige antes una mejora del núcleo de estudio.
- **Pendiente en navegador o dispositivo real:** lector de pantalla, alto contraste real del sistema operativo, movimiento reducido del sistema, varias pestañas, actualización del service worker en una instalación existente (hasta la v67), importar un JSON real desde el selector de archivos, nitidez de los personajes en pantallas de 1×, los seis temas a ojo y revisar cada sección en inglés buscando textos que sigan en español (se amplían en `EX`/`RULES` de `js/18-idioma.js`).
- **Límites conocidos:** `BUILTIN_DECK_NAMES` en `js/12-copias-e-importacion.js` duplica los nombres de `DECKS` de `extras.js` (hay que mantenerlos iguales); `learny.corrupt` y `learny.newer` guardan el texto original en el navegador, con la clave de Gemini si la había («Borrar todo» sí los elimina); con datos de una versión más nueva, esta versión es de solo lectura hasta que se actualice la app.
- Los comentarios de cabecera de `js/01` a `js/15` dicen «parte N de 15» y los de `js/16` «de 16»; es solo texto.

## Novedades

### v81 · Perfiles, etapa 3: accesibilidad en la bienvenida
En el paso «Personalizar» de la bienvenida hay un grupo «Accesibilidad» (tamaño de texto, lectura fácil y reducir animaciones) con vista previa en vivo; se guarda al pulsar «Terminar» y Omitir, × o Esc lo revierten. Los bordes de los controles de la bienvenida (opciones de perfil, tiempo, tamaño de texto, nombre y «Atrás») pasan a un contraste de al menos 3:1 en todos los temas (`--ui-edge`). Pruebas en `tests/accesibilidad-bienvenida.spec.js`, escritas pero no ejecutadas.

### v77 · Lumi: apariencia «Alisa Kujou»
Nueva apariencia de Lumi (`settings.mascotAvatar = 'alisa'`): una chica chibi de pelo plateado con ahoge, lazo rojo y uniforme, en pixel art (`js/16-lumi-alisa.js`, 62×96 celdas en rejilla 100×100) con poses propias (ojos, cabeza, lazo, ahoge y brazo) y reposo. Solo representación: sin cambios de lógica, textos ni esquema. Caché `learny-v77`.

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
