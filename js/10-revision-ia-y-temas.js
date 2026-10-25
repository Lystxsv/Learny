/* Learny · parte 10 de 15 · Revisión de tarjetas de IA y temas
   Bandeja de revisión, Feynman, temas y ruleta.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

/* =========================================================
   Bandeja de revisión: ninguna tarjeta generada se guarda sin que la aceptes
   ========================================================= */
const normText = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
// Palabras de la respuesta (≥5 letras) que no aparecen en los apuntes (se compara por raíz de 5 letras).
function unsupportedShare(answer, source) {
  const src = normText(source), words = [...new Set(normText(answer).split(/[^\p{L}\p{N}]+/u).filter((x) => x.length >= 5))];
  if (!src || words.length < 4) return 0;
  return words.filter((w) => !src.includes(w.slice(0, 5))).length / words.length;
}
function reviewCards(items, { topic = '', source = '', origin = 'ia', intro = '' } = {}) {
  const srcNorm = normText(source);
  const warnText = (answer) => (source && unsupportedShare(answer, source) > 0.4 ? `${icon('warning')} Parte de la respuesta no aparece en tus apuntes: puede haberla añadido la IA. Revísala o corrígela.` : '');
  const srcLine = (it) => {
    if (it.fragment && source) return srcNorm.includes(normText(it.fragment))
      ? `Del apunte: “${esc(it.fragment)}”` : `${icon('warning')} El fragmento que cita la IA no aparece en tus apuntes: “${esc(it.fragment)}”`;
    return source ? 'Sin fragmento de respaldo en tus apuntes.' : 'Sin fuente: la IA la generó solo a partir del tema. Verifica la respuesta antes de aceptarla.';
  };
  modal(`<h2>Revisa las tarjetas</h2>
      <p>${esc(intro || 'Ninguna se guarda hasta que la aceptes. Puedes corregir el texto antes.')}</p>
      <label>Materia<input name="subject" required maxlength="60" value="${esc(topic)}"></label>
      ${items.map((it, i) => `<fieldset class="review-card">
        <div class="review-head"><span class="tag">Tarjeta ${i + 1}</span>
          <span class="seg-group"><label class="seg"><input type="radio" name="s${i}" value="accept"><span>Aceptar</span></label><label class="seg"><input type="radio" name="s${i}" value="discard"><span>Descartar</span></label></span></div>
        <label>Pregunta<textarea name="q${i}" maxlength="500" rows="2">${esc(it.question)}</textarea></label>
        <label>Respuesta<textarea name="a${i}" maxlength="1200" rows="3">${esc(it.answer)}</textarea></label>
        <p class="review-src">${srcLine(it)}</p><p class="review-warn" data-warn="${i}">${warnText(it.answer)}</p></fieldset>`).join('')}
      <button id="review-save" class="primary-button" disabled>Guardar aceptadas (0)</button>`, (data) => {
    const subject = clean(data.get('subject'), 60) || topic || 'Sin materia';
    let n = 0;
    items.forEach((_, i) => {
      if (data.get(`s${i}`) !== 'accept') return;
      const question = cleanMl(data.get(`q${i}`), 500), answer = cleanMl(data.get(`a${i}`), 1200);
      if (question && answer) { state.cards.push(normalizeCard({ subject, question, answer, nextReview: today(), origin })); n++; }
    });
    if (!n) return toast('Acepta al menos una tarjeta con pregunta y respuesta.', 'error');
    save(); closeModal(); renderAll(); toast(`${plural(n, 'tarjeta guardada', 'tarjetas guardadas')}. Aparecerán en tu repaso de hoy.`);
  }, () => { const b = $('#modal-body'); b.onchange = null; b.oninput = null; });
  const body = $('#modal-body'), btn = $('#review-save');
  body.onchange = () => {
    body.querySelectorAll('.review-card').forEach((f) => f.classList.toggle('discarded', !!f.querySelector('input[value="discard"]:checked')));
    const n = items.filter((_, i) => body.querySelector(`input[name="s${i}"]:checked`)?.value === 'accept').length;
    btn.disabled = !n; btn.textContent = `Guardar aceptadas (${n})`;
  };
  body.oninput = (e) => { // al editar la respuesta se vuelve a comprobar contra los apuntes
    const m = /^a(\d+)$/.exec(e.target.name || ''); if (!m) return;
    const w = body.querySelector(`[data-warn="${m[1]}"]`); if (w) w.innerHTML = warnText(e.target.value);
  };
}

