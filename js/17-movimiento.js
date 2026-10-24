/* Learny · parte 17 · Movimiento (bloques 2 a 4: flashcards, listas, cambio de vista y barras)
   Módulo independiente: no cambia ningún otro .js. Se apoya en lo que ya existe:
   · el estado global de 07-tarjetas.js (activeCard, revealed, exam) para saber QUÉ tarjeta y en qué paso está;
   · el evento learny:rated (solo se emite en una calificación real, después de las protecciones de doble pulsación);
   · un MutationObserver sobre #flashcard y sobre las listas que la app reescribe con innerHTML, para distinguir lo realmente nuevo o eliminado.
   Todo usa la Web Animations API (element.animate): un solo ciclo, sin clases que limpiar, sin esperar a animationend,
   y cancelar una animación devuelve el elemento a su estado normal. Las duraciones salen de los tokens de motion.css;
   con movimiento reducido (sistema o Learny) --move-y vale 0 y --press 1: las entradas y salidas quedan en fundidos de opacidad de 80–100 ms, sin desplazamiento ni escala (v63). Un fallo aquí nunca impide usar la app.
   Bloque 3: la vista entrante (learny:page) y el scroll suave respetando el movimiento reducido. Los modales, el toast y el pulso del temporizador no pasan por aquí: los resuelve motion.css.
   Bloque 4: las barras del gráfico de foco (solo las que cambian de valor).
   v64 (Fase 2): los tokens se leen una vez y se guardan hasta que cambia el movimiento reducido; visible() descarta primero las páginas inactivas.
   v65 (Fase 3): fundido cruzado entre páginas (la saliente se desvanece como capa inerte) y borrado continuo en listas (el fantasma colapsa su altura y su hueco).
   v66 (Fase 4): escalonado de --stagger (30 ms) entre los elementos nuevos de una lista y limpieza de las clases del velo de calificación (el velo en sí es CSS, ver motion.css).
   Se carga con <script defer> después de 16-lumi.js (comparte el ámbito global; no hay import/export). */
'use strict';

