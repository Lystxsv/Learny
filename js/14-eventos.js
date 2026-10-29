/* Learny · parte 14 de 15 · Eventos
   renderAll, manejadores de la interfaz, service worker, aviso sin conexión y la API `window.Learny` para extras.js.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

/* =========================================================
   Eventos
   ========================================================= */
const LAZY = { library: () => renderLibrary(), planner: () => renderDeadlines(), analysis: () => renderAnalysis(), practice: () => renderTopics() };
const renderPage = (page) => { const fn = LAZY[page]; if (fn) safe(fn, page); };
const renderAll = () => {
  safe(subjects, 'materias'); safe(renderFocus, 'Hoy'); safe(renderCard, 'tarjetas'); safe(renderTodayQueue, 'siguiente acción');
  renderPage(currentPage);
  document.dispatchEvent(new Event('learny:render'));
};

$$('[data-page]').forEach((b) => { b.onclick = () => showPage(b.dataset.page); });
{ const nav = $('.bottom-nav'); if (nav && typeof ResizeObserver !== 'undefined') new ResizeObserver(() => document.documentElement.style.setProperty('--nav-h', `${nav.offsetHeight}px`)).observe(nav); } // altura real de la barra: nada queda tapado
{ const head = $('.sidebar'); if (head && typeof ResizeObserver !== 'undefined') new ResizeObserver(() => document.documentElement.style.setProperty('--head-h', `${head.offsetHeight}px`)).observe(head); } // y de la cabecera móvil: el temporizador fijo no se solapa
$$('.page-heading h1').forEach((h) => { h.tabIndex = -1; });
$('#mini-timer').onclick = () => showPage('study');
$('#today-queue').onclick = (e) => { const b = e.target.closest('button[data-action]'); if (b && ACTIONS[b.dataset.action]) ACTIONS[b.dataset.action](b); };
$('#modal-form').addEventListener('invalid', (e) => reveal(e.target), true); // un campo inválido dentro de «Avanzado» abre su bloque para poder corregirlo
$('#exam-exit').onclick = () => { window.Learny.endExam(true); toast('Saliste del examen. Tus respuestas se guardaron en el repaso, pero no cuentan como examen.'); };
$('#flashcard').onclick = (e) => {
  const k = e.target.closest('[data-empty]')?.dataset.empty; if (!k) return;
  if (k === 'create') cardForm();
  else if (k === 'ai') document.dispatchEvent(new Event('learny:gen-cards'));
  else if (k === 'deck') { showPage('library'); toast('Elige un mazo de ejemplo en «Biblioteca de temas».'); }
  else if (k === 'more-new') { const pool = heldNewCards().slice(0, 5); if (pool.length) startExam(pool, 5); } // salta el límite diario a petición
  else if (k === 'advance') { const next = state.cards.filter((c) => !c.archived && !c.corrupt && c.lastReviewed !== today()).sort((a, b) => a.nextReview.localeCompare(b.nextReview)).slice(0, 5); if (!next.length) return toast('Ya repasaste hoy todas tus tarjetas. ¡Buen trabajo!'); startExam(next, 5); }
};
$('#weak-topics').onclick = (e) => { const n = e.target.dataset.quizSubject; if (n) startSubjectQuiz(n); };
$('#library-search').oninput = debounce(() => { libLimit = 40; renderLibrary(); }, 150);
$('#pomodoro-button').onclick = startPomodoro;
$('#distraction-add').onclick = addDistraction;
$('#distraction-input').onkeydown = (e) => { if (e.key === 'Enter' && !composing(e)) { e.preventDefault(); addDistraction(); } };
$$('[data-ambient]').forEach((b) => { b.onclick = () => setAmbient(b.dataset.ambient); });
$('#intention-input').onkeydown = (e) => { if (e.key === 'Enter' && !composing(e) && !timer.running) { e.preventDefault(); startPomodoro(); } }; // teclado: Enter en el resultado concreto inicia el bloque
$('#pomodoro-skip').onclick = () => resetTimer('focus');
$('#pomodoro-reset').onclick = () => {
  if (timer.started && timer.mode === 'focus' && timer.remaining < timer.total) askAbandon(() => resetTimer('focus'));
  else resetTimer('focus');
};
$('#pomodoro-config').onclick = configurePomodoro;
$('#daily-goal-input').onchange = () => { state.settings.dailyGoal = num($('#daily-goal-input').value, 1, 12, 2); save(); renderTimer(); };
$('#add-deadline').onclick = addDeadline;
$('#add-card').onclick = () => cardForm();
$('#gen-cards-top').onclick = () => document.dispatchEvent(new Event('learny:gen-cards')); // Fase 7: «Crear con IA» a la vista (lo atiende extras.js, igual que el botón de «Más formas de repasar»)
$('#exam-mode').onclick = () => startExam();
$('#reveal-card').onclick = revealCard;
$$('#rating-row button').forEach((b) => { b.onclick = () => rateCard(b.dataset.rating); });
$('#card-snooze').onclick = snoozeCard;
$('#card-edit').onclick = () => activeCard && cardForm(activeCard);
$('#card-delete').onclick = () => deleteCard(activeCard);
$('#card-archive').onclick = () => { if (!activeCard) return; const card = activeCard; card.archived = true; save(); renderAll(); offerUndo('Tarjeta enviada a la Biblioteca.', () => { card.archived = false; save(); renderAll(); }); };
$('#feynman-feedback').onclick = feynman;
$('#spin-roulette').onclick = () => spin();
$('#settings-button').onclick = openSettings;
$('#font-up').onclick = () => changeFont(1);
$('#font-down').onclick = () => changeFont(-1);
$('#export-report').onclick = exportReport;
$('#stats-period').onchange = (e) => { state.settings.statsPeriod = e.target.value; save(); renderAnalysis(); };
$('#save-tutor-context').onclick = () => fillTutor(false);
$('#tutor-mode').onchange = () => { syncTutorMode(); fillTutor(true); toast($('#tutor-mode').value === 'direct' ? 'El tutor te dará explicaciones directas.' : 'El tutor te guiará con preguntas.'); };
$('#clear-tutor-history').onclick = () => {
  const topic = chatTopic();
  state.chats = state.chats.filter((c) => c.topic.toLowerCase() !== topic.toLowerCase());
  save(); toast(`Historial de “${topic}” borrado.`);
};
$('#topic-search').oninput = debounce(renderTopics, 120);
$('#topic-search').onkeydown = (e) => { if (e.key === 'Enter' && !composing(e)) $('#add-topic').click(); };
$('#add-topic').onclick = () => { if (addTopic($('#topic-search').value)) { $('#topic-search').value = ''; renderTopics(); toast('Tema añadido a tu ruleta.'); } else toast('Escribe cualquier tema primero.', 'error'); };
$('#suggest-topic').onclick = suggestTopic;
$('#topic-results').onclick = (e) => {
  const del = e.target.closest('[data-delete-topic]'); if (del) { state.topics = state.topics.filter((t) => t.id !== del.dataset.deleteTopic); save(); renderTopics(); return; }
  const chip = e.target.closest('[data-topic]'); if (chip) spin(chip.dataset.topic);
};
$('#library-list').onclick = (e) => {
  if (e.target.id === 'library-more') { libLimit += 40; renderLibrary(); return; }
  const find = (attr) => state.cards.find((c) => c.id === e.target.dataset[attr]);
  const back = find('returnCard'); if (back) { back.archived = false; back.nextReview = today(); save(); renderAll(); toast('Tarjeta devuelta a la rotación.'); return; }
  const edit = find('editCard'); if (edit) { cardForm(edit); return; }
  const del = find('deleteCard'); if (del) deleteCard(del);
};
$('#plan-log-clear').onclick = () => { state.planLog = []; save(); renderPlanLog(); };
$('#deadline-list').onclick = (e) => {
  if (e.target.dataset.replan) { replanDeadline(e.target.dataset.replan); return; }
  const id = e.target.dataset.deleteDeadline;
  const idx = id ? state.deadlines.findIndex((d) => d.id === id) : -1; if (idx < 0) return;
  const dl = state.deadlines[idx], removed = state.tasks.filter((t) => t.deadlineId === id);
  snapshot('delete-deadline');
  state.deadlines.splice(idx, 1);
  state.tasks = state.tasks.filter((t) => t.deadlineId !== id);
  save(); renderAll();
  offerUndo(`«${dl.title}» y sus tareas eliminadas.`, () => { state.deadlines.splice(Math.min(idx, state.deadlines.length), 0, dl); state.tasks.push(...removed); save(); renderAll(); });
};
$('#today-tasks').onchange = (e) => {
  const id = e.target.dataset.task; if (!id) return;
  const task = state.tasks.find((t) => t.id === id); if (!task) return;
  const was = task.done; task.done = e.target.checked;
  save(); renderAll();
  offerUndo(task.done ? 'Tarea completada.' : 'Tarea reabierta.', () => { task.done = was; save(); renderAll(); });
};
$('#today-tasks').onclick = (e) => { const id = e.target.closest('[data-task-go]')?.dataset.taskGo; if (id) taskGo(id); }; // v71: «Empezar» de una tarea concreta
$('#leech-list').onclick = (e) => { const id = e.target.closest('[data-leech-open]')?.dataset.leechOpen; if (id) leechHelp(id); }; // v71: «Reescribir o dividir» una tarjeta difícil

