/* Learny · parte 3 de 15 · Interfaz base
   Diálogo de confirmación, guardado, avisos (toast) y deshacer, páginas, ventana modal, sonido y tarjetas vencidas.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

function confirmDialog({ title = '¿Seguro?', message = '', ok = 'Confirmar', danger = false } = {}) {
  return new Promise((resolve) => {
    const d = $('#confirm-modal'), okBtn = $('#confirm-ok');
    $('#confirm-title').textContent = title; $('#confirm-message').textContent = message;
    okBtn.textContent = ok; okBtn.className = danger ? 'danger-button' : 'primary-button';
    d.returnValue = 'cancel';
    d.addEventListener('close', () => resolve(d.returnValue === 'ok'), { once: true });
    d.showModal(); (danger ? $('#confirm-cancel') : okBtn).focus();
  });
}

function setSaved(ok) {
  const el = $('#save-status'); if (!el) return;
  if (DEMO) { el.textContent = 'Demo: no se guarda'; el.classList.remove('bad'); return; }
  el.textContent = ok ? `Guardado ${pad(new Date().getHours())}:${pad(new Date().getMinutes())}` : 'No guardado';
  el.classList.toggle('bad', !ok);
}
const save = () => {
  if (bootHold) return true;
  rev++;
  if (state.reviews.length > MAX_REVIEWS + 200) state.reviews.splice(0, state.reviews.length - MAX_REVIEWS);
  let json = null;
  try { json = JSON.stringify(state); localStorage.setItem(KEY, json); lastSavedRaw = json; setSaved(true); saveErrorShown = false; return true; }
  catch {
    try { // almacenamiento lleno: se van soltando copias automáticas (de la más vieja a la más nueva) antes de perder tus datos nuevos; learny.corrupt NO se toca
      if (json && localStorage) {
        let list = readBackups();
        while (list.length) { list = list.slice(0, -1); if (list.length) store.set(BACKUP_KEY, JSON.stringify(list)); else store.del(BACKUP_KEY); try { localStorage.setItem(KEY, json); lastSavedRaw = json; setSaved(true); saveErrorShown = false; return true; } catch { /* sigue */ } }
        localStorage.setItem(KEY, json); lastSavedRaw = json; setSaved(true); saveErrorShown = false; return true;
      }
    } catch { /* sigue */ }
    setSaved(false);
    if (!saveErrorShown) { saveErrorShown = true; toast('No se pudo guardar: el navegador bloqueó el almacenamiento o está lleno. Descarga una copia en Ajustes ⚙️.', 'error'); }
    return false; }
};

const announce = (msg) => { const el = $('#sr-live'); if (!el) return; el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 30); };
const failedRenders = new Set();
function safe(fn, name) {
  try { return fn(); } catch (error) {
    console.error(`Learny · ${name}`, error);
    if (!failedRenders.has(name)) { failedRenders.add(name); toast(`No se pudo mostrar «${name}». El resto de Learny sigue funcionando.`, 'error'); }
  }
}

/* Deshacer de un nivel: cada acción reversible ofrece «Deshacer» ~8 s (botón o tecla Z). Una acción nueva sustituye a la anterior. */
let undoRun = null;
function toast(message, type = 'ok', action = null) {
  const el = $('#toast'), isErr = type === 'error', now = Date.now();
  el.setAttribute('role', isErr ? 'alert' : 'status'); el.setAttribute('aria-live', isErr ? 'assertive' : 'polite'); // los errores se anuncian de inmediato
  // Fase 4: un aviso posterior no cancela un «Deshacer» pendiente: muestra su mensaje y conserva el botón hasta que caduque.
  if (action) toast.undo = { action, until: now + 8000 };
  else if (toast.undo && now < toast.undo.until) action = toast.undo.action;
  else toast.undo = null;
  undoRun = action ? action.run : null;
  el.className = `toast show ${type}`; // primero se hace visible y luego se escribe el texto: los lectores de pantalla solo anuncian cambios en regiones visibles
  clearTimeout(toast.fillId);
  toast.fillId = setTimeout(() => {
    el.textContent = message;
    if (action) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'toast-action'; b.textContent = action.label; b.setAttribute('aria-keyshortcuts', 'z'); b.title = 'Atajo: Z';
      b.onclick = action.run; el.append(' ', b);
    }
  }, 40);
  clearTimeout(toast.id);
  toast.id = setTimeout(() => { el.classList.remove('show'); undoRun = null; toast.undo = null; }, action ? Math.max(1000, toast.undo.until - now) : 4200);
}
/* Fase 4: los avisos de arranque (migración, tarjetas omitidas, datos dañados, plan reajustado…) esperan su turno en vez de pisarse. */
const toastQueue = []; let toastBusy = false;
function nextQueued() {
  const n = toastQueue.shift();
  if (!n) { toastBusy = false; return; }
  toastBusy = true; toast(n[0], n[1], n[2]);
  setTimeout(nextQueued, (n[2] ? 8000 : 4200) + 400);
}
function queueToast(message, type = 'ok', action = null) { toastQueue.push([message, type, action]); if (!toastBusy) nextQueued(); }
function offerUndo(message, restore) {
  const run = () => {
    if (undoRun !== run) return; // ya caducó o la sustituyó otra acción
    undoRun = null; toast.undo = null; lastRateAt = 0; restore(); toast('Acción deshecha.');
  };
  toast(message, 'ok', { label: 'Deshacer', run });
}
const cardSnap = (c) => ({ nextReview: c.nextReview, lastReviewed: c.lastReviewed, easeFactor: c.easeFactor, interval: c.interval, repetitions: c.repetitions, history: [...(c.history || [])] });
const dropReview = (rv) => { const i = state.reviews.lastIndexOf(rv); if (i >= 0) state.reviews.splice(i, 1); };

