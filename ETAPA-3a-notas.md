# Etapa 3a · Opciones de accesibilidad en «Personalizar» (learny-v80 → learny-v81)

## Archivos
- `js/15-inicio.js` — **reemplaza** al actual (solo cambia `welcomeFlow()`).
- `tests/accesibilidad-bienvenida.spec.js` — nuevo (11 pruebas).
- `18-idioma.js` — añadir 3 entradas al objeto `EX` (ver abajo).
- `sw.js` — `const CACHE = 'learny-v81';` (no hay archivos nuevos en la app: `CORE` no cambia).
- `README.md` / `CONTINUIDAD.md` — texto sugerido abajo.
- `style.css` — **sin cambios**: se reutilizan `.welcome-times`, `.welcome-time`, `label.check` y `.hint`.

## 18-idioma.js: añadir a `EX` (por ejemplo tras la línea de «Uso principal»)
```js
'Accesibilidad': 'Accessibility', 'Tamaño de texto': 'Text size',
'Tu sistema ya pide reducir el movimiento: Learny lo respeta aunque no marques esto.': 'Your system already asks to reduce motion: Learny respects it even if you do not tick this.',
'Se ve al instante; se guarda al pulsar «Terminar».': 'You see it instantly; it is saved when you press “Finish”.',
```
(«Normal», «Grande», «Muy grande», «Lectura fácil (OpenDyslexic…)» y «Reducir animaciones» ya existen en `EX`. Si «Terminar» no está traducido, añade `'Terminar': 'Finish'`.)

## Qué hace
- En el segundo paso de la bienvenida, tras el tiempo de hoy: grupo «Accesibilidad» con tamaño de texto (16 / 19 / 22 px), «Lectura fácil» (`font: 'dyslexic'`) y «Reducir animaciones» (`reduceMotion`).
- Vista previa en vivo con `applyAppearance(copia)`: no toca `state.settings`.
- «Terminar» guarda `fontSize`, `font` y `reduceMotion` (pasan por `sanitizeSettings`). Omitir, × y Esc llaman a `end(false)` → `applyPreferences()`, que restaura la apariencia guardada.
- Atrás y volver conserva lo elegido. Si el sistema ya pide movimiento reducido, aparece un aviso (la app ya lo respeta vía CSS).
- Sin cambio de esquema, sin claves nuevas.

## Texto para CONTINUIDAD.md
**Perfiles · Etapa 3a** (`learny-v80` → `learny-v81`): opciones de accesibilidad en el paso «Personalizar» de la bienvenida (tamaño de texto, lectura fácil, reducir animaciones) con vista previa en vivo y reversión al cancelar. Archivos: `js/15-inicio.js`, `js/18-idioma.js`, `sw.js`, `tests/accesibilidad-bienvenida.spec.js`. Pruebas escritas pero NO ejecutadas en este entorno. Pendiente: 3b (contraste/foco a 320–1000 px en los seis temas), 3c (guion NVDA/VoiceOver), 3d (persona con lector de pantalla).

## Límites conocidos
- El tamaño de texto es solo de tres pasos; el resto (16–24 px) sigue en Ajustes y en A−/A+.
- Si alguien llega al paso 2 con un tamaño distinto de 16/19/22 (no ocurre en estado limpio), ninguna opción aparece marcada y se conserva ese valor.
- Con texto muy grande el modal es más alto: en móvil se desplaza dentro de la ventana (3b lo comprobará).
