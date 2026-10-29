// Cobertura del inglés (bloque 0 de la revisión del inglés).
// Abre la app con ?demo en inglés (el idioma por defecto), recorre las pantallas, las ventanas y algunos avisos,
// y falla si queda texto visible en español o mezclado («Today debes crear 6 cards…»).
//
// Cómo se usa:
//  · tests/cobertura-pendientes.json lista lo que TODAVÍA está sin traducir, con el bloque que lo arregla.
//  · Si aparece texto en español que no está en esa lista → la prueba falla (algo nuevo se coló).
//  · Si una entrada de la lista ya sale traducida → la prueba falla pidiendo quitarla (así la lista solo baja).
//  · Cuando termine el último bloque, la lista queda vacía y cualquier texto en español rompe la prueba.
// Para regenerar la lista (solo al empezar un bloque): COBERTURA_ESCRIBIR=1 npx playwright test tests/cobertura-ingles.spec.js
const { test, expect } = require('@playwright/test');
const fs = require('fs'), path = require('path');
const PEND_FILE = path.join(__dirname, 'cobertura-pendientes.json');
const pendientes = fs.existsSync(PEND_FILE) ? JSON.parse(fs.readFileSync(PEND_FILE, 'utf8')) : { pendientes: [] };

/* ---- Cómo se reconoce el español ---- */
// Palabras que no existen en inglés. Se evitan a propósito las ambiguas (no, a, en, me, se, o, y…).
const ES = new Set(('de del la las los el que con para por una unas unos tu tus hoy toca debes tarjeta tarjetas repaso repasos repasa repasar fallo fallos ' +
  'materia materias examen exámenes semana semanas día días minutos sesión sesiones sin pero como cuando ya aún muy esta este estos estas tiene tienes ' +
  'puedes hay es son está están crear crea añade añadir elige indica escribe pega empieza empezar guardar quitar borrar descargar descarga ' +
  'todavía todos todas nada algo mejor menos más mañana ayer también porque entre desde hasta cada otra otro nuevo nueva ' +
  'archivo copia copias datos ajustes ventana aviso tema temas ejercicios pregunta respuesta preguntas respuestas lo les mi mis su sus al').split(/\s+/));
const LETRAS_ES = /[¿¡ñáéíóúü]/i;
// Lo que sí puede estar en español en la pantalla en inglés: el botón de cambio de idioma y el nombre de las materias de la demo.
const PERMITIDO = [/^Español$/, /^Cambiar a español$/, /^Biología$/, /^Historia$/, /^Inglés$/];

function esEspanol(texto) {
  const t = texto.trim();
  if (!t || PERMITIDO.some((r) => r.test(t))) return false;
  const sinPermitidos = t.replace(/Parcial de Biología/g, ' ').replace(/\b(Español|español|Biología|Inglés)\b/g, ' '); // «Parcial de Biología» = título del examen de la demo (dato de ejemplo: lo decide el bloque 7)
  if (LETRAS_ES.test(sinPermitidos)) return true;
  const palabras = sinPermitidos.toLowerCase().match(/[\p{L}]+/gu) || [];
  return palabras.some((p) => ES.has(p));
}
const normalizar = (s) => s.replace(/\s+/g, ' ').trim().replace(/\d+([.,]\d+)?/g, '#').slice(0, 160);

/* ---- Lectura de todo el texto visible (nodos de texto + placeholder, aria-label, title, alt) ---- */
async function leerVisible(page) {
  return page.evaluate(() => {
    const out = [];
    const ocultoPorAncestro = (el) => !!el.closest('[translate="no"], textarea, script, style, noscript, .material-symbols-outlined, [hidden], [aria-hidden="true"]');
    const visible = (el) => (el.checkVisibility ? el.checkVisibility({ checkOpacity: false, checkVisibilityCSS: true }) : !!el.getClientRects().length);
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (let n = w.currentNode; n; n = w.nextNode()) {
      if (n.nodeType === 3) {
        const p = n.parentElement; if (!p || ocultoPorAncestro(p) || !visible(p)) continue;
        if (/\p{L}/u.test(n.data)) out.push({ t: n.data, k: 'texto' });
      } else if (n.nodeType === 1) {
        if (n.closest('[translate="no"], script, style, noscript, [hidden]') || !visible(n)) continue;
        for (const a of ['placeholder', 'aria-label', 'title', 'alt']) { const v = n.getAttribute(a); if (v && /\p{L}/u.test(v)) out.push({ t: v, k: a }); }
      }
    }
    return out;
  });
}

