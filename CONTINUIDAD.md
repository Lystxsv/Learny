# CONTINUIDAD · Lumi (compañero de estudio)

Estado del trabajo de la mascota Lumi sobre Learny. Cada bloque parte de la última versión aceptada y conserva todo lo anterior.

## Bloques completados
- **Bloque 1 · Componente y ajustes** (`learny-v29` → `learny-v30`).
- **Bloque 2 · Reacciones mínimas** (Etapa A; `learny-v30` → `learny-v31`).
- **Bloque 3 · Contexto y progreso** (Etapa B; `learny-v31` → `learny-v32`).
- **Etapa C (pulido)**: `sw.js` quedó en `learny-v33` (base recibida para el trabajo del avatar).
- **Tema Cromo** (`cromo-tema.patch`; `learny-v33` → `learny-v34`): aplicado y verificado, ver «Tema Cromo» abajo.
- **Avatar · Retirada de la luciérnaga + gestos activados** (`learny-v36` → `learny-v37`): Lumi queda SOLO con la «Abeja pixelada». Ver sección «Retirada de la luciérnaga (v37)» abajo.
- **Avatar · Bloque 2 «Abeja fiel a la referencia + poses»** (`learny-v35` → `learny-v36`): sprite 40×40 redibujado desde la referencia y poses en CSS, ver «Avatar · Bloque 2» al final.
- **Avatar · Bloque 1 «Abeja pixelada»** (`learny-v34` → `learny-v35`): avatar y selector, ver «Avatar alternativo» abajo. Superado por el Bloque 2 (abajo).

## Archivos modificados
### Bloque 1
- `js/16-lumi.js` (nuevo), `js/01-base.js` (`mascot: true`), `js/02-datos.js` (`mascot` en `sanitizeSettings`), `js/05-temporizador.js` (`emitTimerState` → `learny:timer`), `js/11-apariencia.js` (`LumiCompanion?.sync` en `applyAppearance`), `js/13-ajustes.js` (casilla «Compañero de estudio: Lumi»), `index.html` (slot de Inicio), `style.css` (bloque «Lumi · parte 16»), `sw.js`.
### Bloque 2 (solo estos cinco)
- `js/16-lumi.js` — reacciones, prioridad, espera única con caducidad y limpieza. **No se tocó ningún otro `.js`**: todo se apoya en eventos existentes (`learny:pomodone`, `learny:rated`, `learny:examstart/end`, `learny:page`).
- `index.html` — `<span id="lumi-msg-card" class="lumi-msg-card" data-on="false" hidden>` dentro de `.head-inline`, junto a `#card-count` (Práctica). Solo texto, sin segunda mariposa ni segunda región `aria-live`.
- `style.css` — estilos del slot (mismo fade; incluido en las reglas de movimiento reducido y en `body.session-study`).
- `sw.js` — `CACHE` `learny-v31`.
- `CONTINUIDAD.md`.

### Bloque 3
- `js/16-lumi.js` — PROGRESS, WELCOME, EMPTY, prioridades en tres niveles y gesto breve de un ciclo.
- `js/06-hoy.js` — **único cambio fuera de Lumi**: el cálculo de actividad del saludo se extrae a `daysSinceActivity()` (misma fórmula, misma salida) y lo usan `renderGreeting` y Lumi, para que WELCOME y el saludo no puedan divergir.
- `style.css` — dos gestos (`lumi-hop`, `lumi-wave`) sobre `.lumi-svg`; los anulan las reglas existentes de movimiento reducido.
- `sw.js` — `learny-v32`. `index.html` sin cambios.

No se tocaron: `window.Learny`, eventos `learny:*` existentes, claves de almacenamiento, algoritmos de repaso, registro de sesiones ni lógica del temporizador.

