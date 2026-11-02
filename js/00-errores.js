/* Learny · Red de seguridad de errores (parte 0)
   Se carga PRIMERO (antes de 01c y 01-base) para ver también los fallos de arranque de las demás partes.
   Qué hace con un error que nadie capturó (window «error» y «unhandledrejection»):
   · lo guarda en un registro corto (últimos 20, sin repetidos) para poder diagnosticarlo después;
   · avisa a la persona con UN mensaje breve (como mucho 3 por sesión y uno cada 30 s), sin ruido por fallos de red normales;
   · si ni siquiera existe `toast` (otra parte no cargó), muestra un banner mínimo para que no falle en silencio.
   Qué NO hace: no toca los datos de estudio ni reintenta nada. El registro nunca guarda claves (se limpian) y en la demo no se guarda en disco.
   Consulta desde la consola: LearnyErrors.list() · LearnyErrors.text() · LearnyErrors.clear(). */
'use strict';
(() => {
  const MAX_LOG = 20, MAX_TOASTS = 3, GAP_MS = 30000, LS_KEY = 'learny.errors';
  const DEMO = /[?&]demo(?:[=&#]|$)/.test(location.search); // la demo no deja nada en disco
  const MSG = 'Algo no salió como esperaba. Puedes seguir usando Learny; si algo no responde, recarga la página.';
  const BANNER = 'Learny no pudo cargar por completo. Recarga la página; si sigue igual, avisa a quien la mantiene.';
  const NOISE = /ResizeObserver loop|^Script error\.?$/i; // avisos del navegador sin consecuencias
  const OFFLINE = /failed to fetch|load failed|networkerror|network request failed|dynamically imported module|importing a module script failed|aborterror|was aborted/i; // red caída o petición cancelada: normal, se registra pero no se avisa
  const EXT = /^(chrome|moz|safari-web)-extension:/i; // errores de extensiones del navegador: no son de Learny

  const log = []; let toasts = 0, lastToast = 0, busy = false;

  /* Quita claves y direcciones con clave de cualquier texto antes de guardarlo (la clave de Gemini viaja en la URL: ?key=…). */
  const scrub = (s) => String(s == null ? '' : s)
    .replace(/([?&](?:key|api_?key|token|access_token)=)[^&\s"']+/gi, '$1***')
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, '***')
    .replace(/\s+/g, ' ').trim().slice(0, 240);
  const where = (file, line) => { try { return file ? `${String(file).split(/[\\/]/).pop().split('?')[0]}${line ? ':' + line : ''}` : ''; } catch { return ''; } };

  const persist = () => { if (DEMO) return; try { window.localStorage.setItem(LS_KEY, JSON.stringify(log)); } catch { /* sin almacenamiento o sin espacio: el registro en memoria basta */ } };
  try { if (!DEMO) { const old = JSON.parse(window.localStorage.getItem(LS_KEY) || '[]'); if (Array.isArray(old)) old.slice(-MAX_LOG).forEach((e) => { if (e && typeof e.m === 'string') log.push({ t: String(e.t || '').slice(0, 30), m: scrub(e.m), s: scrub(e.s).slice(0, 80), n: Math.max(1, Number(e.n) || 1) }); }); } } catch { /* registro anterior ilegible: se ignora */ }

  const banner = () => {
    try {
      if (!document.body || document.getElementById('learny-error-banner')) return;
      const b = document.createElement('div');
      b.id = 'learny-error-banner'; b.setAttribute('role', 'alert');
      b.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:99999;padding:12px 16px;border-radius:8px;background:#7a1f1f;color:#fff;font:15px/1.4 system-ui,sans-serif;box-shadow:0 2px 12px rgba(0,0,0,.4)';
      b.textContent = BANNER;
      document.body.append(b);
    } catch { /* nada más que hacer */ }
  };

  const notify = (quiet) => {
    if (quiet || document.visibilityState === 'hidden') return;
    const now = Date.now();
    if (toasts >= MAX_TOASTS || now - lastToast < GAP_MS) return;
    if (typeof window.toast === 'function') { try { window.toast(MSG, 'error'); toasts++; lastToast = now; } catch { banner(); } }
    else banner();
  };

  const record = (message, file, line, quietHint) => {
    if (busy) return; // un fallo dentro del propio registro nunca debe encadenar otro
    busy = true;
    try {
      const m = scrub(message) || 'Error sin texto', s = where(file, line);
      if (NOISE.test(m) || EXT.test(String(file || ''))) return;
      const last = log.find((e) => e.m === m && e.s === s);
      if (last) { last.n++; last.t = new Date().toISOString(); } else { log.push({ t: new Date().toISOString(), m, s, n: 1 }); while (log.length > MAX_LOG) log.shift(); }
      persist();
      notify(quietHint || OFFLINE.test(m));
    } catch { /* la red de seguridad no puede fallar */ } finally { busy = false; }
  };

  window.addEventListener('error', (e) => {
    if (e && e.target && e.target !== window) return; // fallo al cargar una imagen o similar: no es un error de código
    record((e.error && e.error.message) || e.message, e.filename, e.lineno);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const r = e && e.reason;
    record(r && r.message ? `${r.name && r.name !== 'Error' ? r.name + ': ' : ''}${r.message}` : String(r), r && r.fileName, r && r.lineNumber);
  });

  window.LearnyErrors = Object.freeze({
    list: () => log.map((e) => ({ ...e })),
    text: () => log.map((e) => `${e.t} · ${e.m}${e.s ? ` (${e.s})` : ''}${e.n > 1 ? ` ×${e.n}` : ''}`).join('\n'),
    clear: () => { log.length = 0; persist(); },
    shown: () => toasts
  });
})();
