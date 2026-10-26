/* Learny · parte 21 · Quiz y examen simulado (Pro · Bloque 2)
   Genera preguntas a partir de TUS tarjetas, sin IA y sin red: opción múltiple (las respuestas de otras tarjetas hacen de distractores), verdadero/falso y respuesta corta.
   · Quiz: ves si acertaste después de cada pregunta. Simulacro cronometrado: 60 s por pregunta, sin ver las respuestas hasta el final; al acabarse el tiempo se entrega solo.
   · Opción múltiple y verdadero/falso se corrigen de forma objetiva. La respuesta corta se corrige por coincidencia de palabras (≥ 60 % de las palabras clave, o al menos 2 y ninguna de más) y la persona puede cambiar el resultado.
   · Un quiz NO cambia el calendario de repaso (SM-2), ni las estadísticas, ni state: solo guarda un historial corto en su propia clave (learny.quizzes, últimos 20; en la demo, en memoria; «Borrar todo» la vacía).
     Al terminar se puede repasar lo fallado con el «Modo examen» de siempre (ese sí programa los repasos como siempre).
   · Es práctica con preguntas generadas desde tus tarjetas: no mide dominio, y así se dice en pantalla.
   Es una función Pro: la puerta es requirePro('quiz', …) de 20-pro.js. La tarjeta de Practicar se crea aquí (index.html no cambia).
   v87: `qz` se declara antes de `api` (zona muerta temporal) y begin() avisa si hay otra ventana abierta.
   Se carga con <script defer> después de 20-pro.js (comparte el ámbito global; no hay import/export). Las partes puras (build, shortMatch, grade, summarize) se exponen en window.LearnyQuiz para las pruebas. */
'use strict';

