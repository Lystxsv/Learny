# CONTINUIDAD · Lumi (compañero de estudio)

Estado del trabajo de la mascota Lumi sobre Learny. Cada bloque parte de la última versión aceptada y conserva todo lo anterior.

## Regla de proporción
Cada novedad ornamental (Lumi, temas, animaciones) exige antes una mejora del núcleo de estudio (repaso, tarjetas, copias, pruebas).

## Bloques completados
- **Perfiles · Etapa 3b** (`learny-v81`, misma versión que 3a): bordes de los controles de la bienvenida con contraste ≥ 3:1 (WCAG 1.4.11). Ver «Perfiles · Etapa 3b» al final.
- **Perfiles · Etapa 3a** (`learny-v80` → `learny-v81`): opciones de accesibilidad en el paso «Personalizar» de la bienvenida. Ver «Perfiles · Etapa 3a» al final.
- **Perfiles · Etapa 1** (`learny-v75` → `learny-v76`): bienvenida de una pregunta + `settings.profile`; `tests/perfil.spec.js` (6 pruebas, pasan). Suite: 55 de 59; las 4 de `fase8.spec.js` siguen fallando igual sin estos cambios. Pendiente: Etapas 2–4 (textos por perfil, accesibilidad en la entrada, modo autodidacta), probar en móvil.
- **Iconos «Material Symbols»** (`learny-v74` → `learny-v75`): emojis sustituidos por iconos de una fuente local (`material-symbols.woff2`, 26 iconos). Helper `icon(nombre)` en `js/01-base.js`; CORE del service worker incluye la fuente. Probado: pruebas Playwright (49 de 53; las 4 de `fase8.spec.js` fallan igual sin estos cambios), capturas con `?demo` en español e inglés y modo sin conexión. Pendiente: móvil real, y revisar las 4 pruebas de fase8.
- **Fase 9 (parcial, 2.ª parte) «Lumi dice el dato curioso y tiene más mensajes»** (`learny-v73` → `learny-v74`): dato curioso diario por Lumi, `studyChatter()` y variantes de reacciones. Ver «Fase 9 (parcial, 2.ª parte)» al final.
- **Fase 9 (parcial) «Lumi más útil y opcional»** (`learny-v72` → `learny-v73`): aviso «Mañana te tocan N repasos» y Lumi desactivada por defecto (`mascot: false`; sustituye la decisión 1). Ver «Fase 9 (parcial)» al final. (La nota de v71 → v72 no existe en los archivos recibidos.)
- **Fase 8 «Plan y datos útiles»** (`learny-v70` → `learny-v71`): límite de nuevas por día, tarjetas difíciles, tareas concretas y retención real. Ver «Fase 8» al final.
- **Fase 7a «Crear tarjetas con menos fricción»** (`learny-v69` → `learny-v70`): guardar y añadir otra, tarjeta inversa, «✨ Crear con IA» visible. Ver «Fase 7a» al final. (7b, cloze, pendiente de decisión.)
- **v69 · Modelo de IA por defecto y ayuda sobre Gemini** (`learny-v68` → `learny-v69`). Ver «v69» al final.
- **Fase 6 «Red de seguridad»** (`learny-v67` → `learny-v68`): suite Playwright y copia automática a archivo. Ver «Fase 6» al final.
- **Movimiento · Fase 5 «Visibilidad del repaso»** (`learny-v66` → `learny-v67`): intervalo en los botones de calificar (`nextSchedule()`) y previsión de 7 días en Reforzar. Ver «Fase 5» al final.
- **Movimiento · Fase 4 «Pulido»** (`learny-v65` → `learny-v66`): escalonado de listas y velo al calificar. Ver «Fase 4» al final.
- **Movimiento · Fase 3 «Continuidad visual»** (`learny-v64` → `learny-v65`): fundido cruzado entre páginas y borrado continuo en listas. Ver «Fase 3» al final.
- **Movimiento · Fase 2 «Rendimiento y batería»** (`learny-v63` → `learny-v64`): reposo de Lumi con tope y tokens leídos una vez. Ver «Fase 2» al final.
- **Movimiento · Fase 1 «Movimiento reducido y limpieza»** (`learny-v62` → `learny-v63`). Ver «Fase 1» al final.
- **Movimiento · Etapa 1 «Fondo de las ventanas»** (`learny-v61` → `learny-v62`).
- **JS-109 · aviso durante la entrada de un modal** (`learny-v60` → `learny-v61`); **Lumi · reposo con vida** (v59 → v60); **Auditoría 2** (v57 → v59).
- **Cat Black · Bloques 1 y 2** (v55 → v57); **Yor Forger · Bloques 1 y 2** (v53 → v55); **Auditoría JS · Bloques 1–6** (v47 → v53).
- **Cat Black · Bloque 2 «Animaciones»** (`learny-v56` → `learny-v57`): poses solo en CSS. Ver «Cat Black · Bloque 2» al final.
- **Cat Black · Bloque 1 «Aspecto»** (`learny-v55` → `learny-v56`): sexta apariencia de Lumi (`'gato'`). Ver «Cat Black · Bloque 1» al final. (Bloque 2 hecho.)
- **Daniel Carreon · Bloque 2 «Animaciones»** (`learny-v46` → `learny-v47`): poses solo en CSS. Ver «Daniel Carreon · Bloque 2» al final.
- **Daniel Carreon · Bloque 1 «Aspecto»** (`learny-v45` → `learny-v46`): cuarta apariencia de Lumi (`'daniel'`). Ver «Daniel Carreon · Bloque 1» al final. (Bloque 2 hecho.)
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
1. `settings.mascot` activada por defecto, con «Ocultar a Lumi» a la vista (con «Deshacer»). **(Sustituida en la Fase 9, v73: ahora `mascot: false` por defecto; quien ya tenía datos conserva su ajuste.)**
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


---
## Daniel Carreon · Bloque 1 «Aspecto» (`learny-v45` → `learny-v46`)
Cuarta apariencia de Lumi (`settings.mascotAvatar = 'daniel'`, nombre visible «Daniel Carreon»). Mismo patrón que Eevee y WALL·E: un solo controlador, el arte solo representa. La abeja sigue siendo la predeterminada.
- **Autorización:** el responsable indica contar con el permiso del artista del pixel art para usar la imagen; por eso el arte va en el precaché (`CORE`). Para retirarlo: borrar `js/16-lumi-daniel.js`, su `<script>`, su línea en `CORE` y `'daniel'` de `MASCOT_AVATARS` (sin el archivo el selector no lo ofrece y un `daniel` guardado se muestra como abeja).
- **Archivos:** `js/16-lumi-daniel.js` (nuevo: `DANIEL_MAP` 56×74 celdas en rejilla 76×76 y `lumiDanielSvg()`; sin ids, `crispEdges`, sin degradados), `js/01-base.js` (`MASCOT_AVATARS`), `js/16-lumi.js` (una entrada en `ART`), `index.html` (`<script>` antes de `16-lumi.js`), `style.css` (bloque «Lumi · avatar Daniel Carreon» al final), `sw.js` (`learny-v46` + arte en `CORE`). `13-ajustes.js` y `02-datos.js` no cambian: el selector y la validación leen `MASCOT_AVATARS`/`LumiCompanion.avatars()`.
- **Arte:** rejilla de la imagen ≈ 15,7 px por celda (56×74). Muestreo del centro de cada celda y mapeo a 11 colores; el fondo blanco se separa de las zapatillas blancas por relleno desde el borde. Se limpió el ruido del JPEG (celdas azules/grises sueltas fuera de pantalón y zapatillas). Render comparado con la referencia: misma silueta, pelo en dos tonos, ojos, boca «ᴗ» y camiseta.
- **Grupos listos para el Bloque 2:** `.daniel-head` (pelo y cara), `.daniel-eyes` (ojos, dentro de la cabeza), `.daniel-arm-l`, `.daniel-arm-r`, `.daniel-body` (torso, piernas, zapatillas) y `.daniel-rim` (contorno de 1 celda, solo en Alto contraste).
- **Caja:** 76 px (1 px por celda) en escritorio y móvil; 38 px en enfoque; miniatura del selector 76 px. Es más alto que la abeja (80 px de rejilla 40).
- **Poses:** hoy usa solo los gestos generales (`lumi-hop` al celebrar, `lumi-wave` en la bienvenida). Estático en FOCUS.
- **Pruebas:** `node --check`; render del SVG en Chromium. NO probado en la app completa (selector con 4 opciones, vista previa, 320/390 px, seis temas, PWA v45 → v46).
- **Siguiente:** Bloque 2 · animaciones de Daniel (cabeza, ojos/parpadeo en entrada, brazos) solo con CSS.


---
## Daniel Carreon · Bloque 2 «Animaciones» (`learny-v46` → `learny-v47`)
Solo **representación**: `16-lumi.js` y el resto de la lógica no cambian (estados, textos, frecuencias, prioridades, cooldowns, eventos). Archivos tocados: `style.css` (bloque «Lumi · poses de Daniel Carreon» al final) y `sw.js` (`learny-v47`).
- **Cómo funciona:** solo `transform` sobre `.daniel-head` (pivote en el cuello), `.daniel-eyes`, `.daniel-arm-l` y `.daniel-arm-r` (pivotes en los hombros); un ciclo de ≤ 400 ms que el controlador limpia con temporizador. Movimiento reducido, pestaña oculta y desactivación de Lumi los cubren las reglas generales; FOCUS anula toda animación.
- **NEUTRAL:** pose de la referencia, sin movimiento continuo; al aparecer, un parpadeo y un ladeo de cabeza de 4°.
- **FOCUS:** estático.
- **CELEBRATE:** salto general `lumi-hop` + ambos brazos suben 12° + parpadeo.
- **WELCOME:** saludo general `lumi-wave` + el brazo derecho saluda (balanceo de hasta 26°) + ladeo de cabeza.
- **SUPPORT:** inclinación `lumi-lean` + ladeo de cabeza de 4° (curiosidad, no tristeza).
- **PROGRESS:** asentimiento `lumi-nod` + cabeza 1 celda abajo.
- **EMPTY:** ladeo de cabeza de 3° hacia el otro lado.
- **Pruebas (Chromium, app completa con `?demo`, 1000 y 390 px):** el selector ofrece 4 apariencias; cada estado usa las animaciones previstas en las partes previstas, con un ciclo de 400 ms; FOCUS con un gesto marcado: 0 animaciones; movimiento reducido del sistema: 0; sin errores de página; 76 px en escritorio y móvil sin desborde horizontal. Captura de CELEBRATE y WELCOME revisada a ojo.
- **Pendiente:** seis temas a ojo, lector de pantalla, Alto contraste real, PWA v46 → v47 sobre instalación existente, móvil físico, vista previa y guardado del selector con Daniel de punta a punta.
- **Límite conocido:** al moverse una parte pueden aparecer costuras mínimas (el dibujo está partido en grupos sin solapes); con ≤ 12° y 400 ms apenas se notan.


