/* Learny · parte 12 de 15 · Copias e importación
   Exportar, validar e importar copias, mazos y CSV; restaurar copias automáticas.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

function isLearnyBackup(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  return ['cards', 'sessions', 'deadlines', 'reviews', 'topics', 'settings', 'tasks'].some((k) => k in data);
}

function exportData(auto = false) {
  if (DEMO) { if (!auto) toast('En la demostración no se descargan copias.', 'error'); return; } // Etapa 7
  const { apiKey, ...safe } = state;
  download(`learny-copia-${today()}.json`, JSON.stringify(safe, null, 2), 'application/json');
  state.settings.lastExport = today(); save();
  if (!auto) toast('Copia descargada (sin clave API).');
}

function exportDeck() {
  if (DEMO) return toast('En la demostración no se comparten mazos.', 'error'); // Etapa 7
  const deck = state.cards.filter((c) => !c.corrupt).map(({ subject, question, answer }) => ({ subject, question, answer }));
  if (!deck.length && !state.decks.length) return toast('No hay tarjetas para compartir.', 'error');
  download(`learny-mazo-${today()}.json`, JSON.stringify({ type: 'learny-deck', cards: deck, decks: state.decks }, null, 2), 'application/json');
  toast('Mazo exportado sin progreso personal.');
}

const BACKUP_LISTS = ['cards', 'sessions', 'deadlines', 'reviews', 'topics', 'tasks', 'chats', 'exams', 'notes', 'feynman', 'decks', 'planLog'];
function validateBackup(data) {
  if (data?.type === 'learny-deck') {
    if (!Array.isArray(data.cards)) return { ok: false, error: 'El mazo no contiene una lista de tarjetas.' };
    const good = data.cards.filter((c) => c && typeof c.question === 'string' && typeof c.answer === 'string' && c.question.trim() && c.answer.trim());
    const decks = (Array.isArray(data.decks) ? data.decks : []).filter(okDeck)
      .map((d) => ({ name: d.name.trim().slice(0, 60), cards: okDeckCards(d.cards).map((c) => [c[0].slice(0, 500), c[1].slice(0, 1200)]) })).filter((d) => d.cards.length);
    return { ok: true, deck: good, decks, dropped: data.cards.length - good.length }; // los errores se detallan en la vista previa
  }
  if (!isLearnyBackup(data)) return { ok: false, error: 'Ese archivo no parece una copia de Learny.' };
  if (Number(data.version) > SCHEMA) return { ok: false, error: `La copia es de una versión más nueva de Learny (v${data.version}). Actualiza la app e inténtalo de nuevo.` };
  const bad = BACKUP_LISTS.filter((k) => k in data && !Array.isArray(data[k]));
  if (bad.length) return { ok: false, error: `Estos campos tienen un formato inválido: ${bad.join(', ')}.` };
  if ('settings' in data && (!data.settings || typeof data.settings !== 'object' || Array.isArray(data.settings))) return { ok: false, error: 'Los ajustes de la copia no son válidos.' };
  return { ok: true, cards: (data.cards || []).length, deadlines: (data.deadlines || []).length, sessions: (data.sessions || []).length };
}

/* Vista previa antes de modificar datos: cifras, errores detallados y «Importar válidas». Devuelve true si el usuario confirma. */
function importPreview({ title, intro, counts, groups = [], okLabel, canImport = true, danger = false }) {
  return new Promise((resolve) => {
    let done = false; const finish = (v) => { if (!done) { done = true; resolve(v); } };
    const group = (g) => `<details class="import-group ${g.cls || ''}"><summary>${esc(g.title)} (${g.lines.length})</summary><ol class="import-list">${g.lines.slice(0, 25).map((l) => `<li>${esc(l)}</li>`).join('')}${g.lines.length > 25 ? `<li>… y ${g.lines.length - 25} más</li>` : ''}</ol></details>`;
    modal(`<h2>${esc(title)}</h2><p>${intro}</p>
        <ul class="import-sum">${counts.map((c) => `<li class="${c.cls || ''}"><b>${c.n}</b> ${esc(c.label)}</li>`).join('')}</ul>
        ${groups.filter((g) => g.lines.length).map(group).join('')}
        <p class="modal-tip">${canImport ? 'Antes de modificar tus datos se guarda una copia automática (Ajustes ⚙️ → Restaurar copia automática).' : 'No hay nada que importar.'}</p>
        <div class="actions"><button class="outline-button" type="button" data-close-modal>${canImport ? 'Cancelar' : 'Cerrar'}</button>${canImport ? `<button class="${danger ? 'danger-button' : 'primary-button'}">${esc(okLabel)}</button>` : ''}</div>`,
    () => finish(true), () => finish(false));
  });
}