## Estados implementados
- **NEUTRAL** (bloque 1): mensaje «¿Empezamos con algo corto?» una vez por visita; no a usuarios nuevos.
- **FOCUS** (bloque 1): temporizador de enfoque en marcha → sin mensajes, sin animación, luz tenue. Ahora también descarta cualquier reacción en espera.
- **CELEBRATE**: «Bloque completado.» en el slot de Inicio. Se dispara con `learny:pomodone` (que sale al cerrar la valoración) tras un tick; toma la última sesión no abandonada de hoy y usa su `id` (`Set` en memoria) para no celebrar dos veces. Como `showClosure` abre otra ventana justo después, la reacción queda en espera y aparece al cerrarla.
- **SUPPORT**: «Esta vuelve pronto. Sin prisa.» en el slot de Práctica tras «No lo sabía». Se lee `state.reviews.at(-1)` un tick después de `learny:rated`; ignora exámenes (`exam` activo en el momento del evento, o `rv.exam`). No promete intervalo.
- **PROGRESS**: «En el repaso anterior marcaste «No lo sabía»; esta vez, «Fácil».» en el slot de Práctica. Solo si las dos últimas entradas de `card.history` de **esa** tarjeta son `again` → `easy` (se lee un tick después de `learny:rated`; ignora exámenes). No dice «sin pistas» ni afirma dominio. Una vez por repaso y mínimo 90 s entre mensajes (`progressCooldownMs`).
- **WELCOME**: «Bienvenido de nuevo. Podemos empezar con algo corto.» en Inicio si `daysSinceActivity() >= 3` (mismo criterio que el saludo: sesiones no abandonadas **y** repasos, fechas reales y locales). Sin actividad previa (usuario nuevo) no aplica; abrir sin estudiar no cuenta como actividad. Sustituye al neutro.
- **EMPTY**: «Crea tu primera tarjeta para empezar.» al entrar en Práctica si `state.cards.length === 0` (quien tiene tarjetas archivadas no es «primera tarjeta»). No añade material ni abre flujos: los botones de ejemplo siguen en el estado vacío de la tarjeta.
- **Gestos** (solo CSS, 400 ms, un ciclo, `transform`): salto en CELEBRATE y saludo en WELCOME. SUPPORT/PROGRESS/EMPTY no tienen gesto porque ocurren en Práctica, donde el personaje no está visible. Se limpian por temporizador, nunca por `animationend`, y no se ejecutan con movimiento reducido, pestaña oculta o FOCUS.

## Reglas de frecuencia (centralizadas en `LUMI_CONFIG`)
- Mensaje visible 5 000 ms (`messageMs`); entrada 300 ms (`enterMs`).
- **Visita** = una carga de página, o volver tras ≥ 30 min con la pestaña oculta (`visitGapMs`).
- Máximo **un** mensaje proactivo (WELCOME, NEUTRAL o EMPTY, el que corresponda a la página) por visita, evaluado a los 900 ms. Una reacción mostrada cuenta como la intervención de la visita (`visitUsed = true`): el mensaje proactivo no llega justo detrás.
- Neutro: no con sesión empezada, ventana abierta, portada, pestaña oculta ni examen.
- **SUPPORT**: mínimo 90 s entre dos mensajes de apoyo (`supportCooldownMs`), medido desde el último **mostrado**; varios fallos seguidos no hablan cada vez. Un repaso se evalúa una sola vez.
- **Prioridad** (`LUMI_PRIO`): reacción (3: CELEBRATE, SUPPORT, PROGRESS) > contexto (2: WELCOME, EMPTY) > genérico (1: NEUTRAL). Un mensaje no interrumpe a otro de mayor prioridad; una reacción reemplaza a otra reacción. **Sin cola**.
- Entre proactivos de la misma página: en Inicio WELCOME antes que NEUTRAL; EMPTY solo en Práctica. FOCUS, examen, ventana abierta, portada y pestaña oculta bloquean todo.
- **En espera**: una sola reacción como máximo, caduca a los 20 s (`pendingTtlMs`). Se reintenta al cerrar ventanas, al cambiar de página y al volver a la pestaña. CELEBRATE solo se ve en Inicio y SUPPORT solo en Práctica; si el usuario está en otra página se espera hasta caducar.
- Ninguna reacción durante un examen ni durante FOCUS (se descartan, no se encolan).
- Limpieza: al desactivar Lumi, al entrar en FOCUS, al empezar/terminar un examen, al ocultar la pestaña y al cambiar a una página que no es la del mensaje.
- `welcomeAfterDays` (3) ya en uso; `reactMs` (400) para los gestos; `progressCooldownMs` (90 s).