const hallazgos = {}; // escena → [texto normalizado]
// Las ventanas y los avisos se abren encima de la página: lo que ya salía en la página base no se cuenta dos veces.
const BASE = { 'planificar · nueva fecha': 'planificar', 'planificar · estudio inteligente': 'planificar', 'planificar · plan de emergencia': 'planificar', 'planificar · replanificar': 'planificar',
  'planificar · tareas de cada fase': 'planificar', 'planificar · tareas sin tarjetas de la materia': 'planificar', 'planificar · estudio inteligente creado': 'planificar',
  'aviso · fecha fuera de rango': 'planificar', 'aviso · plan sin nombre': 'planificar', 'aviso · no cabe ni con 240 min': 'planificar',
  'aviso · plan de emergencia sin examen': 'planificar', 'aviso · informe de examen incompleto': 'planificar', 'aviso · plan reajustado': 'planificar', 'aviso · plan recalculado': 'planificar',
  'planificar · examen en 2 días': 'planificar', 'planificar · plan de emergencia el día del examen': 'planificar', 'hoy · el plan no cabe': 'hoy' };
async function escanear(page, escena) {
  const leidos = await leerVisible(page);
  const set = new Set();
  for (const { t } of leidos) if (esEspanol(t)) set.add(normalizar(t));
  hallazgos[escena] = [...set];
}

/* ---- Escenas ---- */
async function abrir(page) {
  await page.goto('/?demo');
  await page.waitForFunction(() => typeof showPage === 'function' && typeof state === 'object' && document.documentElement.lang);
  expect(await page.evaluate(() => document.documentElement.lang)).toBe('en'); // el inglés es el idioma por defecto
}
const irA = async (page, id) => { await page.evaluate((i) => { showPage(i); }, id); await page.waitForTimeout(250); };
const cerrarVentanas = (page) => page.evaluate(() => { try { closeModal(); } catch (e) { /* no había ventana */ } });

const ESCENAS = {
  // Pantallas
  hoy: async (page) => { await irA(page, 'study'); },
  practicar: async (page) => { await irA(page, 'practice'); },
  biblioteca: async (page) => { await irA(page, 'library'); },
  planificar: async (page) => { await irA(page, 'planner'); },
  reforzar: async (page) => { await irA(page, 'analysis'); },
  guia: async (page) => { await irA(page, 'guide'); },
  // Ventanas del plan (bloque 1)
  'planificar · nueva fecha': async (page) => { await irA(page, 'planner'); await page.click('#add-deadline'); await page.waitForTimeout(300); },
  'planificar · estudio inteligente': async (page) => { await irA(page, 'planner'); await page.click('#smart-plan'); await page.waitForTimeout(300); },
  'planificar · plan de emergencia': async (page) => { await irA(page, 'planner'); await page.click('#emergency-plan'); await page.waitForTimeout(300); },
  'planificar · replanificar': async (page) => { await irA(page, 'planner'); await page.evaluate(() => replanDeadline(state.deadlines[0].id)); await page.waitForTimeout(300); },

  'planificar · tareas de cada fase': async (page) => { // una tarea de cada fase pasa a hoy, con y sin tarjetas de la materia
    await irA(page, 'planner');
    await page.evaluate(() => {
      const d = state.deadlines[0], vistas = new Set(); d.date = addDays(today(), 40); rebuildTasks(d, false);
      const hoyT = [];
      state.tasks.filter((t) => t.deadlineId === d.id).forEach((t) => { if (!vistas.has(t.phase)) { vistas.add(t.phase); hoyT.push({ ...t, id: uid(), date: today(), done: false }); } });
      state.tasks = state.tasks.filter((t) => t.date !== today()).concat(hoyT); renderAll();
    });
    await page.waitForTimeout(300);
  },
  'planificar · tareas sin tarjetas de la materia': async (page) => {
    await irA(page, 'planner');
    await page.evaluate(() => { const d = state.deadlines[0]; d.subject = 'Geometry'; state.tasks.forEach((t) => { if (t.date === today()) t.phase = 'repaso'; }); renderAll(); });
    await page.waitForTimeout(300);
  },
  'planificar · estudio inteligente creado': async (page) => {
    await irA(page, 'planner'); await page.click('#smart-plan'); await page.waitForTimeout(200);
    await page.evaluate(() => { const f = document.querySelector('form'); const q = (n) => f.querySelector(`[name=${n}]`); q('title').value = 'Algebra midterm'; q('subject').value = 'Algebra'; q('date').value = addDays(today(), 9); f.requestSubmit(); });
    await page.waitForTimeout(400);
  },
  'aviso · fecha fuera de rango': async (page) => {
    await irA(page, 'planner'); await page.click('#add-deadline'); await page.waitForTimeout(200);
    await page.evaluate(() => { const f = document.querySelector('form'); f.noValidate = true; f.querySelector('[name=title]').value = 'Examen'; f.querySelector('[name=subject]').value = 'Chemistry'; f.querySelector('[name=date]').value = '2020-01-01'; f.requestSubmit(); });
    await page.waitForTimeout(250);
  },
  'aviso · plan sin nombre': async (page) => {
    await irA(page, 'planner'); await page.click('#add-deadline'); await page.waitForTimeout(200);
    await page.evaluate(() => { const f = document.querySelector('form'); f.noValidate = true; f.querySelector('[name=title]').value = '   '; f.querySelector('[name=subject]').value = 'Chemistry'; f.querySelector('[name=date]').value = addDays(today(), 5); f.requestSubmit(); });
    await page.waitForTimeout(250);
  },
  'aviso · no cabe ni con 240 min': async (page) => {
    await irA(page, 'planner');
    await page.evaluate(() => { const d = state.deadlines[0]; d.skipped = 900; d.debtMin = 900 * d.dailyMinutes; renderAll(); replanDeadline(d.id); });
    await page.waitForTimeout(300);
  },
  'planificar · examen en 2 días': async (page) => {
    await irA(page, 'planner');
    await page.evaluate(() => { const d = state.deadlines[0]; d.date = addDays(today(), 2); rebuildTasks(d, false); renderAll(); });
    await page.waitForTimeout(300);
  },
  'planificar · plan de emergencia el día del examen': async (page) => {
    await irA(page, 'planner');
    await page.evaluate(() => { const d = state.deadlines[0]; d.date = today(); renderAll(); });
    await page.click('#emergency-plan'); await page.waitForTimeout(300);
  },
  'hoy · el plan no cabe': async (page) => {
    await page.evaluate(() => { const d = state.deadlines[0]; d.skipped = 900; d.debtMin = 900 * d.dailyMinutes; });
    await irA(page, 'study');
  },
  // Avisos del plan (bloque 1)
  'aviso · plan de emergencia sin examen': async (page) => { await irA(page, 'planner'); await page.evaluate(() => { state.deadlines = []; }); await page.click('#emergency-plan'); await page.waitForTimeout(200); },
  'aviso · informe de examen incompleto': async (page) => { await irA(page, 'planner'); await page.evaluate(() => { document.getElementById('recovery-more').open = true; }); await page.click('#recovery-plan'); await page.waitForTimeout(200); },
  'aviso · plan reajustado': async (page) => {
    await irA(page, 'planner');
    await page.evaluate(() => { // tareas atrasadas: se mueven 4 días al pasado y se fuerza el reajuste de hoy
      state.tasks.forEach((t) => { t.date = addDays(t.date, -4); t.done = false; }); state.settings.lastRollover = ''; redistributeIfBehind();
    });
    await page.waitForTimeout(300);
  },
  'aviso · plan recalculado': async (page) => {
    await irA(page, 'planner');
    await page.evaluate(() => { const d = state.deadlines[0]; d.skipped = 40; d.debtMin = 40 * d.dailyMinutes; replanDeadline(d.id); });
    await page.waitForTimeout(300);
    await page.evaluate(() => { const f = document.querySelector('.modal form, dialog form, #modal form'); if (f) { f.querySelector('[name=mins]').value = '15'; f.requestSubmit(); } });
    await page.waitForTimeout(300);
  }
};

