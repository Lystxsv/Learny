# Revisión del inglés de Learny (v99) · Parte 2: lo que la primera revisión no cubrió

Complementa `revision-ingles.md`. Aquí se cierra lo que ese archivo declaraba como «no revisado»: avisos de error poco comunes (importación, datos dañados, IA), inicio de sesión y cuenta, página Pro y quiz. También se revisaron el temporizador (bloque terminado en segundo plano) y las metas.

## Cómo se hizo (y qué no se pudo hacer)
No se abrió la app en un navegador. Se cargó el traductor real (`js/18-idioma.js`, con su `EX`, `RULES` y `tr()`) en Node y se le pasaron los textos en español extraídos del código de: `12-copias-e-importacion.js`, `15-inicio.js`, `03-interfaz.js`, `09-tutor-ia.js`, `05-temporizador.js`, `20-pro.js`, `21-quiz.js`, `22-metas.js`, `01c-metas-datos.js`, `23-cuenta.js` y `js/firebase/`. Las plantillas con huecos se probaron con valores de ejemplo y el HTML se partió en nodos de texto, como lo hace el traductor sobre el DOM.
Limitación: es una lectura del código, no una captura de pantalla. Donde un texto se parte en varios nodos por un `<b>` o un `<span>`, el resultado real depende de cómo quede cada trozo; lo que sigue está razonado así. Con Firebase no se probó nada en vivo.

## Hallazgo principal
Es el mismo patrón de la primera revisión: es un problema de **cobertura**. Lo que está en el diccionario sale natural. Lo que no, sale en español o a medias.
- **Cuenta, inicio de sesión y página Pro: están bien cubiertos.** Todos los mensajes de Firebase (contraseña débil, demasiados intentos, cuenta deshabilitada…), el diálogo de cuenta, «Recuperar contraseña», la lista de funciones Pro y los avisos de exportación se traducen de forma natural. Solo hay dos huecos (ver A).
- **Quiz: casi completo.** Una sola frase queda en español.
- **Donde se concentra el problema:** importación y copias, datos dañados o de versión nueva, errores de IA, el aviso del bloque terminado en segundo plano y los avisos de metas.

## A. Cuenta, Pro y quiz (huecos reales)
| Español (origen) | Hoy se ve | Propuesta |
|---|---|---|
| Sesión iniciada como **correo** (`23-cuenta.js`, la parte «Sesión iniciada como » queda como nodo aparte) | en español | Signed in as |
| Botón «Ver resultado» (última pregunta del quiz, `21-quiz.js`) | Ver resultado | See result |
| Hoja imprimible: título «Learny · Hoja de preguntas · …», «Tarjetas», «Respuestas» y el recuento «N tarjetas» (`20-pro.js`) | **siempre en español**: la hoja se escribe en una ventana nueva con `lang="es"` que el traductor no ve | Question sheet / Cards / Answers / N cards; poner `lang` según el idioma elegido |

La hoja imprimible es el único caso de esta parte donde el problema no está en el diccionario: el traductor solo observa la página principal, así que la ventana de impresión nunca se traduce aunque se añadan entradas.

## B. Importación, exportación y copias (`12-copias-e-importacion.js`)
El caso más claro de frases a medias. Ojo con un detalle: la exportación **sí** tiene regla («Exported N cards to Anki.»), pero la importación no, y por eso se ve distinto.