## Decisiones aprobadas
1. `settings.mascot` activada por defecto, con «Ocultar a Lumi» a la vista (con «Deshacer»).
2. FOCUS mediante el evento `learny:timer`.
3. WELCOME usará el mismo criterio que el saludo actual (sesiones **y** repasos).
4. Reacciones de repaso: segundo slot junto a `#card-count` en Práctica (solo texto) y ninguna reacción durante un examen.
5. (Etapa A) Los 90 s de SUPPORT son un mínimo entre mensajes de apoyo.

## Accesibilidad y temas
- SVG con `aria-hidden`; mensajes en texto real. `#lumi-live` solo para información que ningún toast anuncie: **las reacciones del bloque 2 no se anuncian** (CELEBRATE ya lo anuncia `announce('Bloque completado…')` y SUPPORT va junto al toast «Volverá en…»). Sin `alert`, sin mover el foco.
- Temas: oscuro, OLED, claro, sepia, alto contraste y **Cromo** (automático hereda de oscuro/claro; nunca elige Cromo). Cromo ya existe: `body.theme-chrome`.
- Movimiento: `.reduce-motion`, `prefers-reduced-motion` y pestaña oculta detienen animaciones; la lógica nunca espera a `animationend`.

## Pruebas realizadas (Chromium headless con `?demo`)
Bloque 1: carga sin errores, mensaje neutro, FOCUS/pausa, ocultar/deshacer, casilla de Ajustes, cinco temas y móvil (ver versión anterior).
Bloque 3 (1000 px, `?demo`; la «visita nueva» se simula ocultando la pestaña y avanzando `Date.now()` 31 min):
- WELCOME con 5 días de ausencia (sustituye al neutro, gesto activo y luego limpio, el saludo muestra «han pasado 5 días»); con 2 días sale el neutro; un solo proactivo por visita.
- EMPTY en Práctica con 0 tarjetas (no añade nada); con solo tarjetas archivadas no sale.
- PROGRESS con `again` → `easy` en la misma tarjeta; `easy` tras `easy` no; el segundo dentro de 90 s no; SUPPORT visible en una visita nueva.
- CELEBRATE real con gesto `celebrate`. Regresión de las pruebas del bloque 2: correctas. Sin errores de página (único 404: `extras.js`, ajeno).
Bloque 2 (1000 px y 390 px):
- CELEBRATE real: `completePhase()` → valoración → cierre; sin mensaje mientras hay ventana; aparece al cerrar; caduca a los 5 s; reenviar `learny:pomodone`, `learny:render` y `learny:page` no lo repite.
- SUPPORT: aparece en Práctica (no en Inicio) tras «No lo sabía» (`again`); caduca a los 5 s; segundo fallo < 90 s sin mensaje; con +95 s vuelve a hablar; «Fácil» no dispara.
- Examen: `again` dentro de un examen no produce mensaje.
- En espera: reacción con otra página activa aparece al volver (< 20 s) y se descarta pasados 20 s.
- FOCUS en marcha: sin reacción. Cambiar de página limpia el slot. Desactivar/reactivar oculta y restaura ambos slots.
- Móvil 390 px: el slot pasa a una segunda línea bajo el título, sin desbordamiento horizontal.
- Sin errores de página. Único 404: `extras.js` (no incluido en el entorno de prueba, ajeno a Lumi).

