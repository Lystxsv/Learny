# Revisión del inglés de Learny (v99)

Cómo se hizo: se abrió la app en Chromium con `?demo` y el idioma por defecto (inglés). Se leyó todo el texto visible de Hoy, Practicar, Biblioteca, Planificar, Reforzar y la Guía; las ventanas de Ajustes, nueva tarjeta, planes, exámenes, repaso, tutor, ruleta y mazos; los perfiles «por mi cuenta» y «enseño»; y la portada con la bienvenida. Además se comprobó qué frases en español del código el traductor deja sin traducir.
No se revisó: avisos de error poco comunes (importación fallida, datos dañados, cuota de IA), el inicio de sesión y la página Pro (requieren Firebase), ni el quiz hasta el final.

## Hallazgo principal
Cuando una frase no está en el diccionario (`EX` de `js/18-idioma.js`), el traductor no la deja entera en español: sustituye palabras sueltas. El resultado es peor que el español puro: «Today debes crear 6 cards de Biología…», «Practice nivel 4 · 13 reviews», «None tarjeta acumula 4 mistakes».
Las traducciones que **sí** están en el diccionario suenan naturales. El problema es de **cobertura**, no de calidad.

## A. Plan, Hoy y Planificar (frases que salen a medias)
| Español (origen) | Hoy se ve | Propuesta |
|---|---|---|
| Hoy debes crear N tarjetas de X y leer lo esencial (M min). | Today debes crear N cards de X y leer… | Today, create N X cards and read the essentials (M min). |
| Hoy toca la fase de Comprensión. | Today toca la fase de Understanding. | Today is the Understanding phase. |
| Hoy: 40 min de X + 8 tarjetas + repaso de 1 error. | Today: 40 min de X + 8 cards + review de 1 error. | Today: 40 min of X + 8 cards + review of 1 mistake. |
| Revisión final de X: conceptos débiles y un pase rápido. | Final review de X: conceptos… | Final review of X: weak concepts and a quick pass. |
| Repasa tarjetas de X y cierra huecos (N min). | (en español) | Review X cards and close gaps (N min). |
| Hoy no hay tarjetas de X por repasar. | Today no hay tarjetas… | No X cards to review today. |
| Hoy: práctica con N de X, tus errores primero. | Today: practice con N de X… | Today: practice with N of X, mistakes first. |
| Aún no hay tarjetas de X: crea algunas para poder practicar. | Not yet hay tarjetas… | There are no X cards yet: create some to practice. |
| Te sugerimos repasar… 3 son de «X», que es el 7 nov | …3 son de «X», which is on Nov 7 | …3 are from “X”, which is on Nov 7 |
| Dime el examen y Learny reparte Pomodoros, tarjetas, práctica intercalada, simulacro y repaso de errores hasta la fecha. | Dime el examen y Learny reparte… | Tell me the exam and Learny spreads Pomodoros, cards, interleaved practice, a mock exam and error review up to the date. |
| Placeholder «Parcial de cálculo» | sin traducir | Calculus midterm |
| Plan de emergencia: «N bloques de 25 min (≈1.7 h): lo esencial del temario y 10 tarjetas clave» | en español | N blocks of 25 min (≈1.7 h): the essentials of the syllabus and 10 key cards |
| …«problemas y práctica de lo de mayor peso» | en español | problems and practice on the topics that weigh the most |
| …«simulacro cronometrado y revisión final de errores» | en español | a timed mock exam and a final review of mistakes |
| El día del examen, solo un repaso ligero. Duerme bien la noche anterior: consolidas lo estudiado. | en español | On exam day, only a light review. Sleep well the night before: it consolidates what you studied. |
| Indica la materia y qué falló. | en español | Enter the subject and what went wrong. |
| Añade primero una fecha de examen. | en español | Add an exam date first. |
| Elige una fecha entre hoy y los próximos 2 años. | Elige una fecha entre today… | Pick a date between today and the next 2 years. |
| Ni con 240 min/día cabe: cambia la fecha o recorta el temario. | …240 min/day cabe… | It does not fit even at 240 min/day: change the date or trim the syllabus. |
| Plan recalculado, pero con N min/día aún no cabe todo lo pendiente (harían falta ≈ X). | mezcla | Plan recalculated, but at N min/day everything pending still does not fit (you would need ≈ X). |
| El detalle está en Planificar → Cambios en tu plan. | …en Plan → Changes to your plan. | Details are in Plan → Changes to your plan. |
| revisa «Próximas fechas» y replanifica | mezcla | check “Upcoming dates” and replan |