---
## Auditoría JS · Bloque 1 «Avisos dentro de modales y mazos» (`learny-v47` → `learny-v48`)
- **JS-016:** un `<dialog>` abierto con `showModal()` está en la capa superior y tapa `#toast` (un `div` con `z-index`), así que los avisos de validación de cualquier formulario modal no se veían. `placeToast()` (`js/03-interfaz.js`) mueve `#toast` dentro del diálogo abierto (el de confirmación tiene prioridad) y lo devuelve al `<body>` en el evento `close`. Sin cambios de CSS ni de `index.html`; `toast()`, el «Deshacer» (8 s, tecla Z) y los textos son los mismos.
- **JS-006:** `newDeck` (`extras.js`) separa en la primera `|`: la respuesta conserva sus barras. Mensaje de error más claro y aviso de las líneas omitidas al crear.
- **JS-005:** «Estudio inteligente» valida nombre y materia en blanco tras `clean()`.
- Archivos: `js/03-interfaz.js`, `extras.js`, `sw.js` (`learny-v48`), `README.md` (versión), este archivo.

---
## Auditoría JS · Bloque 2 «Temporizador y sesiones» (`learny-v48` → `learny-v49`)
- **JS-001 (P1):** `AWAY_MS` sube de 20 s a 120 s (aceptación silenciosa: una pestaña oculta detecta el fin con hasta ~1 min de retraso por el límite de temporizadores). Más allá, `lateBlock()` (`js/05-temporizador.js`) ya no descarta en silencio: congela el temporizador y pregunta «¿Estudiaste este bloque?» (`confirmDialog`, que gana el parámetro `cancel`). «Sí, registrarlo» → `finishPhase()` (el bloqueo por `runId` evita duplicados entre pestañas); «No, descartarlo» (o Esc) → `resetTimer('focus')`. Si mientras tanto el temporizador cambió (otra pestaña), no se hace nada. Un descanso tardío se descarta como antes.
- **JS-002:** `askAbandon` recuerda el `runId`; si al enviar el bloque ya terminó o cambió, solo cierra y avisa (no registra un abandono con datos del descanso). La valoración del bloque terminado aparece al cerrar, como antes.
- **JS-003:** la valoración del bloque (`completePhase`) y `replanDeadline` buscan su objeto por `id` al guardar, en vez de escribir sobre el capturado antes de que otra pestaña sustituyera `state`. Si la sesión se perdió en la sincronización, se recupera; si la fecha ya no existe, se avisa.
- Archivos: `js/03-interfaz.js`, `js/04-planificador.js`, `js/05-temporizador.js`, `sw.js` (`learny-v49`), `README.md`, este archivo.
- Pruebas (Chromium, app completa): retraso 10 min → pregunta; Sí → 1 sesión y valoración; No → 0 sesiones y temporizador en reposo; retraso 40 s → se registra sin preguntar; «Reiniciar» abierto hasta el fin del bloque → 1 sola sesión y modo descanso; valoración tras sustituir el estado → `energy`/`achieved` guardados y persistidos; replan tras sustituir el estado → 90 min/día aplicados y persistidos. Sin errores de página.
- Sin probar: congelación real de pestañas/móvil, dos pestañas reales con el diálogo abierto en ambas, lector de pantalla. Los textos nuevos están en español: en inglés se muestran sin traducir hasta ampliar `EX` en `18-idioma.js` (Bloque 5).

---
## Auditoría JS · Bloque 3 «Arranque y protección de datos» (`learny-v49` → `learny-v50`)
- **JS-004:** con datos de una versión más nueva (`newerFrom`), `bootHold` también se activa (`js/02-datos.js`) y el guardado final del arranque se omite (`js/15-inicio.js`). `learny.v3` queda intacto; `lastSavedRaw` sigue sin fijarse, así que `newerStored()` frena cualquier guardado posterior (estado «No guardado» y aviso). Textos del aviso de arranque y del de `save()` (`js/03-interfaz.js`) reescritos: ya no hablan de «otra pestaña» ni prometen que se guardará degradado. Consecuencia: con datos más nuevos esta versión es de solo lectura hasta actualizar la app (importar o restaurar copias también quedan sin guardar).
- **JS-012:** `idOf()` y `uniqueIds()` (`js/02-datos.js`): ids siempre cadenas no vacías y únicos por lista (tarjetas, sesiones, fechas, temas, tareas, notas, planLog); `deadlineId` de las tareas se convierte a cadena. Si dos fechas comparten id, las tareas quedan con la primera.
- **JS-009:** «Descargar original» quita `"apiKey":"…"` del texto antes de descargar y lo avisa. Pendiente (no tocado): `learny.corrupt` y `learny.newer` siguen guardando el texto original en el navegador, con la clave si la había; «Borrar todo» sí los elimina, «Quitar clave guardada» no.
- Archivos: `js/02-datos.js`, `js/03-interfaz.js`, `js/15-inicio.js`, `sw.js` (`learny-v50`), `README.md`, este archivo.
- Pruebas (Chromium, app completa): `learny.v3` con `version: 5` y campo extra → byte a byte igual tras cargar y tras intentar guardar, copia en `learny.newer`, estado «No guardado» + aviso; copia con ids numéricos y repetidos → todos cadenas únicas y tareas enlazadas; datos dañados con clave y sin sitio para la copia → el archivo descargado trae `"apiKey":""`. Sin errores de página.

