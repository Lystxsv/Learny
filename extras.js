(() => {
  'use strict';
  const L = window.Learny; if (!L) return;
  /* Etapa 7: en demo, los borradores viven en memoria (nunca en learny.drafts). */
  const localStorage = (() => {
    if (L.isDemo) { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); } }; }
    try { return window.localStorage; } catch { return null; }
  })();
  const { state, save, toast, modal, closeModal, today, addDays, uid, clean, esc, fmt, plural } = L;
  const $ = (s) => document.querySelector(s);
  const raw = (v, n = 2000) => String(v || '').trim().slice(0, n);
  const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const last = (a) => a[a.length - 1];
  const live = () => state.cards.filter((c) => !c.archived && !c.corrupt);
  const interleave = (cards) => {
    const g = new Map(); cards.forEach((c) => { if (!g.has(c.subject)) g.set(c.subject, []); g.get(c.subject).push(c); }); // Map: materias como «constructor» no chocan con el prototipo
    const q = [...g.values()].map(shuffle), out = [];
    while (q.some((x) => x.length)) q.forEach((x) => x.length && out.push(x.shift()));
    return out;
  };
  const subj = () => clean($('#tutor-subject').value || $('#ai-question').value, 80) || 'el tema';

  /* ---- Modos de repaso ---- */
  $('#interleave-mode').onclick = () => {
    const p = interleave(L.dueCards());
    p.length ? L.startExam(p, 20) : toast('No hay tarjetas para hoy. Crea más o vuelve mañana.', 'error');
  };
  $('#quick-five').onclick = () => {
    const d = shuffle(L.dueCards()), p = d.length ? d : shuffle(live());
    p.length ? L.startExam(interleave(p.slice(0, 5)), 5) : toast('Crea tarjetas para usar el repaso de 5 minutos.', 'error');
  };
  $('#real-exam').onclick = () => {
    const weak = live().filter((c) => c.history.some((h) => h.rating === 'again')), set = new Map();
    [...L.dueCards(), ...shuffle(weak), ...shuffle(live())].forEach((c) => set.set(c.id, c));
    const p = interleave([...set.values()].slice(0, 20));
    p.length ? timedExam(p) : toast('Crea tarjetas para hacer un examen.', 'error');
  };
  let rt = null, timedStarting = false;
  document.addEventListener('learny:examstart', () => { if (timedStarting) return; clearInterval(rt); const c = $('#exam-clock'); if (c) c.hidden = true; });
  function timedExam(p) {
    timedStarting = true; L.startExam(p, 20); timedStarting = false;
    const end = Date.now() + Math.min(20, p.length) * 90000;
    const el = $('#exam-clock') || $('#card-count').insertAdjacentElement('afterend', Object.assign(document.createElement('span'), { id: 'exam-clock', className: 'tag', hidden: true }));
    clearInterval(rt);
    rt = setInterval(() => {
      if (!L.isExam()) { clearInterval(rt); el.hidden = true; return; }
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      el.hidden = false; el.textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
      if (!left) { clearInterval(rt); el.hidden = true; toast('Se acabó el tiempo. Examen terminado.', 'error'); L.endExam(); }
    }, 500);
  }
  document.addEventListener('learny:reveal', () => {
    const v = raw($('#recall-answer').value, 800);
    if (v) $('#flashcard').insertAdjacentHTML('beforeend', `<p class="recall-compare"><small>Tu respuesta</small><br>${esc(v)}</p>`);
  });
  document.addEventListener('learny:rated', () => { $('#recall-answer').value = ''; });
  document.addEventListener('learny:cardchange', () => { $('#recall-answer').value = ''; });

  /* ---- Dictado ---- */
  const dictate = (btn, target) => {
    const label = btn.textContent; let active = null;
    btn.onclick = () => {
      if (active) { active.stop(); return; }
      const R = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!R) return toast('Tu navegador no admite dictado. Prueba con Chrome o Edge.', 'error');
      const r = new R(); r.lang = /^es/i.test(navigator.language || '') ? navigator.language : 'es-ES'; btn.textContent = '🎤 Escuchando… (pulsa para parar)';
      r.onresult = (e) => { target().value = `${target().value} ${e.results[0][0].transcript}`.trim(); target().dispatchEvent(new Event('input')); };
      r.onend = () => { active = null; btn.textContent = label; };
      r.onerror = () => toast('No se pudo dictar. Revisa el permiso del micrófono.', 'error');
      try { r.start(); active = r; } catch { btn.textContent = label; }
    };
  };
  dictate($('#tutor-voice'), () => $('#ai-question'));
  dictate($('#feynman-voice'), () => $('#feynman-text'));

  /* ---- Tutor: ejercicios y modo error ---- */
  $('#tutor-exercises').onclick = () => L.gemini(
    `Crea 5 ejercicios de ${subj()} (nivel: ${$('#tutor-level').value || 'no indicado'}) con dificultad creciente. Solo enunciados; da las soluciones paso a paso si el estudiante las pide.`,
    '5 ejercicios',
    () => `**Explicación**\n1. Define ${subj()} con tus palabras.\n2. Resuelve un caso sencillo.\n3. Cambia un dato y predice el resultado.\n4. Busca un caso límite.\n5. Inventa un problema nuevo y resuélvelo.`);
  $('#tutor-error').onclick = () => modal(`<h2>Modo error</h2><p>Pega tu respuesta o procedimiento y te señalo dónde falla el razonamiento.</p>
    <label>Tu procedimiento<textarea name="work" required maxlength="2000"></textarea></label><button class="primary-button">Revisar</button>`, (d) => {
    const w = raw(d.get('work')); closeModal();
    L.gemini(`Actúa como tutor. Señala en qué paso falla este razonamiento sobre ${subj()} y por qué, sin dar la solución completa:\n${w}`, 'Modo error',
      () => '**Pista**\nRevisa línea por línea: ¿qué supuesto usas en cada paso y lo has comprobado?');
  });

  /* ---- Notas y lectura ---- */
  const renderNotes = () => {
    $('#notes-list').innerHTML = state.notes.length ? state.notes.slice(-8).reverse().map((n) =>
      `<div class="session-item"><span>${esc(n.date)}</span><br>${esc(n.text.slice(0, 160))}<br><button class="text-button" data-note-card="${esc(n.id)}" type="button">Hacer tarjeta</button> <button class="text-button danger" data-note-del="${esc(n.id)}" type="button">Quitar</button></div>`).join('')
      : '<p class="empty">Aún no hay notas. Anota una idea durante la clase y conviértela en tarjeta.</p>';
  };
  const toCard = (t) => L.cardForm(null, { question: '', answer: t.slice(0, 1200) });
  $('#save-note').onclick = () => {
    const t = raw($('#quick-note').value); if (!t) return toast('Escribe una nota primero.', 'error');
    state.notes.push({ id: uid(), date: today(), text: t }); $('#quick-note').value = ''; $('#quick-note').dispatchEvent(new Event('input')); save(); renderNotes(); toast('Nota guardada.');
  };
  $('#note-to-card').onclick = () => { const t = raw($('#quick-note').value); t ? toCard(t) : toast('Escribe una nota primero.', 'error'); };
  $('#capture-clip').onclick = async () => {
    try { $('#quick-note').value = raw(await navigator.clipboard.readText()); $('#quick-note').dispatchEvent(new Event('input')); }
    catch { toast('No se pudo leer el portapapeles. Pega con Ctrl+V.', 'error'); }
  };
  $('#notes-list').onclick = (e) => {
    const c = e.target.dataset.noteCard, d = e.target.dataset.noteDel;
    if (c) { const n = state.notes.find((x) => x.id === c); if (n) toCard(n.text); }
    if (d) { state.notes = state.notes.filter((x) => x.id !== d); save(); renderNotes(); }
  };
  $('#source-analyze').onclick = async () => {
    const t = raw($('#source-text').value, 8000); if (t.length < 40) return toast('Pega un texto más largo (mínimo un párrafo).', 'error');
    const sents = (t.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) || []).map((s) => s.trim()).filter((s) => s.length > 30);
    const top = sents.slice().sort((a, b) => b.length - a.length).slice(0, 3).sort((a, b) => sents.indexOf(a) - sents.indexOf(b));
    const out = $('#source-out');
    out.innerHTML = `<b>Resumen</b><br>${top.map(esc).join(' ')}<br><br><b>Preguntas para ti</b><br>${sents.slice(0, 3).map((s, i) => `${i + 1}. ¿Qué significa, con tus palabras: “${esc(s.slice(0, 70))}…”?`).join('<br>')}`;
    const localHtml = out.innerHTML;
    if (L.hasAi()) {
      out.innerHTML = '<div class="skeleton" aria-hidden="true"></div><p class="lead">Consultando tutor… <button class="text-button" type="button" data-cancel-ai>Cancelar</button></p>';
      try { out.innerHTML = fmt(await L.askGemini(`Resume en español en 4 frases y propón 5 preguntas de estudio:\n${t.slice(0, 3000)}`)); } catch (e) { if (e.stale) return; out.innerHTML = localHtml; toast(e.message, e.cancelled ? 'ok' : 'error'); }
    }
    out.insertAdjacentHTML('beforeend', '<p><button class="outline-button" type="button" id="source-cards">Crear tarjetas con estas ideas</button></p>');
    $('#source-cards').onclick = () => L.suggestCards(clean($('#tutor-subject').value, 60) || 'Lectura', top.join('. '));
  };
  $('#feynman-feedback').addEventListener('click', () => {
    if ($('#feynman-text').value.trim() && !state.feynman.includes(today())) { state.feynman.push(today()); save(); }
  });

  /* ---- Biblioteca de temas ---- */
  const DECKS = {
    'Cálculo básico': [['¿Qué es una derivada?', 'La tasa de cambio instantánea de una función.'], ['Derivada de x^n', 'n·x^(n−1)'], ['¿Qué es un límite?', 'El valor al que se acerca f(x) cuando x se acerca a un punto.'], ['Regla de la cadena', '(f∘g)′ = f′(g(x))·g′(x)']],
    'Método científico': [['¿Qué es una hipótesis?', 'Una explicación provisional que se puede poner a prueba.'], ['¿Para qué sirve un grupo de control?', 'Para comparar y aislar el efecto de una sola variable.'], ['Diferencia entre correlación y causalidad', 'Que dos cosas varíen juntas no prueba que una cause la otra.']],
    'Programación': [['¿Qué es una función?', 'Un bloque reutilizable que recibe datos y devuelve un resultado.'], ['¿Qué es la recursión?', 'Una función que se llama a sí misma con un caso más pequeño hasta un caso base.'], ['¿Qué es un algoritmo?', 'Una secuencia finita de pasos para resolver un problema.']]
  };
  const allDecks = () => ({ ...DECKS, ...Object.fromEntries(state.decks.map((d) => [d.name, d.cards])) });
  function renderDecks() {
    $('#topic-library').innerHTML = Object.entries(allDecks()).map(([n, c]) => `<span class="topic-wrap"><button class="topic-chip" data-deck="${esc(n)}" type="button">${esc(n)} <small>· ${plural(c.length, 'tarjeta', 'tarjetas')}</small></button>${state.decks.some((d) => d.name === n) ? `<button class="chip-x" data-del-deck="${esc(n)}" type="button" aria-label="Quitar mazo ${esc(n)}">×</button>` : ''}</span>`).join('')
      + '<button class="outline-button" data-new-deck type="button">+ Crear mazo</button>';
  }
  function newDeck() {
    modal(`<h2>Crear mazo</h2><p>Escribe una tarjeta por línea con el formato <b>pregunta | respuesta</b>.</p>
      <label>Nombre del mazo<input name="name" required maxlength="60"></label>
      <label>Tarjetas<textarea name="rows" required maxlength="6000" placeholder="¿Capital de Francia? | París"></textarea></label>
      <button class="primary-button">Guardar mazo</button>`, (d) => {
      const name = clean(d.get('name'), 60);
      const cards = String(d.get('rows')).split('\n').map((l) => l.split('|').map((x) => x.trim())).filter((r) => r[0] && r[1]).map((r) => [r[0].slice(0, 500), r[1].slice(0, 1200)]);
      if (!name) return toast('El mazo necesita un nombre (no puede quedar en blanco).', 'error');
      if (!cards.length) return toast('Usa el formato pregunta | respuesta en cada línea.', 'error');
      if (Object.prototype.hasOwnProperty.call(allDecks(), name)) return toast('Ya existe un mazo con ese nombre.', 'error');
      state.decks.push({ name, cards }); save(); closeModal(); renderDecks(); toast(`Mazo «${name}» creado con ${plural(cards.length, 'tarjeta', 'tarjetas')}.`);
    });
  }
  $('#topic-library').onclick = (e) => {
    const del = e.target.closest('[data-del-deck]')?.dataset.delDeck;
    if (del) { state.decks = state.decks.filter((d) => d.name !== del); save(); renderDecks(); return toast(`Mazo «${del}» quitado. Tus tarjetas no se borran.`); }
    if (e.target.closest('[data-new-deck]')) return newDeck();
    const n = e.target.closest('[data-deck]')?.dataset.deck; if (!n) return;
    let added = 0;
    allDecks()[n].forEach(([question, answer]) => { if (!state.cards.some((c) => c.question === question)) { state.cards.push(L.normalizeCard({ subject: n, question, answer, nextReview: today() })); added++; } });
    save(); L.renderAll(); toast(added ? `Mazo «${n}» añadido (${plural(added, 'tarjeta', 'tarjetas')}).` : 'Ese mazo ya está en tu colección.');
  };

  /* ---- Planificador ---- */
  const DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  function renderPlanner() {
    let h = '';
    for (let i = 0; i < 7; i++) {
      const d = addDays(today(), i), dt = new Date(`${d}T12:00:00`);
      const tasks = state.tasks.filter((t) => t.date === d), dl = state.deadlines.filter((x) => x.date === d);
      const due = i === 0 ? L.dueCards().length : live().filter((c) => c.nextReview === d).length;
      h += `<div class="day${i === 0 ? ' today' : ''}"><b>${DAYS[dt.getDay()]} ${dt.getDate()}</b>${dl.map((x) => `<span class="tag urgent">${esc(x.title)}</span>`).join('')}${tasks.map((t) => `<small class="${t.done ? 'done' : ''}">${t.done ? '✔ ' : ''}${esc(PH[t.phase] || t.phase)}</small>`).join('')}<small>${plural(due, 'tarjeta', 'tarjetas')}</small></div>`;
    }
    $('#week-calendar').innerHTML = h;
    const t = state.tasks.find((x) => x.date === today() && !x.done), dl = t && state.deadlines.find((x) => x.id === t.deadlineId);
    const errs = live().filter((c) => last(c.history)?.rating === 'again').length;
    $('#auto-block').textContent = dl ? `Hoy: ${dl.dailyMinutes} min de ${dl.subject} + ${plural(L.dueCards().length, 'tarjeta', 'tarjetas')} + repaso de ${plural(errs, 'error', 'errores')}.` : 'Añade una fecha para que Learny arme tu bloque de estudio de hoy.';
  }
  const PH = { comprension: 'Comprensión', practica: 'Práctica', repaso: 'Repaso', simulacro: 'Simulacro', revision: 'Revisión final' };
  const EXTRA = { comprension: 'crear tarjetas del tema', practica: 'práctica intercalada de 10 tarjetas', repaso: 'repaso de errores', simulacro: 'examen real cronometrado', revision: 'repaso de errores y tarjetas débiles' };
  $('#smart-plan').onclick = () => modal(`<h2>Estudio inteligente</h2>
    <p>Dime el examen y Learny reparte Pomodoros, tarjetas, práctica intercalada, simulacro y repaso de errores hasta la fecha.</p>
    <label>Examen<input name="title" required maxlength="80" placeholder="Parcial de cálculo"></label>
    <label>Materia<input name="subject" required maxlength="60" list="subject-list"></label>
    <div class="form-row"><label>Fecha<input name="date" type="date" min="${today()}" max="${addDays(today(), L.MAX_PLAN_DAYS)}" required></label>
    <label>Minutos diarios<input name="mins" type="number" min="15" max="240" value="60" required></label></div>
    <label>Dificultad (1-5)<input name="difficulty" type="number" min="1" max="5" value="3"></label>
    <button class="primary-button">Crear plan</button>`, (d) => {
    const item = { id: uid(), title: clean(d.get('title'), 80), subject: clean(d.get('subject'), 60), date: d.get('date'),
      difficulty: Math.min(5, Math.max(1, Number(d.get('difficulty')) || 3)), dailyMinutes: Math.min(240, Math.max(15, Number(d.get('mins')) || 60)) };
    if (!L.validDeadlineDate(item.date)) return toast('Elige una fecha entre hoy y los próximos 2 años.', 'error');
    state.deadlines.push(item); L.rebuildTasks(item, false);
    const pom = Math.max(1, Math.round(item.dailyMinutes / state.settings.focus)), mine = state.tasks.filter((t) => t.deadlineId === item.id);
    mine.forEach((t) => { t.title += ` → ${plural(pom, 'Pomodoro', 'Pomodoros')} + ${EXTRA[t.phase]}.`; });
    const rows = Object.keys(PH).map((k) => { const ds = mine.filter((t) => t.phase === k).map((t) => t.date).sort(); return ds.length ? `<p><b>${PH[k]}:</b> ${ds[0] === last(ds) ? ds[0] : `${ds[0]} a ${last(ds)}`} · ${EXTRA[k]}</p>` : ''; }).join('');
    save(); closeModal(); L.renderAll();
    modal(`<h2>Tu plan para ${esc(item.title)}</h2><p>${plural(mine.length, 'día', 'días')} de estudio, ${plural(pom, 'Pomodoro', 'Pomodoros')} al día.</p>${rows}<p class="modal-tip">Las tareas de cada día aparecen en Planificar y puedes marcarlas al terminarlas.</p><button class="primary-button">Entendido</button>`);
  });
  $('#emergency-plan').onclick = () => {
    const dl = state.deadlines.filter((d) => L.daysUntil(d.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!dl) return toast('Añade primero una fecha de examen.', 'error');
    const left = L.daysUntil(dl.date), blocks = Math.min(8, Math.max(2, Math.ceil((dl.dailyMinutes * 2) / 25)));
    if (left === 0) return modal(`<h2>Plan de emergencia: ${esc(dl.title)}</h2><p>El examen es hoy. Haz un repaso ligero de 2 bloques de 25 min sobre los conceptos débiles, come algo, llega con tiempo y confía en lo que ya estudiaste.</p><button class="primary-button">Entendido</button>`);
    const n = Math.min(3, left); // los últimos días de estudio, siempre antes del día del examen
    const phase = (i) => (i === n - 1 ? 'simulacro cronometrado y revisión de errores' : i === 0 && n > 1 ? 'lo esencial del temario y 10 tarjetas clave' : 'problemas y práctica de lo de mayor peso');
    const rows = Array.from({ length: n }, (_, i) => { const date = L.addDays(dl.date, -(n - i)); return `<p><b>${i === 0 && date === L.today() ? 'Hoy' : date}:</b> ${blocks} bloques de 25 min (≈${((blocks * 25) / 60).toFixed(1)} h): ${phase(i)}.</p>`; }).join('');
    modal(`<h2>Plan de emergencia: ${esc(dl.title)}</h2>${rows}<p class="modal-tip">El día del examen, solo un repaso ligero. Duerme bien la noche anterior: consolidas lo estudiado.</p><button class="primary-button">Entendido</button>`);
  };
  $('#recovery-plan').onclick = () => {
    const s = clean($('#recovery-subject').value, 60), m = clean($('#recovery-miss').value, 600);
    if (!s || !m) return toast('Indica la materia y qué falló.', 'error');
    const d = { id: uid(), title: `Recuperación: ${s}`, subject: s, date: addDays(today(), 7), difficulty: 4, dailyMinutes: 40 };
    state.deadlines.push(d); L.rebuildTasks(d, false);
    state.tasks.filter((t) => t.deadlineId === d.id).forEach((t) => { t.title = `Fallos (${m.slice(0, 70)}): ${t.title}`; });
    save(); L.renderAll(); $('#recovery-miss').value = ''; toast('Plan de recuperación creado para 7 días.');
  };


  /* ---- Borradores: no pierdas lo que escribes si recargas ---- */
  /* Los borradores viven en su propia clave: guardarlos en cada pulsación ya no reescribe todos tus datos,
     no despierta a las otras pestañas y no viajan en las copias exportadas. */
  const DRAFT_KEY = 'learny.drafts';
  let drafts = {};
  try { const p = JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}', L.noProto); if (p && typeof p === 'object' && !Array.isArray(p)) drafts = p; } catch { /* sin borradores */ }
  if (state.drafts && Object.keys(state.drafts).length) { // migra los borradores antiguos que estaban dentro de los datos
    drafts = { ...state.drafts, ...drafts }; state.drafts = {};
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts)); } catch { /* ignorar */ }
    save();
  }
  document.addEventListener('learny:reset', () => { Object.keys(drafts).forEach((k) => delete drafts[k]); try { localStorage?.removeItem(DRAFT_KEY); } catch { /* ignorar */ } });
  ['#quick-note', '#feynman-text', '#feynman-topic', '#source-text', '#intention-input', '#ai-question'].forEach((sel) => {
    const el = $(sel); if (!el) return;
    if (drafts[sel] && !el.value) { el.value = drafts[sel]; L.reveal(el); } // un borrador guardado no queda escondido en un bloque plegado
    el.addEventListener('input', L.debounce(() => {
      if (el.value) drafts[sel] = el.value.slice(0, 8000); else delete drafts[sel];
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts)); } catch { /* sin espacio: el borrador queda solo en memoria */ }
    }, 700));
  });

  /* ---- Crear tarjetas con IA ---- */
  function genCards() {
    if (!L.hasAi()) { toast('Para generar con IA añade tu clave en Ajustes ⚙️. Mientras tanto, prueba un mazo de ejemplo.', 'error'); L.showPage('library'); return; }
    const prefill = raw($('#source-text').value, 3000) || raw($('#quick-note').value, 3000);
    modal(`<h2>Crear tarjetas con IA</h2>
      <label>Tema<input name="topic" required maxlength="80" value="${esc(subj() === 'el tema' ? '' : subj())}"></label>
      <label>Tus apuntes (opcional)<textarea name="notes" maxlength="3000" placeholder="Pega tus apuntes para que las tarjetas salgan de ellos y puedas comprobar la fuente.">${esc(prefill)}</textarea></label>
      <p class="lead">Con apuntes, cada tarjeta cita el fragmento del que sale y te avisamos si añade algo que no está en ellos. Sin apuntes, la IA usa solo el tema y tendrás que verificarlas.</p>
      <button class="primary-button">Generar 5 tarjetas</button>`, async (d) => {
      const topic = clean(d.get('topic'), 80), notes = raw(d.get('notes'), 3000);
      modal(`<h2>Generando tarjetas…</h2><div class="skeleton" aria-hidden="true"></div><button class="outline-button" type="button" data-cancel-ai>Cancelar</button>`);
      $('#modal-body').setAttribute('aria-live', 'polite');
      try {
        const prompt = notes
          ? `Crea 5 flashcards de estudio en español usando SOLO la información de estos apuntes sobre "${topic}". Una por línea con el formato: pregunta | respuesta | fragmento. «fragmento» es una cita literal y corta (máximo 150 caracteres) copiada de los apuntes que respalda la respuesta. No inventes datos que no estén en los apuntes. Sin numeración, sin títulos y sin texto adicional. Respuestas de máximo 2 frases.\nApuntes:\n${notes}`
          : `Genera 5 flashcards de estudio en español sobre "${topic}". Una por línea con el formato: pregunta | respuesta. Sin numeración, sin títulos y sin texto adicional. Respuestas de máximo 2 frases.`;
        const text = await L.askGemini(prompt);
        const rows = text.split('\n').map((l) => L.stripBullet(l).replace(/\*\*/g, '').split('|').map((x) => x.trim())).filter((r) => r.length >= 2 && r[0] && r[1]).slice(0, 5);
        if (!rows.length) throw new Error('La IA no devolvió tarjetas con el formato esperado. Inténtalo de nuevo.');
        const items = rows.map((r) => (notes && r.length >= 3
          ? { question: r[0], answer: r.slice(1, -1).join(' | '), fragment: r[r.length - 1].slice(0, 200) }
          : { question: r[0], answer: r.slice(1).join(' | '), fragment: '' }));
        L.reviewCards(items, { topic, source: notes, origin: 'ia', intro: notes ? 'Generadas a partir de tus apuntes. Ninguna se guarda hasta que la aceptes; corrige lo que haga falta.' : 'La IA las generó solo con el tema, sin fuente. Verifica cada respuesta y acepta solo las correctas.' });
      } catch (e) {
        if (e.stale) return; // otra consulta tomó el relevo
        if (e.cancelled) { closeModal(); toast('Consulta cancelada.'); return; }
        modal(`<h2>No se pudo completar</h2><p>${esc(e.message)}</p><button class="primary-button" type="button" data-close-modal>Cerrar</button>`);
      }
    });
  }
  $('#gen-cards').onclick = genCards;
  document.addEventListener('learny:gen-cards', genCards);

  /* ---- Sesión inteligente: tarjetas → Pomodoro → Feynman ---- */
  const smart = { step: null, topic: '', armed: false };
  const errorCards = () => live().filter((c) => last(c.history)?.rating === 'again');
  const feynmanPrompt = () => (smart.topic ? `Explica con tus palabras lo esencial de ${smart.topic}: una idea central, un ejemplo y una duda.` : 'Elige un tema de hoy y explícalo como a alguien de 12 años.');
  function smartSession() {
    const due = L.dueCards(), errs = errorCards().filter((c) => !due.includes(c));
    const pool = interleave([...due, ...shuffle(errs)].slice(0, 12));
    smart.topic = L.weakSubject()?.name || pool[0]?.subject || clean($('#tutor-subject').value, 60) || '';
    smart.step = 'cards'; smart.armed = false;
    if (pool.length) { L.showPage('practice'); smart.launching = true; L.startExam(pool, 12); smart.launching = false; toast(`Sesión inteligente · paso 1 de 3: ${plural(pool.length, 'tarjeta', 'tarjetas')}.`); }
    else smartNext('exam');
  }
  function smartNext(from) {
    if (from === 'exam' && smart.step === 'cards') {
      smart.step = 'focus'; smart.armed = false;
      modal(`<h2>Paso 2 de 3: bloque de enfoque</h2><p>Un Pomodoro${smart.topic ? ` sobre ${esc(smart.topic)}` : ''} para consolidar lo repasado.</p><button class="primary-button">Empezar enfoque</button>`, () => {
        smart.armed = true; closeModal(); L.showPage('study');
        if (L.timerStarted()) { toast('Ya tienes un bloque en marcha: continúa con ese.'); return; }
        const i = $('#intention-input'); if (!i.value.trim()) i.value = smart.topic ? `Practicar ${smart.topic}: resolver mis errores` : 'Avanzar en mi material de hoy';
        $('#pomodoro-button').click();
      }, () => { if (!smart.armed) smart.step = null; });
    } else if (from === 'pomo' && smart.step === 'focus' && smart.armed) {
      smart.step = null; smart.armed = false;
      modal(`<h2>Paso 3 de 3: explícalo con Feynman</h2><p>${esc(feynmanPrompt())}</p><button class="primary-button">Ir a Feynman</button>`, () => {
        closeModal(); L.showPage('practice'); $('#feynman-topic').value = smart.topic || $('#feynman-topic').value; $('#feynman-text').focus();
      });
    }
  }
  document.addEventListener('learny:examstart', () => { if (!smart.launching) { smart.step = null; smart.armed = false; } }); // un examen ajeno a la sesión inteligente la cancela
  document.addEventListener('learny:smart', smartSession);
  document.addEventListener('learny:examend', () => smartNext('exam'));
  document.addEventListener('learny:pomodone', () => smartNext('pomo'));

  /* ---- Estadísticas que proponen una acción ---- */
  function renderActions() {
    const el = $('#insight-actions'); if (!el) return;
    const rows = [], btn = (label, act, extra = '') => `<button class="outline-button" type="button" data-act="${act}" ${extra}>${label}</button>`;
    const rv = state.reviews;
    if (rv.length >= 5) {
      const pct = Math.round((rv.filter((r) => r.rating === 'easy').length * 100) / rv.length), errs = errorCards().length;
      rows.push([`Recuerdo declarado: ${rv.filter((r) => r.rating === 'easy').length} de ${rv.length} (${pct}%)`, errs ? `Repasa ${errs === 1 ? 'la tarjeta' : `las ${errs} tarjetas`} con errores recientes.` : 'Sin errores recientes: sigue con tu plan.', errs ? btn('Repasar errores', 'errors') : '']);
    }
    const from = addDays(today(), -6), mins = state.sessions.filter((s) => s.date >= from && !s.abandon).reduce((t, s) => t + s.minutes, 0), goal = state.settings.dailyGoal * state.settings.focus * 7;
    if (state.sessions.some((s) => !s.abandon)) rows.push([`${mins} min esta semana`, mins >= goal ? '¡Meta semanal cumplida!' : `Estás a ${goal - mins} min de tu meta semanal.`, mins >= goal ? '' : btn('Iniciar enfoque', 'focus')]);
    const weak = L.weakSubject();
    if (weak) rows.push([`${esc(weak.name)}: ${weak.pct}% sin fallar (${weak.ok} de ${weak.total} repasos)`, 'Un mini quiz de 8 tarjetas empieza por tus errores.', btn('Mini quiz', 'quiz', `data-subject="${esc(weak.name)}"`)]);
    const next = state.deadlines.filter((d) => L.daysUntil(d.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (next) {
      const n = L.daysUntil(next.date), todo = state.tasks.filter((t) => t.date === today() && !t.done).length;
      rows.push([`${esc(next.title)} ${n === 0 ? 'es hoy' : `en ${plural(n, 'día', 'días')}`}`, todo ? `Hoy toca: ${plural(todo, 'tarea', 'tareas')} y ${plural(L.dueCards().length, 'tarjeta', 'tarjetas')}.` : 'Hoy no tienes tareas pendientes de este examen.', btn('Ver plan', 'plan')]);
    }
    const st = L.calcStreak().streak, studied = state.sessions.some((s) => s.date === today() && !s.abandon);
    if (st) rows.push([`Racha de ${plural(st, 'día', 'días')}`, studied ? 'Hoy ya cuenta. ¡Buen ritmo!' : 'Completa una sesión de 10 minutos para mantenerla.', studied ? '' : btn('Empezar', 'focus')]);
    el.innerHTML = `<div class="card-head"><h2>Qué hacer con estos números</h2></div>` + (rows.length
      ? rows.map(([t, d, b]) => `<div class="action-row"><div><b>${t}</b><p class="lead">${d}</p></div>${b}</div>`).join('')
      : '<p class="empty">Completa tu primer Pomodoro para ver tu progreso.</p>');
  }
  $('#insight-actions').onclick = (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'errors') { const list = errorCards().slice(0, 10); if (list.length) { L.showPage('practice'); L.startExam(interleave(list), 10); } }
    else if (act === 'quiz') L.startSubjectQuiz(b.dataset.subject);
    else if (act === 'plan') L.showPage('planner');
    else if (act === 'focus') { L.showPage('study'); $('#intention-input').focus(); }
  };

  /* ---- Misiones y análisis ---- */
  function renderMissions() {
    const rv = state.reviews.filter((r) => r.date === today()).length, pm = state.sessions.filter((s) => s.date === today() && !s.abandon).length, fy = state.feynman.includes(today());
    const m = [['Repasa 10 tarjetas', rv >= 10, `${Math.min(rv, 10)}/10`], ['Completa un Pomodoro', pm >= 1, `${Math.min(pm, 1)}/1`], ['Explica un tema con Feynman', fy, fy ? '1/1' : '0/1']];
    $('#missions-list').innerHTML = m.map((x) => `<div class="task-row${x[1] ? ' done' : ''}"><span aria-hidden="true">${x[1] ? '✔' : '○'}</span><span>${x[0]} <small>${x[2]}</small></span></div>`).join('');
    $('#mission-count').textContent = `${m.filter((x) => x[1]).length}/3`;
  }
  function renderInsights() {
    const by = Object.create(null); state.cards.forEach((c) => { (by[c.subject] ||= { cards: 0, ok: 0, tot: 0 }).cards++; });
    state.reviews.forEach((r) => { const b = by[r.subject]; if (b) { b.tot++; if (r.rating !== 'again') b.ok++; } });
    const subs = Object.entries(by), none = '<p class="empty">Crea tarjetas para ver este panel.</p>';
    $('#concept-map').innerHTML = subs.length ? subs.map(([n, b]) => `<div class="node" style="--s:${Math.min(1.5, 0.85 + b.cards / 25)}"><b>${esc(n)}</b><small>${plural(b.cards, 'tarjeta', 'tarjetas')}</small></div>`).join('') : none;
    const master = subs.filter(([, b]) => b.tot >= 30 && b.ok / b.tot >= 0.8);
    $('#badges-list').innerHTML = master.length ? master.map(([n, b]) => `<p>🏅 Buen resultado en ${esc(n)}: ${b.ok} de ${b.tot} repasos sin fallar. Falta comprobarlo en próximos repasos.</p>`).join('') : '<p class="empty">Un resultado destacado aparece con 30 repasos de una materia y al menos 80 % sin fallar.</p>';
    $('#levels-list').innerHTML = subs.length ? subs.map(([n, b]) => `<p class="level"><span>${esc(n)}</span><b>Práctica nivel ${1 + Math.floor(Math.sqrt(b.tot))} · ${plural(b.tot, 'repaso', 'repasos')}</b></p>`).join('') : '';
    const weak = subs.filter(([, b]) => b.tot >= 5).map(([n, b]) => [n, Math.round((b.ok * 100) / b.tot), b.ok, b.tot]).sort((a, b) => a[1] - b[1])[0];
    $('#adaptive-route').innerHTML = weak && weak[1] < 60 ? `<b>Ruta sugerida</b><br>Repasa <b>${esc(weak[0])}</b> (${weak[1]} % sin fallar: ${weak[2]} de ${weak[3]} repasos), practica con ejercicios y avanza cuando pases del 70 %.` : '<b>Ruta sugerida</b><br>Sin huecos claros: sigue con tu plan y añade tarjetas nuevas.';
    const from = addDays(today(), -6), wr = state.reviews.filter((r) => r.date >= from).length, ex = state.exams.filter((e) => e.date >= from).length;
    $('#challenge-tag').textContent = `Reto: ${Math.min(wr, 30)}/30 repasos · ${Math.min(ex, 3)}/3 exámenes`;
    const mins = state.sessions.filter((s) => s.date >= from && !s.abandon).reduce((t, s) => t + s.minutes, 0);
    $('#weekly-digest').textContent = `Esta semana: ${mins} min de foco, ${plural(wr, 'repaso', 'repasos')} y ${plural(ex, 'examen', 'exámenes')}. Meta para la próxima: superar tus repasos de hoy.`;
    renderActions();
  }
  const PAGE = { library: [renderDecks], practice: [renderNotes], planner: [renderPlanner], study: [renderMissions], analysis: [renderInsights] };
  const renderExtras = () => (PAGE[L.currentPage()] || []).forEach((fn) => { try { fn(); } catch (e) { console.error('Learny extras', e); } });
  document.addEventListener('learny:render', renderExtras);
  document.addEventListener('learny:page', renderExtras);
  renderExtras();
})();
