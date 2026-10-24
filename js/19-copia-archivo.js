/* Learny · parte 19 · Copia automática a un archivo (Fase 6)
   Opcional y solo donde el navegador lo permite (File System Access API: Chrome y Edge de escritorio). Donde no existe, esta parte no hace nada:
   no aparece el botón y siguen igual las copias rotativas en el navegador (learny.backup) y «Descargar copia».
   Qué hace: la persona elige UN archivo una vez; cada ~60 s (y al ocultar la pestaña) se reescribe con el estado actual si cambió desde la última vez.
   Reglas de seguridad: nunca incluye la clave de Gemini; no se activa en la demo; no escribe mientras los datos estén protegidos (bootHold / datos de versión más nueva);
   si el permiso caduca, no pide nada por su cuenta (el navegador exige un clic): muestra «Reactivar» en Ajustes. El archivo elegido se recuerda en IndexedDB.
   No toca el modelo de datos ni `state`. Se carga con <script defer> después de 18-idioma.js (comparte el ámbito global). */
'use strict';

const LearnyFileBackup = (() => {
  const supported = !DEMO && typeof window.showSaveFilePicker === 'function' && typeof indexedDB !== 'undefined';
  const DB = 'learny-file-backup', OS = 'kv', KEYH = 'handle', EVERY = 60000;
  let handle = null, lastRaw = null, lastWhen = null, status = 'off', busy = false, box = null, timer = null; // status: off | ok | permission | error

  const idb = () => new Promise((res, rej) => { const r = indexedDB.open(DB, 1); r.onupgradeneeded = () => r.result.createObjectStore(OS); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const idbGet = async (k) => { const db = await idb(); return new Promise((res, rej) => { const q = db.transaction(OS).objectStore(OS).get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); };
  const idbSet = async (k, v) => { const db = await idb(); return new Promise((res, rej) => { const tx = db.transaction(OS, 'readwrite'); if (v === undefined) tx.objectStore(OS).delete(k); else tx.objectStore(OS).put(v, k); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); };

  const hasPermission = async () => { try { return (await handle.queryPermission({ mode: 'readwrite' })) === 'granted'; } catch { return false; } };
  const body = () => { const { apiKey, ...safe } = state; return JSON.stringify(safe, null, 2); }; // igual que «Descargar copia»: sin clave API

  async function write(force) {
    if (!supported || !handle || busy) return false;
    if (bootHold || newerStored()) return false; // datos protegidos: no se escribe nada
    if (!force && lastSavedRaw === lastRaw) return false; // nada nuevo desde la última copia
    busy = true;
    try {
      if (!(await hasPermission())) { status = 'permission'; return false; }
      const raw = lastSavedRaw, w = await handle.createWritable(); // se escribe a un archivo temporal y se confirma al cerrar: un fallo no deja el archivo a medias
      try { await w.write(body()); await w.close(); } catch (e) { try { await w.abort(); } catch { /* ok */ } throw e; }
      lastRaw = raw; lastWhen = new Date(); status = 'ok'; return true;
    } catch { status = 'error'; return false; }
    finally { busy = false; render(); }
  }

  async function choose() {
    try {
      const h = await window.showSaveFilePicker({ suggestedName: 'learny-copia-automatica.json', types: [{ description: 'Copia de Learny (JSON)', accept: { 'application/json': ['.json'] } }] });
      handle = h; lastRaw = null; try { await idbSet(KEYH, h); } catch { /* sin IndexedDB: funciona esta sesión, pero no se recordará el archivo */ } start();
      if (await write(true)) toast('Copia automática activada. Se actualizará sola mientras Learny esté abierta.');
      else toast('No se pudo escribir en ese archivo.', 'error');
    } catch (e) { if (!e || e.name !== 'AbortError') toast('No se pudo activar la copia automática.', 'error'); }
    render();
  }

  async function reactivate() {
    try { if ((await handle.requestPermission({ mode: 'readwrite' })) === 'granted') { await write(true); } else toast('Sin permiso, la copia automática sigue en pausa.', 'error'); }
    catch { toast('No se pudo reactivar la copia automática.', 'error'); }
    render();
  }

  async function disable() { handle = null; lastRaw = null; status = 'off'; stop(); try { await idbSet(KEYH, undefined); } catch { /* ok */ } render(); toast('Copia automática desactivada. El archivo que ya existe no se borra.'); }

  function start() { if (!timer) timer = setInterval(() => { write(false); }, EVERY); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  function render() {
    if (!box || !box.isConnected) return;
    const hh = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const msg = status === 'ok' ? `Copia automática activa${lastWhen ? ` · última a las ${hh(lastWhen)}` : ''}` : status === 'permission' ? 'Copia automática en pausa: el navegador necesita tu permiso' : status === 'error' ? 'Copia automática: no se pudo escribir (se reintentará)' : 'Copia automática a un archivo: desactivada';
    box.innerHTML = `<p class="modal-tip">${msg}</p><div class="actions">${handle ? '' : '<button id="fb-choose" class="outline-button" type="button">Elegir archivo para copia automática</button>'}${handle && status === 'permission' ? '<button id="fb-reactivate" class="outline-button" type="button">Reactivar copia automática</button>' : ''}${handle ? '<button id="fb-off" class="outline-button" type="button">Desactivar copia automática</button>' : ''}</div>`;
    const on = (id, fn) => { const b = box.querySelector(id); if (b) b.onclick = fn; };
    on('#fb-choose', choose); on('#fb-reactivate', reactivate); on('#fb-off', disable);
  }

  /* Ajustes llama a mount(elemento) al abrir «Datos y copias»; sin API no dibuja nada. */
  function mount(el) { if (!supported || !el) return; box = el; render(); }

  async function init() {
    if (!supported) return;
    try {
      const h = await idbGet(KEYH);
      if (h && typeof h.createWritable === 'function') { handle = h; status = (await hasPermission()) ? 'ok' : 'permission'; start(); if (status === 'ok') write(false); }
    } catch { /* sin IndexedDB o sin archivo guardado: queda desactivada */ }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') write(false); });
  }
  init();

  return { supported, mount, write, get status() { return status; } };
})();