(() => {
  const body = () => document.body;
  /* Tokens de motion.css: se leen del cuerpo UNA vez y se guardan; solo se vuelven a leer cuando cambia el movimiento reducido (sistema o Learny), que es lo único que los modifica.
     Antes cada animación llamaba a getComputedStyle (un cálculo de estilo) varias veces tras cada cambio del DOM. La comprobación del estado es solo classList + matchMedia: no fuerza estilo ni diseño. */
  const mqRM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  const cache = new Map(); let cacheKey = '';
  const stamp = () => `${body().classList.contains('reduce-motion') ? 1 : 0}${mqRM && mqRM.matches ? 1 : 0}`;
  const raw = (name) => {
    const k = stamp(); if (k !== cacheKey) { cache.clear(); cacheKey = k; }
    if (!cache.has(name)) cache.set(name, getComputedStyle(body()).getPropertyValue(name).trim());
    return cache.get(name);
  };
  const tok = (name, def) => { // token numérico (ms o px); respeta body.reduce-motion y prefers-reduced-motion
    const v = raw(name), n = parseFloat(v);
    if (!Number.isFinite(n)) return def;
    return /ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n;
  };
  const ease = (name, def) => raw(name) || def;
  const OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const pageOff = (el) => { const p = el.closest('.page'); return !!p && !p.classList.contains('active'); }; // descarte barato: la página no está activa (evita medir el diseño)
  const visible = (el) => !!el && typeof el.animate === 'function' && !document.hidden && el.isConnected && !pageOff(el) && el.getClientRects().length > 0;
  const run = (el, frames, opts) => { try { return el.animate(frames, opts); } catch { return null; } };
  const enterFrames = (y) => [{ opacity: 0, transform: `translateY(${y}px)` }, { opacity: 1, transform: 'none' }];

  /* ===== Flashcards: revelar respuesta y tarjeta nueva ===== */
  const card = document.getElementById('flashcard');
  let cardKey = '', cardAnims = [], rateAnim = null, veilTimer = 0;
  const keyNow = () => { // identifica «qué se está mostrando»: modo + tarjeta + paso (pregunta / respuesta)
    try {
      if (typeof exam !== 'undefined' && exam) { const it = exam.cards[exam.i]; return it ? `e|${it.id}|${exam.revealed ? 'a' : 'q'}` : 'e|?|q'; }
      if (typeof activeCard !== 'undefined' && activeCard) return `c|${activeCard.id}|${typeof revealed !== 'undefined' && revealed ? 'a' : 'q'}`;
    } catch { /* sin estado todavía */ }
    return 'c|empty|q';
  };
  function onCard() {
    const prev = cardKey, key = keyNow();
    cardKey = key;
    if (key === prev) return; // renderAll() reescribe la tarjeta a menudo: mismo contenido = sin efecto
    cardAnims.forEach((a) => { try { a.cancel(); } catch { /* ya terminó */ } }); cardAnims = []; // otra tarjeta o paso: sustituye el efecto anterior
    const div = card.querySelector(':scope > div');
    if (!div || !visible(card)) return;
    const isReveal = prev.endsWith('|q') && key.endsWith('|a') && prev.slice(0, -1) === key.slice(0, -1);
    const dur = tok(isReveal ? '--dur-reveal' : '--dur-base', isReveal ? 180 : 220), y = tok('--move-y', 6);
    if (dur <= 0) return;
    let target = div;
    if (isReveal) { // solo la respuesta entra; la pregunta ya estaba ahí (en examen el div ya es solo la respuesta)
      const hr = div.querySelector(':scope > hr');
      if (hr && !div.querySelector(':scope > .fc-ans')) { const w = document.createElement('div'); w.className = 'fc-ans'; while (hr.nextSibling) w.append(hr.nextSibling); div.append(w); }
      target = div.querySelector(':scope > .fc-ans') || div;
    }
    const a = run(target, enterFrames(y), { duration: dur, easing: ease('--ease-out', OUT) });
    if (a) cardAnims.push(a);
  }
  if (card) { cardKey = keyNow(); new MutationObserver(() => { try { onCard(); } catch (e) { console.error('Learny · movimiento', e); } }).observe(card, { childList: true }); }

  /* Feedback de calificación: el mismo asentamiento mínimo de la tarjeta para las tres notas.
     learny:rated solo sale tras las protecciones de doble pulsación, así que el efecto no habilita registros extra ni toca el repaso. */
  document.addEventListener('learny:rated', () => {
    try {
      /* v66: el velo (::after, ver motion.css) lo dibuja la clase fb-good / fb-soft que añade flashFeedback(). Aquí solo se retira la clase al terminar:
         si se quedara puesta, volver a mostrar la página de Practicar (display none → block) reiniciaría la animación CSS. */
      clearTimeout(veilTimer);
      veilTimer = setTimeout(() => { if (card) card.classList.remove('fb-good', 'fb-soft'); }, tok('--dur-veil', 320) + 120);
      const d = tok('--dur-fast', 140), press = tok('--press', 0.98);
      if (d <= 0 || press >= 1 || !visible(card)) return;
      if (rateAnim) { try { rateAnim.cancel(); } catch { /* ya terminó */ } }
      rateAnim = run(card, [{ transform: `scale(${1 - (1 - press) * 0.75})` }, { transform: 'none' }], { duration: d, easing: ease('--ease-out', OUT) });
    } catch (e) { console.error('Learny · movimiento', e); }
  });

  /* ===== Listas: entran los elementos realmente nuevos, salen (se desvanecen) los eliminados ===== */
  const KEY_SEL = '[data-return-card],[data-edit-card],[data-delete-deadline],[data-note-del],[data-task]';
  const keyOf = (n) => { // el id del elemento, leído del botón o casilla que ya lleva; sin tocar el marcado de la app
    if (!n || n.nodeType !== 1 || n.hasAttribute('data-ghost')) return '';
    const e = n.matches(KEY_SEL) ? n : n.querySelector(KEY_SEL); if (!e) return '';
    const d = e.dataset; return d.returnCard || d.editCard || d.deleteDeadline || d.noteDel || d.task || '';
  };
  let fresh = false; // los renders de «entrar a una página» no cuentan como cambios: la lista aparece ya dibujada
  document.addEventListener('learny:page', () => { fresh = true; setTimeout(() => { fresh = false; }, 0); });
  const MAX_IN = 6, MAX_OUT = 3; // un cambio masivo (importar, sincronizar otra pestaña, «Mostrar más») no se anima

  /* Salida de los elementos eliminados (v65). Con movimiento: cada fantasma se desvanece y colapsa su altura, relleno y borde hasta 0, y el hueco entre filas (row-gap de la rejilla, que un elemento no puede encoger por sí solo)
     se cierra con un margen negativo animado en el vecino que queda (el siguiente; si no hay, el anterior). Así lo de abajo sube de forma continua y al retirar el fantasma no hay salto.
     Sin movimiento (--move-y = 0): solo se desvanece, como antes. Una sola limpieza (temporizador de respaldo + onfinish) cancela las animaciones y retira los fantasmas en el mismo instante. */
  function exitGhosts(ghosts, box, y, dOut) {
    const anims = []; let done = false;
    const finish = () => { if (done) return; done = true; anims.forEach((a) => { try { a.cancel(); } catch { /* ya terminó */ } }); ghosts.forEach((g) => g.remove()); };
    const keep = (a) => { if (a) anims.push(a); return a; };
    if (!(y > 0)) {
      ghosts.forEach((g) => keep(run(g, [{ opacity: 1 }, { opacity: 0 }], { duration: dOut, easing: ease('--ease-in', 'ease-in'), fill: 'forwards' })));
      setTimeout(finish, dOut + 80); if (anims[0]) anims[0].onfinish = finish; else finish();
      return;
    }
    const dur = tok('--dur-base', 220), eas = ease('--ease-move', 'ease-in-out'), px = (v) => `${parseFloat(v) || 0}px`;
    const gap = parseFloat(getComputedStyle(box).rowGap) || 0;
    const from = ghosts.map((g) => { const cs = getComputedStyle(g); return { opacity: 1, height: `${g.getBoundingClientRect().height}px`, paddingTop: px(cs.paddingTop), paddingBottom: px(cs.paddingBottom), borderTopWidth: px(cs.borderTopWidth), borderBottomWidth: px(cs.borderBottomWidth) }; }); // primero se mide todo
    const zero = { opacity: 0, height: '0px', paddingTop: '0px', paddingBottom: '0px', borderTopWidth: '0px', borderBottomWidth: '0px' };
    ghosts.forEach((g, i) => { g.style.overflow = 'hidden'; keep(run(g, [from[i], { opacity: 0, offset: 0.5 }, zero], { duration: dur, easing: eas, fill: 'forwards' })); });
    if (gap > 0) {
      const live = (n, dir) => { while (n && n.hasAttribute('data-ghost')) n = n[dir]; return n; }, near = new Map();
      ghosts.forEach((g) => {
        let n = live(g.nextElementSibling, 'nextElementSibling'), side = 'marginTop';
        if (!n) { n = live(g.previousElementSibling, 'previousElementSibling'); side = 'marginBottom'; }
        if (n) { const k = near.get(n) || { marginTop: 0, marginBottom: 0 }; k[side] += gap; near.set(n, k); }
      });
      near.forEach((k, n) => keep(run(n, [{ marginTop: '0px', marginBottom: '0px' }, { marginTop: `${-k.marginTop}px`, marginBottom: `${-k.marginBottom}px` }], { duration: dur, easing: eas, fill: 'forwards' })));
    }
    setTimeout(finish, dur + 80); if (anims[0]) anims[0].onfinish = finish; else finish();
  }
  function diff(box, obs, recs, quiet) {
    const added = new Set(), removed = [];
    recs.forEach((r) => { r.addedNodes.forEach((n) => added.add(n)); r.removedNodes.forEach((n) => removed.push(n)); });
    if (![...added].some((n) => !(n.nodeType === 1 && n.hasAttribute('data-ghost')))) return; // solo se retiró un fantasma: nada que comparar
    const cur = [...box.children].filter((n) => keyOf(n));
    const curKeys = new Map(cur.map((n) => [keyOf(n), n]));
    const old = removed.filter((n) => !added.has(n) && keyOf(n));
    const oldKeys = new Set(old.map(keyOf));
    if (quiet || !visible(box)) return;
    const dIn = tok('--dur-base', 220), dOut = tok('--dur-out', 150), y = tok('--move-y', 6), press = tok('--press', 0.98), step = Math.max(0, tok('--stagger', 30));
    const fresh1 = cur.filter((n) => !oldKeys.has(keyOf(n))), gone = old.filter((n) => !curKeys.has(keyOf(n)));
    /* v66: escalonado. Cada elemento nuevo espera --stagger × su posición (como mucho MAX_IN − 1 pasos ≈ 150 ms). fill: 'backwards' lo mantiene en el primer fotograma (opacidad 0) durante la espera
       para que no se vea entero y luego «salte»; al terminar la animación vuelve a su estado normal. Con movimiento reducido --stagger vale 0 y todos entran a la vez. */
    if (dIn > 0 && fresh1.length && fresh1.length <= MAX_IN) fresh1.forEach((n, i) => run(n, enterFrames(y), { duration: dIn, delay: i * step, fill: 'backwards', easing: ease('--ease-out', OUT) }));
    if (dOut > 0 && gone.length && gone.length <= MAX_OUT) {
      const tail = cur.length ? cur[cur.length - 1].nextSibling : box.firstChild; // sin sucesor conservado: después del último elemento vivo
      const ghosts = [];
      gone.forEach((g) => {
        let ref = null;
        for (let j = old.indexOf(g) + 1; j < old.length && !ref; j++) ref = curKeys.get(keyOf(old[j])) || null; // su lugar original: antes del siguiente que se conserva
        const ghost = g.cloneNode(true); // copia decorativa del elemento eliminado: no interactiva, oculta para lectores de pantalla y sin ids
        ghost.setAttribute('data-ghost', ''); ghost.setAttribute('aria-hidden', 'true'); ghost.inert = true; ghost.style.pointerEvents = 'none';
        ghost.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
        box.insertBefore(ghost, ref || tail);
        ghosts.push(ghost);
      });
      exitGhosts(ghosts, box, y, dOut);
      obs.takeRecords(); // los fantasmas insertados son nuestros: no se vuelven a analizar
    }
  }
  function watch(id, quietFn) {
    const box = document.getElementById(id); if (!box) return;
    const obs = new MutationObserver((recs) => {
      try { diff(box, obs, recs, (quietFn ? quietFn() : false) || fresh); } catch (e) { console.error('Learny · movimiento', e); }
    });
    obs.observe(box, { childList: true });
  }
  let libQ = document.getElementById('library-search')?.value || '';
  watch('library-list', () => { const q = document.getElementById('library-search')?.value || '', changed = q !== libQ; libQ = q; return changed; }); // buscar o borrar la búsqueda no es «entrada»
  watch('deadline-list'); watch('today-tasks'); watch('notes-list');

  /* ===== Bloque 3: cambio de vista ===== */
  /* showPage() cambia display/clase de forma síncrona y avisa con learny:page: la vista saliente desaparece al instante (no es enfocable ni pulsable)
     y la entrante hace un fundido con un desplazamiento pequeño. Nunca hay opacity:0 como estado base: si la animación no corre, la vista ya se ve.
     Navegación rápida: cada cambio cancela la animación anterior (queda como mucho una). Mismo destino (showPage('study') estando en Hoy) = sin efecto. */
  let lastPage = typeof currentPage !== 'undefined' ? currentPage : '', viewAnim = null;
  document.addEventListener('learny:page', () => {
    try {
      const page = typeof currentPage !== 'undefined' ? currentPage : ''; if (!page || page === lastPage) { lastPage = page || lastPage; return; }
      lastPage = page;
      if (viewAnim) { try { viewAnim.cancel(); } catch { /* ya terminó */ } viewAnim = null; }
      const el = document.getElementById(page), dur = tok('--dur-view', 260), y = tok('--move-y', 6);
      if (!el || dur <= 0 || !visible(el)) return;
      viewAnim = run(el, enterFrames(y), { duration: dur, easing: ease('--ease-out', OUT) });
    } catch (e) { console.error('Learny · movimiento', e); }
  });

  /* Scroll suave: scrollIntoView({ behavior: 'smooth' }) (p. ej. «Repasar ahora») ignora el movimiento reducido. Con movimiento reducido (sistema o Learny) pasa a salto directo. */
  const reduced = () => body().classList.contains('reduce-motion') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (typeof Element.prototype.scrollIntoView === 'function' && !Element.prototype.scrollIntoView.__learny) {
    const orig = Element.prototype.scrollIntoView;
    const wrapped = function (arg) {
      try { if (arg && typeof arg === 'object' && arg.behavior === 'smooth' && reduced()) return orig.call(this, { ...arg, behavior: 'auto' }); } catch { /* sin ajuste */ }
      return orig.apply(this, arguments);
    };
    wrapped.__learny = true; Element.prototype.scrollIntoView = wrapped;
  }

  /* ===== Fase 3: fundido cruzado entre páginas (v65) =====
     showPage() oculta la página saliente de forma síncrona. Un MutationObserver (microtarea, antes de pintar) detecta qué página perdió y cuál ganó `.active` y deja la saliente un instante
     como capa absoluta e inerte (clase .page-leaving, ver motion.css) que se desvanece en --dur-leave mientras la entrante hace su entrada de siempre. No se envuelve ni se cambia showPage():
     el cambio de página sigue siendo síncrono y la capa saliente es solo decoración (inert, aria-hidden, sin clics). Sin fundido si el modo sesión cambió (examen o enfoque), si la entrante no se ve,
     con la pestaña oculta o con --dur-leave a 0. Navegación rápida: cada cambio retira de inmediato la capa anterior. Si la animación falla, el temporizador de respaldo la retira igualmente. */
  let leaveDone = null;
  const sessionNow = () => { const c = body().classList; return c.contains('session-study') || c.contains('session-practice'); };
  let wasSession = sessionNow();
  const pageObs = new MutationObserver((recs) => {
    try {
      let out = null, inn = null;
      recs.forEach((r) => { const was = /(^|\s)active(\s|$)/.test(r.oldValue || ''), now = r.target.classList.contains('active'); if (was && !now) out = r.target; else if (!was && now) inn = r.target; });
      if (!out || !inn || out === inn) return;
      if (leaveDone) leaveDone(); // la capa anterior (si seguía) desaparece de inmediato
      const d = tok('--dur-leave', 120);
      if (d <= 0 || wasSession || !visible(inn)) return;
      out.style.top = `${inn.offsetTop}px`; out.style.left = `${inn.offsetLeft}px`; out.style.width = `${inn.offsetWidth}px`;
      out.classList.add('page-leaving'); out.inert = true; out.setAttribute('aria-hidden', 'true');
      const a = run(out, [{ opacity: 1 }, { opacity: 0 }], { duration: d, easing: ease('--ease-in', 'ease-in'), fill: 'forwards' });
      let done = false;
      const end = () => {
        if (done) return; done = true; if (leaveDone === end) leaveDone = null;
        try { if (a) a.cancel(); } catch { /* ya terminó */ }
        out.classList.remove('page-leaving'); out.inert = false; out.removeAttribute('aria-hidden'); out.style.top = out.style.left = out.style.width = '';
      };
      leaveDone = end; setTimeout(end, d + 80); if (a) a.onfinish = end; else end();
    } catch (e) { console.error('Learny · movimiento', e); }
  });
  document.querySelectorAll('.main > .page').forEach((p) => pageObs.observe(p, { attributes: true, attributeFilter: ['class'], attributeOldValue: true }));
  new MutationObserver(() => { wasSession = sessionNow(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] }); // creado después: en cada cambio el de páginas lee el estado ANTERIOR

  /* ===== Bloque 4: barras del gráfico de foco (#focus-chart) ===== */
  /* La app reescribe el gráfico con innerHTML en cada renderAll(). Se recuerda la altura de cada día y solo se anima la barra cuya altura cambió
     (crece o encoge desde la base, con scaleY, salvo con movimiento reducido; la altura real ya es la nueva, así que si la animación no corre se ve el valor correcto).
     Primer dibujo, entrar a la página (la vista ya hace su fundido: no se duplica) o gráfico oculto = sin efecto. */
  const chart = document.getElementById('focus-chart');
  if (chart) {
    const heights = () => {
      const m = new Map();
      chart.querySelectorAll(':scope > .bar-col').forEach((c) => { const b = c.querySelector('.bar'); if (b) m.set((c.getAttribute('title') || '').split(':')[0], parseFloat(b.style.height) || 0); });
      return m;
    };
    let prevH = heights();
    new MutationObserver(() => {
      try {
        const now = heights(), dur = tok('--dur-base', 220), was = prevH; prevH = now;
        if (fresh || dur <= 0 || reduced() || !visible(chart)) return; // crecer/encoger una barra es movimiento: con movimiento reducido no se anima
        chart.querySelectorAll(':scope > .bar-col').forEach((c) => {
          const b = c.querySelector('.bar'), k = (c.getAttribute('title') || '').split(':')[0], h = now.get(k), p = was.get(k);
          if (!b || p === undefined || !h || p === h) return; // sin valor previo, sin cambio o barra vacía (no hay desde dónde escalar)
          run(b, [{ transform: `scaleY(${p / h})` }, { transform: 'none' }], { duration: dur, easing: ease('--ease-move', 'ease-in-out') });
        });
      } catch (e) { console.error('Learny · movimiento', e); }
    }).observe(chart, { childList: true });
  }
})();
