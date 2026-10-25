/* Learny · parte 7 de 15 · Tarjetas
   Repaso espaciado (SM-2), simulacro, formulario de tarjeta y biblioteca.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

/* =========================================================
   SM-2
   ========================================================= */
let activeCard = null, revealed = false, answered = false, lastRateAt = 0;

/* Fase 5 (v67): el siguiente estado SM-2 de una tarjeta, calculado SIN modificarla. schedule() lo aplica y los botones de calificar lo muestran,
   así que lo que se ve («Dudé · 3 d») es exactamente lo que ocurre. Misma fórmula que antes; solo se separó el cálculo de la escritura. */
function nextSchedule(card, rating) {
  const q = qualityOf(rating);
  if (card.nextReview > today() && q >= 3) return { early: true, interval: card.interval, nextReview: card.nextReview, repetitions: card.repetitions, easeFactor: card.easeFactor }; // repaso anticipado: no adelanta el calendario ni infla el intervalo
  let { interval, repetitions, easeFactor } = card;
  if (q < 3) {
    repetitions = 0; interval = 1; // SM-2: con calidad < 3 el factor de facilidad no cambia
  } else {
    const hardLate = q === 3 && repetitions >= 2; // «Dudé» en una tarjeta ya consolidada: crece poco y no suma repeticiones
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(Math.max(1, interval) * (hardLate ? 1.2 : easeFactor));
    if (!hardLate) repetitions += 1;
    easeFactor = Math.max(1.3, +(easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))).toFixed(2));
  }
  interval = Math.min(MAX_INTERVAL, Math.max(1, interval)); // tope real: nunca más de MAX_INTERVAL días
  return { early: false, interval, nextReview: addDays(today(), interval), repetitions, easeFactor };
}
function schedule(card, rating) {
  const q = qualityOf(rating), n = nextSchedule(card, rating);
  card.lastReviewed = today();
  card.history = [...(card.history || []), { date: today(), rating, quality: q }].slice(-40);
  if (n.early) return;
  card.interval = n.interval; card.nextReview = n.nextReview; card.repetitions = n.repetitions; card.easeFactor = n.easeFactor;
}

/* Fase 5 (v67): cada botón de calificar muestra en cuántos días volverá la tarjeta (solo lectura: no cambia datos ni algoritmo).
   Se dibuja al mostrar los botones (revelar, examen) y solo se reescribe si el valor cambió. El texto accesible se lee aparte («, dentro de 3 días»); el visible va oculto para lectores de pantalla. */
function rateHints() {
  const row = $('#rating-row'), c = exam ? exam.cards[exam.i] : activeCard;
  if (!row || row.hidden || !c || c.corrupt) return;
  row.querySelectorAll('button[data-rating]').forEach((b) => {
    const n = nextSchedule(c, b.dataset.rating), key = n.early ? 'e' : String(n.interval);
    if (b.dataset.hint === key) return;
    let vis = b.querySelector(':scope > .rate-int'), sr = b.querySelector(':scope > .rate-sr');
    if (!vis) { vis = document.createElement('small'); vis.className = 'rate-int'; vis.setAttribute('aria-hidden', 'true'); sr = document.createElement('span'); sr.className = 'sr-only rate-sr'; b.append(vis, sr); }
    vis.textContent = n.early ? 'sin cambio' : `${n.interval} d`;
    sr.textContent = n.early ? ', la tarjeta mantiene su fecha' : n.interval === 1 ? ', mañana' : `, dentro de ${n.interval} días`;
    b.dataset.hint = key;
  });
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
    const has = state.cards.some((c) => !c.archived), held = heldNewCards().length;
    $('#flashcard').innerHTML = held
      ? `<div><b>Terminaste tus repasos de hoy.</b><br><span>Hay tarjetas nuevas que esperan a mañana por tu límite diario de tarjetas nuevas. Puedes cambiarlo en Ajustes.</span><div class="actions center"><button class="outline-button" data-empty="more-new" type="button">Aprender algunas nuevas ahora</button><button class="outline-button" data-empty="create" type="button">Crear tarjeta</button></div></div>`
      : has
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
  $('#reveal-card').hidden = true; $('#rating-row').hidden = false; rateHints();
  settleCardFocus(had);
  document.dispatchEvent(new Event('learny:reveal'));
}