$('#search-engine').value = state.settings.engine;
$('#search-engine').onchange = (e) => { state.settings.engine = e.target.value; save(); };
$('#ask-ai').onclick = async () => {
  const query = clean($('#ai-question').value, 800), engine = $('#search-engine').value;
  if (!query) return toast('Escribe una consulta.', 'error');
  fillTutor(true);
  if (engine === 'local') {
    const text = localGuide(query);
    modal(`<h2>Guía local</h2>${parseBlocks(text)}<button class="primary-button" type="button" onclick="this.closest('dialog').close()">Cerrar</button>`);
    saveChat('user', query); saveChat('tutor', text);
    return;
  }
  if (engine === 'gemini') {
    // Solo una respuesta real de la IA se guarda y limpia la pregunta; si falla o se cancela, la pregunta se conserva.
    await gemini(socraticPrompt(query), 'Tutor Learny', () => localGuide(query), (answer) => {
      saveChat('user', query); saveChat('tutor', answer);
      $('#ai-question').value = ''; $('#ai-question').dispatchEvent(new Event('input'));
    });
    return;
  }
  const urls = { google: `https://www.google.com/search?q=${encodeURIComponent(query)}`, wikipedia: `https://es.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`, perplexity: `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}` };
  window.open(urls[engine], '_blank', 'noopener');
};
$('#ai-question').onkeydown = (e) => { if (e.key === 'Enter' && !composing(e)) $('#ask-ai').click(); };

