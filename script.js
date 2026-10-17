(() => {
  'use strict';

  /* =========================================================
     Utilidades
     ========================================================= */
  const KEY = 'learny.v2';
  const DEFAULT_MODEL = 'gemini-flash-latest';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, '0');
  // Fechas en HORA LOCAL (el original usaba UTC y cambiaba de día a las 7 p. m. en Colombia).
  const dateStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => dateStr();
  const addDays = (date, n) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + n); return dateStr(d); };
  const daysUntil = (date) => Math.round((new Date(`${date}T12:00:00`) - new Date(`${today()}T12:00:00`)) / 86400000);
  const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const esc = (v = '') => String(v).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  const fmt = (v) => esc(v).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  const num = (v, min, max, def) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def; };
  const time = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  /* =========================================================
     Estado y almacenamiento
     ========================================================= */
  const defaults = () => ({
    settings: { focus: 25, rest: 5, roulettePrepare: 10, rouletteExplain: 1, fontSize: 16, font: 'sans', theme: 'dark', reduceMotion: false, engine: 'gemini', model: DEFAULT_MODEL, skipAi: false, recentTurns: [] },
    sessions: [], cards: [], deadlines: [], reviews: [], topics: [], apiKey: ''
  });
  const state = defaults();

  const normalizeCard = (c) => ({
    id: c.id || uid(), subject: String(c.subject || 'Sin materia'), question: String(c.question || ''), answer: String(c.answer || ''),
    nextReview: /^\d{4}-\d{2}-\d{2}$/.test(c.nextReview) ? c.nextReview : today(), archived: !!c.archived,
    ease: Number(c.ease) || 2.5, interval: Number(c.interval) || 0, reps: Number(c.reps) || 0
  });

  function hydrate(raw) {
    const base = defaults();
    const src = raw && typeof raw === 'object' ? raw : {};
    Object.assign(state, base, src);
    state.settings = { ...base.settings, ...(src.settings || {}) };
    state.apiKey = typeof state.apiKey === 'string' ? state.apiKey : '';
    ['sessions', 'cards', 'deadlines', 'reviews', 'topics'].forEach((k) => { if (!Array.isArray(state[k])) state[k] = []; });
    state.cards = state.cards.filter((c) => c && typeof c === 'object' && c.question).map(normalizeCard);
    state.sessions = state.sessions.filter((s) => s && /^\d{4}-\d{2}-\d{2}$/.test(s.date)).map((s) => ({ ...s, id: s.id || uid(), minutes: Number(s.minutes) || 0, energy: s.energy ? Number(s.energy) : null }));
    state.deadlines = state.deadlines.filter((d) => d && d.title && /^\d{4}-\d{2}-\d{2}$/.test(d.date)).map((d) => ({ id: d.id || uid(), title: String(d.title), subject: String(d.subject || ''), date: d.date }));
    state.topics = state.topics.filter((t) => t && t.name).map((t) => ({ id: t.id || uid(), name: String(t.name), category: String(t.category || 'Personal') }));
    state.reviews = state.reviews.filter((r) => r && r.date);
    if (!Array.isArray(state.settings.recentTurns)) state.settings.recentTurns = [];
  }

  (function load() {
    let legacy = {}, saved = {};
    try { legacy = JSON.parse(localStorage.getItem('learny.v1') || '{}'); saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* empieza con estado nuevo */ }
    hydrate({ ...legacy, ...saved, settings: { ...(legacy.settings || {}), ...(saved.settings || {}) } });
  })();

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { toast('No se pudo guardar: el navegador bloqueó el almacenamiento.'); } };

  /* =========================================================
     Interfaz base: avisos, páginas y ventanas
     ========================================================= */
  function toast(message) {
    const el = $('#toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(toast.id); toast.id = setTimeout(() => el.classList.remove('show'), 4000);
  }
  function showPage(page) {
    $$('.nav-button').forEach((b) => { const on = b.dataset.page === page; b.classList.toggle('active', on); if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    $$('.page').forEach((p) => p.classList.toggle('active', p.id === page));
  }
  let modalCloseHandler = null, rouletteId = null;
  const modalOpen = () => $('#app-modal').open;
  const closeModal = () => { if (modalOpen()) $('#app-modal').close(); };
  function modal(html, onSubmit, onClose) {
    const dialog = $('#app-modal'), form = $('#modal-form');
    $('#modal-body').innerHTML = html;
    modalCloseHandler = onClose || null;
    form.onsubmit = (event) => { event.preventDefault(); onSubmit ? onSubmit(new FormData(form)) : closeModal(); };
    if (!dialog.open) dialog.showModal(); // evita el error al abrir una ventana sobre otra
  }
  $('#app-modal').addEventListener('close', () => {
    clearInterval(rouletteId); rouletteId = null;
    const handler = modalCloseHandler; modalCloseHandler = null; handler?.();
  });
  $('.modal-close').onclick = closeModal;

  function beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
      const ctx = new Ctx(), osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(); osc.stop(ctx.currentTime + 0.8); navigator.vibrate?.(200);
    } catch { /* sin sonido */ }
  }

  /* =========================================================
     Planificador
     ========================================================= */
  function inversePlan(days) {
    if (days < 0) return 'La fecha ya pasó: elimínala o registra una nueva.';
    if (days === 0) return 'Hoy: prioriza conceptos clave, haz un simulacro de 25 minutos y revisa errores.';
    const sessions = Math.max(1, Math.ceil(days / 3));
    const minutes = Math.min(90, Math.max(20, Math.round(180 / days) * 5));
    const left = days === 1 ? 'Falta 1 día' : `Faltan ${days} días`;
    if (days <= 3) return `${left}: haz ${plural(days, 'repaso exprés', 'repasos exprés')} de ${minutes} min; termina cada uno con 5 preguntas activas.`;
    if (days <= 7) return `${left}: distribuye ${sessions} bloques de ${minutes} min y reserva el último día para un simulacro.`;
    const topics = Math.max(2, Math.ceil(days / 4));
    return `${left}: divide el contenido en ${topics} bloques temáticos, programa ${sessions} repasos acumulativos y un simulacro final.`;
  }

  function renderDeadlines() {
    const entries = [...state.deadlines].sort((a, b) => a.date.localeCompare(b.date));
    $('#deadline-list').innerHTML = entries.length ? entries.map((x) => {
      const d = daysUntil(x.date);
      const tag = d < 0 ? '<span class="tag">Pasada</span>' : `<span class="tag ${d <= 3 ? 'urgent' : ''}">${d === 0 ? 'Hoy' : `en ${plural(d, 'día', 'días')}`}</span>`;
      return `<div class="session-item"><b>${esc(x.title)}</b> ${tag}<br><span>${esc(x.subject)} · ${esc(x.date)}<br>${esc(inversePlan(d))}</span><br><button class="text-button danger" data-delete-deadline="${esc(x.id)}" type="button">Eliminar</button></div>`;
    }).join('') : '<p class="empty">Añade una fecha para recibir un plan de estudio inverso.</p>';
    const next = entries.find((x) => daysUntil(x.date) >= 0) || entries[0];
    $('#calendar-summary').innerHTML = next ? `<b>${esc(next.title)}</b><br>${esc(inversePlan(daysUntil(next.date)))}` : 'Añade una fecha importante para ver su plan inverso.';
  }
  function addDeadline() {
    modal('<h2>Nueva fecha</h2><label>Nombre<input name="title" required maxlength="80"></label><label>Materia<input name="subject" required maxlength="60"></label><label>Fecha<input name="date" type="date" required></label><button class="primary-button">Guardar y crear plan</button>', (data) => {
      state.deadlines.push({ id: uid(), title: data.get('title').trim(), subject: data.get('subject').trim(), date: data.get('date') });
      save(); closeModal(); renderDeadlines(); toast('Plan inverso creado.');
    });
  }

  /* =========================================================
     Pomodoro (con descanso y reloj basado en la hora real)
     ========================================================= */
  const timer = { mode: 'focus', running: false, endAt: 0, remaining: 0, total: 0, intention: '', id: null };
  const phaseSeconds = (mode) => (mode === 'focus' ? state.settings.focus : state.settings.rest) * 60;
  function resetTimer(mode = 'focus') {
    clearInterval(timer.id); timer.id = null; timer.running = false; timer.mode = mode;
    timer.total = timer.remaining = phaseSeconds(mode); renderTimer();
  }
  function renderTimer() {
    const focusMode = timer.mode === 'focus', fresh = timer.remaining >= timer.total;
    $('#timer-clock').textContent = time(timer.remaining);
    $('#pomodoro-profile').textContent = `${state.settings.focus}/${state.settings.rest} · ${focusMode ? 'Foco' : 'Descanso'}`;
    $('#pomodoro-button').textContent = timer.running ? 'Ⅱ Pausar' : focusMode ? (fresh ? '▶ Iniciar enfoque' : '▶ Continuar') : (fresh ? '☕ Iniciar descanso' : '▶ Continuar descanso');
    $('#pomodoro-skip').hidden = focusMode;
    $('#timer-note').textContent = focusMode ? (timer.intention ? `Intención: ${timer.intention}` : 'Define tu intención antes de iniciar.') : 'Descanso: toma agua, respira lento, estira y mira a lo lejos.';
    document.title = timer.running ? `${time(timer.remaining)} · Learny` : 'Learny · Estudia con intención';
  }
  function tick() {
    timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    renderTimer(); if (timer.remaining <= 0) finishPhase();
  }
  function startPomodoro() {
    if (timer.running) { tick(); clearInterval(timer.id); timer.id = null; timer.running = false; renderTimer(); return; }
    if (timer.mode === 'focus') {
      const intention = $('#intention-input').value.trim() || timer.intention;
      if (!intention) { toast('Escribe una intención antes de empezar.'); $('#intention-input').focus(); return; }
      timer.intention = intention;
    }
    timer.endAt = Date.now() + timer.remaining * 1000; timer.running = true;
    timer.id = setInterval(tick, 500); renderTimer();
  }
  function finishPhase() {
    clearInterval(timer.id); timer.id = null; timer.running = false; beep();
    if (timer.mode === 'rest') { toast('Descanso terminado. ¡Listo para otro bloque!'); resetTimer('focus'); return; }
    const session = { id: uid(), date: today(), minutes: Math.max(1, Math.round(timer.total / 60)), intention: timer.intention, energy: null };
    state.sessions.push(session); save();
    resetTimer('rest'); renderAll();
    modal(`<h2>¡Bloque completado!</h2><p>Sumaste ${plural(session.minutes, 'minuto', 'minutos')}. ¿Cómo estuvo tu concentración?</p>
      <fieldset class="choice-list"><legend class="sr-only"></legend><div class="scale">${[1, 2, 3, 4, 5].map((n) => `<label><input type="radio" name="energy" value="${n}" ${n === 3 ? 'required' : ''}> ${n}</label>`).join('')}</div></fieldset>
      <p class="modal-tip">1 = muy baja · 5 = muy alta. Ya puedes iniciar tu descanso de ${plural(state.settings.rest, 'minuto', 'minutos')}.</p><button class="primary-button">Guardar</button>`,
      (data) => { const e = data.get('energy'); session.energy = e ? Number(e) : null; save(); closeModal(); renderAll(); }, () => renderAll());
  }
  function configurePomodoro() {
    modal(`<h2>Personaliza el temporizador</h2><p>Escribe cualquier cantidad de minutos entre 1 y 180 (1 sirve para probar).</p><div class="form-row"><label>Foco (min)<input name="focus" type="number" min="1" max="180" step="1" value="${state.settings.focus}" required></label><label>Descanso (min)<input name="rest" type="number" min="1" max="60" step="1" value="${state.settings.rest}" required></label></div><button class="primary-button">Guardar</button>`, (data) => {
      state.settings.focus = num(data.get('focus'), 1, 180, 25); state.settings.rest = num(data.get('rest'), 1, 60, 5);
      save(); closeModal(); if (!timer.running) resetTimer(timer.mode); else renderTimer(); renderAll();
    });
  }

  /* =========================================================
     Foco, racha y métricas
     ========================================================= */
  function calcStreak() {
    const studied = new Set(state.sessions.map((s) => s.date));
    let streak = 0, graceUsed = false, cursor = today();
    if (!studied.has(cursor)) cursor = addDays(cursor, -1); // hoy todavía no termina
    for (let i = 0; i < 400; i++) {
      if (studied.has(cursor)) streak++;
      else if (!graceUsed && studied.has(addDays(cursor, -1))) graceUsed = true; // un día de gracia dentro de la racha
      else break;
      cursor = addDays(cursor, -1);
    }
    return { streak, graceUsed };
  }
  const facts = ['Los pulpos tienen tres corazones.', 'La miel puede conservarse durante miles de años.', 'Tu cerebro consolida recuerdos mientras duermes.', 'Los árboles intercambian nutrientes mediante redes de hongos.', 'La luz solar tarda unos 8 minutos en llegar a la Tierra.', 'Los tiburones existen desde antes que los árboles.', 'Un día en Venus dura más que un año en Venus.', 'Explicar algo con tus palabras revela lo que realmente entiendes.', 'Repasar justo antes de olvidar fortalece más la memoria que releer sin pausa.'];
  function renderFocus() {
    const sessions = state.sessions.filter((s) => s.date === today());
    const minutes = sessions.reduce((t, s) => t + Number(s.minutes || 0), 0);
    const energy = sessions.filter((s) => s.energy).map((s) => Number(s.energy));
    $('#focus-today').textContent = `${minutes} min`;
    $('#daily-rhythm').textContent = sessions.length ? `${plural(sessions.length, 'bloque completado', 'bloques completados')} hoy.` : 'Aún no has completado bloques hoy.';
    $('#average-energy').textContent = energy.length ? `${(energy.reduce((a, b) => a + b, 0) / energy.length).toFixed(1)}/5` : '—';
    $('#current-streak').textContent = plural(calcStreak().streak, 'día', 'días');
    $('#daily-fact').textContent = facts[new Date().getDate() % facts.length];
    renderTimer();
  }

  /* =========================================================
     Flashcards con repaso espaciado
     ========================================================= */
  let activeCard = null, revealed = false, answered = false;
  const dueCards = () => state.cards.filter((c) => !c.archived && c.nextReview <= today()).sort((a, b) => a.nextReview.localeCompare(b.nextReview));

  function schedule(card, rating) {
    if (rating === 'again') { card.reps = 0; card.interval = 1; card.ease = Math.max(1.3, card.ease - 0.2); }
    else if (rating === 'hard') { card.reps += 1; card.interval = Math.max(2, Math.round(Math.max(card.interval, 1) * 1.2)); card.ease = Math.max(1.3, card.ease - 0.15); }
    else { card.interval = card.reps === 0 ? 4 : Math.round(Math.max(card.interval, 1) * card.ease * 1.3); card.reps += 1; card.ease = Math.min(3, card.ease + 0.1); }
    card.interval = Math.min(365, card.interval); card.nextReview = addDays(today(), card.interval);
  }
  function renderCard() {
    const due = dueCards(); activeCard = due[0] || null; revealed = false; answered = false;
    $('#rating-row').hidden = true; $('#reveal-card').hidden = !activeCard; $('#card-tools').hidden = !activeCard;
    $('#card-count').textContent = plural(due.length, 'pendiente', 'pendientes');
    if (!activeCard) {
      $('#flashcard').innerHTML = state.cards.some((c) => !c.archived) ? 'No hay tarjetas pendientes.<br><span>Vuelve en tu próxima fecha de repaso.</span>' : 'Crea tu primera tarjeta<br><span>La pregunta aparecerá aquí.</span>';
      return;
    }
    $('#flashcard').innerHTML = `<div><small>${esc(activeCard.subject)}</small><br>${esc(activeCard.question)}</div>`;
  }
  function revealCard() {
    if (!activeCard || revealed) return;
    revealed = true;
    $('#flashcard').innerHTML = `<div><small>Pregunta</small><br>${esc(activeCard.question)}<hr><small>Respuesta</small><br>${esc(activeCard.answer)}</div>`;
    $('#reveal-card').hidden = true; $('#rating-row').hidden = false;
  }
  function rateCard(rating) {
    if (!activeCard || !revealed || answered) return;
    answered = true; schedule(activeCard, rating);
    state.reviews.push({ date: today(), cardId: activeCard.id, subject: activeCard.subject || 'Sin materia', rating });
    save(); toast(`Volverá en ${plural(activeCard.interval, 'día', 'días')}.`); renderAll();
  }
  function cardForm(card = null) {
    modal(`<h2>${card ? 'Editar' : 'Nueva'} flashcard</h2>
      <label>Materia<input name="subject" required maxlength="60" value="${esc(card?.subject || '')}"></label>
      <label>Pregunta<textarea name="question" required>${esc(card?.question || '')}</textarea></label>
      <label>Respuesta<textarea id="card-answer" name="answer" required>${esc(card?.answer || '')}</textarea></label>
      <button id="generate-answer" class="outline-button" type="button">✨ Generar respuesta con IA</button>
      <button class="primary-button">${card ? 'Guardar cambios' : 'Crear tarjeta'}</button>`, (data) => {
      const values = { subject: data.get('subject').trim(), question: data.get('question').trim(), answer: data.get('answer').trim() };
      if (card) Object.assign(card, values); else state.cards.push(normalizeCard({ ...values, nextReview: today() }));
      save(); closeModal(); renderAll();
    });
    $('#generate-answer').onclick = async () => {
      const question = $('[name="question"]').value.trim(), button = $('#generate-answer');
      if (!question) return toast('Escribe primero una pregunta.');
      if (!state.apiKey) return toast('Añade tu clave de Gemini en Ajustes ⚙️ para usar esta función.');
      button.disabled = true; button.textContent = 'Generando…';
      try { const text = await askGemini(`Responde en español, en máximo 3 frases, de forma precisa y útil para una flashcard. Pregunta: ${question}`); const out = $('#card-answer'); if (out) out.value = text; }
      catch (error) { toast(error.message); }
      finally { if ($('#generate-answer')) { button.disabled = false; button.textContent = '✨ Generar respuesta con IA'; } }
    };
  }
  function renderLibrary() {
    const cards = state.cards.filter((c) => c.archived);
    $('#library-count').textContent = plural(cards.length, 'tarjeta', 'tarjetas');
    $('#library-list').innerHTML = cards.length ? cards.map((c) => `<article class="library-card"><b>${esc(c.question)}</b><p>${esc(c.answer)}</p><span>${esc(c.subject)}</span><div class="row-actions"><button class="text-button" data-return-card="${esc(c.id)}" type="button">Devolver a rotación</button><button class="text-button" data-edit-card="${esc(c.id)}" type="button">Editar</button><button class="text-button danger" data-delete-card="${esc(c.id)}" type="button">Eliminar</button></div></article>`).join('') : '<p class="empty">Las tarjetas archivadas aparecerán aquí.</p>';
  }
  function deleteCard(card) {
    if (!card || !confirm('¿Eliminar esta tarjeta definitivamente?')) return;
    state.cards = state.cards.filter((c) => c.id !== card.id); save(); renderAll(); toast('Tarjeta eliminada.');
  }

  /* =========================================================
     Análisis
     ========================================================= */
  function renderAnalysis() {
    const reviews = state.reviews, correct = reviews.filter((r) => r.rating !== 'again').length;
    $('#accuracy-stat').textContent = reviews.length ? `${Math.round((correct * 100) / reviews.length)}%` : '0%';
    $('#reviewed-stat').textContent = reviews.length;
    $('#library-stat').textContent = state.cards.filter((c) => c.archived).length;
    $('#grace-stat').textContent = calcStreak().graceUsed ? '0' : '1';
    const days = [], names = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    for (let i = 6; i >= 0; i--) {
      const date = addDays(today(), -i);
      days.push({ date, label: names[new Date(`${date}T12:00:00`).getDay()], mins: state.sessions.filter((s) => s.date === date).reduce((t, s) => t + Number(s.minutes || 0), 0) });
    }
    const max = Math.max(30, ...days.map((d) => d.mins));
    $('#focus-chart').innerHTML = days.map((d) => `<div class="bar-col" title="${d.date}: ${d.mins} min"><div class="bar-area"><div class="bar" style="height:${d.mins ? Math.max(4, (d.mins / max) * 100) : 0}%"></div></div><span>${d.label}</span></div>`).join('');
    $('#focus-summary').textContent = `Total de la semana: ${days.reduce((t, d) => t + d.mins, 0)} min.`;
    const weak = {}; reviews.filter((r) => r.rating === 'again').forEach((r) => { weak[r.subject] = (weak[r.subject] || 0) + 1; });
    const areas = Object.entries(weak).sort((a, b) => b[1] - a[1]);
    $('#weak-topics').innerHTML = areas.length ? areas.map(([name, count]) => `<div class="weak-topic"><span>${esc(name)}</span><b>${plural(count, 'oportunidad', 'oportunidades')}</b></div>`).join('') : '<p class="empty">Cada repaso alimentará este mapa de exploración.</p>';
  }

  /* =========================================================
     IA (Gemini) y guías locales
     ========================================================= */
  const localSocratic = (topic, text = '') => {
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return `Sobre “${topic || 'este tema'}”: ¿cuál es la idea central, qué ejemplo propio la demuestra y qué parte explicarías con menos palabras técnicas?${words ? ` Tu explicación tiene ${words} palabras; intenta contrastarla con un contraejemplo.` : ''}`;
  };
  async function askGemini(prompt) {
    if (!state.apiKey) throw new Error('Falta la clave de Gemini. Añádela en Ajustes ⚙️.');
    const model = (state.settings.model || DEFAULT_MODEL).trim();
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': state.apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      let data = {}; try { data = await response.json(); } catch { /* sin cuerpo */ }
      if (!response.ok) {
        const raw = data.error?.message || `Error ${response.status}`;
        if (response.status === 400 || response.status === 401 || response.status === 403) throw new Error(`La clave de Gemini no es válida o no tiene permiso. (${raw})`);
        if (response.status === 404) throw new Error(`El modelo “${model}” no existe. Cámbialo en Ajustes ⚙️. (${raw})`);
        if (response.status === 429) throw new Error('Llegaste al límite gratuito de Gemini. Espera un rato e inténtalo de nuevo.');
        throw new Error(raw);
      }
      const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
      if (!text) throw new Error('Gemini no devolvió texto para esta consulta.');
      return text;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Gemini tardó demasiado. Inténtalo de nuevo.');
      if (error instanceof TypeError) throw new Error('No hay conexión con Gemini. Revisa tu internet.');
      throw error;
    } finally { clearTimeout(timeout); }
  }
  function requestKey(onKey, onLocal) {
    modal('<h2>Conecta Gemini</h2><p>Consigue una clave gratuita en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a>. Se guarda solo en este navegador y tus preguntas se envían a Google cuando la usas.</p><label>API key<input name="key" type="password" autocomplete="off" required></label><p class="modal-tip">Sin clave, Learny usa una guía socrática local para que nunca te quedes parado.</p><button class="primary-button">Guardar clave</button><button id="use-local" class="outline-button" type="button">Continuar sin IA</button>', (data) => {
      state.apiKey = data.get('key').trim(); save(); closeModal(); onKey();
    });
    $('#use-local').onclick = () => { state.settings.skipAi = true; save(); onLocal(); };
  }
  // Devuelve { text, fromAi }. Muestra el resultado en una ventana.
  async function gemini(prompt, title, fallback) {
    const defaultLocal = 'La IA no está disponible ahora. Reformula tu pregunta en partes pequeñas y responde primero: ¿qué sé ya y qué necesito comprobar?';
    const showLocal = (note = '') => { const text = fallback?.() || defaultLocal; modal(`<h2>${esc(title)}</h2><div class="ai-answer">${fmt(text)}</div>${note ? `<p class="modal-tip">${esc(note)}</p>` : ''}<button class="primary-button" type="button" onclick="this.closest('dialog').close()">Cerrar</button>`); return { text, fromAi: false }; };
    if (!state.apiKey) {
      if (modalOpen()) { toast('Añade tu clave de Gemini en Ajustes ⚙️.'); return { text: fallback?.() || defaultLocal, fromAi: false }; }
      if (!state.settings.skipAi) return new Promise((resolve) => requestKey(async () => resolve(await gemini(prompt, title, fallback)), () => resolve(showLocal('Puedes añadir tu clave de Gemini en Ajustes ⚙️.'))));
      return showLocal('Guía local. Añade tu clave de Gemini en Ajustes ⚙️ para respuestas con IA.');
    }
    modal(`<h2>${esc(title)}</h2><p class="lead">Pensando…</p>`);
    try {
      const text = await askGemini(prompt);
      $('#modal-body').innerHTML = `<h2>${esc(title)}</h2><div class="ai-answer">${fmt(text)}</div><button class="primary-button" type="button" onclick="this.closest('dialog').close()">Cerrar</button>`;
      return { text, fromAi: true };
    } catch (error) {
      const text = fallback?.() || defaultLocal;
      $('#modal-body').innerHTML = `<h2>Usamos la guía local</h2><p>${esc(error.message)}</p><div class="ai-answer">${fmt(text)}</div><button class="primary-button" type="button" onclick="this.closest('dialog').close()">Cerrar</button>`;
      return { text, fromAi: false };
    }
  }

  /* =========================================================
     Método Feynman
     ========================================================= */
  async function feynman() {
    const topic = $('#feynman-topic').value.trim(), text = $('#feynman-text').value.trim(), guide = $('#feynman-guide');
    if (!text) return toast('Escribe tu explicación.');
    const local = localSocratic(topic, text);
    guide.innerHTML = `<b>Guía socrática</b><br>${esc(local)}`;
    if (!state.apiKey) { toast('Con una clave de Gemini (Ajustes ⚙️) recibirás feedback de IA.'); return; }
    guide.innerHTML += '<br><br><i>Pidiendo feedback al tutor…</i>';
    try {
      const answer = await askGemini(`Actúa como tutor socrático en español. No des la solución completa. Evalúa esta explicación sobre ${topic || 'un tema'} y formula tres preguntas guía breves.\n\nExplicación del estudiante:\n${text}`);
      guide.innerHTML = `<b>Feedback del tutor</b><br>${fmt(answer)}`;
    } catch (error) { guide.innerHTML = `<b>Guía socrática</b><br>${esc(local)}<br><br><i>${esc(error.message)}</i>`; }
  }

  /* =========================================================
     Temas y ruleta
     ========================================================= */
  const worldPool = ['teoría de juegos', 'célula eucariota', 'ética de Aristóteles', 'recursión', 'teorema de Bayes', 'cambio climático', 'mercados competitivos', 'sistema inmunitario', 'poesía modernista', 'criptografía asimétrica', 'composición musical', 'derechos humanos'];
  function addTopic(name, category = 'Personal') {
    const clean = name.trim().slice(0, 80); if (!clean) return false;
    if (!state.topics.some((t) => t.name.toLowerCase() === clean.toLowerCase())) state.topics.push({ id: uid(), name: clean, category });
    save(); renderTopics(); return true;
  }
  function renderTopics() {
    const query = $('#topic-search').value.trim().toLowerCase();
    const topics = state.topics.filter((t) => !query || t.name.toLowerCase().includes(query));
    $('#topic-results').innerHTML = topics.length ? topics.map((t) => `<span class="topic-wrap"><button class="topic-chip" data-topic="${esc(t.name)}" type="button">${esc(t.name)} <small>· ${esc(t.category)}</small></button><button class="chip-x" data-delete-topic="${esc(t.id)}" type="button" aria-label="Quitar ${esc(t.name)}">×</button></span>`).join('') : '<p class="empty">No hay coincidencias. Añade el tema que quieras.</p>';
  }
  async function suggestTopic() {
    const subject = $('#topic-search').value.trim();
    const randomTopic = () => { const pick = worldPool[Math.floor(Math.random() * worldPool.length)]; addTopic(pick, 'Mundial'); toast(`Tema añadido: ${pick}`); };
    if (!subject) return randomTopic();
    if (!state.apiKey) { toast('Sin clave de Gemini te sugerimos un tema al azar (Ajustes ⚙️ para añadirla).'); return randomTopic(); }
    const result = await gemini(`Sugiere tres subtemas concretos y estudiables sobre: ${subject}. Devuelve únicamente una línea por subtema, sin explicaciones.`, 'Sugerencias de estudio', () => 'No pude conectar con la IA. Añade tus propios temas con el botón “Añadir”.');
    if (!result.fromAi) return;
    result.text.split('\n').map((x) => x.replace(/^[-•*\d.)\s]+/, '').replace(/\*\*/g, '').trim()).filter(Boolean).slice(0, 3).forEach((x) => addTopic(x, subject));
    renderTopics();
  }
  function spin(topic) {
    const seen = new Set(state.settings.recentTurns || []);
    const all = topic ? [topic] : state.topics.map((t) => t.name);
    if (!all.length) return toast('Añade cualquier tema para girar la ruleta.');
    const fresh = all.filter((name) => !seen.has(name)), choices = fresh.length ? fresh : all;
    const chosen = choices[Math.floor(Math.random() * choices.length)];
    state.settings.recentTurns = [chosen, ...(state.settings.recentTurns || []).filter((x) => x !== chosen)].slice(0, 8); save();
    runRoulettePhase(chosen, 'preparación', state.settings.roulettePrepare, () => runRoulettePhase(chosen, 'explicación', state.settings.rouletteExplain, () => {
      closeModal(); showPage('study'); $('#feynman-topic').value = chosen; $('#feynman-text').focus();
      toast('Fase terminada. Revisa tus preguntas socráticas.'); $('#feynman-feedback').click();
    }));
  }
  function runRoulettePhase(topic, phase, minutes, next) {
    const explain = phase === 'explicación', total = num(minutes, 1, 180, 1) * 60, endAt = Date.now() + total * 1000;
    modal(`<h2>Ruleta: ${esc(topic)}</h2><p>Fase de <b>${phase}</b>. ${explain ? 'Explícalo en voz alta y, si quieres revisión automática, deja una versión escrita.' : 'Estudia y recupera ideas clave.'}</p>${explain ? '<textarea id="roulette-explanation" placeholder="Escribe aquí tu explicación para enviarla al tutor socrático…"></textarea>' : ''}<div id="roulette-timer" class="roulette-timer">${time(total)}</div><button id="finish-roulette" class="outline-button" type="button">Terminar fase</button>`);
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

  /* =========================================================
     Ajustes, copia de seguridad y accesibilidad
     ========================================================= */
  function applyPreferences() {
    document.documentElement.style.setProperty('--base', `${state.settings.fontSize}px`);
    document.body.classList.toggle('theme-sepia', state.settings.theme === 'sepia');
    document.body.classList.toggle('theme-contrast', state.settings.theme === 'contrast');
    document.body.classList.toggle('font-dyslexic', state.settings.font === 'dyslexic');
    document.body.classList.toggle('reduce-motion', !!state.settings.reduceMotion);
  }
  function exportData() {
    const { apiKey, ...safe } = state; // nunca se exporta la clave
    const url = URL.createObjectURL(new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: `learny-copia-${today()}.json` });
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Copia descargada.');
  }
  function importData(file) {
    file.text().then((text) => {
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('formato');
      if (!confirm('Esto reemplazará tus datos actuales en este navegador. ¿Continuar?')) return;
      hydrate({ ...data, apiKey: state.apiKey }); save(); closeModal(); applyPreferences(); resetTimer('focus'); renderAll(); toast('Datos importados.');
    }).catch(() => toast('Ese archivo no es una copia válida de Learny.'));
  }
  function openSettings() {
    modal(`<h2>Ajustes</h2>
      <label>Tema<select name="theme"><option value="dark">Oscuro</option><option value="sepia">Sepia</option><option value="contrast">Alto contraste</option></select></label>
      <label>Fuente<select name="font"><option value="sans">Sans-serif legible</option><option value="dyslexic">Lectura fácil (OpenDyslexic si está instalada)</option></select></label>
      <label class="check"><input name="reduce" type="checkbox"> Reducir animaciones</label>
      <div class="form-row"><label>Pomodoro (min)<input name="focus" type="number" min="1" max="180" value="${state.settings.focus}"></label><label>Descanso (min)<input name="rest" type="number" min="1" max="60" value="${state.settings.rest}"></label><label>Ruleta: preparación<input name="prepare" type="number" min="1" max="180" value="${state.settings.roulettePrepare}"></label><label>Ruleta: explicación<input name="explain" type="number" min="1" max="180" value="${state.settings.rouletteExplain}"></label></div>
      <label>Clave de Gemini (opcional)<input name="apikey" type="password" autocomplete="off" placeholder="${state.apiKey ? 'Clave guardada (deja vacío para conservarla)' : 'Pega aquí tu clave'}"></label>
      <label>Modelo de Gemini<input name="model" value="${esc(state.settings.model)}"></label>
      <div class="actions"><button id="export-data" class="outline-button" type="button">Descargar copia</button><label class="outline-button" style="cursor:pointer">Importar copia<input id="import-file" type="file" accept="application/json,.json" hidden></label><button id="reset-data" class="outline-button" type="button">Borrar todo</button></div>
      <p class="modal-tip">Envíanos tus comentarios o sugerencias a: <a href="mailto:learnyxsv@gmail.com">learnyxsv@gmail.com</a></p>
      <button class="primary-button">Guardar preferencias</button>`, (data) => {
      Object.assign(state.settings, {
        theme: data.get('theme'), font: data.get('font'), reduceMotion: data.get('reduce') === 'on',
        focus: num(data.get('focus'), 1, 180, 25), rest: num(data.get('rest'), 1, 60, 5),
        roulettePrepare: num(data.get('prepare'), 1, 180, 10), rouletteExplain: num(data.get('explain'), 1, 180, 1),
        model: data.get('model').trim() || DEFAULT_MODEL
      });
      const key = data.get('apikey').trim(); if (key) { state.apiKey = key; state.settings.skipAi = false; }
      save(); applyPreferences(); closeModal(); if (!timer.running) resetTimer(timer.mode); renderAll();
    });
    const form = $('#modal-form');
    form.theme.value = state.settings.theme; form.font.value = state.settings.font; form.reduce.checked = !!state.settings.reduceMotion;
    $('#export-data').onclick = exportData;
    $('#import-file').onchange = (e) => { if (e.target.files[0]) importData(e.target.files[0]); };
    $('#reset-data').onclick = () => {
      if (!confirm('Se borrarán todas tus tarjetas, sesiones, fechas y ajustes de este navegador. ¿Seguro?')) return;
      try { localStorage.removeItem(KEY); localStorage.removeItem('learny.v1'); } catch { /* ignorar */ }
      hydrate({}); closeModal(); applyPreferences(); resetTimer('focus'); renderAll(); toast('Datos borrados.');
    };
  }
  function changeFont(delta) { state.settings.fontSize = Math.min(21, Math.max(14, state.settings.fontSize + delta)); save(); applyPreferences(); }

  /* =========================================================
     Conexión de eventos
     ========================================================= */
  const renderAll = () => { renderFocus(); renderDeadlines(); renderCard(); renderAnalysis(); renderLibrary(); renderTopics(); };

  $$('.nav-button').forEach((b) => { b.onclick = () => showPage(b.dataset.page); });
  $('#pomodoro-button').onclick = startPomodoro;
  $('#pomodoro-skip').onclick = () => resetTimer('focus');
  $('#pomodoro-reset').onclick = () => resetTimer('focus');
  $('#pomodoro-config').onclick = configurePomodoro;
  $('#add-deadline').onclick = addDeadline;
  $('#add-card').onclick = () => cardForm();
  $('#reveal-card').onclick = revealCard;
  $$('#rating-row button').forEach((b) => { b.onclick = () => rateCard(b.dataset.rating); });
  $('#card-edit').onclick = () => activeCard && cardForm(activeCard);
  $('#card-delete').onclick = () => deleteCard(activeCard);
  $('#card-archive').onclick = () => { if (!activeCard) return; activeCard.archived = true; save(); renderAll(); toast('Tarjeta enviada a la Biblioteca.'); };
  $('#feynman-feedback').onclick = feynman;
  $('#spin-roulette').onclick = () => spin();
  $('#settings-button').onclick = openSettings;
  $('#font-up').onclick = () => changeFont(1);
  $('#font-down').onclick = () => changeFont(-1);
  $('#topic-search').oninput = renderTopics;
  $('#topic-search').onkeydown = (e) => { if (e.key === 'Enter') $('#add-topic').click(); };
  $('#add-topic').onclick = () => { if (addTopic($('#topic-search').value)) { $('#topic-search').value = ''; renderTopics(); toast('Tema añadido a tu ruleta.'); } else toast('Escribe cualquier tema o concepto primero.'); };
  $('#suggest-topic').onclick = suggestTopic;
  $('#topic-results').onclick = (e) => {
    const del = e.target.closest('[data-delete-topic]'); if (del) { state.topics = state.topics.filter((t) => t.id !== del.dataset.deleteTopic); save(); renderTopics(); return; }
    const chip = e.target.closest('[data-topic]'); if (chip) spin(chip.dataset.topic);
  };
  $('#library-list').onclick = (e) => {
    const find = (attr) => state.cards.find((c) => c.id === e.target.dataset[attr]);
    const back = find('returnCard'); if (back) { back.archived = false; back.nextReview = today(); save(); renderAll(); toast('Tarjeta devuelta a la rotación.'); return; }
    const edit = find('editCard'); if (edit) { cardForm(edit); return; }
    const del = find('deleteCard'); if (del) deleteCard(del);
  };
  $('#deadline-list').onclick = (e) => { const id = e.target.dataset.deleteDeadline; if (id) { state.deadlines = state.deadlines.filter((d) => d.id !== id); save(); renderDeadlines(); } };

  $('#search-engine').value = state.settings.engine;
  $('#search-engine').onchange = (e) => { state.settings.engine = e.target.value; save(); };
  $('#ask-ai').onclick = () => {
    const query = $('#ai-question').value.trim(), engine = $('#search-engine').value;
    if (!query) return toast('Escribe una consulta.');
    if (engine === 'gemini') { gemini(`Actúa como Tutor Socrático en español. No entregues directamente la respuesta; formula preguntas guía, ofrece una pista breve y termina con una mini comprobación. Consulta: ${query}`, 'Tutor Learny', () => localSocratic(query)); return; }
    const urls = { google: `https://www.google.com/search?q=${encodeURIComponent(query)}`, wikipedia: `https://es.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`, perplexity: `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}` };
    window.open(urls[engine], '_blank', 'noopener');
  };
  $('#ai-question').onkeydown = (e) => { if (e.key === 'Enter') $('#ask-ai').click(); };

  // Atajos de teclado para las flashcards (solo si no estás escribiendo)
  document.addEventListener('keydown', (e) => {
    if (e.target !== document.body || modalOpen() || e.ctrlKey || e.metaKey || e.altKey || !activeCard) return;
    if (e.key === ' ' && !revealed) { e.preventDefault(); revealCard(); return; }
    const map = { 1: 'again', 2: 'hard', 3: 'easy' };
    if (revealed && !answered && map[e.key]) rateCard(map[e.key]);
  });

  applyPreferences(); resetTimer('focus'); renderAll();
})();
