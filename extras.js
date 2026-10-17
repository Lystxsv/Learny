(() => {
  'use strict';
  const L = window.Learny; if (!L) return;
  const { state, save, toast, modal, closeModal, today, addDays, uid, clean, esc, fmt, plural } = L;
  const $ = (s) => document.querySelector(s);
  const raw = (v, n = 2000) => String(v || '').trim().slice(0, n);
  const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const live = () => state.cards.filter((c) => !c.archived);
  const interleave = (cards) => {
    const g = {}; cards.forEach((c) => (g[c.subject] ||= []).push(c));
    const q = Object.values(g).map(shuffle), out = [];
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
    p.length ? L.startExam(p, 20) : toast('Crea tarjetas para hacer un examen.', 'error');
  };
  document.addEventListener('learny:reveal', () => {
    const v = raw($('#recall-answer').value, 800);
    if (v) $('#flashcard').insertAdjacentHTML('beforeend', `<p class="recall-compare"><small>Tu respuesta</small><br>${esc(v)}</p>`);
  });
  document.addEventListener('learny:rated', () => { $('#recall-answer').value = ''; });

  /* ---- Dictado ---- */
  const dictate = (btn, target) => {
    const label = btn.textContent;
    btn.onclick = () => {
      const R = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!R) return toast('Tu navegador no admite dictado. Prueba con Chrome o Edge.', 'error');
      const r = new R(); r.lang = 'es-ES'; btn.textContent = '🎤 Escuchando…';
      r.onresult = (e) => { target().value = `${target().value} ${e.results[0][0].transcript}`.trim(); };
      r.onend = () => { btn.textContent = label; };
      r.onerror = () => toast('No se pudo dictar. Revisa el permiso del micrófono.', 'error');
      r.start();
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
  const toCard = (t) => L.cardForm(null, { question: `Explica: ${t.split(/[.\n]/)[0].slice(0, 80)}`, answer: t.slice(0, 600) });
  $('#save-note').onclick = () => {
    const t = raw($('#quick-note').value); if (!t) return toast('Escribe una nota primero.', 'error');
    state.notes.push({ id: uid(), date: today(), text: t }); $('#quick-note').value = ''; save(); renderNotes(); toast('Nota guardada.');
  };
  $('#note-to-card').onclick = () => { const t = raw($('#quick-note').value); t ? toCard(t) : toast('Escribe una nota primero.', 'error'); };
  $('#capture-clip').onclick = async () => {
    try { $('#quick-note').value = raw(await navigator.clipboard.readText()); }
    catch { toast('No se pudo leer el portapapeles. Pega con Ctrl+V.', 'error'); }
  };
  $('#notes-list').onclick = (e) => {
    const c = e.target.dataset.noteCard, d = e.target.dataset.noteDel;
    if (c) { const n = state.notes.find((x) => x.id === c); if (n) toCard(n.text); }
    if (d) { state.notes = state.notes.filter((x) => x.id !== d); save(); renderNotes(); }
  };
  $('#source-analyze').onclick = async () => {
    const t = raw($('#source-text').value, 8000); if (t.length < 40) return toast('Pega un texto más largo (mínimo un párrafo).', 'error');
    const sents = t.split(/(?<=[.!?])\s+/).filter((s) => s.length > 30);
    const top = sents.slice().sort((a, b) => b.length - a.length).slice(0, 3).sort((a, b) => sents.indexOf(a) - sents.indexOf(b));
    const out = $('#source-out');
    out.innerHTML = `<b>Resumen</b><br>${top.map(esc).join(' ')}<br><br><b>Preguntas para ti</b><br>${sents.slice(0, 3).map((s, i) => `${i + 1}. ¿Qué significa, con tus palabras: “${esc(s.slice(0, 70))}…”?`).join('<br>')}`;
    if (state.apiKey) {
      try { out.innerHTML = fmt(await L.askGemini(`Resume en español en 4 frases y propón 5 preguntas de estudio:\n${t.slice(0, 3000)}`)); } catch (e) { toast(e.message, 'error'); }
    }
    L.suggestCards(clean($('#tutor-subject').value, 60) || 'Lectura', top.join(' '));
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
  $('#topic-library').innerHTML = Object.entries(DECKS).map(([n, c]) => `<button class="topic-chip" data-deck="${esc(n)}" type="button">${esc(n)} <small>· ${c.length} tarjetas</small></button>`).join('');
  $('#topic-library').onclick = (e) => {
    const n = e.target.closest('[data-deck]')?.dataset.deck; if (!n) return;
    let added = 0;
    DECKS[n].forEach(([question, answer]) => { if (!state.cards.some((c) => c.question === question)) { state.cards.push(L.normalizeCard({ subject: n, question, answer, nextReview: today() })); added++; } });
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
      h += `<div class="day${i === 0 ? ' today' : ''}"><b>${DAYS[dt.getDay()]} ${dt.getDate()}</b>${dl.map((x) => `<span class="tag urgent">${esc(x.title)}</span>`).join('')}${tasks.map((t) => `<small class="${t.done ? 'done' : ''}">${t.done ? '✔ ' : ''}${esc(t.phase)}</small>`).join('')}<small>${plural(due, 'tarjeta', 'tarjetas')}</small></div>`;
    }
    $('#week-calendar').innerHTML = h;
    const t = state.tasks.find((x) => x.date === today() && !x.done), dl = t && state.deadlines.find((x) => x.id === t.deadlineId);
    const errs = live().filter((c) => c.history.at(-1)?.rating === 'again').length;
    $('#auto-block').textContent = dl ? `Hoy: ${dl.dailyMinutes} min de ${dl.subject} + ${plural(L.dueCards().length, 'tarjeta', 'tarjetas')} + repaso de ${plural(errs, 'error', 'errores')}.` : 'Añade una fecha para que Learny arme tu bloque de estudio de hoy.';
  }
  $('#smart-plan').onclick = () => { toast('Indica el examen y los minutos diarios: Learny arma las fases y las tareas.'); L.addDeadline(); };
  $('#emergency-plan').onclick = () => {
    const dl = state.deadlines.filter((d) => L.daysUntil(d.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0];
    if (!dl) return toast('Añade primero una fecha de examen.', 'error');
    const n = Math.min(3, Math.max(0, L.daysUntil(dl.date))), blocks = Math.min(8, Math.max(2, Math.ceil((dl.dailyMinutes * 2) / 25)));
    const phase = (i) => (i === n ? 'simulacro cronometrado y revisión de errores' : i === 0 ? 'lo esencial del temario y 10 tarjetas clave' : 'problemas y práctica de lo de mayor peso');
    const rows = Array.from({ length: n + 1 }, (_, i) => `<p><b>${i === 0 ? 'Hoy' : `Día ${i + 1}`}:</b> ${blocks} bloques de 25 min (≈${((blocks * 25) / 60).toFixed(1)} h): ${phase(i)}.</p>`).join('');
    modal(`<h2>Plan de emergencia: ${esc(dl.title)}</h2>${rows}<p class="modal-tip">Duerme bien la noche anterior: consolidas lo estudiado.</p><button class="primary-button">Entendido</button>`);
  };
  $('#recovery-plan').onclick = () => {
    const s = clean($('#recovery-subject').value, 60), m = clean($('#recovery-miss').value, 600);
    if (!s || !m) return toast('Indica la materia y qué falló.', 'error');
    const d = { id: uid(), title: `Recuperación: ${s}`, subject: s, date: addDays(today(), 7), difficulty: 4, dailyMinutes: 40 };
    state.deadlines.push(d); L.rebuildTasks(d, false);
    state.tasks.filter((t) => t.deadlineId === d.id).forEach((t) => { t.title = `Fallos (${m.slice(0, 70)}): ${t.title}`; });
    save(); L.renderAll(); $('#recovery-miss').value = ''; toast('Plan de recuperación creado para 7 días.');
  };

  /* ---- Misiones y análisis ---- */
  function renderMissions() {
    const rv = state.reviews.filter((r) => r.date === today()).length, pm = state.sessions.filter((s) => s.date === today() && !s.abandon).length, fy = state.feynman.includes(today());
    const m = [['Repasa 10 tarjetas', rv >= 10, `${Math.min(rv, 10)}/10`], ['Completa un Pomodoro', pm >= 1, `${Math.min(pm, 1)}/1`], ['Explica un tema con Feynman', fy, fy ? '1/1' : '0/1']];
    $('#missions-list').innerHTML = m.map((x) => `<div class="task-row${x[1] ? ' done' : ''}"><span aria-hidden="true">${x[1] ? '✔' : '○'}</span><span>${x[0]} <small>${x[2]}</small></span></div>`).join('');
    $('#mission-count').textContent = `${m.filter((x) => x[1]).length}/3`;
  }
  function renderInsights() {
    const by = {}; state.cards.forEach((c) => { (by[c.subject] ||= { cards: 0, ok: 0, tot: 0 }).cards++; });
    state.reviews.forEach((r) => { const b = by[r.subject]; if (b) { b.tot++; if (r.rating !== 'again') b.ok++; } });
    const subs = Object.entries(by), none = '<p class="empty">Crea tarjetas para ver este panel.</p>';
    $('#concept-map').innerHTML = subs.length ? subs.map(([n, b]) => `<div class="node" style="--s:${Math.min(1.5, 0.85 + b.cards / 25)}"><b>${esc(n)}</b><small>${plural(b.cards, 'tarjeta', 'tarjetas')}</small></div>`).join('') : none;
    const master = subs.filter(([, b]) => b.cards >= 30 && b.tot && b.ok / b.tot >= 0.8);
    $('#badges-list').innerHTML = master.length ? master.map(([n]) => `<p>🏅 Dominio básico de ${esc(n)}</p>`).join('') : '<p class="empty">Insignia de dominio: 80 % de aciertos en 30 tarjetas de una materia.</p>';
    $('#levels-list').innerHTML = subs.length ? subs.map(([n, b]) => `<p class="level"><span>${esc(n)}</span><b>Nivel ${1 + Math.floor(Math.sqrt(b.tot))}</b></p>`).join('') : '';
    const weak = subs.filter(([, b]) => b.tot >= 3).map(([n, b]) => [n, Math.round((b.ok * 100) / b.tot)]).sort((a, b) => a[1] - b[1])[0];
    $('#adaptive-route').innerHTML = weak && weak[1] < 60 ? `<b>Ruta sugerida</b><br>Repasa <b>${esc(weak[0])}</b> (${weak[1]} % de aciertos), practica con ejercicios y avanza cuando pases del 70 %.` : '<b>Ruta sugerida</b><br>Sin huecos claros: sigue con tu plan y añade tarjetas nuevas.';
    const from = addDays(today(), -6), wr = state.reviews.filter((r) => r.date >= from).length, ex = state.exams.filter((e) => e.date >= from).length;
    $('#challenge-tag').textContent = `Reto: ${Math.min(wr, 30)}/30 repasos · ${Math.min(ex, 3)}/3 exámenes`;
    const mins = state.sessions.filter((s) => s.date >= from && !s.abandon).reduce((t, s) => t + s.minutes, 0);
    $('#weekly-digest').textContent = `Esta semana: ${mins} min de foco, ${plural(wr, 'repaso', 'repasos')} y ${plural(ex, 'examen', 'exámenes')}. Meta para la próxima: superar tus repasos de hoy.`;
  }
  const renderExtras = () => { renderNotes(); renderPlanner(); renderMissions(); renderInsights(); };
  document.addEventListener('learny:render', renderExtras);
  renderExtras();
})();
