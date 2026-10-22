# Learny

App web de estudio: Pomodoro con descanso, flashcards con repaso espaciado (SM-2), método Feynman,
ruleta de temas, planificador inverso, estadísticas, un tutor socrático opcional con IA y **Lumi**,
un compañero de estudio opcional (abeja pixelada, Eevee, WALL·E o Daniel Carreon). Todo se guarda en el navegador de cada persona;
no hay cuentas ni servidor.

Versión actual del service worker: `learny-v47` · esquema de datos: `version: 4`.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html`, `style.css`, `motion.css`, `extras.js` y la carpeta `js/` (hoy 17 archivos más el arte de Lumi: Eevee y WALL·E) | La app completa (no necesita instalación ni compilación). `js/` reemplaza al antiguo `script.js`; ver «Estructura del código». |
| `sw.js`, `manifest.json`, `icon.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | Modo sin conexión e instalación como app (PWA) con sus iconos. |
| `proxy-worker.example.js` | Ejemplo de proxy (Cloudflare Worker) para usar IA sin exponer tu clave. |
| `CONTINUIDAD.md` | Cuaderno de trabajo de Lumi: qué se hizo en cada bloque, decisiones, reglas de frecuencia, pruebas y pendientes. Léelo antes de tocar `js/16-lumi.js`. |

## Estructura del código
El antiguo `script.js` está dividido en 16 archivos dentro de `js/`, en el mismo orden en que se cargan. Son scripts clásicos (no módulos), así que `index.html` sigue funcionando con doble clic. Las partes 01–15 son la app; la 16 es Lumi y se carga después de la 15.

| Archivo | Contenido |
|---|---|
| `js/01-base.js` | Base: Modo demo, constantes, utilidades y el objeto `state` (incluye `settings.mascot: true`). |
| `js/02-datos.js` | Datos: Tarjetas, migraciones, validación (`sanitizeSettings`), copias automáticas, datos de la demo y carga inicial. |
| `js/03-interfaz.js` | Interfaz base: Confirmación, guardado, avisos y deshacer, páginas, ventana modal, sonido. |
| `js/04-planificador.js` | Planificador: Plan inverso, tareas diarias y reajuste si te atrasas. |
| `js/05-temporizador.js` | Temporizador: Pomodoro, sincronización entre pestañas, racha y pantalla «Hoy». Emite `learny:timer`. |
| `js/06-hoy.js` | Hoy: Recomendación con motivo, saludo (`daysSinceActivity()`), cierre de sesión, «me cuesta arrancar» y cola del día. |
| `js/07-tarjetas.js` | Tarjetas: Repaso espaciado (SM-2), simulacro, formulario y biblioteca. |
| `js/08-analisis.js` | Análisis: Estadísticas por materia e informe. |
| `js/09-tutor-ia.js` | Tutor e IA: Guía local, prompts, Gemini (clave o proxy) y chats. |
| `js/10-revision-ia-y-temas.js` | Revisión de IA y temas: Bandeja de revisión, Feynman, temas y ruleta. |
| `js/11-apariencia.js` | Apariencia: Temas (incluido Cromo), acentos con contraste y preferencias; avisa a Lumi con `LumiCompanion?.sync`. |
| `js/12-copias-e-importacion.js` | Copias e importación: Exportar, validar e importar copias, mazos y CSV. |
| `js/13-ajustes.js` | Ajustes: Estilos rápidos, ambientes, ventana de Ajustes (con la casilla de Lumi), recordatorios y contexto del tutor. |
| `js/14-eventos.js` | Eventos: `renderAll`, manejadores, service worker y la API `window.Learny`. |
| `js/15-inicio.js` | Inicio: Bienvenida, portada, banner de la demo y arranque. |
| `motion.css` y `js/17-movimiento.js` | Movimiento de la interfaz (no de Lumi): tokens de duración, botones, modales, avisos; flashcards, listas, cambio de vista y barras con la Web Animations API. Todo vale 0 con movimiento reducido. |
| `js/16-lumi.js` | Lumi: la abeja pixelada (SVG generado por `lumiBeeSvg()`), controlador `LumiCompanion`, estados, mensajes y reglas de frecuencia. |
| `js/18-idioma.js` | Idioma: inglés por defecto y español opcional (`settings.lang`). Diccionario es→en + reglas, traducción del DOM con `MutationObserver`, guía de uso en inglés, guía local del tutor en inglés y la IA responde en el idioma elegido. Botón EN/ES en la barra superior y selector en Ajustes → Apariencia. |

