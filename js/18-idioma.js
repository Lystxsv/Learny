/* Learny · parte 18 · Idioma (inglés predeterminado, español opcional)
   El código de la app está escrito en español; este módulo traduce lo que se VE (texto, placeholder, aria-label, title) cuando settings.lang === 'en'
   (valor por defecto) y lo devuelve tal cual cuando es 'es'. No toca datos del usuario: las tarjetas, notas y respuestas de la IA solo traducen botones/rótulos exactos.
   Mecanismo: diccionario (frases) + reglas con números + MutationObserver sobre <body>. Lo que no esté en el diccionario se queda en español: añade entradas en EX/RULES.
   También: guía de uso en inglés, guía local del tutor en inglés y la IA responde en el idioma elegido.
   Se carga con <script defer> después de 17-movimiento.js (comparte el ámbito global; no hay import/export). */
'use strict';

(() => {
  const EX = Object.assign(Object.create(null), {
    /* ---- Estructura, menú y barra superior ---- */
    'Saltar al contenido': 'Skip to content', 'Learny necesita JavaScript activado para funcionar.': 'Learny needs JavaScript enabled to work.',
    'Estudia con intención': 'Study with intention', 'Estudiar': 'Study', 'Organizar': 'Organize', 'Ayuda': 'Help',
    'Hoy': 'Today', 'Practicar': 'Practice', 'Biblioteca': 'Library', 'Planificar': 'Plan', 'Reforzar': 'Reinforce', 'Guía de uso': 'User guide',
    'Secciones': 'Sections', 'Secciones en móvil': 'Sections on mobile', 'Modo demostración': 'Demo mode',
    'Demostración': 'Demo', 'Datos de ejemplo; nada de esto se guarda ni toca tus datos reales.': 'Sample data; none of this is saved or touches your real data.',
    'Reiniciar demo': 'Reset demo', 'Salir de la demo': 'Exit demo', 'Demo: no se guarda': 'Demo: not saved',
    'Tus datos se guardan solo en este navegador. Internet solo se usa si activas la IA (clave de Gemini o proxy) o el dictado por voz, que usa el servicio de tu navegador (en Chrome, Google). No guardes tu clave en un equipo compartido.': 'Your data is stored only in this browser. The internet is only used if you turn on AI (Gemini key or proxy) or voice dictation, which uses your browser\'s service (in Chrome, Google). Do not save your key on a shared computer.',
    'Buscador o tutor': 'Search engine or tutor', 'Guía local': 'Local guide', 'Pregunta para tu tutor': 'Question for your tutor',
    'Pregunta a tu tutor socrático…': 'Ask your Socratic tutor…', 'Pregunta y recibe una explicación directa…': 'Ask and get a direct explanation…', 'Consultar': 'Ask',
    'Reducir tamaño de texto': 'Decrease text size', 'Aumentar tamaño de texto': 'Increase text size', 'Ajustes': 'Settings',
    'Sin conexión: tarjetas, Pomodoro y plan siguen funcionando. El tutor con IA no estará disponible hasta que vuelvas a conectarte.': 'Offline: cards, Pomodoro and plan keep working. The AI tutor will not be available until you reconnect.',
    /* ---- Contexto del tutor ---- */
    'Contexto del tutor socrático': 'Socratic tutor context', 'Materia': 'Subject', 'Nivel': 'Level', 'p. ej. Química': 'e.g. Chemistry', 'p. ej. 2.º bachillerato': 'e.g. 12th grade',
    'Qué ya sabes': 'What you already know', 'Lo que ya dominas': 'What you already master', 'Qué quieres lograr': 'What you want to achieve', 'Resultado concreto de esta sesión': 'A concrete outcome for this session',
    'Nivel de explicación': 'Explanation level', 'Como si tuviera 12 años': 'As if I were 12', 'Nivel universitario': 'University level', 'Con un ejemplo de mi carrera': 'With an example from my field',
    'Carrera / contexto': 'Field / context', 'p. ej. medicina, programación': 'e.g. medicine, programming', 'Cómo quieres que te ayude': 'How you want me to help',
    'Guíame con preguntas': 'Guide me with questions', 'Dame una explicación directa': 'Give me a direct explanation', 'Guardar contexto': 'Save context',
    'Dictar': 'Dictate', 'Modo error': 'Error mode', 'Escuchando… (pulsa para parar)': 'Listening… (press to stop)', 'Tu navegador no admite dictado. Prueba con Chrome o Edge.': 'Your browser does not support dictation. Try Chrome or Edge.', 'No se pudo dictar. Revisa el permiso del micrófono.': 'Dictation failed. Check the microphone permission.', 'Borrar historial del tema': 'Clear topic history', 'Borrar historial': 'Clear history',
    /* ---- Hoy / Pomodoro ---- */
    'Tu día de estudio': 'Your study day', 'Qué hacer ahora': 'What to do now', 'Foco': 'Focus', 'Descanso': 'Break',
    '¿Qué resultado concreto quieres lograr?': 'What concrete outcome do you want to achieve?', 'Resultado concreto de este bloque': 'Concrete outcome for this block',
    'Ej.: terminar los ejercicios 1 al 5': 'E.g.: finish exercises 1 to 5', 'Anotar una distracción': 'Note a distraction', 'Anotar': 'Note',
    'Algo que te sacó del foco (lo miras después)': 'Something that pulled you out of focus (check it later)', 'Últimas distracciones anotadas': 'Latest distractions noted',
    'Anótala aquí en vez de seguirla; la revisas al terminar.': 'Note it here instead of following it; you review it when you finish.',
    'La revisas al terminar el bloque.': 'You review it when the block ends.', 'distracción anotada': 'distraction noted', 'Distracción anotada.': 'Distraction noted.',
    'Saltar descanso': 'Skip break', 'Reiniciar': 'Reset', 'Opciones del bloque': 'Block options', 'Etiqueta del bloque': 'Block label', 'Materia, curso o tarjeta': 'Subject, course or card',
    'Meta diaria (bloques)': 'Daily goal (blocks)', 'Las notificaciones están bloqueadas: Learny avisará aquí y con sonido/vibración.': 'Notifications are blocked: Learny will alert you here and with sound/vibration.',
    'Ambiente de estudio': 'Study ambience', 'Ambiente': 'Ambience', 'cambia tu apariencia (puedes deshacerlo); sin sonido.': 'changes your appearance (you can undo it); no sound.',
    'Noche': 'Night', 'Minimalista': 'Minimalist', 'Ajustar tiempos': 'Adjust times', 'Intención:': 'Intention:',
    'Descanso: toma agua, respira lento, estira y mira a lo lejos.': 'Break: drink some water, breathe slowly, stretch and look into the distance.',
    'Más sobre hoy': 'More about today', 'misiones, progreso y un dato curioso': 'missions, progress and a fun fact', 'Misiones de hoy': "Today's missions",
    'Foco hoy': 'Focus today', 'Racha actual': 'Current streak', 'Concentración media': 'Average concentration', 'Concentración': 'Concentration',
    'Aún no has completado bloques hoy. Empieza con una intención breve.': "You haven't completed any blocks today. Start with a short intention.",
    'Repasa 10 tarjetas': 'Review 10 cards', 'Completa un Pomodoro': 'Complete a Pomodoro', 'Explica un tema con Feynman': 'Explain a topic with Feynman',
    'en pausa': 'paused', 'Volver al temporizador': 'Back to the timer', 'Reiniciar a mitad de bloque': 'Reset mid-block',
    'El bloque se descartará. ¿Qué pasó?': 'The block will be discarded. What happened?', 'Distracción': 'Distraction', 'Cansancio': 'Tiredness', 'Interrupción': 'Interruption', 'Guardar y reiniciar': 'Save and reset',
    '¡Bloque completado!': 'Block completed!', 'Para mirar después:': 'To look at later:', '¿Lograste el resultado concreto?': 'Did you achieve the concrete outcome?', 'Aún no': 'Not yet',
    'Ya puedes iniciar tu descanso de': 'You can now start your break of', 'Personaliza el temporizador': 'Customize the timer', 'Foco (min)': 'Focus (min)', 'Descanso (min)': 'Break (min)',
    'Escribe un resultado concreto antes de empezar.': 'Write a concrete outcome before starting.', 'Escribe un resultado concreto en «Hoy» antes de empezar un bloque.': 'Write a concrete outcome in “Today” before starting a block.',
    'Descanso terminado. ¡Listo para otro bloque!': 'Break over. Ready for another block!', 'Un bloque de enfoque terminó mientras no estabas; no se contó como sesión.': 'A focus block ended while you were away; it did not count as a session.',
    'Bloque completado. Cuando cierres esta ventana podrás valorarlo.': 'Block completed. When you close this window you can rate it.', 'Bloque completado. Guarda cómo te fue.': 'Block completed. Save how it went.',
    'Bloque de enfoque iniciado.': 'Focus block started.', 'Descanso iniciado.': 'Break started.', 'Temporizador en pausa.': 'Timer paused.', 'Ya anotaste 20 en este bloque. Sigue con tu foco.': 'You have already noted 20 in this block. Keep your focus.',
    /* ---- Cola de Hoy (06-hoy) ---- */
    'Buenos días': 'Good morning', 'Buenas tardes': 'Good afternoon', 'Buenas noches': 'Good evening',
    'Hoy no tienes pendientes urgentes.': 'You have nothing urgent today.', 'Bienvenido a Learny. Te propongo un primer paso para empezar.': "Welcome to Learny. Here's a first step to get started.",
    'Aún no has completado ningún bloque. Tu primer Pomodoro desbloquea tu progreso.': "You haven't completed any block yet. Your first Pomodoro unlocks your progress.",
    'Recomendado para ahora': 'Recommended for now', 'Tu primer paso': 'Your first step', 'Por qué:': 'Why:', 'Tiempo estimado': 'Estimated time', 'Repasar': 'Review', 'Repasar ahora': 'Review now',
    'Repasar errores': 'Review errors', 'Repaso rápido de 5 tarjetas': 'Quick review of 5 cards', 'Repasar 5 tarjetas': 'Review 5 cards',
    'Te sugerimos repasar esta tarjeta porque': 'We suggest reviewing this card because', 'Te sugerimos repasar estas': 'We suggest reviewing these', 'porque': 'because',
    'está vencida y': 'is overdue and', 'están vencidas y': 'are overdue and', 'está vencida': 'is overdue', 'están vencidas': 'are overdue', 'toca hoy': 'is due today', 'tocan hoy': 'are due today',
    'le toca repaso hoy según tu calendario': 'is due for review today according to your schedule', 'les toca repaso hoy según tu calendario': 'are due for review today according to your schedule',
    'y pertenece a': 'and belongs to', 'y pertenecen a': 'and belong to', ', que es': ', which is', 'mañana': 'tomorrow', 'para hoy': 'for today', 'hoy': 'today', 'ayer': 'yesterday',
    'el lunes': 'on Monday', 'el martes': 'on Tuesday', 'el miércoles': 'on Wednesday', 'el jueves': 'on Thursday', 'el viernes': 'on Friday', 'el sábado': 'on Saturday', 'el domingo': 'on Sunday',
    'Este repaso toma 5 de ellas; el resto sigue pendiente.': 'This review takes 5 of them; the rest stay pending.',
    'A este ritmo ya no cabe todo lo que queda: revisa o replanifica.': 'At this pace not everything left will fit: review or replan.',
    'Ver plan de hoy': "View today's plan", 'Continuar plan de': 'Continue plan:', 'Mini quiz de': 'Mini quiz:', 'Empezar quiz': 'Start quiz', 'Mini quiz': 'Mini quiz',
    'Crea tu primera tarjeta': 'Create your first card', 'Crear tarjeta': 'Create card', 'Aún no tienes tarjetas. Con ellas Learny agenda tus repasos por ti; la primera tarda un minuto.': "You don't have any cards yet. With them Learny schedules your reviews for you; the first one takes a minute.",
    'Probar con un mazo de ejemplo': 'Try a sample deck', 'Ver mazos': 'See decks', 'Añade unas pocas tarjetas ya hechas para ver cómo funciona el repaso sin escribir nada.': 'Add a few ready-made cards to see how review works without writing anything.',
    'Haz un bloque de enfoque': 'Do a focus block', 'Ir al Pomodoro': 'Go to the Pomodoro', 'No tienes repasos pendientes.': 'You have no pending reviews.',
    'Añade la fecha de un examen': 'Add an exam date', 'No tienes ninguna fecha próxima. Con una fecha, Learny reparte tareas diarias hasta el examen.': 'You have no upcoming date. With a date, Learny splits daily tasks up to the exam.',
    'Explícalo con tus palabras (Feynman)': 'Explain it in your own words (Feynman)', 'Explicar un tema': 'Explain a topic', 'Explicar un tema de hoy revela lo que todavía no entiendes.': "Explaining a topic from today reveals what you still don't understand.",
    'Solo 5 minutos': 'Just 5 minutes', 'Una sesión': 'One session', 'Elegir tema': 'Pick a topic', '¿Cuánto tiempo tienes?': 'How much time do you have?', 'Elige un tema': 'Pick a topic',
    '¿Qué materia quieres trabajar?': 'Which subject do you want to work on?', 'Empieza un mini quiz de 8 tarjetas de la materia, con tus errores primero.': 'Starts an 8-card mini quiz of the subject, with your mistakes first.',
    'O elige otra opción': 'Or pick another option', 'O prueba otra cosa': 'Or try something else', 'Próxima fecha:': 'Next date:', 'Hoy me cuesta arrancar': "I'm struggling to start today",
    '≈ Los tiempos son estimaciones.': '≈ Times are estimates.', 'Más opciones': 'More options', 'Empezar sesión inteligente': 'Start smart session', 'Explicar un tema (Feynman)': 'Explain a topic (Feynman)',
    'Probar un Pomodoro sin tarjetas': 'Try a Pomodoro without cards', 'Elige un mazo de ejemplo y púlsalo para añadir sus tarjetas.': 'Pick a sample deck and click it to add its cards.',
    'Solo 5 minutos': 'Just 5 minutes', 'Ahora mismo no hay nada que encaje con': 'Right now nothing fits', 'Te muestro lo recomendado:': "Here's what's recommended:",
    'Es normal. No hace falta hacer mucho: elige una cosa pequeña, o ninguna.': "That's normal. You don't need to do much: pick one small thing, or none.",
    'Cerrar esta ventana no cambia nada: tu plan y tus datos siguen igual.': 'Closing this window changes nothing: your plan and data stay the same.', 'Ahora no': 'Not now',
    'Hacer una pregunta': 'Ask a question', 'Escribe una duda, por pequeña que sea. Funciona también sin internet (guía local).': 'Write a doubt, however small. It also works offline (local guide).',
    'Una sesión breve de 5 minutos': 'A short 5-minute session', 'Un repaso corto; puedes salir del examen cuando quieras.': 'A short review; you can leave the exam whenever you want.',
    'Explicar una idea con tus palabras': 'Explain an idea in your own words', 'Método Feynman: solo una idea, sin nota.': 'Feynman method: just one idea, no grade.',
    'Crear una tarjeta pequeña': 'Create a small card', 'Una pregunta y una respuesta; tarda un minuto.': 'One question and one answer; it takes a minute.', 'Probar un mazo de ejemplo': 'Try a sample deck',
    'Tarjetas ya hechas para ver cómo funciona el repaso.': 'Ready-made cards to see how review works.',
    'Cierre del bloque': 'Block summary', 'Cierre del examen': 'Exam summary', 'Terminar por hoy': 'Finish for today', 'Seguir un poco más': 'Keep going a bit', 'Siguiente paso:': 'Next step:',
    'El tiempo mide dedicación, no aprendizaje. Aquí solo ves lo de esta sesión.': 'Time measures dedication, not learning. Here you only see this session.',
    'Tiempo:': 'Time:', 'Tu intención:': 'Your intention:', 'dijiste que la lograste': 'you said you achieved it', 'dijiste que aún no': 'you said not yet', 'sin valorar': 'not rated',
    'Tarjetas respondidas:': 'Cards answered:', 'Listo por hoy. Lo que estudiaste ya está guardado.': 'Done for today. What you studied is already saved.',
    'No tienes nada urgente pendiente. Descansar también es parte de estudiar.': 'You have nothing urgent pending. Resting is also part of studying.',
    /* ---- Tarjetas / Practicar ---- */
    'Recuerda de memoria, explica con tus palabras': 'Recall from memory, explain in your own words', 'Repasa tarjetas, usa el método Feynman y captura material de clase.': 'Review cards, use the Feynman method and capture class material.',
    'Repasar hoy': 'Review today', '+ Crear': '+ Create', 'Salir del examen': 'Exit exam', 'Tu respuesta (recuperación activa)': 'Your answer (active recall)',
    'Escríbela antes de ver la tarjeta. Compararemos al revelar.': 'Write it before seeing the card. We will compare when you reveal it.', 'Tu respuesta': 'Your answer', 'Ver respuesta': 'Show answer',
    'Califica cómo te fue': 'Rate how it went', 'No lo sabía': "Didn't know it", 'Dudé': 'Unsure', 'Fácil': 'Easy', 'Posponer 1 día': 'Snooze 1 day', 'Editar': 'Edit', 'Enviar a Biblioteca': 'Send to Library', 'Eliminar': 'Delete',
    'Más formas de repasar': 'More ways to review', 'Modo examen': 'Exam mode', 'Intercalar': 'Interleave', 'Examen real': 'Real exam', 'Crear con IA': 'Create with AI',
    'Modo examen:': 'Exam mode:', 'Intercalar:': 'Interleave:', '5 minutos:': '5 minutes:', 'Examen real:': 'Real exam:',
    'las tarjetas de hoy.': "today's cards.", 'las mezcla por materias.': 'mixes them by subject.', 'una sesión corta.': 'a short session.', 'tarjetas de hoy, falladas y al azar, con cronómetro.': "today's, failed and random cards, with a stopwatch.",
    'Atajos: Espacio revela; 1/2/3 califican; Z deshace la última acción; P inicia o pausa el Pomodoro. SM-2: No lo sabía = 1, Dudé = 3, Fácil = 5.': "Shortcuts: Space reveals; 1/2/3 rate; Z undoes the last action; P starts or pauses the Pomodoro. SM-2: Didn't know it = 1, Unsure = 3, Easy = 5.",
    'Método Feynman': 'Feynman method', 'Tema que estás explicando': 'Topic you are explaining', 'Ej.: la fotosíntesis': 'E.g.: photosynthesis', 'Tu explicación': 'Your explanation',
    'Explícalo como a alguien de 12 años; incluye un ejemplo y una duda.': 'Explain it to a 12-year-old; include an example and a doubt.', 'Explica para aprender': 'Explain to learn', 'Dictar explicación': 'Dictate explanation',
    'Escribe o dicta una explicación: Learny detecta vacíos, pregunta y propone tarjetas. Sin clave también funciona.': 'Write or dictate an explanation: Learny detects gaps, asks questions and suggests cards. It also works without a key.',
    'Más herramientas de práctica': 'More practice tools', 'ruleta de temas, notas rápidas, lectura y resumen': 'topic roulette, quick notes, reading and summary', 'Ruleta temática': 'Topic roulette',
    'Elige un tema al azar, estúdialo y luego explícalo: recuperación activa en dos fases.': 'Pick a random topic, study it and then explain it: active recall in two phases.', 'Girar tema': 'Spin topic',
    'Añadir o buscar un tema': 'Add or search for a topic', 'Cualquier tema o concepto': 'Any topic or concept', 'Añadir': 'Add', 'Sugerir con IA': 'Suggest with AI',
    'No hay coincidencias. Añade el tema que quieras estudiar hoy.': 'No matches. Add the topic you want to study today.',
    'Notas rápidas': 'Quick notes', 'Clase → tarjetas': 'Class → cards', 'Tu nota': 'Your note', 'Una idea, definición o fórmula; luego conviértela en tarjeta.': 'An idea, definition or formula; then turn it into a card.',
    'Guardar nota': 'Save note', 'Convertir en tarjeta': 'Turn into card', 'Pegar del portapapeles': 'Paste from clipboard', 'Hacer tarjeta': 'Make card', 'Quitar': 'Remove',
    'Aún no hay notas. Anota una idea durante la clase y conviértela en tarjeta.': 'No notes yet. Jot down an idea during class and turn it into a card.',
    'Lectura y resumen': 'Reading and summary', 'Fuente → práctica': 'Source → practice', 'Texto a estudiar': 'Text to study',
    'Pega un texto (o el contenido de un PDF copiado) para obtener resumen, preguntas y tarjetas.': 'Paste a text (or the content of a copied PDF) to get a summary, questions and cards.',
    'Generar estudio': 'Generate study set', 'Pega material para ampliar Learny más allá de las flashcards.': 'Paste material to extend Learny beyond flashcards.', 'Resumen': 'Summary', 'Preguntas para ti': 'Questions for you',
    'No tienes repasos hoy.': 'You have no reviews today.', 'Puedes adelantar 5 tarjetas o crear nuevas.': 'You can move up 5 cards or create new ones.', 'Adelantar 5 tarjetas': 'Move up 5 cards', 'Aún no tienes tarjetas.': "You don't have any cards yet.",
    'Crea una desde tus apuntes, pide 5 al tutor o añade un mazo de ejemplo.': 'Create one from your notes, ask the tutor for 5 or add a sample deck.', 'Pedir 5 al tutor': 'Ask the tutor for 5', 'Mazo de ejemplo': 'Sample deck',
    'Esta tarjeta no se pudo cargar.': 'This card could not be loaded.', 'Le falta la pregunta o la respuesta. Edítala para repararla, pospónla o elimínala.': 'It is missing the question or the answer. Edit it to repair it, postpone it or delete it.',
    'Pregunta': 'Question', 'Respuesta': 'Answer', 'Devolver a rotación': 'Return to rotation', 'Nueva flashcard': 'New flashcard', 'Editar flashcard': 'Edit flashcard', 'Plantilla': 'Template', 'Ninguna': 'None',
    'Definición': 'Definition', 'Concepto → ejemplo': 'Concept → example', 'Problema → solución': 'Problem → solution', 'Generar respuesta con IA': 'Generate answer with AI', 'Guardar cambios': 'Save changes',
    'Crear tarjetas con IA': 'Create cards with AI', 'Tus apuntes (opcional)': 'Your notes (optional)', 'Generar 5 tarjetas': 'Generate 5 cards', 'Generando tarjetas…': 'Generating cards…',
    'Revisa las tarjetas': 'Review the cards', 'Aceptar': 'Accept', 'Descartar': 'Discard', 'Guardar aceptadas': 'Save accepted',
    'Tarjeta creada.': 'Card created.', 'Tarjeta e inversa creadas.': 'Card and reverse card created.', 'Escribe la siguiente.': 'Write the next one.',
    'La inversa no se creó: la respuesta es demasiado larga para ser una pregunta (máx. 500 caracteres).': 'The reverse card was not created: the answer is too long to be a question (max. 500 characters).',
    'Crear también la tarjeta inversa (respuesta → pregunta)': 'Also create the reverse card (answer → question)', 'Guardar y añadir otra': 'Save and add another',
    'Ctrl+Intro (⌘+Intro en Mac) guarda y añade otra.': 'Ctrl+Enter (⌘+Enter on Mac) saves and adds another.', 'Añadidas en esta tanda:': 'Added in this batch:', 'Tarjeta actualizada.': 'Card updated.', 'Tarjeta eliminada.': 'Card deleted.', 'Pospuesta 1 día.': 'Snoozed 1 day.', 'Tarjeta enviada a la Biblioteca.': 'Card sent to the Library.',
    'Tarjeta devuelta a la rotación.': 'Card returned to rotation.', 'Calificación guardada.': 'Rating saved.', 'Repaso anticipado guardado: la tarjeta mantiene su fecha.': 'Early review saved: the card keeps its date.',
    'Nota guardada.': 'Note saved.', 'Escribe una nota primero.': 'Write a note first.', 'Acción deshecha.': 'Action undone.', 'Deshacer': 'Undo', 'Ya no se puede deshacer: la situación cambió.': "Can't undo anymore: the situation changed.",
    'Ya tienes un examen en curso. Termínalo o sal de él antes de empezar otro.': 'You already have an exam in progress. Finish it or leave it before starting another.',
    'No hay tarjetas vencidas o de hoy para el examen.': 'There are no overdue or due cards for the exam.',
    'Saliste del examen. Tus respuestas se guardaron en el repaso, pero no cuentan como examen.': 'You left the exam. Your answers were saved in your reviews, but do not count as an exam.',
    'Termina o abandona el examen antes de eliminar esta tarjeta.': 'Finish or leave the exam before deleting this card.',
    'No hay tarjetas para hoy. Crea más o vuelve mañana.': 'There are no cards for today. Create more or come back tomorrow.',
    'Fase terminada. Ahora explica con Feynman.': 'Phase finished. Now explain with Feynman.', 'Escribe tu explicación.': 'Write your explanation.', 'Modo local: sin clave también recibes guía socrática.': 'Local mode: without a key you also get Socratic guidance.',
    'Tema añadido a tu ruleta.': 'Topic added to your roulette.', 'Escribe cualquier tema primero.': 'Write any topic first.', 'Añade cualquier tema para girar la ruleta.': 'Add any topic to spin the roulette.',
    /* ---- Biblioteca ---- */
    'Tus tarjetas y mazos': 'Your cards and decks', 'Tarjetas que ya dominas y mazos iniciales para empezar rápido.': 'Cards you already master and starter decks to get going fast.', 'Tarjetas guardadas para consultar cuando quieras.': 'Saved cards to look up whenever you want.',
    'Buscar en tu biblioteca': 'Search your library', 'Pregunta, respuesta o materia': 'Question, answer or subject', 'Mazos iniciales y mazos propios': 'Starter decks and your own decks', 'añade tarjetas de ejemplo o crea tu mazo': 'add sample cards or create your own deck',
    'Mazos iniciales sin tus estadísticas. Duplicas el contenido; el progreso es solo tuyo.': 'Starter decks without your statistics. You duplicate the content; the progress is only yours.',
    'Aún no hay archivo. Envía aquí las tarjetas que ya dominas.': 'Nothing archived yet. Send the cards you already master here.', 'Ninguna tarjeta coincide con tu búsqueda.': 'No card matches your search.',
    '+ Crear mazo': '+ Create deck', 'Crear mazo': 'Create deck', 'Nombre del mazo': 'Deck name', 'Guardar mazo': 'Save deck', 'Cálculo básico': 'Basic calculus', 'Método científico': 'Scientific method', 'Programación': 'Programming',
    /* ---- Planificar ---- */
    'Planificador inteligente': 'Smart planner', 'Convierte fechas en pasos diarios.': 'Turn dates into daily steps.', 'Calendario de la semana': 'Week calendar', 'Estudio inteligente': 'Smart study', 'Plan de emergencia': 'Emergency plan',
    'Próximas fechas': 'Upcoming dates', '+ Añadir': '+ Add', 'Tareas de hoy': "Today's tasks", 'Plan inverso': 'Reverse plan', 'Cambios en tu plan': 'Changes to your plan',
    'Si te atrasas, Learny mueve a hoy como máximo las 2 tareas atrasadas más recientes de cada examen y descarta las anteriores para que el plan siga siendo realista. Aquí ves cada cambio.': 'If you fall behind, Learny moves at most the 2 most recent overdue tasks of each exam to today and discards the earlier ones so the plan stays realistic. Here you see every change.',
    'Informe de examen': 'Exam report', 'registra qué falló y crea un plan de recuperación': 'record what went wrong and create a recovery plan', 'Registra qué falló en un parcial y Learny arma un plan de recuperación.': 'Record what went wrong in an exam and Learny builds a recovery plan.',
    'Qué falló': 'What went wrong', 'Temas o tipos de problema': 'Topics or problem types', 'Crear plan de recuperación': 'Create recovery plan',
    'Añade una fecha para que Learny arme tu bloque de estudio de hoy.': "Add a date so Learny can build today's study block.", 'Añade una fecha importante para ver el plan inverso del día.': "Add an important date to see the day's reverse plan.",
    'Añade una fecha de examen para generar tareas diarias conectadas a temas y tarjetas.': 'Add an exam date to generate daily tasks linked to topics and cards.', 'Cuando tengas un examen, aquí aparecerán las tareas de hoy.': "When you have an exam, today's tasks will appear here.",
    'Nueva fecha': 'New date', 'Nombre': 'Name', 'Fecha': 'Date', 'Dificultad (1-5)': 'Difficulty (1-5)', 'Minutos diarios': 'Daily minutes', 'Guardar y crear plan': 'Save and create plan', 'Plan inverso creado con tareas diarias.': 'Reverse plan created with daily tasks.',
    'Replanificar desde hoy': 'Replan from today', 'Replanificar': 'Replan', 'Pasada': 'Past', 'dificultad': 'difficulty', 'min/día': 'min/day', 'fases:': 'phases:', 'comprensión': 'understanding', 'práctica': 'practice', 'repaso': 'review', 'simulacro': 'mock exam', 'revisión': 'final review',
    'Comprensión': 'Understanding', 'Práctica': 'Practice', 'Repaso': 'Review', 'Simulacro': 'Mock exam', 'Revisión final': 'Final review', 'Ya no cabe a este ritmo': 'No longer fits at this pace',
    'Todavía no hubo cambios. Si te atrasas, aquí verás qué tareas movió o descartó Learny y por qué.': 'No changes yet. If you fall behind, here you will see which tasks Learny moved or discarded and why.',
    'Entendido': 'Got it', 'Crear plan': 'Create plan', 'Examen': 'Exam', 'Fecha': 'Date', 'Dificultad (1-5)': 'Difficulty (1-5)',
    /* ---- Reforzar ---- */
    'Análisis personal': 'Personal analysis', 'Qué reforzar mañana.': 'What to reinforce tomorrow.', 'Periodo': 'Period', 'Últimos 7 días': 'Last 7 days', 'Últimos 30 días': 'Last 30 days', 'Todo el historial': 'Entire history',
    'Recuerdo declarado': 'Self-reported recall', 'Repasos sin fallar': 'Reviews without failing', 'Exámenes (Fácil)': 'Exams (Easy)', 'Exámenes': 'Exams', 'Constancia': 'Consistency', 'Tiempo registrado': 'Time logged',
    'Tarjetas vencidas': 'Overdue cards', 'pendientes de repaso ahora': 'pending review now', 'Cómo se calculan estos números': 'How these numbers are calculated',
    'Minutos de foco por día': 'Focus minutes per day', 'Exportar semana': 'Export week', 'Materias a reforzar': 'Subjects to reinforce', 'Más datos': 'More data', 'mapa conceptual, resultados y práctica': 'concept map, results and practice',
    'Mapa conceptual': 'Concept map', 'Resultados y práctica': 'Results and practice', 'Reto semanal': 'Weekly challenge', 'Qué hacer con estos números': 'What to do with these numbers', 'Iniciar enfoque': 'Start focus', 'Ver plan': 'View plan', 'Empezar': 'Start',
    'Minutos de foco por día en la última semana': 'Focus minutes per day over the last week', 'Relación entre materias y tarjetas': 'Relationship between subjects and cards',
    'Completa tu primer Pomodoro para ver tu progreso.': 'Complete your first Pomodoro to see your progress.', 'Sin datos en este periodo': 'No data in this period', 'muestra pequeña': 'small sample',
    'Aún no hay repasos en este periodo. Repasa tus primeras tarjetas para ver qué materias reforzar.': 'There are no reviews in this period yet. Review your first cards to see which subjects to reinforce.',
    'Crea tarjetas para ver este panel.': 'Create cards to see this panel.', '¡Meta semanal cumplida!': 'Weekly goal reached!', '¡Meta cumplida!': 'Goal reached!', 'Ruta sugerida': 'Suggested route',
    'Sin huecos claros: sigue con tu plan y añade tarjetas nuevas.': 'No clear gaps: keep following your plan and add new cards.',
    'Repasos de los próximos 7 días': 'Reviews over the next 7 days', 'Repasos programados por día': 'Reviews scheduled per day', 'Más adelante:': 'Later:',
    'Solo cuenta lo que ya está programado; si fallas una tarjeta, volverá antes.': 'Only what is already scheduled is counted; if you fail a card, it will come back sooner.',
    'Crea tarjetas para ver cuántos repasos te esperan.': 'Create cards to see how many reviews are waiting for you.',
    'sin cambio': 'no change', 'la tarjeta mantiene su fecha': 'the card keeps its date', 'dentro de': 'in',
    /* ---- Guardado, avisos y confirmaciones ---- */
    'Guardado': 'Saved', 'No guardado': 'Not saved', 'Sincronizado': 'Synced', 'Cerrar': 'Close', 'Cancelar': 'Cancel', 'Confirmar': 'Confirm', '¿Seguro?': 'Are you sure?', 'Ventana de Learny': 'Learny window', 'Guardar': 'Save',
    'Consulta cancelada.': 'Query cancelled.', 'Cancelar consulta': 'Cancel query', 'Escribe una consulta.': 'Write a query.', 'Consultando tutor…': 'Consulting tutor…', 'Reintentar': 'Retry', 'No se pudo completar': 'Could not be completed',
    'Learny se actualizó. Recarga la página para usar la última versión.': 'Learny was updated. Reload the page to use the latest version.',
    'No se pudo guardar: el navegador bloqueó el almacenamiento o está lleno. Descarga una copia en Ajustes.': 'Could not save: the browser blocked storage or it is full. Download a backup in Settings.',
    'Datos importados correctamente.': 'Data imported successfully.', 'Copia descargada (sin clave API).': 'Backup downloaded (without API key).', 'Preferencias guardadas.': 'Preferences saved.', 'Contexto del tutor guardado.': 'Tutor context saved.',
    'Explicar más simple': 'Explain more simply', 'Explícamelo directamente': 'Explain it directly', 'Dame un ejercicio': 'Give me an exercise', 'Crear tarjetas': 'Create cards', 'Guardar en notas': 'Save to notes',
    'Pregunta guía': 'Guiding question', 'Pista': 'Hint', 'Explicación': 'Explanation', 'Ejemplo': 'Example', 'Siguiente reto': 'Next challenge', 'Lo que explicaste bien': 'What you explained well',
    'Revisa esta afirmación': 'Check this statement', 'Falta este concepto': 'Missing concept', 'Pregunta para comprobar': 'Check question', 'Conecta Gemini': 'Connect Gemini', 'Guardar clave': 'Save key', 'Continuar sin IA': 'Continue without AI',
    'Añade tu clave de Gemini en Ajustes o elige Guía local.': 'Add your Gemini key in Settings or choose Local guide.',
    'La clave de Gemini solo puede tener caracteres ASCII (letras, números y símbolos), sin espacios. Cópiala de nuevo desde Google AI Studio.': 'The Gemini key can only contain ASCII characters (letters, numbers and symbols), no spaces. Copy it again from Google AI Studio.',
    /* ---- Ajustes ---- */
    'Idioma': 'Language', 'Apariencia': 'Appearance', 'Los cambios se ven al instante y solo se guardan con «Guardar preferencias».': 'Changes are visible instantly and are only saved with “Save preferences”.',
    'Estilos rápidos': 'Quick styles', 'Cuaderno': 'Notebook', 'Lectura nocturna': 'Night reading', 'Papel': 'Paper', 'Enfoque': 'Focus', 'Restablecer apariencia': 'Reset appearance', 'Apariencia restablecida. Pulsa «Guardar preferencias» para conservarla.': 'Appearance reset. Press “Save preferences” to keep it.',
    'Automático (según tu sistema)': 'Automatic (follows your system)', 'Oscuro': 'Dark', 'Negro (OLED)': 'Black (OLED)', 'Claro': 'Light', 'Alto contraste': 'High contrast', 'Cromo': 'Chrome',
    'Color de acento (no en Sepia, Alto contraste ni Cromo)': 'Accent color (not in Sepia, High contrast or Chrome)', 'Cielo': 'Sky', 'Menta': 'Mint', 'Violeta': 'Violet', 'Ámbar': 'Amber', 'Rosa': 'Rose', 'Personalizado': 'Custom', 'Color personalizado': 'Custom color',
    'Cromo utiliza una paleta monocromática.': 'Chrome uses a monochrome palette.', 'Esquinas': 'Corners', 'Rectas': 'Sharp', 'Suaves': 'Soft', 'Redondeadas': 'Rounded', 'Tarjetas': 'Cards', 'Con borde': 'With border', 'Con sombra': 'With shadow',
    'Fondo': 'Background', 'Cuadriculado': 'Grid', 'Puntos': 'Dots', 'Liso': 'Plain', 'Densidad': 'Density', 'Compacta': 'Compact', 'Amplia': 'Roomy', 'Tipografía y lectura': 'Typography and reading',
    'Para el texto solo se usan fuentes del sistema: no se descarga nada de internet.': 'Text uses system fonts only: nothing is downloaded from the internet.', 'Fuente del texto': 'Text font', 'Sistema (sans)': 'System (sans)', 'Humanista': 'Humanist', 'Serif de lectura': 'Reading serif', 'Redondeada': 'Rounded', 'Monoespaciada': 'Monospaced',
    'Lectura fácil (OpenDyslexic si está instalada; si no, Verdana)': 'Easy reading (OpenDyslexic if installed; otherwise Verdana)', 'Fuente de los títulos': 'Heading font', 'Serif (actual)': 'Serif (current)', 'La misma del texto': 'Same as text',
    'Tamaño de texto:': 'Text size:', 'Interlineado': 'Line spacing', 'Compacto': 'Compact', 'Amplio': 'Wide', 'Espaciado de letras': 'Letter spacing', 'Muy amplio': 'Very wide', 'Texto de las tarjetas de estudio': 'Study card text', 'Grande': 'Large', 'Muy grande': 'Very large',
    'Disposición': 'Layout', 'Ancho del contenido': 'Content width', 'Estrecho (1000 px)': 'Narrow (1000 px)', 'Normal (1240 px)': 'Normal (1240 px)', 'Ancho (1600 px)': 'Wide (1600 px)', 'Menú lateral (escritorio)': 'Side menu (desktop)', 'Completo': 'Full', 'Solo iconos': 'Icons only',
    'Mostrar las misiones de hoy': "Show today's missions", 'Mostrar el dato curioso': 'Show the fun fact', 'Reducir animaciones': 'Reduce animations', 'Atenuar el menú y la barra superior durante un bloque o examen': 'Dim the menu and top bar during a block or exam',
    'Compañero de estudio: Lumi': 'Study companion: Lumi', 'Apariencia de Lumi': 'Lumi appearance', 'Abeja pixelada': 'Pixel bee', 'Solo cambia el dibujo: Lumi se comporta igual. Se ve al instante y se guarda con «Guardar preferencias».': 'Only the drawing changes: Lumi behaves the same. It shows instantly and is saved with “Save preferences”.',
    'Estudio y avisos': 'Study and notifications', 'Tu nombre (opcional, para el saludo)': 'Your name (optional, for the greeting)', 'Materia y objetivo de estudio: se editan en «Contexto del tutor», arriba en la página.': 'Subject and study goal: edit them in “Tutor context”, at the top of the page.',
    'Sonido al terminar': 'Sound when finished', 'Avisos al terminar bloques y un recordatorio diario al abrir la app (no llegan con la app cerrada)': 'Alerts when blocks finish and a daily reminder when opening the app (they do not arrive with the app closed)',
    'Pomodoro (min)': 'Pomodoro (min)', 'Ruleta: preparación': 'Roulette: preparation', 'Ruleta: explicación': 'Roulette: explanation', 'Inteligencia artificial': 'Artificial intelligence', 'Clave de Gemini (opcional)': 'Gemini key (optional)',
    'Clave guardada (vacío = conservar)': 'Key saved (empty = keep)', 'Pega aquí tu clave': 'Paste your key here', 'Tu clave se guarda solo en este navegador y no debe usarse en un equipo compartido. Va en el encabezado x-goog-api-key, no en la URL.': 'Your key is stored only in this browser and should not be used on a shared computer. It goes in the x-goog-api-key header, not in the URL.',
    'Gemini es la inteligencia artificial de Google que usa Learny. Consigue una clave gratuita en': 'Gemini is the Google artificial intelligence that Learny uses. Get a free key at', 'Modelos disponibles:': 'Available models:',
    'Modelo de Gemini': 'Gemini model', 'URL de tu proxy (opcional, para no exponer la clave)': 'Your proxy URL (optional, to avoid exposing the key)', 'Datos y copias': 'Data and backups', 'Descargar copia': 'Download backup', 'Compartir mazo': 'Share deck',
    'Importar JSON': 'Import JSON', 'Importar CSV / Anki (.csv, .txt)': 'Import CSV / Anki (.csv, .txt)', 'Quitar clave guardada': 'Remove saved key', 'Restaurar copia automática': 'Restore automatic backup', 'Borrar todo': 'Delete everything',
    'Elegir archivo para copia automática': 'Choose a file for automatic backup', 'Reactivar copia automática': 'Resume automatic backup', 'Desactivar copia automática': 'Turn off automatic backup',
    'Copia automática a un archivo: desactivada': 'Automatic backup to a file: off', 'Copia automática en pausa: el navegador necesita tu permiso': 'Automatic backup paused: the browser needs your permission', 'Copia automática: no se pudo escribir (se reintentará)': 'Automatic backup: could not write (will retry)',
    'Copia automática activada. Se actualizará sola mientras Learny esté abierta.': 'Automatic backup on. It updates itself while Learny is open.', 'No se pudo escribir en ese archivo.': 'Could not write to that file.', 'No se pudo activar la copia automática.': 'Could not turn on automatic backup.',
    'Sin permiso, la copia automática sigue en pausa.': 'Without permission, automatic backup stays paused.', 'No se pudo reactivar la copia automática.': 'Could not resume automatic backup.', 'Copia automática desactivada. El archivo que ya existe no se borra.': 'Automatic backup turned off. The existing file is not deleted.',
    'Archivo JSON a importar': 'JSON file to import', 'Archivo CSV o Anki a importar': 'CSV or Anki file to import', 'Guardar preferencias': 'Save preferences', 'Comentarios:': 'Feedback:',
    'Lumi está oculto. Puedes reactivarlo en Ajustes.': 'Lumi is hidden. You can turn it back on in Settings.', 'Ocultar a Lumi': 'Hide Lumi',
    /* ---- Lumi ---- */
    '¿Empezamos con algo corto?': 'Shall we start with something short?', 'Bloque completado.': 'Block completed.', 'Esta vuelve pronto. Sin prisa.': 'This one will be back soon. No rush.',
    'En el repaso anterior marcaste «No lo sabía»; esta vez, «Fácil».': "On the previous review you marked “Didn't know it”; this time, “Easy”.",
    'Bienvenido de nuevo. Podemos empezar con algo corto.': 'Welcome back. We can start with something short.', 'Crea tu primera tarjeta para empezar.': 'Create your first card to get started.',
    'Un bloque más hecho.': 'One more block done.', 'Buen ritmo: bloque completado.': 'Nice pace: block completed.', 'Volverá pronto; así se fija mejor.': "It will be back soon; that's how it sticks better.", 'Fallar también enseña. Sin prisa.': 'Getting it wrong teaches too. No rush.',
    'Esta te costó la vez anterior y ahora la marcaste «Fácil».': 'This one was hard last time and now you marked it “Easy”.',
    'Intentar recordar antes de mirar la respuesta fortalece la memoria.': 'Trying to recall before looking at the answer strengthens memory.', 'Un descanso corto entre bloques ayuda a mantener la atención.': 'A short break between blocks helps you keep your attention.',
    'Explicar algo en voz alta muestra qué te falta por entender.': 'Explaining something out loud shows what you still need to understand.', 'Estudiar un poco cada día rinde más que mucho un solo día.': 'Studying a little every day works better than a lot on a single day.',
    'Anotar tus dudas mientras estudias te ayuda a resolverlas después.': 'Writing down your doubts while you study helps you resolve them later.',
    /* ---- Portada ---- */
    'Para estudiar con calma y constancia': 'For calm, consistent studying', 'Estudia con intención, un paso a la vez': 'Study with intention, one step at a time',
    'Learny reúne un temporizador Pomodoro, tarjetas con repaso espaciado y un plan que cuenta hacia atrás desde la fecha de tu examen. Sin cuenta ni registro: tus datos se quedan en este navegador.': 'Learny brings together a Pomodoro timer, spaced-repetition flashcards and a plan that counts backwards from your exam date. No account or sign-up: your data stays in this browser.',
    'Probar Learny': 'Try Learny', 'Ver el recorrido': 'See how it works', 'Ver una demostración': 'See a demo', 'Una vez cargada, funciona sin conexión. Puedes descargar una copia de tus datos cuando quieras.': 'Once loaded, it works offline. You can download a copy of your data whenever you want.',
    'Así se ve «Hoy»: una acción recomendada con su motivo y, debajo, una tarjeta de repaso. Es un ejemplo ilustrativo; no son datos tuyos.': 'This is what “Today” looks like: a recommended action with its reason and, below, a review card. It is an illustrative example; it is not your data.',
    'Te sugerimos repasar estas 6 tarjetas porque 2 están vencidas y 4 tocan hoy.': 'We suggest reviewing these 6 cards because 2 are overdue and 4 are due today.', 'Química': 'Chemistry',
    '¿Qué ocurre con la entropía de un sistema aislado?': 'What happens to the entropy of an isolated system?', 'Preparar, practicar, repasar': 'Prepare, practice, review', 'Preparar': 'Prepare',
    'Pon la fecha de tu examen y Learny reparte el trabajo en tareas diarias, contando hacia atrás. Crea tarjetas desde tus apuntes o añade un mazo de ejemplo.': 'Set your exam date and Learny splits the work into daily tasks, counting backwards. Create cards from your notes or add a sample deck.',
    'Elige un resultado concreto y haz un bloque Pomodoro. Con las tarjetas, primero escribes tu respuesta y luego la comparas: recordar con esfuerzo suele ayudar más que releer.': 'Pick a concrete outcome and do a Pomodoro block. With cards, you first write your answer and then compare it: effortful recall usually helps more than rereading.',
    'Valoras cada tarjeta (no lo sabía, dudé, fácil) y Learny programa cuándo volver a verla. Cada día, «Hoy» te propone una sola cosa para empezar.': 'You rate each card (didn\'t know it, unsure, easy) and Learny schedules when you\'ll see it again. Every day, “Today” suggests a single thing to start with.',
    'Tus datos, contigo': 'Your data, with you', 'No hay cuenta ni registro.': 'There is no account or sign-up.', 'Todo se guarda solo en este navegador; en Ajustes puedes descargar una copia.': 'Everything is stored only in this browser; in Settings you can download a copy.',
    'La IA es opcional: solo se usa internet si añades tu propia clave o tu proxy.': 'AI is optional: the internet is only used if you add your own key or proxy.',
    /* ---- Datos curiosos ---- */
    'Los pulpos tienen tres corazones.': 'Octopuses have three hearts.', 'La miel puede conservarse durante miles de años.': 'Honey can keep for thousands of years.', 'Tu cerebro consolida recuerdos mientras duermes.': 'Your brain consolidates memories while you sleep.',
    'Los árboles intercambian nutrientes mediante redes de hongos.': 'Trees exchange nutrients through fungal networks.', 'La luz solar tarda unos 8 minutos en llegar a la Tierra.': 'Sunlight takes about 8 minutes to reach Earth.', 'Los tiburones existen desde antes que los árboles.': 'Sharks have existed since before trees.',
    'Un día en Venus dura más que un año en Venus.': 'A day on Venus lasts longer than a year on Venus.', 'Explicar algo con tus palabras revela lo que realmente entiendes.': 'Explaining something in your own words reveals what you really understand.',
    'Repasar justo antes de olvidar fortalece más la memoria que releer sin pausa.': 'Reviewing right before you forget strengthens memory more than rereading without pause.',
    'El corazón de un colibrí puede latir más de mil veces por minuto.': 'A hummingbird\'s heart can beat more than a thousand times per minute.', 'El cuerpo humano adulto tiene 206 huesos.': 'The adult human body has 206 bones.',
    'Las abejas se comunican entre sí con una especie de baile.': 'Bees communicate with each other through a kind of dance.', 'Hacer pausas cortas ayuda a mantener la atención durante más tiempo.': 'Taking short breaks helps you keep your attention for longer.',
    'Dormir bien antes de un examen suele ayudar más que estudiar toda la noche.': 'Sleeping well before an exam usually helps more than studying all night.', 'El agua cubre aproximadamente el 71 % de la superficie de la Tierra.': 'Water covers about 71% of the Earth\'s surface.'
  });
  /* Palabras ambiguas o muy cortas: solo se traducen cuando son TODO el texto del nodo (nunca dentro de una frase). */
  const ONLY = Object.assign(Object.create(null), { 'Iniciar enfoque': 'Start focus', 'Pausar': 'Pause', 'Continuar': 'Resume', 'Iniciar descanso': 'Start break', 'Continuar descanso': 'Resume break', 'Sí': 'Yes', 'Tarjeta': 'Card', dom: 'Sun', lun: 'Mon', mar: 'Tue', 'mié': 'Wed', jue: 'Thu', vie: 'Fri', 'sáb': 'Sat' });

  const pl = (n, a, b) => (Number(n) === 1 ? a : b);
  const MON = { ene: 'Jan', feb: 'Feb', mar: 'Mar', abr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Aug', sep: 'Sep', sept: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dec' };
  const MON_RE = 'ene|feb|mar|abr|may|jun|jul|ago|sept|sep|oct|nov|dic';
  const NOUN = { 'tarjetas falladas': 'failed cards', 'tarjeta fallada': 'failed card', 'tarjetas nuevas': 'new cards', 'tarjeta nueva': 'new card', 'tarjetas guardadas': 'cards saved', 'tarjeta guardada': 'card saved', tarjetas: 'cards', tarjeta: 'card',
    días: 'days', día: 'day', minutos: 'minutes', minuto: 'minute', 'bloques completados': 'blocks completed', 'bloque completado': 'block completed', bloques: 'blocks', bloque: 'block',
    'sesiones pendientes': 'pending sessions', 'sesión pendiente': 'pending session', 'sesiones descartadas': 'discarded sessions', 'sesión descartada': 'discarded session', sesiones: 'sessions', sesión: 'session',
    'tareas atrasadas': 'overdue tasks', 'tarea atrasada': 'overdue task', tareas: 'tasks', tarea: 'task', repasos: 'reviews', repaso: 'review', exámenes: 'exams', examen: 'exam', errores: 'errors', error: 'error',
    'registros': 'records', registro: 'record', 'distracciones anotadas': 'distractions noted', 'distracción anotada': 'distraction noted', 'mazos propios nuevos': 'new custom decks', 'mazo propio nuevo': 'new custom deck', mazos: 'decks', mazo: 'deck',
    'ideas de tema': 'topic ideas', 'idea de tema': 'topic idea', materias: 'subjects', materia: 'subject', válidas: 'valid', válida: 'valid', 'posibles duplicadas': 'possible duplicates', 'posible duplicada': 'possible duplicate', nuevas: 'new', nueva: 'new', Pomodoros: 'Pomodoros', Pomodoro: 'Pomodoro' };
  const NOUN_KEYS = Object.keys(NOUN).sort((a, b) => b.length - a.length).join('|');
  const W = '(?![\\p{L}\\p{N}])';
  const T = (x) => tr(x, false);

  /* Reglas con números o con frases con huecos. Se aplican en orden sobre el texto ORIGINAL (español); lo capturado se traduce con T(). */
  const RULES = [
    [new RegExp('^Mañana te tocan (\\d+) repasos?\\.$', 'u'), (m, n) => `Tomorrow you have ${n} ${pl(n, 'review', 'reviews')} due.`], // Lumi (v73)
    [new RegExp('^Dato curioso: (.+)$', 'u'), (m, f) => `Fun fact: ${T(f)}`], // Lumi (v74): el dato del día se traduce con su entrada de EX
    [new RegExp('^Faltan? (\\d+) días? para tu próximo examen\\.$', 'u'), (m, n) => `${n} ${pl(n, 'day', 'days')} left until your next exam.`],
    [new RegExp('^Hoy llevas (\\d+) de (\\d+) bloques de tu meta\\.$', 'u'), (m, a, b) => `Today you have done ${a} of ${b} blocks of your goal.`],
    [new RegExp(`Copia automática activa(?: · última a las (\\d\\d:\\d\\d))?$`, 'u'), (m, t) => `Automatic backup on${t ? ` · last at ${t}` : ''}`],
    [new RegExp(`Meta: (\\d+) bloques? de (\\d+) minutos · hoy (\\d+)/(\\d+)\\. Racha: (\\d+) días?\\.`, 'u'), (m, a, b, c, d, e) => `Goal: ${a} ${pl(a, 'block', 'blocks')} of ${b} minutes · today ${c}/${d}. Streak: ${e} ${pl(e, 'day', 'days')}.`],
    [new RegExp(`Modo examen: (\\d+) tarjetas?\\.`, 'u'), (m, n) => `Exam mode: ${n} ${pl(n, 'card', 'cards')}.`],
    [new RegExp(`Sesión inteligente · paso (\\d) de 3: (\\d+) tarjetas?\\.`, 'u'), (m, s, n) => `Smart session · step ${s} of 3: ${n} ${pl(n, 'card', 'cards')}.`],
    [new RegExp(`Volverá en (\\d+) días?\\.`, 'u'), (m, n) => `It will be back in ${n} ${pl(n, 'day', 'days')}.`],
    [new RegExp(`Sumaste (\\d+) minutos?(?: en (.+?))?\\.`, 'u'), (m, n, l) => `You logged ${n} ${pl(n, 'minute', 'minutes')}${l ? ` on ${l}` : ''}.`],
    [new RegExp(`Última vez: (\\d+) minutos?(?: de (.+?))? (hoy|ayer|hace (\\d+) días?)\\.`, 'u'), (m, n, l, w, d) => `Last time: ${n} ${pl(n, 'minute', 'minutes')}${l ? ` of ${l}` : ''} ${d ? `${d} ${pl(d, 'day', 'days')} ago` : w === 'hoy' ? 'today' : 'yesterday'}.`],
    [new RegExp(`Bienvenido de vuelta: han pasado (\\d+) días? desde tu última sesión, y no pasa nada\\. Puedes retomar con «Solo 5 minutos»\\.`, 'u'), (m, n) => `Welcome back: ${n} ${pl(n, 'day has', 'days have')} passed since your last session, and that's okay. You can pick up again with “Just 5 minutes”.`],
    [new RegExp(`Tienes (\\d+) tarjetas para hoy\\. Este repaso toma 5 de ellas; el resto sigue pendiente\\.`, 'u'), (m, n) => `You have ${n} cards for today. This review takes 5 of them; the rest stay pending.`],
    [new RegExp(`Tienes ([^.]+)\\.`, 'u'), (m, body) => { const i = body.indexOf(' y '); const p = i < 0 ? [body] : [body.slice(0, i), body.slice(i + 3)]; return `You have ${p.map(T).join(' and ')}.`; }],
    [new RegExp(`Hoy llevas (\\d+) de (\\d+) bloques? de tu meta; escribe un resultado concreto y empieza\\.`, 'u'), (m, a, b) => `Today you have done ${a} of ${b} ${pl(b, 'block', 'blocks')} of your goal; write a concrete outcome and start.`],
    [new RegExp(`Hoy tienes (\\d+) tareas? de «([^»]*)», que es `, 'u'), (m, n, t) => `Today you have ${n} ${pl(n, 'task', 'tasks')} from “${t}”, which is `],
    [new RegExp(`Marcaste «No lo sabía» en (?:esta tarjeta|estas (\\d+) tarjetas) la última vez(?: \\(([^)]*)\\))?\\. Volver a verlas pronto es lo que más ayuda a fijarlas\\.`, 'u'), (m, n, s) => `You marked “Didn't know it” on ${n ? `these ${n} cards` : 'this card'} last time${s ? ` (${s})` : ''}. Seeing them again soon is what helps most to fix them.`],
    [new RegExp(`(\\d+)% sin fallar \\((\\d+) de (\\d+) repasos\\): es tu materia con más fallos\\. El quiz empieza por tus errores\\.`, 'u'), (m, p, a, b) => `${p}% without failing (${a} of ${b} reviews): it is your subject with the most mistakes. The quiz starts with your errors.`],
    [new RegExp(`Explicar «([^»]*)», tu materia con más fallos, revela lo que todavía no entiendes\\.`, 'u'), (m, s) => `Explaining “${s}”, your subject with the most mistakes, reveals what you still don't understand.`],
    [new RegExp(`Cabe: quedan ([\\d.]+) h de trabajo y hay ([\\d.]+) h disponibles hasta el examen\\.`, 'u'), (m, a, b) => `It fits: ${a} h of work left and ${b} h available until the exam.`],
    [new RegExp(`\\((\\d+) vencidas?\\)`, 'u'), (m, n) => `(${n} overdue)`],
    [new RegExp(`(\\d+) para hoy${W}`, 'u'), (m, n) => `${n} due today`],
    [new RegExp(`quedan (\\d\\d:\\d\\d)`, 'u'), (m, t) => `${t} left`],
    [new RegExp(`hace (\\d+) días?${W}`, 'u'), (m, n) => `${n} ${pl(n, 'day', 'days')} ago`],
    [new RegExp(`(?<![\\p{L}])en (\\d+) días?${W}`.replace('(?<![\\p{L}])', '\\b'), 'u'), (m, n) => `in ${n} ${pl(n, 'day', 'days')}`],
    [new RegExp(`\\bel (\\d{1,2}) (${MON_RE})\\.?${W}`, 'u'), (m, d, mo) => `on ${MON[mo]} ${d}`],
    [new RegExp(`\\b(\\d{1,2}) (${MON_RE})\\.?${W}`, 'u'), (m, d, mo) => `${MON[mo]} ${d}`],
    [new RegExp(`^(dom|lun|mar|mié|jue|vie|sáb) (\\d{1,2})$`, 'u'), (m, w, d) => `${T(w)} ${d}`],
    [new RegExp(`(\\d[\\d.,]*) (${NOUN_KEYS})${W}`, 'gu'), (m, n, k) => `${n} ${NOUN[k]}`]
  ];
  const keys = Object.keys(EX).sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const PH_RE = new RegExp(`(^|[^\\p{L}\\p{N}])(${keys.map(esc).join('|')})${W}`, 'gu'); // sin lookbehind (Safari antiguo)

  const cache = new Map();
  function tr(s, strict) {
    const ck = (strict ? 's' : 'n') + s; if (cache.has(ck)) return cache.get(ck);
    const t = s.trim(); let out = s;
    if (t && (EX[t] !== undefined || ONLY[t] !== undefined)) out = s.replace(t, () => EX[t] ?? ONLY[t]);
    else if (!strict) { out = s; for (const [re, fn] of RULES) out = out.replace(re, fn); out = out.replace(PH_RE, (m, pre, k) => pre + EX[k]); }
    if (cache.size > 4000) cache.clear(); cache.set(ck, out); return out;
  }

  /* ---- DOM: traduce y recuerda el original para poder volver al español ---- */
  const SKIP = '[translate="no"], textarea, script, style, noscript';
  const STRICT = '#flashcard, #library-list, #notes-list, #source-out, #feynman-guide, .ai-answer, .tutor-block, #topic-results, .review-card, #distraction-list, #concept-map b, #deadline-list > .session-item > b, #week-calendar .tag'; // contenido del usuario o de la IA: solo rótulos exactos
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  const tStore = new WeakMap(), aStore = new WeakMap();
  let cur = null, obs = null, titleObs = null, guideEs = null;

  function doText(n) {
    const p = n.parentElement; if (!p || p.closest(SKIP)) return;
    let rec = tStore.get(n); if (rec && n.data !== rec.t) rec = null;
    if (cur !== 'en') { if (rec) { n.data = rec.o; tStore.delete(n); } return; }
    const o = rec ? rec.o : n.data; if (!/\p{L}/u.test(o)) return;
    let out;
    if (o.trim() === 'Tema') out = o.replace('Tema', p.closest('label')?.querySelector('[name="theme"]') ? 'Theme' : 'Topic');
    else out = tr(o, !!p.closest(STRICT));
    if (out === o) { if (rec) tStore.delete(n); return; }
    if (rec && n.data === out) return;
    tStore.set(n, { o, t: out }); n.data = out;
  }
  function doAttr(el, name) {
    if (el.closest('[translate="no"]')) return;
    const v = el.getAttribute(name); if (v == null) return;
    const m = aStore.get(el) || {}; let rec = m[name]; if (rec && v !== rec.t) rec = null;
    if (cur !== 'en') { if (rec) { el.setAttribute(name, rec.o); delete m[name]; } return; }
    const o = rec ? rec.o : v, out = /\p{L}/u.test(o) ? tr(o, false) : o;
    if (out === o) { if (rec) delete m[name]; return; }
    if (rec && v === out) return;
    m[name] = { o, t: out }; aStore.set(el, m); el.setAttribute(name, out);
  }
  function walk(n) {
    if (n.nodeType === 3) { doText(n); return; }
    if (n.nodeType !== 1 || n.getAttribute('translate') === 'no') return;
    if (n.parentElement && n.parentElement.closest('[translate="no"]')) return;
    ATTRS.forEach((a) => { if (n.hasAttribute(a)) doAttr(n, a); });
    if (/^(SCRIPT|STYLE|TEXTAREA|NOSCRIPT)$/.test(n.tagName)) return;
    for (let c = n.firstChild; c; c = c.nextSibling) walk(c);
  }
  const onMut = (recs) => {
    for (const r of recs) {
      if (r.type === 'characterData') doText(r.target);
      else if (r.type === 'attributes') doAttr(r.target, r.attributeName);
      else r.addedNodes.forEach(walk);
    }
  };
  const onTitle = () => { const t = document.querySelector('title'); if (t) t.childNodes.forEach((c) => c.nodeType === 3 && doText(c)); };

  /* Guía de uso en inglés: se sustituye el contenido de #guide (con translate="no") y se restaura al volver al español. */
  const GUIDE_EN = `<div class="page-heading"><p class="eyebrow">User guide</p><h1 tabindex="-1">How to get the most out of Learny.</h1>
    <p class="lead">Five minutes of reading. Everything works without an account and your data stays in this browser.</p></div>
  <article class="card guide-flow"><h2>Your daily routine</h2>
    <p class="lead">Open <i>Today</i>: Learny suggests <b>one recommended action</b>, explains why using your data and lets you choose between two alternatives. If you are starting from scratch you will only see a first step.</p>
    <ol class="steps"><li><b>Plan.</b> In <i>Plan</i>, add your exam with a date: Learny creates daily tasks.</li><li><b>Focus.</b> Write a concrete outcome and press <i>Start focus</i>.</li>
    <li><b>Create and review cards.</b> Create cards from what you studied and review today's.</li><li><b>Explain.</b> Use Feynman or the roulette to explain in your own words.</li>
    <li><b>Reinforce.</b> In <i>Reinforce</i>, see which subjects fail and start there tomorrow.</li></ol></article>
  <div class="grid planner-grid spaced">
    <article class="card"><h2>Pomodoro</h2><p class="lead">25 min of focus and a 5 min break (changeable in <i>Today → Block options → Adjust times</i> or Settings). When a block ends, note whether you achieved your outcome and how focused you were. Your daily goal and streak are calculated automatically. After a block or exam, Learny shows a summary with only that session's data and lets you choose <i>Finish for today</i> or <i>Keep going a bit</i>. If the dimmed menu during a block bothers you, turn it off in <i>Settings → Layout</i>.</p></article>
    <article class="card"><h2>Flashcards</h2><p class="lead">Press <i>+ Create</i>, write a question and answer, and try to recall before revealing. To create several in a row use <i>Save and add another</i> (or Ctrl+Enter); the <i>reverse card</i> checkbox also creates the question the other way round, which arrives the next day. Rate honestly: the harder it was, the sooner the card comes back; each button shows in how many days it will return. Send the ones you master to the Library.</p></article>
    <article class="card"><h2>Tutor and search</h2><p class="lead">The top bar asks a tutor that questions before answering. Its <i>Context</i> (subject, level, mode, dictation) is in <i>Practice</i>. <i>Local guide</i> works offline; Gemini needs your free key (Settings). Google, Wikipedia and Perplexity open a new tab.</p></article>
    <article class="card"><h2>Planner</h2><p class="lead">Each date is split into phases: understanding, practice, review, mock exam and final review. Tick off finished tasks. If you fall behind, Learny moves up to 2 tasks per exam to today, discards the rest and explains it in <i>Changes to your plan</i>. Each date says whether what is left still fits your daily pace, and <i>Replan from today</i> recalculates the plan.</p></article>
  </div>
  <div class="grid planner-grid spaced">
    <article class="card"><h2>Next best action</h2><p class="lead">In <i>Today</i>, Learny recommends one action and explains <b>why</b> with real data. Order: today's cards, exam plan, failed cards, weakest subject and, if nothing is pending, new material. Below you will see up to <b>two alternatives</b>. If starting is hard today, press <i>I'm struggling to start today</i>: it suggests something very small and closing the window changes nothing. <i>Start smart session</i> (in <i>More options</i>) chains three steps: card and error review, a Pomodoro and a Feynman explanation.</p></article>
    <article class="card"><h2>Where the advanced stuff is</h2><p class="lead">Nothing was removed: it is one click away in collapsible blocks. <i>Today → More about today</i> and <i>Block options</i>. <i>Practice → More ways to review</i> and <i>More practice tools</i> (roulette, notes, reading). <i>Library → Starter decks and your own decks</i>. <i>Plan → Exam report</i>. <i>Reinforce → More data</i>. <i>Settings → Artificial intelligence</i> (key, model, proxy). During a focus block or exam only the current activity and its controls are shown.</p></article>
    <article class="card"><h2>What Gemini is and how to get your key</h2><p class="lead">Learny's AI features (tutor, Generate study set, Create with AI) use <b>Gemini</b>, Google's artificial intelligence. Without a key, Learny still works with the <i>Local guide</i>. To turn the AI on:</p>
    <ol class="steps"><li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a> with your Google account and press <i>Create API key</i>.</li>
    <li>Copy the key and paste it in <i>Settings → Artificial intelligence</i>; press <i>Save preferences</i>. When you reopen Settings the field looks empty: that is normal, the key is saved.</li>
    <li>Optional: change the model in that same block. The default is <code>gemini-3.8-flash</code>. Model list: <a href="https://ai.google.dev/gemini-api/docs/models" target="_blank" rel="noopener">ai.google.dev/gemini-api/docs/models</a>.</li></ol>
    <p class="lead">The key is personal: do not share it. Free-usage limits are set by Google.</p></article>
    <article class="card"><h2>AI tutor and privacy</h2><p class="lead">After each tutor answer you can ask <i>Explain more simply</i>, <i>Give me an exercise</i> or <i>Create cards</i>, and cancel while waiting. To avoid exposing your key, you can enter your own proxy URL in Settings (see <code>proxy-worker.example.js</code>).</p></article>
  </div>
  <div class="grid planner-grid spaced">
    <article class="card"><h2>More ways to review</h2><p class="lead"><i>Exam mode</i> uses today's cards. <i>Interleave</i> mixes them by subject. <i>5 minutes</i> runs a short session. <i>Real exam</i> combines today's cards, the ones you failed and random ones, with a 1.5 min per card stopwatch. If you review a card before its date and know it, its schedule does not change.</p></article>
    <article class="card"><h2>Notes and reading</h2><p class="lead">In <i>Practice → More practice tools</i>, save quick notes and turn them into cards. <i>Generate study set</i> summarizes a text and proposes questions. The microphone dictates your explanation or question (Chrome and Edge).</p></article>
    <article class="card"><h2>Decks</h2><p class="lead">In <i>Library → Starter decks and your own decks</i> add starter decks or create yours with one card per line: <code>question | answer</code>. <i>Share deck</i> (Settings) exports your cards and decks without progress. You can also import CSV or Anki text (.csv, .txt).</p></article>
    <article class="card"><h2>Special plans</h2><p class="lead"><i>Smart study</i> creates the full plan with Pomodoros and tasks per phase. <i>Emergency plan</i> spreads the last 3 days. <i>Exam report</i> turns your mistakes into a 7-day recovery plan. In <i>Practice</i>, the tutor offers <i>5 exercises</i> and <i>Error mode</i>, which points out where your reasoning fails.</p></article>
  </div>
  <article class="card spaced"><h2>Appearance and typography</h2><p class="lead">In <i>Settings</i>, the collapsible blocks <i>Appearance</i>, <i>Typography and reading</i> and <i>Layout</i> change how Learny looks. The <b>theme</b> can be Automatic, Dark, Black (OLED), Light, Sepia, High contrast or Chrome (black and silver, fixed accent); the <b>accent</b> accepts a custom color that Learny adjusts until it is readable. You also choose the interface <b>language</b> (English or Spanish), corners, cards, background, density, fonts, text size (13 to 24 px), line spacing and more. Changes show instantly but are only saved with <i>Save preferences</i>; if you close the window without saving, everything goes back.</p></article>
  <article class="card spaced"><h2>Keyboard shortcuts</h2><p class="lead"><kbd>Space</kbd> reveal answer · <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> rate · <kbd>P</kbd> start or pause the Pomodoro · <kbd>Esc</kbd> close a window · <kbd>Enter</kbd> in the concrete outcome starts the block · <kbd>Z</kbd> undo. Card shortcuts work in <i>Practice</i>. The whole flow can be done with the keyboard: <kbd>Tab</kbd> moves forward, <kbd>Shift</kbd>+<kbd>Tab</kbd> back, <kbd>Enter</kbd> or <kbd>Space</kbd> press, and when a window closes focus returns to the button that opened it.</p></article>
  <article class="card spaced"><h2>Data, backups and installation</h2><p class="lead">In Settings you can download a backup, import JSON or CSV and share a deck without your progress. On mobile, use <i>Add to home screen</i> to install it and use it offline. Before deleting or importing, Learny saves an automatic copy you can restore in Settings. If you clear browser data you lose your progress: download backups from time to time.</p></article>`;
  function swapGuide(en) {
    const g = document.getElementById('guide'); if (!g) return;
    if (en) { if (guideEs === null) { guideEs = g.innerHTML; g.setAttribute('translate', 'no'); g.innerHTML = GUIDE_EN; } }
    else if (guideEs !== null) { g.removeAttribute('translate'); g.innerHTML = guideEs; guideEs = null; }
  }

  /* ---- Guía local del tutor y IA en el idioma elegido ---- */
  const EN_GUIDES = [
    { q: 'What is the core idea in one sentence?', tip: 'Strip away the decoration and keep the cause or the definition.', ch: 'Explain it to a 12-year-old in 20 seconds.' },
    { q: 'What example of your own shows this?', tip: 'Skip the textbook example; use one from your life.', ch: 'Change one variable and predict what happens.' },
    { q: 'Where does this idea break down?', tip: 'Look for a counterexample or an edge case.', ch: 'Write down the doubt you still cannot resolve.' }
  ];
  function enGuide(topic, extra = '') { // los títulos de bloque siguen en español porque parseBlocks los reconoce; el DOM los traduce
    const g = EN_GUIDES[Math.abs([...`${topic}${extra}`].reduce((a, c) => a + c.charCodeAt(0), 0)) % EN_GUIDES.length], t = topic || 'this topic';
    return `**Pregunta guía**\n${g.q}\n\n**Pista**\n${g.tip}\n\n**Explicación**\nAbout “${t}”: state the core idea, an example of your own and a doubt.\n\n**Ejemplo**\nIf you are studying ${topic || 'the topic'}, compare a typical case with an edge case.\n\n**Siguiente reto**\n${g.ch}${extra ? `\n\nYour text: ${extra.slice(0, 180)}${extra.length > 180 ? '…' : ''}` : ''}`;
  }
  const AI_NOTE = '\n\nIMPORTANT: write your whole answer in English. Keep any bold block titles (for example **Pregunta guía**) exactly as written above, in Spanish, because the app parses them. If a "question | answer" line format is requested, write the content in English.';
  function patchGlobals() {
    try {
      if (typeof askGemini === 'function' && !askGemini.__i18n) {
        const o = askGemini, w = (p) => { if (cur !== 'en') return o(p); const b = cleanMl(p, MAX_PROMPT - AI_NOTE.length); return o(b ? b + AI_NOTE : b); }; w.__i18n = true; // JS-013: el recorte de askGemini (MAX_PROMPT) ya no se come la nota: se recorta el prompt y luego se añade
        window.askGemini = w; if (window.Learny) window.Learny.askGemini = w;
      }
      if (typeof localGuide === 'function' && !localGuide.__i18n) {
        const o = localGuide, w = (topic, extra) => (cur === 'en' ? enGuide(topic, extra) : o(topic, extra)); w.__i18n = true; window.localGuide = w;
      }
    } catch (e) { console.error('Learny · idioma', e); }
  }

  /* ---- Cambio de idioma ---- */
  const btn = () => document.getElementById('lang-toggle');
  function paintToggle() {
    const b = btn(); if (!b) return;
    b.textContent = cur === 'en' ? 'ES' : 'EN';
    b.setAttribute('aria-label', cur === 'en' ? 'Cambiar a español' : 'Switch to English'); b.title = b.getAttribute('aria-label');
  }
  function restoreAll() {
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) doText(n);
    document.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach((el) => ATTRS.forEach((a) => el.hasAttribute(a) && doAttr(el, a)));
    onTitle();
  }
  function setLang(next) {
    cur = next; document.documentElement.lang = next; patchGlobals();
    if (next === 'en') {
      swapGuide(true); walk(document.body); onTitle();
      if (window.MutationObserver) {
        obs = obs || new MutationObserver(onMut); obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
        const t = document.querySelector('title'); if (t) { titleObs = titleObs || new MutationObserver(onTitle); titleObs.observe(t, { childList: true, characterData: true, subtree: true }); }
      }
    } else {
      obs?.disconnect(); titleObs?.disconnect(); restoreAll(); swapGuide(false);
    }
    paintToggle();
  }
  function sync(s) {
    try {
      const next = s && s.lang === 'es' ? 'es' : 'en';
      if (next === cur) { paintToggle(); return; }
      setLang(next);
    } catch (e) { console.error('Learny · idioma', e); }
  }
  function init() {
    if (typeof state === 'undefined' || !document.body) return;
    btn()?.addEventListener('click', () => {
      state.settings.lang = cur === 'en' ? 'es' : 'en'; save(); applyAppearance();
      toast(cur === 'en' ? 'Language: English.' : 'Idioma: español.');
    });
    sync(state.settings);
  }
  window.LearnyI18n = Object.freeze({ sync, t: (es) => tr(es, false), get lang() { return cur; } });
  init();
})();