## B. Reforzar (la sección con más texto a medias)
| Español (origen) | Hoy se ve | Propuesta |
|---|---|---|
| Retención real frente al objetivo / Retención real: | en español | Real retention vs. target / Real retention: |
| Tarjetas jóvenes (volvían en menos de 21 días) | Cards jóvenes (… 21 days) | Young cards (came back in under 21 days) |
| Tarjetas maduras (volvían en 21 días o más) | Cards maduras (… in 21 days o más) | Mature cards (came back in 21 days or more) |
| Tarjetas que se te resisten | Cards que se te resisten | Cards you keep struggling with |
| Las que has fallado 4 veces o más. Repetirlas igual casi nunca funciona: mejor reescribirlas o dividirlas. | en español | The ones you have missed 4 or more times. Repeating them the same way rarely works: better to rewrite or split them. |
| Ninguna tarjeta acumula 4 fallos. Si alguna lo hace, aparecerá aquí con una propuesta para reescribirla o dividirla. | None tarjeta acumula 4 mistakes… | No card has 4 mistakes. If one does, it will show up here with a suggestion to rewrite or split it. |
| De las tarjetas que ya habías visto, cuántas recordaste al volver. Distinto de «Recuerdo declarado». | mezcla | Of the cards you had already seen, how many you recalled when they came back. Different from “Self-reported recall”. |
| Con menos de 10 intentos verás «muestra pequeña», y con menos de 5 por materia Learny no la califica. Se guardan hasta 5 000 repasos. | mezcla | With fewer than 10 attempts you will see “small sample”, and with fewer than 5 per subject Learny does not grade it. Up to 5,000 reviews are kept. |
| Si pasas semanas por debajo del objetivo, repasa con más frecuencia o reescribe las tarjetas que se te resisten. | en español | If you stay below the target for weeks, review more often or rewrite the cards you struggle with. |
| Sin exámenes en este periodo | en español | No exams in this period |
| Periodo: últimos 30 días. | …últimos 30 days. | Period: last 30 days. |
| X: 36% sin fallar (5 de 14 repasos) | «sin fallar» sin traducir | X: 36% without a miss (5 of 14 reviews) — o «pass rate» |
| Práctica nivel 4 · 13 repasos | Practice nivel 4 · 13 reviews | Practice level 4 · 13 reviews |
| Racha de 5 días | Racha de 5 days | 5-day streak |
| Reto: 18/30 repasos · 0/3 exámenes | Reto: 18/30 reviews · 0/3 exams | Challenge: 18/30 reviews · 0/3 exams |
| Objetivo 90% | sin traducir | Target 90% |
| Hoy toca: 1 tarea y 8 tarjetas. | Today toca: 1 task y 8 cards. | Today: 1 task and 8 cards. |
| Estás a 225 min de tu meta semanal. | en español | You are 225 min from your weekly goal. |
| Esta semana: 125 min de 350 min. Te faltan 225 min. | en español | This week: 125 min of 350 min. 225 min to go. |
| Esta semana: 125 min de foco, 18 repasos y 0 exámenes. Meta para la próxima: superar tus repasos de hoy. | mezcla | This week: 125 min of focus, 18 reviews and 0 exams. Goal for next week: beat this week's review count. (revisar el sentido de «de hoy» en el original) |
| Completa una sesión de 10 minutos para mantenerla. | …10 minutes para… | Complete a 10-minute session to keep it going. |
| Un mini quiz de 8 tarjetas empieza por tus errores. | …8 cards empieza… | An 8-card mini quiz starts with your mistakes. |
| Un resultado destacado aparece con 30 repasos de una materia y al menos 80 % sin fallar. | mezcla | A highlight appears with 30 reviews in a subject and at least 80% without a miss. |
| Repasa la tarjeta con errores recientes. | en español | Review the card with recent mistakes. |
| (36 % sin fallar: 5 de 14 repasos), practica con ejercicios y avanza cuando pases del 70 %. | mezcla | (36% without a miss: 5 of 14 reviews), practice with exercises and move on once you pass 70%. |
| de 30 días del periodo · día de gracia disponible | mezcla | of 30 days in the period · grace day available |
| de 5 bloques · tiempo en sesión, no aprendizaje | mezcla | of 5 blocks · time in session, not learning |
| días distintos con un bloque de enfoque completado o un repaso, entre los días del periodo. | en español | distinct days with a completed focus block or a review, out of the days in the period. |
| minutos de bloques de enfoque completados (los abandonados no cuentan). Mide dedicación, no aprendizaje. | en español | minutes of completed focus blocks (abandoned ones do not count). It measures effort, not learning. |
| repasos en que no marcaste «No lo sabía», entre todos los del periodo. | mezcla | reviews where you did not mark “Didn't know it”, out of all reviews in the period. |
| repasos que marcaste «Fácil» entre todos… Es tu autoevaluación; no demuestra por sí solo cuánto retuviste. | mezcla | reviews you marked “Easy” out of all reviews in the period. It is your self-assessment; on its own it does not show how much you retained. |
| respuestas «Fácil» entre las respondidas en modo examen. También son autoevaluadas. | mezcla | “Easy” answers out of those given in exam mode. They are also self-assessed. |
| de los repasos de tarjetas ya vistas, cuántos no marcaste «No lo sabía». El intervalo de cada repaso sale del historial de la tarjeta (días desde el repaso anterior). El 90 % es solo una referencia: no cambia cuándo vuelven las tarjetas. | mezcla | of the reviews of cards you had already seen, how many you did not mark “Didn't know it”. Each review's interval comes from the card's history (days since the previous review). The 90% is only a reference: it does not change when cards come back. |