| Español (origen) | Hoy se ve | Propuesta |
|---|---|---|
| Importadas N tarjetas desde CSV. | Importadas N cards desde CSV. | Imported N cards from CSV. |
| Mazo importado: N tarjetas nuevas. | Mazo importado: N new cards. | Deck imported: N new cards. |
| Se leyeron **N** registros del archivo. | en español | N records were read from the file. |
| N registros después del límite de 5 000 no se leerán | N records después del límite… | N records past the 5,000 limit will not be read |
| Botón «Importar N válidas» | Importar N valid | Import N valid |
| Importar mazo / Importar tarjetas (títulos) | en español | Import deck / Import cards |
| N mazos propios se omiten porque su nombre ya existe o está repetido en el archivo. | N decks propios se omiten because su nombre… | N of your own decks are skipped because the name already exists or is repeated in the file. |
| N tarjetas de mazos propios pasan del límite de M por mazo y no se leerán. | N cards de mazos propios pasan… | N cards in your own decks go over the limit of M per deck and will not be read. |
| Fecha N: sin nombre o con fecha no válida (se omitirá) | Date N: sin nombre o con fecha… | Date N: no name or invalid date (it will be skipped) |
| Examen N: fecha o resultado no válido (se omitirá) | Exam N: fecha o resultado… | Exam N: invalid date or result (it will be skipped) |
| Nota N / Feynman N / Mazo N / Tarjeta N: … (se omitirá) | en español | Note N / Feynman N / Deck N / Card N: … (it will be skipped) |
| Antes de modificar tus datos se guarda una copia automática (Ajustes → Restaurar copia automática). | …(Settings → Restore automatic backup) con la frase en español | A backup is saved automatically before your data is changed (Settings → Restore automatic backup). |
| Reemplazar tus datos / Reemplazar mis datos / Esta copia reemplazará tus datos actuales. | en español | Replace your data / Replace my data / This backup will replace your current data. |
| Restaurar · Restaurar copia automática · Restaurar reemplaza tus datos actuales. | «Restaurar» en español; el título sí sale | Restore · Restore automatic backup · Restoring replaces your current data. |
| No se pudo guardar una copia previa · Continuar sin copia | en español | Could not save a backup first · Continue without a backup |
| No hay espacio para la copia automática, así que no podrás recuperar tus datos actuales desde Learny. Si quieres conservarlos, cancela y descarga antes una copia en Ajustes. | …y descarga antes una copia en Settings (resto en español) | There is no room for the automatic backup, so you will not be able to recover your current data from Learny. If you want to keep it, cancel and download a backup in Settings first. |
| Ver duplicadas · Revisar errores | en español | See duplicates · Review errors |
| Sin materia | en español | No subject |

Mensajes de error y de estado (todos salen enteros en español):
| Español (origen) | Propuesta |
|---|---|
| Ese archivo no parece una copia de Learny. / Ese archivo no es una copia válida de Learny. | That file does not look like a Learny backup. / That file is not a valid Learny backup. |
| La copia es de una versión más nueva de Learny (vN). Actualiza la app e inténtalo de nuevo. | The backup is from a newer version of Learny (vN). Update the app and try again. |
| Estos campos tienen un formato inválido: … / Los ajustes de la copia no son válidos. | These fields have an invalid format: … / The settings in the backup are not valid. |
| No hay nada que importar. | There is nothing to import. |
| El archivo no es un JSON válido. | The file is not valid JSON. |
| El archivo es demasiado grande para ser una copia de Learny. / …(máximo 5 MB). | The file is too large to be a Learny backup. / …(5 MB maximum). |
| Hay unas comillas sin cerrar que empiezan en la línea N. Ciérralas o quítalas y vuelve a importar. | There is an unclosed quotation mark starting on line N. Close or remove it and import again. |
| El archivo no estaba en UTF-8: se leyó como Windows-1252 (el formato de Excel). Si ves letras raras, guárdalo como «CSV UTF-8». | The file was not in UTF-8: it was read as Windows-1252 (Excel’s format). If you see odd characters, save it as “CSV UTF-8”. |
| Archivo no válido. Usa pregunta, respuesta, materia (separados por coma, punto y coma, barra \| o tabulador). | Invalid file. Use question, answer, subject (separated by comma, semicolon, pipe \| or tab). |
| El mazo no contiene una lista de tarjetas. / No hay tarjetas para compartir. / Mazo exportado sin progreso personal. | The deck does not contain a list of cards. / There are no cards to share. / Deck exported without personal progress. |
| Esa copia ya no está disponible. / No hay copia automática para restaurar. / Copia automática restaurada. | That backup is no longer available. / There is no automatic backup to restore. / Automatic backup restored. |
| (Se usa «tiene texto utilizable», «falta la pregunta», «falta la respuesta», «ya está en tu colección», «está repetida en el archivo» como sufijos de cada fila de error) | : has no usable text · : the question is missing · : the answer is missing · : already in your collection · : repeated in the file |

Ya existentes y bien traducidos (no tocar): «En la demostración no se descargan archivos.» y el patrón de «Exportadas N tarjetas a Anki/CSV».
Falta traducir también las frases de demostración que ya listaba la primera revisión (sección C): «En la demostración no se descargan copias / no se comparten mazos / no se importan archivos / no hay copias que restaurar».

