# CONTINUIDAD · Lumi (compañero de estudio)

Estado del trabajo de la mascota Lumi sobre Learny. Cada bloque parte de la última versión aceptada y conserva todo lo anterior.

## Bloques completados
- **Idioma · inglés por defecto + español** (`learny-v44` → `learny-v45`): ver «Idioma» al final.
- **WALL·E en el precaché + proyecto unificado** (`learny-v43` → `learny-v44`): WALL·E se trata igual que Abeja y Eevee. Ver «WALL·E · como las demás apariencias» al final.
- **Lumi · reacciona en cualquier sección** (`learny-v42` → `learny-v43`). Ver «Lumi · reacciones en todas las secciones» al final.
- **Lumi · dock global** (`learny-v41` → `learny-v42`): Lumi visible en todas las secciones. Ver «Lumi · dock global» al final.
- **Movimiento · Bloques 1–4** (`learny-v40` → `learny-v41`): `motion.css` y `js/17-movimiento.js`, integrados como parche. Ver «Movimiento» al final.
- **Bloque 1 · Componente y ajustes** (`learny-v29` → `learny-v30`).
- **Bloque 2 · Reacciones mínimas** (Etapa A; `learny-v30` → `learny-v31`).
- **Bloque 3 · Contexto y progreso** (Etapa B; `learny-v31` → `learny-v32`).
- **Etapa C (pulido)**: `sw.js` quedó en `learny-v33` (base recibida para el trabajo del avatar).
- **Tema Cromo** (`cromo-tema.patch`; `learny-v33` → `learny-v34`): aplicado y verificado, ver «Tema Cromo» abajo.
- **Eevee y WALL·E · Bloque 2 «Estados e integración»** (`learny-v39` → `learny-v40`): poses de Eevee (orejas, cola) y WALL·E (cabeza, brazos) solo en CSS. Ver «Eevee y WALL·E · Bloque 2» al final.
- **WALL·E · Bloque 1 «Tercera apariencia»** (`learny-v38` → `learny-v39`): arte de WALL·E (`js/16-lumi-walle.js`), tercera opción del selector. (desde v44 en el precaché). Ver «WALL·E · Bloque 1» al final.
- **Eevee · Bloque 1 «Segunda apariencia + selector»** (`learny-v37` → `learny-v38`): arte de Eevee, `settings.mascotAvatar` ('bee' | 'eevee'), selector en Ajustes y caja propia. Ver «Eevee · Bloque 1» al final. Bloques 2 (estados) y 3 (pruebas y pulido) pendientes.
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
**Eevee y WALL·E · Bloque 3 — pruebas y pulido**: lector de pantalla, alto contraste real del sistema, actualización PWA real (v39 → v40), móvil físico, varias pestañas, importación con el selector de archivos del sistema. **Pendiente de decisión:** autorización de WALL·E (hoy fuera del precaché). Sigue pendiente también el refinado de animación de la abeja descrito en la sección v37.


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


## Eevee · Bloque 1 (`learny-v37` → `learny-v38`)
Segunda apariencia de Lumi, elegible en Ajustes. **Un solo controlador** (`LumiCompanion`): elegir apariencia solo cambia `data-avatar` en `#lumi`; estados, mensajes, prioridades, cooldowns, deduplicación, silencio en enfoque y examen, y demo no cambiaron. La luciérnaga no existe y no vuelve. La abeja sigue siendo la predeterminada y no cambió de diseño ni de animaciones.

### Alcance de uso
Eevee es un personaje de terceros. El proyecto declara (según indicó el responsable) **contar con autorización**, por eso su arte va en el precaché público. No se descargó ningún recurso oficial, no hay logos ni se sugiere una colaboración oficial. El dibujo se trazó en pixel art a partir de la imagen de referencia aportada. Si la autorización cambiara, basta con quitar `js/16-lumi-eevee.js`, su `<script>` en `index.html` y su línea en `CORE` de `sw.js`: sin ese archivo el selector solo ofrece la abeja y un `mascotAvatar: 'eevee'` guardado se muestra como abeja.

### Archivos
- `js/16-lumi-eevee.js` (nuevo): `EEVEE_MAP` (47×49 celdas en una rejilla 56×56) y `lumiEeveeSvg()`. Carga ANTES de `16-lumi.js` (su `init()` se ejecuta al final y necesita encontrar la función). Sin ids, `crispEdges`, sin degradados, sin recursos externos. Grupos: `.eevee-rim`, `.eevee-body` (cabeza, collar, cuerpo y patas), `.eevee-ear-l`, `.eevee-ear-r`, `.eevee-tail`.
- `js/01-base.js`: `MASCOT_AVATARS = ['bee', 'eevee']`; `mascotAvatar: 'bee'` por defecto.
- `js/02-datos.js`: `sanitizeSettings` valida `mascotAvatar` (ausente, inválido, tipo erróneo o «firefly» → `bee`). Cubre cargar, importar, guardar Ajustes y la vista previa.
- `js/13-ajustes.js`: grupo de radios «Apariencia de Lumi» bajo la casilla de Lumi (Ajustes → Disposición); la vista previa y el guardado incluyen `mascotAvatar`.
- `js/16-lumi.js`: `setAvatar` (inserta el dibujo elegido de forma perezosa, cancela con seguridad un gesto en curso y no toca mensajes, temporizadores ni foco), `avatars()` y `thumb()` (miniatura decorativa). `sync` aplica la apariencia y después la activación.
- `index.html`: `data-avatar="bee"` en `#lumi` y el `<script>` del arte. `style.css`: bloque «Lumi · avatar Eevee» y estilos del selector. `sw.js`: `learny-v38` y el arte en `CORE`.

### Preferencia
`settings.mascot` sigue siendo la activación; `settings.mascotAvatar` solo decide el dibujo. Elegir apariencia no activa Lumi si estaba desactivada. No cambian claves de almacenamiento ni se borran preferencias. Eevee solo se selecciona por acción explícita; los usuarios actuales conservan la abeja.

