/* Learny · parte 22 · Metas (modo autodidacta) · interfaz (Fase 2: metas, ruta de etapas, práctica y evidencias · Fase 3a: tarjetas ligadas a una etapa)
   Fase 3a: cada etapa puede vincularse a UNA materia de tarjetas (stage.subject, ya validado por sanitizeLearning contra goal.subjects; sin cambiar el esquema). Desde la etapa se repasan, se practican y se crean tarjetas de esa materia, y se puede comprobar la etapa con ellas (checkedHow 'cards', con una evidencia automática). Las tarjetas no cambian: SM-2 sigue igual.
   Usa el contenedor state.learning definido en 01c-metas-datos.js (sin cambiar SCHEMA). Solo se muestra con settings.profile === 'self' (tarjeta «Mis metas» en Planificar); con otros perfiles nada cambia.
   Qué hace: crear/editar/eliminar metas; ruta de etapas que se pueden añadir, mover, dividir y saltar; «Esto ya lo sé»; autoevaluación por niveles; evidencias en texto o enlace;
   comprobación por una actividad (necesita al menos una evidencia). La autoevaluación (nivel) y la comprobación (checked) son cosas distintas y NO hay un botón único de «dominado».
   No toca SM-2, Pomodoro, Feynman ni estadísticas. Todo texto del usuario va en translate="no". Si el contenedor es de una versión más nueva (solo lectura) no se edita nada.
   Se carga con <script defer> después de 21-quiz.js y antes de extras.js (comparte el ámbito global; no hay import/export). Expone window.LearnyGoals para las pruebas. */
'use strict';

