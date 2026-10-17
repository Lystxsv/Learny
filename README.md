# Learny

App web de estudio: Pomodoro con descanso, flashcards con repaso espaciado (SM-2), método Feynman,
ruleta de temas, planificador inverso, estadísticas y un tutor socrático opcional con IA.
Todo se guarda en el navegador de cada persona; no hay cuentas ni servidor.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html`, `style.css`, `script.js`, `extras.js` | La app completa (no necesita instalación ni compilación). |
| `sw.js`, `manifest.json` | Modo sin conexión e instalación como app (PWA). |
| `proxy-worker.example.js` | Ejemplo de proxy (Cloudflare Worker) para usar IA sin exponer tu clave. |

## Probarla en tu computador
Abre `index.html` con doble clic. (El modo sin conexión/PWA solo se activa servida por `https://` o `localhost`.)

## Publicarla gratis en GitHub Pages
1. Crea un repositorio público en GitHub y sube **los ocho archivos**.
2. Settings → Pages → "Deploy from a branch" → rama `main`, carpeta `/ (root)` → Save.
3. En 1 o 2 minutos estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. Al publicar una versión nueva, sube también `sw.js` (cambia `CACHE` si modificas archivos; ahora es `learny-v7`).

## IA (opcional)
Hay dos formas; sin ninguna, Learny funciona con su guía local.
- **Clave propia:** cada persona pega su clave gratuita de Gemini en Ajustes ⚙️ (https://aistudio.google.com/apikey).
  Queda solo en su navegador y nunca se incluye en copias ni mazos. No la uses en un equipo compartido.
- **Proxy (recomendado en producción):** despliega `proxy-worker.example.js`, define `GEMINI_API_KEY` y
  `ALLOWED_ORIGIN` como secretos/variables y pega la URL del Worker en Ajustes ⚙️ → "URL de tu proxy".
  Con proxy activo no hace falta ninguna clave en el navegador.

Si Google cambia el nombre del modelo, se puede cambiar en Ajustes sin tocar el código.

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
- Barra inferior de 5 destinos, ventanas como hojas inferiores, áreas táctiles ≥ 44 px, temporizador siempre accesible.
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

## Atajos
`Espacio` revela · `1` `2` `3` califican · `P` inicia/pausa el Pomodoro · `Esc` cierra ventanas.

## Rendimiento
Los resultados de cálculo se memorizan y solo se dibuja la sección visible; probado con 1 000 tarjetas,
3 000 repasos y 400 sesiones (≈ 25 ms por actualización). El historial de repasos se limita a 5 000 registros.
Los archivos no están minificados (≈ 130 KB en total, se cachean al primer uso); si quieres, puedes pasarlos por `terser`/`lightningcss`.