(() => {
  const QUIZ_KEY = 'learny.quizzes', KEEP = 20, SECS_PER_Q = 60, MIN_CARDS = 4, LONG_A = 200, LONG_Q = 300, PASS = 0.6;
  const TYPE_NAME = { mixed: 'Mezcla', mc: 'Opción múltiple', tf: 'Verdadero o falso', short: 'Respuesta corta' };
  let qz = null; // sesión en curso (declarada antes de `api`, que la lee)

  /* ================= Lógica pura (sin DOM) ================= */
  const norm = (s) => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  const shuffle = (a, rng = Math.random) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const usable = (c) => !!c && !c.corrupt && typeof c.question === 'string' && typeof c.answer === 'string' && c.question.trim() !== '' && c.answer.trim() !== '';

  const STOP = new Set('el la los las un una unos unas de del al y o u en a que es son se por para con sin su sus lo como the an of and or to in is are for with'.split(' '));
  const toks = (s) => norm(s).split(' ').filter((w) => w && !STOP.has(w) && (w.length > 2 || /^\d+$/.test(w)));
  const same = (a, b) => (/^\d+$/.test(a) || /^\d+$/.test(b) ? a === b : a === b || (a.length >= 5 && b.length >= 5 && a.slice(0, 5) === b.slice(0, 5))); // misma raíz de 5 letras: «células» ≈ «celular»
  /* recall: qué parte de las palabras clave esperadas escribiste; precision: qué parte de lo que escribiste está en la respuesta. Aprueba con recall ≥ 60 %, o con ≥ 2 palabras clave y nada de más. */
  function shortMatch(given, expected) {
    const e = [...new Set(toks(expected))], g = [...new Set(toks(given))];
    if (!g.length) return { recall: 0, precision: 0, hits: 0, pass: false };
    if (!e.length) { const eq = norm(given) === norm(expected); return { recall: eq ? 1 : 0, precision: eq ? 1 : 0, hits: eq ? 1 : 0, pass: eq }; }
    const hits = e.filter((x) => g.some((y) => same(x, y))).length, good = g.filter((y) => e.some((x) => same(x, y))).length;
    const recall = hits / e.length, precision = good / g.length;
    return { recall, precision, hits, pass: recall >= PASS || (hits >= 2 && precision >= 0.99) };
  }

  /* Distractores: respuestas de OTRAS tarjetas, distintas entre sí y de la correcta (sin que una contenga a la otra), primero de la misma materia. Solo respuestas cortas. */
  function distractors(card, all, rng) {
    const own = norm(card.answer), seen = new Set([own]), sameSub = [], other = [];
    shuffle(all, rng).forEach((c) => {
      if (c.id === card.id || c.answer.length > LONG_A) return;
      const k = norm(c.answer); if (!k || seen.has(k) || (own && (own.includes(k) || k.includes(own)))) return;
      seen.add(k); (c.subject === card.subject ? sameSub : other).push(c);
    });
    return [...sameSub, ...other];
  }
  function makeQuestion(card, all, type, rng) {
    const base = { id: card.id, subject: card.subject, q: card.question, a: card.answer };
    const long = card.answer.length > LONG_A || card.question.length > LONG_Q;
    const ds = long ? [] : distractors(card, all, rng), can = { mc: ds.length >= 2, tf: ds.length >= 1, short: true };
    let t = type;
    if (type === 'mixed') { // respuestas largas: solo respuesta corta
      const w = [['mc', 4], ['tf', 2], ['short', 3]].filter(([k]) => can[k]), tot = w.reduce((s, [, x]) => s + x, 0);
      let r = rng() * tot; t = w[w.length - 1][0];
      for (const [k, x] of w) { if (r < x) { t = k; break; } r -= x; }
    } else if (!can[type]) return null;
    if (t === 'mc') { const options = shuffle([card.answer, ...ds.slice(0, 3).map((c) => c.answer)], rng); return { ...base, type: 'mc', options, correct: options.indexOf(card.answer) }; }
    if (t === 'tf') { const truth = rng() < 0.5; return { ...base, type: 'tf', shown: truth ? card.answer : ds[0].answer, truth }; }
    return { ...base, type: 'short' };
  }
  /* Arma hasta n preguntas, una por tarjeta. Con menos de MIN_CARDS tarjetas utilizables no hay quiz. */
  function build(pool, { n = 10, type = 'mixed', rng = Math.random } = {}) {
    const all = pool.filter(usable); if (all.length < MIN_CARDS) return [];
    const out = [];
    for (const c of shuffle(all, rng)) { if (out.length >= n) break; const q = makeQuestion(c, all, type, rng); if (q) out.push(q); }
    return out;
  }
  function grade(q, given) {
    if (given == null) return { ok: false };
    if (q.type === 'mc') return { ok: given === q.correct };
    if (q.type === 'tf') return { ok: given === q.truth };
    const m = shortMatch(given, q.a); return { ok: m.pass, score: Math.round(m.recall * 100) };
  }
  function summarize(qs, answers) {
    const by = { mc: [0, 0], tf: [0, 0], short: [0, 0] }, failed = []; let ok = 0;
    qs.forEach((q, i) => { const a = answers[i]; by[q.type][1]++; if (a && a.ok) { ok++; by[q.type][0]++; } else failed.push(q.id); }); // sin responder cuenta como fallada
    return { n: qs.length, ok, pct: qs.length ? Math.round((ok * 100) / qs.length) : 0, by, failed };
  }

  /* ================= Historial (clave propia; no entra en state, copias ni SCHEMA) ================= */
  const readHist = () => { const p = parseJSON(store.get(QUIZ_KEY)); return Array.isArray(p) ? p.filter((h) => h && typeof h === 'object' && isDay(h.date) && Number.isFinite(h.n) && h.n >= 1 && Number.isFinite(h.ok)).slice(-KEEP) : []; };
  const writeHist = (l) => store.set(QUIZ_KEY, JSON.stringify(l.slice(-KEEP)));

  const api = Object.freeze({ norm, shortMatch, build, grade, summarize, makeQuestion, session: () => qz });
  window.LearnyQuiz = api;
  if (typeof document === 'undefined' || !document.head) return;

  /* ================= Interfaz ================= */
  const css = `#quiz-card select{padding:var(--s1);color:var(--text);background:var(--input);border:1px solid var(--border);border-radius:var(--r-ctl);max-width:100%}
.modal-content label.quiz-opt{display:flex;align-items:flex-start;gap:var(--s1);min-height:44px;padding:var(--s1) var(--s2);border:1px solid var(--ui-edge,var(--border));border-radius:var(--r-ctl);background:var(--surface2);color:var(--text);cursor:pointer}
.modal-content label.quiz-opt:has(input:checked){border:2px solid var(--accent);padding:calc(var(--s1) - 1px) calc(var(--s2) - 1px);font-weight:700}
.modal-content label.quiz-opt:focus-within{outline:2px solid var(--accent);outline-offset:2px}
.quiz-opt input{margin-top:.25rem;flex:none}.quiz-opt span{min-width:0;overflow-wrap:anywhere;white-space:pre-line}
.quiz-opts{display:grid;gap:var(--s1);padding:var(--s2);min-width:0}
.quiz-q{margin:0;font-weight:650;white-space:pre-line;overflow-wrap:anywhere}legend.quiz-q{padding:0 .25rem}
.quiz-short textarea{min-height:90px;margin:0}
.quiz-review{max-height:18rem;overflow:auto;margin:0;padding-left:1.4rem;display:grid;gap:var(--s2);overflow-wrap:anywhere}
.quiz-review .closure-list{margin-top:var(--s1)}
body.session-practice #quiz-card{display:none}`;
  const st = document.createElement('style'); st.id = 'quiz-css'; st.textContent = css; document.head.append(st);

  const T = (s) => `<span translate="no">${esc(s)}</span>`; // texto de tus tarjetas: el traductor de la interfaz no lo toca
  const cfg = { subject: '', n: 10, type: 'mixed' };

  /* ---- Tarjeta en Practicar ---- */
  const card = (() => {
    const at = $('#more-tools'); if (!at) return null;
    const el = document.createElement('article'); el.className = 'card'; el.id = 'quiz-card'; at.insertAdjacentElement('beforebegin', el); return el;
  })();
  let lastHtml = '';
  function renderQuizCard() {
    if (!card || currentPage !== 'practice') return;
    const live = state.cards.filter(usable), subs = [...new Set(live.map((c) => c.subject))].sort((a, b) => a.localeCompare(b));
    if (cfg.subject && !subs.includes(cfg.subject)) cfg.subject = '';
    const n = live.filter((c) => !cfg.subject || c.subject === cfg.subject).length, ok = n >= MIN_CARDS, off = ok ? '' : ' disabled';
    const hist = readHist().slice(-3).reverse(), sel = (v, cur) => (String(v) === String(cur) ? ' selected' : '');
    const html = `<div class="card-head"><div><h2>Quiz y examen simulado <span class="tag">Pro</span></h2><p class="lead">Ponte a prueba con preguntas hechas desde tus tarjetas: opción múltiple, verdadero/falso y respuesta corta.</p></div><span class="tag">${plural(n, 'tarjeta', 'tarjetas')}</span></div>
      <div class="form-row"><label class="field">Materia<select id="quiz-subject"><option value="">Todas las materias</option>${subs.map((s) => `<option value="${esc(s)}" translate="no"${sel(s, cfg.subject)}>${esc(s)}</option>`).join('')}</select></label>
      <label class="field">Preguntas<select id="quiz-n">${[5, 10, 20].map((v) => `<option value="${v}"${sel(v, cfg.n)}>${v}</option>`).join('')}</select></label></div>
      <label class="field">Tipo de pregunta<select id="quiz-type">${Object.entries(TYPE_NAME).map(([k, t]) => `<option value="${k}"${sel(k, cfg.type)}>${t}</option>`).join('')}</select></label>
      <div class="actions"><button class="primary-button" type="button" data-quiz-go="practice"${off}>Empezar quiz</button><button class="outline-button" type="button" data-quiz-go="exam"${off}>Simulacro cronometrado</button></div>
      ${ok ? '' : '<p class="hint">Necesitas al menos 4 tarjetas para armar un quiz.</p>'}
      <p class="hint">Las preguntas salen de tus tarjetas. La respuesta corta se corrige por coincidencia de palabras y puedes cambiar el resultado. Un quiz no cambia tu calendario de repaso.</p>
      ${hist.length ? `<h3 class="alts-head">Últimos resultados</h3><ul class="closure-list">${hist.map((h) => `<li><span class="tag">${h.mode === 'exam' ? 'Simulacro' : 'Quiz'}</span> <span>${h.subject ? T(h.subject) : 'Todas las materias'}</span> <span translate="no">${esc(h.date)}</span> <b>${h.ok} de ${h.n} aciertos (${Math.round((h.ok * 100) / h.n)} %)</b></li>`).join('')}</ul>` : ''}
      <p class="hint">${isPro() ? 'Plan Pro activo en este navegador. <button class="text-button" type="button" data-quiz-x="off">Volver al plan gratis</button>' : 'Función Pro. <button class="text-button" type="button" data-quiz-x="plans">Ver qué incluye Pro</button>'}</p>`;
    if (html === lastHtml) return;
    const ae = document.activeElement, fsel = ae && card.contains(ae) ? (ae.id ? `#${ae.id}` : ae.dataset.quizGo ? `[data-quiz-go="${ae.dataset.quizGo}"]` : '') : '';
    card.innerHTML = html; lastHtml = html;
    if (fsel) card.querySelector(fsel)?.focus({ preventScroll: true });
  }
  if (card) {
    card.onchange = (e) => {
      if (e.target.id === 'quiz-subject') cfg.subject = e.target.value;
      else if (e.target.id === 'quiz-n') cfg.n = [5, 10, 20].includes(Number(e.target.value)) ? Number(e.target.value) : 10;
      else if (e.target.id === 'quiz-type') cfg.type = TYPE_NAME[e.target.value] ? e.target.value : 'mixed';
      else return;
      renderQuizCard();
    };
    card.onclick = (e) => {
      const go = e.target.closest('[data-quiz-go]')?.dataset.quizGo, x = e.target.closest('[data-quiz-x]')?.dataset.quizX;
      if (go) return requirePro('quiz', () => begin(go));
      if (x === 'plans') return proModal();
      if (x === 'off') { setPro(false); toast('Plan gratis. Tus datos no cambian.'); }
    };
  }
  ['learny:render', 'learny:page', 'learny:pro'].forEach((ev) => document.addEventListener(ev, () => { try { renderQuizCard(); } catch (e) { console.error('Learny · quiz', e); } }));
  document.addEventListener('learny:reset', () => store.del(QUIZ_KEY)); // «Borrar todo»

  /* ---- Sesión ---- */
  function begin(mode, again) {
    if (typeof exam !== 'undefined' && exam) return toast('Termina o sal del examen de tarjetas antes de empezar un quiz.', 'error');
    if (qz && !again) return;
    if (!again && modalOpen()) return toast('Cierra la ventana abierta antes de empezar un quiz.', 'error');
    const qs = build(state.cards.filter((c) => !cfg.subject || c.subject === cfg.subject), { n: cfg.n, type: cfg.type });
    if (qs.length < 3) return toast('No hay suficientes tarjetas para este tipo de pregunta. Prueba con «Mezcla» o crea más tarjetas.', 'error');
    clearInterval(qz?.tid);
    qz = { qs, i: 0, answers: [], mode, phase: 'ask', t0: Date.now(), secs: 0, endAt: mode === 'exam' ? Date.now() + qs.length * SECS_PER_Q * 1000 : 0, tid: 0, saved: false, finished: false, cfg: { ...cfg }, warned: {}, reviewOpen: false };
    $('#modal-body').onclick = onBodyClick;
    if (qz.endAt) qz.tid = setInterval(tick, 500);
    paint();
  }
  const left = () => Math.max(0, Math.ceil((qz.endAt - Date.now()) / 1000));
  function tick() {
    if (!qz || qz.finished || !qz.endAt) return;
    const s = left(), el = $('#quiz-clock'), v = time(s);
    if (el && el.__v !== v) { el.__v = v; el.textContent = v; }
    const total = qz.qs.length * SECS_PER_Q;
    if (total > 90 && s <= 60 && s > 0 && !qz.warned.m) { qz.warned.m = true; announce('Queda 1 minuto.'); }
    if (total > 30 && s <= 10 && s > 0 && !qz.warned.s) { qz.warned.s = true; announce('Quedan 10 segundos.'); }
    if (s <= 0) { toast('Se acabó el tiempo. Se entregó el simulacro.'); finish(); }
  }
  function closeQuiz() { if (qz) clearInterval(qz.tid); qz = null; const b = $('#modal-body'); if (b) b.onclick = null; }

  const eyebrow = () => `<p class="eyebrow">${qz.mode === 'exam' ? 'Simulacro' : 'Quiz'}${qz.cfg.subject ? ` · ${T(qz.cfg.subject)}` : ''}</p>`;
  const title = () => `<h2>Pregunta ${qz.i + 1} de ${qz.qs.length}</h2>`;

  function askHtml(q) {
    const timed = qz.mode === 'exam', last = qz.i === qz.qs.length - 1;
    let body;
    if (q.type === 'mc') body = `<fieldset class="choice-list quiz-opts"><legend class="quiz-q">${T(q.q)}</legend>${q.options.map((o, i) => `<label class="quiz-opt"><input type="radio" name="a" value="${i}"${i === 0 ? ' required' : ''}><span>${T(o)}</span></label>`).join('')}</fieldset>`;
    else if (q.type === 'tf') body = `<fieldset class="choice-list quiz-opts" aria-describedby="quiz-stmt"><legend class="quiz-q">Verdadero o falso: ¿esta respuesta es la correcta para la pregunta?</legend>
      <div class="guided-feedback" id="quiz-stmt"><small>Pregunta</small><br>${T(q.q)}<br><small>Respuesta propuesta</small><br>${T(q.shown)}</div>
      <label class="quiz-opt"><input type="radio" name="a" value="true" required><span>Verdadero</span></label><label class="quiz-opt"><input type="radio" name="a" value="false"><span>Falso</span></label></fieldset>`;
    else body = `<div class="quiz-short"><p class="quiz-q" id="quiz-q">${T(q.q)}</p><label>Escribe tu respuesta<textarea name="a" maxlength="800" rows="3" aria-describedby="quiz-q"></textarea></label></div>`;
    return `${eyebrow()}<div class="card-head">${title()}${timed ? `<span class="tag" id="quiz-clock" role="timer" aria-live="off" aria-label="Tiempo restante">${time(left())}</span>` : ''}</div>${body}
      ${timed ? '<p class="hint">Simulacro: verás las respuestas al final.</p>' : ''}
      <div class="actions"><button class="primary-button" type="submit">${timed ? (last ? 'Entregar' : 'Siguiente') : 'Responder'}</button><button class="outline-button" type="button" data-quiz="skip">No lo sé</button><button class="text-button" type="button" data-quiz="stop">${timed ? 'Entregar ya' : 'Terminar ahora'}</button></div>`;
  }
  /* Lo que respondiste, la respuesta correcta y (en respuesta corta) la coincidencia con el botón para corregir el resultado. Sirve para la pantalla de comentario y para la revisión final. */
  function lines(q, a0, i) {
    const a = a0 || { given: null, ok: false }, none = a.given == null || a.given === '';
    let r = '';
    if (q.type === 'mc') r += `<li><b>Tu respuesta:</b> ${none ? 'Sin respuesta' : T(q.options[a.given])}</li><li><b>Respuesta correcta:</b> ${T(q.a)}</li>`;
    else if (q.type === 'tf') r += `<li><b>Respuesta propuesta:</b> ${T(q.shown)}</li><li><b>Tu respuesta:</b> ${none ? 'Sin respuesta' : a.given ? 'Verdadero' : 'Falso'}</li><li>${q.truth ? 'Era verdadero.' : 'Era falso.'}</li>${q.truth ? '' : `<li><b>Respuesta correcta:</b> ${T(q.a)}</li>`}`;
    else {
      r += `<li><b>Tu respuesta:</b> ${none ? 'Sin respuesta' : T(a.given)}</li><li><b>Respuesta correcta:</b> ${T(q.a)}</li>`;
      if (!none) r += `<li>Coincidencia de palabras: ${a.score == null ? Math.round(shortMatch(a.given, q.a).recall * 100) : a.score} %</li>`;
      r += `<li>${a.manual ? '<span class="tag">Corregida por ti</span> ' : ''}<button type="button" class="outline-button" data-quiz="ov" data-i="${i}">${a.ok ? 'Contarla como incorrecta' : 'Contarla como correcta'}</button></li>`;
    }
    return r;
  }
  function feedbackHtml(q) {
    const a = qz.answers[qz.i], last = qz.i === qz.qs.length - 1;
    return `${eyebrow()}<div class="card-head">${title()}</div><p class="quiz-q">${T(q.q)}</p>
      <p class="modal-tip"><b>${icon(a.ok ? 'check' : 'close')} ${a.ok ? 'Correcto.' : 'Incorrecto.'}</b></p><ul class="closure-list">${lines(q, a, qz.i)}</ul>
      <div class="actions"><button class="primary-button" type="submit">${last ? 'Ver resultado' : 'Siguiente'}</button><button class="text-button" type="button" data-quiz="stop">Terminar ahora</button></div>`;
  }
  function resultsHtml(s) {
    const timed = qz.mode === 'exam', names = { mc: 'Opción múltiple', tf: 'Verdadero o falso', short: 'Respuesta corta' };
    const failedLive = state.cards.filter((c) => s.failed.includes(c.id) && !c.archived && !c.corrupt).length;
    const review = qz.qs.map((q, i) => { const a = qz.answers[i], ok = !!(a && a.ok);
      return `<li><span class="tag">${icon(ok ? 'check' : 'close')} ${ok ? 'Correcta' : 'Incorrecta'}</span> <span class="quiz-q">${T(q.q)}</span><ul class="closure-list">${lines(q, a, i)}</ul></li>`; }).join('');
    return `<h2>${timed ? 'Resultado del simulacro' : 'Resultado del quiz'}</h2>
      <p class="next-title">${s.ok} de ${s.n} aciertos (${s.pct} %)</p>
      <ul class="closure-list">${Object.keys(names).filter((k) => s.by[k][1]).map((k) => `<li><span>${names[k]}</span> <b>${s.by[k][0]}/${s.by[k][1]}</b></li>`).join('')}<li><b>Tiempo:</b> ${time(qz.secs)}</li></ul>
      <p class="modal-tip">Es práctica, no una medida de dominio: son preguntas generadas desde tus tarjetas. No cambió tu calendario de repaso.</p>
      <details id="quiz-review"${qz.reviewOpen ? ' open' : ''}><summary>Revisar respuestas (${s.n})</summary><ol class="quiz-review">${review}</ol></details>
      <div class="actions">${failedLive ? `<button class="primary-button" type="button" data-quiz="review">Repasar las falladas (${failedLive})</button>` : ''}<button class="outline-button" type="button" data-quiz="again">Repetir quiz</button><button class="outline-button" type="button" data-close-modal>Cerrar</button></div>`;
  }

  function paint(focusSel) {
    if (!qz) return;
    if (qz.finished) { const s = summarize(qz.qs, qz.answers); persist(s); modal(resultsHtml(s), () => {}, closeQuiz); if (focusSel) $(focusSel)?.focus({ preventScroll: true }); else $('#modal-title')?.focus({ preventScroll: true }); return; }
    const q = qz.qs[qz.i];
    modal(qz.phase === 'feedback' ? feedbackHtml(q) : askHtml(q), onSubmit, closeQuiz);
    if (focusSel) $(focusSel)?.focus({ preventScroll: true });
  }
  function onSubmit(d) {
    if (!qz || qz.finished) return;
    if (qz.phase === 'feedback') return next();
    const q = qz.qs[qz.i], v = d.get('a');
    answer(q.type === 'mc' ? (v == null ? null : Number(v)) : q.type === 'tf' ? (v == null ? null : v === 'true') : (String(v || '').trim().slice(0, 800) || null));
  }
  function answer(given) {
    const q = qz.qs[qz.i], g = grade(q, given);
    qz.answers[qz.i] = { given, ok: g.ok, score: g.score, manual: false };
    if (qz.mode === 'exam') return next(); // simulacro: sin comentario hasta el final
    qz.phase = 'feedback'; paint();
    announce(g.ok ? 'Correcto.' : `Incorrecto. Respuesta correcta: ${q.a.slice(0, 200)}`);
  }
  function next() { qz.i++; qz.phase = 'ask'; if (qz.i >= qz.qs.length) return finish(); paint(); }
  function finish() {
    if (!qz || qz.finished) return;
    clearInterval(qz.tid); qz.tid = 0; qz.finished = true; qz.secs = Math.round((Date.now() - qz.t0) / 1000);
    paint();
  }
  function stop() {
    if (qz.mode === 'practice') { qz.qs = qz.qs.slice(0, qz.answers.length); if (!qz.qs.length) { closeModal(); return; } } // quiz: solo cuentan las preguntas ya respondidas; simulacro: las que faltan cuentan como falladas
    finish();
  }
  function override(i) {
    const a = (qz.answers[i] ||= { given: null, ok: false, manual: false });
    a.ok = !a.ok; a.manual = true;
    if (qz.finished) qz.reviewOpen = !!$('#quiz-review')?.open;
    paint(`[data-quiz="ov"][data-i="${i}"]`);
  }
  function persist(s) {
    if (!s.n) return;
    const e = { date: today(), mode: qz.mode, subject: String(qz.cfg.subject || '').slice(0, 60), n: s.n, ok: s.ok, secs: qz.secs }, l = readHist();
    if (qz.saved && l.length) l[l.length - 1] = e; else l.push(e);
    qz.saved = true; writeHist(l); try { renderQuizCard(); } catch { /* sin tarjeta */ }
  }
  function onBodyClick(e) {
    const b = e.target.closest('[data-quiz]'); if (!b || !qz) return;
    const k = b.dataset.quiz;
    if (k === 'skip') answer(null);
    else if (k === 'stop') stop();
    else if (k === 'ov') override(Number(b.dataset.i));
    else if (k === 'again') begin(qz.mode, true);
    else if (k === 'review') {
      const ids = new Set(summarize(qz.qs, qz.answers).failed), list = state.cards.filter((c) => ids.has(c.id) && !c.archived && !c.corrupt).slice(0, 20);
      if (!list.length) return;
      closeModal(); showPage('practice'); startExam(list, list.length); // el modo examen de siempre: ese sí programa los repasos
    }
  }
})();