## Pendientes de prueba (bloque 4)
Gestos con movimiento reducido del sistema y de Learny (hoy solo garantizado por las reglas CSS existentes), teclado y lector de pantalla, movimiento reducido del sistema, recarga con enfoque en marcha, varias pestañas, actualización PWA real (`v30` → `v31`), 320 px, importación de copias con/sin `mascot`, «Borrar todo», alto contraste en dispositivo real, desactivar durante una animación.

## Riesgos conocidos
- Con Lumi activa la cabecera de Inicio pasa a dos columnas (solo con `body.has-lumi`).
- Si se pulsa «Deshacer» sobre un «No lo sabía», el mensaje de apoyo ya mostrado sigue 5 s (no dice nada falso).
- CELEBRATE se pierde si, al cerrar el cierre del bloque, el usuario no está en Inicio dentro de 20 s (por diseño: sin cola).
- `lastSupportAt` y el `Set` de sesiones celebradas viven en memoria: al recargar se reinician (aceptable: ni `pomodone` ni `rated` se repiten).

- WELCOME repite en parte lo que ya dice el resumen de Inicio («Bienvenido de vuelta…»); el texto de Lumi es el del prompt original.
- PROGRESS tras «Deshacer»: el mensaje ya mostrado sigue 5 s.
- Un usuario con 0 tarjetas pero con sesiones recibe EMPTY en Práctica y neutro en Inicio (visitas independientes por página).

## Próximo bloque
**Bloque 4 · Pruebas y pulido (Etapa C)**: móvil (320 y 390 px) en dispositivo, teclado, lector de pantalla, alto contraste del sistema, pausar/reanudar, recarga con enfoque en marcha, varias pestañas, actualización PWA real (v35 → v36), importación de copias con/sin `mascot`, regresiones en Hoy, Práctica y Ajustes. El Bloque 2 del avatar está hecho.


## Tema Cromo (parche `cromo-tema.patch`, base `learny-v33` → `learny-v34`)
- Archivos: `index.html` (texto de la guía), `style.css` (bloque `.theme-chrome` y `.theme-chrome .lumi`), `sw.js` (`learny-v34`), `js/02-datos.js` (`'chrome'` en `s.theme`), `js/11-apariencia.js` (`THEME_META.chrome` y clase `theme-chrome`), `js/13-ajustes.js` (opción «Cromo», acento fijo y nota `#accent-note`).
- Lumi en Cromo: grises plateados, sin amarillo (`--lumi-glow` `#e6e6e6`).
- Verificado en Chromium (`?demo` y datos reales): la opción aparece, la vista previa aplica `theme-chrome`, guardar y recargar lo conserva, un tema inválido cae a `dark`, el acento queda deshabilitado con su nota, sin desborde a 390 px y sin errores de página.
- Para el avatar de la abeja: Cromo **sí** es un tema real y hay que contemplarlo (la abeja conserva sus colores pero necesita contorno claro sobre `#080808`).


