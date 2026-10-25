/* Learny · parte 16 de 16 · Lumi (compañero de estudio)
   Mascota opcional: una abeja pixelada en SVG que acompaña en momentos concretos. No guarda datos propios:
   solo lee state/timer y respeta settings.mascot. Se carga con <script defer> después de 15-inicio.js y
   comparte el ámbito global con las demás partes (no hay import/export).
   Bloque 1: componente, ajustes, accesibilidad, temas y estados NEUTRAL y FOCUS.
   Bloque 2: reacciones mínimas CELEBRATE y SUPPORT (segundo slot de texto en Práctica).
   Bloque 3: PROGRESS, WELCOME, EMPTY y prioridades completas entre estados.
   Avatar (bloque 2): la abeja se redibuja fiel a la referencia (rejilla 40×40, mapa BEE_MAP) y gana poses solo en CSS; esta lógica no cambió.
   Apariencias: 'bee' (predeterminada, abajo), 'eevee' (arte en 16-lumi-eevee.js), 'walle' (arte en 16-lumi-walle.js) 'daniel' (arte en 16-lumi-daniel.js) 'yor' (arte en 16-lumi-yor.js) y 'gato' (Cat Black, arte en 16-lumi-gato.js). La luciérnaga no existe. Un solo controlador: elegir apariencia solo cambia data-avatar en #lumi.
   Antes: la abeja pixelada era la única apariencia. Los estados (data-pose / data-anim / data-react) viven en #lumi;
   no hay listeners, cooldowns ni mensajes propios del dibujo. */
'use strict';

/* Todos los valores ajustables viven aquí (tiempos en milisegundos). */
const LUMI_CONFIG = Object.freeze({
  messageMs: 5000,              // cuánto permanece visible un mensaje
  enterMs: 300,                 // entrada (solo CSS: la lógica no espera a que termine)
  proactiveDelayMs: 900,        // espera tras abrir antes de evaluar el mensaje proactivo de la visita
  visitGapMs: 30 * 60 * 1000,   // volver tras tanto tiempo con la pestaña oculta cuenta como visita nueva
  supportCooldownMs: 90 * 1000, // mínimo entre dos mensajes de apoyo (medido desde el último mostrado)
  pendingTtlMs: 20 * 1000,      // una reacción bloqueada (ventana abierta, otra página) caduca a los 20 s: no hay cola
  progressCooldownMs: 90 * 1000, // mínimo entre dos mensajes de progreso
  longMessageMs: 9000,          // v74: los mensajes largos (dato curioso, consejos) se quedan más tiempo para poder leerse
  tomorrowMin: 10,              // v73: con al menos tantos repasos programados para mañana, Lumi lo menciona (en lugar del mensaje neutro)
  welcomeAfterDays: 3,          // días sin actividad (sesiones y repasos, como el saludo) para dar la bienvenida
  reactMs: 400,                 // duración del gesto breve (solo CSS; la lógica no espera a animationend)
  restAfterMs: 30 * 1000,       // sin actividad durante tanto tiempo, los movimientos de reposo se detienen (0 = nunca); cualquier toque, tecla o evento de la app los reanuda
  restWaitMs: 6 * 1000          // al detenerlos se espera al final del ciclo de respiración (4,5 s) para no cortar el movimiento; si no llega, se detienen igualmente a los 6 s
});
const LUMI_TEXT = Object.freeze({
  neutral: '¿Empezamos con algo corto?', celebrate: 'Bloque completado.', support: 'Esta vuelve pronto. Sin prisa.',
  progress: 'En el repaso anterior marcaste «No lo sabía»; esta vez, «Fácil».',
  welcome: 'Bienvenido de nuevo. Podemos empezar con algo corto.', empty: 'Crea tu primera tarjeta para empezar.', factPrefix: 'Dato curioso:'
});
/* Prioridad: un mensaje no interrumpe a otro de mayor prioridad. reaction = acción confirmada; context = bienvenida / estado vacío; generic = neutro. */
const LUMI_PRIO = Object.freeze({ generic: 1, context: 2, reaction: 3 });
/* v74: variedad. Las reacciones rotan entre varias frases (nunca la misma dos veces seguidas); el primer texto de cada lista es el original. Los consejos salen como mensaje proactivo en Hoy. */
const LUMI_VARIANTS = Object.freeze({
  celebrate: ['Bloque completado.', 'Un bloque más hecho.', 'Buen ritmo: bloque completado.'],
  support: ['Esta vuelve pronto. Sin prisa.', 'Volverá pronto; así se fija mejor.', 'Fallar también enseña. Sin prisa.'],
  progress: ['En el repaso anterior marcaste «No lo sabía»; esta vez, «Fácil».', 'Esta te costó la vez anterior y ahora la marcaste «Fácil».']
});
const LUMI_TIPS = Object.freeze([
  'Intentar recordar antes de mirar la respuesta fortalece la memoria.',
  'Un descanso corto entre bloques ayuda a mantener la atención.',
  'Explicar algo en voz alta muestra qué te falta por entender.',
  'Estudiar un poco cada día rinde más que mucho un solo día.',
  'Anotar tus dudas mientras estudias te ayuda a resolverlas después.'
]);
const lumiTomorrowText = (n) => `Mañana te tocan ${plural(n, 'repaso', 'repasos')}.`; // v73: lleva una cifra, por eso no está en LUMI_TEXT (traducción: regla en RULES de 18-idioma.js)