### Arte y fidelidad
La imagen tiene celdas de 9,19 px (rejilla regular, ≈47×49). Se muestreó celda a celda con 10 colores y se compararon ambas a la misma escala. Es una **aproximación**: la fuente es un JPEG con ruido y mezclas en los bordes, así que algunos tonos intermedios (sobre todo en la cara y el collar) son interpretaciones y el brillo de la cabeza es algo menos suave que en la imagen. Conserva el estilo pixel art de la referencia, los contornos selectivos y la paleta. En temas oscuros los contornos casi negros se funden con el fondo (como en la referencia); solo en **Alto contraste** se añade un contorno blanco de 1 celda.

### Caja propia
Eevee usa 84 px en escritorio, 56 px en móvil (≤ 820 px) y 42 px en sesión de enfoque (la abeja: 80/60/40). Son múltiplos de su rejilla de 56 para que las celdas salgan nítidas. Al alternar, la cabecera de Inicio mantiene el mismo alto (141 px escritorio, 149 px móvil) y la posición de Lumi cambia como mucho 4 px. Las miniaturas del selector miden 60 px (abeja) y 56 px (Eevee).

### Selector
Radios nativos con tarjeta (teclado: flechas). La opción elegida se distingue por borde de 2 px, «✓» y negrita, no solo por color. Cada opción tiene nombre accesible («Abeja pixelada», «Eevee»); las miniaturas son `aria-hidden`, sin estados ni animaciones y sin ids.

### Pruebas ejecutadas (Chromium headless, Playwright; sitio local con `extras.js` y `manifest.json` de relleno)
18 de 18 correctas, sin errores de página ni de consola:
1. Usuario actual sin el campo → abeja (solo su SVG en el DOM).
2. Valores `firefly`, `dragon`, `Eevee`, `5`, `null`, `{}`, `[]`, `__proto__` y vacío → abeja; `eevee` se conserva.
3. Importar copias sin campo, con `firefly`, inválida y con `eevee` (flujo real `importData`).
4. Selector: 2 opciones con nombre accesible, flechas del teclado, marca visible no solo por color, miniaturas sin animación ni ids, sin ids duplicados.
5. Vista previa, cancelar (Esc y ×), guardar y recargar.
6. Con Lumi desactivada: se elige y guarda sin activarla.
7. Cambio de apariencia con mensaje visible (no alarga su tiempo), durante un gesto, desactivando Lumi, durante FOCUS y con el cooldown de SUPPORT (90 s) intacto.
8. Examen: sin mensajes ni celebración.
9. Sin desborde horizontal a 390 y 320 px (6 páginas + Ajustes con el selector); alto de cabecera sin cambio.
10. Movimiento reducido (sistema y Learny) y FOCUS: sin animaciones.
11. Demo: elegir apariencia no toca los datos personales.
12. Caché PWA `learny-v38` con el arte y sin cachés antiguas.
Además: capturas de los seis temas y del selector, y comparación con la referencia a 12 px por celda.

### Pendiente de navegador o dispositivo real
Lector de pantalla, alto contraste real del sistema, varias pestañas, actualización PWA real v37 → v38 (la prueba usó una instalación nueva), importar con el selector de archivos del sistema, nitidez en un móvil físico y en pantallas 1× (a 84 px cada celda mide 1,5 px).

### Límites conocidos de este bloque
- **(Resuelto en el Bloque 2.) Eevee aún no tenía poses propias.** Hasta el Bloque 2 usa los gestos generales ya existentes (`lumi-hop` en CELEBRATE y `lumi-wave` en WELCOME, sobre todo el dibujo); SUPPORT, PROGRESS y EMPTY no tienen gesto visible. En FOCUS está estático.
- El «×» de Lumi puede rozar la punta de la oreja derecha de Eevee en escritorio.
- Aproximación del trazado (ver «Arte y fidelidad»).


## WALL·E · Bloque 1 (`learny-v38` → `learny-v39`)
Tercera apariencia de Lumi (`settings.mascotAvatar = 'walle'`). Mismo patrón que Eevee: un solo controlador, el arte solo representa. La abeja sigue siendo la predeterminada; la luciérnaga no existe.

### Alcance de uso: PENDIENTE de confirmar
WALL·E es un personaje de terceros (otro titular que Eevee) y **no se confirmó autorización para él**. Por eso `js/16-lumi-walle.js` **no está en `CORE` ni en `OPTIONAL` de `sw.js`** (hay un comentario que lo explica). Sin logos ni sugerencia de colaboración oficial. Dos cosas a tener en cuenta:
- `sw.js` guarda en caché cualquier archivo del mismo origen que se cargue con éxito: donde el archivo esté desplegado, acabará en la caché de ejecución. «Fuera de la distribución pública» significa no desplegarlo.
- Para retirarlo: borrar `js/16-lumi-walle.js`, su `<script>` en `index.html` y la entrada `walle` de `MASCOT_AVATARS` (opcional: sin el archivo el selector ya no lo ofrece y un `walle` guardado se muestra como abeja). Para publicarlo tras confirmar la autorización: añadirlo a `CORE` y subir la versión de caché.

### Archivos
- `js/16-lumi-walle.js` (nuevo): `WALLE_MAP` (36×36 celdas en una rejilla 40×40) y `lumiWalleSvg()`. Carga ANTES de `16-lumi.js`. Sin ids, `crispEdges`, sin degradados. Grupos para el Bloque 2: `.walle-head` (ojos y cuello), `.walle-arm-l`, `.walle-arm-r`, `.walle-body` (cuerpo y orugas) y `.walle-rim` (contorno de 1 celda, solo visible en Alto contraste).
- `js/01-base.js`: `MASCOT_AVATARS = ['bee', 'eevee', 'walle']` (la validación de `02-datos.js` lo usa sin cambios). `js/16-lumi.js`: una entrada más en `ART` (nombre accesible «WALL·E»). `index.html`: el `<script>` del arte. `style.css`: bloque «Lumi · avatar WALL·E». `sw.js`: `learny-v39`.
- `13-ajustes.js` no cambió: el selector se construye con `LumiCompanion.avatars()` y ya muestra tres opciones.