---
## Auditoría JS · Bloque 4 «Importaciones» (`learny-v50` → `learny-v51`)
- **JS-010 (CSV):** (a) con cabecera reconocida, una columna de metadatos («id», «guid», «tags», «fecha»…) ya no pasa a ser la materia ni la pregunta/respuesta: la materia solo sale de una columna llamada como tal (`materia`, `subject`, `tema`, `deck`, `mazo`); si no hay, queda «Importado». En `id,pregunta,respuesta` antes la columna id se tomaba como materia. (b) `parseCsv` solo descarta las líneas de directiva reales de Anki (`#separator`, `#html`, `#guid/notetype/deck/tags column`, `#columns`, `#file version`…) y solo al principio del archivo; antes se perdía sin avisar cualquier fila cuya primera celda empezara por `#palabra:` (p. ej. «#include: …»).
- **JS-011 (importar mazo):** `validateBackup` aplica ahora lo mismo que `hydrate`: nombres recortados, sin repetidos dentro del archivo y máximo 500 tarjetas por mazo propio (`MAX_DECK_CARDS`). `importData` también omite los nombres que ya existen en tus mazos o que coinciden con los iniciales (`BUILTIN_DECK_NAMES`, copia de `DECKS` de `extras.js`: mantenerla igual) y lo explica en la vista previa (nota con mazos omitidos y tarjetas fuera del límite).
- Archivos: `js/12-copias-e-importacion.js`, `sw.js` (`learny-v51`), `README.md` (versión), este archivo.
- Pruebas (Node, funciones extraídas con stubs; NO en navegador): `id,pregunta,respuesta` → materia «Importado»; fila `#include: …` conservada; directivas de Anki al inicio descartadas y una `#deck:` posterior conservada; cabecera con `materia` sigue dando la materia; mazo con 520 tarjetas → 500 (20 fuera), nombre repetido omitido y nombre existente («Mío») omitido en la vista previa.
- Sin probar: importación real desde el selector de archivos, vista previa con la nota nueva, Anki real con varias columnas de metadatos.
- Límite conocido: `BUILTIN_DECK_NAMES` duplica los nombres de `DECKS` (`extras.js` no los expone). Los textos nuevos están en español: en inglés se muestran sin traducir hasta ampliar `EX` en `18-idioma.js` (Bloque 5).

---
## Auditoría JS · Bloque 5 «Robustez menor de interfaz» (`learny-v51` → `learny-v52`)
- **JS-007 (`js/13-ajustes.js`):** Ajustes ya no depende de `LumiCompanion`: si `16-lumi.js` no cargó, la ventana abre igual y solo omite el selector «Apariencia de Lumi». Al guardar, si no hay selector se conserva la apariencia guardada (antes `sanitizeSettings` la habría vuelto a «bee»).
- **JS-008 (`js/14-eventos.js`):** `P` y `Z` ignoran la repetición de tecla (`e.repeat`): mantener `P` pulsada ya no iniciaba y pausaba el Pomodoro sin parar. Calificar con 1/2/3 y Espacio ya estaban protegidos (350 ms y estado revelado).
- **JS-014 (`extras.js`):** los borradores en memoria se vacían también cuando OTRA pestaña hace «Borrar todo» (evento `storage` con `learny.drafts` o `learny.v3` eliminados, o almacenamiento limpiado). Antes, el siguiente tecleo reescribía todos los borradores viejos. Los campos de texto siguen conservando lo escrito, igual que en la pestaña que borra.
- **JS-013 (`js/18-idioma.js`, `extras.js`):** (a) `STRICT` suma contenedores con texto del usuario (`#topic-results`, `.review-card`, `#distraction-list`, `#concept-map b`, títulos de `#deadline-list`, `#week-calendar .tag`): ahí solo se traducen rótulos exactos. (b) `AI_NOTE` ya no se pierde con prompts largos: se recorta el prompt a `MAX_PROMPT - AI_NOTE.length` y luego se añade la nota (antes `askGemini` recortaba justo el final). (c) Dictado: el idioma de reconocimiento sigue al de la interfaz (inglés → `en-*`), la etiqueta de reposo se restaura en español y se traduce (antes se quedaba en inglés al volver a español), y el aviso «Escuchando…» y los dos errores de dictado tienen traducción.
- Archivos: `js/13-ajustes.js`, `js/14-eventos.js`, `js/18-idioma.js`, `extras.js`, `sw.js` (`learny-v52`), `README.md` (versión), este archivo.
- Pruebas: `node --check` en los cuatro archivos; prueba en Node del envoltorio de la IA (prompt de 12 000 caracteres conserva la nota y no pasa de 9 000; prompt vacío sigue vacío). NO probado en navegador: Ajustes sin `LumiCompanion`, dos pestañas reales con «Borrar todo», dictado real, traducción de los contenedores estrictos.
- Límite conocido: la lista `STRICT` es una decisión de equilibrio. En esos contenedores el texto generado por la app que no sea un rótulo exacto (p. ej. «Tarjeta 1») queda en español; los contenedores mixtos (`#today-tasks`, `#weak-topics`, `#insight-actions`) se dejaron como estaban.

---
## Auditoría JS · Bloque 6 «Infraestructura» (`learny-v52` → `learny-v53`)
- **JS-015 · `sw.js`:** (a) el guardado en caché de cada respuesta correcta va dentro de `event.waitUntil(...)` (antes `cache.put` quedaba suelto y el navegador podía parar el service worker antes de terminar; un fallo al guardar ya no rompe la respuesta). (b) Un 404 o 5xx del servidor (despliegue a medias, caída de GitHub Pages) ahora cae a la copia en caché; si no hay copia se devuelve esa respuesta tal cual. Otros 4xx se devuelven sin más; solo se guardan respuestas `ok`. La lista `CORE` no cambia.
- **JS-015 · `proxy-worker.example.js`:** el límite de tamaño también actúa cuando la petición llega sin `Content-Length` (envío por trozos): el cuerpo se lee en flujo y se corta al pasar `MAX_BODY × 4` bytes (`readLimited`), con 413. Antes `request.text()` leía todo sin tope. Hay que volver a desplegar el Worker para que surta efecto.
- **Limpieza:** los tres duplicados con sufijo «(2)» (`01-base (2).js`, `16-lumi (2).js`, `16-lumi-daniel (2).js`) no estaban en los archivos del proyecto y ningún archivo los referencia (`index.html`, `sw.js`, `README.md` sin menciones): se pueden borrar del repositorio sin efecto. Borrado a cargo del usuario.
- Pruebas (Node; NO en navegador real): Worker con petición normal (200), cuerpo por trozos de 500 kB sin `Content-Length` (413 y sin llamar a Gemini), trozos pequeños válidos (200), 20 000 caracteres con acento (200) y 25 000 (413); `sw.js` en un entorno simulado: 200 se guarda con `waitUntil`, 503 y 404 con copia sirven la copia, 503 sin copia devuelve el 503, sin red sin copia da error y sin red con copia sirve la copia.
- Sin probar: actualización real del service worker v52 → v53 en una instalación existente, despliegue del Worker en Cloudflare, comportamiento con un 5xx real de GitHub Pages.
- **Observación (sin tocar):** `js/16-lumi-yor.js` (apariencia «Yor Forger») está en el proyecto pero no se carga: no figura en `index.html`, `sw.js`, `MASCOT_AVATARS` ni `ART` de `16-lumi.js`, y no tiene CSS. Es arte sin integrar; decidir si se integra o se retira.


---
## Yor Forger · Bloque 1 «Aspecto» (`learny-v53` → `learny-v54`)
Quinta apariencia de Lumi (`settings.mascotAvatar = 'yor'`, nombre visible «Yor Forger»). Mismo patrón que Daniel: un solo controlador, el arte solo representa. La abeja sigue siendo la predeterminada. Solo integración: sin animaciones, sin cambios de estados, textos, prioridades ni cooldowns, y sin tocar bee, eevee, walle ni daniel.
- **Autorización:** el arte (`js/16-lumi-yor.js`, 19×22 celdas en rejilla 24×24) ya indicaba contar con el permiso del autor del pixel art; por eso entra en el precaché (`CORE`). Para retirarlo: borrar el archivo, su `<script>`, su línea en `CORE` y `'yor'` de `MASCOT_AVATARS` (sin el archivo el selector no la ofrece y un `yor` guardado se muestra como abeja).
- **Archivos:** `js/16-lumi-yor.js` (SIN cambios), `js/01-base.js` (`'yor'` en `MASCOT_AVATARS`, tras `'daniel'`), `js/16-lumi.js` (entrada `yor` en `ART` y comentario de cabecera), `index.html` (`<script>` antes de `16-lumi.js`), `sw.js` (`./js/16-lumi-yor.js` en `CORE` y `learny-v54`), `style.css` (bloque «Lumi · avatar Yor Forger» al final), `README.md` (versión y lista de apariencias). `02-datos.js` y `13-ajustes.js` no cambian: validación y selector leen `MASCOT_AVATARS` / `LumiCompanion.avatars()`.
- **CSS:** `.lumi-svg--yor` oculto por defecto y visible con `data-avatar="yor"` (que oculta la abeja); variables `--yr-*` en `.lumi` con `--yr-rim: transparent` (blanco solo en `.theme-contrast`); clases `.y-rim`, `.y-ink`, `.y-hair`, `.y-skin`, `.y-blush`, `.y-tan`, `.y-gold`, `.y-pale`, `.y-shine`, `.y-eyed`, `.y-eye`, `.y-deep`, `.y-white` (una por letra de `YOR_CELL`). Los colores los elegí yo a partir de la descripción de las letras del mapa (el pelo `--yr-hair` es un gris azulado oscuro algo más claro que la tinta del contorno, para que se distingan); ajustar si no coinciden con la referencia.
- **Caja:** 72 px (3 px por celda) en escritorio y móvil, 36 px en sesión de enfoque, miniatura del selector 72 px. FOCUS anula toda animación del SVG.
- **Pruebas (Chromium + Playwright, app completa servida por http local; 40 de 40, sin errores de consola ni de página):** el selector muestra cinco opciones (las cuatro anteriores más «Yor Forger», nombre accesible comprobado con `getByRole`); miniaturas `aria-hidden` y sin ids; vista previa aplica `yor` con un solo SVG visible; Esc revierte a la abeja; ciclo bee/yor/eevee/walle/daniel/bee sin duplicar el SVG; valores inválidos (`dragon`, `Yor`, 5, `null`, `{}`, `__proto__`) → abeja; guardar + recargar conserva `yor` (clave `learny.v3`), el radio sale marcado al reabrir, un `mascotAvatar: 'yor'` guardado se carga y uno inválido cae a la abeja; 72/36 px medidos; rim blanco en Alto contraste y transparente en Oscuro; sin desborde horizontal a 320, 390 y 1000 px en las 6 páginas y con Ajustes abierto; caché `learny-v54` con `js/16-lumi-yor.js`. Captura a 1000 px revisada a ojo.
- **Notas de la prueba:** la interfaz arranca en inglés (idioma por defecto), así que el nombre de la abeja salió como «Pixel bee»; «Yor Forger» no tiene traducción y se ve igual en ambos idiomas. El grupo «Disposición» de Ajustes está plegado: el selector solo es accesible tras abrirlo.
- **Pendiente:** los seis temas a ojo (solo se comprobaron rim en Oscuro y Alto contraste), lector de pantalla, Alto contraste real del sistema, actualización PWA v53 → v54 sobre una instalación existente (la prueba usó una instalación nueva), importar un JSON real con `yor` desde el selector de archivos, nitidez en móvil físico y pantallas 1×.
- **Siguiente:** Bloque 2 · animaciones de Yor (`.yor-body`, `.yor-eyes`, `.yor-gem-l/-r`) solo con CSS.


---
## Yor Forger · Bloque 2 «Animaciones» (`learny-v54` → `learny-v55`)
Solo **representación**: `16-lumi.js`, `16-lumi-yor.js` y el resto de la lógica no cambian (estados, textos, frecuencias, prioridades, cooldowns, eventos). Archivos tocados: `style.css` (bloque «Lumi · poses de Yor Forger» al final), `sw.js` (`learny-v55`), `README.md` (versión) y este archivo.
- **Cómo funciona:** solo `transform` sobre `.yor-gem-l`, `.yor-gem-r` (pivotes en la base de cada adorno, junto al pelo: 7,5/11 y 17,5/11) y `.yor-eyes` (pivote 12,5/15), más los keyframes generales sobre el SVG; un ciclo de ≤ 400 ms que el controlador limpia con temporizador. Movimiento reducido, pestaña oculta y desactivación de Lumi los cubren las reglas generales; FOCUS anula toda animación.
- **Decisión de diseño:** en Yor los ojos y los adornos son grupos HERMANOS de `.yor-body` (no hijos de la cabeza, como en Daniel). Girar el cuerpo los despegaría, así que NO se gira la cabeza: los gestos de cuerpo entero se aplican al SVG con `lumi-lean`, `lumi-nod`, `lumi-hop` y `lumi-wave`, y las partes hacen solo movimientos pequeños (≤ 9°). Si se quisiera un ladeo de cabeza real habría que reagrupar el SVG en `16-lumi-yor.js` (meter ojos y adornos dentro de un grupo «cabeza»).
- **NEUTRAL:** pose de la referencia, sin movimiento continuo; al aparecer, un parpadeo y un pequeño aleteo de los adornos.
- **FOCUS:** estático.
- **CELEBRATE:** salto general `lumi-hop` + ambos adornos se abren 6° + parpadeo.
- **WELCOME:** saludo general `lumi-wave` + el adorno derecho se balancea (hasta 9°).
- **SUPPORT:** inclinación `lumi-lean` + ambos adornos se alzan 4° (curiosidad, no tristeza).
- **PROGRESS:** asentimiento `lumi-nod` + parpadeo.
- **EMPTY:** ladeo mínimo del SVG de 3° hacia el lado contrario (`yor-tilt-r`).
- **Pruebas (Chromium + Playwright, app completa con `?demo`, 1000 px; 33 de 33, sin errores de consola ni de página):** cada estado usa exactamente las animaciones previstas en las partes previstas, con un ciclo y 400 ms; NEUTRAL sin ninguna animación activa tras 2,2 s; FOCUS con gesto y entrada marcados: 0 animaciones; `data-paused` deja las animaciones en pausa; movimiento reducido del sistema y de Learny: 0 animaciones en los cinco gestos; la entrada (apagar/encender Lumi) parpadea, mueve los adornos y se limpia por temporizador; con el controlador real, `learny:pomodone` produce `data-react="celebrate"` con los adornos animados y se limpia solo; caja de 72 px intacta; regresión de daniel (brazo), eevee (cola), walle (cabeza) y bee (ala) con sus animaciones. Además, la batería del Bloque 1 (40 pruebas) sigue pasando salvo una aserción que tenía `learny-v54` fijo (la caché ahora es `learny-v55` y contiene el archivo). Fotogramas congelados de CELEBRATE y WELCOME revisados a ojo.
- **Pendiente:** seis temas a ojo, lector de pantalla, Alto contraste real, actualización PWA v54 → v55 sobre instalación existente, móvil físico, y ver los gestos con una sesión real de estudio de punta a punta.
- **Límite conocido:** al girar los adornos aparecen costuras mínimas (huecos < 1 celda donde se separan del pelo, porque el dibujo está partido en grupos sin solapes); con ≤ 9° y 400 ms apenas se aprecian a 72 px. Los pendientes de color del Bloque 1 (tonos de los cuernos y del pelo frente a la referencia) siguen abiertos.


---
## Cat Black · Bloque 1 «Aspecto» (`learny-v55` → `learny-v56`)
Sexta apariencia de Lumi (`settings.mascotAvatar = 'gato'`, nombre visible «Cat Black»). Mismo patrón que Daniel y Yor: un solo controlador, el arte solo representa. La abeja sigue siendo la predeterminada. Solo integración: sin animaciones propias y sin tocar bee, eevee, walle, daniel ni yor.
- **Origen:** el parche `parche-gato-bloque1.md` estaba escrito sobre la v47 (cinco apariencias menos Yor) y daba por existente `js/16-lumi-gato.js`, que no estaba en el proyecto. Se adaptó a la v55 (`MASCOT_AVATARS` termina en `'yor', 'gato'`; `CACHE` pasa de v55 a v56) y el arte se trazó desde `gato-preview.png`.
- **Arte:** la imagen usa celdas de 8 px exactas (rejilla 64×64) y 5 colores. `GATO_MAP` son 58 filas de 50 letras (k pelaje · w ojos · g gris · r contorno gris azulado) colocadas en (7, 3), como en la imagen. Render del componente a 512 px comparado con la referencia: **diferencia nula** (idéntico píxel a píxel). El contorno `r` forma parte del dibujo (no se calcula): es transparente en Claro, plateado en Cromo y blanco en Alto contraste. Grupos para el Bloque 2: `.gato-body`, `.gato-eyes`, `.gato-rim`.
- **Archivos:** `js/16-lumi-gato.js` (nuevo), `js/01-base.js` (`'gato'` en `MASCOT_AVATARS`), `js/16-lumi.js` (cabecera y entrada `gato` en `ART`), `index.html` (`<script>` tras `16-lumi-yor.js`, antes de `16-lumi.js`), `sw.js` (`learny-v56` y arte en `CORE`), `style.css` (bloque «Lumi · avatar Cat Black» al final), `README.md`. `02-datos.js` y `13-ajustes.js` no cambian: validación y selector leen `MASCOT_AVATARS` / `LumiCompanion.avatars()`.
- **Caja:** 96 px en escritorio, 64 px en móvil (≤ 820 px), 48 px en enfoque; miniatura del selector 64 px (1,5 px por celda en escritorio).
- **Retirada:** borrar `js/16-lumi-gato.js`, su `<script>`, su línea en `CORE` y `'gato'` de `MASCOT_AVATARS` (sin el archivo el selector no la ofrece y un `gato` guardado se muestra como abeja).
- **Pruebas (Chromium + Playwright, app completa con `?demo`, sin errores de página):** el selector ofrece 6 apariencias y «Cat Black» tiene nombre accesible; la vista previa muestra un solo SVG visible; `sanitizeSettings` conserva `gato` y `Gato`/inválidos → abeja; 96 px a 1000 px y 64 px a 390 y 320 px sin desborde horizontal; contorno medido en Oscuro, OLED, Sepia (gris azulado), Claro (transparente), Cromo (plateado) y Alto contraste (blanco); con `data-react="celebrate"` usa `lumi-hop` y con `data-pose="focus"` ninguna animación; la lista `CORE` de `sw.js` coincide con los `<script>` de `index.html`.
- **Pendiente:** lector de pantalla, Alto contraste real del sistema, actualización PWA v55 → v56 sobre instalación existente, móvil físico (a 96 px la celda mide 1,5 px), vista previa y guardado del selector de punta a punta en un navegador real, y el Bloque 2 (poses propias).


---
## Cat Black · Bloque 2 «Animaciones» (`learny-v56` → `learny-v57`)
Solo **representación**: `16-lumi.js` y el resto de la lógica no cambian (estados, textos, frecuencias, prioridades, cooldowns, eventos). Archivos tocados: `js/16-lumi-gato.js` (solo el reparto en grupos), `style.css` (bloque «Lumi · poses de Cat Black» al final), `sw.js` (`learny-v57`), `README.md` y este archivo.
- **Grupos (cambio en el arte, el dibujo no cambia):** `.gato-eyes` (aros blancos y las dos pupilas, que se detectan como los componentes de pelaje encerrados por el aro; se ignora el hueco de 20 celdas junto al contorno izquierdo), `.gato-ear-r` (x ≥ 34, y 10–27 del mapa), `.gato-tail` (x ≥ 41 y y ≥ 37, o y ≥ 49 y x ≥ 22) y `.gato-body` (el resto). El contorno `r` va con la parte a la que pertenece, así que ya no existe `.gato-rim`. Bajo los ojos hay pelaje oscuro extra en `.gato-body`: sin él, al parpadear asomaba el fondo (defecto visto en las pruebas y corregido).
- **Cómo funciona:** solo `transform`; pivotes en `transform-origin` en unidades del viewBox 64 (sprite desplazado (7, 3)): ojos 32/26, oreja 41/22, cola 52/41. Un ciclo de ≤ 400 ms que el controlador limpia con temporizador. Movimiento reducido (sistema y Learny), pestaña oculta y desactivación de Lumi los cubren las reglas generales sobre `.lumi *`; en FOCUS la regla del Bloque 1 anula toda animación.
- **NEUTRAL:** pose de la referencia, sin movimiento continuo; al aparecer, parpadeo y un meneo breve de cola (300 ms).
- **FOCUS:** estático.
- **CELEBRATE:** salto general `lumi-hop` + cola (hasta 7°) + oreja (7°) + parpadeo.
- **WELCOME:** saludo general `lumi-wave` + balanceo de cola (5°) + oreja.
- **SUPPORT:** inclinación `lumi-lean` + oreja alzada (5°); curiosidad, no tristeza.
- **PROGRESS:** asentimiento `lumi-nod` + parpadeo.
- **EMPTY:** balanceo lento de la cola.
- **Pruebas (Chromium + Playwright, app completa con `?demo`, 1000, 390 y 320 px; sin errores de página):** el dibujo estático sigue idéntico a la referencia (diferencia nula) tras partirlo en grupos; cada estado usa exactamente las animaciones previstas en las partes previstas, con un ciclo de 400 ms (entrada, 300 ms); NEUTRAL sin ninguna animación activa tras 2,5 s; FOCUS con gesto y entrada marcados: 0 animaciones; `data-paused` deja las animaciones en pausa; movimiento reducido de Learny: 0; con el controlador real, `learny:pomodone` produce `celebrate` con cola, oreja y ojos animados y se limpia solo; regresión de abeja, Eevee, WALL·E, Daniel y Yor con sus animaciones y un solo SVG visible; sin desborde horizontal a 390 y 320 px; `sw.js` coincide con los `<script>`; el `style.css` anterior es un prefijo exacto del nuevo. Fotogramas congelados (cola y oreja a +7° y −5°, ojos cerrados) revisados a ojo.
- **Pendiente:** movimiento reducido del *sistema* operativo (solo se probó el de Learny), seis temas a ojo con las poses, lector de pantalla, actualización PWA v56 → v57 sobre instalación existente y móvil físico.
- **Límite conocido:** al girar la cola o la oreja aparecen costuras mínimas donde se separan del cuerpo (el dibujo está partido en grupos sin solapes); con ≤ 7° y 400 ms apenas se notan a 96 px. Los gestos de apoyo, progreso y vacío solo se ven si Lumi está visible (lo está en todas las secciones desde la v42).


---
## Auditoría 2 · correcciones (`learny-v57` → `learny-v58`)
**Fase 1 (P2):** JS-101 (`16-lumi.js`, `hide()` enfoca `.page.active h1`); JS-102 (`10-revision-ia-y-temas.js` y `extras.js`: en la rama `stale` se restaura el contenido local sin aviso).
**Fase 2 (P3 con efecto):** JS-104 (`resetTimer`/`restoreTimer` vacían `timer.intention`); JS-105 (`completePhase` fecha la sesión con `endAt`); JS-106 (`adoptRemoteState` llama a `applyPreferences`, salvo que el foco esté en el contexto del tutor); JS-107 (`hydrate` valida `phase` contra `PHASES`; `extras.js` usa `hasOwnProperty`); JS-108 (`confirmDialog` en cola y con `try/catch` en `showModal`); JS-103 (`redistributeIfBehind` sin parámetro y llamada movida tras los `queueToast` de arranque, antes de `bootHold = false`, con `renderAll()`).
**Fase 3 (P3 menores):** JS-111 (`validKey` ASCII al guardar la clave); JS-110 (`scrubKey` en `02-datos.js`, usado por «Quitar clave guardada» y «Descargar original»); JS-112 (`translate="no"` en título/materia de `#deadline-list`, `#calendar-summary` y `#today-tasks`).
**No cambiado:** JS-109 (requiere comprobar en navegador) y las dos mejoras opcionales (rendimiento de `save()`, tope de chats).
**Efectos a tener en cuenta:** una sesión registrada tarde («Sí, registrarlo» al día siguiente) queda fechada el día en que terminó, por lo que Lumi no la celebra (solo celebra sesiones de hoy); «Quitar clave guardada» modifica `learny.newer` (solo el campo `apiKey`).
**Pruebas:** `node --check` en los archivos tocados. NO probado en navegador.


---
## Auditoría 2 · fase final (`learny-v58` → `learny-v59`)
- **Rendimiento de `save()`:** `newerStored()` devuelve la bandera `remoteNewer` (`03-interfaz.js`), que se activa al arrancar con `newerFrom > 0` y en `adoptRemoteState` cuando otra pestaña escribe `version > SCHEMA`, y se apaga al adoptar datos válidos o al borrar todo. **Riesgo:** si el navegador no entrega el evento `storage`, la protección se reanuda al volver a la pestaña (`pullFromStorage`), no al instante.
- **Chats:** máximo 12 mensajes × 1 500 caracteres por tema, también al cargar (`hydrate`, que recorta los antiguos). Los chats solo se guardan; la interfaz no los muestra.
- **JS-109 sin cambios:** `dialog.modal` solo tiene `transform` durante su entrada (220 ms) y termina en `none`; un `position: fixed` dentro se recoloca solo al acabar. Efecto máximo: un desplazamiento breve del aviso mientras entra el modal. Pendiente de comprobar a ojo.
- Pruebas: `node --check`. NO probado en navegador.


---
## Lumi · reposo con vida (`learny-v59` → `learny-v60`)
- **Diagnóstico:** los gestos de las seis apariencias SÍ se disparan (probado en Chromium con `data-react` y con el controlador real: celebrate, welcome, support, progress, empty y la entrada). El problema era de percepción: en reposo no había ningún movimiento (decisión antigua «NEUTRAL sin movimiento continuo»), los gestos duran 0,4 s y solo salen en eventos poco frecuentes, y con «reducir animaciones» del sistema operativo se anula todo (verificado: 0 animaciones).
- **Cambio (solo `style.css`, bloque «Lumi · reposo con vida» al final):** el controlador ya ponía `data-anim="idle"`; ahora el CSS lo usa. Respiración común (`lumi-breathe`, 2 px, 4,5 s) y por apariencia: abeja (alas, antenas), Eevee (cola, orejas), WALL·E (cabeza), Daniel (parpadeo, cabeza), Yor (parpadeo, adornos), Cat Black (parpadeo, cola, oreja). Periodos distintos (3,4–9 s) para que no se muevan a la vez.
- **Apagado:** enfoque (`data-anim="none"` y reglas con `!important`), movimiento reducido, pestaña oculta (`data-paused`), `body.session-practice` (examen). No pisa gestos ni la entrada (`:not([data-react]):not(.is-entering)`).
- **Esto sustituye** la regla anterior «NEUTRAL sin ninguna animación activa tras 2,5 s»; las pruebas de ese tipo ya no aplican al reposo.
- **Pruebas (Chromium, `?demo`, 1000 px, sin errores):** reposo con animaciones en las 6 apariencias; 0 con movimiento reducido del sistema; 0 en enfoque; un gesto sustituye al reposo; la cola de Eevee cambia de transformación 5 veces en 4 s; 0 en examen. Pendiente: verlo a ojo (intensidad), batería en móvil, 320/390 px.


---
## JS-109 · aviso durante la entrada de un modal (`learny-v60` → `learny-v61`)
- **Confirmado en Chromium (antes «pendiente de verificar»):** con el aviso reparentado dentro del `<dialog>` (`placeToast`), mientras el modal anima su entrada (`transform`, 220 ms) un `position: fixed` se posiciona respecto al diálogo, no al viewport. Medido: el aviso estaba en y=676 y, al terminar la transición, saltaba a y=725 (≈49 px en escritorio 1000×800; ≈9 px en móvil 390). El hallazgo era real.
- **Corrección (`js/03-interfaz.js`):** `dialogAnimating()` (`getAnimations()` en curso en `#app-modal` o `#confirm-modal`); `toast()` espera 260 ms (un único reintento, sin bucle gracias a `toast.deferred`) y un aviso nuevo cancela el pendiente. Sin cambios en `motion.css`: la animación del modal es la misma.
- **Medido después:** el aviso aparece a los ~280 ms y su recorrido es monótono (767→743→728→726→725 px; móvil 704→644→640→638), sin saltos. Con el modal ya estable no hay retraso. `offerUndo` + clic en «Deshacer» sigue funcionando.
- **Límite:** un aviso emitido en el mismo instante en que se abre un `confirmDialog` (ahora en cola, abre un microtask después) se coloca en el `<body>` y queda tapado por el diálogo; ya ocurría con avisos emitidos antes de abrirlo y no se tocó.


---
## Movimiento · Etapa 1 «Fondo de las ventanas» (`learny-v61` → `learny-v62`)
- **Medido antes:** la opacidad del `::backdrop` valía 1,00 desde el primer fotograma al abrir y 0,00 desde el primero al cerrar (`getAnimations()` no listaba ninguna transición del fondo), mientras el diálogo sí se desvanecía (0,99 → 0,17 en 140 ms): el velo aparecía y desaparecía de golpe.
- **Cambio (solo `motion.css`, dentro del `@supports (overlay…)` del bloque de modales):** `dialog.modal::backdrop` pasa a tener `transition` de opacidad (salida `--dur-out`, con `overlay` y `display` `allow-discrete`) y `dialog.modal[open]::backdrop` la suya de entrada (`--dur-base`, `--ease-out`); `@starting-style` pone el fondo a 0 al abrir. Solo se anima la opacidad; el desenfoque (3 px, `style.css`) se mantiene fijo (interpolarlo es más caro).
- **Medido después (Chromium, `#app-modal` y `#confirm-modal`, escritorio y 390 px):** abrir velo/diálogo 0,00 → 0,80 → 0,96 → 0,99 → 1,00; cerrar 1,00 → 0,84 → 0,62 → 0,34 → 0,00, en sincronía; velo cerrado `pointer-events: none` y `display: none`; un clic atraviesa la página tras cerrar. Movimiento reducido (sistema y Learny): instantáneo, igual que antes. Regresión de las baterías de movimiento y de avisos sin cambios.
- **Pendiente:** verlo a ojo (la medición es numérica) y Safari/iOS (sin soporte de `allow-discrete` el cierre sigue siendo instantáneo, como antes).
- **Sin cambios por decisión del usuario:** el movimiento de Lumi sigue continuo (no se usa `steps()`).

---
## Movimiento · Fase 1 «Movimiento reducido y limpieza» (`learny-v62` → `learny-v63`)
Paquete PARCIAL: `motion.css`, `style.css`, `js/17-movimiento.js`, `sw.js`, `README.md` y esta nota (añadir al final de `CONTINUIDAD.md`). Sin archivos nuevos: `CORE` de `sw.js` no cambia.
- **Movimiento reducido (sistema o Learny):** antes todos los tokens valían 0 y una regla global de `style.css` (`transition/animation: none !important` sobre `*`) apagaba todo, incluso los fundidos. Ahora `--move-y` 0, `--press` 1, `--modal-scale` 1 y el nuevo `--pulse-scale` 1; duraciones `--dur-fast` 80 ms, `--dur-base/reveal/view` 100 ms, `--dur-out` 80 ms y `--dur-done` 0. Resultado: vistas, ventanas, tarjetas, avisos y listas hacen solo un fundido de opacidad muy corto; no hay desplazamientos, escalas, pulso del temporizador ni barras animadas (`17-movimiento.js` omite las barras con `reduced()`). El esqueleto de carga (`.skeleton`) se detiene. La hoja inferior móvil usa `calc(var(--move-y) * 4)` (24 px normal, 0 reducido).
- **Regla global retirada** de `style.css`; Lumi conserva sus propias reglas `.reduce-motion .lumi…` y `@media (prefers-reduced-motion) .lumi…` (no se tocaron).
- **Limpieza de `style.css` (sin cambio visual esperado):** fuera `transition: .25s` del aviso, `card-in`, `fb-good`, `fb-soft`, `done-pulse` (style.css), `sheet-up` y su `animation` móvil, la transición corta de `button`, y los `button:hover` / `button:active` duplicados (quedan los de la sección «Rediseño» y «Estados uniformes»). `.lumi-hide` conserva su transición con una regla propia. El atenuado de sesión usa `var(--dur-base)`. De `motion.css` se quitaron las reglas que neutralizaban `card-in`/`fb-*` y `.modal { animation: none }`.
- **No tocado:** `flashFeedback()` en `07-tarjetas.js` aún añade las clases `fb-good`/`fb-soft` (ahora sin CSS; inocuas). Limpieza opcional en un bloque de JS.
- **Pruebas:** `node --check` en `17-movimiento.js` y `sw.js`; llaves de CSS balanceadas; grep sin restos de `sheet-up`, `card-in`, `fb-good`, `fb-soft` ni reglas globales de movimiento en `style.css`. NO probado en navegador.
- **Pendiente de comprobar a ojo (normal y reducido, sistema y Learny):** abrir/cerrar un modal en escritorio y móvil, aviso con «Deshacer», cambio de vista, revelar y calificar tarjeta, borrar de una lista, fin de bloque (sin pulso en reducido), `.skeleton` quieto, botones (hover/active sin salto), Lumi sin cambios, seis temas.
- **Riesgo:** quitar la regla global puede dejar visible una transición que antes se apagaba por accidente; las únicas fuera de Lumi son el atenuado de sesión (opacidad) y el esqueleto (ya cubierto).
- **Siguiente:** Fase 2 · rendimiento y batería (tokens leídos una vez, pausa de los bucles de Lumi).

---
## Movimiento · Fase 2 «Rendimiento y batería» (`learny-v63` → `learny-v64`)
Paquete PARCIAL, acumulativo sobre la Fase 1: `js/16-lumi.js`, `js/17-movimiento.js`, `style.css`, `sw.js`, `README.md` y esta nota (añadir al final de `CONTINUIDAD.md`). Sin archivos nuevos: `CORE` de `sw.js` no cambia. `motion.css` no cambia respecto a la Fase 1.
- **Reposo de Lumi con tope.** Los movimientos infinitos de reposo (`data-anim="idle"`) repintan el SVG en cada fotograma (hasta ~800 rectángulos). Tras `restAfterMs` (30 s, en `LUMI_CONFIG`; 0 = nunca) sin actividad, el controlador pasa a `data-anim="rest"`: ninguna regla de reposo aplica, así que queda la pose de la referencia y no hay animaciones. Para que el corte no se note espera al final de un ciclo de respiración (`animationiteration` de `lumi-breathe`, ≤ 4,5 s) y, si no llega, se detiene a los 6 s (`restWaitMs`). Vuelve a `idle` con la primera actividad: `pointerdown`, `keydown`, `wheel`, `touchstart` (máximo 1 por segundo mientras no esté en reposo), los eventos `learny:page`, `rated`, `pomodone`, `timer`, `examend`, `reset` y al volver a la pestaña. En enfoque o con movimiento reducido (`data-anim="none"`) no hay nada que detener: el temporizador solo reintenta. Los gestos, mensajes, prioridades, cooldowns y la lógica de reacciones no cambian.
- **Capa propia.** `will-change: transform` en el SVG solo mientras `data-anim="idle"` (sin gesto ni entrada); al pasar a reposo se retira.
- **«Cuando Lumi no se ve»:** ya estaba cubierto por `data-paused` (pestaña oculta) y por `display: none` del dock (portada o Lumi desactivada). No se añadió detección de ventanas abiertas: bajo el velo de un modal el reposo sigue hasta que vence el temporizador.
- **`17-movimiento.js`:** los tokens (`--dur-*`, `--move-y`, `--press`, easings) se leen con `getComputedStyle` una sola vez y se guardan; la caché se invalida al instante cuando cambia `body.reduce-motion` o `prefers-reduced-motion` (comprobación con `classList` y `matchMedia`, sin forzar estilo). `visible()` descarta antes las páginas inactivas (`.page` sin `.active`) y solo entonces mide con `getClientRects()`.
- **Decisión a revisar:** el reposo con vida (v60) se añadió porque Lumi parecía quieta; ahora se detiene a los 30 s sin actividad. Si prefieres que nunca pare, `restAfterMs: 0`. Valores intermedios (60 000, 120 000) son un cambio de una línea.
- **Pruebas (Chromium headless, app completa con `?demo`, 1000 px, `setTimeout(30 000)` acortado a 400 ms para la prueba; 18 de 18):** arranca en `idle` con respiración activa; pasa a `rest` a los ~3 s del arranque (al final del ciclo) sin ninguna animación activa; un clic y una tecla reanudan; vuelve a `rest`; en enfoque queda `none` y sigue `none`; tras abrir y cerrar Ajustes válido; apagar Lumi → `none` y reactivar → `idle`; movimiento reducido → `none`; 4 llamadas a `getComputedStyle` en 5 cambios de vista; la entrada de vista usa `translateY(0px)` en reducido y `translateY(6px)` en normal tras volver (la caché se refresca); sin errores de página ni de consola.
- **No probado:** consumo real de batería y fotogramas por segundo (no medidos), móvil físico, las seis apariencias una a una en reposo/reanudación (solo la abeja, la predeterminada), `restAfterMs` real de 30 s, varias pestañas, lector de pantalla.
- **Siguiente:** Fase 3 · continuidad visual (fundido cruzado entre páginas y borrado continuo en listas).

---
## Movimiento · Fase 3 «Continuidad visual» (`learny-v64` → `learny-v65`)
Paquete PARCIAL, acumulativo sobre las Fases 1 y 2: `js/17-movimiento.js`, `motion.css`, `sw.js`, `README.md` y esta nota (añadir al final de `CONTINUIDAD.md`). `style.css` y `js/16-lumi.js` no cambian respecto a la Fase 2. Sin archivos nuevos: `CORE` de `sw.js` no cambia.
- **Fundido cruzado entre páginas.** `showPage()` no se toca ni se envuelve (sigue siendo síncrono). Un `MutationObserver` sobre `.main > .page` (microtarea, antes de pintar) detecta qué página perdió y cuál ganó `.active`; la saliente queda ~120 ms (`--dur-leave`; 80 ms en movimiento reducido) como capa absoluta (`.page.page-leaving`, colocada con `top/left/width` de la entrante), `inert`, `aria-hidden` y sin clics, mientras se desvanece; la entrante hace su entrada de siempre. `.main` pasa a `position: relative` para colocarla; `#study.page-leaving` repite la rejilla de `#study.active`. Sin fundido si el modo sesión cambió (examen o enfoque, para no mostrar un instante la página completa), si la entrante no se ve (portada), con la pestaña oculta o con `--dur-leave` a 0. Navegación rápida y vuelta a la misma página: la capa anterior se retira de inmediato; un temporizador de respaldo la limpia siempre (`a.cancel()` + clases, `inert` y estilos).
- **Borrado continuo en listas.** El fantasma ya no solo se desvanece: colapsa `height`, relleno y borde hasta 0 en `--dur-base` (220 ms) y el hueco entre filas (el `row-gap` de la rejilla, que un elemento no puede encoger solo) se cierra con un margen negativo animado en el vecino que queda (el siguiente; si no hay, el anterior). Una sola limpieza cancela las animaciones y retira los fantasmas en el mismo instante: sin salto final. Con movimiento reducido (`--move-y` = 0) solo se desvanece, como antes. Decisión: se eligió colapsar la altura (y no FLIP con `transform`) porque también mueve de forma continua el contenido que hay debajo de la lista, que FLIP no cubriría; cuesta diseño durante 220 ms en ≤ 3 elementos.
- **Pruebas (Chromium headless, app completa con `?demo`, 1000 px, modo normal y `prefers-reduced-motion`; 38 comprobaciones, sin errores de página ni de consola):** la saliente queda absoluta, inerte, `aria-hidden` y con 1 animación; foco fuera de ella; se limpia del todo (clases, `inert`, `aria-hidden`, estilos y animaciones); navegación rápida study → library → study sin capa residual; mismo destino sin capa; salir de un examen sin capa; la capa no ensancha el documento; borrado de una fecha: el fantasma pasa de 281 px a 1 px, lo que hay debajo sube 297 px con un salto máximo de 38,7 px por fotograma (sin salto final), el siguiente elemento se mueve sin saltos, sin márgenes residuales en los vecinos; borrar el último elemento sin salto final; en reducido el fantasma solo se desvanece. La única discrepancia aparente (6 px entre saliente y entrante en el primer fotograma) es la propia entrada de 6 px de la página nueva; en reposo coinciden (272,4 px).
- **No probado:** móvil físico y 320/390 px, las demás listas (`#library-list`, `#today-tasks`, `#notes-list`) y borrar varios seguidos a la vez, `#study` con `body.new-user`, páginas muy largas (la capa saliente tiene `max-height: 100vh`), los seis temas, lector de pantalla, rendimiento (fps no medidos).
- **Riesgo conocido:** `.main { position: relative }` convierte a `.main` en bloque contenedor de cualquier descendiente absoluto (hoy no hay ninguno que dependa de otro; los `fixed` no cambian).
- **Siguiente:** Fase 4 · pulido (escalonado de ~30 ms y velo de opacidad al calificar). Fase 5 (parcheo del DOM de `renderAll()`) sigue opcional y por decidir.

---
## Movimiento · Fase 4 «Pulido» (`learny-v65` → `learny-v66`)
Paquete PARCIAL, acumulativo sobre la Fase 3: `js/17-movimiento.js`, `motion.css`, `sw.js`, `README.md` y esta nota. Sin archivos nuevos: `CORE` de `sw.js` no cambia. Solo representación: no cambia SM-2, datos, copias ni eventos.
- **Escalonado de listas (`js/17-movimiento.js`):** los elementos nuevos de una lista (hasta `MAX_IN` = 6) entran con retardo `i × --stagger` (30 ms) usando `delay` + `fill: 'backwards'`, para que no se vean enteros antes de su turno. Con movimiento reducido `--stagger` vale 0.
- **Velo al calificar (`motion.css`):** `.flashcard::after` anima solo opacidad (`@keyframes fc-veil`, `--dur-veil` 320 ms; 100 ms en reducido). «Fácil» (`fb-good`) usa el acento con pico .2; «No lo sabía» / «Dudé» (`fb-soft`) usa el color del texto con pico .08. Tras `learny:rated`, `17-movimiento.js` retira esas clases pasado `--dur-veil` + 120 ms (si no, volver a la página de Practicar reiniciaría la animación).
- **Tokens nuevos:** `--stagger: 30ms` y `--dur-veil: 320ms` (reducido: 0 ms y 100 ms).
- **Pruebas:** NO probado en navegador.
- **Pendiente de comprobar a ojo:** añadir varias tarjetas/tareas a la vez (entrada escalonada, sin parpadeo antes del retardo); calificar «Fácil» y «No lo sabía» en los seis temas (velo visible y de distinta intensidad; la clase desaparece sola); movimiento reducido (sin escalonado, velo de 100 ms); volver a Practicar tras calificar (el velo no se repite); móvil y modo examen (`examRate`).
- **Siguiente:** Fase 5 · visibilidad del repaso.

---
## Fase 5 «Visibilidad del repaso» (`learny-v66` → `learny-v67`)
Paquete PARCIAL, acumulativo sobre la Fase 4 (añadir al final de `CONTINUIDAD.md`): `js/07-tarjetas.js`, `js/08-analisis.js`, `js/18-idioma.js`, `index.html`, `style.css`, `sw.js`, `README.md` y esta nota. Sin archivos nuevos: `CORE` de `sw.js` no cambia. Solo representación: SM-2, datos, copias y eventos no cambian.
- **Comprobado antes de empezar:** ni el intervalo en los botones ni la previsión existían (grep sin coincidencias).
- **Intervalo en los botones de calificar** («No lo sabía · 1 d», «Dudé · 6 d», «Fácil · 15 d»). `schedule()` se dividió en `nextSchedule(card, rating)` (cálculo puro, no modifica la tarjeta) y la escritura. `schedule()` aplica ese resultado y los botones lo muestran, así que lo mostrado es lo aplicado. En un repaso anticipado (tarjeta aún no vencida, «Dudé»/«Fácil») la fecha no cambia: el botón dice «sin cambio». `rateHints()` dibuja los botones al revelar (tarjeta normal y examen) y solo reescribe si el valor cambió. Texto visible (`.rate-int`) con `aria-hidden`; el lector de pantalla lee aparte «, mañana» / «, dentro de 6 días» / «, la tarjeta mantiene su fecha» (`.rate-sr`, `sr-only`).
- **Previsión de 7 días** en Reforzar (`renderForecast()` en `08-analisis.js`, tarjeta `#forecast-card` bajo «Qué hacer con estos números»): repasos YA programados por día, reutilizando las clases del gráfico de foco. «Hoy» usa `dueCards()` (incluye lo vencido), igual que el contador de Practicar; se añade «Más adelante: N tarjetas» y la aclaración de que no es una predicción (lo que falles volverá antes). Sin tarjetas: gráfico oculto y aviso. Sin animación de barras (el observador de `17-movimiento.js` solo mira `#focus-chart`).
- **Idioma:** entradas nuevas en `EX` (`18-idioma.js`) y una frase en la guía de uso (ES e inglés). `README.md` incluye también el apartado v66 que la nota de la Fase 4 pedía y el README no tenía.
- **Pruebas:**
  - Node, 200 000 tarjetas aleatorias (los cuatro estados de fecha, los tres botones): `schedule()` nueva == original en todo; `nextSchedule()` no modifica la tarjeta; lo mostrado == lo aplicado.
  - Chromium, app completa con `?demo`, 1000 px, inglés y español (33/33, sin errores de página ni de consola): botones ocultos antes de revelar; tres intervalos al revelar; «Dudé» deja en la tarjeta exactamente lo mostrado; segunda tarjeta recalcula; examen; repaso anticipado («sin cambio»); texto accesible traducido; previsión con 7 columnas, conteos iguales a un recuento independiente y «hoy» == `dueCards()`; sin tarjetas; sin desborde horizontal a 320 y 1000 px.
- **No probado:** móvil físico, lector de pantalla real, los seis temas a ojo (usa solo `--muted`), actualización PWA v66 → v67 sobre una instalación existente, colecciones de miles de tarjetas (la previsión es una pasada por tarjeta; sin medir).
- **Límites conocidos:** el intervalo se muestra siempre en días («d»), también en 100+ días. La previsión no incluye lo que se falle o repase antes. Los textos nuevos del botón solo se redibujan al revelar: si cambia el día con la tarjeta revelada, se actualizan en la siguiente.
- **Siguiente:** Fase 6 · red de seguridad (suite Playwright empezando por `nextSchedule()`, que ahora es una función pura fácil de probar).

---
## Fase 6 «Red de seguridad» (`learny-v67` → `learny-v68`)
Paquete PARCIAL, acumulativo sobre la Fase 5. Archivos nuevos: `package.json`, `playwright.config.js`, `.gitignore`, `tests/sm2.spec.js`, `tests/copia-archivo.spec.js`, `js/19-copia-archivo.js`. Modificados: `js/13-ajustes.js` (2 líneas), `js/18-idioma.js`, `index.html`, `sw.js` (`CORE` + `learny-v68`), `README.md` y esta nota. SM-2, modelo de datos y copias rotativas no cambian.
- **Comprobado antes de empezar:** no había pruebas ni código de File System Access (grep sin coincidencias).
- **Suite Playwright:** `npm install` · `npx playwright install chromium` · `npx playwright test`. Servidor local con `http-server` (puerto 4173), service worker bloqueado, todo en `?demo`.
  - `sm2.spec.js` (11): 1 d / 6 d / ×EF, «Dudé» (EF 2,36; maduro ×1,2 sin sumar repeticiones), «No lo sabía», tope 180 d, suelo de EF 1,3, repaso anticipado, `nextSchedule` pura, `schedule` aplica lo mostrado, historial ≤ 40, propiedad con 5 000 casos aleatorios.
  - `copia-archivo.spec.js` (6): sin API (no hay botón), demo (nunca activa), botón en Ajustes, escritura sin `apiKey` y solo si hay cambios, permiso caducado → «en pausa» → reactivar, `bootHold` no escribe.
- **Copia automática a archivo (`js/19-copia-archivo.js`, `LearnyFileBackup`):** opcional, solo con `showSaveFilePicker` (Chrome/Edge de escritorio). La persona elige UN archivo; se reescribe cada ~60 s y al ocultar la pestaña, solo si `lastSavedRaw` cambió. Sin clave API. No en demo; no con `bootHold` ni `newerStored()`. El archivo se recuerda en IndexedDB (`learny-file-backup`). Si caduca el permiso no pide nada solo (hace falta un clic): Ajustes → «Reactivar copia automática». Sin la API no aparece nada y siguen igual `learny.backup` y «Descargar copia».
- **Pruebas ejecutadas:** 17/17 en Chromium headless; `node --check` de todos los `.js`; `CORE` == `<script>`.
- **No probado:** el selector de archivos real de Chrome/Edge (en las pruebas es simulado), que el handle sobreviva al reinicio del navegador (IndexedDB real), Firefox/Safari, móvil, textos en inglés a ojo (hay entradas en `EX` y una regla en `RULES`), actualización PWA v67 → v68.
- **Límites conocidos:** solo copia mientras Learny esté abierta (no hay segundo plano); un único archivo; no restaura desde ese archivo (se restaura con «Importar JSON»).
- **Siguiente:** decidir Fases 7–10 tras probar con 3–4 estudiantes.

## v69 · Modelo de IA por defecto y ayuda sobre Gemini
Paquete PARCIAL, acumulativo sobre la Fase 6 (`learny-v68` → `learny-v69`).
- `DEFAULT_MODEL` pasa de `gemini-flash-latest` a `gemini-3.8-flash` (`js/01-base.js`). `sanitizeSettings` (`js/02-datos.js`) migra los valores por defecto anteriores (`OLD_DEFAULT_MODELS`: `gemini-flash-latest`, `gemini-4-argon`) y el vacío al nuevo; un modelo elegido a mano se respeta.
- Ajustes (`js/13-ajustes.js`): bajo el campo de la clave, explicación de qué es Gemini, enlace a Google AI Studio y enlace a la lista de modelos (https://ai.google.dev/gemini-api/docs/models).
- Guía de uso: tarjeta «Qué es Gemini y cómo conseguir tu clave» en `index.html` (español) y en `GUIDE_EN` de `js/18-idioma.js` (inglés); traducciones del texto de Ajustes en el mismo archivo.
- `proxy-worker.example.js`, `README.md`, `sw.js` (`learny-v69`) y `tests/modelo.spec.js` (6 pruebas; suite total: 23). No cambian SM-2, modelo de datos ni copias.
- Los nombres de modelo salen de la lista de Google AI que dio el usuario; no se verificó que la clave gratuita cubra `gemini-3.8-flash`.


---
## Fase 7a «Crear tarjetas con menos fricción» (`learny-v69` → `learny-v70`)
Paquete PARCIAL, acumulativo sobre v69 (añadir al final de `CONTINUIDAD.md`): `js/07-tarjetas.js`, `js/14-eventos.js`, `js/18-idioma.js`, `index.html`, `sw.js`, `README.md`, `tests/crear-tarjetas.spec.js` y esta nota. `CORE` de `sw.js` no cambia.
- **Comprobado antes de empezar:** no existía crear varias seguidas ni tarjeta inversa; «Crear con IA» solo estaba dentro del bloque plegado «Más formas de repasar» y en el estado vacío.
- **Guardar y añadir otra** (`cardForm`, `07-tarjetas.js`): segundo botón de envío + Ctrl/⌘+Intro. Guarda sin cerrar la ventana y vuelve a llamar a `cardForm` con `{subject, reverse, batch}` (materia y casilla se conservan, campos vacíos, foco en la pregunta, contador «Añadidas en esta tanda»). El indicador `again` lo activa solo ese botón; «Crear tarjeta» (primer botón, el de Intro) lo apaga, así una validación fallida no lo deja pegado.
- **Tarjeta inversa:** casilla solo al crear. Crea una segunda tarjeta normal (pregunta = respuesta, respuesta = pregunta) con `nextReview` mañana. Sin cambios de esquema ni de migración. Si la respuesta supera 500 caracteres (límite de pregunta) no se crea y se avisa.
- **«✨ Crear con IA»** junto a «+ Crear» (`#gen-cards-top`, dispara `learny:gen-cards`, que ya atendía `extras.js`). El botón de `#review-more` se conserva (`extras.js` lo busca por id).
- **Decisiones que tomé yo:** la inversa llega mañana (no hoy) para que no salga justo después de su pareja; no se avisa de duplicados al crear (el aviso existe solo al importar).
- **Pruebas:** `node --check` de todos los archivos tocados; `tests/crear-tarjetas.spec.js` (9 pruebas Playwright, `?demo`) escritas pero NO ejecutadas en este entorno (sin red para instalar Playwright). Ejecutar: `npx playwright test`. Suite total esperada: 32.
- **No probado:** móvil físico (teclado virtual al enfocar la pregunta), lector de pantalla, textos en inglés a ojo, actualización PWA v69 → v70.
- **Fuera de esta fase (7b, decisión pendiente):** cloze. Sí cambia el modelo (campo nuevo, render al revelar, SM-2 por hueco, importación/exportación y migración a v5). Propongo hacerlo solo si los estudiantes lo piden.


---
## Fase 8 «Plan y datos útiles» (`learny-v70` → `learny-v71`)
Paquete PARCIAL, acumulativo sobre la 7a (añadir al final de `CONTINUIDAD.md`): `js/01-base.js`, `js/02-datos.js`, `js/03-interfaz.js`, `js/04-planificador.js`, `js/06-hoy.js`, `js/07-tarjetas.js`, `js/08-analisis.js`, `js/13-ajustes.js`, `js/14-eventos.js`, `js/18-idioma.js`, `index.html`, `style.css`, `sw.js`, `README.md`, `tests/fase8.spec.js` y esta nota. `CORE` de `sw.js` no cambia (sin archivos nuevos en la app).
- **Comprobado antes de empezar:** ni límite de nuevas, ni detección de tarjetas difíciles, ni cifras concretas en las tareas, ni retención real existían (grep sin coincidencias; solo «Recuerdo declarado», que es autoevaluación).
- **Límite de nuevas por día** (`settings.newPerDay`, 20 por defecto, 0 = sin límite; validado en `sanitizeSettings`). `dueSplit()` (`03-interfaz.js`) separa `due` y `held`. Nueva = nunca repasada; el cupo gastado hoy = tarjetas cuya primera entrada de historial es de hoy. Las ya vistas nunca se limitan. `overdueCards()` ahora sale de `dueCards()` para que «vencidas» nunca supere a «de hoy». «Aprender algunas nuevas ahora» (estado vacío de Practicar) salta el límite a petición. Nada se reprograma ni se borra.
- **Tarjetas que se te resisten:** `LEECH_AT = 4` fallos desde `leechSince` (campo opcional nuevo en la tarjeta, cadena de fecha; `normalizeCard` lo conserva; sin migración ni cambio de esquema). Tarjeta en Reforzar con «Reescribir o dividir» (`leechHelp`): reescribir (editar la tarjeta la da por atendida), dividir (nueva tarjeta con la respuesta precargada) o dejarla (con «Deshacer»). Solo lee el historial: SM-2 no cambia. No propone nada con IA.
- **Tareas concretas:** `taskDetail()` / `taskGo()` (`04-planificador.js`): cifra real de tarjetas de la materia de la fecha, calculada al dibujar (no se guarda) y botón «Empezar» (repaso → examen con las vencidas de la materia; práctica/simulacro/revisión → `startSubjectQuiz`). La fase de comprensión ya traía su cifra. La recomendación de Hoy la cita.
- **Retención real:** `retentionReal()` (`08-analisis.js`): por cada tarjeta, el intervalo de un repaso = días desde el anterior de su historial; jóvenes < 21 días, maduras ≥ 21; no cuenta el primer repaso ni dos el mismo día. Objetivo fijo del 90 % como referencia (no es ajuste ni toca el repaso). Limitación: el historial guarda 40 repasos por tarjeta.
- **Idioma:** entradas en `EX`/`RULES` y las dos tarjetas de la guía en inglés. Los textos dentro de `#flashcard` son fijos a propósito (ahí solo se traducen rótulos exactos).
- **Pruebas:** `node --check` de todos los archivos tocados; prueba rápida en Node con stubs de la lógica (límite, cupo del día, tarjeta difícil, retención): correcta. `tests/fase8.spec.js` (10 pruebas Playwright, `?demo`) escritas pero NO ejecutadas (sin red para instalar Playwright). Ejecutar: `npx playwright test`. Suite total esperada: 42.
- **No probado:** navegador real (interfaz de Reforzar y Planificar, modal de tarjeta difícil, botón Empezar), inglés a ojo, móvil, lector de pantalla, actualización PWA v70 → v71.
- **Decisiones que tomé yo:** límite por defecto de 20 (cambia lo que ven quienes ya tienen muchas nuevas pendientes: no pierden nada, esperan); la retención usa 21 días como corte jóven/madura; el 90 % no es configurable; «tarjeta difícil» en la interfaz (no «sanguijuela»).
- **Pendiente de la Fase 8 según tu lista:** nada. Los cloze siguen en la 7b, solo si los estudiantes la piden.
- **Regla de proporción:** cada novedad ornamental (Lumi, temas, animaciones) exige antes una mejora del núcleo de estudio. Esta fase es del núcleo.


---
## Fase 9 (parcial) «Lumi más útil y opcional» (`learny-v72` → `learny-v73`)
Paquete PARCIAL, acumulativo sobre la Fase 8 (añadir al final de `CONTINUIDAD.md`): `js/01-base.js`, `js/16-lumi.js`, `js/18-idioma.js`, `sw.js`, `README.md`, `tests/fase9.spec.js` y esta nota. `CORE` de `sw.js` no cambia. Del plan de la Fase 9 solo se aplica esto; la carga perezosa de dibujos (toca `CORE`) queda fuera.
- **Aviso «Mañana te tocan N repasos.»** (`16-lumi.js`): en `maybeProactive()`, página Hoy. Si no corresponde WELCOME y hay ≥ `tomorrowMin` (10, en `LUMI_CONFIG`) tarjetas vivas con `nextReview` = mañana, sustituye al mensaje neutro (prioridad de contexto). La cifra sale del mismo criterio que la previsión de 7 días de Reforzar (activas, no dañadas). Sigue habiendo UN proactivo por visita; nada en enfoque, examen, ventana abierta ni pestaña oculta. Sin gesto propio. Texto generado por `lumiTomorrowText(n)`.
- **Idioma:** como lleva cifra no cabe en `EX`; va como regla en `RULES` de `18-idioma.js` («Tomorrow you have N reviews due.»).
- **Lumi desactivada por defecto:** `mascot: false` en `defaults()`. Quien ya tiene datos guardados conserva su ajuste (se guardó `true`); el borrador de la regla «activada por defecto» de la decisión 1 queda sustituido. La demo (`?demo`) también arranca sin Lumi.
- **Decisiones que tomé yo:** umbral de 10 repasos (con pocos, el aviso no aporta); el aviso reemplaza al neutro en vez de sumarse; «tarjetas difíciles» NO se añadió (solo pediste uno).
- **Pruebas:** `node --check` de todos los archivos tocados. `tests/fase9.spec.js` (5 pruebas Playwright, `?demo`) escritas pero NO ejecutadas (sin red para instalar Playwright). Suite total esperada: 47. Ejecutar: `npx playwright test`.
- **No probado:** navegador real, inglés a ojo, que a los estudiantes sin Lumi no les falte el botón de activarla (está en Ajustes → Disposición), actualización PWA v72 → v73.


---
## Fase 9 (parcial, 2.ª parte) «Lumi dice el dato curioso y tiene más mensajes» (`learny-v73` → `learny-v74`)
Paquete PARCIAL, acumulativo sobre la v73 (añadir al final de `CONTINUIDAD.md`): `js/05-temporizador.js`, `js/13-ajustes.js`, `js/16-lumi.js`, `js/18-idioma.js`, `style.css`, `sw.js`, `README.md`, `tests/fase9.spec.js` (sustituye al de la v73) y esta nota. `CORE` de `sw.js` no cambia.
- **Dato curioso diario por Lumi:** en la primera visita a Hoy de cada día (si no hay bienvenida), Lumi dice «Dato curioso: …» durante 9 s (`longMessageMs`). Es el mismo dato que calcula `renderFocus()` (`facts[día del mes % facts.length]`). El día en que se dijo se guarda en una clave aparte, `learny.lumi.fact` (no es parte de `state`, no viaja en copias, «Borrar todo» la elimina). «Mostrar el dato curioso» (Ajustes) también apaga el de Lumi. Con Lumi activa, `body.has-lumi #study .fact { display: none }` oculta el de «Más sobre hoy»; sin Lumi se sigue viendo. Los datos pasan de 9 a 15.
- **Más mensajes (Hoy):** `studyChatter()` en `16-lumi.js`. Orden: bienvenida > dato del día (una vez al día) > repasos de mañana (≥ 10) > uno al azar entre neutro, consejo (5), «Faltan N días para tu próximo examen.» (≤ 7 días), «Hoy llevas N de M bloques de tu meta.» (0 < N < M) y «Racha actual: N días.» (≥ 2), sin repetir el de la visita anterior. Los textos no incluyen contenido del usuario (así la traducción no lo toca).
- **Reacciones con variantes:** celebrar (3), apoyo (3), progreso (2); nunca la misma dos veces seguidas. El primer texto de cada lista es el original.
- **Reglas que no cambian:** UN mensaje proactivo por visita; nada en enfoque, examen, ventana abierta ni pestaña oculta; reacciones de 5 s; prioridades y cooldowns.
- **Idioma:** 6 datos, 5 consejos y 5 frases nuevas en `EX`; reglas en `RULES` para «Dato curioso:», «Faltan N días…» y «Hoy llevas N de M…».
- **Decisiones que tomé yo:** el dato va ANTES que los repasos de mañana (quien abre una vez al día no vería el de mañana hasta otra visita); sigue siendo un solo mensaje por visita; el dato de «Más sobre hoy» se oculta con Lumi activa (si te lo pierdes, no hay dónde releerlo: una línea de CSS lo revierte); consejos y frases redactados por mí.
- **Pruebas:** `node --check` de todos los archivos tocados. `tests/fase9.spec.js` (11 pruebas Playwright, `?demo`) escritas pero NO ejecutadas (sin red). Suite total esperada: 53. Una de ellas (rotación de variantes) solo comprueba que el controlador existe: las listas son privadas.
- **No probado:** navegador real, que 9 s basten para leer en móvil, inglés a ojo, actualización PWA v73 → v74.


---
## Lumi · Alisa Kujou (`learny-v76` → `learny-v77`)
Octava apariencia de Lumi (`settings.mascotAvatar = 'alisa'`, nombre visible «Alisa Kujou»), a partir de la imagen `Alisa.jfif` aportada. Mismo patrón que Daniel, Yor y Miku: un solo controlador, el arte solo representa.
- **Arte:** `js/16-lumi-alisa.js` (nuevo). Mapa de 62×96 celdas (≈10,3 px de la imagen por celda) con 18 colores (paleta k-means sobre los píxeles del personaje; color dominante por celda y el contorno oscuro prevalece si ocupa ≥ 50 %). Fondo y sombra proyectada eliminados (relleno desde el borde con el contorno oscuro como barrera). La fuente NO es pixel art de rejilla exacta (celdas de ≈4,3 px), por lo que es una **aproximación**: se simplificaron las hebras finas del pelo y los ojos.
- **Grupos (solo CSS):** `.alisa-ahoge`, `.alisa-ribbon`, `.alisa-head` con `.alisa-eyes`, `.alisa-arm-r`, `.alisa-body` y `.alisa-rim` (contorno de 1 celda, solo visible en Alto contraste). Piel bajo los ojos para que el parpadeo no deje ver el fondo.
- **Archivos tocados:** `js/16-lumi-alisa.js` (nuevo), `js/01-base.js` (`'alisa'` en `MASCOT_AVATARS`), `js/16-lumi.js` (entrada en `ART` y cabecera), `index.html` (`<script>` tras `16-lumi-cc.js`), `sw.js` (`./js/16-lumi-alisa.js` en `CORE` y `learny-v77`), `style.css` (bloques «avatar Alisa Kujou» y «poses de Alisa Kujou», antes de la regla de v74), `README.md`. `02-datos.js` y `13-ajustes.js` no cambian.
- **Caja:** 100 px (1 px por celda) en escritorio, 70 px en móvil y 50 px en enfoque; miniatura del selector 70 px.
- **Poses:** NEUTRAL sin movimiento continuo (al aparecer: parpadeo y vaivén del ahoge); CELEBRATE (salto + brazo arriba + lazo + parpadeo); WELCOME (saludo + brazo que saluda + ladeo); SUPPORT (inclinación + ladeo); PROGRESS (asentimiento); EMPTY (ahoge + ladeo); reposo con parpadeo, ladeo, lazo y ahoge; FOCUS estático.
- **Pruebas (Chromium + Playwright, app completa con `?demo`, 1100 y 390 px):** el selector ofrece 8 apariencias y «Alisa Kujou» tiene nombre accesible; 100 px en escritorio y 70 px en móvil sin desborde horizontal; cada gesto usa las animaciones previstas; reposo con 5 animaciones; FOCUS con 0; rim blanco en Alto contraste; sin errores de página ni de consola. Capturas revisadas a ojo.
- **Pendiente:** los seis temas a ojo, movimiento reducido del sistema, lector de pantalla, actualización PWA v76 → v77 sobre una instalación existente, móvil físico (a 70 px la celda mide 0,7 px) y comparar a ojo la fidelidad con la imagen original. Autorización: el responsable aporta la imagen; no se añaden logos ni se sugiere colaboración oficial.
- **Retirada:** borrar `js/16-lumi-alisa.js`, su `<script>`, su línea en `CORE` y `'alisa'` de `MASCOT_AVATARS` (sin el archivo el selector no la ofrece y un `alisa` guardado se muestra como abeja).

---
## Perfiles · Etapa 2 «Textos según el perfil» (`learny-v77` → `learny-v78`)
Solo representación: ninguna lógica, dato ni algoritmo cambia. Archivos: `js/01b-perfil-textos.js` (nuevo, tras `01-base.js` en `index.html` y en `CORE`), `index.html`, `js/04-planificador.js`, `js/06-hoy.js`, `js/08-analisis.js`, `js/11-apariencia.js`, `js/14-eventos.js` (`ptxt` en `window.Learny`, ahora 47 claves), `js/15-inicio.js`, `js/18-idioma.js`, `extras.js`, `sw.js` (`learny-v78`), `README.md`, `tests/perfil-textos.spec.js`.
- **Tabla única** `PROFILE_TEXT` (clave → perfil → `[español, inglés]`): `stuck` (Hoy me cuesta arrancar), `realExam`, `missOne`/`missMany` (fallo/s · tropiezo/s · error/es), `recoveryTitle/Sub/Lead/Miss/Btn/Plan/Toast/Name`. `exam` = textos de siempre; perfil vacío o desconocido = `exam`.
- **Uso:** JS → `ptxt('clave')`; HTML estático → `data-ptxt="clave"` (el texto escrito en el HTML es el de `exam`) y `applyProfileTexts()`, que se llama desde `applyAppearance` (después de `LearnyI18n.sync`), al elegir perfil en la bienvenida y al cambiar el idioma (la guía en inglés se reemplaza entera y se reescribe con el inglés de la tabla).
- **Idioma sin multiplicarse:** `18-idioma.js` vuelca la tabla a `EX` (salvo `PROFILE_NO_EX`: `missOne`, `missMany`, `recoveryName`, que son palabras sueltas o se guardan en los datos) y a `NOUN` (para «4 tropiezos» → «4 slip-ups»; no pisa entradas existentes como «errores»). Las dos frases con «más fallos» aceptan cualquier variante (`MISS_RE`). Se quitaron de `EX` las entradas movidas (Examen real, Informe de examen, Qué falló, Crear plan de recuperación, Hoy me cuesta arrancar…).
- **Datos guardados:** el título de la fecha del plan de recuperación (`Recuperación:` / `Retomar:` / `Refuerzo:`) y el prefijo de sus tareas (`Fallos (…)`/`Tropiezos`/`Errores`) se guardan con la variante activa al crearlo; no se reescriben si luego cambias de perfil. El prefijo `Recuperar:` de las tareas atrasadas NO cambia (lo usan migraciones y el reajuste).
- **Decisiones que tomé yo:** redacción de las variantes `self` («tropiezos», «Prueba cronometrada», «Cuando algo no salió bien», «plan para retomarlo») y `teach` («errores», «Informe de una prueba», «plan de refuerzo»); la guía de uso cambia solo en esas frases, el resto es común. «Modo examen», «Simulacro» (fase del plan) y «Examen» no se tocaron.
- **Pruebas:** `node --check` de todos los `.js`; comprobación en Node de la tabla (tres variantes por clave y `ptxt`). `tests/perfil-textos.spec.js` (10 pruebas Playwright, `?demo`) escritas pero NO ejecutadas (sin red para instalar Playwright). Suite total esperada: 63 (más las 4 de `fase8.spec.js`, que ya fallaban). Ejecutar: `npx playwright test`.
- **No probado:** navegador real, inglés a ojo en cada variante, lector de pantalla, actualización PWA v77 → v78.
- **Límite conocido:** «con fallos recientes» (tarea de revisión) no tiene traducción al inglés, como antes. Los textos de los modales de tarjetas difíciles y de las estadísticas (verbo «fallar») no cambian por perfil.
- **Siguiente:** Etapa 3 (accesibilidad en la entrada) o Etapa 4 (modo autodidacta, que sí se apoya en estas variantes).


---
## Perfiles · Etapa 3a «Accesibilidad en Personalizar» (`learny-v80` → `learny-v81`)
Nota: no hay notas en este archivo para v78 → v80 (el CSS cita cambios de Alisa Kujou en v79 y v80); la Etapa 2 terminó en `learny-v78`.
- **Qué hace:** en el segundo paso de la bienvenida, tras el tiempo de hoy, grupo «Accesibilidad» con tamaño de texto (16 / 19 / 22 px), «Lectura fácil» (`font: 'dyslexic'`) y «Reducir animaciones» (`reduceMotion`). Vista previa en vivo con `applyAppearance(copia)`: no toca `state.settings`. «Terminar» guarda `fontSize`, `font` y `reduceMotion` (pasan por `sanitizeSettings`). Omitir, × y Esc llaman a `end(false)` → `applyPreferences()`, que restaura la apariencia guardada. Atrás y volver conserva lo elegido. Si el sistema ya pide movimiento reducido, aparece un aviso. Sin cambio de esquema ni claves nuevas.
- **Archivos:** `js/15-inicio.js` (solo `welcomeFlow()`), `js/18-idioma.js`, `sw.js` (`CACHE = 'learny-v81'`; `CORE` no cambia), `tests/accesibilidad-bienvenida.spec.js` (11 pruebas). `style.css` no cambió en 3a (reutiliza `.welcome-times`, `.welcome-time`, `label.check`, `.hint`).
- **Idioma:** entradas nuevas en `EX`: «Accesibilidad», «Tamaño de texto», «Terminar», el aviso de movimiento reducido del sistema y «Se ve al instante; se guarda al pulsar «Terminar».». «Normal» se escribe igual en inglés y «Grande», «Muy grande» y «Reducir animaciones» ya existían.
- **Pruebas:** escritas pero NO ejecutadas en este entorno.
- **Límites conocidos:** el tamaño de texto es de tres pasos (el resto, 16–24 px, sigue en Ajustes y en A−/A+); si alguien llega al paso 2 con un tamaño distinto de 16/19/22 ninguna opción aparece marcada y se conserva ese valor; con texto muy grande el modal es más alto y en móvil se desplaza dentro de la ventana.
- **Pendiente:** foco a 320–1000 px en los seis temas, 3c (guion NVDA/VoiceOver), 3d (persona con lector de pantalla).

---
## Perfiles · Etapa 3b «Contraste de los controles de la bienvenida» (`learny-v81`)
Solo CSS, al final de `style.css`; va en la misma versión que 3a (`style.css` está en `CORE`, así que la subida de caché a v81 ya lo cubre).
- **Problema:** el borde normal (`--border`) da 1,25–1,47:1 en Oscuro, Negro, Claro y Sepia (WCAG 1.4.11 pide ≥ 3:1). Alto contraste y Cromo ya cumplían.
- **Solución:** variable `--ui-edge` por tema (`:root` `#6f759b`, `.theme-oled` `#64656f`, `.theme-light` `#81869e`, `.theme-sepia` `#9c9079`, `.theme-contrast` `#ffffff`, `.theme-chrome` `#7a7a7a`), con 3,11–3,9:1 frente a la superficie, a la superficie secundaria y al fondo del campo en los cuatro temas con problema. Se aplica solo a la bienvenida: `button.stuck-opt.profile-opt`, `label.welcome-time span`, `.modal-content input.w-edge` (campo de nombre) y `button.outline-button.w-edge` («Atrás»). La opción marcada conserva su borde de acento de 2 px. Los selectores llevan un elemento más de especificidad para ganar a las reglas `hover: none` de `motion.css`.
- **Dependencia:** la clase `w-edge` debe estar puesta en el campo de nombre y en «Atrás» desde `js/15-inicio.js`; comprobarlo al integrar.
- **Pruebas:** los contrastes se midieron con los valores de cada tema; no consta prueba en navegador.
- **Pendiente:** ver la bienvenida a ojo en los seis temas, 3c y 3d.