/* ---- Abeja pixelada (bloque 2): arte fiel a la referencia, rejilla 40×40 (1 celda = 1 rect). Sin curvas, sin degradados y SIN id (varias copias en la página no chocan).
   BEE_MAP es el sprite de 34×29 celdas, colocado en (3, 5) de la rejilla. Cada letra es un rol de color (clase .b-*, variables --bee-* en style.css para los temas):
   r contorno exterior · l contorno oscuro · k lateral casi negro · b franjas marrones · y cara superior · z brillo superior · o panel ocre · f cara frontal · g brillo blanco · c reflejo crema
   n franja translúcida del lateral · w contorno de ala · i interior de ala (translúcido) · a antena · h reflejo crema de la cara · p mejilla/lengua · E ojo (arco cerrado) · M/N boca (contorno/interior).
   Los grupos (.bee-halo/.bee-body/.bee-wing-l/.bee-wing-r/.bee-antennae/.bee-face/.bee-eyes) son los ganchos de las poses (solo CSS). */
const BEE_MAP = Object.freeze([
  '.....................rr...........',
  '...................rrbbrr.........',
  '...wwww..........rrbbbbbbrr.......',
  '..wiiiiww......rrbbbbbbbbbbrr.....',
  '.wiiwiiiiww..rrbbbbyybbbbbbbbrr...',
  '.wiiiwwwiiiwrbbyybbbbyybbbbbbbbrr.',
  '..wiiiiiiyyaibbbbyybbbbyybbbbbbbkr',
  '...wwiiyyabzwyybbbbyybbbbyybbbbkkr',
  '.....wwbayyyayyyybbbbyybbbbyykkkkr',
  '....rlbcgaayyyyyyyybbbbyybbkokkkkr',
  '....rlfyyyyyyyyyyyyyybbbbkkkokkkkr',
  '....rlllfyyyyyyyyynngggnnokkokkkkr',
  '...rlllllffyyyyynyyyyookkzkkokkkkr',
  '...rllfflffffyyygyyoozzkkonkokkkkr',
  '....rlfffffffffyyzofooonnonkokkkkr',
  '....rllffffEEEffoozzoookkonkokkkkr',
  '....rllhhfEEEEEfoooozzokkzkkokkkkr',
  '....rllhhfEfffEfooooooznnokkokkkkr',
  '....rllllfffffffoooooookkokkokkkkr',
  '....rllllffffhhfoNoooookkokkokkkkr',
  '....rlfllffffhhMNNoooookkokkokkrr.',
  '....rlppfffffMMMNNoooookkokkkrr...',
  '....rllffffffMMMNNoooookkkkkr.....',
  '.....rrllffffMMMNNoooookkrkkr.....',
  '.......rrllffffMNooookkkr.rr......',
  '.........rrllfppoookkrkkr.........',
  '...........rrllfokkkr.rr..........',
  '.............rrlkrkkr.............',
  '...............rr.rr..............'
]);
const BEE_CELL = Object.freeze({ r: 'rim', l: 'line', k: 'sideD', b: 'topD', y: 'top', z: 'topH', o: 'side', f: 'front', g: 'glint', c: 'cream', n: 'stripe', w: 'wing', i: 'wingI', a: 'ant', h: 'cream', p: 'cheek', E: 'line', M: 'line', N: 'sideD' });
function lumiBeeSvg() {
  const N = 40, OX = 3, OY = 5, SPLIT = 7; // posición del sprite en la rejilla; las columnas < SPLIT del ala pertenecen al ala izquierda
  const layerOf = (ch, x) => (ch === 'r' ? 'halo' : ch === 'w' || ch === 'i' ? (x < SPLIT ? 'wl' : 'wr') : ch === 'a' ? 'ant' : ch === 'E' ? 'eyes' : 'hpMN'.includes(ch) ? 'face' : 'body');
  const L = { halo: {}, body: {}, wl: {}, wr: {}, ant: {}, eyes: {}, face: {} };
  BEE_MAP.forEach((row, y) => {
    for (let x = 0; x < row.length;) { // tramos horizontales del mismo rol y grupo → un rect
      const ch = row[x], cls = BEE_CELL[ch]; if (!cls) { x++; continue; }
      const layer = layerOf(ch, x); let w = 1;
      while (x + w < row.length && row[x + w] === ch && layerOf(ch, x + w) === layer) w++;
      (L[layer][cls] ||= []).push(`<rect x="${x + OX}" y="${y + OY}" width="${w}" height="1"/>`); x += w;
    }
  });
  const emit = (g) => Object.entries(g).map(([c, r]) => `<g class="b-${c}">${r.join('')}</g>`).join('');
  return `<svg class="lumi-svg lumi-svg--bee" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">`
    + `<g class="bee-halo">${emit(L.halo)}</g><g class="bee-body">${emit(L.body)}</g>`
    + `<g class="bee-wings"><g class="bee-wing bee-wing-l">${emit(L.wl)}</g><g class="bee-wing bee-wing-r">${emit(L.wr)}</g></g>`
    + `<g class="bee-antennae">${emit(L.ant)}</g><g class="bee-face"><g class="bee-eyes">${emit(L.eyes)}</g>${emit(L.face)}</g></svg>`;
}