### Arte y fidelidad
La imagen usa celdas de 16,37 px (rejilla regular de 36×36); se ignoraron los restos de la captura de pantalla (línea izquierda y marca derecha). Se muestreó celda a celda con 8 colores. El render del componente real a 12 px por celda coincide con la referencia (comparación en `referencia-vs-walle.png`). Los tres píxeles blancos del detalle bajo el ojo izquierdo se conservan como blancos (en la imagen coinciden con el fondo).
- En temas oscuros las orugas (grises casi negros) tienen poco contraste con el fondo, pero los tonos intermedios mantienen la silueta legible. Solo en **Alto contraste** se añade contorno blanco.

### Caja
Misma caja que la abeja: 80 px en escritorio, 60 px en móvil y 40 px en enfoque (múltiplos de 40). La cabecera de Inicio y la posición de Lumi son idénticas a las de la abeja (medido sin redondear). Miniatura del selector: 60 px.

### Pruebas ejecutadas (Chromium headless; sitio local con `extras.js` y `manifest.json` de relleno)
- Batería completa del bloque anterior adaptada a tres apariencias: **18 de 18** correctas.
- Pruebas específicas de WALL·E: **13 de 13** correctas, sin errores de consola. Cubren: conservar `walle` al cargar; selección con flechas, vista previa, cancelar, guardar y recargar; importar con `walle` (y grafías distintas → abeja); alternar abeja ↔ Eevee ↔ WALL·E con un solo dibujo visible y el mensaje intacto; cambio durante un gesto; FOCUS; cooldown de SUPPORT; examen; Lumi desactivada; sin desborde a 390 y 320 px con las 3 tarjetas; movimiento reducido (sistema y Learny); demo.
- La prueba de caché comprueba que `sw.js` no lista WALL·E. Que aparezca o no en la caché de ejecución depende del momento en que se cargue (en una ejecución no apareció, y ya se advirtió que puede aparecer).

### Pendiente
Confirmar la autorización; poses de WALL·E (cabeza, brazos); lector de pantalla, alto contraste real del sistema, actualización PWA real v38 → v39 y dispositivo físico.

### Límites conocidos
- (Resuelto en el Bloque 2.) WALL·E aún no tenía poses propias: usa los gestos generales (`lumi-hop`, `lumi-wave`); SUPPORT, PROGRESS y EMPTY no tienen gesto visible. En FOCUS está estático.
- Aproximación del trazado (fuente JPEG).


## Eevee y WALL·E · Bloque 2 (`learny-v39` → `learny-v40`)
Solo **representación**. El controlador (`16-lumi.js`) no cambió: estados, textos, frecuencias, prioridades, condiciones, cooldowns, eventos y claves de almacenamiento son los de antes. La abeja no cambió (ni arte ni animaciones: `style.css` solo recibió líneas nuevas al final y dos comentarios actualizados). Archivos tocados: `style.css` (bloque «Lumi · poses de Eevee y WALL·E») y `sw.js` (`learny-v40`, porque cambió un archivo de `CORE`).

### Cómo funciona
Solo `transform` sobre los grupos ya preparados (1 unidad = 1 celda, pivotes en `transform-origin` en unidades del viewBox). Cada gesto es de un ciclo de ≤ 400 ms (el controlador lo limpia con temporizador a los `reactMs + 100`; la entrada, a los `enterMs + 100`). No se usa `animationend`. Movimiento reducido (sistema y Learny), pestaña oculta (`data-paused`) y desactivación de Lumi los cubren las reglas generales sobre `.lumi *`; en FOCUS una regla por avatar anula toda animación.

### Eevee (`.eevee-ear-l`, `.eevee-ear-r`, `.eevee-tail`)
- **NEUTRAL:** pose de la referencia, sin movimiento continuo; al aparecer (`.is-entering`, 300 ms) mueve orejas y cola una vez.
- **FOCUS:** estático.
- **CELEBRATE:** salto general `lumi-hop` + orejas + meneo de cola.
- **SUPPORT:** inclinación mínima de 4° (`lumi-lean`), sin gesto de tristeza.
- **PROGRESS:** asentimiento de 1,5 px (`lumi-nod`) + oreja derecha; más suave que la celebración.
- **WELCOME:** saludo general `lumi-wave` + oreja derecha + balanceo de cola.
- **EMPTY:** balanceo lento de la cola.

### WALL·E (`.walle-head`, `.walle-arm-l`, `.walle-arm-r`)
- **NEUTRAL:** pose de la referencia; al aparecer, un pequeño ladeo de cabeza.
- **FOCUS:** estático.
- **CELEBRATE:** salto general + ambos brazos suben 7°.
- **SUPPORT:** ladeo de cabeza de 5° (curiosidad, no tristeza).
- **PROGRESS:** asentimiento de cabeza de 1 px.
- **WELCOME:** saludo general + el brazo derecho saluda + ladeo de cabeza.
- **EMPTY:** ladeo de cabeza de 4° hacia el otro lado.

### Pruebas ejecutadas (Chromium headless; sitio local con `extras.js` y `manifest.json` de relleno)
- **Bloque 2 (14 de 14):** por avatar, cada estado usa la animación prevista en las partes previstas, con un ciclo y ≤ 0,4 s, y no se mueve nada más; NEUTRAL sin ninguna animación activa tras 2,5 s (sin movimiento continuo); FOCUS estático aunque se marque un gesto; pestaña oculta en pausa; movimiento reducido del sistema y de Learny sin ninguna animación; con el controlador real, `learny:pomodone` produce el gesto y se limpia por temporizador, y la entrada (apagar/encender Lumi) anima y se limpia.
- **Regresión:** batería principal **18 de 18** y batería de WALL·E **12 de 13**; el fallo es una aserción antigua que compara una altura fraccionaria (140,5 px) con un entero. Medido sin redondear, la cabecera y la caja de WALL·E son idénticas a las de la abeja (140,5/80 px escritorio, 148,9/60 px móvil).
- **Revisión visual:** fotogramas congelados en el punto álgido de cada estado (`poses-eevee-walle.png`).