function analyzeCards(records) {
  const key = (q, s) => `${s}\u0001${q}`.toLowerCase();
  const have = new Set(state.cards.map((c) => key(c.question, c.subject))), seen = new Set(), A = { fresh: [], dups: [], errors: [] };
  records.forEach((r) => {
    const tag = `${r.label} ${r.n}`;
    if (r.bad) { A.errors.push(`${tag}: ${r.bad}`); return; }
    if (!r.question && !r.answer) { A.errors.push(`${tag}: no tiene texto utilizable`); return; }
    if (!r.question) { A.errors.push(`${tag}: falta la pregunta (respuesta: «${r.answer.slice(0, 50)}»)`); return; }
    if (!r.answer) { A.errors.push(`${tag}: falta la respuesta (pregunta: «${r.question.slice(0, 50)}»)`); return; }
    const k = key(r.question, r.subject);
    if (have.has(k)) { A.dups.push(`${tag}: «${r.question.slice(0, 60)}» ya está en tu colección`); return; }
    if (seen.has(k)) { A.dups.push(`${tag}: «${r.question.slice(0, 60)}» está repetida en el archivo`); return; }
    seen.add(k); A.fresh.push({ question: r.question, answer: r.answer, subject: r.subject });
  });
  return A;
}

const previewCards = (title, total, A, { extra = [], over = 0, note = '' } = {}) => {
  const errN = A.errors.length + over;
  return importPreview({
    title, intro: `Se leyeron <b>${total}</b> ${total === 1 ? 'registro' : 'registros'} del archivo.${note ? ` ${esc(note)}` : ''}`,
    counts: [{ n: A.fresh.length, label: A.fresh.length === 1 ? 'nueva' : 'nuevas', cls: 'ok' }, { n: A.dups.length, label: A.dups.length === 1 ? 'posible duplicada' : 'posibles duplicadas' }, { n: errN, label: errN === 1 ? 'con error' : 'con errores', cls: errN ? 'err' : '' }, ...extra],
    groups: [{ title: 'Revisar errores', lines: [...A.errors, ...(over ? [`${plural(over, 'registro', 'registros')} después del límite de 5 000 no se leerán`] : [])], cls: 'err' }, { title: 'Ver duplicadas', lines: A.dups }],
    okLabel: `Importar ${plural(A.fresh.length, 'válida', 'válidas')}`, canImport: A.fresh.length > 0 || extra.some((x) => x.n > 0)
  });
};

/* Antes de REEMPLAZAR datos: si no cabe la copia automática previa, se avisa en vez de continuar en silencio. */
async function ensureBackup(reason, what) {
  if (snapshot(reason)) return true;
  return confirmDialog({ title: 'No se pudo guardar una copia previa', message: `${what} No hay espacio para la copia automática, así que no podrás recuperar tus datos actuales desde Learny. Si quieres conservarlos, cancela y descarga antes una copia en Ajustes ⚙️.`, ok: 'Continuar sin copia', danger: true });
}