function rateCard(rating) {
  if (exam) return examRate(rating);
  if (!activeCard || !revealed || answered) return;
  const now = Date.now(); if (now - lastRateAt < 350) return; lastRateAt = now; // doble clic o tecla repetida
  answered = true; flashFeedback(rating);
  const card = activeCard, before = cardSnap(card);
  const early = before.nextReview > today() && qualityOf(rating) >= 3; // misma condición que en schedule(): repaso anticipado, la fecha no cambia
  schedule(card, rating);
  const rv = { date: today(), cardId: card.id, subject: card.subject || 'Sin materia', rating, quality: qualityOf(rating) };
  state.reviews.push(rv);
  document.dispatchEvent(new Event('learny:rated'));
  save(); renderAll();
  offerUndo(early ? 'Repaso anticipado guardado: la tarjeta mantiene su fecha.' : `Volverá en ${plural(card.interval, 'día', 'días')}.`, () => { Object.assign(card, before); dropReview(rv); save(); renderAll(); });
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

function startExam(custom, size = 20) { // devuelve true si el examen empezó
  if (exam) { toast('Ya tienes un examen en curso. Termínalo o sal de él antes de empezar otro.', 'error'); return false; }
  const pool = (Array.isArray(custom) ? custom : dueCards()).filter((c) => !c.corrupt);
  if (pool.length < 1) { toast('No hay tarjetas vencidas o de hoy para el examen.', 'error'); return false; }
  exam = { cards: pool.slice(0, size), i: 0, score: 0, revealed: false, answers: [] };
  document.dispatchEvent(new Event('learny:examstart'));
  toast(`Modo examen: ${exam.cards.length} tarjetas.`);
  renderExam();
  return true;
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
    $('#reveal-card').hidden = true; $('#rating-row').hidden = false; rateHints();
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
    exam = null; save(); clearUndo(); // el «Deshacer» de la tarjeta anterior ya no tiene sentido
    document.dispatchEvent(new CustomEvent('learny:examend', { detail: { aborted: false } })); // mismo formato que endExam()
    $('#rating-row').hidden = true;
    { const r = state.exams[state.exams.length - 1]; toast(`Examen: ${pct}% (${r.score}/${r.total}).`); }
    renderAll();
    { const r = state.exams[state.exams.length - 1]; showClosure('exam', { score: r.score, total: r.total }); }
    return;
  }
  save(); renderExam();
  offerUndo('Calificación guardada.', () => {
    if (exam !== ex) return false; // el examen ya terminó o se reemplazó: no hay nada que deshacer
    ex.i = prev.i; ex.score = prev.score; ex.answers.pop(); ex.revealed = true;
    Object.assign(item, before); dropReview(rv); save(); renderExam();
  });
}