### Pendiente de navegador o dispositivo real
Lector de pantalla, alto contraste del sistema, actualización PWA real v39 → v40 en un navegador ya instalado, varias pestañas, móvil físico (a 84 px las celdas de Eevee miden 1,5 px).

### Límites conocidos
- **SUPPORT, PROGRESS y EMPTY ocurren en Práctica, donde Lumi no se ve** (decisión del controlador, sin cambios): sus poses existen y se probaron poniendo el atributo a mano, pero el usuario no las ve hoy.
- Al moverse una parte aparecen costuras mínimas (huecos de menos de 1 celda donde la oreja, la cola o un brazo se separan del cuerpo, porque el dibujo está partido en grupos sin solapes). Con ≤ 7° y 400 ms apenas se aprecian a 80–84 px.
- WALL·E sigue **fuera del precaché** hasta confirmar la autorización.


---
## Movimiento · integración en el proyecto (v40 → v41)
Las notas de abajo se escribieron sobre `learny-v37 → v38`. Al fusionarlas con el proyecto real (que ya estaba en `learny-v40`, con Eevee y WALL·E) se hizo esto: `sw.js` del proyecto + `./motion.css` y `./js/17-movimiento.js` en `CORE` y `CACHE = 'learny-v41'` (el `sw.js` del paquete NO se usó: no incluía el arte de Eevee). `index.html`: `<link>` de `motion.css` tras `style.css` y `<script>` de `17-movimiento.js` tras `16-lumi.js`. `README.md` actualizado. Donde abajo diga v37/v38, léase v40/v41. Las pruebas allí descritas se hicieron en bancos mínimos, no en la app completa: sigue pendiente probarlo todo en la app real.

## Movimiento · Bloque 1 «Base y controles» (`learny-v37` → `learny-v38`) — AÑADIR AL FINAL DE CONTINUIDAD.md
Trabajo de la interfaz general (no de Lumi). Solo CSS y metadatos: ningún `.js` de la app ni `index.html` cambia salvo la línea `<link>` indicada abajo.

### Paquete PARCIAL
Contiene `motion.css` (nuevo), `sw.js` (completo, v38) y estas notas. Los demás archivos del proyecto no se tocaron.
**Acciones manuales (4, acumulativas hasta el Bloque 2):**
1. Copiar `motion.css` junto a `style.css`.
2. En `index.html`, justo después de `<link rel="stylesheet" href="style.css">`, añadir: `<link rel="stylesheet" href="motion.css">`.
3. En `index.html`, justo después de `<script src="js/16-lumi.js" defer></script>` (antes de `extras.js`), añadir: `<script src="js/17-movimiento.js" defer></script>` (Bloque 2).
4. Sustituir `sw.js` por el entregado (sube `CACHE` a `learny-v38` y añade `./motion.css` y `./js/17-movimiento.js` a `CORE`). Subir siempre `motion.css` y `17-movimiento.js`: si falta en el servidor, `cache.addAll` falla y el service worker no se instala.
En README: añadir `motion.css` y `js/17-movimiento.js` (ahora 17 archivos en `js/`) a la tabla de archivos y cambiar la versión del service worker a `learny-v38`.

### Tokens (en `:root` de `motion.css`)
`--dur-fast` 140 ms · `--dur-base` 220 ms · `--dur-view` 260 ms · `--dur-out` 150 ms · `--dur-done` 320 ms.
`--ease-out` cubic-bezier(0.16, 1, 0.3, 1) · `--ease-move` ease-in-out · `--ease-in` ease-in.
`--move-y` 6 px · `--press` .98. Con `prefers-reduced-motion` o `body.reduce-motion`, todos los tiempos valen 0 ms, `--move-y` 0 px y `--press` 1.

### Qué cambia
- Botones: transición con propiedades concretas (`transform`, `filter`, `background-color`, `border-color`, `color`, `box-shadow`); sin `transition: all`. Active con `scale(var(--press))` solo si no está deshabilitado.
- Disabled: sin hover ni presión (antes `.primary-button:hover` iluminaba un botón deshabilitado).
- Hover: en dispositivos sin hover (`@media (hover: none)`) se devuelve el estado de reposo, para que no quede «pegado» tras tocar.
- Loading: estilo listo para `button[aria-busy="true"]` (sin cablear en JS todavía).
- Foco: sin transición (inmediato); no se cambió su aspecto.
- Excluido: `.lumi-hide` y todo `.lumi`.

### Conservado sin cambios
Las reglas globales de movimiento reducido de `style.css` (`.reduce-motion *` y `@media (prefers-reduced-motion) *`, con `!important`) se mantienen como red de seguridad (decisión aprobada). Áreas táctiles, posiciones, paletas, fuentes, radios, `renderAll()`, eventos `learny:*`, `window.Learny` y claves de almacenamiento intactos.

### Deuda de limpieza (no hecha por ser paquete parcial)
`style.css` aún contiene reglas duplicadas o muertas de `button:hover`/`button:active` y la transición corta de botones; `motion.css` las anula por orden de carga. Cuando se reciba `style.css` completo en disco, se pueden borrar sin cambio visual.