function importData(file) {
  if (DEMO) return toast('En la demostración no se importan archivos.', 'error'); // Etapa 7
  if (file.size > 15 * 1024 * 1024) return toast('El archivo es demasiado grande para ser una copia de Learny.', 'error');
  file.text().then(async (text) => {
    let data; try { data = JSON.parse(text, noProto); } catch { throw new Error('El archivo no es un JSON válido.'); }
    const check = validateBackup(data);
    if (!check.ok) throw new Error(check.error);
    if (check.deck) {
      const records = data.cards.map((c, i) => (isObj(c)
        ? { n: i + 1, label: 'Tarjeta', question: cleanMl(typeof c.question === 'string' ? c.question : '', 500), answer: cleanMl(typeof c.answer === 'string' ? c.answer : '', 1200), subject: clean(typeof c.subject === 'string' ? c.subject : '', 60) || 'Sin materia' }
        : { n: i + 1, label: 'Tarjeta', bad: 'no es una tarjeta' }));
      const A = analyzeCards(records), newDecks = (check.decks || []).filter((d) => !state.decks.some((x) => x.name === d.name));
      if (!(await previewCards('Importar mazo', records.length, A, { extra: newDecks.length ? [{ n: newDecks.length, label: newDecks.length === 1 ? 'mazo propio nuevo' : 'mazos propios nuevos' }] : [] }))) return;
      const backed = snapshot('import'); // solo añade tarjetas: no se bloquea si no cabe la copia, pero se dice
      A.fresh.forEach((c) => state.cards.push(normalizeCard({ ...c, nextReview: today() }))); newDecks.forEach((d) => state.decks.push(d));
      save(); closeModal(); renderAll(); toast(`Mazo importado: ${plural(A.fresh.length, 'tarjeta nueva', 'tarjetas nuevas')}.${backed ? '' : ' No hubo espacio para la copia automática previa.'}`, backed ? 'ok' : 'error');
      return;
    }
    const brokenCards = arr(data.cards).map((c, i) => [c, i]).filter(([c]) => !isObj(c) || isBrokenCard(c)).map(([c, i]) => `Tarjeta ${i + 1}: ${isObj(c) ? 'le falta la pregunta o la respuesta' : 'no es una tarjeta'} (se importará marcada como dañada)`);
    const badDeadlines = arr(data.deadlines).map((d, i) => [d, i]).filter(([d]) => !(isObj(d) && String(d.title || '').trim() && isDay(d.date))).map(([, i]) => `Fecha ${i + 1}: sin nombre o con fecha no válida (se omitirá)`);
    const listLines = [
      ...arr(data.notes).map((n, i) => [n, i]).filter(([n]) => !okNote(n)).map(([, i]) => `Nota ${i + 1}: sin texto o con formato no válido (se omitirá)`),
      ...arr(data.exams).map((e, i) => [e, i]).filter(([e]) => !okExam(e)).map(([, i]) => `Examen ${i + 1}: fecha o resultado no válido (se omitirá)`),
      ...arr(data.feynman).map((f, i) => [f, i]).filter(([f]) => !isDay(f)).map(([, i]) => `Feynman ${i + 1}: fecha no válida (se omitirá)`),
      ...arr(data.decks).map((d, i) => [d, i]).filter(([d]) => !okDeck(d)).map(([, i]) => `Mazo ${i + 1}: sin nombre o sin tarjetas válidas (se omitirá)`),
      ...arr(data.reviews).filter((r) => !okReview(r)).length ? [`${plural(arr(data.reviews).filter((r) => !okReview(r)).length, 'repaso', 'repasos')} con fecha o valoración no válida (se omitirán)`] : []
    ];
    const problems = brokenCards.length + badDeadlines.length + listLines.length;
    if (!(await importPreview({
      title: 'Reemplazar tus datos', intro: 'Esta copia <b>reemplazará</b> tus datos actuales.',
      counts: [{ n: check.cards, label: `tarjetas (ahora: ${state.cards.length})` }, { n: check.deadlines, label: `fechas (ahora: ${state.deadlines.length})` }, { n: check.sessions, label: `sesiones (ahora: ${state.sessions.length})` }, ...(problems ? [{ n: problems, label: problems === 1 ? 'con error' : 'con errores', cls: 'err' }] : [])],
      groups: [{ title: 'Revisar errores', lines: [...brokenCards, ...badDeadlines, ...listLines], cls: 'err' }], okLabel: 'Reemplazar mis datos', danger: true
    }))) return;
    if (!(await ensureBackup('import', 'Esta importación reemplaza todos tus datos.'))) { closeModal(); return; }
    const keepProxy = state.settings.proxyUrl; // una copia ajena nunca redirige tu IA
    exam = null; hydrate({ ...data, apiKey: state.apiKey }); state.settings.proxyUrl = keepProxy;
    state.deadlines.forEach((d) => { if (!state.tasks.some((t) => t.deadlineId === d.id)) rebuildTasks(d, false); });
    save(); closeModal(); applyPreferences(); resetTimer('focus'); renderAll(); toast('Datos importados correctamente.');
  }).catch((error) => { console.error(error); toast(error.message || 'Ese archivo no es una copia válida de Learny.', 'error'); });
}

