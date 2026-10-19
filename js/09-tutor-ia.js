/* Learny · parte 9 de 15 · Tutor e IA
   Guía local, prompts, Gemini (clave propia o proxy), chats y huecos de texto.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

/* =========================================================
   IA
   ========================================================= */
function localGuide(topic, extra = '') {
  const g = LOCAL_GUIDES[Math.abs([...`${topic}${extra}`].reduce((a, c) => a + c.charCodeAt(0), 0)) % LOCAL_GUIDES.length];
  return `**Pregunta guía**\n${g.pregunta}\n\n**Pista**\n${g.pista}\n\n**Explicación**\nSobre “${topic || 'este tema'}”: di la idea central, un ejemplo propio y una duda.\n\n**Ejemplo**\nSi estudias ${topic || 'el tema'}, compara un caso típico con un caso límite.\n\n**Siguiente reto**\n${g.reto}${extra ? `\n\nTu texto: ${extra.slice(0, 180)}${extra.length > 180 ? '…' : ''}` : ''}`;
}

const BLOCK_KEYS = ['Pregunta guía', 'Pista', 'Explicación', 'Ejemplo', 'Siguiente reto', 'Lo que explicaste bien', 'Revisa esta afirmación', 'Falta este concepto', 'Pregunta para comprobar'];
function parseBlocks(text) {
  const any = BLOCK_KEYS.join('|'), found = [];
  BLOCK_KEYS.forEach((k) => {
    const re = new RegExp(`\\*\\*${k}:?\\*\\*[\\s:\\-]*([\\s\\S]*?)(?=\\*\\*(?:${any}):?\\*\\*|$)`, 'i');
    const m = re.exec(text);
    if (m) found.push({ k, at: m.index, body: m[1].trim() });
  });
  found.sort((a, b) => a.at - b.at); // se muestran en el orden en que la IA los escribió
  const html = found.map((b) => `<section class="tutor-block"><h3>${b.k}</h3><p>${fmt(b.body)}</p></section>`).join('');
  return html || `<div class="ai-answer">${fmt(text)}</div>`;
}

function tutorContext() {
  const t = state.settings.tutor;
  return `Contexto: materia=${t.subject || 'no indicada'}; nivel=${t.level || 'no indicado'}; ya sabe=${t.known || 'no indicado'}; quiere lograr=${t.goal || 'no indicado'}.
Estilo de explicación: ${({ 12: 'como a alguien de 12 años', uni: 'nivel universitario', carrera: `con ejemplos de ${$('#tutor-career').value || 'su carrera'}` })[$('#tutor-style').value]}.`;
}

function socraticPrompt(query, mode = $('#tutor-mode').value) {
  if (mode === 'direct') {
    return `Actúa como tutor en español. El estudiante prefiere una explicación directa: responde con claridad desde el principio, sin hacerle adivinar. Si no estás seguro de algo, dilo.
Responde EXACTAMENTE con estos bloques, cada uno con el título en negrita:
**Explicación**
**Ejemplo**
**Pregunta guía**
**Siguiente reto**
En «Pregunta guía» pon una pregunta para comprobar que entendió.
${tutorContext()}
Consulta: ${query}`;
  }
  return `Actúa como tutor socrático en español. No des la respuesta completa primero; haz una pregunta guía, pide el razonamiento y corrige errores paso a paso. Si el estudiante pide explícitamente que se lo expliques, dáselo.
Responde EXACTAMENTE con estos bloques, cada uno con el título en negrita:
**Pregunta guía**
**Pista**
**Explicación**
**Ejemplo**
**Siguiente reto**
${tutorContext()}
Consulta: ${query}`;
}

function feynmanPrompt(topic, text) {
  return `Actúa como tutor en español. Un estudiante explicó un tema con sus propias palabras (método Feynman). Evalúa SOLO lo que escribió y no inventes errores. Sin puntuación numérica.
Responde EXACTAMENTE con estos bloques, cada uno con el título en negrita:
**Lo que explicaste bien**
(1 o 2 frases; cita entre comillas un fragmento breve suyo)
**Revisa esta afirmación**
(cita textualmente el fragmento dudoso o incorrecto, explica por qué y cómo mejorarlo; si no hay ninguno, escribe "No encontré afirmaciones incorrectas")
**Falta este concepto**
(el concepto importante que no mencionó)
**Pregunta para comprobar**
(una pregunta que permita comprobar su comprensión)
${tutorContext()}
Tema: ${topic || 'no indicado'}
Explicación del estudiante:
${text}`;
}

let aiController = null;
const hasAi = () => !DEMO && !!(state.apiKey || state.settings.proxyUrl); // Etapa 7: la demo nunca usa IA
const cancelAi = () => { if (aiController) aiController.abort(); };

