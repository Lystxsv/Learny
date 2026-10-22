/* Learny · parte 17 · Movimiento (bloques 2 a 4: flashcards, listas, cambio de vista y barras)
   Módulo independiente: no cambia ningún otro .js. Se apoya en lo que ya existe:
   · el estado global de 07-tarjetas.js (activeCard, revealed, exam) para saber QUÉ tarjeta y en qué paso está;
   · el evento learny:rated (solo se emite en una calificación real, después de las protecciones de doble pulsación);
   · un MutationObserver sobre #flashcard y sobre las listas que la app reescribe con innerHTML, para distinguir lo realmente nuevo o eliminado.
   Todo usa la Web Animations API (element.animate): un solo ciclo, sin clases que limpiar, sin esperar a animationend,
   y cancelar una animación devuelve el elemento a su estado normal. Las duraciones salen de los tokens de motion.css;
   con movimiento reducido (sistema o Learny) los tokens valen 0 y no se anima nada. Un fallo aquí nunca impide usar la app.
   Bloque 3: la vista entrante (learny:page) y el scroll suave respetando el movimiento reducido. Los modales, el toast y el pulso del temporizador no pasan por aquí: los resuelve motion.css.
   Bloque 4: las barras del gráfico de foco (solo las que cambian de valor).
   Se carga con <script defer> después de 16-lumi.js (comparte el ámbito global; no hay import/export). */
'use strict';

(() => {
  const body = () => document.body;
  const tok = (name, def) => { // lee un token (ms o px) del cuerpo: así respeta body.reduce-motion y prefers-reduced-motion
    const v = getComputedStyle(body()).getPropertyValue(name).trim(), n = parseFloat(v);
    if (!Number.isFinite(n)) return def;
    return /ms$/.test(v) ? n : /s$/.test(v) ? n * 1000 : n;
  };
  const ease = (name, def) => getComputedStyle(body()).getPropertyValue(name).trim() || def;
  const OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const visible = (el) => !!el && typeof el.animate === 'function' && !document.hidden && el.isConnected && el.getClientRects().length > 0;
  const run = (el, frames, opts) => { try { return el.animate(frames, opts); } catch { return null; } };
  const enterFrames = (y) => [{ opacity: 0, transform: `translateY(${y}px)` }, { opacity: 1, transform: 'none' }];

  /* ===== Flashcards: revelar respuesta y tarjeta nueva ===== */
  const card = document.getElementById('flashcard');
  let cardKey = '', cardAnims = [], rateAnim = null;
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

  /* Feedback de calificación: el mismo para «No lo sabía», «Dudé» y «Fácil» (un asentamiento mínimo de la tarjeta, sin color ni sacudida).
     learny:rated solo sale tras las protecciones de doble pulsación, así que el efecto no habilita registros extra ni toca el repaso. */
  document.addEventListener('learny:rated', () => {
    try {
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

  function diff(box, obs, recs, quiet) {
    const added = new Set(), removed = [];
    recs.forEach((r) => { r.addedNodes.forEach((n) => added.add(n)); r.removedNodes.forEach((n) => removed.push(n)); });
    if (![...added].some((n) => !(n.nodeType === 1 && n.hasAttribute('data-ghost')))) return; // solo se retiró un fantasma: nada que comparar
    const cur = [...box.children].filter((n) => keyOf(n));
    const curKeys = new Map(cur.map((n) => [keyOf(n), n]));
    const old = removed.filter((n) => !added.has(n) && keyOf(n));
    const oldKeys = new Set(old.map(keyOf));
    if (quiet || !visible(box)) return;
    const dIn = tok('--dur-base', 220), dOut = tok('--dur-out', 150), y = tok('--move-y', 6), press = tok('--press', 0.98);
    const fresh1 = cur.filter((n) => !oldKeys.has(keyOf(n))), gone = old.filter((n) => !curKeys.has(keyOf(n)));
    if (dIn > 0 && fresh1.length && fresh1.length <= MAX_IN) fresh1.forEach((n) => run(n, enterFrames(y), { duration: dIn, easing: ease('--ease-out', OUT) }));
    if (dOut > 0 && gone.length && gone.length <= MAX_OUT) {
      const tail = cur.length ? cur[cur.length - 1].nextSibling : box.firstChild; // sin sucesor conservado: después del último elemento vivo
      gone.forEach((g) => {
        let ref = null;
        for (let j = old.indexOf(g) + 1; j < old.length && !ref; j++) ref = curKeys.get(keyOf(old[j])) || null; // su lugar original: antes del siguiente que se conserva
        const ghost = g.cloneNode(true); // copia decorativa del elemento eliminado: no interactiva, oculta para lectores de pantalla y sin ids
        ghost.setAttribute('data-ghost', ''); ghost.setAttribute('aria-hidden', 'true'); ghost.inert = true; ghost.style.pointerEvents = 'none';
        ghost.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
        box.insertBefore(ghost, ref || tail);
        const kill = () => ghost.remove(); // el temporizador es la garantía; la animación solo lo adelanta
        setTimeout(kill, dOut + 80);
        const a = run(ghost, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `scale(${1 - (1 - press) * 0.75})` }], { duration: dOut, easing: ease('--ease-in', 'ease-in'), fill: 'forwards' });
        if (a) a.onfinish = kill; else kill();
      });
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

  /* ===== Bloque 4: barras del gráfico de foco (#focus-chart) ===== */
  /* La app reescribe el gráfico con innerHTML en cada renderAll(). Se recuerda la altura de cada día y solo se anima la barra cuya altura cambió
     (crece o encoge desde la base, con scaleY; la altura real ya es la nueva, así que si la animación no corre se ve el valor correcto).
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
        if (fresh || dur <= 0 || !visible(chart)) return;
        chart.querySelectorAll(':scope > .bar-col').forEach((c) => {
          const b = c.querySelector('.bar'), k = (c.getAttribute('title') || '').split(':')[0], h = now.get(k), p = was.get(k);
          if (!b || p === undefined || !h || p === h) return; // sin valor previo, sin cambio o barra vacía (no hay desde dónde escalar)
          run(b, [{ transform: `scaleY(${p / h})` }, { transform: 'none' }], { duration: dur, easing: ease('--ease-move', 'ease-in-out') });
        });
      } catch (e) { console.error('Learny · movimiento', e); }
    }).observe(chart, { childList: true });
  }
})();