function suggestCardsFromText(topic, text, opts = {}) {
  const parts = text.replace(/\*\*/g, '').split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 20).slice(0, 5);
  if (!parts.length) return toast('No encontré ideas suficientes para convertir en tarjetas.', 'error');
  const items = parts.map((p) => ({ ...cloze(p, topic), fragment: p.slice(0, 200) }));
  reviewCards(items, { topic: topic || 'Feynman', source: text.replace(/\*\*/g, ''), origin: opts.origin || '', intro: `Detecté ${parts.length} ideas en el texto sobre ${topic || 'el tema'}. Corrige y acepta las que te sirvan.` });
}

let lastFey = null;
const FEY_BTN = '<p><button class="outline-button" type="button" data-feynman-cards>Crear tarjetas con estas ideas</button></p>';
async function feynman() {
  const topic = clean($('#feynman-topic').value, 80), text = clean($('#feynman-text').value, 4000), guide = $('#feynman-guide');
  if (!text) return toast('Escribe tu explicación.', 'error');
  const local = localGuide(topic, text);
  guide.innerHTML = parseBlocks(local);
  if (!hasAi()) {
    toast('Modo local: sin clave también recibes guía socrática.');
    lastFey = { topic, text }; guide.insertAdjacentHTML('beforeend', FEY_BTN);
    return;
  }
  guide.innerHTML += '<p><i>Consultando tutor…</i> <button class="text-button" type="button" data-cancel-ai>Cancelar</button></p>';
  try {
    const answer = await askGemini(feynmanPrompt(topic, cleanMl($('#feynman-text').value, 4000)));
    guide.innerHTML = parseBlocks(answer);
    saveChat('user', text); saveChat('tutor', answer);
    lastFey = { topic, text }; guide.insertAdjacentHTML('beforeend', FEY_BTN);
  } catch (error) {
    if (error.stale) { guide.innerHTML = parseBlocks(local); lastFey = { topic, text }; guide.insertAdjacentHTML('beforeend', FEY_BTN); return; } // JS-102: otra consulta tomó el relevo; esta zona no se queda en «Consultando…»
    guide.innerHTML = parseBlocks(local) + (error.cancelled ? '<p><i>Consulta cancelada. Tu explicación sigue aquí.</i></p>' : `<p><i>${esc(error.message)} Tu explicación se conserva.</i></p>`);
    guide.insertAdjacentHTML('beforeend', `<p><button class="outline-button" type="button" data-feynman-retry>Reintentar</button></p>`);
    toast(error.cancelled ? 'Consulta cancelada.' : error.message, error.cancelled ? 'ok' : 'error');
  }
}

/* =========================================================
   Temas / ruleta
   ========================================================= */