## C. Datos dañados o de versión nueva (`15-inicio.js`, `03-interfaz.js`)
Todos son avisos largos que salen **enteros en español**, salvo los que mencionan «Ajustes», que salen mezclados («…en Settings»).
| Español (origen) | Propuesta |
|---|---|
| Tus datos guardados estaban dañados. Guardé una copia del archivo original en el navegador (learny.corrupt) y empecé de cero. | Your saved data was damaged. I saved a copy of the original file in the browser (learny.corrupt) and started from scratch. |
| Tus datos guardados estaban dañados y NO pude guardar una copia (sin espacio o almacenamiento bloqueado). No los he tocado hasta que hagas un cambio: descarga el archivo original ahora. | Your saved data was damaged and I could NOT save a copy (no space or storage blocked). I have not touched it until you make a change: download the original file now. |
| Estos datos son de una versión más nueva de Learny (vA) que esta (vB). No los he modificado y esta versión no guardará cambios para no perder campos nuevos… | This data is from a newer version of Learny (vA) than this one (vB). I have not modified it and this version will not save changes, so new fields are not lost… |
| Los datos guardados son de una versión más nueva de Learny. Para no pisarlos, esta versión no guarda cambios: actualiza la app (recarga la página). | Your saved data is from a newer version of Learny. So it is not overwritten, this version does not save changes: update the app (reload the page). |
| Tus metas se crearon con una versión más nueva de Learny (metas vN): aquí solo se pueden ver y se conservan intactas. Actualiza la app. | **Ya tiene regla en inglés** (pero solo se activa si el texto coincide exacto; probarlo en la app). |
| Learny actualizó tus datos de la vA a la vB. Guardé una copia previa: Ajustes → Restaurar copia automática. | Learny upgraded your data from vA to vB. I saved a backup first: Settings → Restore automatic backup. |
| …, pero NO pudo guardar una copia previa (sin espacio). Descarga una copia ahora en Ajustes. | …, but could NOT save a backup first (no space). Download a backup now in Settings. |
| N registros ilegibles se omitieron al cargar tus tarjetas. | N unreadable records were skipped while loading your cards. |
| Archivo descargado. Se quitó tu clave de Gemini del contenido; el resto de tus datos sigue ahí. | File downloaded. Your Gemini key was removed from its contents; the rest of your data is still there. |
| Se restauran los datos de ejemplo. Tus datos reales no se tocan. | The sample data is restored. Your real data is not touched. |
| Poco espacio: se borraron copias automáticas antiguas para poder guardar. Descarga una copia en Ajustes. | Low on space: old automatic backups were deleted so your data could be saved. Download a backup in Settings. |
| No se pudo mostrar «X». El resto de Learny sigue funcionando. | Could not show “X”. The rest of Learny keeps working. |
Nota de tono: el texto original mezcla primera persona («Guardé», «No los he tocado») con la voz de la app. En inglés, «I saved… I have not touched…» puede sonar raro en una app; valdría decidir una sola voz («Learny saved…» / «Your data was not changed»).

## D. IA y tutor (`09-tutor-ia.js`)
| Español (origen) | Hoy se ve | Propuesta |
|---|---|---|
| La IA tardó demasiado. Inténtalo de nuevo. | en español | The AI took too long. Try again. |
| Se agotó la cuota de la IA. Espera un rato e inténtalo de nuevo. | en español | The AI quota has run out. Wait a while and try again. |
| La IA agotó su límite de respuesta antes de escribir. Prueba otro modelo en Ajustes o una pregunta más corta. | …otro modelo en Settings (resto en español) | The AI used up its response limit before writing anything. Try another model in Settings or a shorter question. |
| La IA no devolvió texto para esta consulta. | en español | The AI returned no text for this query. |
| No hay conexión o el servicio no respondió. Puedes usar las preguntas guía locales. | en español | There is no connection or the service did not respond. You can use the local guide questions. |
| La demostración no usa IA: tienes la guía local. | en español | The demo does not use AI: you have the local guide. |
| El texto está vacío o es demasiado corto. | en español | The text is empty or too short. |
| La consulta no es válida. (código) | en español | The query is not valid. (code) |
| El modelo «X» no existe. Cámbialo en Ajustes. | El modelo “X” no existe. Cámbialo en Settings. | The model “X” does not exist. Change it in Settings. |
| Falta la clave de Gemini. Añádela en Ajustes o usa Guía local. | …Añádela en Settings o usa Local guide. | The Gemini key is missing. Add it in Settings or use Local guide. |
| Guía local. Añade tu clave en Ajustes para IA. | Local guide. Añade tu clave en Settings para IA. | (ya listado en la primera revisión, sección C) |
| No se pudo completar · Tu pregunta se conserva. Puedes reintentar o usar las preguntas guía locales mientras tanto. | título sí, resto en español | Could not be completed · Your question is kept. You can try again or use the local guide questions in the meantime. |
| **Explicación más simple** (título del bloque) | Explanation más simple | Simpler explanation |
| **Ejercicio de práctica** (título del bloque) | Ejercicio de practice | Practice exercise |
| No encontré afirmaciones incorrectas | en español | I did not find any incorrect statements |
La clave de Gemini con caracteres no ASCII (`09-tutor-ia.js:141`) sí está traducida.

