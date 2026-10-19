/* Learny · parte 7 de 15 · Tarjetas
   Repaso espaciado (SM-2), simulacro, formulario de tarjeta y biblioteca.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

/* =========================================================
   SM-2
   ========================================================= */
let activeCard = null, revealed = false, answered = false, lastRateAt = 0;

function schedule(card, rating) {
  const q = qualityOf(rating);
  card.lastReviewed = today();
  card.history = [...(card.history || []), { date: today(), rating, quality: q }].slice(-40);
  if (card.nextReview > today() && q >= 3) return; // repaso anticipado: no adelanta el calendario ni infla el intervalo
  if (q < 3) {
    card.repetitions = 0; card.interval = 1; // SM-2: con calidad < 3 el factor de facilidad no cambia
  } else {
    const hardLate = q === 3 && card.repetitions >= 2; // «Dudé» en una tarjeta ya consolidada: crece poco y no suma repeticiones
    if (card.repetitions === 0) card.interval = 1;
    else if (card.repetitions === 1) card.interval = 6;
    else card.interval = Math.round(Math.max(1, card.interval) * (hardLate ? 1.2 : card.easeFactor));
    if (!hardLate) card.repetitions += 1;
    card.easeFactor = Math.max(1.3, +(card.easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))).toFixed(2));
  }
  card.interval = Math.min(MAX_INTERVAL, Math.max(1, card.interval)); // tope real: nunca más de MAX_INTERVAL días
  card.nextReview = addDays(today(), card.interval);
}

const cardCtl = () => { const ae = document.activeElement; return !!ae && (ae.id === 'reveal-card' || ae.id === 'exam-exit' || $('#rating-row').contains(ae)); };
function settleCardFocus(had) { // si el botón que tenía el foco se oculta, el foco pasa al siguiente control útil
  if (!had) return;
  const ae = document.activeElement;
  if (ae && ae !== document.body && shown(ae)) return;
  (!$('#rating-row').hidden ? $('#rating-row button') : !$('#reveal-card').hidden ? $('#reveal-card') : $('#flashcard')).focus({ preventScroll: true });
}
function renderCard() { const had = cardCtl(); try { renderCardBody(); } finally { settleCardFocus(had); } }
function renderExam() { const had = cardCtl(); try { renderExamBody(); } finally { settleCardFocus(had); } }
function renderCardBody() {
  applySessionMode();
  if (exam) return renderExam();
  const due = dueCards(), prev = activeCard, wasRevealed = revealed && !answered;
  activeCard = due[0] || null;
  if ((prev?.id ?? null) !== (activeCard?.id ?? null)) document.dispatchEvent(new Event('learny:cardchange')); // otra tarjeta: se limpia lo que escribiste para la anterior
  revealed = false; answered = false;
  $('#rating-row').hidden = true;
  $('#reveal-card').hidden = !activeCard;
  $('#card-tools').hidden = !activeCard;
  $('#card-count').textContent = `${due.length} para hoy`;
  $('#exam-exit').hidden = true;
  if (!activeCard) {
    const has = state.cards.some((c) => !c.archived);
    $('#flashcard').innerHTML = has
      ? '<div><b>No tienes repasos hoy.</b><br><span>Puedes adelantar 5 tarjetas o crear nuevas.</span><div class="actions center"><button class="outline-button" data-empty="advance" type="button">Adelantar 5 tarjetas</button><button class="outline-button" data-empty="create" type="button">Crear tarjeta</button></div></div>'
      : '<div><b>Aún no tienes tarjetas.</b><br><span>Crea una desde tus apuntes, pide 5 al tutor o añade un mazo de ejemplo.</span><div class="actions center"><button class="outline-button" data-empty="create" type="button">Crear tarjeta</button><button class="outline-button" data-empty="ai" type="button">Pedir 5 al tutor</button><button class="outline-button" data-empty="deck" type="button">Mazo de ejemplo</button></div></div>';
    return;
  }
  if (activeCard.corrupt) {
    $('#flashcard').innerHTML = '<div><b>Esta tarjeta no se pudo cargar.</b><br><span>Le falta la pregunta o la respuesta. Edítala para repararla, pospónla o elimínala.</span></div>';
    $('#reveal-card').hidden = true; return;
  }
  if (wasRevealed && prev && prev.id === activeCard.id) { revealCard(); return; } // un redibujado (p. ej. fin de Pomodoro) no oculta la respuesta
  $('#flashcard').innerHTML = `<div><small>${esc(activeCard.subject)}</small><br>${esc(activeCard.question)}</div>`;
}

function revealCard() {
  if (exam) { exam.revealed = true; renderExam(); document.dispatchEvent(new Event('learny:reveal')); return; }
  if (!activeCard || revealed || activeCard.corrupt) return;
  const had = cardCtl();
  revealed = true;
  $('#flashcard').innerHTML = `<div><small>Pregunta</small><br>${esc(activeCard.question)}<hr><small>Respuesta</small><br>${esc(activeCard.answer)}</div>`;
  $('#reveal-card').hidden = true; $('#rating-row').hidden = false;
  settleCardFocus(had);
  document.dispatchEvent(new Event('learny:reveal'));
}