Reglas para tocarlos:
- **El orden de los `<script>` en `index.html` importa.** Lo que se ejecuta al cargar solo puede usar nombres definidos en archivos anteriores; lo demás (manejadores, funciones) se resuelve cuando se usa.
- **Comparten el ámbito global** (no hay `import`/`export`): un nombre de nivel superior (`const`, `let` o `function`) no se puede repetir entre archivos, y las variables compartidas (`exam`, `currentPage`, `rev`…) siguen siendo las mismas en todos.
- `extras.js` no ve esos nombres: solo usa la API `window.Learny` (46 claves), que se crea en `js/14-eventos.js`.
- Si añades, quitas o renombras un archivo de `js/`, cámbialo también en la lista `CORE` de `sw.js` y sube `CACHE`. La lista debe ser igual que los `<script>` de `index.html`.
- `sw.js` trata `extras.js` y `manifest.json` como **imprescindibles**: si falta uno en el servidor, `cache.addAll` falla y el service worker no se instala. Sube siempre todos los archivos.
- Si ya tenías `script.js` publicado, bórralo del repositorio: ya no se usa.

## Lumi (compañero de estudio)
Lumi es una abeja pixelada que acompaña en momentos concretos; es **opcional** (activada por defecto) y no guarda datos propios: solo lee `state`/`timer` y respeta `settings.mascot`. Se activa o desactiva con la casilla «Compañero de estudio: Lumi» en Ajustes ⚙️ → *Disposición*, o con el «×» junto al personaje (con «Deshacer»). Desde la v37 es la única apariencia: la luciérnaga y el selector de apariencia se retiraron.

- **Dibujo:** sprite 40×40 en SVG (`BEE_MAP`, sin curvas, sin degradados, sin `id`, `shape-rendering="crispEdges"`) insertado por JS en `#lumi`. Tamaños múltiplos de la rejilla: 80 px en escritorio, 60 px en móvil (≤ 820 px) y 40 px durante un bloque de enfoque.
- **Estados y mensajes** (texto real, el dibujo es `aria-hidden`):
  - *Neutral*: «¿Empezamos con algo corto?», una vez por visita.
  - *Enfoque*: con el Pomodoro en marcha, sin mensajes ni animación.
  - *Celebrar*: «Bloque completado.» al cerrar la valoración de un bloque (en cualquier sección).
  - *Apoyo*: «Esta vuelve pronto. Sin prisa.» tras «No lo sabía» (en cualquier sección).
  - *Progreso*: si en la misma tarjeta pasaste de «No lo sabía» a «Fácil» (Práctica).
  - *Bienvenida*: tras 3 o más días sin actividad (sesiones o repasos, mismo criterio que el saludo).
  - *Vacío*: «Crea tu primera tarjeta para empezar.» al entrar en Práctica sin tarjetas.
- **Reglas de frecuencia** (en `LUMI_CONFIG`): mensaje visible 5 s; un solo mensaje proactivo por visita; 90 s mínimo entre apoyos y entre progresos; prioridad reacción > contexto > genérico; sin cola (una reacción en espera caduca a los 20 s); nada durante un examen, un bloque de enfoque, una ventana abierta, la portada o con la pestaña oculta.
- **Gestos** (solo CSS, un ciclo, sin esperar a `animationend`): salto y aleteo al celebrar, antenas al dar la bienvenida, inclinación/asentimiento/antenas en apoyo, progreso y vacío. Se anulan con movimiento reducido (del sistema o de Learny), con la pestaña oculta y en enfoque.
- **Accesibilidad:** las reacciones no se anuncian aparte (ya las cubren los avisos existentes); sin `alert` y sin mover el foco. Temas: oscuro, negro, claro, sepia, alto contraste y Cromo (con contorno propio para separar la abeja del fondo).
- **Datos:** solo existe `settings.mascot`. `sanitizeSettings` descarta la antigua clave `mascotAvatar`, así que guardados, copias e importaciones anteriores cargan sin error.
- **Eventos que usa** (ninguno nuevo para la app): `learny:timer`, `learny:pomodone`, `learny:rated`, `learny:examstart`, `learny:examend`, `learny:page`, `learny:render`.
- En `index.html` hay tres piezas suyas: `#lumi`, `#lumi-msg` y `#lumi-live` (región `aria-live` solo para lo que ningún aviso anuncia) dentro de `#lumi-dock`, un dock fijo visible en todas las secciones. `#lumi-msg-card` ya no existe.

## Probarla en tu computador
Abre `index.html` con doble clic. (El modo sin conexión/PWA solo se activa servida por `https://` o `localhost`.) Con `index.html?demo` ves Learny con datos de ejemplo, todo en memoria.