const worldPool = ['teoría de juegos', 'célula eucariota', 'ética de Aristóteles', 'recursión', 'teorema de Bayes', 'cambio climático', 'mercados competitivos', 'sistema inmunitario', 'poesía modernista', 'criptografía asimétrica', 'composición musical', 'derechos humanos'];
function addTopic(name, category = 'Personal') {
  const cleanName = clean(name, 80); if (!cleanName) return false;
  if (!state.topics.some((t) => t.name.toLowerCase() === cleanName.toLowerCase())) state.topics.push({ id: uid(), name: cleanName, category });
  save(); renderTopics(); return true;
}
function renderTopics() {
  const query = $('#topic-search').value.trim().toLowerCase();
  const topics = state.topics.filter((t) => !query || t.name.toLowerCase().includes(query));
  $('#topic-results').innerHTML = topics.length ? topics.map((t) => `<span class="topic-wrap"><button class="topic-chip" data-topic="${esc(t.name)}" type="button">${esc(t.name)} <small>· ${esc(t.category)}</small></button><button class="chip-x" data-delete-topic="${esc(t.id)}" type="button" aria-label="Quitar ${esc(t.name)}">${icon('close')}</button></span>`).join('') : '<p class="empty">No hay coincidencias. Añade el tema que quieras estudiar hoy.</p>';
}
async function suggestTopic() {
  const subject = clean($('#topic-search').value, 80);
  const have = new Set(state.topics.map((t) => t.name.toLowerCase()));
  const randomTopic = () => { // sin IA: un tema de la lista que aún no tengas
    const fresh = worldPool.filter((t) => !have.has(t.toLowerCase()));
    if (!fresh.length) return toast('Ya tienes todos los temas de ejemplo. Añade los tuyos con el botón “Añadir”.');
    const pick = fresh[Math.floor(Math.random() * fresh.length)]; addTopic(pick, 'Mundial'); toast(`Tema añadido: ${pick}`);
  };
  const localSubtopics = () => { // sin IA y con materia escrita: subtemas genéricos útiles para cualquier materia
    const ideas = [`Conceptos clave de ${subject}`, `Ejemplos y casos de ${subject}`, `Errores comunes en ${subject}`, `Preguntas típicas de examen de ${subject}`].filter((t) => !have.has(t.toLowerCase()));
    if (!ideas.length) return toast('Ya añadiste esas ideas. Escribe un tema más concreto con “Añadir”.');
    ideas.slice(0, 3).forEach((t) => addTopic(t, subject)); toast(`Añadí ${plural(Math.min(3, ideas.length), 'idea de tema', 'ideas de tema')} sobre «${subject}» (sin IA).`);
  };
  if (!subject) return randomTopic();
  if (!hasAi()) return localSubtopics();
  const result = await gemini(`Sugiere tres subtemas concretos y estudiables sobre: ${subject}. Una línea por subtema.`, 'Sugerencias de estudio', () => 'Añade tus propios temas con el botón “Añadir”.');
  if (!result.fromAi) return;
  result.text.split('\n').map((x) => stripBullet(x).replace(/\*\*/g, '').trim()).filter(Boolean).slice(0, 3).forEach((x) => addTopic(x, subject));
  renderTopics();
}
function spin(topic) {
  const seen = new Set(state.settings.recentTurns || []);
  const all = topic ? [topic] : state.topics.map((t) => t.name);
  if (!all.length) return toast('Añade cualquier tema para girar la ruleta.', 'error');
  const fresh = all.filter((name) => !seen.has(name)), choices = fresh.length ? fresh : all;
  const chosen = choices[Math.floor(Math.random() * choices.length)];
  state.settings.recentTurns = [chosen, ...(state.settings.recentTurns || []).filter((x) => x !== chosen)].slice(0, 8); save();
  runRoulettePhase(chosen, 'preparación', state.settings.roulettePrepare, () => runRoulettePhase(chosen, 'explicación', state.settings.rouletteExplain, () => {
    closeModal(); showPage('practice'); $('#feynman-topic').value = chosen; $('#feynman-text').focus();
    toast('Fase terminada. Ahora explica con Feynman.'); if ($('#feynman-text').value.trim()) $('#feynman-feedback').click();
  }));
}
function runRoulettePhase(topic, phase, minutes, next) {
  const explain = phase === 'explicación', total = num(minutes, 1, 180, 1) * 60, endAt = Date.now() + total * 1000;
  modal(`<h2>Ruleta: ${esc(topic)}</h2><p>Fase de <b>${phase}</b>. ${explain ? 'Explícalo en voz alta y deja una versión escrita si quieres revisión.' : 'Estudia y recupera ideas clave.'}</p>${explain ? '<textarea id="roulette-explanation" maxlength="4000" placeholder="Escribe aquí tu explicación…"></textarea>' : ''}<div id="roulette-timer" class="roulette-timer">${time(total)}</div><button id="finish-roulette" class="outline-button" type="button">Terminar fase</button>`);
  let finished = false;
  const done = () => {
    if (finished) return; finished = true; clearInterval(rouletteId); rouletteId = null; beep();
    const box = $('#roulette-explanation'); if (explain && box?.value.trim()) $('#feynman-text').value = box.value.trim();
    next();
  };
  clearInterval(rouletteId);
  rouletteId = setInterval(() => { const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000)), el = $('#roulette-timer'); if (el) el.textContent = time(left); if (left <= 0) done(); }, 500);
  $('#finish-roulette').onclick = done;
}