function restoreBackup() {
  if (DEMO) return toast('En la demostración no hay copias que restaurar.', 'error'); // Etapa 7
  const list = readBackups();
  if (!list.length) return toast('No hay copia automática para restaurar.', 'error');
  modal(`<h2>Restaurar copia automática</h2>
      <p class="hint">Elige una copia. Reemplazará tus datos actuales (se guarda antes una copia de lo que tienes ahora).</p>
      <div class="backup-list">${list.map((b, i) => `<button class="outline-button" type="button" data-backup="${i}">${esc(String(b.at || '').replace('T', ' ').slice(0, 16))} · ${esc(String(b.reason || 'manual'))} · ${plural(arr(b.data.cards).length, 'tarjeta', 'tarjetas')}</button>`).join('')}</div>`);
  document.querySelectorAll('[data-backup]').forEach((btn) => { btn.onclick = () => applyBackup(Number(btn.dataset.backup)); });
}
async function applyBackup(i) {
  const b = readBackups()[i];
  if (!b?.data) return toast('Esa copia ya no está disponible.', 'error');
  if (!(await confirmDialog({ title: 'Restaurar copia automática', message: `Copia del ${String(b.at || '').slice(0, 10)} (${b.reason || 'manual'}). Reemplazará tus datos actuales.`, ok: 'Restaurar', danger: true }))) return;
  if (!(await ensureBackup('antes de restaurar', 'Restaurar reemplaza tus datos actuales.'))) return; // lo actual no se pierde: queda como la copia más reciente
  const keepProxy = state.settings.proxyUrl, keepChats = state.chats;
  exam = null; hydrate({ ...b.data, chats: keepChats, apiKey: state.apiKey }); state.settings.proxyUrl = keepProxy;
  save(); closeModal(); applyPreferences(); resetTimer('focus'); renderAll(); toast('Copia automática restaurada.');
}