## Publicarla gratis en GitHub Pages
1. Crea un repositorio público en GitHub y sube **todos los archivos** (incluidos `js/`, `extras.js`, `manifest.json`, los iconos y `icon.svg`).
2. Settings → Pages → "Deploy from a branch" → rama `main`, carpeta `/ (root)` → Save.
3. En 1 o 2 minutos estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. Al publicar una versión nueva, sube también `sw.js` (cambia `CACHE` si modificas archivos; ahora es `learny-v47`).

## IA (opcional)
Hay dos formas; sin ninguna, Learny funciona con su guía local.
- **Clave propia:** cada persona pega su clave gratuita de Gemini en Ajustes ⚙️ (https://aistudio.google.com/apikey).
  Queda solo en su navegador y nunca se incluye en copias ni mazos. No la uses en un equipo compartido.
- **Proxy (recomendado en producción):** despliega `proxy-worker.example.js`, define `GEMINI_API_KEY` y
  `ALLOWED_ORIGIN` como secretos/variables y pega la URL del Worker en Ajustes ⚙️ → "URL de tu proxy".
  Con proxy activo no hace falta ninguna clave en el navegador. Opcionales: `MODEL` (por defecto `gemini-flash-latest`) y un binding `RATE_LIMITER`.

Si Google cambia el nombre del modelo, se puede cambiar en Ajustes sin tocar el código. La demo nunca usa IA.

## Funciones principales
- **Hoy:** una acción recomendada con su motivo y como máximo dos alternativas; Pomodoro con intención, notas de distracción y ambientes (Biblioteca, Noche, Minimalista); misiones, meta diaria y racha con día de gracia.
- **Practicar:** repaso SM-2 con tres calificaciones (No lo sabía = 1, Dudé = 3, Fácil = 5), modo examen, *Intercalar*, *5 minutos*, *Examen real*, *Crear con IA* con bandeja de revisión, tutor socrático o directo, Feynman, ruleta de temas, notas, lectura y dictado.
- **Biblioteca:** tarjetas archivadas, mazos iniciales y propios, importación de CSV/Anki y de mazos JSON con vista previa.
- **Planificar:** plan inverso por fases (comprensión → práctica → repaso → simulacro → revisión), reajuste si te atrasas con explicación, comprobación de carga y *Replanificar desde hoy*.
- **Reforzar:** seis indicadores honestos con su muestra y periodo (7 días, 30 días o todo), materias débiles y mini quiz; informe semanal en JSON o CSV.
- **Ajustes ⚙️:** apariencia, tipografía, disposición, estudio y avisos, IA y datos/copias; casilla de Lumi.
- **Apariencia:** temas Automático, Oscuro, Negro (OLED), Claro, Sepia, Alto contraste y **Cromo** (negro profundo y plata, acento fijo); acento Cielo/Menta/Violeta/Ámbar/Rosa o personalizado con contraste 4,5:1; cinco **estilos rápidos** (Cuaderno, Lectura nocturna, Papel, Biblioteca, Enfoque).
- **Portada, bienvenida y demo:** quien nunca entró ve una portada con «Probar Learny»; la bienvenida de 4 pasos es opcional.

## Atajos
`Espacio` revela · `1` `2` `3` califican · `P` inicia/pausa el Pomodoro · `Z` deshace · `Esc` cierra ventanas.

## Rendimiento
Los resultados de cálculo se memorizan y solo se dibuja la sección visible; pensado para colecciones de miles de tarjetas (sin medición independiente). El historial de repasos se limita a 5 000 registros.
Los archivos no están minificados (≈ 370 KB entre HTML, CSS y JS —`index.html` 42 KB, `style.css` 68 KB, `extras.js` 33 KB y `js/` 226 KB—; se cachean al primer uso); si quieres, puedes pasarlos por `terser`/`lightningcss`.

## Estado y pendientes
- Cada bloque de Lumi y su lista de pruebas están en `CONTINUIDAD.md`. Se probaron con Chromium headless (`?demo`, 1280, 390 y 320 px).
- **Pendiente en navegador o dispositivo real:** lector de pantalla, alto contraste real del sistema operativo, varias pestañas, actualización del service worker v36 → v37 en una instalación existente, importar un JSON real desde el selector de archivos, nitidez de la abeja en pantallas de 1× (a 60 px cada celda mide 1,5 px) y los seis temas a ojo.
- Los comentarios de cabecera de `js/01` a `js/15` dicen «parte N de 15» y el de `js/16` dice «de 16»; es solo texto, pero conviene unificarlo si se vuelve a tocar esos archivos.

## Novedades (v30 a v37 · Lumi y tema Cromo)
Las versiones 26 a 29 no están documentadas en los archivos de continuidad. Todo lo siguiente conserva el esquema `version: 4`, las claves de almacenamiento, los algoritmos de repaso y la API `window.Learny`.
- **v37 · Lumi solo con la abeja.** Se retiran la luciérnaga y el selector «Apariencia de Lumi». `GESTURE` activa también los gestos de apoyo, progreso y vacío. `sanitizeSettings` descarta `mascotAvatar`.
- **v36 · Abeja fiel a la referencia.** Sprite 40×40 redibujado celda a celda (985 de 986 celdas coinciden con la referencia), poses en CSS (aleteo, antenas, inclinación, asentimiento), alas translúcidas y contorno por tema. Tamaños 80/60/40 px.
- **v35 · Avatar «Abeja pixelada»** como alternativa seleccionable (`settings.mascotAvatar`), superado en la v37. Incluyó la corrección del «×» de Lumi en táctil (26 px visibles, 44 px de área de toque).
- **v34 · Tema Cromo.** Nueva opción en Ajustes, `body.theme-chrome`, acento fijo con nota, `THEME_META.chrome` y `theme-color` `#080808`; un tema inválido cae a Oscuro.
- **v33 · Pulido de Lumi** (Etapa C).
- **v32 · Contexto y progreso.** Estados PROGRESS, WELCOME y EMPTY con prioridades en tres niveles; `daysSinceActivity()` en `js/06-hoy.js` (misma fórmula que el saludo) es el único cambio fuera de Lumi.
- **v31 · Reacciones mínimas.** CELEBRATE y SUPPORT, espera única con caducidad y segundo slot de texto en Práctica (`#lumi-msg-card`).
- **v30 · Componente y ajustes.** `js/16-lumi.js`, casilla en Ajustes, estados NEUTRAL y FOCUS, evento `learny:timer`.

## Novedades (v25 · código dividido en archivos)
`script.js` se dividió en 15 archivos dentro de `js/` (hoy 16, con `16-lumi.js`) (ver «Estructura del código»). **No cambia el comportamiento ni los datos**: el código es el mismo, solo se repartió por secciones y se quitó la sangría extra de la función envolvente; esquema `version: 4`, mismas claves de almacenamiento y misma API `window.Learny` (46 claves). `sw.js` pasaba entonces a `learny-v25` y precacheaba los 15 archivos (hoy son 16, con Lumi).

## Novedades (v24 · etapas 5, 6 y 7, y revisión de fiabilidad)
**Etapa 5 · bienvenida.** La primera vez, una guía corta pregunta tu nombre, qué estudias, tu meta y cuánto tiempo quieres por bloque (10, 25 o 45 min). Todo es opcional y se puede saltar. Además, el botón «Hoy me cuesta arrancar» ofrece acciones pequeñas (repasar hasta 3 tarjetas, una sesión breve de 5 minutos, hacer una pregunta, explicar una idea) y cerrarlo no cambia nada.
**Etapa 6 · portada.** Quien nunca ha entrado (sin datos, sin bienvenida y sin enlace directo a una sección) ve primero una portada con «Probar Learny». Quien ya tiene datos entra directo a la app.
**Etapa 7 · demostración.** Abre `index.html?demo` para ver Learny con datos de ejemplo. Todo ocurre en memoria: no toca tus datos reales, no vibra, no descarga informes y el título de la pestaña empieza por «Demostración ·». El aviso superior permite salir o empezar de cero.
**Revisión de fiabilidad (fases 1 a 6).**
- *Datos:* copias automáticas rotativas, copia del archivo dañado, estadísticas y fechas más estrictas, importación más segura.
- *Avisos:* los avisos de arranque (migración, tarjetas omitidas, datos dañados) se muestran en cola sin pisarse; un aviso nuevo ya no cancela un «Deshacer» pendiente; Ajustes no se cierra si sueltas un arrastre fuera; Enter se ignora mientras se compone texto con IME; salir de un examen dentro de una sesión inteligente la cancela.
- *Infraestructura:* `sw.js` (entonces `learny-v25`) borra solo cachés que empiezan por `learny-`; `viewport-fit=cover`, alturas `dvh` y cabecera pegajosa bajo el aviso de demostración en móvil; menos anuncios repetidos para lectores de pantalla; iconos en los accesos directos del manifest.
- *Worker:* el límite se mide en caracteres, no en bytes, y devuelve el `Content-Type` de Google.
- *Textos:* SM-2 se explica como No lo sabía = 1, Dudé = 3, Fácil = 5.

## Novedades (v16 · apariencia y tipografía)
**Ajustes ⚙️ reorganizados** en bloques plegables: *Apariencia* (abierto), *Tipografía y lectura*, *Disposición*, *Estudio y avisos*, *Inteligencia artificial* y *Datos y copias*. No se quitó ningún ajuste.

- **Apariencia:** tema Automático (sigue `prefers-color-scheme` y reacciona a sus cambios), Oscuro, Negro (OLED), Claro, Sepia y Alto contraste; acento Cielo/Menta/Violeta/Ámbar/Rosa o **personalizado** (se mezcla con blanco o negro hasta llegar a 4,5:1 sobre las superficies del tema y con su texto); esquinas, tarjetas con borde o sombra, fondo cuadriculado/puntos/liso y densidad. Cuatro **estilos rápidos** (Cuaderno, Lectura nocturna, Papel, Enfoque) y *Restablecer apariencia*.
- **Tipografía (solo fuentes del sistema, no se carga nada externo):** Sistema, Humanista, Serif de lectura, Redondeada, Monoespaciada y Lectura fácil; títulos en serif o como el texto; tamaño de 13 a 24 px (A−/A+ comparten el rango); interlineado, espaciado de letras y tamaño del texto de las tarjetas.
- **Disposición:** ancho del contenido (1000/1240/1600 px), menú lateral de solo iconos en escritorio (con tooltip; el texto sigue en el DOM), mostrar u ocultar misiones y dato curioso.
- **Vista previa en vivo:** cada cambio se aplica al instante, pero solo se guarda con *Guardar preferencias*; cerrar con la X, `Esc` o fuera de la ventana revierte.
- **Código:** `applyAppearance()` solo toca estilos; `applyPreferences()` además rellena los campos del tutor. La sincronización entre pestañas, la vista previa y A−/A+ usan solo la primera, así que no pisan lo que escribes en el tutor.
- **Datos:** ajustes nuevos en `state.settings` con valores por defecto; `sanitizeSettings` solo acepta valores de listas permitidas, rangos numéricos y un color `#rrggbb`, también al importar copias (una copia ajena no puede inyectar CSS). Esquema `version: 4`, sin migraciones; las copias antiguas siguen cargando. `sw.js` pasa a `learny-v16`.

## Novedades (v15 · etapa 6A: reducir la complejidad visible)
Esta entrega cubre la pantalla *Hoy*, el modo sesión y los bloques plegables (6A) y la revisión de móvil y teclado (6B, al final de esta sección).

**Hoy: una acción, su motivo y dos alternativas**
- *Hoy* muestra una **acción recomendada** con su botón y un **«Por qué»** calculado con tus datos, p. ej.: «Te sugerimos repasar estas 6 tarjetas porque están vencidas y pertenecen a «Parcial», que es el miércoles».
- Debajo, **como máximo dos alternativas** con su propio motivo y botón («O elige otra opción»). Prioridad: tarjetas de hoy → plan de examen → tarjetas falladas → materia más débil → crear tarjetas → bloque de enfoque → añadir fecha → Feynman.
- **Más opciones** (plegado): sesión inteligente y Feynman. El resto de *Hoy* (misiones, progreso, dato curioso) está en **Más sobre hoy**; etiqueta del bloque, meta diaria y *Ajustar tiempos*, en **Opciones del bloque**.
- La tarjeta no se redibuja si no cambia nada, así que no pierdes el foco ni se cierra «Más opciones».

**Usuario nuevo**
- Sin datos, *Hoy* muestra un único primer paso («Crea tu primera tarjeta») y dos alternativas (mazo de ejemplo o añadir la fecha de un examen). El Pomodoro y las misiones aparecen cuando hay datos, o al pulsar «Probar un Pomodoro sin tarjetas» en Más opciones.

**Solo lo necesario en cada momento**
- Durante un **bloque de enfoque** (*Hoy*) y durante un **examen/repaso en modo examen** (*Practicar*) solo se ve la actividad actual y sus controles. Al terminar, reiniciar o salir, todo vuelve.
- Lo avanzado sigue ahí, a un clic: *Practicar → Más formas de repasar* (Modo examen, Intercalar, 5 minutos, Examen real, Crear con IA) y *Más herramientas de práctica* (ruleta, notas, lectura); dictado de Feynman en *Más opciones*; *Biblioteca → Mazos iniciales y mazos propios*; *Planificar → Informe de examen*; *Reforzar → Más datos*; Contexto del tutor, solo en *Practicar*; *Ajustes → Ajustes avanzados* (ruleta, clave de Gemini, modelo y proxy).
- Si un campo inválido está dentro de un bloque plegado, el bloque se abre solo para poder corregirlo; un borrador guardado también abre su bloque.

**6B · Móvil (320, 360 y 390 px)**
- Sin desbordamiento horizontal en las 6 secciones (también con el texto al máximo, A+), áreas táctiles de al menos 44 px (incluido el enlace de comentarios, las opciones 1–5 de concentración y el enlace «Saltar al contenido»).
- La barra inferior mide su altura real: el contenido ya no queda tapado al final de la página, y el temporizador flotante y los avisos se colocan encima de ella sin solaparse entre sí.
- Durante un bloque de enfoque el reloj y los botones (Pausar, Reiniciar) quedan fijos a la vista incluso en pantallas bajas; en pantallas pequeñas se oculta la barra del tutor mientras dura el bloque. Fuera de *Hoy*, el temporizador sigue accesible en la píldora flotante.
- Cabecera sin solapes a 320 px; el control enfocado nunca queda bajo la cabecera ni la barra inferior.

**6B · Teclado y accesibilidad**
- Recorrido principal solo con teclado: planificar, iniciar Pomodoro (**Enter** en «Resultado concreto» también lo inicia), revelar y calificar, crear tarjeta e importar. *Importar JSON/CSV* ahora son botones (antes eran etiquetas con un campo oculto que el teclado no alcanzaba).
- Las ventanas tienen título asociado, el foco entra en el primer campo (en el móvil, en el título, para no abrir el teclado), **Esc** las cierra y al cerrar el foco vuelve al botón que las abrió (o a su equivalente si el botón se redibujó).
- Al revelar o calificar una tarjeta el foco pasa al siguiente control útil en lugar de perderse.
- Los avisos normales se anuncian con `role="status"` y los errores con `role="alert"` (inmediato); el aviso del planificador y el grupo de calificación tienen su rol y etiqueta; foco visible en todas las paradas de tabulación y todos los controles con nombre accesible.

**Sin cambios en los datos**: esquema `version: 4`, sin migraciones nuevas; `sw.js` pasa a `learny-v15`.

## Novedades (v14 · etapa 5: planificador transparente, importación con vista previa y varias pestañas)
**Planificador**
- Cuando te atrasas, Learny sigue moviendo a hoy las 2 tareas atrasadas más recientes de cada examen y descartando las anteriores, pero ahora **lo explica**: el aviso dice cuántas movió y cuántas descartó, y el bloque **Cambios en tu plan** (Planificar) lista cada tarea con su fase y su fecha original, y las horas que representan las descartadas.
- Cada fecha indica **si lo que queda todavía cabe**: compara el trabajo pendiente (tareas abiertas de hoy en adelante más las descartadas) con las horas disponibles hasta el examen. Si no cabe, lo dice con las cifras y propone cuántos minutos diarios harían falta; además aparece una alerta arriba.
- **Replanificar desde hoy**: recalcula las tareas hasta el examen con los minutos que elijas (conserva lo completado antes de hoy, recupera las sesiones descartadas) y se puede **deshacer** (botón o `Z`).

**Importar con vista previa**
- CSV/Anki, mazos JSON y copias completas muestran antes de tocar nada: cuántas tarjetas son nuevas, posibles duplicadas (ya en tu colección o repetidas en el archivo) y con errores, con el motivo y el número de registro. Botones **Importar N válidas** o Cancelar; si no hay nada válido, solo «Cerrar».
- En una copia completa se compara con lo que tienes ahora («4 tarjetas, ahora: 6») y se avisa de las tarjetas dañadas y las fechas inválidas antes de reemplazar.
- Importar un mazo ya no reinicia un Pomodoro en marcha.

**Varias pestañas**
- El temporizador se **sincroniza** entre pestañas (iniciar, pausar, reanudar, reiniciar) y abrir una pestaña nueva ya no borra el bloque en marcha.
- Cuando un bloque termina, **solo una pestaña lo registra** (Web Locks + marca de ejecución; una pestaña oculta cede unos 1,2 s a la visible). La otra recibe la sesión y queda lista para el descanso.
- Los **datos se sincronizan** entre pestañas: guardar en una ya no pisa con una copia vieja lo guardado en otra. Al volver a una pestaña también se comprueba. Un examen en curso conserva sus tarjetas.
- Aviso: si Learny está en dos navegadores o perfiles distintos, no comparten datos (cada uno tiene su almacenamiento).

## Novedades (v13 · etapa 4: bandeja de revisión de tarjetas)
- Las tarjetas generadas con IA (y las sugeridas desde una explicación o una respuesta del tutor) pasan por una **bandeja de revisión**: pregunta y respuesta editables, y cada tarjeta se **acepta o descarta** explícitamente. Nada se guarda por defecto.
- «Crear con IA» admite **tus apuntes**: cada tarjeta cita el fragmento del que sale. Se avisa (⚠) cuando el fragmento citado no está en tus apuntes o cuando parte de la respuesta no aparece en ellos (se vuelve a comprobar al editar). Sin apuntes se indica «sin fuente: verifícala».
- Las tarjetas aceptadas desde IA llevan la marca «generada con IA y revisada» en la Biblioteca.

## Novedades (v12 · etapa 3: tutor y Feynman)
- **Modo del tutor** persistente (Contexto del tutor): «Guíame con preguntas» o «Dame una explicación directa». Además, cada respuesta ofrece «Explícamelo directamente» y el tutor socrático da la explicación si la pides.
- **Feynman con comentarios concretos:** la IA responde en cuatro bloques (lo que explicaste bien, afirmación a revisar con cita de tu texto, concepto que falta, pregunta para comprobar), sin nota numérica.
- **Errores recuperables:** si la IA falla, tu pregunta o explicación se conservan (la pregunta del tutor se borra solo tras una respuesta correcta y se guarda como borrador), hay botón **Reintentar** y el historial solo guarda respuestas reales de la IA, no las guías locales de emergencia.
- **Cancelar de verdad:** una consulta cancelada o sustituida por otra nunca escribe una respuesta tardía ni cierra la ventana de la consulta nueva.

## Novedades (v11 · etapa 2: estadísticas honestas)
- «Retención» pasa a **Recuerdo declarado** (repasos marcados «Fácil»): es autoevaluación, no una medida de retención.
- Cada cifra muestra su muestra («7 de 10 repasos») y avisa de «muestra pequeña» con menos de 10 intentos.
- **Periodo** seleccionable (7 días, 30 días, todo el historial; por defecto 30) y un bloque «Cómo se calculan estos números».
- Seis indicadores: recuerdo declarado, repasos sin fallar, exámenes, constancia (días con actividad), tiempo registrado y tarjetas vencidas.
- Una materia no se califica con menos de 5 repasos; la antigua insignia «Dominio básico» pasa a «Buen resultado» (30 repasos y 80 % sin fallar) con aviso de que falta comprobarlo. El informe semanal exporta `recuerdoDeclarado` con su muestra.

## Novedades (v10 · etapa 1: protección contra errores)
- **Deshacer** (botón en el aviso o tecla `Z`, ~8 s) al calificar una tarjeta (también en exámenes), eliminarla, posponerla, enviarla a la Biblioteca, completar/reabrir una tarea y eliminar una fecha con su plan. Sustituye a las ventanas de confirmación en esas acciones; las confirmaciones se conservan para importar, restaurar y «Borrar todo».
- **Dobles pulsaciones:** una calificación ignora repeticiones en menos de 350 ms y, en el examen, no se puede calificar sin haber revelado la respuesta.
- No se puede eliminar una tarjeta que forma parte de un examen en curso.

## Correcciones (v9)
- **iPhone con iOS < 16.4:** `extras.js` ya no se rompe (se quitó una expresión regular y `.at()` que ese Safari no entiende).
- **Importar copias:** los ajustes se validan (tipos, rangos, valores permitidos) y una copia ajena nunca cambia tu URL de proxy.
- **Tutor:** el historial se guarda por materia (máx. 20 temas), «Borrar historial» borra lo que se ve, las copias automáticas no incluyen el historial, y estilo/carrera del tutor se conservan.
- **Avisos:** en Android se muestran vía service worker; el recordatorio diario sale una vez al día, no en cada recarga.
- **Plan de emergencia:** usa los últimos 3 días *antes* del examen (el simulacro es el día previo); si el examen es hoy, solo repaso ligero.
- **Sesión inteligente:** cerrar una ventana cancela el flujo y ya no aparece «Paso 3 de 3» tras un Pomodoro normal.
- **Adelantar 5 tarjetas** ya no repite las que repasaste hoy; el calendario semanal se actualiza al tachar tareas o borrar fechas.
- **CSV / Anki:** sin duplicados al importar dos veces, límite de 5 MB, confirmación previa, `#separator`, detección de tabuladores y limpieza de HTML (`<br>` → salto de línea).
- **Compartir mazo** incluye también las tarjetas de la Biblioteca. El CSV semanal neutraliza celdas que empiezan por `=`, `+`, `-` o `@`.
- **IA:** tope de respuesta 4096 tokens y mensaje claro si el modelo lo agota.
- **Sin conexión:** los iconos son opcionales; si falta uno ya no falla toda la caché.
- **Privacidad:** el pie de página avisa de que el dictado usa el servicio de tu navegador; el idioma de dictado sigue el del navegador.
- **Detalles:** «Reiniciar a mitad de bloque» (antes «Guardar y pausar»), bloques sin cerrar ya no cuentan como logrados, la respuesta de la tarjeta no se oculta al terminar un Pomodoro, importar/borrar/restaurar cierra un examen en curso, y el color de acento se desactiva en Sepia y Alto contraste.

## Correcciones (v8)
- Sin `Notification` (p. ej. Safari de iPhone) ya no se rompe el fin de bloque ni el arranque.
- Abrir una ventana justo después de cerrar otra ya no cancela la consulta a la IA ni ejecuta su `onClose` antes de tiempo.
- Si falla la IA en «Generar estudio», se conserva el resumen local.
- Las fechas de examen admiten hasta 2 años; antes una fecha lejana podía congelar el navegador.
- SM-2: «No lo sabía» ya no hunde el factor de facilidad, y repasar antes de tiempo una tarjeta que sabes no adelanta su calendario.
- Los prompts conservan saltos de línea y admiten hasta 9 000 caracteres (el proxy igual); las tarjetas conservan sus saltos de línea.
- Las tarjetas sugeridas son huecos para completar (la pregunta ya no contiene la respuesta) y se crean a petición, sin tapar la guía.
- Ruleta, atajos con confirmación abierta, cronómetro del Examen real y dictado (doble clic) corregidos.
- Importar CSV/Anki: comillas escapadas, campos de varias líneas, separadores coma/punto y coma/tabulación y archivos `.txt`.
- Mazos propios incluidos al compartir y al importar un mazo.
- Proxy: varios orígenes, límite de uso y saltos de línea conservados.
- Iconos PNG (192, 512, maskable) y `apple-touch-icon` para instalar la app.

## Novedades (v7)
**Flujo diario**
- Pantalla *Hoy* con saludo, resumen ("Tienes 8 tarjetas para hoy y Parcial en 4 días") y qué lograste la última vez.
- **Siguiente mejor acción**, calculada con reglas simples: tarjetas vencidas → plan de examen → materia débil → crear material.
- **Sesión inteligente**: repaso de tarjetas y errores → un Pomodoro → pregunta Feynman.
- Estadísticas con una acción al lado (repasar errores, mini quiz de la materia débil, meta semanal, racha).

**Fiabilidad**
- El temporizador sobrevive a recargas y sigue visible (píldora flotante) al cambiar de sección.
- Indicador "Guardado" real, datos dañados conservados en `learny.corrupt`, y cada sección se aísla si falla.
- Importación validada (estructura, tipos y versión), copia automática antes de importar/borrar,
  descarga de respaldo antes de "Borrar todo" y botón para restaurar la copia automática.
- Esquema de datos `version: 4` con **migraciones reales** (v1→v2→v3→v4: nombres de campo antiguos, ids únicos, tareas huérfanas, prefijos repetidos). Antes de migrar se guarda una copia que puedes restaurar en Ajustes ⚙️.
- **Tarjetas dañadas**: ya no se descartan en silencio; se conservan y muestran «Esta tarjeta no se pudo cargar» (en el repaso y en la Biblioteca) con opciones para editarlas, posponerlas o eliminarlas. Se excluyen de los exámenes.
- **Ventanas de confirmación propias** (en lugar de las del navegador) para borrar tarjetas, fechas o todos los datos, importar y restaurar; con foco en *Cancelar* en las acciones destructivas.

**Tutor con IA**
- Estados claros, botón **Cancelar**, límite de entrada/salida y mensajes de error accionables.
- Tras cada respuesta: *Explicar más simple*, *Dame un ejercicio*, *Crear tarjetas* (y *Guardar en notas*).
- **Crear tarjetas con IA** desde Practicar o desde el estado vacío.

**Móvil y accesibilidad**
- Barra inferior de 5 destinos con los mismos nombres que el menú lateral (la Guía está en el botón 📖), ventanas como hojas inferiores, áreas táctiles ≥ 44 px, temporizador siempre accesible.
- Corregido un desbordamiento que hacía que la página se viera más ancha que la pantalla en móviles.
- Campos con **etiqueta visible** (el buscador del tutor usa una etiqueta solo para lectores de pantalla), sin `aria-label` duplicados.
- Sistema de diseño aplicado a todo el CSS: espaciado 8/16/24/32 px, 4 tamaños de texto (cuerpo, subtítulo, título, número) más uno de pie de texto, 2 radios (tarjetas y controles; píldoras y círculos son excepciones) y colores de error/éxito/aviso.
- Foco visible, `aria-live` en resultados, atajos que también funcionan con un botón enfocado, `Esc` cierra ventanas
  y se respeta `prefers-reduced-motion`.

**Correcciones**
- *Salir del examen* (antes no había forma de abandonarlo) y la pausa a mitad de bloque ya no se duplica ni se reinicia al cancelar.
- Las tareas atrasadas ya no acumulan el prefijo "Recuperar:" ni inundan el día de hoy.
- Las fechas pasadas ya no se pueden crear (generaban un plan vacío); borrar una fecha pide confirmación.
- La meta semanal compara minutos con minutos; el AudioContext del aviso ya no se acumula.
- `sw.js`: solo cachea respuestas correctas, usa la caché si la red tarda más de 4 s y avisa al actualizarse.