### Pruebas
- **Revisión estática (hecha):** sin `transition: all` en `motion.css`; todos los tokens definidos; selectores comprobados contra las clases reales (`.outline-button`, `.option-button`, `.topic-chip`, `.icon-button`, `.nav-button`, `.seg-btn`, `.stuck-opt`, `.primary-button`, `.ask-button`, `.theme-chrome`).
- **Pruebas automatizadas / en navegador: NO ejecutadas.** El proyecto no está en el disco del entorno, así que no se pudo cargar la app en Chromium.
- **Pendientes manuales:** hover real frente a táctil; botón deshabilitado sin reacción; movimiento reducido del sistema y de Learny (duraciones computadas a 0); los seis temas (incl. Cromo); 320/390/1000 px sin desborde ni cambio de tamaño de controles; lector de pantalla; actualización PWA v37 → v38 sobre una instalación existente. No se ha medido fluidez ni fps.

### Siguiente bloque
**Bloque 2 · Flashcards y listas**: revelar respuesta, feedback de calificación (`box-shadow` → `transform/opacity`), entradas y salidas selectivas sin reanimar en cada `renderAll()`, doble pulsación y Deshacer. Archivos: `07-tarjetas.js`, `style.css`/`motion.css`, `index.html`.

---
## Movimiento · Bloque 2 «Flashcards y listas» (sigue en `learny-v38`; acumulativo sobre el Bloque 1)
**Archivos:** `js/17-movimiento.js` (nuevo), `motion.css` (ampliado), `sw.js` (CORE). Ningún otro `.js` ni `index.html` salvo la etiqueta `<script>` indicada arriba. `07-tarjetas.js` y `04-planificador.js` NO se tocaron: no se recibieron en disco, así que el módulo se apoya en lo existente.

### Cómo funciona
- **Estado leído, no modificado:** `activeCard`, `revealed` y `exam` (ámbito global de `07-tarjetas.js`) identifican «qué se muestra» con una clave `modo|id|paso` (pregunta/respuesta). Solo si la clave cambia hay efecto: un `renderAll()` que reescribe la tarjeta igual no anima nada.
- **Web Animations API** (`element.animate`): un ciclo, sin clases que limpiar, sin `animationend`/`transitionend`; cancelar devuelve el elemento a su estado normal. Duraciones y desplazamiento se leen de los tokens del `body`, así que con movimiento reducido (sistema o `body.reduce-motion`) valen 0 y no se anima nada.
- **Revelar respuesta:** solo la respuesta entra (opacidad + `translateY(var(--move-y))`, `--dur-reveal` 180 ms, `--ease-out`). Se envuelve en un `<div class="fc-ans">` tras la línea; el texto y el orden no cambian y no hay contenido oculto. En examen la tarjeta ya es solo la respuesta.
- **Tarjeta nueva:** misma entrada con `--dur-base` 220 ms. Una tarjeta distinta o un paso nuevo cancela el efecto anterior.
- **Calificar:** feedback común a las tres notas, sin color ni sacudida: la tarjeta se «asienta» desde `scale(0.985)` en `--dur-fast` 140 ms. Se dispara con `learny:rated`, que la app solo emite tras sus protecciones de doble pulsación (350 ms; examen sin revelar), así que no habilita registros extra ni toca el algoritmo ni el intervalo. Dos notas seguidas sustituyen el efecto.
- **CSS antiguo neutralizado en `motion.css`:** `card-in` (se repetía en cada render) y `fb-good`/`fb-soft` (aro de `box-shadow`, distinto por nota). `style.css` no se editó; borrar esas reglas queda como limpieza opcional.
- **Listas** (`#library-list`, `#deadline-list`, `#today-tasks`, `#notes-list`): un `MutationObserver` compara las claves de antes y después (el id se lee del botón o casilla que ya llevan; no cambia el marcado). Entran (opacidad + 6 px, 220 ms) los realmente nuevos; los eliminados dejan una copia fantasma que se desvanece en 150 ms en su lugar original (`aria-hidden`, `inert`, `pointer-events:none`, sin ids) y se retira con un temporizador (la animación solo lo adelanta). «Deshacer» no cambia: la lista vuelve a pintarse y el elemento restaurado entra como nuevo.
- **No se anima:** entrar a una página (`learny:page`), buscar o borrar la búsqueda en la Biblioteca, cambios masivos (más de 6 nuevos o más de 3 eliminados: importar, sincronizar otra pestaña), listas ocultas, pestaña oculta ni renders sin cambios de claves.
- **Fallos:** cada rama va en `try/catch`; si `animate` no existe o falla, la app sigue igual.

### Duraciones y easings usados
Revelar 180 ms · entrada 220 ms · salida 150 ms · calificar 140 ms · `--ease-out` cubic-bezier(0.16, 1, 0.3, 1) · salida `ease-in` · `--move-y` 6 px · escala de calificación/salida 0.985.

### Pruebas
- **Revisión estática:** `node --check` en `17-movimiento.js` y `sw.js`; selectores comprobados contra el marcado real (`#flashcard`, `data-return-card`, `data-edit-card`, `data-delete-deadline`, `data-note-del`, `data-task`, `#library-search`).
- **Chromium headless (Playwright) sobre un BANCO DE PRUEBAS** (DOM mínimo con los mismos ids y `motion.css` + `17-movimiento.js`; NO la app completa), en tres modos: normal, movimiento reducido del sistema y de Learny. Sin errores de página ni de consola. Normal: tarjeta nueva 1 animación; tres re-renders iguales 0; revelar 1 (solo `.fc-ans`, texto intacto); re-render de tarjeta revelada 0; calificar 1 y dos seguidas sustituyen (1); opacidad final 1; examen pregunta y respuesta 1 cada una; lista: 3 nuevos 3, re-render igual 0, un nuevo 1, borrado 1 fantasma en su posición («a(b)cd»), inerte y `aria-hidden`, retirado a los 400 ms; búsqueda 0; cambio masivo 0 y sin fantasmas; entrar a página 0; lista oculta 0. Movimiento reducido (ambos): 0 animaciones y ningún fantasma.
- **NO ejecutadas:** la app real completa (flujo de repaso con SM-2, Deshacer real, doble pulsación real, cierre de bloque), móvil, teclado, lector de pantalla, los seis temas, offline, demo, PWA y actualización v37 → v38. No se ha medido fluidez ni fps.