## Avatar alternativo · «Abeja pixelada» (Bloque 1, `learny-v34` → `learny-v35`)
Misma Lumi, dos apariencias. El controlador (`LumiCompanion`) sigue decidiendo cuándo y qué; el avatar solo lo representa. **No** hay segundo controlador, listeners, cooldowns ni mensajes por avatar.
- **Preferencia**: `settings.mascotAvatar` = `'firefly'` (predeterminada) | `'bee'`. Lista permitida única: `MASCOT_AVATARS` en `js/01-base.js` (la usan `02-datos`, `13-ajustes` y `16-lumi`). Validada en `sanitizeSettings` (`js/02-datos.js`), que ya cubre carga, importación de copias, restaurar copia y guardar Ajustes: ausente o inválido → `firefly`, sin romper nada. `settings.mascot` sigue siendo independiente (elegir avatar nunca la activa).
- **Archivos tocados**: `js/01-base.js`, `js/02-datos.js`, `js/13-ajustes.js`, `js/16-lumi.js`, `index.html` (solo `data-avatar="firefly"` en `#lumi` y la clase `lumi-svg--firefly`), `style.css` (bloque «Lumi · avatar Abeja pixelada»), `sw.js` (`learny-v35`). Sin archivos nuevos: la abeja se genera en `lumiBeeSvg()` (rejilla 32×32, sin `id`), así que `sw.js` no necesita nuevas rutas.
- **Mecanismo**: `#lumi` contiene los dos SVG; `data-avatar` en `#lumi` decide cuál se ve (CSS). `setAvatar()` solo cambia ese atributo y cancela con seguridad un gesto en curso; pose (`data-pose`/`data-anim`/`data-react`), mensaje, temporizadores y foco no se tocan. `sync(s)` llama a `setAvatar` y después a `setEnabled`.
- **Ajustes**: grupo de radios «Apariencia de Lumi» bajo la casilla de Lumi (en «Disposición»). Opciones «Luciérnaga» y «Abeja pixelada», miniaturas decorativas `aria-hidden` generadas con `LumiCompanion.thumb(id)`, selección marcada con radio + borde + «✓». La vista previa existente aplica el avatar (`preview()` pasa `mascotAvatar`); guardar lo persiste; cerrar/cancelar lo revierte vía `applyAppearance()` del `modalTeardown`.
- **Temas**: variables `--bee-*` en `.lumi`; contorno exterior `--bee-rim` (separa del fondo oscuro; transparente en Claro). Alto contraste: contorno negro + rim blanco + amarillo plano. Cromo: rim plateado, la abeja conserva sus colores.
- **Corrección móvil incluida (afecta a ambos avatares)**: en táctil la regla general `button { min-height/min-width: 44px }` agrandaba el «×» de Lumi a 44 px sobre un avatar de 48 px y lo tapaba (ya ocurría con la luciérnaga). `.lumi-hide { min-width:0; min-height:0 }` y `::after { inset:-10px }` → 26 px visibles y 44 px de área de toque.
- **Fuera de alcance del Bloque 1**: poses propias de la abeja (aleteo, ojos cerrados en FOCUS, inclinación en SUPPORT, antenas en WELCOME). Hoy reutiliza los gestos `lumi-hop`/`lumi-wave` y las reglas de movimiento reducido, que actúan sobre `.lumi-svg`.
- **Ganchos para el Bloque 2** (ya en el SVG): `.bee-wings` (`.bee-wing-l`/`.bee-wing-r`), `.bee-antennae`, `.bee-eyes`, `.bee-face`, `.bee-body`, `.bee-halo`.
- **Nota PWA**: `sw.js` lista `./extras.js` y `./manifest.json` como imprescindibles; no estaban en los archivos recibidos (no se modificaron).

### Pruebas del Bloque 1 (Chromium headless; app servida por http local)
Ejecutadas (correctas, sin errores de página): usuario existente sin `mascotAvatar` ve la luciérnaga; un solo `#lumi`; selector con 2 opciones y nombres accesibles; sin `id` duplicados (página + miniaturas); vista previa sin guardar; cancelar con Esc restaura; guardar + recargar conserva la abeja (clave `learny.v3`); flechas del teclado entre opciones; valores inválidos (`dragon`, número, `null`, objeto, `__proto__`) y copia sin el campo → `firefly`, importación válida conserva `bee`, `mascot` independiente; cambio de avatar con mensaje visible (no se repite ni se reinicia su caducidad de 5 s), con SUPPORT visible y cooldown de 90 s intacto, durante FOCUS (pose `focus`, silencio), durante un gesto (se cancela), con Lumi desactivada (no la activa) y durante examen (sin reacciones); demo: aplica en memoria sin modificar `learny.v3`; movimiento reducido de Learny y del sistema (sin animación); móvil 390 y 320 px sin desborde; caché `learny-v35` con `js/16-lumi.js` y `learny-v34` eliminada (probado con `extras.js`/`manifest.json` de relleno, no incluidos).
Revisión estática: validación en `sanitizeSettings`, ausencia de `id` en los SVG, independencia de `settings.mascot`.
Pendientes (Bloque 2 o dispositivo real): lector de pantalla, alto contraste del sistema operativo real, varias pestañas, actualización PWA real v34 → v35 con el service worker publicado, importación de un JSON real desde el selector de archivos, CELEBRATE/WELCOME/PROGRESS de punta a punta con la abeja (la lógica no se tocó), poses de la abeja.