function rateCard(rating) {
  if (exam) return examRate(rating);
  if (!activeCard || !revealed || answered) return;
  const now = Date.now(); if (now - lastRateAt < 350) return; lastRateAt = now; // doble clic o tecla repetida
  answered = true; flashFeedback(rating);
  const card = activeCard, before = cardSnap(card);
  schedule(card, rating);
  const rv = { date: today(), cardId: card.id, subject: card.subject || 'Sin materia', rating, quality: qualityOf(rating) };
  state.reviews.push(rv);
  document.dispatchEvent(new Event('learny:rated'));
  save(); renderAll();
  offerUndo(`Volverá en ${plural(card.interval, 'día', 'días')}.`, () => { Object.assign(card, before); dropReview(rv); save(); renderAll(); });
}

function flashFeedback(rating) {
  const el = $('#flashcard'); el.classList.remove('fb-good', 'fb-soft'); void el.offsetWidth;
  el.classList.add(rating === 'easy' ? 'fb-good' : 'fb-soft');
}

function snoozeCard() {
  if (!activeCard) return;
  const card = activeCard, prev = card.nextReview;
  card.nextReview = addDays(today(), 1);
  save(); renderAll(); offerUndo('Pospuesta 1 día.', () => { card.nextReview = prev; save(); renderAll(); });
}

function startExam(custom, size = 20) {
  const pool = (Array.isArray(custom) ? custom : dueCards()).filter((c) => !c.corrupt);
  if (pool.length < 1) return toast('No hay tarjetas vencidas o de hoy para el examen.', 'error');
  exam = { cards: pool.slice(0, size), i: 0, score: 0, revealed: false, answers: [] };
  document.dispatchEvent(new Event('learny:examstart'));
  toast(`Modo examen: ${exam.cards.length} tarjetas.`);
  renderExam();
}

function renderExamBody() {
  applySessionMode();
  const item = exam.cards[exam.i];
  $('#card-count').textContent = `Examen ${exam.i + 1}/${exam.cards.length}`;
  $('#card-tools').hidden = true; $('#exam-exit').hidden = false;
  if (!exam.revealed) {
    $('#flashcard').innerHTML = `<div><small>Modo examen · ${esc(item.subject)}</small><br>${esc(item.question)}</div>`;
    $('#reveal-card').hidden = false; $('#rating-row').hidden = true;
  } else {
    $('#flashcard').innerHTML = `<div><small>Respuesta</small><br>${esc(item.answer)}</div>`;
    $('#reveal-card').hidden = true; $('#rating-row').hidden = false;
  }
}

function examRate(rating) {
  if (!exam.revealed) return; // no se puede calificar sin ver la respuesta (evita dobles pulsaciones)
  const now = Date.now(); if (now - lastRateAt < 350) return; lastRateAt = now;
  document.dispatchEvent(new Event('learny:rated'));
  const ex = exam, item = exam.cards[exam.i], prev = { i: exam.i, score: exam.score }, before = cardSnap(item);
  const ok = rating === 'easy';
  if (ok) exam.score++;
  exam.answers.push({ id: item.id, rating }); flashFeedback(rating);
  schedule(item, rating);
  const rv = { date: today(), cardId: item.id, subject: item.subject, rating, quality: qualityOf(rating), exam: true };
  state.reviews.push(rv);
  exam.i++; exam.revealed = false;
  if (exam.i >= exam.cards.length) {
    const pct = Math.round((exam.score * 100) / exam.cards.length);
    state.exams.push({ date: today(), score: exam.score, total: exam.cards.length });
    exam = null; save();
    document.dispatchEvent(new Event('learny:examend'));
    $('#rating-row').hidden = true;
    { const r = state.exams[state.exams.length - 1]; toast(`Examen: ${pct}% (${r.score}/${r.total}).`); }
    renderAll();
    { const r = state.exams[state.exams.length - 1]; showClosure('exam', { score: r.score, total: r.total }); }
    return;
  }
  save(); renderExam();
  offerUndo('Calificación guardada.', () => {
    if (exam !== ex) return;
    ex.i = prev.i; ex.score = prev.score; ex.answers.pop(); ex.revealed = true;
    Object.assign(item, before); dropReview(rv); save(); renderExam();
  });
}

