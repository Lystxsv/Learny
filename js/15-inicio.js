/* Learny · parte 15 de 15 · Inicio
   Bienvenida, portada, banner de la demo y arranque de la app.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

/* Etapa 5: bienvenida opcional (4 pasos, todo opcional). Solo si no hay datos; Omitir, × o Esc la cierran y no vuelve sola.
   Los pasos ya confirmados con «Siguiente» se conservan; lo escrito en el paso abierto al omitir no se guarda. */
function welcomeFlow() {
  if (DEMO || state.settings.welcomed || hasUserData() || modalOpen()) return; // Etapa 7: la demo nunca abre la bienvenida
  const TIMES = [[10, '10 min', 'Algo corto'], [25, '25 min', 'Un Pomodoro'], [45, '45 min', 'Sesión larga']];
  const a = { name: '', subject: '', goal: '', minutes: 0 }, body = $('#modal-body');
  let i = 0, ended = false;
  const read = () => {
    const d = new FormData($('#modal-form')), v = (max) => clean(d.get('v') || '', max);
    if (i === 0) a.name = v(30); else if (i === 1) a.subject = v(60); else if (i === 2) a.goal = v(200);
    else { const m = Number(d.get('t')); if (TIMES.some((t) => t[0] === m)) a.minutes = m; }
  };
  const apply = () => { // solo campos que la bienvenida posee (estaban vacíos); el tiempo solo si se eligió uno
    const s = state.settings;
    s.name = a.name; s.tutor = { ...s.tutor, subject: a.subject, goal: a.goal };
    if (a.minutes) s.focus = a.minutes;
  };
  const end = (completed) => {
    if (ended) return; ended = true;
    body.removeEventListener('click', onClick);
    if (completed) apply();
    state.settings.welcomed = true; save();
    applyPreferences(); if (!timer.started) resetTimer(timer.mode); else renderTimer(); renderAll(); // applyPreferences refresca los campos del tutor: así fillTutor no pisa lo guardado con valores viejos
    closeModal();
    setTimeout(() => $('.page.active h1')?.focus({ preventScroll: true }), 0);
    if (completed) toast(`${a.name ? `Listo, ${a.name}. ` : 'Listo. '}Puedes cambiar todo esto en Ajustes ⚙️.`);
  };
  function onClick(e) {
    const b = e.target.closest('[data-w]'); if (!b) return;
    if (b.dataset.w === 'skip') end(false);
    else if (b.dataset.w === 'back' && i > 0) { read(); i--; render(); }
  }
  function render() {
    const last = i === 3, label = ['Nombre', 'Materia', 'Objetivo', 'Tiempo'][i];
    const field = [
      () => `<label>Tu nombre<input name="v" maxlength="30" autocomplete="given-name" enterkeyhint="next" value="${esc(a.name)}"></label>`,
      () => `<label>Materia o tema<input name="v" maxlength="60" placeholder="p. ej. Química" enterkeyhint="next" value="${esc(a.subject)}"></label>`,
      () => `<label>Objetivo<input name="v" maxlength="200" placeholder="p. ej. Aprobar el parcial del viernes" enterkeyhint="next" value="${esc(a.goal)}"></label>`,
      () => `<fieldset class="welcome-times"><legend class="sr-only">Tiempo de hoy</legend>${TIMES.map(([m, t, sub]) => `<label class="welcome-time"><input type="radio" name="t" value="${m}"${a.minutes === m ? ' checked' : ''}><span><b>${esc(t)}</b><small>${esc(sub)}</small></span></label>`).join('')}</fieldset>`
    ][i]();
    const title = ['¿Cómo quieres que te llame?', '¿Qué quieres estudiar?', '¿Qué quieres lograr?', '¿Cuánto tiempo tienes hoy?'][i];
    modal(`<p class="eyebrow">Paso ${i + 1} de 4 · ${esc(label)}</p><h2>${esc(title)}</h2>
        ${field}
        <p class="modal-tip">Todo es opcional y lo puedes cambiar después en Ajustes ⚙️.${last ? ' El tiempo ajusta la duración de tu Pomodoro.' : ''}</p>
        <div class="actions welcome-actions"><button class="text-button" type="button" data-w="skip">Omitir</button>${i ? '<button class="outline-button" type="button" data-w="back">Atrás</button>' : ''}<button class="primary-button" type="submit">${last ? 'Terminar' : 'Siguiente'}</button></div>`,
    () => { read(); if (last) end(true); else { apply(); save(); i++; render(); } },
    () => end(false)); // × o Esc: cerrar sin completar cuenta como omitir
  }
  body.addEventListener('click', onClick);
  render();
}

