(() => {
  'use strict';
  const L = window.Learny; if (!L) return;
  const { state, save, toast, modal, closeModal, today, addDays, uid, clean, esc, fmt, plural } = L;
  const $ = (s) => document.querySelector(s);
  const raw = (v, n = 2000) => String(v || '').trim().slice(0, n);
  const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  const live = () => state.cards.filter((c) => !c.archived && !c.corrupt);
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
    p.length ? timedExam(p) : toast('Crea tarjetas para hacer un examen.', 'error');
  };
  let rt = null;
  function timedExam(p) {
    L.startExam(p, 20);
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
    const sents = t.split(/(?<=[.!?])\s+/).filter((s) => s.length > 30);
    const top = sents.slice().sort((a, b) => b.length - a.length).slice(0, 3).sort((a, b) => sents.indexOf(a) - sents.indexOf(b));
    const out = $('#source-out');
    out.innerHTML = `<b>Resumen</b><br>${top.map(esc).join(' ')}<br><br><b>Preguntas para ti</b><br>${sents.slice(0, 3).map((s, i) => `${i + 1}. ¿Qué significa, con tus palabras: “${esc(s.slice(0, 70))}…”?`).join('<br>')}`;
    if (L.hasAi()) {
      out.innerHTML = '<div class="skeleton" aria-hidden="true"></div><p class="lead">Consultando tutor… <button class="text-button" type="button" data-cancel-ai>Cancelar</button></p>';
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
      if (!cards.length) return toast('Usa el formato pregunta | respuesta en cada línea.', 'error');
      if (allDecks()[name]) return toast('Ya existe un mazo con ese nombre.', 'error');
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
      h += `<div class="day${i === 0 ? ' today' : ''}"><b>${DAYS[dt.getDay()]} ${dt.getDate()}</b>${dl.map((x) => `<span class="tag urgent">${esc(x.title)}</span>`).join('')}${tasks.map((t) => `<small class="${t.done ? 'done' : ''}">${t.done ? '✔ ' : ''}${esc(t.phase)}</small>`).join('')}<small>${plural(due, 'tarjeta', 'tarjetas')}</small></div>`;
    }
    $('#week-calendar').innerHTML = h;
    const t = state.tasks.find((x) => x.date === today() && !x.done), dl = t && state.deadlines.find((x) => x.id === t.deadlineId);
    const errs = live().filter((c) => c.history.at(-1)?.rating === 'again').length;
    $('#auto-block').textContent = dl ? `Hoy: ${dl.dailyMinutes} min de ${dl.subject} + ${plural(L.dueCards().length, 'tarjeta', 'tarjetas')} + repaso de ${plural(errs, 'error', 'errores')}.` : 'Añade una fecha para que Learny arme tu bloque de estudio de hoy.';
  }
  const PH = { comprension: 'Comprensión', practica: 'Práctica', repaso: 'Repaso', simulacro: 'Simulacro', revision: 'Revisión final' };
  const EXTRA = { comprension: 'crear tarjetas del tema', practica: 'práctica intercalada de 10 tarjetas', repaso: 'repaso de errores', simulacro: 'examen real cronometrado', revision: 'repaso de errores y tarjetas débiles' };
  $('#smart-plan').onclick = () => modal(`<h2>Estudio inteligente</h2>
    <p>Dime el examen y Learny reparte Pomodoros, tarjetas, práctica intercalada, simulacro y repaso de errores hasta la fecha.</p>
    <label>Examen<input name="title" required maxlength="80" placeholder="Parcial de cálculo"></label>
    <label>Materia<input name="subject" required maxlength="60" list="subject-list"></label>
    <div class="form-row"><label>Fecha<input name="date" type="date" min="${today()}" required></label>
    <label>Minutos diarios<input name="mins" type="number" min="15" max="240" value="60" required></label></div>
    <label>Dificultad (1-5)<input name="difficulty" type="number" min="1" max="5" value="3"></label>
    <button class="primary-button">Crear plan</button>`, (d) => {
    const item = { id: uid(), title: clean(d.get('title'), 80), subject: clean(d.get('subject'), 60), date: d.get('date'),
      difficulty: Math.min(5, Math.max(1, Number(d.get('difficulty')) || 3)), dailyMinutes: Math.min(240, Math.max(15, Number(d.get('mins')) || 60)) };
    state.deadlines.push(item); L.rebuildTasks(item, false);
    const pom = Math.max(1, Math.round(item.dailyMinutes / state.settings.focus)), mine = state.tasks.filter((t) => t.deadlineId === item.id);
    mine.forEach((t) => { t.title += ` → ${plural(pom, 'Pomodoro', 'Pomodoros')} + ${EXTRA[t.phase]}.`; });
    const rows = Object.keys(PH).map((k) => { const ds = mine.filter((t) => t.phase === k).map((t) => t.date).sort(); return ds.length ? `<p><b>${PH[k]}:</b> ${ds[0] === ds.at(-1) ? ds[0] : `${ds[0]} a ${ds.at(-1)}`} · ${EXTRA[k]}</p>` : ''; }).join('');
    save(); closeModal(); L.renderAll();
    modal(`<h2>Tu plan para ${esc(item.title)}</h2><p>${plural(mine.length, 'día', 'días')} de estudio, ${plural(pom, 'Pomodoro', 'Pomodoros')} al día.</p>${rows}<p class="modal-tip">Las tareas de cada día aparecen en Planificar y puedes marcarlas al terminarlas.</p><button class="primary-button">Entendido</button>`);
  });
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


  /* ---- Borradores: no pierdas lo que escribes si recargas ---- */
  ['#quick-note', '#feynman-text', '#feynman-topic', '#source-text', '#intention-input'].forEach((sel) => {
    const el = $(sel); if (!el) return;
    if (state.drafts[sel] && !el.value) el.value = state.drafts[sel];
    el.addEventListener('input', L.debounce(() => {
      if (el.value) state.drafts[sel] = el.value.slice(0, 8000); else delete state.drafts[sel];
      save();
    }, 700));
  });

  /* ---- Crear tarjetas con IA ---- */
  function genCards() {
    if (!L.hasAi()) { toast('Para generar con IA añade tu clave en Ajustes ⚙️. Mientras tanto, prueba un mazo de ejemplo.', 'error'); L.showPage('library'); return; }
    modal(`<h2>Crear tarjetas con IA</h2>
      <label>Tema<input name="topic" required maxlength="80" value="${esc(subj() === 'el tema' ? '' : subj())}"></label>
      <button class="primary-button">Generar 5 tarjetas</button>`, async (d) => {
      const topic = clean(d.get('topic'), 80);
      modal(`<h2>Generando tarjetas…</h2><div class="skeleton" aria-hidden="true"></div><button class="outline-button" type="button" data-cancel-ai>Cancelar</button>`);
      $('#modal-body').setAttribute('aria-live', 'polite');
      try {
        const text = await L.askGemini(`Genera 5 flashcards de estudio en español sobre "${topic}". Una por línea con el formato: pregunta | respuesta. Sin numeración, sin títulos y sin texto adicional. Respuestas de máximo 2 frases.`);
        const rows = text.split('\n').map((l) => l.replace(/^[-•*\d.)\s]+/, '').replace(/\*\*/g, '').split('|').map((x) => x.trim())).filter((r) => r.length >= 2 && r[0] && r[1]).slice(0, 5);
        if (!rows.length) throw new Error('La IA no devolvió tarjetas con el formato esperado. Inténtalo de nuevo.');
        modal(`<h2>Revisa las tarjetas</h2>${rows.map((r, i) => `<label class="check"><input type="checkbox" name="c${i}" checked> <span><b>${esc(r[0])}</b><br>${esc(r.slice(1).join(' | '))}</span></label>`).join('')}<button class="primary-button">Guardar seleccionadas</button>`, (f) => {
          let n = 0;
          rows.forEach((r, i) => { if (f.get(`c${i}`) === 'on') { state.cards.push(L.normalizeCard({ subject: topic, question: r[0].slice(0, 500), answer: r.slice(1).join(' | ').slice(0, 1200), nextReview: today() })); n++; } });
          save(); closeModal(); L.renderAll(); toast(n ? `${plural(n, 'tarjeta creada', 'tarjetas creadas')}.` : 'No seleccionaste ninguna tarjeta.');
        });
      } catch (e) {
        if (e.cancelled) { closeModal(); toast('Consulta cancelada.'); return; }
        modal(`<h2>No se pudo completar</h2><p>${esc(e.message)}</p><button class="primary-button" type="button" data-close-modal>Cerrar</button>`);
      }
    });
  }
  $('#gen-cards').onclick = genCards;
  document.addEventListener('learny:gen-cards', genCards);

  /* ---- Sesión inteligente: tarjetas → Pomodoro → Feynman ---- */
  const smart = { step: null, topic: '' };
  const errorCards = () => live().filter((c) => c.history.at(-1)?.rating === 'again');
  const feynmanPrompt = () => (smart.topic ? `Explica con tus palabras lo esencial de ${smart.topic}: una idea central, un ejemplo y una duda.` : 'Elige un tema de hoy y explícalo como a alguien de 12 años.');
  function smartSession() {
    const due = L.dueCards(), errs = errorCards().filter((c) => !due.includes(c));
    const pool = interleave([...due, ...shuffle(errs)].slice(0, 12));
    smart.topic = L.weakSubject()?.name || pool[0]?.subject || clean($('#tutor-subject').value, 60) || '';
    smart.step = 'cards';
    if (pool.length) { L.showPage('practice'); L.startExam(pool, 12); toast(`Sesión inteligente · paso 1 de 3: ${plural(pool.length, 'tarjeta', 'tarjetas')}.`); }
    else smartNext('exam');
  }
  function smartNext(from) {
    if (from === 'exam' && smart.step === 'cards') {
      smart.step = 'focus';
      modal(`<h2>Paso 2 de 3: bloque de enfoque</h2><p>Un Pomodoro${smart.topic ? ` sobre ${esc(smart.topic)}` : ''} para consolidar lo repasado.</p><button class="primary-button">Empezar enfoque</button>`, () => {
        closeModal(); L.showPage('study');
        if (L.timerStarted()) { toast('Ya tienes un bloque en marcha: continúa con ese.'); return; }
        const i = $('#intention-input'); if (!i.value.trim()) i.value = smart.topic ? `Practicar ${smart.topic}: resolver mis errores` : 'Avanzar en mi material de hoy';
        $('#pomodoro-button').click();
      });
    } else if (from === 'pomo' && smart.step === 'focus') {
      smart.step = null;
      modal(`<h2>Paso 3 de 3: explícalo con Feynman</h2><p>${esc(feynmanPrompt())}</p><button class="primary-button">Ir a Feynman</button>`, () => {
        closeModal(); L.showPage('practice'); $('#feynman-topic').value = smart.topic || $('#feynman-topic').value; $('#feynman-text').focus();
      });
    }
  }
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
      rows.push([`Retención ${pct}%`, errs ? `Repasa ${errs === 1 ? 'la tarjeta' : `las ${errs} tarjetas`} con errores recientes.` : 'Sin errores recientes: sigue con tu plan.', errs ? btn('Repasar errores', 'errors') : '']);
    }
    const from = addDays(today(), -6), mins = state.sessions.filter((s) => s.date >= from && !s.abandon).reduce((t, s) => t + s.minutes, 0), goal = state.settings.dailyGoal * state.settings.focus * 7;
    if (state.sessions.some((s) => !s.abandon)) rows.push([`${mins} min esta semana`, mins >= goal ? '¡Meta semanal cumplida!' : `Estás a ${goal - mins} min de tu meta semanal.`, mins >= goal ? '' : btn('Iniciar enfoque', 'focus')]);
    const weak = L.weakSubject();
    if (weak) rows.push([`${esc(weak.name)}: ${weak.pct}% de aciertos`, 'Un mini quiz de 8 tarjetas empieza por tus errores.', btn('Mini quiz', 'quiz', `data-subject="${esc(weak.name)}"`)]);
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
    renderActions();
  }
  const PAGE = { library: [renderDecks], practice: [renderNotes], planner: [renderPlanner], study: [renderMissions], analysis: [renderInsights] };
  const renderExtras = () => (PAGE[L.currentPage()] || []).forEach((fn) => { try { fn(); } catch (e) { console.error('Learny extras', e); } });
  document.addEventListener('learny:render', renderExtras);
  document.addEventListener('learny:page', renderExtras);
  renderExtras();
})();