document.addEventListener('keydown', (e) => {
  if (landingOn || modalOpen() || $('#confirm-modal').open || e.ctrlKey || e.metaKey || e.altKey) return; // Etapa 6: con la portada visible, los atajos no actúan
  const t = e.target;
  if (t.closest?.('input, textarea, select, [contenteditable="true"]')) return;
  if (e.key.toLowerCase() === 'z' && undoRun) { e.preventDefault(); if (!e.repeat) undoRun(); return; } // JS-008: mantener la tecla pulsada no repite la acción
  if (e.key.toLowerCase() === 'p') { e.preventDefault(); if (!e.repeat) startPomodoro(); return; } // JS-008: con P mantenida el temporizador se iniciaba y pausaba sin parar
  if (currentPage !== 'practice' || (!activeCard && !exam)) return;
  const shown = exam ? exam.revealed : revealed;
  if (e.key === ' ' && !shown) { if (t.closest?.('button, a, summary')) return; e.preventDefault(); revealCard(); return; }
  const map = { 1: 'again', 2: 'hard', 3: 'easy' };
  if ((exam ? exam.revealed : (revealed && !answered)) && map[e.key]) { e.preventDefault(); rateCard(map[e.key]); }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* sin PWA si se abre como archivo */ });
  let hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) toast('Learny se actualizó. Recarga la página para usar la última versión.'); hadController = true; });
}

const syncOnline = () => { const el = $('#offline-note'); if (el) el.hidden = navigator.onLine; };
window.addEventListener('online', syncOnline); window.addEventListener('offline', syncOnline); syncOnline();
/* Si la app sigue abierta al pasar la medianoche, «hoy» se recalcula (cola, tarjetas vencidas, plan). */
let lastDay = today();
const checkNewDay = () => { if (today() !== lastDay) { lastDay = today(); safe(redistributeIfBehind, 'plan'); renderAll(); } };
setInterval(checkNewDay, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkNewDay(); });

window.Learny = { ptxt, applyProfileTexts, stripBullet, noProto, isDemo: DEMO, reveal, pullFromStorage, validDeadlineDate, MAX_PLAN_DAYS, isExam: () => !!exam, endExam: (aborted = false) => { if (!exam) return; if (aborted !== true && exam.i) state.exams.push({ date: today(), score: exam.score, total: exam.i }); /* salir a medias no cuenta como examen; el tiempo agotado sí */ exam = null; clearUndo(); save(); renderAll(); document.dispatchEvent(new CustomEvent('learny:examend', { detail: { aborted: aborted === true } })); }, state, save, toast, modal, closeModal, today, addDays, uid, clean, esc, fmt, plural, daysUntil, dueCards, startExam, cardForm, normalizeCard, suggestCards: suggestCardsFromText, reviewCards, askGemini, gemini, rebuildTasks, addDeadline, renderAll, hasAi, cancelAi, showPage, subjectStats, overdueCards, weakSubject, startSubjectQuiz, calcStreak, announce, debounce, currentPage: () => currentPage, timerStarted: () => timer.started, timerRunning: () => timer.running };
