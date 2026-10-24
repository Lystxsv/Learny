# CONTINUIDAD · Fase 4 (v65 → v66) · Pulido: escalonado de listas y velo al calificar

## Qué cambia
- **js/17-movimiento.js**: los elementos nuevos de una lista (hasta `MAX_IN` = 6) entran con retardo `i × --stagger` (30 ms) usando `delay` + `fill: 'backwards'`. Con movimiento reducido `--stagger` vale 0. Además, tras `learny:rated` se quitan las clases `fb-good` / `fb-soft` de la tarjeta pasado `--dur-veil` + 120 ms (para que el velo no se reinicie al volver a mostrar la página).
- **motion.css**: tokens `--stagger: 30ms` y `--dur-veil: 320ms` (en movimiento reducido: 0 ms y 100 ms). Velo `.flashcard::after` que solo anima opacidad (`@keyframes fc-veil`): «Fácil» (`fb-good`) usa el acento con pico .2; «No lo sabía» / «Dudé» (`fb-soft`) usa el color del texto con pico .08.
- **sw.js**: `CACHE = 'learny-v66'`. CORE y OPTIONAL sin cambios.

Solo representación: no cambia SM-2, datos, copias ni eventos.

## Cambios exactos en README.md
1. En «Versión actual del service worker»: `learny-v65` → `learny-v66`.
2. En el paso 4 de publicación: `learny-v65` → `learny-v66`.
3. En Novedades, añadir arriba:
   ```
   ### v66 · Pulido
   - Las listas escalonan ~30 ms la entrada de los elementos nuevos (máx. 6; sin escalonado con movimiento reducido).
   - Al calificar una tarjeta aparece un velo breve de opacidad (acento para «Fácil», neutro más leve para el resto). Solo representación.
   ```

## Cómo aplicarlo
Copiar `learny-fase4/` sobre la fase 3 (acumulativo): `js/17-movimiento.js`, `motion.css`, `sw.js`, y aplicar los cambios del README.

## Pruebas pendientes (no probado en navegador)
- Añadir varias tarjetas/tareas a la vez: entrada escalonada, sin parpadeo antes del retardo.
- Calificar «Fácil» y «No lo sabía» en los seis temas: velo visible y de distinta intensidad; la clase desaparece sola.
- Movimiento reducido (sistema y ajuste de Learny): sin escalonado, velo de 100 ms.
- Volver a Practicar tras calificar: el velo no se repite.
- Móvil y modo examen (`examRate`).