const LumiCompanion = (() => {
  const C = LUMI_CONFIG, byId = (id) => document.getElementById(id);
  let root = null, msgEl = null, liveEl = null, cardMsgEl = null;
  let enabled = false, wired = false, visitUsed = false, hiddenAt = 0;
  let msgTimer = 0, liveTimer = 0, enterTimer = 0, proactiveTimer = 0, pendingTimer = 0, reactTimer = 0;
  let resting = false, restTimer = 0, restFallback = 0, restPending = false, lastWakeAt = 0; // reposo en calma (v64)
  let curPrio = 0, curSlot = '', pending = null, lastSupportAt = 0, lastSupportRv = null, lastProgressAt = 0, lastProgressRv = null;
  const celebrated = new Set(); // ids de sesión ya celebradas (en memoria: pomodone no se repite al recargar ni llega de otra pestaña)
  const PAGE_OF = { study: 'study', practice: 'practice' };
  const ART = { bee: ['Abeja pixelada', () => lumiBeeSvg()], eevee: ['Eevee', typeof lumiEeveeSvg === 'function' ? () => lumiEeveeSvg() : null], walle: ['WALL·E', typeof lumiWalleSvg === 'function' ? () => lumiWalleSvg() : null], daniel: ['Daniel Carreon', typeof lumiDanielSvg === 'function' ? () => lumiDanielSvg() : null], yor: ['Yor Forger', typeof lumiYorSvg === 'function' ? () => lumiYorSvg() : null], gato: ['Cat Black', typeof lumiGatoSvg === 'function' ? () => lumiGatoSvg() : null], cc: ['Miku Nakano', typeof lumiCcSvg === 'function' ? () => lumiCcSvg() : null] }; // apariencias disponibles (id → [nombre, dibujo]); sin el archivo del arte, solo la abeja
  let avatar = 'bee';
  const GESTURE = { celebrate: true, welcome: true, support: true, progress: true, empty: true }; // gestos de la abeja; support/progress/empty solo se ven si el personaje está visible en la página donde ocurren

  const reduced = () => !!(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('reduce-motion'));
  const focusActive = () => typeof timer !== 'undefined' && timer.running && timer.mode === 'focus'; // enfoque realmente en marcha (en pausa no cuenta)
  const sessionOpen = () => typeof timer !== 'undefined' && !!timer.started;                           // bloque empezado, aunque esté en pausa
  const examOn = () => typeof exam !== 'undefined' && !!exam; // ninguna reacción durante un examen
  const blocked = () => (typeof modalOpen === 'function' && modalOpen()) || !!byId('confirm-modal')?.open || (typeof landingOn !== 'undefined' && landingOn);

  /* ---- Mensaje: visibilidad independiente del personaje y de la animación. Siempre textContent. ---- */
  function clearMessage() {
    clearTimeout(msgTimer); clearTimeout(liveTimer); msgTimer = liveTimer = 0; curPrio = 0; curSlot = '';
    [msgEl, cardMsgEl].forEach((el) => { if (el) { el.textContent = ''; el.dataset.on = 'false'; } });
    if (liveEl) liveEl.textContent = '';
  }
  function dropPending() { clearTimeout(pendingTimer); pendingTimer = 0; pending = null; }
  function say(text, { announce = false, prio = LUMI_PRIO.generic, slot = 'study', ms = 0 } = {}) { // announce: solo para información que ningún toast anuncia ya
    const el = slot === 'practice' ? cardMsgEl : msgEl;
    if (!enabled || !el || focusActive() || examOn() || document.hidden) return false;
    if (curPrio > prio) return false; // un mensaje de reacción visible no se pisa con uno genérico
    clearMessage();
    el.textContent = text; el.dataset.on = 'true'; curPrio = prio; curSlot = slot;
    if (announce) liveTimer = setTimeout(() => { if (liveEl) liveEl.textContent = text; }, 30);
    msgTimer = setTimeout(clearMessage, ms || C.messageMs);
    return true;
  }

  /* ---- Pose y animación (solo atributos propios; no se tocan clases ajenas) ---- */
  function syncPose() {
    if (!enabled || !root) return;
    const focus = focusActive();
    root.dataset.pose = focus ? 'focus' : 'neutral';
    applyAnim();
    if (focus) { clearMessage(); dropPending(); clearTimeout(reactTimer); root.removeAttribute('data-react'); } // durante el enfoque no hay mensajes ni reacciones en espera
  }
  /* Reposo con vida con tope (v64): los movimientos infinitos de reposo (data-anim="idle") repintan el SVG en cada fotograma. Tras restAfterMs sin actividad pasan a data-anim="rest" (sin animaciones, pose de la referencia)
     y vuelven con la primera actividad. Solo representación: no toca mensajes, reacciones, prioridades ni cooldowns. */
  function applyAnim() { if (root) root.dataset.anim = focusActive() || reduced() ? 'none' : resting ? 'rest' : 'idle'; }
  function goRest() { clearTimeout(restFallback); restPending = false; if (!enabled || !root || resting) return; resting = true; applyAnim(); }
  function askRest() { // espera al final del ciclo de respiración para que el corte no se note
    if (!enabled || !root || resting) return;
    if (root.dataset.anim !== 'idle') { restTimer = setTimeout(askRest, C.restAfterMs); return; } // enfoque o movimiento reducido: no hay nada que detener; se reintenta más tarde
    restPending = true; clearTimeout(restFallback); restFallback = setTimeout(goRest, C.restWaitMs);
  }
  function wake() {
    clearTimeout(restTimer); clearTimeout(restFallback); restPending = false;
    if (!enabled) return;
    if (resting) { resting = false; applyAnim(); }
    if (C.restAfterMs > 0) restTimer = setTimeout(askRest, C.restAfterMs);
  }
  function onActivity() { const t = Date.now(); if (!resting && t - lastWakeAt < 1000) return; lastWakeAt = t; wake(); } // limitado a 1 por segundo mientras no esté en reposo
  const onBreathe = (e) => { if (restPending && e.animationName === 'lumi-breathe') goRest(); };
  const ACTIVITY = ['pointerdown', 'keydown', 'wheel', 'touchstart'], WAKE_EVENTS = ['learny:page', 'learny:rated', 'learny:pomodone', 'learny:timer', 'learny:examend', 'learny:reset'];
  function playEnter() {
    clearTimeout(enterTimer); root.classList.remove('is-entering');
    if (reduced() || document.hidden) return;
    void root.offsetWidth; root.classList.add('is-entering');
    enterTimer = setTimeout(() => root.classList.remove('is-entering'), C.enterMs + 100);
  }

  function playGesture(kind) { // un solo ciclo de transform/opacity; se limpia con un temporizador, no con animationend
    clearTimeout(reactTimer); root.removeAttribute('data-react');
    if (!GESTURE[kind] || reduced() || document.hidden || root.hidden) return;
    void root.offsetWidth; root.dataset.react = kind;
    reactTimer = setTimeout(() => root.removeAttribute('data-react'), C.reactMs + 100);
  }

  /* ---- Mensaje proactivo: como máximo uno por visita (visita = una carga de página, o volver tras visitGapMs oculta) ----
     Un solo candidato por visita, según la página: Inicio → WELCOME (≥ welcomeAfterDays sin actividad) o NEUTRAL; Práctica → EMPTY (sin ninguna tarjeta). */
  const welcomeDue = () => typeof daysSinceActivity === 'function' && daysSinceActivity() >= C.welcomeAfterDays; // mismo cálculo que el saludo de Inicio
  const tomorrowCount = () => { const d = addDays(today(), 1); return state.cards.filter((c) => !c.archived && !c.corrupt && c.nextReview === d).length; }; // mismo criterio que la previsión de 7 días de Reforzar
  const emptyDue = () => state.cards.length === 0; // ni activas ni archivadas: quien tiene material archivado no es «primera tarjeta»
  /* v74: qué dice Lumi en Hoy (un solo mensaje proactivo por visita). Orden: el dato curioso del día (una vez al día; la clave aparte guarda el día) > repasos de mañana (≥ tomorrowMin) >
     uno al azar entre: neutro, consejo, días hasta el próximo examen (≤ 7), progreso de la meta de hoy y racha (≥ 2), sin repetir el de la visita anterior. «Mostrar el dato curioso» (Ajustes) también apaga el del día. */
  const FACT_KEY = 'learny.lumi.fact';
  const factToday = () => (typeof facts !== 'undefined' && facts.length ? facts[new Date().getDate() % facts.length] : ''); // el mismo dato que calcula renderFocus()
  let lastChatter = '';
  function studyChatter() {
    const ctx = LUMI_PRIO.context, gen = LUMI_PRIO.generic, fact = factToday(), long = C.longMessageMs;
    if (fact && state.settings.showFact !== false && store.get(FACT_KEY) !== today()) return { kind: 'fact', text: `${LUMI_TEXT.factPrefix} ${fact}`, prio: ctx, slot: 'study', ms: long };
    const n = tomorrowCount();
    if (n >= C.tomorrowMin) return { kind: 'tomorrow', text: lumiTomorrowText(n), prio: ctx, slot: 'study' };
    const pool = [{ kind: 'neutral', text: LUMI_TEXT.neutral, prio: gen, slot: 'study' }, { kind: 'tip', text: LUMI_TIPS[Math.floor(Math.random() * LUMI_TIPS.length)], prio: gen, slot: 'study', ms: long }];
    const next = typeof upcoming === 'function' ? upcoming()[0] : null, left = next ? daysUntil(next.date) : -1;
    if (left >= 1 && left <= 7) pool.push({ kind: 'exam', text: `${left === 1 ? 'Falta' : 'Faltan'} ${plural(left, 'día', 'días')} para tu próximo examen.`, prio: gen, slot: 'study' });
    const done = state.sessions.filter((s) => s.date === today() && !s.abandon).length, goal = num(state.settings.dailyGoal, 1, 12, 2);
    if (done > 0 && done < goal) pool.push({ kind: 'goal', text: `Hoy llevas ${done} de ${goal} bloques de tu meta.`, prio: gen, slot: 'study' });
    const st = typeof calcStreak === 'function' ? calcStreak().streak : 0;
    if (st >= 2) pool.push({ kind: 'streak', text: `Racha actual: ${plural(st, 'día', 'días')}.`, prio: gen, slot: 'study' });
    const opts = pool.filter((x) => x.kind !== lastChatter), c = opts[Math.floor(Math.random() * opts.length)];
    lastChatter = c.kind; return c;
  }
  const lastVariant = {};
  function variant(kind) { // una frase de LUMI_VARIANTS[kind], distinta de la última usada
    const l = LUMI_VARIANTS[kind]; if (!l) return LUMI_TEXT[kind];
    let i; do { i = Math.floor(Math.random() * l.length); } while (l.length > 1 && i === lastVariant[kind]);
    lastVariant[kind] = i; return l[i];
  }
  function maybeProactive() {
    if (!enabled || visitUsed || document.hidden) return;
    if (focusActive() || sessionOpen() || blocked() || examOn()) return;
    let p = null;
    if (currentPage === 'study') {
      if (welcomeDue()) p = { kind: 'welcome', text: LUMI_TEXT.welcome, prio: LUMI_PRIO.context, slot: 'study' };
      else if (!(typeof isNewUser === 'function' && isNewUser())) p = studyChatter(); // v74: dato del día, repasos de mañana o un mensaje variado // usuario nuevo: sin neutro (su guía es el primer paso de Inicio)
    } else if (currentPage === 'practice' && emptyDue()) p = { kind: 'empty', text: LUMI_TEXT.empty, prio: LUMI_PRIO.context, slot: 'practice' };
    if (!p || !say(p.text, { prio: p.prio, slot: p.slot, ms: p.ms })) return;
    if (p.kind === 'fact') store.set(FACT_KEY, today()); // el dato del día se dice una sola vez al día
    visitUsed = true; playGesture(p.kind);
  }
  const scheduleProactive = (ms = C.proactiveDelayMs) => { clearTimeout(proactiveTimer); proactiveTimer = setTimeout(maybeProactive, ms); };

  /* ---- Reacciones (bloque 2). Una sola en espera como máximo: sin cola, caduca a los pendingTtlMs. ---- */
  // true = resuelta (mostrada o descartada); false = se conserva en espera (ventana abierta, pestaña oculta)
  function tryShow(r) {
    if (!enabled || focusActive() || examOn()) return true;
    if (blocked() || document.hidden) return false; // las reacciones salen en cualquier sección (Lumi vive en el dock global)
    if (!say(r.text, { prio: LUMI_PRIO.reaction, slot: r.slot })) return false;
    visitUsed = true; // una reacción cuenta como la intervención de la visita: el mensaje proactivo no llega justo detrás
    if (r.kind === 'support') lastSupportAt = Date.now(); else if (r.kind === 'progress') lastProgressAt = Date.now();
    playGesture(r.kind);
    return true;
  }
  function react(r) {
    if (tryShow(r)) return;
    clearTimeout(pendingTimer); pending = r; pendingTimer = setTimeout(dropPending, C.pendingTtlMs);
  }
  function flushPending() { if (pending && tryShow(pending)) dropPending(); }

  function onPomodone() { // se emite al cerrar la valoración; justo después se abre el cierre del bloque (el tick deja que abra)
    setTimeout(() => {
      if (!enabled) return;
      const s = [...state.sessions].reverse().find((x) => x && !x.abandon && x.date === today());
      if (!s || !s.id || celebrated.has(s.id)) return; // una vez por sesión registrada
      celebrated.add(s.id);
      react({ kind: 'celebrate', text: variant('celebrate'), slot: 'study' });
    }, 0);
  }
  function onRated() { // en examRate el evento sale ANTES de guardar y con exam activo: se ignora; en rateCard sale con el repaso ya registrado
    if (examOn()) return;
    setTimeout(() => {
      if (!enabled || examOn()) return;
      const rv = state.reviews[state.reviews.length - 1];
      if (!rv || rv.exam) return;
      if (rv.rating === 'again') { // SUPPORT: una vez por repaso y con espera entre mensajes
        if (rv === lastSupportRv) return; lastSupportRv = rv;
        if (Date.now() - lastSupportAt < C.supportCooldownMs) return; // varios fallos seguidos: no se habla por cada uno
        react({ kind: 'support', text: variant('support'), slot: 'practice' });
      } else if (rv.rating === 'easy') { // PROGRESS: solo si el historial de ESA tarjeta lo demuestra (el anterior «No lo sabía», el último «Fácil»)
        if (rv === lastProgressRv) return; lastProgressRv = rv;
        const h = (state.cards.find((c) => c.id === rv.cardId)?.history) || [];
        if (h.length < 2 || h[h.length - 1].rating !== 'easy' || h[h.length - 2].rating !== 'again') return;
        if (Date.now() - lastProgressAt < C.progressCooldownMs) return;
        react({ kind: 'progress', text: variant('progress'), slot: 'practice' });
      }
    }, 0);
  }
  function onExamStart() { clearMessage(); dropPending(); }

  /* ---- Eventos (solo se escuchan mientras Lumi está activa) ---- */
  const onPage = () => { syncPose(); if (curSlot && curPrio < LUMI_PRIO.reaction && PAGE_OF[curSlot] !== currentPage) clearMessage(); flushPending(); if (!visitUsed) scheduleProactive(400); };
  const onReset = () => { clearMessage(); syncPose(); };
  const onDialogClose = () => { flushPending(); if (!visitUsed) scheduleProactive(400); };
  function onVisibility() {
    if (!root) return;
    root.dataset.paused = document.hidden ? 'true' : 'false'; // CSS pausa las animaciones con la pestaña oculta
    if (document.hidden) { hiddenAt = Date.now(); clearMessage(); return; }
    if (hiddenAt && Date.now() - hiddenAt >= C.visitGapMs) { visitUsed = false; scheduleProactive(); }
    hiddenAt = 0; wake(); syncPose(); flushPending();
  }
  const LISTENERS = { 'learny:timer': syncPose, 'learny:render': syncPose, 'learny:page': onPage, 'learny:reset': onReset, 'learny:pomodone': onPomodone, 'learny:rated': onRated, 'learny:examstart': onExamStart, 'learny:examend': onExamStart, visibilitychange: onVisibility };
  function wire() {
    if (wired) return; wired = true;
    Object.entries(LISTENERS).forEach(([k, f]) => document.addEventListener(k, f));
    ACTIVITY.forEach((k) => document.addEventListener(k, onActivity, { passive: true, capture: true })); WAKE_EVENTS.forEach((k) => document.addEventListener(k, wake));
    byId('app-modal')?.addEventListener('close', onDialogClose); byId('confirm-modal')?.addEventListener('close', onDialogClose);
  }
  function unwire() {
    if (!wired) return; wired = false;
    Object.entries(LISTENERS).forEach(([k, f]) => document.removeEventListener(k, f));
    ACTIVITY.forEach((k) => document.removeEventListener(k, onActivity, { capture: true })); WAKE_EVENTS.forEach((k) => document.removeEventListener(k, wake));
    byId('app-modal')?.removeEventListener('close', onDialogClose); byId('confirm-modal')?.removeEventListener('close', onDialogClose);
  }

  /* ---- Activar / desactivar (también desde la vista previa de Ajustes: applyAppearance llama a sync) ---- */
  function setEnabled(on) {
    if (!root) return;
    if (on === enabled) { if (on) syncPose(); return; }
    enabled = on;
    document.body.classList.toggle('has-lumi', on);
    root.hidden = !on; msgEl.hidden = !on; if (cardMsgEl) cardMsgEl.hidden = !on;
    if (on) {
      wire(); root.dataset.paused = document.hidden ? 'true' : 'false';
      resting = false; syncPose(); playEnter(); scheduleProactive(); wake();
    } else { // apagar: sin animaciones, sin temporizadores, sin mensajes pendientes y sin escuchar nada
      unwire(); clearTimeout(enterTimer); clearTimeout(proactiveTimer); clearTimeout(reactTimer); clearTimeout(restTimer); clearTimeout(restFallback); restPending = false; resting = false; root.removeAttribute('data-react'); root.classList.remove('is-entering'); clearMessage(); dropPending();
      root.dataset.pose = 'neutral'; root.dataset.anim = 'none';
    }
  }
  /* Apariencia: solo cambia qué dibujo se ve. No toca pose, mensaje, temporizadores, cooldowns ni foco; solo cancela con seguridad un gesto en curso (era del dibujo anterior). */
  function setAvatar(id) {
    if (!root) return;
    const next = ART[id]?.[1] ? id : 'bee'; // valor desconocido o arte ausente → abeja
    if (!root.querySelector(`.lumi-svg--${next}`)) root.insertAdjacentHTML('afterbegin', ART[next][1]());
    if (next === avatar && root.dataset.avatar === next) return;
    clearTimeout(reactTimer); root.removeAttribute('data-react');
    avatar = next; root.dataset.avatar = next;
  }
  const avatars = () => Object.entries(ART).filter(([, a]) => a[1]).map(([id, a]) => [id, a[0]]);
  const thumb = (id) => (ART[id]?.[1] ? `<span class="lumi lumi-thumb" data-avatar="${id}" aria-hidden="true">${ART[id][1]()}</span>` : ''); // miniatura decorativa para Ajustes: sin estados, sin animaciones y sin id
  const sync = (s) => { setAvatar(s && s.mascotAvatar); setEnabled(!!s && s.mascot === true); };

  function hide() { // el botón de Lumi: oculta y ofrece deshacer (mismo patrón que el resto de la app)
    state.settings.mascot = false; save(); applyAppearance();
    document.querySelector('.page.active h1')?.focus({ preventScroll: true }); // JS-101: el dock vive en todas las secciones; el foco pasa al título visible de la página actual
    offerUndo('Lumi está oculto. Puedes reactivarlo en Ajustes.', () => { state.settings.mascot = true; save(); applyAppearance(); });
  }

  function init() {
    root = byId('lumi'); msgEl = byId('lumi-msg'); liveEl = byId('lumi-live'); cardMsgEl = byId('lumi-msg-card') || msgEl; // el slot de Práctica ya no existe: todos los mensajes salen en el dock (visible en todas las secciones)
    if (!root || !msgEl) return;
    setAvatar(state.settings.mascotAvatar); // inserta el dibujo elegido (sin archivos externos)
    root.querySelector('.lumi-hide')?.addEventListener('click', hide);
    root.addEventListener('animationiteration', onBreathe); // la respiración marca el final de ciclo en el que se detiene el reposo
    sync(state.settings);
  }
  return Object.freeze({ init, sync, avatars, thumb });
})();
window.LumiCompanion = LumiCompanion;
LumiCompanion.init();