### Pendientes y riesgos conocidos
- El módulo depende de los nombres globales `activeCard`, `revealed` y `exam` de `07-tarjetas.js`/`01-base.js`; si se renombran, hay que actualizar `keyNow()`.
- Al salir a otra pestaña de la app dentro de los 150 ms de un borrado, el fantasma se retira igualmente por temporizador.
- Los fantasmas ocupan su sitio 150 ms y luego la lista se cierra de golpe (no se anima la altura, por la regla de no animar layout).
- `#today-tasks` y `#notes-list` están observadas pero conviene verlas a ojo en la app real.

### Siguiente bloque
**Bloque 3 · Navegación y modales** (cambio de vistas con opacidad + 6 px en `--dur-view`, apertura/cierre de `dialog` con fallback, foco, Escape, navegación rápida, `scrollIntoView` suave respetando movimiento reducido). Archivos necesarios: `03-interfaz.js`, `14-eventos.js`, `index.html` (ya recibidos).


## Movimiento · Bloque 3 «Navegación y modales» (sigue en `learny-v38`; acumulativo sobre los Bloques 1 y 2)

### Paquete PARCIAL
Mismos archivos que el Bloque 2 (`motion.css`, `sw.js`, `js/17-movimiento.js`, esta nota, `pruebas/`). No se ha editado `03-interfaz.js`, `14-eventos.js`, `06-hoy.js` ni `style.css`. Pasos manuales de los Bloques 1–2 (enlazar `motion.css` y `17-movimiento.js` en `index.html`, sustituir `sw.js`) siguen siendo necesarios; sin ellos nada de esto se ve.

### Componentes
- **Cambio de vista** (`17-movimiento.js`): al llegar `learny:page` (se emite tras `renderPage`), la vista nueva hace opacidad 0→1 y `translateY(--move-y)`→0 con `--dur-view` (260 ms) y `--ease-out`. La saliente se oculta al instante (como antes). No hay `opacity:0` como estado base. Mismo destino = sin efecto. Navegación rápida: cada cambio cancela la animación anterior (queda una).
- **Scroll suave**: `Element.prototype.scrollIntoView` se envuelve; si pide `behavior:'smooth'` y hay movimiento reducido (sistema o `body.reduce-motion`), pasa a `auto`. Cubre «Repasar ahora» de `06-hoy.js` sin tocarlo. Marcado con `__learny` para no envolver dos veces.
- **Modales** (`motion.css`, solo CSS; `#app-modal` y `#confirm-modal`, ambos `.modal`): entrada con `@starting-style` (opacidad, `translateY(--move-y)`, escala `--modal-scale` .98) en `--dur-base`; salida de 150 ms (`--dur-out`, `--ease-in`) con `overlay` y `display` + `allow-discrete`. `close()`, `Escape`, foco, `onClose` y `modalOpen()` siguen siendo síncronos: durante la salida el diálogo ya tiene `[open]` quitado y `pointer-events:none`. Sin soporte de `allow-discrete`/`overlay`, el cierre es instantáneo (comportamiento anterior) y la entrada se anima si hay `@starting-style`.
- **Móvil ≤820 px**: se anula `animation: sheet-up` de `style.css` (para no duplicar) y se sustituye por la misma transición con desplazamiento de 24 px. No se cambia la forma de hoja inferior.
- Nuevo token: `--modal-scale: .98` (1 con movimiento reducido).

### Duraciones y easings
Vista 260 ms `--ease-out`; modal entra 220 ms `--ease-out`; modal sale 150 ms `--ease-in`; todo 0 ms con movimiento reducido.

### Corrección durante las pruebas
La primera versión no animaba la entrada del modal: `@starting-style` iba antes de `dialog.modal[open]{opacity:1}` y, con la misma especificidad, ganaba la regla posterior. Ahora `@starting-style` va después de las reglas `[open]` (comentado en el CSS). Medido: opacidad 0 → .65 (46 ms) → .93 (96 ms) → 1 (~200 ms).

### Pruebas
- **Automatizadas (Chromium 141 + Playwright, banco mínimo `pruebas/bench3.html`, NO la app completa)**, en 4 modos (normal, movimiento reducido del sistema, `body.reduce-motion`, viewport móvil 390 px): vista nueva = 1 animación; mismo destino = 0; 4 cambios seguidos = 1 animación y una sola vista activa; modal abre con animación, `open` verdadero al instante, foco en el primer botón; `close()` síncrono (`open=false`, evento `close` emitido una vez); durante la salida `pointer-events:none`; modal cerrado `display:none` y 0 animaciones residuales; abrir/cerrar/abrir seguidos termina abierto y con opacidad 1; `Escape` cierra; `#confirm-modal` abre; scroll suave con movimiento normal (no salta) y salto directo con movimiento reducido; sin errores de consola.
- **Con movimiento reducido**: 0 animaciones de vista y modal; el modal desaparece al instante.
- **No medido**: fluidez ni fps. Revisión visual real no hecha.

### Pendiente (manual, en la app real)
Flujo completo en el navegador; foco devuelto al abridor y orden de tabulación con modales reales (ajustes, confirmaciones, IA con `modalBound`); Escape durante la salida; hoja inferior en móvil real y teclado virtual; iOS Safari (soporte de `allow-discrete`/`overlay` por verificar: si no existe, cierre instantáneo); los 6 temas, incl. Cromo (`::backdrop` con blur); lector de pantalla; modo sesión (`applySessionMode`); `<dialog>` de `#confirm-modal` si tiene reglas propias en `style.css` que choquen con `transform`; PWA v37→v38 y sin conexión.
Riesgo conocido: `transform` en `dialog.modal` crea contexto de apilamiento propio; si algún modal hijo usa `position:fixed`, quedaría relativo al diálogo mientras dura la transición (la entrada termina en `transform:none`).

