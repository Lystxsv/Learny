# CONTINUIDAD · Lumi (compañero de estudio)

Estado del trabajo de la mascota Lumi sobre Learny. Cada bloque parte de la última versión aceptada y conserva todo lo anterior.

## Bloques completados
- **Bloque 1 · Componente y ajustes** (`learny-v29` → `learny-v30`).
- **Bloque 2 · Reacciones mínimas** (Etapa A; `learny-v30` → `learny-v31`).
- **Bloque 3 · Contexto y progreso** (Etapa B; `learny-v31` → `learny-v32`).

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
- Temas: oscuro, OLED, claro, sepia y alto contraste (automático hereda). Cromo no existe en Learny.
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
**Bloque 4 · Pruebas y pulido (Etapa C)**: móvil (320 y 390 px), teclado, movimiento reducido, temas, pausar/reanudar, desactivar durante un gesto, recarga, varias pestañas, demo, actualización PWA real (v31 → v32), importación de copias con/sin `mascot` y regresiones en Hoy, Práctica y Ajustes.