## C. Ventanas, avisos y herramientas
| Español (origen) | Hoy se ve | Propuesta |
|---|---|---|
| Pega un texto más largo (mínimo un párrafo). | en español | Paste a longer text (at least one paragraph). |
| En la demostración no se descargan informes. | en español | Reports are not downloaded in the demo. (el patrón ya existe: «Files are not downloaded in the demo.») |
| En la demostración no se descargan copias / no se comparten mazos / no se importan archivos / no hay copias que restaurar | en español | Backups are not downloaded in the demo. / Decks are not shared in the demo. / Files are not imported in the demo. / There are no backups to restore in the demo. |
| Historial de «X» borrado. | en español | History for “X” cleared. |
| Tema añadido: X | en español | Topic added: X |
| Para generar con IA añade tu clave en Ajustes. Mientras tanto, prueba un mazo de ejemplo. | …en Settings. Mientras… | To generate with AI, add your key in Settings. In the meantime, try a sample deck. |
| Guía local. Añade tu clave en Ajustes para IA. | Local guide. Añade tu clave… | Local guide. Add your key in Settings to use AI. |
| Los 5 ejercicios del tutor: «1. Define X con tus palabras. 2. Resuelve un caso sencillo. 3. Cambia un dato y predice el resultado. 4. Busca un caso límite. 5. Inventa un problema nuevo y resuélvelo.» | en español | 1. Define X in your own words. 2. Solve a simple case. 3. Change one detail and predict the result. 4. Look for an edge case. 5. Invent a new problem and solve it. |
| Modo error: «Pega tu respuesta o procedimiento y te señalo dónde falla el razonamiento.» / «Revisar» / «Tu procedimiento» | en español | Paste your answer or working and I will point out where the reasoning fails. / Check / Your working |
| Pista: «Revisa línea por línea: ¿qué supuesto usas en cada paso y lo has comprobado?» | solo «Hint» traducido | Hint: Check line by line: what assumption are you making at each step, and have you checked it? |
| Ruleta: X · «Fase de preparación» · «Finish fase» | mezcla | Roulette: X · Phase: preparation · Finish phase |
| Modo examen · Historia | en español | Exam mode · Historia |
| title del botón de deshacer: «Atajo: Z» | en español | Shortcut: Z |
| Diálogo de mazo: «Escribe una tarjeta por línea con el formato» · «pregunta \| respuesta» · «¿Capital de Francia? \| París» | en español | Write one card per line in the format · question \| answer · Capital of France? \| Paris |
| Mensajes de «Aún no hay…», «Añade tus propios temas con el botón “Añadir”» | mezcla | Add your own topics with the “Add” button. |