function cardForm(card = null, preset = null) {
  const q0 = preset?.question || card?.question || '';
  const a0 = preset?.answer || card?.answer || '';
  const batch = card ? 0 : Number(preset?.batch) || 0; // Fase 7: tarjetas ya añadidas en esta tanda («Guardar y añadir otra»)
  let again = false; // Fase 7: la pulsación de «Guardar y añadir otra» lo activa; la de «Crear tarjeta» y la tecla Intro lo apagan
  modal(`<h2>${card ? 'Editar' : 'Nueva'} flashcard</h2>
      <label>Plantilla<select id="card-template"><option value="">Ninguna</option>
        <option value="definicion">Definición</option>
        <option value="ejemplo">Concepto → ejemplo</option>
        <option value="problema">Problema → solución</option></select></label>
      <label>Materia<input name="subject" required maxlength="60" value="${esc(card?.subject || preset?.subject || $('#tutor-subject').value || '')}"></label>
      <label>Pregunta<textarea name="question" required maxlength="500">${esc(q0)}</textarea></label>
      <label>Respuesta<textarea id="card-answer" name="answer" required maxlength="1200">${esc(a0)}</textarea></label>
      <button id="generate-answer" class="outline-button" type="button">${icon('auto_awesome')} Generar respuesta con IA</button>
      ${card ? '' : `<label class="check"><input name="reverse" type="checkbox"${preset?.reverse ? ' checked' : ''}> Crear también la tarjeta inversa (respuesta → pregunta)</label>`}
      ${batch ? `<p class="modal-tip">Añadidas en esta tanda: ${batch}</p>` : ''}
      <button id="save-card" class="primary-button">${card ? 'Guardar cambios' : 'Crear tarjeta'}</button>
      ${card ? '' : '<button id="save-add-another" class="outline-button">Guardar y añadir otra</button><p class="hint">Ctrl+Intro (⌘+Intro en Mac) guarda y añade otra.</p>'}`, (data) => {
    const values = { subject: clean(data.get('subject'), 60), question: cleanMl(data.get('question'), 500), answer: cleanMl(data.get('answer'), 1200) };
    let reverseNote = '', reversed = false;
    if (!values.subject) return toast('La materia no puede quedar en blanco.', 'error');
    if (!values.question || !values.answer) return toast('Pregunta y respuesta no pueden estar vacías.', 'error');
    if (card) { // se busca por id al guardar: el estado pudo reemplazarse (otra pestaña) mientras el formulario estaba abierto
      const target = state.cards.find((c) => c.id === card.id);
      if (!target) { closeModal(); return toast('Esa tarjeta ya no existe (otra pestaña la cambió). No se guardaron los cambios.', 'error'); }
      const wasLeech = isLeech(target);
      Object.assign(target, values, { corrupt: false });
      if (wasLeech) target.leechSince = today(); // v71: reescribirla cuenta como atenderla; solo los fallos nuevos vuelven a marcarla
    } else {
      state.cards.push(normalizeCard({ ...values, nextReview: today() }));
      if (data.get('reverse') === 'on') { // Fase 7: la inversa es una tarjeta más (mismo modelo de datos); llega mañana para que no salga justo detrás de su pareja
        if (values.answer.length > 500) reverseNote = ' La inversa no se creó: la respuesta es demasiado larga para ser una pregunta (máx. 500 caracteres).';
        else { state.cards.push(normalizeCard({ subject: values.subject, question: values.answer, answer: values.question, nextReview: addDays(today(), 1) })); reversed = true; }
      }
    }
    save();
    const done = card ? 'Tarjeta actualizada.' : reversed ? 'Tarjeta e inversa creadas.' : 'Tarjeta creada.';
    if (!card && again) { // sigue en la misma ventana: misma materia, campos vacíos y el foco en la pregunta
      renderAll(); toast(`${done}${reverseNote} Escribe la siguiente.`);
      cardForm(null, { subject: values.subject, reverse: data.get('reverse') === 'on', batch: batch + 1 });
      return;
    }
    closeModal(); renderAll(); toast(`${done}${reverseNote}`);
  });
  $('#save-card').onclick = () => { again = false; };
  if (!card) {
    $('#save-add-another').onclick = () => { again = true; };
    $('#modal-body').onkeydown = (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !composing(e)) { e.preventDefault(); $('#save-add-another')?.click(); } };
    modalTeardown = () => { $('#modal-body').onkeydown = null; };
    if (batch) $('[name="question"]')?.focus({ preventScroll: true });
  }
  $('#card-template').onchange = (e) => {
    const t = TEMPLATES[e.target.value]; if (!t) return;
    $('[name="question"]').value = t.question; $('#card-answer').value = t.answer;
  };
  $('#generate-answer').onclick = async () => {
    const question = clean($('[name="question"]').value, 500), button = $('#generate-answer');
    if (!question) return toast('Escribe primero una pregunta.', 'error');
    if (!hasAi()) return toast('Añade tu clave de Gemini en Ajustes o usa una plantilla.', 'error');
    button.disabled = true; button.textContent = 'Generando…';
    try {
      const text = await askGemini(`Responde en español, máximo 3 frases, útil para flashcard. Pregunta: ${question}`);
      const out = $('#card-answer'); if (out) out.value = text;
    } catch (error) { toast(error.message, 'error'); }
    finally { if ($('#generate-answer')) { button.disabled = false; button.innerHTML = `${icon('auto_awesome')} Generar respuesta con IA`; } }
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

/* =========================================================
   Fase 8 (v71) · Tarjetas que se te resisten
   Una tarjeta se marca cuando acumula LEECH_AT fallos («No lo sabía») desde que se atendió por última vez (leechSince; vacío = nunca). Solo lee el historial: no cambia SM-2 ni reprograma nada.
   ========================================================= */
const LEECH_AT = 4;
const leechCount = (c) => (c.history || []).filter((h) => h.rating === 'again' && (!c.leechSince || h.date > c.leechSince)).length;
const isLeech = (c) => !c.archived && !c.corrupt && leechCount(c) >= LEECH_AT;
const leechCards = () => cached('leech', () => state.cards.filter(isLeech).sort((a, b) => leechCount(b) - leechCount(a)));
function leechHelp(id) {
  const c = state.cards.find((x) => x.id === id); if (!c) return toast('Esa tarjeta ya no existe.', 'error');
  modal(`<h2>Una tarjeta que se te resiste</h2>
      <p>Marcaste «No lo sabía» ${plural(leechCount(c), 'vez', 'veces')} en esta tarjeta. Repetirla igual rara vez ayuda: casi siempre funciona mejor cambiarla.</p>
      <div class="guided-feedback"><b>${esc(c.question)}</b><br>${esc(c.answer)}<br><small>${esc(c.subject)}</small></div>
      <p class="modal-tip"><b>Reescribir:</b> usa tus palabras y una pista más clara. <b>Dividir:</b> si junta varias ideas, deja una por tarjeta (la original sigue ahí para que la recortes). Reescribirla la da por atendida.</p>
      <div class="actions"><button class="primary-button" type="button" data-leech="rewrite">Reescribir</button><button class="outline-button" type="button" data-leech="split">Dividir en otra tarjeta</button><button class="outline-button" type="button" data-leech="ignore">Dejarla como está</button></div>`);
  $('#modal-body').onclick = (e) => {
    const k = e.target.closest('[data-leech]')?.dataset.leech; if (!k) return;
    $('#modal-body').onclick = null; const card = state.cards.find((x) => x.id === id); if (!card) return closeModal();
    if (k === 'rewrite') { cardForm(card); return; }
    if (k === 'split') { cardForm(null, { subject: card.subject, question: '', answer: card.answer }); return; }
    const before = card.leechSince; card.leechSince = today(); save(); closeModal(); renderAll();
    offerUndo('Listo: no te la volveré a marcar hasta que falles otras 4 veces.', () => { card.leechSince = before; save(); renderAll(); });
  };
}