### Siguiente bloque
Bloque 4 · Toasts, temporizador y progreso (entrada/salida de toast y Undo sin duplicar efectos; pulso de fin de temporizador ≤320 ms, un solo ciclo; barras y estadísticas con `scaleX`).


## Movimiento · Bloque 4 «Avisos, temporizador y progreso» (sigue en `learny-v38`; acumulativo sobre los Bloques 1–3)

### Paquete PARCIAL
Mismos archivos que el Bloque 3 (`motion.css`, `sw.js`, `js/17-movimiento.js`, esta nota, `pruebas/`); no se añaden archivos nuevos, así que `sw.js` no cambia. No se tocó `03-interfaz.js`, `05-temporizador.js`, `08-analisis.js` ni `style.css`. Siguen necesarios los pasos manuales de los Bloques 1–2 (enlazar `motion.css` y `17-movimiento.js` en `index.html`, sustituir `sw.js`).

### Hallazgos al leer el código actual
- `.toast` en `style.css` usa `transition: .25s` (equivale a `all`) y `.toast:not(.show)` pone `visibility:hidden` de golpe: cualquier salida quedaba cortada.
- `#timer-clock` es un `<span>` en línea: `transform` no se aplica a elementos en línea, así que el `scale(1.04)` de `done-pulse` nunca se veía (solo cambiaba el color), y duraba 0,8 s × 2 ciclos.
- Las únicas «barras» de la app son las verticales del gráfico de foco (`#focus-chart .bar`, con `height:%`). No hay barras de progreso horizontales ni barra del temporizador: por eso aquí se usa `scaleY` desde la base y no `scaleX`.

### Componentes
- **Toast** (`motion.css`, solo CSS): entrada 220 ms (`--dur-base`, `--ease-out`), salida 140 ms (`--dur-fast`, `--ease-in`), desplazamiento 3 × `--move-y` = 18 px (antes 150 % de su alto). `visibility` se transiciona con retraso solo al salir, y `pointer-events:none` (de `style.css`) evita clics mientras se desvanece. **El JS no cambia**: el plazo del «Deshacer» (8 s), la tecla Z, `clearUndo()` y el aviso de error se comportan igual. Un toast que sustituye a otro visible no hace salida/entrada intermedia (solo cambian texto y color, como antes).
- **Pulso de fin de bloque**: un solo ciclo de `--dur-done` (320 ms), color de acento + `scale(1.03)`, con `#timer-clock.pulse{display:inline-block}` para que la escala funcione (mismo flujo y tamaño de texto). Se redefine `@keyframes done-pulse` (gana el último).
- **Barras del gráfico de foco** (`js/17-movimiento.js`, WAAPI): se recuerda la altura de cada día (clave: fecha del `title`) y solo se anima la barra cuyo valor cambió, con `scaleY(previa/nueva)→none` en `--dur-base`, `--ease-move`, origen en la base (`.bar{transform-origin:50% 100%}`). Primer dibujo, entrada a la página (la vista ya hace su fundido: no se duplica), gráfico oculto, barra vacía o sin cambio = sin efecto.

### Duraciones y easings
Toast: 220 ms `--ease-out` entra / 140 ms `--ease-in` sale. Pulso: 320 ms `--ease-out`, 1 ciclo. Barras: 220 ms `--ease-move`. Todo 0 con movimiento reducido.

### Pruebas
- **Automatizadas (Chromium 141 + Playwright; banco mínimo `pruebas/bench4.html` con las reglas originales de `style.css` y `toast()`/`offerUndo()` copiadas tal cual; NO la app completa)**, 4 modos (normal, reducido del sistema, `body.reduce-motion`, móvil 390 px): toast en reposo oculto; entra (opacidad .80 a los 60 ms, 18 px → 0); sale en ~140 ms (visible y desvaneciéndose hasta ~150 ms, luego `hidden`); movimiento reducido = instantáneo; «Deshacer» aparece, se ejecuta una vez y caduca a los 8 s; sustituir un toast visible no vuelve a animar; pulso = 1 ciclo de 320 ms, `inline-block`, escala real (≈1,025 a los 120 ms) y 0 animaciones residuales; barras: primer dibujo 0 animaciones, mismo dato 0, un día cambiado = 1 animación con `scaleY≈.55`, estado final `none` y altura real intacta, gráfico en página oculta = 0; sin errores de consola.
- **No medido**: fluidez ni fps; revisión visual.

### Pendiente (manual, en la app real)
Con el temporizador real: el pulso coincide con la apertura del modal «¡Bloque completado!» (queda bajo el velo del diálogo; comprobar si se nota o conviene quitarlo); aviso de error en Cromo (`::before «⚠ Error:»`) y 6 temas; toasts de cola de arranque (`queueToast`); toast sobre el mini temporizador y la barra inferior en móvil (`bottom` cambia sin transición, como antes); lector de pantalla (los toasts siguen escribiendo el texto 40 ms después de hacerse visibles); gráfico real tras completar un bloque estando en «Reforzar» u otra pestaña sincronizada; `display:inline-block` del reloj con fuente grande/monoespaciada y modo sesión.

### Siguiente bloque
Bloque 5 · Pruebas y pulido: revisión móvil, teclado, movimiento reducido, temas, interacción rápida, datos antiguos, sin conexión, demo y PWA; limpieza de reglas duplicadas de `style.css` si el archivo llega en disco; README y `CONTINUIDAD.md` finales.


