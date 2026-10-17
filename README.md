# Learny

App web de estudio: Pomodoro con descanso, flashcards con repaso espaciado (SM-2), método Feynman,
ruleta de temas, planificador inverso, estadísticas y un tutor socrático opcional con IA.
Todo se guarda en el navegador de cada persona; no hay cuentas ni servidor.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html`, `style.css`, `script.js`, `extras.js` | La app completa (no necesita instalación ni compilación). |
| `sw.js`, `manifest.json`, `icon.svg`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png` | Modo sin conexión e instalación como app (PWA) con sus iconos. |
| `proxy-worker.example.js` | Ejemplo de proxy (Cloudflare Worker) para usar IA sin exponer tu clave. |

## Probarla en tu computador
Abre `index.html` con doble clic. (El modo sin conexión/PWA solo se activa servida por `https://` o `localhost`.)

## Publicarla gratis en GitHub Pages
1. Crea un repositorio público en GitHub y sube **todos los archivos** (incluidos los iconos y `icon.svg`).
2. Settings → Pages → "Deploy from a branch" → rama `main`, carpeta `/ (root)` → Save.
3. En 1 o 2 minutos estará en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. Al publicar una versión nueva, sube también `sw.js` (cambia `CACHE` si modificas archivos; ahora es `learny-v14`).

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

## Atajos
`Espacio` revela · `1` `2` `3` califican · `P` inicia/pausa el Pomodoro · `Esc` cierra ventanas.

## Rendimiento
Los resultados de cálculo se memorizan y solo se dibuja la sección visible; pensado para colecciones de miles de tarjetas (sin medición independiente). El historial de repasos se limita a 5 000 registros.
Los archivos no están minificados (≈ 180 KB entre HTML, CSS y JS, se cachean al primer uso); si quieres, puedes pasarlos por `terser`/`lightningcss`.

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