## E. Temporizador (`05-temporizador.js`): bloque terminado en segundo plano
La ventana de confirmación se ve **en español salvo las unidades**, algo peor que español puro.
| Español (origen) | Hoy se ve | Propuesta |
|---|---|---|
| ¿Estudiaste este bloque? | en español | Did you study this block? |
| Tu bloque de 25 minutos terminó hace unos 3 minutos, con Learny en segundo plano o el equipo en suspensión. ¿Lo registramos como sesión completada? | Tu bloque de 25 minutes terminó hace unos 3 minutes, con Learny… | Your 25-minute block ended about 3 minutes ago, while Learny was in the background or your device was asleep. Should we log it as a completed session? |
| Sí, registrarlo / No, descartarlo | en español | Yes, log it / No, discard it |
| Bloque descartado: no se contó como sesión. | en español | Block discarded: it was not counted as a session. |
| El bloque ya había terminado o cambiado mientras decidías; no se registró ningún abandono. | en español | The block had already ended or changed while you were deciding; no abandonment was logged. |
| Bloque de foco terminado. | en español | Focus block finished. |

## F. Metas (`22-metas.js`, `01c-metas-datos.js`)
| Español (origen) | Hoy se ve | Propuesta |
|---|---|---|
| Se eliminará «X» con sus etapas y evidencias. Antes se guarda una copia automática. | en español | “X” will be deleted along with its stages and evidence. An automatic backup is saved first. |
| Llegaste al máximo (3). Borra alguno para crear otro. | en español | You have reached the maximum (3). Delete one to create another. |
| Tus metas ocupan mucho espacio. Borra alguna o descarga una copia antes de crear más. | en español | Your goals take up a lot of space. Delete one or download a backup before creating more. |
| Tarjetas de «Biología»: 3 de 8 recordadas en su último repaso. | Cards de «Biología»: 3 de 8 recordadas en su último review. | Cards for “Biología”: 3 of 8 recalled on their last review. |
| 3 hechas de 5 etapas · 2 comprobadas con una actividad. | 3 done de 5 stages · 2 checked by an activity. | 3 done out of 5 stages · 2 checked with an activity. |
Revisadas y correctas: «Mis metas», la plantilla de 4 etapas, «Aún sin etapas», las frases sobre evidencias y «Cada etapa admite hasta N evidencias» (tiene regla).

## G. Retoques en lo que sí está traducido (no son errores graves)
- **«Importar N válidas»** (botón de importación): conviene que el botón diga «Import N valid cards» para que se entienda sin contexto.
- **«Quiz y examen simulado»** → «Quiz and mock exam» está bien; en el resto de la app se usa «Mock exam» para «simulacro»: mantenerlo.
- **«Plan gratis. Tus datos no cambian.»** → «Free plan. Your data does not change.» correcto.
- Los mensajes de cuenta (`firebase-auth.js`) son claros; solo falta que «Sesión iniciada como X» no quede cortado (sección A).

## H. Resumen de qué hacer
1. Añadir a `EX` / `RULES` las frases de las secciones B a F (son unas 70 entradas; importación y datos dañados son la mayoría). Para las que llevan número, copiar el patrón de la regla `Exportadas N tarjetas a …` (por ejemplo `Importadas N tarjetas desde CSV.`).
2. Frases de Ajustes mezcladas: añadir la **frase entera** al diccionario; mientras solo haya sustitución de palabras sueltas, «Ajustes» se cambia pero el resto queda en español.
3. Hoja imprimible (`20-pro.js`): decidir el idioma de la ventana de impresión (hoy fija en español); no se arregla con el diccionario.
4. Probar en la app abierta con `?demo` y en español/inglés las ventanas de la sección B, C y E, que son las que más cambian según cómo se partan los nodos de texto.
