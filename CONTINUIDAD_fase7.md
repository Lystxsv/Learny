
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