## Avatar · Bloque 2 (`learny-v35` → `learny-v36`)
Solo cambia la **representación** de la abeja. La luciérnaga, `LumiCompanion`, textos, frecuencias, prioridades, eventos, claves de almacenamiento y algoritmos de repaso no se tocaron.

### Archivos tocados
- `js/16-lumi.js`: solo `lumiBeeSvg()` (y su mapa `BEE_MAP` / `BEE_CELL`) y el comentario de cabecera. Ni una línea de `LumiCompanion`.
- `style.css`: bloque «Lumi · avatar Abeja pixelada (bloque 2)» (paleta por temas, clases `.b-*`, tamaños, poses).
- `sw.js`: `learny-v36`. La lista `CORE` no cambia (no hay archivos nuevos).
- `CONTINUIDAD.md`. `index.html` y el resto de `.js` sin cambios.

### Arte (fiel a la referencia)
- La referencia usa celdas de **10 px exactas** (sprite de 34×29). Se extrajo celda a celda y se limpió el ruido de compresión (una celda suelta). `BEE_MAP` son 29 filas de 34 letras (rol de color) colocadas en (3, 5) de una rejilla **40×40**; `shape-rendering="crispEdges"`, sin curvas, sin degradados, **sin ids**.
- Render real del componente a 600 px comparado con la referencia: **985 de 986 celdas coinciden** (única diferencia: el tono de una franja translúcida del lateral).
- Diferencias corregidas respecto a la primera abeja: silueta isométrica (antes oblicua con frente rectangular); ojo cerrado en arco y boca abierta con reflejo crema y lengüeta rosa (antes dos ojos abiertos de 2×3 y sonrisa); mejilla rosa a la izquierda; alas pequeñas, planas y translúcidas arriba a la izquierda (antes paralelogramos verticales a la derecha); antenas casi invisibles (antes dos palitos con punta); franjas que siguen la perspectiva (antes rectas); contorno amarillo claro de 1 celda (antes línea oscura más rim translúcido).
- Se siguió la imagen donde difería del texto del encargo: ojo cerrado (no cuadrado) y alas pequeñas (no grandes).
- El relleno de la cara en la referencia coincide con el fondo naranja; en el componente es `--bee-front` (`#ffb236`) para que no sea transparente.
- Grupos para las poses: `.bee-halo` (contorno), `.bee-body`, `.bee-wing-l`/`.bee-wing-r` (alas, reparto por columna), `.bee-antennae`, `.bee-face` y `.bee-eyes` (arco del ojo).

### Temas
- Predeterminado/oscuro/OLED/sepia/automático: colores de la referencia. Las alas son translúcidas (`--bee-wing-i`).
- Claro: contorno de ala azulado (el blanco desaparecería) y contorno exterior `#f0b429`.
- Alto contraste: contorno exterior blanco, interiores negros, amarillos planos, sin brillos.
- Cromo: contorno exterior plateado; la abeja conserva sus colores.