function detectDelimiter(text) {
  const m = text.match(/^#separator:\s*(\w+)/im);
  if (m) { const map = { tab: '\t', semicolon: ';', comma: ',', pipe: '|', space: ' ' }; if (map[m[1].toLowerCase()]) return map[m[1].toLowerCase()]; }
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#')).slice(0, 8);
  const countIn = (line) => { const c = { '\t': 0, ';': 0, '|': 0, ',': 0 }; let q = false; for (const ch of line) { if (ch === '"') q = !q; else if (!q && ch in c) c[ch]++; } return c; };
  const per = lines.map(countIn);
  if (per[0]?.['\t']) return '\t'; // Anki exporta con tabuladores
  for (const d of [';', '|', ',']) { // el separador es el que aparece el mismo número de veces (≥1) en todas las líneas de muestra
    if (per.length && per.every((c) => c[d] >= 1 && c[d] === per[0][d])) return d;
  }
  const first = per[0] || { ';': 0, '|': 0, ',': 0 };
  return first[';'] > first[','] ? ';' : first['|'] > first[','] ? '|' : ',';
}

/* Una comilla solo abre un campo entre comillas si está al INICIO del campo y solo lo cierra si va seguida de separador o fin de línea;
   una comilla suelta dentro del texto (5" de pantalla) es literal. Si un campo entre comillas nunca se cierra se avisa en vez de tragarse el resto del archivo. */
function parseCsv(text) {
  const d = detectDelimiter(text);
  const rows = []; let row = [], cur = '', q = false, fieldStart = true, qLine = 0, line = 1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') {
        const nx = text[i + 1];
        let j = i + 1; while (text[j] === ' ' || (text[j] === '\t' && d !== '\t')) j++; // espacios tras la comilla de cierre (si el separador es el tabulador, no se salta)
        if (nx === '"') { cur += '"'; i++; }
        else if (text[j] === undefined || text[j] === d || text[j] === '\n' || text[j] === '\r') { q = false; i = j - 1; }
        else cur += '"'; // comilla suelta dentro de un campo entre comillas: literal
      } else { if (ch === '\n') line++; cur += ch; }
    } else if (ch === '"' && fieldStart) { q = true; qLine = line; fieldStart = false; }
    else if (ch === d) { row.push(cur.trim()); cur = ''; fieldStart = true; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; line++; row.push(cur.trim()); cur = ''; rows.push(row); row = []; fieldStart = true; }
    else { cur += ch; if (!/\s/.test(ch)) fieldStart = false; }
  }
  if (q) throw Object.assign(new Error(`Hay unas comillas sin cerrar que empiezan en la línea ${qLine}. Ciérralas o quítalas y vuelve a importar.`), { user: true });
  row.push(cur.trim()); rows.push(row);
  return rows.filter((r) => r.some(Boolean) && !/^#[A-Za-z][\w ]*:/.test(String(r[0])));
}

// Anki guarda HTML en los campos: <br> pasa a salto de línea y solo se quitan etiquetas HTML reales (nombre conocido y atributos con forma nombre="valor").
// Así «Si a<b y c>d» o «x<y» se conservan tal cual (antes «<b y c>» se tomaba por una etiqueta y se perdía texto).
const HTML_TAGS = 'a|abbr|b|big|blockquote|center|code|dd|del|div|dl|dt|em|font|h[1-6]|hr|i|img|ins|kbd|li|mark|ol|p|pre|s|small|span|strike|strong|sub|sup|table|tbody|td|th|thead|tr|u|ul';
const HTML_ATTR = '(?:\\s+[A-Za-z_:][\\w:.-]*\\s*=\\s*(?:"[^"]*"|\'[^\']*\'|[^\\s"\'<>=`]+))*';
const HTML_TAG_RE = new RegExp(`</?(?:${HTML_TAGS})${HTML_ATTR}\\s*/?>`, 'gi');
const stripHtml = (v) => String(v || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(div|p|li)>/gi, '\n').replace(/<!--[\s\S]*?-->/g, '').replace(HTML_TAG_RE, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/* Lee un archivo de texto: UTF-8 (con o sin BOM), UTF-16 (BOM) o, si no es UTF-8 válido, Windows-1252 (el CSV de Excel en español). */
async function readTextFile(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf[0] === 0xFF && buf[1] === 0xFE) return { text: new TextDecoder('utf-16le').decode(buf.subarray(2)), encoding: 'UTF-16' };
  if (buf[0] === 0xFE && buf[1] === 0xFF) return { text: new TextDecoder('utf-16be').decode(buf.subarray(2)), encoding: 'UTF-16' };
  try { return { text: new TextDecoder('utf-8', { fatal: true }).decode(buf), encoding: 'UTF-8' }; }
  catch { return { text: new TextDecoder('windows-1252').decode(buf), encoding: 'Windows-1252' }; }
}