function showPage(page) {
  const changed = page !== currentPage;
  currentPage = page;
  $$('.nav-button[data-page]').forEach((b) => {
    const on = b.dataset.page === page;
    b.classList.toggle('active', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  $$('.page').forEach((p) => p.classList.toggle('active', p.id === page));
  applySessionMode();
  if (changed) { window.scrollTo(0, 0); $(`#${page} h1`)?.focus({ preventScroll: true }); }
  renderPage(page);
  renderTimer();
  document.dispatchEvent(new Event('learny:page'));
}

let modalCloseHandler = null, rouletteId = null, modalTeardown = null;
const runTeardown = () => { const t = modalTeardown; modalTeardown = null; if (t) { try { t(); } catch (e) { console.error(e); } } }; // limpieza que se ejecuta al cerrar O al reemplazar el diálogo
const modalOpen = () => $('#app-modal').open;
const closeModal = () => { if (modalOpen()) $('#app-modal').close(); };
/* Foco: al abrir una ventana se recuerda qué la abrió y al cerrarla el foco vuelve ahí (si ese botón se redibujó, se busca su equivalente). */
let modalOpener = null;
const openerSelector = (el) => {
  if (el.id) return `#${el.id}`;
  const a = [...el.attributes].find((x) => x.name.startsWith('data-'));
  return a ? `${el.tagName.toLowerCase()}[${a.name}="${a.value.replace(/"/g, '\\"')}"]` : '';
};
const shown = (el) => !!el && el.isConnected && el.getClientRects().length > 0;
function restoreOpenerFocus() {
  const o = modalOpener; modalOpener = null; if (!o) return;
  const ae = document.activeElement;
  if (ae && ae !== document.body && shown(ae)) return; // el navegador ya devolvió el foco
  let el = shown(o.el) ? o.el : (o.sel ? document.querySelector(o.sel) : null);
  if (!shown(el)) el = $('.page.active h1');
  el?.focus({ preventScroll: true });
}
function modal(html, onSubmit, onClose) {
  const dialog = $('#app-modal'), form = $('#modal-form');
  runTeardown();
  if (!dialog.open) { const ae = document.activeElement; modalOpener = ae && ae !== document.body ? { el: ae, sel: openerSelector(ae) } : null; }
  $('#modal-body').innerHTML = html;
  $('#modal-body').removeAttribute('aria-live');
  modalCloseHandler = onClose || null;
  form.onsubmit = (event) => { event.preventDefault(); onSubmit ? onSubmit(new FormData(form)) : closeModal(); };
  if (!dialog.open) dialog.showModal();
  const body = $('#modal-body'), h = body.querySelector('h2');
  if (h) { h.id = 'modal-title'; h.tabIndex = -1; dialog.setAttribute('aria-labelledby', 'modal-title'); dialog.removeAttribute('aria-label'); }
  else { dialog.removeAttribute('aria-labelledby'); dialog.setAttribute('aria-label', 'Ventana de Learny'); }
  // Foco inicial: primer campo (en táctil, el título, para no abrir el teclado virtual), si no, el botón principal
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const field = coarse ? null : [...body.querySelectorAll('input:not([type=hidden]):not([type=file]),textarea,select')].find((e) => !e.disabled && !e.closest('details:not([open])'));
  (field || (coarse ? h : body.querySelector('.primary-button,.danger-button')) || h)?.focus({ preventScroll: true });
}
$('#app-modal').addEventListener('close', () => {
  if (modalOpen()) return; // se reabrió antes de que llegara el evento: no cancelar la IA ni ejecutar el onClose de la ventana nueva
  runTeardown();
  clearInterval(rouletteId); rouletteId = null; cancelAi();
  const handler = modalCloseHandler; modalCloseHandler = null; handler?.();
  if (!modalOpen() && !$('#confirm-modal').open) restoreOpenerFocus();
});
$('.modal-close').onclick = closeModal;
$('#app-modal').addEventListener('click', (e) => { if (e.target.closest('[data-close-modal]')) closeModal(); });

function beep() {
  try {
    if (state.settings.sound !== false && !DEMO) {
      const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
      const ctx = new Ctx(), osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.start(); osc.stop(ctx.currentTime + 0.8); setTimeout(() => ctx.close?.(), 1200);
    }
    if (!DEMO) navigator.vibrate?.(200); // la demo no vibra
  } catch { /* sin sonido */ }
}

function notify(title, body) {
  if (DEMO || !state.settings.notify || typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try { new Notification(title, { body, silent: false }); }
  catch { // Chrome para Android solo admite avisos desde el service worker
    try { navigator.serviceWorker?.ready.then((r) => r.showNotification(title, { body, icon: 'icon-192.png' })).catch(() => {}); } catch { /* ignorar */ }
  }
}

function subjects() {
  const set = new Set(state.cards.map((c) => c.subject).concat(state.deadlines.map((d) => d.subject)).filter(Boolean));
  $('#subject-list').innerHTML = [...set].map((s) => `<option value="${esc(s)}">`).join('');
  return [...set];
}

const dueCards = () => cached('due', () => state.cards.filter((c) => !c.archived && c.nextReview <= today()).sort((a, b) => a.nextReview.localeCompare(b.nextReview) || a.easeFactor - b.easeFactor));
const overdueCards = () => cached('overdue', () => state.cards.filter((c) => !c.archived && c.nextReview < today()));