### Tamaños (cambio visible)
Para que las celdas salgan nítidas, la abeja usa múltiplos de la rejilla: **80 px** en escritorio, **60 px** en móvil (≤ 820 px), **40 px** en sesión de enfoque y en las miniaturas de Ajustes. La luciérnaga mantiene 64/48/40. El «×» de la abeja sube 4 px (`top: -10px`) para tapar menos el cubo; a la derecha se queda igual (más afuera provocaba 3 px de desborde en móvil).

### Poses (solo CSS: `transform`, un ciclo, sin `animationend`)
- **NEUTRAL**: alas en reposo, sin movimiento continuo; un aleteo de 300 ms solo al aparecer (`.is-entering`).
- **FOCUS**: ninguna animación (regla con `!important` sobre el SVG de la abeja); ojos iguales.
- **CELEBRATE**: `lumi-hop` (ya existente) + aleteo de ambas alas (`bee-flap-l/r`).
- **WELCOME**: `lumi-wave` (ya existente) + movimiento de antenas (`bee-feel`).
- **SUPPORT / PROGRESS / EMPTY**: `bee-lean`, `bee-nod` y `bee-feel`, **latentes**: el controlador solo marca `data-react` para `celebrate` y `welcome` (los otros tres ocurren en Práctica, donde Lumi no se ve; decisión ya documentada en el bloque 3). El CSS está listo y probado poniendo el atributo a mano; para activarlo habría que añadirlos a `GESTURE` en `16-lumi.js` (una línea, no hecha porque la lógica no debía cambiar).
- Movimiento reducido (sistema o Learny) y pestaña oculta (`data-paused`) los cubren las reglas existentes sobre `.lumi *`.

### Pruebas ejecutadas (Chromium headless, Playwright; sitio local con `extras.js` y `manifest.json` de relleno)
17 de 17 correctas, sin errores de página ni de consola:
1. Usuario existente sin `mascotAvatar` ve la luciérnaga (y un solo `#lumi`).
2. Cambio de avatar: con mensaje visible (no reinicia ni repite su caducidad de 5 s), durante un gesto (se cancela, el mensaje sigue), con Lumi desactivada (no la activa), durante FOCUS (pose estática, sin mensajes, sin animaciones) y con el cooldown de SUPPORT intacto (el 2.º «No lo sabía» no habla).
3. Examen: sin mensajes ni celebración, tampoco al cambiar de avatar.
4. Sin desborde horizontal a 390 y 320 px en las 6 páginas y con Ajustes abierto.
5. Cada gesto usa su animación; en FOCUS ninguna; movimiento reducido del sistema y de Learny: ninguna; el gesto se limpia por temporizador.
6. Ajustes: 2 opciones con nombre accesible, miniaturas `aria-hidden`, sin ids duplicados, vista previa, cancelar (Esc), guardar y recargar.
7. Demo: no toca `learny.v3` ni las claves reales; recargar la demo vuelve a la luciérnaga.
8. Caché PWA: solo `learny-v36`, con `js/16-lumi.js`, `style.css` y el resto de recursos.
Además: captura de los seis temas y de Inicio en 390 y 1000 px.

### Revisión estática
Sin `id` en el SVG; `aria-hidden` solo en el SVG y las miniaturas; ninguna variable `--bee-*` ni clase `.b-*` antigua queda sin uso; `settings.mascot` sigue independiente de `mascotAvatar`.

### Pendiente de navegador o dispositivo real
Lector de pantalla; alto contraste real del sistema operativo; varias pestañas; actualización PWA real v35 → v36 con el service worker publicado (la prueba 8 se hizo con una instalación nueva, no con una actualización); importar un JSON real desde el selector de archivos; nitidez de las celdas en pantallas de 1× (a 60 px cada celda mide 1,5 px) y en un móvil físico; CELEBRATE/WELCOME de punta a punta con la abeja en un uso real.