/* Columnas del CSV. Anki (exportar como texto) escribe líneas «#separator:tab», «#html:true», «#guid column:1», «#deck column:3», «#tags column:6»…:
   las columnas marcadas son metadatos y los campos (pregunta, respuesta…) son el resto, en orden; en un export de Anki la tercera columna son ETIQUETAS, no la materia.
   Sin esas líneas, una cabecera conocida (pregunta/respuesta/materia…) decide el orden; sin cabecera: pregunta, respuesta, materia. */
const CSV_HEAD = { q: /^(pregunta|question|front|anverso)$/, a: /^(respuesta|answer|back|reverso)$/, s: /^(materia|subject|tema|deck|mazo)$/ };
function csvLayout(text, rows) {
  const dir = {}; for (const m of text.matchAll(/^#(guid|notetype|deck|tags) column:\s*(\d+)/gim)) dir[m[1].toLowerCase()] = Number(m[2]) - 1;
  const anki = Object.keys(dir).length > 0 || /^#(?:separator|html)\s*:/im.test(text);
  if (anki) {
    const meta = new Set(Object.values(dir)), width = Math.max(0, ...rows.slice(0, 50).map((r) => r.length)), fields = [];
    for (let c = 0; c < width; c++) if (!meta.has(c)) fields.push(c);
    return { body: rows, q: fields[0] ?? 0, a: fields[1] ?? 1, s: dir.deck ?? -1, anki: true };
  }
  const head = rows[0].map((h) => h.toLowerCase().trim());
  const qi = head.findIndex((h) => CSV_HEAD.q.test(h)), ai = head.findIndex((h) => CSV_HEAD.a.test(h)), si = head.findIndex((h) => CSV_HEAD.s.test(h));
  if (qi < 0 && ai < 0 && si < 0) return { body: rows, q: 0, a: 1, s: 2 };
  const free = [0, 1, 2].filter((c) => ![qi, ai, si].includes(c));
  return { body: rows.slice(1), q: qi >= 0 ? qi : free.shift(), a: ai >= 0 ? ai : free.shift(), s: si >= 0 ? si : (free.shift() ?? -1) };
}
function csvToRecords(text) {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (rows.length < 1) throw new Error('vacío');
  const L = csvLayout(text, rows);
  const records = L.body.slice(0, 5000).map((r, i) => ({
    n: i + 1, label: 'Registro', question: cleanMl(stripHtml(r[L.q]), 500), answer: cleanMl(stripHtml(r[L.a]), 1200),
    subject: clean(stripHtml(L.s >= 0 ? r[L.s] : '').replace(/::/g, ' › '), 60) || 'Importado' // los mazos de Anki usan «Mazo::Submazo»
  }));
  return { records, total: L.body.length };
}

function importCsv(file) {
  if (DEMO) return toast('En la demostración no se importan archivos.', 'error'); // Etapa 7
  if (file.size > 5 * 1024 * 1024) return toast('El archivo es demasiado grande (máximo 5 MB).', 'error');
  readTextFile(file).then(async ({ text, encoding }) => {
    const { records, total } = csvToRecords(text);
    const A = analyzeCards(records);
    const note = encoding === 'Windows-1252' ? 'El archivo no estaba en UTF-8: se leyó como Windows-1252 (el formato de Excel). Si ves letras raras, guárdalo como «CSV UTF-8».' : '';
    if (!(await previewCards('Importar tarjetas', total, A, { over: Math.max(0, total - 5000), note }))) return;
    const backed = snapshot('import-csv'); // solo añade tarjetas: no se bloquea si no cabe la copia, pero se dice
    A.fresh.forEach((c) => state.cards.push(normalizeCard({ ...c, nextReview: today() })));
    save(); closeModal(); renderAll(); toast(`Importadas ${plural(A.fresh.length, 'tarjeta', 'tarjetas')} desde CSV.${backed ? '' : ' No hubo espacio para la copia automática previa.'}`, backed ? 'ok' : 'error');
  }).catch((e) => { console.error(e); toast(e.user ? e.message : 'Archivo no válido. Usa pregunta, respuesta, materia (separados por coma, punto y coma, barra | o tabulador).', 'error'); });
}