(() => {
  const LV = { '': 'Sin marcar', explore: 'Lo estoy explorando', help: 'Con ayuda', alone: 'Sin ayuda', transfer: 'Lo apliqué en otra situación', review: 'Necesito repasarlo' };
  const SS = { todo: 'Por hacer', doing: 'En curso', done: 'Hecha', skipped: 'Saltada', known: 'Ya la sabía' };
  const GS = { active: 'Activa', paused: 'En pausa', done: 'Terminada', archived: 'Archivada' };
  const TPL = ['Entender lo básico', 'Practicar con ayuda', 'Practicar sin ayuda', 'Aplicarlo en algo real'];
  const T = (s) => `<span translate="no">${esc(s)}</span>`; // texto del usuario: el traductor de la interfaz no lo toca
  const gOf = (id) => state.learning.goals.find((g) => g.id === id);
  const sOf = (g, id) => (g ? g.stages.find((s) => s.id === id) : undefined);
  const counts = (g) => { const live = g.stages.filter((s) => s.status !== 'skipped'); return { n: live.length, ok: live.filter((s) => s.status === 'done' || s.status === 'known').length, chk: live.filter((s) => s.checked).length }; };
  const newStage = (title, f = {}) => ({ id: uid(), title: clean(title, 100), learn: clean(f.learn, 200), practice: clean(f.practice, 200), check: clean(f.check, 200), status: 'todo', level: '', subject: '', checked: false, checkedHow: '', checkedAt: '', evidence: [], origin: f.origin || '' });
  /* Tarjetas de una materia (vivas) y su estado. «recordadas» = el último repaso no fue «No lo sabía». Es autoevaluación, no una prueba de dominio. */
  const cardsOf = (sub) => state.cards.filter((c) => !c.archived && !c.corrupt && norm(c.subject) === norm(sub));
  const cardInfo = (sub) => {
    const all = cardsOf(sub), seen = all.filter((c) => (c.history || []).length), ok = seen.filter((c) => lastOf(c.history).rating !== 'again');
    const due = dueCards().filter((c) => norm(c.subject) === norm(sub)).length;
    return { total: all.length, seen: seen.length, ok: ok.length, due, ready: all.length >= 3 && seen.length === all.length && ok.length === seen.length };
  };
  let cg = '', curStage = '', backFn = null; // meta abierta y «volver» del formulario abierto

  const readOnly = () => { if (!learningReadOnly()) return false; toast(learningRoom('goal').why, 'error'); return true; };
  const room = (kind) => { if (readOnly()) return false; const r = learningRoom(kind); if (!r.ok) toast(r.why, 'error'); return r.ok; };
  const gone = () => { closeModal(); toast('Esa meta ya no existe (otra pestaña la cambió).', 'error'); };
  const commit = () => { save(); renderAll(); };

  /* ---------- Tarjeta «Mis metas» en Planificar ---------- */
  const card = (() => {
    const at = $('#week-calendar-card'); if (!at) return null;
    const el = document.createElement('article'); el.className = 'card'; el.id = 'goals-card'; el.hidden = true; at.insertAdjacentElement('beforebegin', el); return el;
  })();
  let lastHtml = '';
  function renderGoals() {
    if (!card) return;
    const on = typeof isSelf === 'function' && isSelf();
    card.hidden = !on; if (!on || currentPage !== 'planner') return;
    const list = state.learning.goals.filter((g) => g.status !== 'archived' && !g.parentId);
    const rows = list.map((g) => { const c = counts(g);
      return `<div class="session-item"><b>${T(g.title)}</b> <span class="tag">${GS[g.status]}</span><br><span>${c.n ? `${plural(c.ok, 'hecha', 'hechas')} de ${plural(c.n, 'etapa', 'etapas')}` : 'Aún sin etapas'}</span>${c.chk ? ` · <span>${plural(c.chk, 'comprobada', 'comprobadas')} con una actividad</span>` : ''}${g.targetDate ? ` · <span>Fecha objetivo: <span translate="no">${esc(g.targetDate)}</span></span>` : ''}<br><button class="text-button" type="button" data-g="open" data-id="${esc(g.id)}">Abrir</button></div>`; }).join('');
    const html = `<div class="card-head"><div><h2>Mis metas</h2><p class="lead">Lo que quieres aprender, dividido en etapas que tú puedes cambiar. Sin fecha obligatoria.</p></div><button class="primary-button" type="button" data-g="new">+ Nueva meta</button></div>${rows || '<p class="empty">Aún no tienes metas. Crea una con lo que quieras aprender.</p>'}${learningReadOnly() ? '<p class="hint">Estas metas se crearon con una versión más nueva de Learny: aquí solo se pueden ver.</p>' : ''}`;
    if (html !== lastHtml) { card.innerHTML = html; lastHtml = html; }
  }
  if (card) card.onclick = (e) => { const b = e.target.closest('[data-g]'); if (!b) return; if (b.dataset.g === 'new') goalForm(); else if (b.dataset.g === 'open') openGoal(b.dataset.id); };
  ['learny:render', 'learny:page'].forEach((ev) => document.addEventListener(ev, () => { try { renderGoals(); } catch (e) { console.error('Learny · metas', e); } }));

  /* ---------- Ventanas ---------- */
  function show(html, onSubmit, back) {
    backFn = back || null;
    modal(html, onSubmit, () => { $('#modal-body').onclick = null; backFn = null; });
    $('#modal-body').onclick = onClick;
  }
  const cancel = '<button class="outline-button" type="button" data-g="back">Cancelar</button>';

  function goalForm(id) {
    const g = id ? gOf(id) : null; if (id && !g) return gone();
    if (!g && !room('goal')) return;
    show(`<h2>${g ? 'Editar meta' : 'Nueva meta'}</h2>
      <label>¿Qué quieres aprender?<input name="title" required maxlength="120" value="${esc(g?.title || '')}"></label>
      <label>¿Para qué? (opcional)<input name="why" maxlength="200" value="${esc(g?.why || '')}"></label>
      <label>¿Dónde estás ahora? (opcional)<textarea name="current" maxlength="300" rows="2" style="min-height:64px">${esc(g?.current || '')}</textarea></label>
      <label>¿Qué resultado esperas? (opcional)<input name="outcome" maxlength="200" value="${esc(g?.outcome || '')}"></label>
      <div class="form-row"><label>Minutos por semana (opcional)<input name="weekly" type="number" min="15" max="2400" value="${g?.weeklyMin || ''}"></label>
      <label>Fecha objetivo (opcional)<input name="target" type="date" min="${today()}" value="${esc(g?.targetDate || '')}"></label></div>
      ${g ? `<label>Estado<select name="status">${Object.entries(GS).map(([k, t]) => `<option value="${k}"${g.status === k ? ' selected' : ''}>${t}</option>`).join('')}</select></label>`
        : '<label>Ruta inicial<select name="tpl"><option value="">Empezar sin etapas</option><option value="basic">Plantilla de 4 etapas (editable)</option></select></label>'}
      <p class="modal-tip">Solo la primera pregunta es obligatoria. No hay cuenta regresiva: la fecha es solo una referencia.</p>
      <div class="actions"><button class="primary-button">Guardar</button>${cancel}</div>`, (d) => {
      const t = clean(d.get('title'), 120); if (!t) return toast('Escribe qué quieres aprender.', 'error');
      const w = Math.round(Number(d.get('weekly'))), tg = String(d.get('target') || '');
      const f = { title: t, why: clean(d.get('why'), 200), current: clean(d.get('current'), 300), outcome: clean(d.get('outcome'), 200), weeklyMin: Number.isFinite(w) && w >= 15 ? Math.min(2400, w) : 0, targetDate: isDay(tg) && tg >= today() ? tg : '' };
      if (g) { const cur = gOf(g.id); if (!cur) return gone(); if (readOnly()) return; Object.assign(cur, f, { status: LEARN_ENUM.goalStatus.includes(d.get('status')) ? d.get('status') : cur.status }); commit(); toast('Meta actualizada.'); openGoal(cur.id); return; }
      if (!room('goal')) return;
      const ng = { id: uid(), parentId: '', ...f, subjects: [], status: 'active', created: today(), stages: [] };
      if (d.get('tpl') === 'basic') TPL.forEach((x) => ng.stages.push(newStage(x, { origin: 'template' })));
      state.learning.goals.push(ng); commit(); toast('Meta creada.'); openGoal(ng.id);
    }, () => (g ? openGoal(g.id) : closeModal()));
  }

  function openGoal(id) {
    const g = gOf(id); if (!g) return gone();
    cg = id; const c = counts(g);
    const line = (k, v) => (v ? `<p><b>${k}</b> ${T(v)}</p>` : '');
    const btn = (k, s, t, extra = '') => `<button type="button" class="text-button" data-g="${k}" data-s="${esc(s)}"${extra}>${t}</button>`;
    show(`<p class="eyebrow">Meta · ${GS[g.status]}</p><h2 translate="no">${esc(g.title)}</h2>
      ${line('Resultado esperado:', g.outcome)}${line('Para qué:', g.why)}${line('Dónde estoy:', g.current)}
      ${g.weeklyMin ? `<p><b>Tiempo por semana:</b> ${g.weeklyMin} min</p>` : ''}${g.targetDate ? `<p><b>Fecha objetivo:</b> <span translate="no">${esc(g.targetDate)}</span></p>` : ''}
      <p class="modal-tip">${c.n ? `${plural(c.ok, 'hecha', 'hechas')} de ${plural(c.n, 'etapa', 'etapas')} · ${plural(c.chk, 'comprobada', 'comprobadas')} con una actividad.` : 'Aún no hay etapas. Añade la primera o usa la plantilla.'} Marcar una etapa como hecha no es lo mismo que comprobarla.</p>
      ${g.stages.length ? `<ol class="steps">${g.stages.map((s, i) => `<li><b>${T(s.title)}</b> <span class="tag">${SS[s.status]}</span>${s.level ? ` <span class="tag">${LV[s.level]}</span>` : ''}${s.checked ? ` <span class="tag">${icon('check')} Comprobada</span>` : ''}<br>
        ${btn('stage', s.id, 'Abrir etapa')} ${btn('up', s.id, 'Subir', i ? '' : ' disabled')} ${btn('down', s.id, 'Bajar', i < g.stages.length - 1 ? '' : ' disabled')} ${btn('split', s.id, 'Dividir')} ${btn('skip', s.id, s.status === 'skipped' ? 'Reactivar' : 'Saltar')}</li>`).join('')}</ol>` : ''}
      <div class="actions"><button class="primary-button" type="button" data-g="addstage">+ Añadir etapa</button><button class="outline-button" type="button" data-g="editgoal">Editar meta</button><button class="text-button danger" type="button" data-g="delgoal">Eliminar meta</button><button class="outline-button" type="button" data-close-modal>Cerrar</button></div>`);
  }

  function stageForm(sid) {
    const g = gOf(cg); if (!g) return gone();
    const s = sid ? sOf(g, sid) : null; if (!s && !room('stage')) return;
    const ta = (n, k, v) => `<label>${k}<textarea name="${n}" maxlength="200" rows="2" style="min-height:64px">${esc(v || '')}</textarea></label>`;
    show(`<h2>${s ? 'Editar etapa' : 'Nueva etapa'}</h2><label>Título<input name="title" required maxlength="100" value="${esc(s?.title || '')}"></label>
      ${ta('learn', 'Qué aprender', s?.learn)}${ta('practice', 'Práctica', s?.practice)}${ta('check', 'Cómo lo comprobarás', s?.check)}
      <div class="actions"><button class="primary-button">Guardar</button>${cancel}</div>`, (d) => {
      const cur = gOf(cg); if (!cur) return gone(); if (readOnly()) return;
      const t = clean(d.get('title'), 100); if (!t) return toast('El título de la etapa no puede quedar en blanco.', 'error');
      const f = { learn: clean(d.get('learn'), 200), practice: clean(d.get('practice'), 200), check: clean(d.get('check'), 200) };
      const st = s && sOf(cur, s.id);
      if (st) { Object.assign(st, f, { title: t }); commit(); openStage(st.id); return; }
      if (!room('stage')) return;
      const n = newStage(t, f); cur.stages.push(n); commit(); toast('Etapa añadida.'); openGoal(cg);
    }, () => (s ? openStage(s.id) : openGoal(cg)));
  }

  function openStage(sid) {
    curStage = sid; const g = gOf(cg), s = sOf(g, sid); if (!s) return g ? openGoal(cg) : gone();
    const line = (k, v) => (v ? `<p><b>${k}</b> ${T(v)}</p>` : '');
    show(`<p class="eyebrow"><span translate="no">${esc(g.title)}</span> · ${SS[s.status]}</p><h2 translate="no">${esc(s.title)}</h2>
      ${line('Qué aprender:', s.learn)}${line('Práctica:', s.practice)}${line('Cómo lo comprobarás:', s.check)}
      <div class="guided-feedback"><b>Mi autoevaluación:</b> ${LV[s.level]}.<br><b>Comprobación por una actividad:</b> ${s.checked ? `Sí, el <span translate="no">${esc(s.checkedAt || '')}</span>, ${s.checkedHow === 'cards' ? 'con tus tarjetas' : 'con evidencia'}.` : 'Todavía no.'}</div>
      <h3 class="alts-head">Evidencias</h3>
      ${s.evidence.length ? `<ul class="closure-list">${s.evidence.map((e) => `<li><span translate="no">${esc(e.date)}</span> · ${e.url ? `<a href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.text || e.url)}</a>` : T(e.text)} <button type="button" class="text-button danger" data-g="evdel" data-e="${esc(e.id)}">Quitar<span class="sr-only"> ${T(e.text || e.url)}</span></button></li>`).join('')}</ul>` : '<p class="empty">Aún no hay evidencias. Una nota o un enlace a lo que hiciste.</p>'}
      <div class="actions"><button class="outline-button" type="button" data-g="evi">+ Añadir evidencia</button>${s.checked ? '<button class="outline-button" type="button" data-g="uncheck">Quitar comprobación</button>' : `<button class="primary-button" type="button" data-g="check"${s.evidence.length ? '' : ' disabled'}>Comprobar con mi evidencia</button>`}</div>
      ${cardsBlock(s)}
      <div class="actions"><button class="outline-button" type="button" data-g="level">Cambiar mi autoevaluación</button><button class="outline-button" type="button" data-g="done">${s.status === 'done' ? 'Marcar como pendiente' : 'Marcar como hecha'}</button>${s.status === 'known' ? '' : '<button class="outline-button" type="button" data-g="known">Esto ya lo sé</button>'}</div>
      <div class="actions"><button class="outline-button" type="button" data-g="editstage">Editar</button><button class="text-button danger" type="button" data-g="delstage">Eliminar etapa</button><button class="outline-button" type="button" data-g="goal">Volver a la meta</button></div>`);
  }

  function cardsBlock(s) {
    if (!s.subject) return `<h3 class="alts-head">Tarjetas de esta etapa</h3><p class="empty">Esta etapa aún no tiene una materia de tarjetas. Vincula una para repasar y comprobar con ellas.</p><div class="actions"><button class="outline-button" type="button" data-g="cardlink">Vincular materia</button></div>`;
    const i = cardInfo(s.subject);
    return `<h3 class="alts-head">Tarjetas de esta etapa</h3><p><b>Materia vinculada:</b> ${T(s.subject)}</p>
      <p>Tarjetas: ${i.total} · ${i.due} por repasar hoy · ${i.seen} de ${i.total} repasadas · ${i.ok} recordadas</p>
      <div class="actions"><button class="primary-button" type="button" data-g="cardrev"${i.due ? '' : ' disabled'}>Repasar las de hoy</button><button class="outline-button" type="button" data-g="cardquiz"${i.total ? '' : ' disabled'}>Practicar errores primero</button><button class="outline-button" type="button" data-g="cardnew">+ Crear tarjeta</button></div>
      <div class="actions">${s.checked ? '' : `<button class="outline-button" type="button" data-g="cardcheck"${i.ready ? '' : ' disabled'}>Comprobar con tarjetas</button>`}<button class="text-button" type="button" data-g="cardlink">Cambiar materia</button><button class="text-button danger" type="button" data-g="cardunlink">Quitar vínculo</button></div>
      ${s.checked || i.ready ? '' : '<p class="hint">Para comprobar con tarjetas: al menos 3, todas repasadas y ninguna marcada «No lo sabía» la última vez.</p>'}`;
  }
  function cardLinkForm(sid) {
    const g = gOf(cg), s = sOf(g, sid); if (!s) return gone();
    show(`<h2>Vincular materia de tarjetas</h2><p>Las tarjetas de esa materia serán las de esta etapa. Una materia puede servir a varias etapas.</p>
      <label>Materia<input name="subject" list="subject-list" maxlength="60" value="${esc(s.subject || '')}" required></label>
      <p class="modal-tip">Si la materia aún no existe, se usará al crear la primera tarjeta desde la etapa.</p>
      <div class="actions"><button class="primary-button">Vincular</button>${cancel}</div>`, (d) => {
      const cur = gOf(cg), st = cur && sOf(cur, sid); if (!st) return gone(); if (readOnly()) return;
      const sub = clean(d.get('subject'), 60); if (!sub) return toast('Escribe la materia de tus tarjetas.', 'error');
      let name = cur.subjects.find((x) => x.toLowerCase() === sub.toLowerCase());
      if (!name) { if (cur.subjects.length >= LEARN_LIMITS.subjects) return toast(`Una meta admite hasta ${LEARN_LIMITS.subjects} materias.`, 'error'); cur.subjects.push(sub); name = sub; }
      st.subject = name; commit(); toast('Materia vinculada.'); openStage(sid);
    }, () => openStage(sid));
  }
  function cardAction(k, s) {
    const sub = s.subject; if (!sub) return;
    $('#modal-body').onclick = null; backFn = null;
    if (k === 'cardrev') { const pool = dueCards().filter((c) => norm(c.subject) === norm(sub)); if (!pool.length) return toast('No hay tarjetas de esa materia por repasar hoy.', 'error'); closeModal(); showPage('practice'); startExam(pool, 20); }
    else if (k === 'cardquiz') { closeModal(); startSubjectQuiz(cardsOf(sub)[0]?.subject); }
    else if (k === 'cardnew') cardForm(null, { subject: sub });
  }
  function cardCheck(s) {
    const i = cardInfo(s.subject); if (!i.ready) return toast('Aún no se cumplen las condiciones para comprobar con tarjetas.', 'error');
    if (s.evidence.length >= LEARN_LIMITS.evidencePerStage) return toast(`Cada etapa admite hasta ${LEARN_LIMITS.evidencePerStage} evidencias. Quita alguna para añadir otra.`, 'error');
    if (!room('evidence')) return;
    const was = snap(s), n = s.evidence.length;
    s.evidence.push({ id: uid(), date: today(), kind: 'text', text: `Tarjetas de «${s.subject}»: ${i.ok} de ${i.total} recordadas en su último repaso.`, url: '' });
    markChecked(s, 'cards'); commit(); openStage(s.id);
    offerUndo('Etapa comprobada con tus tarjetas.', () => { Object.assign(s, was); s.evidence.length = n; save(); renderAll(); });
  }

  function levelForm(sid) {
    const g = gOf(cg), s = sOf(g, sid); if (!s) return gone();
    show(`<h2>Mi autoevaluación</h2><p>Cómo sientes esta etapa ahora. Es tu opinión: no cuenta como comprobación.</p>
      <fieldset class="choice-list"><div class="scale">${Object.entries(LV).map(([k, t]) => `<label class="check"><input type="radio" name="level" value="${k}"${s.level === k ? ' checked' : ''}> ${t}</label>`).join('')}</div></fieldset>
      <div class="actions"><button class="primary-button">Guardar</button>${cancel}</div>`, (d) => {
      const cur = sOf(gOf(cg), sid); if (!cur) return gone(); if (readOnly()) return;
      cur.level = LEARN_ENUM.level.includes(d.get('level')) ? d.get('level') : ''; if (cur.level && cur.status === 'todo') cur.status = 'doing';
      commit(); openStage(sid);
    }, () => openStage(sid));
  }

  function evidenceForm(sid, auto) {
    const g = gOf(cg), s = sOf(g, sid); if (!s) return gone();
    if (s.evidence.length >= LEARN_LIMITS.evidencePerStage) return toast(`Cada etapa admite hasta ${LEARN_LIMITS.evidencePerStage} evidencias. Quita alguna para añadir otra.`, 'error');
    if (!room('evidence')) return;
    show(`<h2>Añadir evidencia</h2><p>${auto ? 'Para comprobar lo que ya sabes, muestra algo que lo demuestre.' : 'Una nota sobre lo que hiciste o un enlace a ello.'}</p>
      <label>Qué hiciste o qué lo demuestra<textarea name="text" maxlength="500" rows="3" style="min-height:80px"></textarea></label>
      <label>Enlace (opcional, https://…)<input name="url" type="url" inputmode="url" maxlength="200"></label>
      <div class="actions"><button class="primary-button">Guardar</button>${cancel}</div>`, (d) => {
      const cur = sOf(gOf(cg), sid); if (!cur) return gone(); if (!room('evidence')) return;
      const text = clean(d.get('text'), 500), raw = String(d.get('url') || '').trim(), url = lUrl(raw);
      if (raw && !url) return toast('El enlace debe empezar por http:// o https://.', 'error');
      if (!text && !url) return toast('Escribe una nota o pega un enlace.', 'error');
      cur.evidence.push({ id: uid(), date: today(), kind: url ? 'link' : 'text', text, url });
      if (auto) markChecked(cur); commit(); toast(auto ? 'Evidencia guardada y etapa comprobada.' : 'Evidencia guardada.'); openStage(sid);
    }, () => openStage(sid));
  }
  function markChecked(s, how = 'practice') { s.checked = true; s.checkedHow = how; s.checkedAt = today(); if (s.status !== 'known') s.status = 'done'; }

  function knownDialog(sid) {
    show(`<h2>Esto ya lo sé</h2><p>Puedes comprobarlo con una actividad o seguir adelante sin comprobarlo. En los dos casos la etapa queda como «Ya la sabía».</p>
      <div class="stuck-list"><button class="stuck-opt" type="button" data-g="known-check" data-s="${esc(sid)}"><b>Comprobarlo ahora</b><small>Añade una evidencia que lo demuestre.</small></button>
      <button class="stuck-opt" type="button" data-g="known-skip" data-s="${esc(sid)}"><b>Continuar sin comprobar</b><small>Queda marcada como ya sabida, sin comprobación.</small></button></div>
      <div class="actions">${cancel}</div>`, undefined, () => openStage(sid));
  }

  /* ---------- Acciones ---------- */
  function onClick(e) {
    const b = e.target.closest('[data-g]'); if (!b || b.disabled) return;
    const k = b.dataset.g, sid = b.dataset.s, g = gOf(cg), s = sOf(g, sid);
    if (k === 'back') { if (backFn) backFn(); return; }
    if (k === 'goal') return openGoal(cg);
    if (!g) return gone();
    if (k === 'addstage') return stageForm();
    if (k === 'editgoal') return readOnly() ? undefined : goalForm(cg);
    if (k === 'delgoal') return delGoal(g);
    if (k === 'stage') return openStage(sid);
    if (k === 'cardrev' || k === 'cardquiz' || k === 'cardnew') return cardAction(k, stageNow(e, true) || {});
    if (readOnly()) return;
    if (k === 'cardlink') return cardLinkForm(stageNow(e));
    if (k === 'cardunlink') { const t = stageNow(e, true); if (t) { t.subject = ''; commit(); openStage(t.id); toast('Vínculo quitado.'); } return; }
    if (k === 'cardcheck') return cardCheck(stageNow(e, true) || {});
    const i = g.stages.indexOf(s);
    if (k === 'up' && i > 0) { [g.stages[i - 1], g.stages[i]] = [g.stages[i], g.stages[i - 1]]; commit(); openGoal(cg); announce('Etapa movida hacia arriba.'); }
    else if (k === 'down' && i >= 0 && i < g.stages.length - 1) { [g.stages[i + 1], g.stages[i]] = [g.stages[i], g.stages[i + 1]]; commit(); openGoal(cg); announce('Etapa movida hacia abajo.'); }
    else if (k === 'split' && s) { if (!room('stage')) return; g.stages.splice(i + 1, 0, newStage(`${s.title.slice(0, 92)} (2)`)); commit(); openGoal(cg); toast('Etapa dividida: la segunda parte está debajo. Edítala para darle su contenido.'); }
    else if (k === 'skip' && s) { s.status = s.status === 'skipped' ? 'todo' : 'skipped'; commit(); openGoal(cg); }
    else if (k === 'editstage') stageForm(sid || stageNow(e));
    else if (k === 'level') levelForm(stageNow(e));
    else if (k === 'evi') evidenceForm(stageNow(e), false);
    else if (k === 'evdel') delEvidence(b.dataset.e);
    else if (k === 'check') { const t = stageNow(e, true); if (t && t.evidence.length) { const was = snap(t); markChecked(t); commit(); openStage(t.id); offerUndo('Etapa comprobada con tu evidencia.', () => { Object.assign(t, was); save(); renderAll(); }); } }
    else if (k === 'uncheck') { const t = stageNow(e, true); if (t) { t.checked = false; t.checkedHow = ''; t.checkedAt = ''; if (t.status === 'done') t.status = 'doing'; commit(); openStage(t.id); } }
    else if (k === 'done') { const t = stageNow(e, true); if (t) { t.status = t.status === 'done' ? 'doing' : 'done'; commit(); openStage(t.id); } }
    else if (k === 'known') knownDialog(stageNow(e));
    else if (k === 'known-skip') { if (s) { s.status = 'known'; commit(); openStage(sid); } }
    else if (k === 'known-check') { if (s) { s.status = 'known'; save(); evidenceForm(sid, true); } }
    else if (k === 'delstage') delStage(stageNow(e, true));
  }
  const stageNow = (e, obj) => (obj ? sOf(gOf(cg), curStage) : curStage); // la etapa abierta (openStage la recuerda)
  const snap = (s) => ({ status: s.status, checked: s.checked, checkedHow: s.checkedHow, checkedAt: s.checkedAt });

  function delEvidence(eid) {
    const s = sOf(gOf(cg), curStage); if (!s) return; const i = s.evidence.findIndex((x) => x.id === eid); if (i < 0) return;
    const [ev] = s.evidence.splice(i, 1); if (s.checked && !s.evidence.length) { s.checked = false; s.checkedHow = ''; s.checkedAt = ''; } // sin evidencias no puede seguir comprobada
    commit(); openStage(s.id); toast('Evidencia quitada.');
  }
  function delStage(s) {
    const g = gOf(cg); if (!g || !s) return; const i = g.stages.indexOf(s); g.stages.splice(i, 1); commit(); openGoal(cg);
    offerUndo('Etapa eliminada.', () => { const cur = gOf(g.id); if (!cur) return false; cur.stages.splice(Math.min(i, cur.stages.length), 0, s); save(); renderAll(); });
  }
  async function delGoal(g) {
    if (!(await confirmDialog({ title: 'Eliminar meta', message: `Se eliminará «${g.title}» con sus etapas y evidencias.\nAntes se guarda una copia automática.`, ok: 'Eliminar', danger: true }))) return;
    const cur = gOf(g.id); if (!cur) return; snapshot('delete-goal');
    const i = state.learning.goals.indexOf(cur), res = state.learning.resources.filter((r) => r.goalId === cur.id), dbt = state.learning.doubts.filter((d) => d.goalId === cur.id), lg = state.learning.log.filter((l) => l.goalId === cur.id);
    state.learning.goals.splice(i, 1); const gone2 = (x) => x.goalId !== cur.id;
    state.learning.resources = state.learning.resources.filter(gone2); state.learning.doubts = state.learning.doubts.filter(gone2); state.learning.log = state.learning.log.filter(gone2);
    closeModal(); commit();
    offerUndo('Meta eliminada.', () => { const L = state.learning; L.goals.splice(Math.min(i, L.goals.length), 0, cur); L.resources.push(...res); L.doubts.push(...dbt); L.log.push(...lg); save(); renderAll(); });
  }

  window.LearnyGoals = Object.freeze({ cardInfo, counts, open: openGoal, form: goalForm });
})();