async function askGemini(prompt) {
  if (!hasAi()) throw new Error('Falta la clave de Gemini. Añádela en Ajustes ⚙️ o usa Guía local.');
  const text = cleanMl(prompt, MAX_PROMPT);
  if (!text) throw new Error('El texto está vacío o es demasiado corto.');
  const proxy = state.settings.proxyUrl, who = proxy ? 'El proxy' : 'La clave de Gemini';
  const model = (state.settings.model || DEFAULT_MODEL).trim();
  if (aiController) { aiController.stale = true; aiController.abort(); } // una consulta nueva sustituye a la anterior
  const controller = new AbortController(); aiController = controller;
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 30000);
  try {
    const response = await fetch(proxy || `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', signal: controller.signal,
      headers: proxy ? { 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json', 'x-goog-api-key': state.apiKey },
      body: JSON.stringify(proxy ? { prompt: text } : { contents: [{ parts: [{ text }] }], generationConfig: { maxOutputTokens: 4096 } })
    }).catch((e) => { if (e.name === 'AbortError') throw e; throw new Error('No hay conexión o el servicio no respondió. Puedes usar las preguntas guía locales.'); }); // solo un fallo de red se presenta como «sin conexión»
    let data = {}; try { data = await response.json(); } catch { /* sin cuerpo */ }
    if (!response.ok) {
      const raw = data.error?.message || `Error ${response.status}`;
      if (response.status === 401 || response.status === 403 || (response.status === 400 && /api[ _-]?key/i.test(raw))) throw new Error(`${who} no es válido o no tiene permiso. (${raw})`);
      if (response.status === 400) throw new Error(`La consulta no es válida. (${raw})`);
      if (response.status === 404) throw new Error(`El modelo “${model}” no existe. Cámbialo en Ajustes ⚙️. (${raw})`);
      if (response.status === 429) throw new Error('Se agotó la cuota de la IA. Espera un rato e inténtalo de nuevo.');
      throw new Error(raw);
    }
    const out = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    if (!out) throw new Error(data.candidates?.[0]?.finishReason === 'MAX_TOKENS' ? 'La IA agotó su límite de respuesta antes de escribir. Prueba otro modelo en Ajustes ⚙️ o una pregunta más corta.' : 'La IA no devolvió texto para esta consulta.');
    return out;
  } catch (error) {
    if (error.name === 'AbortError') { const e = new Error(timedOut ? 'La IA tardó demasiado. Inténtalo de nuevo.' : 'Consulta cancelada.'); e.cancelled = !timedOut; e.stale = !!controller.stale; throw e; }
    throw error;
  } finally { clearTimeout(timeout); if (aiController === controller) aiController = null; }
}

function chatTopic() {
  return clean(state.settings.tutor.subject, 60) || 'general';
}

function saveChat(role, text) {
  const topic = chatTopic();
  let chat = state.chats.find((c) => c.topic.toLowerCase() === topic.toLowerCase());
  if (!chat) { chat = { topic, messages: [] }; state.chats.push(chat); if (state.chats.length > MAX_CHATS) state.chats.splice(0, state.chats.length - MAX_CHATS); }
  chat.messages = [...chat.messages, { role, text: String(text).slice(0, 3000), at: new Date().toISOString() }].slice(-20);
  save();
}

function requestKey(onKey, onLocal) {
  if (DEMO) { toast('La demostración no usa IA: tienes la guía local.'); state.settings.skipAi = true; return onLocal(); } // Etapa 7
  modal(`<h2>Conecta Gemini</h2>
      <p>Consigue una clave gratuita en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a>.</p>
      <p class="modal-tip"><b>Tu clave se guarda solo en este navegador y no debe usarse en un equipo compartido.</b> Cualquiera con DevTools podría verla. En producción usa un proxy (ver proxy-worker.example.js).</p>
      <label>API key<input name="key" type="password" autocomplete="off" required maxlength="200"></label>
      <p class="lead">La clave viaja en el encabezado x-goog-api-key, no en la URL.</p>
      <button class="primary-button">Guardar clave</button>
      <button id="use-local" class="outline-button" type="button">Continuar sin IA</button>`, (data) => {
    state.apiKey = clean(data.get('key'), 200); save(); closeModal(); onKey();
  });
  $('#use-local').onclick = () => { state.settings.skipAi = true; save(); closeModal(); onLocal(); };
}

let lastAi = null, lastFail = null;
const closeButton = '<button class="primary-button" type="button" data-close-modal>Cerrar</button>';
const aiActions = '<div class="actions"><button class="outline-button" type="button" data-ai-follow="direct">Explícamelo directamente</button><button class="outline-button" type="button" data-ai-follow="simple">Explicar más simple</button><button class="outline-button" type="button" data-ai-follow="exercise">Dame un ejercicio</button><button class="outline-button" type="button" data-ai-follow="cards">Crear tarjetas</button><button class="text-button" type="button" data-ai-follow="note">Guardar en notas</button></div>';

async function gemini(prompt, title, fallback, onDone) {
  const showLocal = (note = '') => {
    const text = fallback?.() || localGuide(title);
    modal(`<h2>${esc(title)}</h2>${parseBlocks(text)}${note ? `<p class="modal-tip">${esc(note)}</p>` : ''}${closeButton}`);
    return { text, fromAi: false };
  };
  if (!hasAi()) {
    if (modalOpen()) { toast('Añade tu clave de Gemini en Ajustes ⚙️ o elige Guía local.', 'error'); return { text: fallback?.() || localGuide(title), fromAi: false }; }
    if (!state.settings.skipAi) return new Promise((resolve) => requestKey(async () => resolve(await gemini(prompt, title, fallback, onDone)), () => resolve(showLocal('Modo local activo.'))));
    return showLocal('Guía local. Añade tu clave en Ajustes ⚙️ para IA.');
  }
  modal(`<h2>${esc(title)}</h2><div class="skeleton" aria-hidden="true"></div><p class="lead">Consultando tutor…</p><button class="outline-button" type="button" data-cancel-ai>Cancelar</button>`);
  $('#modal-body').setAttribute('aria-live', 'polite');
  try {
    const text = await askGemini(prompt);
    lastAi = { prompt, title, text };
    $('#modal-body').innerHTML = `<h2>${esc(title)}</h2>${parseBlocks(text)}${aiActions}${closeButton}`;
    try { onDone?.(text); } catch (e) { console.error(e); }
    return { text, fromAi: true };
  } catch (error) {
    if (error.stale) return { text: '', fromAi: false, cancelled: true }; // ya hay otra consulta en curso: no tocar su ventana
    if (error.cancelled) { closeModal(); toast('Consulta cancelada.'); return { text: '', fromAi: false, cancelled: true }; }
    const text = fallback?.() || localGuide(title);
    lastFail = { prompt, title, fallback, onDone };
    $('#modal-body').innerHTML = `<h2>No se pudo completar</h2><p>${esc(error.message)}</p><p class="modal-tip">Tu pregunta se conserva. Puedes reintentar o usar las preguntas guía locales mientras tanto.</p>${parseBlocks(text)}<div class="actions"><button class="primary-button" type="button" data-ai-retry>Reintentar</button><button class="outline-button" type="button" data-close-modal>Cerrar</button></div>`;
    toast(error.message, 'error');
    return { text, fromAi: false, failed: true };
  }
}

document.addEventListener('click', (e) => {
  if (e.target.closest('[data-cancel-ai]')) { cancelAi(); return; }
  if (e.target.closest('[data-ai-retry]') && lastFail) { const r = lastFail; lastFail = null; gemini(r.prompt, r.title, r.fallback, r.onDone); return; }
  if (e.target.closest('[data-feynman-retry]')) { feynman(); return; }
  if (e.target.closest('[data-feynman-cards]') && lastFey) { suggestCardsFromText(lastFey.topic, lastFey.text); return; }
  const f = e.target.closest('[data-ai-follow]')?.dataset.aiFollow;
  if (!f || !lastAi) return;
  const base = lastAi;
  if (f === 'direct') gemini(socraticPrompt(`Explícame esto directamente y con claridad:\n${base.text}`, 'direct'), 'Explicación directa', () => base.text);
  else if (f === 'simple') gemini(`Explica esto de forma más simple, con una analogía cotidiana, en máximo 120 palabras:\n${base.text}`, 'Explicación más simple', () => base.text);
  else if (f === 'exercise') gemini(`Crea un ejercicio práctico (solo el enunciado) para practicar lo siguiente:\n${base.text}`, 'Ejercicio de práctica', () => '**Siguiente reto**\nInventa un problema nuevo sobre este tema y resuélvelo sin mirar tus apuntes.');
  else if (f === 'cards') suggestCardsFromText(base.title === 'Tutor Learny' ? clean($('#tutor-subject').value, 60) || 'Tutor' : base.title, base.text, { origin: 'ia' });
  else if (f === 'note') { state.notes.push({ id: uid(), date: today(), text: base.text.slice(0, 2000) }); save(); renderAll(); toast('Respuesta guardada en Notas rápidas.'); }
});

function cloze(sentence, topic) {
  const word = sentence.split(/\s+/).map((x) => x.replace(/[^\p{L}\p{N}-]/gu, '')).filter((x) => x.length >= 5).sort((a, b) => b.length - a.length)[0];
  return word
    ? { question: `Completa: ${sentence.split(word).join('_____').slice(0, 400)}`, answer: `${word}. ${sentence}`.slice(0, 1200) }
    : { question: `¿Cómo explicarías esta idea de ${topic || 'tu tema'}?`, answer: sentence.slice(0, 1200) };
}