/* Etapa 6: portada pública. Capa aparte (#landing) sobre la app: no cambia datos ni claves. «Probar Learny» la cierra y abre la bienvenida (etapa 5). */
let landingOn = false;
function showLanding() {
  const el = $('#landing'); if (!el || DEMO) return; // Etapa 7: la demo no muestra la portada
  landingOn = true; el.hidden = false; document.body.classList.add('show-landing');
  window.scrollTo(0, 0); $('#landing-title')?.focus({ preventScroll: true });
}
function enterFromLanding() {
  if (!landingOn) return;
  landingOn = false; $('#landing').hidden = true; document.body.classList.remove('show-landing');
  window.scrollTo(0, 0); showPage('study'); $('#study h1')?.focus({ preventScroll: true });
  setTimeout(welcomeFlow, 150);
}
$('#landing')?.addEventListener('click', (e) => {
  const b = e.target.closest('[data-landing]'); if (!b) return;
  if (b.dataset.landing === 'start') enterFromLanding();
  else if (b.dataset.landing === 'demo') location.href = `${location.pathname}?demo`; // Etapa 7: entra a la demo (nueva carga, sin tocar datos reales)
  else if (b.dataset.landing === 'tour') {
    const t = $('#landing-tour'), calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    t?.scrollIntoView({ block: 'start', behavior: calm ? 'auto' : 'smooth' }); t?.focus({ preventScroll: true });
  }
});

/* Etapa 7: banner permanente, plan del examen de ejemplo y salida. Salir recarga sin ?demo: el espacio real (o la portada) decide solo. */
if (DEMO) {
  state.deadlines.forEach((d) => rebuildTasks(d, false));
  document.body.classList.add('is-demo');
  const bar = $('#demo-banner');
  if (bar) {
    bar.hidden = false;
    const fit = () => document.documentElement.style.setProperty('--demo-h', `${bar.offsetHeight}px`);
    fit(); window.addEventListener('resize', fit); if (window.ResizeObserver) new ResizeObserver(fit).observe(bar);
    $('#demo-exit').onclick = () => { location.href = location.pathname; };
    $('#demo-reset').onclick = async () => {
      if (await confirmDialog({ title: 'Reiniciar demo', message: 'Se restauran los datos de ejemplo. Tus datos reales no se tocan.', ok: 'Reiniciar' })) location.reload();
    };
  }
}

const savedTimer = (() => { try { return localStorage.getItem(TIMER_KEY); } catch { return null; } })();
applyPreferences(); resetTimer('focus', false); lastTimerRaw = savedTimer; restoreTimer(savedTimer);
renderAll(); maybeRemind(); backupNag();
{ const hash = location.hash.slice(1); if (['study', 'practice', 'library', 'planner', 'analysis', 'guide'].includes(hash)) showPage(hash); }
// Etapa 6: la portada es solo para quien nunca entró (sin datos, sin bienvenida, sin temporizador y sin enlace directo a una sección)
if (!state.settings.welcomed && !hasUserData() && !timer.started && !location.hash.slice(1)) showLanding();
// Avisos de arranque en cola: ninguno pisa a otro (lo más grave primero)
if (loadProblem) {
  if (corruptKept) queueToast('Tus datos guardados estaban dañados. Guardé una copia del archivo original en el navegador (learny.corrupt) y empecé de cero.', 'error');
  else queueToast('Tus datos guardados estaban dañados y NO pude guardar una copia (sin espacio o almacenamiento bloqueado). No los he tocado hasta que hagas un cambio: descarga el archivo original ahora.', 'error', { label: 'Descargar original', run: () => {
    const safeRaw = scrubKey(corruptRaw); // JS-009: el archivo se suele compartir para pedir ayuda: nunca lleva tu clave de Gemini
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([safeRaw], { type: 'text/plain' })); a.download = 'learny-datos-danados.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Archivo descargado. Se quitó tu clave de Gemini del contenido; el resto de tus datos sigue ahí.');
  } });
}
if (newerFrom) queueToast(newerKept
  ? `Estos datos son de una versión más nueva de Learny (v${newerFrom}) que esta (v${SCHEMA}). No los he modificado y esta versión no guardará cambios para no perder campos nuevos (hay además una copia intacta en learny.newer). Actualiza la app.`
  : `Estos datos son de una versión más nueva de Learny (v${newerFrom}) que esta (v${SCHEMA}). No los he modificado y esta versión no guardará cambios para no perder campos nuevos, pero NO pude guardar una copia aparte (sin espacio). Actualiza la app.`, 'error');
if (droppedCards) queueToast(`${plural(droppedCards, 'registro ilegible se omitió', 'registros ilegibles se omitieron')} al cargar tus tarjetas.`, 'error');
if (migratedFrom) { if (migrationBackup) queueToast(`Learny actualizó tus datos de la v${migratedFrom} a la v${SCHEMA}. Guardé una copia previa: Ajustes ⚙️ → Restaurar copia automática.`);
  else queueToast(`Learny actualizó tus datos de la v${migratedFrom} a la v${SCHEMA}, pero NO pudo guardar una copia previa (sin espacio). Descarga una copia ahora en Ajustes ⚙️.`, 'error'); }
safe(redistributeIfBehind, 'plan'); renderAll(); // JS-103: el aviso con «Deshacer» se encola DESPUÉS de los avisos graves de arranque (y antes de soltar bootHold, así no pisa datos protegidos)
bootHold = false;
if ((corruptKept || !loadProblem) && !newerFrom) { try { const json = JSON.stringify(state); localStorage.setItem(KEY, json); lastSavedRaw = json; } catch { /* ok */ } } // con datos dañados y sin copia, o de una versión más nueva (JS-004), no se pisa la clave principal en el arranque: lo guardado queda intacto y el resto de guardados los frena newerStored()
if (!state.settings.welcomed && !landingOn) setTimeout(welcomeFlow, 350); // Etapa 5 (con portada, la bienvenida abre al pulsar «Probar Learny»)