## D. Errores poco frecuentes sin traducir (conviene traducirlos aunque se vean poco)
Importación y copias (`12-copias-e-importacion.js`): «Ese archivo no parece una copia de Learny», «El archivo no es un JSON válido», «El archivo es demasiado grande (máximo 5 MB)», «Archivo no válido. Usa pregunta, respuesta, materia…», «Hay unas comillas sin cerrar…», «El archivo no estaba en UTF-8…», «Esta importación reemplaza todos tus datos», «Copia automática restaurada», etc. (unas 30 frases).
Datos dañados o de versión nueva (`15-inicio.js`, `03-interfaz.js`): «Tus datos guardados estaban dañados…», «Estos datos son de una versión más nueva de Learny…», «Los datos guardados son de una versión más nueva…».
IA (`09-tutor-ia.js`): «La IA tardó demasiado», «Se agotó la cuota de la IA», «La demostración no usa IA», «No hay conexión o el servicio no respondió».
Bloque terminado en segundo plano (`05-temporizador.js`): «¿Estudiaste este bloque?», «Sí, registrarlo».
Metas (`22-metas.js`, `01c-metas-datos.js`): «Se eliminará «X» con sus etapas y evidencias…», «Llegaste al máximo (3)…».

## E. Estilo del inglés ya traducido (retoques, no errores graves)
- **«Reinforce»** como nombre de sección suena a verbo suelto. En la Guía queda «Reinforce. In Reinforce, see which subjects fail…». Alternativas: «Progress» o «Insights».
- **«without failing»** (de «sin fallar») es un calco. Mejor «without a miss» o «pass rate».
- **«a doubt»** («un ejemplo y una duda») → «an example and a question».
- **«Logo Learny»** (aria-label) → «Learny logo».
- **«Turn into card»** → «Turn into a card».
- **«View today's plan: Continue plan: Biología»** (aria-label con dos dos puntos) → «View today's plan: Biología».
- **«last contact yesterday»** (perfil «por mi cuenta») → «last practiced yesterday».
- Inconsistencia: «I'm struggling to start today» (perfil examen) frente a «I'm finding it hard to start today» (otros perfiles). Elegir una sola forma.
- **Guía** — «The top bar asks a tutor that questions before answering» → «The top bar opens a Socratic tutor that asks you questions before answering».
- **Guía** — «Enter or Space press» → «Enter or Space activates».
- **Guía** — «Plan. In Plan, add your exam…» y «Reinforce. In Reinforce…» repiten el verbo y el nombre de la sección; reformular como pasos: «1. Plan: add your exam with a date…».
- **Guía** — la sección «Special plans» incluye una frase sobre el tutor (5 exercises y Error mode) que no pertenece a ese bloque.

## F. Contenido que queda en español (decisión tuya)
Esto no es un fallo del traductor: es contenido que el código guarda en español.
- **Mazos de ejemplo** (Cálculo básico, Método científico, Programación): los nombres se traducen, pero sus tarjetas («¿Qué es una derivada?»…) siguen en español. Quien use la app en inglés recibe tarjetas en español.
- **Temas sugeridos de la ruleta** («teoría de juegos», «célula eucariota», «ética de Aristóteles»…).
- **Plantillas de tarjeta** («¿Qué es [concepto]?», «Solución: …») y las preguntas guía locales de `01-base.js`.
- **Tarjetas de la demo** (Biología, Historia, Inglés).
- **Prompts a Gemini** escritos en español («Actúa como tutor en español…»): la app añade una nota para que responda en inglés, pero conviene probar que funciona de verdad con una clave.
- **Placeholder del proxy** `https://tu-worker.workers.dev` → `https://your-worker.workers.dev`.
Intencionales y correctos: el botón «Español» y su `aria-label` «Cambiar a español» (están en el idioma de destino).

## Qué está bien
La portada, la bienvenida de dos pasos, Ajustes completo, el formulario de tarjeta, el repaso (botones «Didn't know it / Unsure / Easy», «It will be back in 1 day»), el modo examen, Biblioteca, el perfil «por mi cuenta» y las metas se leen con naturalidad.
