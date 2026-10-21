/* Learny · parte 13 de 15 · Ajustes
   Estilos rápidos, ambientes, ventana de Ajustes, recordatorios y contexto del tutor.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

const APP_KEYS = ['theme', 'accent', 'accentCustom', 'radius', 'cardStyle', 'bgStyle', 'density', 'font', 'headFont', 'fontSize', 'lineHeight', 'letterSpacing', 'cardText', 'contentWidth', 'sidebar', 'showMissions', 'showFact', 'reduceMotion', 'immersiveDim'];
/* Estilos rápidos (Ajustes) y ambientes de estudio: Noche = noche, Minimalista = enfoque, Biblioteca = nuevo (cálido, sobre Sepia + serif). */
const QS_KEEP = ['accent', 'accentCustom', 'showMissions', 'showFact', 'reduceMotion', 'immersiveDim'];
const QS_DEF = {
  cuaderno: {},
  noche: { theme: 'oled', font: 'serif', lineHeight: 'roomy', fontSize: 19, bgStyle: 'plain', cardText: 'large' },
  papel: { theme: 'light', font: 'serif', bgStyle: 'dots' },
  enfoque: { theme: 'dark', bgStyle: 'plain', radius: 'sharp', contentWidth: 'narrow', sidebar: 'icons' },
  biblioteca: { theme: 'sepia', font: 'serif', lineHeight: 'roomy', bgStyle: 'plain', cardText: 'large' }
};
function quickStyle(name) {
  const base = defaults().settings, o = {};
  APP_KEYS.filter((k) => !QS_KEEP.includes(k)).forEach((k) => { o[k] = base[k]; });
  return { ...o, ...(QS_DEF[name] || {}) };
}
const AMBIENT_NAME = { biblioteca: 'Biblioteca', noche: 'Noche', enfoque: 'Minimalista' };
function setAmbient(name) {
  if (!QS_DEF[name]) return;
  const before = {}; APP_KEYS.forEach((k) => { before[k] = state.settings[k]; });
  Object.assign(state.settings, quickStyle(name)); sanitizeSettings(state.settings, defaults().settings); save(); applyAppearance();
  offerUndo(`Ambiente «${AMBIENT_NAME[name]}» aplicado. Sin sonido.`, () => { Object.assign(state.settings, before); save(); applyAppearance(); });
}
function openSettings() {
  const base = defaults().settings;
  const sel = (name, label, list) => `<label>${label}<select name="${name}">${list.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>`;
  const form = $('#modal-form'), f = form.elements;
  const read = () => { const o = {}; APP_KEYS.forEach((k) => { const el = f[k]; o[k] = el.type === 'checkbox' ? el.checked : k === 'fontSize' ? Number(el.value) : el.value; }); return o; };
  const put = (o) => Object.entries(o).forEach(([k, v]) => { const el = f[k]; if (!el) return; if (el.type === 'checkbox') el.checked = !!v; else el.value = String(v); });
  const QS = Object.fromEntries(Object.keys(QS_DEF).map((k) => [k, quickStyle(k)]));
  const sync = () => {
    const plain = ['sepia', 'contrast', 'chrome'].includes(f.theme.value); // en Sepia, Alto contraste y Cromo el acento es fijo (el guardado no se toca)
    const mono = f.theme.value === 'chrome'; $('#accent-note').hidden = !mono; // Cromo explica por qué el acento no se puede elegir
    if (mono) f.accent.setAttribute('aria-describedby', 'accent-note'); else f.accent.removeAttribute('aria-describedby');
    f.accent.disabled = plain; f.accentCustom.disabled = plain || f.accent.value !== 'custom';
    $('#accent-custom-wrap').hidden = f.accent.value !== 'custom'; $('#fs-out').textContent = `${f.fontSize.value} px`;
  };
  const preview = () => { sync(); const d = { ...state.settings, ...read(), mascot: !!f.mascot?.checked }; sanitizeSettings(d, base); applyAppearance(d); };
  modal(`<h2>Ajustes</h2>
      <details class="more-inline settings-group" open><summary>Apariencia</summary>
        <p class="hint">Los cambios se ven al instante y solo se guardan con «Guardar preferencias».</p>
        <p class="hint"><b>Estilos rápidos</b></p>
        <div class="actions" role="group" aria-label="Estilos rápidos"><button class="outline-button" type="button" data-qs="cuaderno">Cuaderno</button><button class="outline-button" type="button" data-qs="noche">Lectura nocturna</button><button class="outline-button" type="button" data-qs="papel">Papel</button><button class="outline-button" type="button" data-qs="biblioteca">Biblioteca</button><button class="outline-button" type="button" data-qs="enfoque">Enfoque</button><button class="text-button" type="button" id="reset-look">Restablecer apariencia</button></div>
        ${sel('theme', 'Tema', [['auto', 'Automático (según tu sistema)'], ['dark', 'Oscuro'], ['oled', 'Negro (OLED)'], ['light', 'Claro'], ['sepia', 'Sepia'], ['contrast', 'Alto contraste'], ['chrome', 'Cromo']])}
        <div class="form-row">${sel('accent', 'Color de acento (no en Sepia, Alto contraste ni Cromo)', [['sky', 'Cielo'], ['mint', 'Menta'], ['violet', 'Violeta'], ['amber', 'Ámbar'], ['rose', 'Rosa'], ['custom', 'Personalizado']])}
        <label id="accent-custom-wrap" hidden>Color personalizado<input name="accentCustom" type="color"></label></div>
        <p class="hint" id="accent-note" hidden>Cromo utiliza una paleta monocromática.</p>
        <div class="form-row">${sel('radius', 'Esquinas', [['sharp', 'Rectas'], ['soft', 'Suaves'], ['round', 'Redondeadas']])}${sel('cardStyle', 'Tarjetas', [['border', 'Con borde'], ['shadow', 'Con sombra']])}</div>
        <div class="form-row">${sel('bgStyle', 'Fondo', [['grid', 'Cuadriculado'], ['dots', 'Puntos'], ['plain', 'Liso']])}${sel('density', 'Densidad', [['normal', 'Normal'], ['compact', 'Compacta'], ['roomy', 'Amplia']])}</div>
      </details>
      <details class="more-inline settings-group"><summary>Tipografía y lectura</summary>
        <p class="hint">Solo fuentes del sistema: no se descarga nada.</p>
        ${sel('font', 'Fuente del texto', [['sans', 'Sistema (sans)'], ['humanist', 'Humanista'], ['serif', 'Serif de lectura'], ['rounded', 'Redondeada'], ['mono', 'Monoespaciada'], ['dyslexic', 'Lectura fácil (OpenDyslexic si está instalada; si no, Verdana)']])}
        ${sel('headFont', 'Fuente de los títulos', [['serif', 'Serif (actual)'], ['same', 'La misma del texto']])}
        <label>Tamaño de texto: <output id="fs-out"></output><input name="fontSize" type="range" min="13" max="24" step="1"></label>
        <div class="form-row">${sel('lineHeight', 'Interlineado', [['compact', 'Compacto'], ['normal', 'Normal'], ['roomy', 'Amplio']])}${sel('letterSpacing', 'Espaciado de letras', [['normal', 'Normal'], ['wide', 'Amplio'], ['wider', 'Muy amplio']])}</div>
        ${sel('cardText', 'Texto de las tarjetas de estudio', [['normal', 'Normal'], ['large', 'Grande'], ['xlarge', 'Muy grande']])}
      </details>
      <details class="more-inline settings-group"><summary>Disposición</summary>
        <div class="form-row">${sel('contentWidth', 'Ancho del contenido', [['narrow', 'Estrecho (1000 px)'], ['normal', 'Normal (1240 px)'], ['wide', 'Ancho (1600 px)']])}${sel('sidebar', 'Menú lateral (escritorio)', [['full', 'Completo'], ['icons', 'Solo iconos']])}</div>
        <label class="check"><input name="showMissions" type="checkbox"> Mostrar las misiones de hoy</label>
        <label class="check"><input name="showFact" type="checkbox"> Mostrar el dato curioso</label>
        <label class="check"><input name="reduceMotion" type="checkbox"> Reducir animaciones</label>
        <label class="check"><input name="immersiveDim" type="checkbox"> Atenuar el menú y la barra superior durante un bloque o examen</label>
        <label class="check"><input name="mascot" type="checkbox"> Compañero de estudio: Lumi</label>
      </details>
      <details class="more-inline settings-group"><summary>Estudio y avisos</summary>
        <label>Tu nombre (opcional, para el saludo)<input name="name" maxlength="30" autocomplete="given-name" value="${esc(state.settings.name)}"></label>
        <p class="modal-tip">Materia y objetivo de estudio: se editan en «Contexto del tutor», arriba en la página.</p>
        <label class="check"><input name="sound" type="checkbox"> Sonido al terminar</label>
        <label class="check"><input name="notify" type="checkbox"> Avisos al terminar bloques y un recordatorio diario al abrir la app (no llegan con la app cerrada)</label>
        <div class="form-row"><label>Pomodoro (min)<input name="focus" type="number" min="1" max="180" value="${state.settings.focus}"></label>
        <label>Descanso (min)<input name="rest" type="number" min="1" max="60" value="${state.settings.rest}"></label></div>
        <div class="form-row"><label>Ruleta: preparación<input name="prepare" type="number" min="1" max="180" value="${state.settings.roulettePrepare}"></label>
        <label>Ruleta: explicación<input name="explain" type="number" min="1" max="180" value="${state.settings.rouletteExplain}"></label></div>
      </details>
      <details class="more-inline settings-group" id="settings-advanced"><summary>Inteligencia artificial</summary>
        <label>Clave de Gemini (opcional)<input name="apikey" type="password" autocomplete="off" maxlength="200" placeholder="${state.apiKey ? 'Clave guardada (vacío = conservar)' : 'Pega aquí tu clave'}"></label>
        <p class="modal-tip">Tu clave se guarda solo en este navegador y no debe usarse en un equipo compartido. Va en el encabezado x-goog-api-key, no en la URL.</p>
        <label>Modelo de Gemini<input name="model" value="${esc(state.settings.model)}"></label>
        <label>URL de tu proxy (opcional, para no exponer la clave)<input name="proxy" type="url" inputmode="url" maxlength="200" placeholder="https://tu-worker.workers.dev" value="${esc(state.settings.proxyUrl)}"></label>
      </details>
      <details class="more-inline settings-group"><summary>Datos y copias</summary>
        <div class="actions">
        <button id="export-data" class="outline-button" type="button">Descargar copia</button>
        <button id="export-deck" class="outline-button" type="button">Compartir mazo</button>
        <button id="import-json-btn" class="outline-button" type="button">Importar JSON</button><input id="import-file" type="file" accept="application/json,.json" hidden aria-label="Archivo JSON a importar">
        <button id="import-csv-btn" class="outline-button" type="button">Importar CSV / Anki (.csv, .txt)</button><input id="import-csv" type="file" accept=".csv,.tsv,.txt,text/csv,text/plain,text/tab-separated-values" hidden aria-label="Archivo CSV o Anki a importar">
        ${state.apiKey ? '<button id="clear-key" class="outline-button" type="button">Quitar clave guardada</button>' : ''}
        ${readBackups().length ? '<button id="restore-backup" class="outline-button" type="button">Restaurar copia automática</button>' : ''}
        <button id="reset-data" class="outline-button" type="button">${DEMO ? 'Reiniciar demo' : 'Borrar todo'}</button>
        </div>
      </details>
      <p class="modal-tip">Comentarios: <a href="mailto:learnyxsv@gmail.com">learnyxsv@gmail.com</a></p>
      <button class="primary-button">Guardar preferencias</button>`, (data) => {
    if (clean(data.get('proxy'), 200) && !validProxy(data.get('proxy'))) return toast('La URL del proxy debe empezar por https:// (o http://localhost).', 'error');
    Object.assign(state.settings, {
      name: clean(data.get('name'), 30), proxyUrl: validProxy(data.get('proxy')), ...read(),
      sound: data.get('sound') === 'on', notify: data.get('notify') === 'on', mascot: data.get('mascot') === 'on',
      focus: num(data.get('focus'), 1, 180, 25), rest: num(data.get('rest'), 1, 60, 5),
      roulettePrepare: num(data.get('prepare'), 1, 180, 10), rouletteExplain: num(data.get('explain'), 1, 180, 1),
      model: clean(data.get('model'), 80) || DEFAULT_MODEL
    });
    sanitizeSettings(state.settings, base); // lo que llega del formulario también se valida
    if (DEMO) { state.apiKey = ''; state.settings.proxyUrl = ''; state.settings.notify = false; } // Etapa 7
    const key = clean(data.get('apikey'), 200); if (key) { state.apiKey = key; state.settings.skipAi = false; }
    if (!DEMO && state.settings.notify && typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();
    save(); applyPreferences({ keepTutor: true }); closeModal(); if (!timer.started) resetTimer(timer.mode); else renderTimer(); renderAll(); toast('Preferencias guardadas.');
  });
  modalTeardown = () => { const b = $('#modal-body'); b.oninput = null; b.onchange = null; $('#app-modal').onclick = null; $('#app-modal').onpointerdown = null; applyAppearance(); }; // cerrar o reemplazar sin guardar revierte la vista previa
  put(state.settings); f.fontSize.value = String(state.settings.fontSize); sync();
  $('#modal-body').oninput = $('#modal-body').onchange = preview;
  { const dlg = $('#app-modal'); let down = false; dlg.onpointerdown = (e) => { down = e.target === dlg; }; dlg.onclick = (e) => { const ok = down && e.target === dlg; down = false; if (ok) closeModal(); }; } // Fase 4: solo cierra si el clic EMPEZÓ y terminó fuera (soltar un arrastre fuera no cierra) // clic fuera (solo en Ajustes): cierra y revierte la vista previa
  $$('#modal-body [data-qs]').forEach((b) => { b.onclick = () => { put(QS[b.dataset.qs]); preview(); }; });
  $('#reset-look').onclick = () => { const o = {}; APP_KEYS.filter((k) => k !== 'reduceMotion').forEach((k) => { o[k] = base[k]; }); put(o); preview(); toast('Apariencia restablecida. Pulsa «Guardar preferencias» para conservarla.'); };
  $('#export-data').onclick = () => exportData();
  if ($('#clear-key')) $('#clear-key').onclick = () => { state.apiKey = ''; save(); closeModal(); toast('Clave eliminada de este navegador.'); };
  if ($('#restore-backup')) $('#restore-backup').onclick = restoreBackup;
  $('#export-deck').onclick = exportDeck;
  $('#import-json-btn').onclick = () => $('#import-file').click();
  $('#import-csv-btn').onclick = () => $('#import-csv').click();
  $('#import-file').onchange = (e) => { if (e.target.files[0]) importData(e.target.files[0]); };
  $('#import-csv').onchange = (e) => { if (e.target.files[0]) importCsv(e.target.files[0]); };
  if (DEMO) ['apikey', 'proxy', 'notify'].forEach((n) => { const el = $(`#modal-form [name="${n}"]`); if (el) el.disabled = true; }); // Etapa 7: sin IA ni avisos en demo
  $('#reset-data').onclick = async () => {
    if (DEMO) { // Etapa 7: «Reiniciar demo» solo recarga la demo; no toca ningún dato real
      if (await confirmDialog({ title: 'Reiniciar demo', message: 'Se restauran los datos de ejemplo. Tus datos reales no se tocan.', ok: 'Reiniciar' })) location.reload();
      return;
    }
    if (!(await confirmDialog({ title: 'Borrar todo', message: 'Se borrarán tarjetas, sesiones y fechas.\nAntes se descargará una copia y se guardará otra en el navegador.', ok: 'Borrar todo', danger: true }))) return;
    exportData(true); const backed = snapshot('reset');
    [KEY, ...LEGACY_KEYS, 'learny.corrupt', 'learny.newer', 'learny.drafts', TIMER_KEY, DONE_KEY].forEach((k) => store.del(k));
    document.dispatchEvent(new Event('learny:reset')); // extras.js vacía sus borradores en memoria (si no, se reescribirían al teclear)
    exam = null; hydrate({}); closeModal(); applyPreferences(); resetTimer('focus'); renderAll(); toast(backed ? 'Datos borrados. Descargaste una copia y puedes restaurar la automática desde Ajustes ⚙️.' : 'Datos borrados. Descargaste una copia, pero no hubo espacio para la copia automática en el navegador.', backed ? 'ok' : 'error');
  };
}

function changeFont(delta) { state.settings.fontSize = Math.min(24, Math.max(13, state.settings.fontSize + delta)); save(); applyAppearance(); }

function maybeRemind() {
  if (DEMO) return; // Etapa 7
  if (state.settings.lastRemind === today()) return; // una vez al día, no en cada recarga
  state.settings.lastRemind = today(); save();
  const due = dueCards().length;
  const soon = state.deadlines.filter((d) => daysUntil(d.date) >= 0 && daysUntil(d.date) <= 3);
  if (due) notify('Learny', `Tienes ${plural(due, 'tarjeta', 'tarjetas')} para hoy.`);
  soon.forEach((d) => notify('Learny', `Examen: ${d.title} en ${plural(daysUntil(d.date), 'día', 'días')}.`));
}

function backupNag() {
  if (DEMO) return; // Etapa 7
  const s = state.settings;
  if (state.cards.length < 10 || s.backupNag === today()) return;
  const last = s.lastExport;
  if (last && -daysUntil(last) < 14) return;
  s.backupNag = today(); save();
  queueToast('Hace tiempo que no descargas una copia. Ajustes ⚙️ → Descargar copia.');
}

function fillTutor(silent = false) {
  state.settings.tutor = {
    subject: clean($('#tutor-subject').value, 60),
    level: clean($('#tutor-level').value, 40),
    known: clean($('#tutor-known').value, 400),
    goal: clean($('#tutor-goal').value, 200),
    style: $('#tutor-style').value, career: clean($('#tutor-career').value, 60), mode: $('#tutor-mode').value === 'direct' ? 'direct' : 'socratic'
  };
  save();
  if (!silent) toast('Contexto del tutor guardado.');
}