function cardForm(card = null, preset = null) {
  const q0 = preset?.question || card?.question || '';
  const a0 = preset?.answer || card?.answer || '';
  modal(`<h2>${card ? 'Editar' : 'Nueva'} flashcard</h2>
      <label>Plantilla<select id="card-template"><option value="">Ninguna</option>
        <option value="definicion">Definición</option>
        <option value="ejemplo">Concepto → ejemplo</option>
        <option value="problema">Problema → solución</option></select></label>
      <label>Materia<input name="subject" required maxlength="60" value="${esc(card?.subject || $('#tutor-subject').value || '')}"></label>
      <label>Pregunta<textarea name="question" required maxlength="500">${esc(q0)}</textarea></label>
      <label>Respuesta<textarea id="card-answer" name="answer" required maxlength="1200">${esc(a0)}</textarea></label>
      <button id="generate-answer" class="outline-button" type="button">✨ Generar respuesta con IA</button>
      <button class="primary-button">${card ? 'Guardar cambios' : 'Crear tarjeta'}</button>`, (data) => {
    const values = { subject: clean(data.get('subject'), 60), question: cleanMl(data.get('question'), 500), answer: cleanMl(data.get('answer'), 1200) };
    if (!values.subject) return toast('La materia no puede quedar en blanco.', 'error');
    if (!values.question || !values.answer) return toast('Pregunta y respuesta no pueden estar vacías.', 'error');
    if (card) { // se busca por id al guardar: el estado pudo reemplazarse (otra pestaña) mientras el formulario estaba abierto
      const target = state.cards.find((c) => c.id === card.id);
      if (!target) { closeModal(); return toast('Esa tarjeta ya no existe (otra pestaña la cambió). No se guardaron los cambios.', 'error'); }
      Object.assign(target, values, { corrupt: false });
    } else state.cards.push(normalizeCard({ ...values, nextReview: today() }));
    save(); closeModal(); renderAll(); toast(card ? 'Tarjeta actualizada.' : 'Tarjeta creada.');
  });
  $('#card-template').onchange = (e) => {
    const t = TEMPLATES[e.target.value]; if (!t) return;
    $('[name="question"]').value = t.question; $('#card-answer').value = t.answer;
  };
  $('#generate-answer').onclick = async () => {
    const question = clean($('[name="question"]').value, 500), button = $('#generate-answer');
    if (!question) return toast('Escribe primero una pregunta.', 'error');
    if (!hasAi()) return toast('Añade tu clave de Gemini en Ajustes ⚙️ o usa una plantilla.', 'error');
    button.disabled = true; button.textContent = 'Generando…';
    try {
      const text = await askGemini(`Responde en español, máximo 3 frases, útil para flashcard. Pregunta: ${question}`);
      const out = $('#card-answer'); if (out) out.value = text;
    } catch (error) { toast(error.message, 'error'); }
    finally { if ($('#generate-answer')) { button.disabled = false; button.textContent = '✨ Generar respuesta con IA'; } }
  };
}

let libLimit = 40;
function renderLibrary() {
  const q = clean($('#library-search')?.value || '', 60).toLowerCase();
  const all = state.cards.filter((c) => c.archived);
  const cards = q ? all.filter((c) => `${c.question} ${c.answer} ${c.subject}`.toLowerCase().includes(q)) : all;
  $('#library-count').textContent = q ? `${cards.length} de ${plural(all.length, 'tarjeta', 'tarjetas')}` : plural(all.length, 'tarjeta', 'tarjetas');
  const shown = cards.slice(0, libLimit);
  const html = shown.map((c) => {
    try {
      if (c.corrupt) return `<article class="library-card"><b>Esta tarjeta no se pudo cargar.</b><p>Le falta la pregunta o la respuesta.</p><span>${esc(c.subject)}</span><div class="row-actions"><button class="text-button" data-edit-card="${esc(c.id)}" type="button">Editar</button><button class="text-button danger" data-delete-card="${esc(c.id)}" type="button">Eliminar</button></div></article>`;
      return `<article class="library-card"><b>${esc(c.question)}</b><p>${esc(c.answer)}</p><span>${esc(c.subject)}${c.origin === 'ia' ? ' · generada con IA y revisada' : ''}</span><div class="row-actions"><button class="text-button" data-return-card="${esc(c.id)}" type="button">Devolver a rotación</button><button class="text-button" data-edit-card="${esc(c.id)}" type="button">Editar</button><button class="text-button danger" data-delete-card="${esc(c.id)}" type="button">Eliminar</button></div></article>`;
    } catch { return '<article class="library-card"><p>Esta tarjeta no se pudo cargar.</p></article>'; }
  }).join('');
  $('#library-list').innerHTML = shown.length
    ? html + (cards.length > shown.length ? `<button class="outline-button" id="library-more" type="button">Mostrar más (${cards.length - shown.length})</button>` : '')
    : `<p class="empty">${q ? 'Ninguna tarjeta coincide con tu búsqueda.' : 'Aún no hay archivo. Envía aquí las tarjetas que ya dominas.'}</p>`;
}

function deleteCard(card) {
  const idx = card ? state.cards.indexOf(card) : -1; if (idx < 0) return;
  if (exam && exam.cards.includes(card)) return toast('Termina o abandona el examen antes de eliminar esta tarjeta.', 'error');
  snapshot('delete-card');
  state.cards.splice(idx, 1); save(); renderAll();
  offerUndo('Tarjeta eliminada.', () => { state.cards.splice(Math.min(idx, state.cards.length), 0, card); save(); renderAll(); });
}