---
## Lumi · dock global (`learny-v41` → `learny-v42`)
Motivo: SUPPORT, PROGRESS y EMPTY ocurren en Práctica, donde Lumi no se veía (límite conocido desde el bloque 3), así que sus gestos no se percibían.
- **index.html:** `#lumi`, `#lumi-msg` y `#lumi-live` salen de la cabecera de Inicio y pasan a `#lumi-dock` (fuera de las páginas, antes de `#subject-list`). Se elimina `#lumi-msg-card`.
- **js/16-lumi.js:** una sola línea: `cardMsgEl = byId('lumi-msg-card') || msgEl`. Mensajes, prioridades, cooldowns, eventos y gestos no cambian; el mensaje del slot «practice» ahora sale en el mismo bocadillo del dock.
- **style.css:** fuera las reglas de la cabecera de dos columnas (`body.has-lumi #study .page-heading…`), el hueco reservado en Práctica y el `.lumi-msg` en línea; bloque nuevo al final «Lumi · dock global»: fijo abajo a la derecha, `pointer-events: none` salvo el «×», bocadillo sobre Lumi, sube 56 px con el temporizador flotante, en móvil queda sobre la barra inferior (y sobre los controles fijos en sesión de enfoque). Oculto con la portada o con Lumi desactivada.
- **sw.js:** `learny-v42`.
- **Sin cambios de regla (decisión pendiente):** cada reacción sigue apareciendo solo en su página (CELEBRATE en Inicio; SUPPORT/PROGRESS/EMPTY en Práctica). Ahora Lumi se ve en todas, pero solo reacciona donde antes.
- **Pruebas:** revisión estática y sintaxis (`node --check`). NO probado en navegador. Pendiente: solapes del dock con contenido en 320/390/1000 px, temporizador flotante y toast, sesión de enfoque en móvil, los seis temas, y que el «×» siga siendo pulsable.
- **Riesgo:** el dock tapa visualmente (no los clics) la esquina inferior derecha del contenido; con el sprite de 80 px en escritorio puede cubrir botones a ese borde.


---
## Lumi · reacciones en todas las secciones (`learny-v42` → `learny-v43`)
Resuelve la «decisión pendiente» de v42. Archivos: `js/16-lumi.js` y `sw.js` (`learny-v43`); README actualizado.
- `tryShow` ya no exige estar en la página del mensaje: CELEBRATE, SUPPORT y PROGRESS salen en cualquier sección. Siguen bloqueadas por ventana abierta, pestaña oculta, FOCUS y examen; una reacción bloqueada espera como antes (una sola, caduca a 20 s).
- `onPage` ya no borra una reacción visible al cambiar de página (sí sigue borrando los mensajes proactivos, que dependen de la página).
- **Sin cambios:** textos, prioridades, cooldowns (90 s apoyo/progreso), frecuencia (1 proactivo por visita), el criterio de cuándo se dispara cada reacción y los gestos. WELCOME/NEUTRAL (Inicio) y EMPTY (Práctica) siguen siendo proactivos de su página.
- **Efecto visible:** CELEBRATE ya no se pierde si al cerrar el cierre del bloque no estás en Inicio.
- Pruebas: solo `node --check`; NO probado en navegador.


---
## WALL·E · como las demás apariencias (`learny-v43` → `learny-v44`)
Decisión del usuario: WALL·E queda igual que Eevee y la abeja. Esto **sustituye** la nota «Alcance de uso: PENDIENTE de confirmar» y los avisos de «fuera del precaché» de las secciones anteriores.
- `sw.js`: `./js/16-lumi-walle.js` entra en `CORE` (tras `16-lumi-eevee.js`), se elimina el comentario que lo excluía y `CACHE = 'learny-v44'`.
- Proyecto unificado: `index.html` con `#lumi-dock`, `motion.css` y `17-movimiento.js`; `style.css` con el bloque «Lumi · dock global» (y sin las reglas antiguas de la cabecera de Inicio ni del hueco de Práctica); `16-lumi.js` con reacciones en cualquier sección. `README.md` actualizado.
- Verificado: `node --check` en todos los JS; la lista `CORE` coincide con los `<script>` de `index.html`.
- NO probado en navegador. Pendiente: dock con contenido en 320/390/1000 px, los seis temas, selector con 3 apariencias, actualización PWA v43 → v44.


---
## Idioma · inglés por defecto + español (`learny-v44` → `learny-v45`)
- `settings.lang` = `'en'` (predeterminado, también para usuarios existentes y copias sin el campo) | `'es'`. Validado en `sanitizeSettings` (`02-datos.js`); por defecto en `defaults()` (`01-base.js`).
- `js/18-idioma.js` (nuevo, en `CORE` de `sw.js` y en `index.html` tras `17-movimiento.js`): el código sigue escrito en español y el módulo traduce lo que se VE (texto, `placeholder`, `aria-label`, `title`, `document.title`) con un diccionario `EX` + `RULES` (números/plurales) y un `MutationObserver`; recuerda el original para volver al español. Lo que no esté en el diccionario queda en español.
- Contenido del usuario o de la IA (`#flashcard`, `#library-list`, `#notes-list`, `#source-out`, `#feynman-guide`, `.ai-answer`, `.tutor-block`): solo se traducen rótulos EXACTOS. `translate="no"` excluye cualquier nodo.
- Guía de uso: en inglés se sustituye el contenido de `#guide` (`GUIDE_EN`) y se restaura al volver al español. Guía local del tutor (`localGuide`) en inglés; `askGemini` añade «responde en inglés» (los títulos de bloque siguen en español porque `parseBlocks` los reconoce y el DOM los traduce).
- Cambio: botón `#lang-toggle` (EN/ES) en la barra superior (oculto ≤ 600 px) y selector «Idioma» en Ajustes → Apariencia (con vista previa; cancelar revierte). `applyAppearance` llama a `LearnyI18n.sync`.
- Archivos: `js/18-idioma.js`, `js/01-base.js`, `js/02-datos.js`, `js/11-apariencia.js`, `js/13-ajustes.js`, `index.html`, `style.css`, `sw.js`, `README.md`.
- NO probado en navegador (solo `node --check` y pruebas del motor de traducción en Node). Pendiente: revisar cada sección en inglés buscando textos que sigan en español y ampliar `EX`/`RULES`; fechas (`toLocaleDateString('es')`) solo se traducen los formatos «12 oct» y «el martes»; lector de pantalla; 320/360 px con el botón oculto.