### Riesgos conocidos
- Sin `extras.js` ni `manifest.json` en el servidor, `cache.addAll` de `sw.js` falla y el service worker no se instala (ya ocurría; no se tocó).
- A 1× la abeja puede verse con celdas de 1 o 2 px alternadas (limitación de `crispEdges` con 1,5 px por celda).
- La abeja es más grande que la luciérnaga en la cabecera de Inicio (80 px frente a 64 px).


## Retirada de la luciérnaga (v37, `learny-v36` → `learny-v37`)
Decisión del usuario: Lumi ya no tiene luciérnaga ni selector de apariencia. La abeja es la única apariencia. No cambian estados, mensajes, prioridades ni cooldowns.
- **Archivos modificados**: `js/16-lumi.js`, `js/01-base.js`, `js/02-datos.js`, `js/13-ajustes.js`, `index.html`, `style.css`, `sw.js` (`CACHE = 'learny-v37'`), `CONTINUIDAD.md`. Sin archivos nuevos (la lista `CORE` de `sw.js` no cambia).
- **JS**: `GESTURE = { celebrate, welcome, support, progress, empty: true }` (cambio mínimo de animación: SUPPORT, PROGRESS y EMPTY ya tenían pose en CSS y ahora el controlador las dispara). Se eliminan `LUMI_AVATARS`, `fireflyMarkup`, `setAvatar`, `thumb`; `sync(s)` solo llama a `setEnabled`. `init()` inserta `lumiBeeSvg()` al principio de `#lumi`. `MASCOT_AVATARS` y `mascotAvatar` desaparecen de `defaults()`; `sanitizeSettings` hace `delete s.mascotAvatar`, así que guardados, copias e importaciones antiguos con `'firefly'`/`'bee'` se cargan sin error (la clave se descarta).
- **Ajustes**: se quita el grupo «Apariencia de Lumi»; queda la casilla «Compañero de estudio: Lumi».
- **index.html**: `#lumi` sin `data-avatar` ni SVG de luciérnaga (solo `.lumi-hide`; la abeja se inserta por JS).
- **CSS**: fuera las variables `--lumi-*` de la luciérnaga, sus partes, `lumi-glow`, el gating `[data-avatar="bee"]` y los estilos del selector/miniaturas. Se mantienen `--bee-*`, `.b-*`, poses, tamaños (80 px; 60 px ≤820 px; 40 px en `body.session-study`) y reglas de movimiento reducido.
- **Límite conocido (sin cambios)**: Lumi vive en Inicio; SUPPORT/PROGRESS/EMPTY ocurren en Práctica, así que el gesto solo se percibe si el personaje está visible ahí. La lógica ya los dispara.
- **Pruebas ejecutadas** (Chromium headless, `?demo`, 1280 y 320 px, app completa): sin errores de página; abeja presente (1 SVG, sin luciérnaga); tamaños 80/60 px; guardado antiguo con `mascotAvatar: 'firefly'` carga y la clave se descarta; en Ajustes no hay radios ni leyenda y sí la casilla; `data-react` support/progress/empty/celebrate/welcome → animaciones `bee-lean`/`bee-nod`/`bee-feel`/`bee-flap-l`/`bee-feel`; con `data-pose="focus"` → `animation: none`; sin desbordamiento horizontal. Único 404: `icon.svg` (no incluido en el entorno de prueba, ajeno a Lumi).
- **Revisión estática**: `node --check` en todos los JS; grep sin restos de `firefly`, `data-avatar`, `lumi-thumb`, `lumi-avatar`, `MASCOT_AVATARS`; llaves de CSS balanceadas.
- **Pendiente en navegador/dispositivo**: ver los gestos nuevos con Lumi visible en móvil real, los seis temas (incl. Cromo) a ojo, reduce-motion del sistema, y la actualización del Service Worker (v36 → v37) en una instalación existente.
- **Próximo paso**: si se aprueba, bloques de refinado de animación (1: estructura/neutral/focus/reduce-motion/cancelación; 2: reacciones y transiciones; 3: pruebas y pulido).