test.describe('cobertura del inglés', () => {
  test.describe.configure({ mode: 'serial' });
  for (const [nombre, fn] of Object.entries(ESCENAS)) {
    test(`escanear: ${nombre}`, async ({ page }) => {
      await abrir(page);
      await fn(page);
      await escanear(page, nombre);
    });
  }

  test('no queda texto en español fuera de la lista de pendientes', async () => {
    const todos = Object.entries(hallazgos).flatMap(([escena, textos]) => textos.filter((t) => !(BASE[escena] && (hallazgos[BASE[escena]] || []).includes(t))).map((texto) => ({ escena, texto })));
    if (process.env.COBERTURA_ESCRIBIR) {
      const previo = new Map(pendientes.pendientes.map((p) => [`${p.escena}||${p.texto}`, p.bloque]));
      const nuevo = todos.map((h) => ({ bloque: previo.get(`${h.escena}||${h.texto}`) ?? '?', ...h }));
      fs.writeFileSync(PEND_FILE, JSON.stringify({ nota: 'Texto que todavía sale en español o mezclado en la pantalla en inglés. «bloque» = qué bloque de la revisión lo arregla. Quita la entrada cuando el bloque la resuelva.', pendientes: nuevo }, null, 1) + '\n');
      return;
    }
    const conocidos = new Set(pendientes.pendientes.map((p) => `${p.escena}||${p.texto}`));
    const actuales = new Set(todos.map((h) => `${h.escena}||${h.texto}`));
    const nuevos = todos.filter((h) => !conocidos.has(`${h.escena}||${h.texto}`)).map((h) => `[${h.escena}] ${h.texto}`);
    const resueltos = pendientes.pendientes.filter((p) => !actuales.has(`${p.escena}||${p.texto}`)).map((p) => `[${p.escena}] ${p.texto}`);
    expect(nuevos, 'Texto en español (o mezclado) sin traducir, fuera de la lista de pendientes').toEqual([]);
    expect(resueltos, 'Ya sale traducido: quítalo de tests/cobertura-pendientes.json').toEqual([]);
  });
});
