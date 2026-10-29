/* Learny · parte 15 de 15 · Inicio
   Bienvenida, portada, banner de la demo y arranque de la app.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

/* Perfiles · Etapa 1: bienvenida de UNA pregunta («¿Para qué usas Learny?»). Tres botones grandes; el perfil se guarda al elegir
   (settings.profile: 'exam' | 'self' | 'teach'). Nombre, tiempo diario y apariencia pasan a un paso opcional («Personalizar»).
   Solo si no hay datos; Omitir, × o Esc la cierran y no vuelve sola. «Decidir después» deja el perfil en 'exam' (comportamiento de siempre).
   Etapa 3a: el paso «Personalizar» ofrece tamaño de texto, lectura fácil y reducir animaciones, con vista previa en vivo (applyAppearance).
   Nada se guarda hasta «Terminar»; Omitir, × o Esc restauran la apariencia guardada (end(false) llama a applyPreferences). Usa ajustes que ya existen: fontSize, font y reduceMotion. */
function welcomeFlow() {
  if (DEMO || state.settings.welcomed || hasUserData() || modalOpen()) return; // la demo nunca abre la bienvenida
  const PROFILES = [['exam', 'Tengo un examen', 'Plan con fecha, tareas diarias y repasos.'], ['self', 'Estudio por mi cuenta', 'Ritmo y temas, sin fecha de examen.'], ['teach', 'Enseño', 'Preparo material para mis alumnos.']];
  const TIMES = [[10, '10 min', 'Algo corto'], [25, '25 min', 'Un Pomodoro'], [45, '45 min', 'Sesión larga']];
  const SIZES = [[16, 'Normal', '16 px'], [19, 'Grande', '19 px'], [22, 'Muy grande', '22 px']];
  const a = { name: '', minutes: 0, fs: state.settings.fontSize, easy: state.settings.font === 'dyslexic', calm: !!state.settings.reduceMotion }, body = $('#modal-body');
  const fontFor = () => (a.easy ? 'dyslexic' : state.settings.font === 'dyslexic' ? 'sans' : state.settings.font);
  let step = 0, ended = false;
  const read = () => {
    const d = new FormData($('#modal-form'));
    a.name = clean(d.get('v') || '', 30);
    const m = Number(d.get('t')); if (TIMES.some((t) => t[0] === m)) a.minutes = m;
    const f = Number(d.get('fs')); if (SIZES.some((s) => s[0] === f)) a.fs = f;
    a.easy = d.get('easy') === 'on'; a.calm = d.get('calm') === 'on';
  };
  const preview = () => { // vista previa en vivo: no toca state.settings
    const d = { ...state.settings, fontSize: a.fs, font: fontFor(), reduceMotion: a.calm };
    sanitizeSettings(d, defaults().settings); applyAppearance(d);
  };
  const onKey = (e) => { if (e.key === 'Enter' && !composing(e) && e.target.matches?.('input[type="radio"], input[type="checkbox"]')) e.preventDefault(); }; // R5: Intro sobre un radio o una casilla enviaba el formulario y cerraba la bienvenida
  /* R12: cambiar tamaño, fuente o animaciones no tenía confirmación auditiva: ahora se anuncia (announce escribe en la región viva del diálogo abierto). */
  const onChange = (e) => {
    const t = e.target.closest('[name="fs"],[name="easy"],[name="calm"]'); if (!t) return; read(); preview();
    if (t.name === 'fs') announce(`Tamaño de texto: ${SIZES.find((s) => s[0] === a.fs)?.[1] || ''}.`);
    else if (t.name === 'easy') announce(a.easy ? 'Lectura fácil activada.' : 'Lectura fácil desactivada.');
    else announce(a.calm ? 'Animaciones reducidas.' : 'Animaciones normales.');
  };
  const end = (completed) => {
    if (ended) return; ended = true;
    body.removeEventListener('click', onClick); body.removeEventListener('change', onChange); body.removeEventListener('keydown', onKey);
    if (completed) {
      state.settings.name = a.name; if (a.minutes) state.settings.focus = a.minutes;
      state.settings.fontSize = a.fs; state.settings.font = fontFor(); state.settings.reduceMotion = a.calm;
      sanitizeSettings(state.settings, defaults().settings);
    }
    if (!state.settings.profile) state.settings.profile = 'exam';
    state.settings.welcomed = true; save();
    applyPreferences(); if (!timer.started) resetTimer(timer.mode); else renderTimer(); renderAll(); // applyPreferences() restaura la apariencia guardada si la vista previa no se confirmó
    closeModal();
    setTimeout(() => $('.page.active h1')?.focus({ preventScroll: true }), 0);
    if (completed) toast(`${a.name ? `Listo, ${a.name}. ` : 'Listo. '}Puedes cambiar todo esto en Ajustes.`);
  };
  function onClick(e) {
    const b = e.target.closest('[data-profile],[data-w]'); if (!b) return;
    if (b.dataset.profile) { state.settings.profile = b.dataset.profile; save(); applyProfileTexts(); step = 1; render(); }
    else if (b.dataset.w === 'later') end(false);
    else if (b.dataset.w === 'skip') end(false);
    else if (b.dataset.w === 'back') { read(); step = 0; render(); }
  }
  function render() {
    if (step === 0) {
      modal(`<p class="eyebrow">Bienvenida</p><h2>¿Para qué usas Learny?</h2>
        <div class="stuck-list">${PROFILES.map(([k, t, sub]) => `<button class="stuck-opt profile-opt" type="button" data-profile="${k}" aria-pressed="${state.settings.profile === k}"><b>${esc(t)}</b><small>${esc(sub)}</small></button>`).join('')}</div>
        <p class="modal-tip">Lo puedes cambiar después en Ajustes.</p>
        <div class="actions welcome-actions"><button class="text-button" type="button" data-w="later">Decidir después</button></div>`,
      () => {}, () => end(false));
      return;
    }
    const sysCalm = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    modal(`<p class="eyebrow">Personalizar · opcional</p><h2>¿Quieres ajustar algo más?</h2>
        <label>Tu nombre<input class="w-edge" name="v" maxlength="30" autocomplete="given-name" enterkeyhint="done" value="${esc(a.name)}"></label>
        <fieldset class="welcome-times"><legend class="sr-only">Tiempo de hoy</legend>${TIMES.map(([m, t, sub]) => `<label class="welcome-time"><input type="radio" name="t" value="${m}"${a.minutes === m ? ' checked' : ''}><span><b>${esc(t)}</b><small>${esc(sub)}</small></span></label>`).join('')}</fieldset>
        <h3 class="eyebrow">Accesibilidad</h3>
        <p class="hint" id="w-fs"><b>Tamaño de texto</b></p>
        <fieldset class="welcome-times" aria-labelledby="w-fs">${SIZES.map(([v, t, sub]) => `<label class="welcome-time"><input type="radio" name="fs" value="${v}"${a.fs === v ? ' checked' : ''}><span><b>${esc(t)}</b><small>${esc(sub)}</small></span></label>`).join('')}</fieldset>
        <label class="check"><input name="easy" type="checkbox"${a.easy ? ' checked' : ''}> Lectura fácil (OpenDyslexic si está instalada; si no, Verdana)</label>
        <label class="check"><input name="calm" type="checkbox"${a.calm ? ' checked' : ''}> Reducir animaciones</label>
        ${sysCalm ? '<p class="hint">Tu sistema ya pide reducir el movimiento: Learny lo respeta aunque no marques esto.</p>' : ''}
        <p class="hint">Los cambios se aplican al instante y se guardan al pulsar «Terminar».</p>
        <p class="modal-tip">Todo es opcional. El tiempo ajusta la duración de tu Pomodoro.</p>
        <div class="actions welcome-actions"><button class="text-button" type="button" data-w="skip">Omitir</button><button class="outline-button w-edge" type="button" data-w="back">Atrás</button><button class="primary-button" type="submit">Terminar</button></div>`,
    () => { read(); end(true); }, () => end(false));
    $('#modal-title')?.focus({ preventScroll: true }); // R4: el paso 2 reemplaza el contenido de un diálogo ya abierto; el foco va a su título para que se lea (antes iba al campo de nombre y el título no se oía)
  }
  body.addEventListener('click', onClick); body.addEventListener('change', onChange); body.addEventListener('keydown', onKey);
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
{ const hash = location.hash.slice(1); if (['study', 'practice', 'library', 'planner', 'analysis', 'guide', 'pro'].includes(hash)) showPage(hash); }
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
if (learningStatus.bad) queueToast('Las metas guardadas no tenían un formato válido y se ignoraron. Si tenías metas, restaura una copia automática en Ajustes.', 'error'); // Fase 1
if (learningStatus.newer) queueToast(`Tus metas se crearon con una versión más nueva de Learny (metas v${learningStatus.newerV}): aquí solo se pueden ver y se conservan intactas. Actualiza la app.`, 'error');
if (learningStatus.omitted > 0) queueToast(`${plural(learningStatus.omitted, 'elemento de tus metas se omitió', 'elementos de tus metas se omitieron')} al cargar por pasar los límites. Hay una copia automática en Ajustes por si la necesitas.`, 'error');
if (droppedCards) queueToast(`${plural(droppedCards, 'registro ilegible se omitió', 'registros ilegibles se omitieron')} al cargar tus tarjetas.`, 'error');
if (migratedFrom) { if (migrationBackup) queueToast(`Learny actualizó tus datos de la v${migratedFrom} a la v${SCHEMA}. Guardé una copia previa: Ajustes → Restaurar copia automática.`);
  else queueToast(`Learny actualizó tus datos de la v${migratedFrom} a la v${SCHEMA}, pero NO pudo guardar una copia previa (sin espacio). Descarga una copia ahora en Ajustes.`, 'error'); }
safe(redistributeIfBehind, 'plan'); renderAll(); // JS-103: el aviso con «Deshacer» se encola DESPUÉS de los avisos graves de arranque (y antes de soltar bootHold, así no pisa datos protegidos)
bootHold = false;
if ((corruptKept || !loadProblem) && !newerFrom) { try { const json = JSON.stringify(state); localStorage.setItem(KEY, json); lastSavedRaw = json; } catch { /* ok */ } } // con datos dañados y sin copia, o de una versión más nueva (JS-004), no se pisa la clave principal en el arranque: lo guardado queda intacto y el resto de guardados los frena newerStored()
if (!state.settings.welcomed && !landingOn) setTimeout(welcomeFlow, 350); // Etapa 5 (con portada, la bienvenida abre al pulsar «Probar Learny»)
