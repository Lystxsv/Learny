/* Learny · parte 1c · Metas del modo autodidacta: modelo de datos (Fase 1 · capa de datos)
   Todo vive en UN contenedor, state.learning, sin subir SCHEMA (ver fase0-modelo-metas.md). Este archivo define su forma, sus topes y su saneado.
   No dibuja nada y no toca SM-2, el Pomodoro, el Feynman ni las estadísticas.
   Se carga con <script defer> ANTES de 01-base.js: defaults() (01-base.js) llama a emptyLearning() al cargar y el resto de funciones solo se usan cuando ya existe todo lo demás
   (uid, isDay… son de 01-base.js y se resuelven al llamar, no al cargar). Comparte el ámbito global (no hay import/export). */
'use strict';

const LEARN_V = 1; // versión del contenedor (independiente de SCHEMA)
const LEARN_LIMITS = Object.freeze({ goals: 40, children: 12, stagesPerGoal: 30, stages: 150, evidencePerStage: 5, evidence: 100, resources: 100, doubts: 80, log: 80, subjects: 30 });
const LEARN_SOFT_CAP = 250000; // caracteres de JSON.stringify(state.learning): por encima no se permite crear más (localStorage guarda el estado y hasta 3 copias)
const LEARN_ENUM = Object.freeze({
  goalStatus: ['active', 'paused', 'done', 'archived'],
  stageStatus: ['todo', 'doing', 'done', 'skipped', 'known'],
  level: ['', 'explore', 'help', 'alone', 'transfer', 'review'],
  checkedHow: ['', 'practice', 'feynman', 'cards'],
  origin: ['', 'template', 'ia'],
  evidenceKind: ['text', 'link', 'feynman'],
  resType: ['link', 'book', 'video', 'course', 'note'],
  resStatus: ['pending', 'using', 'consulted', 'dropped'],
  resNext: ['', 'practice', 'explain', 'cards', 'apply'],
  doubtStatus: ['open', 'researching', 'solved', 'help']
});

const emptyLearning = () => ({ v: LEARN_V, goals: [], resources: [], doubts: [], log: [] });

/* Estado de la última carga (lo lee 15-inicio.js para avisar y la interfaz para decidir si es de solo lectura).
   newer: el contenedor es de una versión más nueva: se conserva intacto y no se edita. bad: no era un objeto y se ignoró. omitted: elementos que no cupieron en los topes (solo con archivos editados a mano). */
const learningStatus = { newer: false, bad: false, omitted: 0, newerV: 0 };
const learningReadOnly = () => learningStatus.newer;

const lObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const lArr = (x) => (Array.isArray(x) ? x : []);
const lTxt = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
const lPick = (v, list, def) => (list.includes(v) ? v : def);
const lId = (v) => (v == null || String(v).trim() === '' ? uid() : String(v).slice(0, 100));
const lDay = (v) => (isDay(v) ? v : '');
const lUrl = (v) => { const u = String(v == null ? '' : v).trim().slice(0, 200); return /^https?:\/\/[^\s]+$/i.test(u) ? u : ''; }; // solo http(s): nunca javascript: ni data:
function lUnique(list) { const seen = new Set(); list.forEach((x) => { if (seen.has(x.id)) x.id = uid(); seen.add(x.id); }); }

function lEvidence(raw, state) {
  const out = [];
  for (const e of lArr(raw)) {
    if (!lObj(e)) continue;
    if (out.length >= LEARN_LIMITS.evidencePerStage || state.evidence >= LEARN_LIMITS.evidence) { learningStatus.omitted++; continue; }
    const kind = lPick(e.kind, LEARN_ENUM.evidenceKind, 'text'), text = lTxt(e.text, 500), url = lUrl(e.url);
    if (!text && !url) continue;
    out.push({ id: lId(e.id), date: lDay(e.date), kind: kind === 'link' && !url ? 'text' : kind, text, url }); state.evidence++;
  }
  lUnique(out); return out;
}
function lStages(raw, subjects, state) {
  const out = [];
  for (const s of lArr(raw)) {
    if (!lObj(s) || !lTxt(s.title, 100)) continue;
    if (out.length >= LEARN_LIMITS.stagesPerGoal || state.stages >= LEARN_LIMITS.stages) { learningStatus.omitted++; continue; }
    state.stages++;
    const checked = s.checked === true;
    out.push({
      id: lId(s.id), title: lTxt(s.title, 100), learn: lTxt(s.learn, 200), practice: lTxt(s.practice, 200), check: lTxt(s.check, 200),
      status: lPick(s.status, LEARN_ENUM.stageStatus, 'todo'), level: lPick(s.level, LEARN_ENUM.level, ''),
      subject: subjects.find((x) => x.toLowerCase() === lTxt(s.subject, 60).toLowerCase()) || '',
      checked, checkedHow: checked ? lPick(s.checkedHow, LEARN_ENUM.checkedHow, '') : '', checkedAt: checked ? lDay(s.checkedAt) : '',
      evidence: lEvidence(s.evidence, state), origin: lPick(s.origin, LEARN_ENUM.origin, '')
    });
  }
  lUnique(out); return out;
}

/* Devuelve un contenedor válido a partir de CUALQUIER cosa. Nunca lanza y nunca rechaza el archivo: lo inválido se corrige o se omite (y se cuenta en learningStatus).
   Contenedor de una versión más nueva (v > LEARN_V): se devuelve una copia intacta y la interfaz queda en solo lectura. */
function sanitizeLearning(raw) {
  learningStatus.newer = false; learningStatus.bad = false; learningStatus.omitted = 0; learningStatus.newerV = 0;
  if (raw == null) return emptyLearning();
  if (!lObj(raw)) { learningStatus.bad = true; return emptyLearning(); }
  const v = Number(raw.v);
  if (Number.isFinite(v) && v > LEARN_V) { learningStatus.newer = true; learningStatus.newerV = v; try { return JSON.parse(JSON.stringify(raw)); } catch { return emptyLearning(); } }

  // 1) metas (sin parentId todavía)
  const goals = [], st = { stages: 0, evidence: 0 };
  for (const g of lArr(raw.goals)) {
    if (!lObj(g) || !lTxt(g.title, 120)) continue;
    if (goals.length >= LEARN_LIMITS.goals) { learningStatus.omitted++; continue; }
    const seen = new Set(), subjects = [];
    for (const s of lArr(g.subjects)) { const t = lTxt(s, 60); if (t && !seen.has(t.toLowerCase()) && subjects.length < LEARN_LIMITS.subjects) { seen.add(t.toLowerCase()); subjects.push(t); } }
    const wm = Math.round(Number(g.weeklyMin));
    goals.push({
      id: lId(g.id), parentId: g.parentId == null ? '' : String(g.parentId).slice(0, 100), // se valida en el paso 2
      title: lTxt(g.title, 120), why: lTxt(g.why, 200), current: lTxt(g.current, 300), outcome: lTxt(g.outcome, 200),
      weeklyMin: Number.isFinite(wm) && wm >= 15 ? Math.min(2400, wm) : 0, targetDate: lDay(g.targetDate),
      subjects, status: lPick(g.status, LEARN_ENUM.goalStatus, 'active'), created: lDay(g.created),
      stages: lStages(g.stages, subjects, st)
    });
  }
  lUnique(goals);

  // 2) submetas: dos niveles como máximo, sin ciclos, hasta LEARN_LIMITS.children por madre. Se decide sobre una copia de los valores originales.
  const ids = new Set(goals.map((g) => g.id)), cand = new Map(goals.map((g) => [g.id, ids.has(g.parentId) && g.parentId !== g.id ? g.parentId : '']));
  const kids = new Map();
  goals.forEach((g) => {
    const p = cand.get(g.id);
    if (p && cand.get(p) === '' && (kids.get(p) || 0) < LEARN_LIMITS.children) { g.parentId = p; kids.set(p, (kids.get(p) || 0) + 1); } else g.parentId = '';
  });
  const byId = new Map(goals.map((g) => [g.id, g]));

  // 3) listas que cuelgan de una meta: sin meta no hay elemento; un stageId inexistente pasa a ''
  const stageOk = (goalId, stageId) => { const g = byId.get(goalId); return g && g.stages.some((s) => s.id === stageId) ? String(stageId) : ''; };
  const resources = [], doubts = [], log = [];
  for (const r of lArr(raw.resources)) {
    if (!lObj(r) || !byId.has(String(r.goalId)) || !lTxt(r.title, 120)) continue;
    if (resources.length >= LEARN_LIMITS.resources) { learningStatus.omitted++; continue; }
    resources.push({ id: lId(r.id), goalId: String(r.goalId), stageId: stageOk(String(r.goalId), r.stageId), type: lPick(r.type, LEARN_ENUM.resType, 'link'), title: lTxt(r.title, 120), url: lUrl(r.url),
      status: lPick(r.status, LEARN_ENUM.resStatus, 'pending'), why: lTxt(r.why, 200), next: lPick(r.next, LEARN_ENUM.resNext, '') });
  }
  for (const d of lArr(raw.doubts)) {
    if (!lObj(d) || !byId.has(String(d.goalId)) || !lTxt(d.text, 300)) continue;
    if (doubts.length >= LEARN_LIMITS.doubts) { learningStatus.omitted++; continue; }
    doubts.push({ id: lId(d.id), goalId: String(d.goalId), stageId: stageOk(String(d.goalId), d.stageId), date: lDay(d.date), text: lTxt(d.text, 300), status: lPick(d.status, LEARN_ENUM.doubtStatus, 'open'), answer: lTxt(d.answer, 300) });
  }
  for (const e of lArr(raw.log)) {
    if (!lObj(e) || !byId.has(String(e.goalId))) continue;
    const understood = lTxt(e.understood, 240), stuck = lTxt(e.stuck, 240), next = lTxt(e.next, 240);
    if (!understood && !stuck && !next) continue; // una entrada con las tres vacías no se guarda
    log.push({ id: lId(e.id), goalId: String(e.goalId), date: lDay(e.date), understood, stuck, next });
  }
  const trimmed = log.slice(-LEARN_LIMITS.log); // como planLog: se conservan las más recientes
  [resources, doubts, trimmed].forEach(lUnique);
  return { v: LEARN_V, goals, resources, doubts, log: trimmed };
}

/* Cifras (puras: no tocan learningStatus). */
const learningCount = (l = state.learning) => (lObj(l) ? lArr(l.goals).length + lArr(l.resources).length + lArr(l.doubts).length + lArr(l.log).length : 0);
const learningGoalsOf = (raw) => (lObj(raw) ? lArr(raw.goals).length : 0); // para la vista previa de importar (sobre el archivo, sin sanear)
const learningSize = (l = state.learning) => { try { return JSON.stringify(l).length; } catch { return 0; } };
const learningFull = () => learningSize() > LEARN_SOFT_CAP;
/* ¿Se puede crear algo más? (la interfaz lo consulta antes de abrir un formulario de «nueva meta», etc.) */
function learningRoom(kind) {
  if (learningReadOnly()) return { ok: false, why: 'Estas metas se crearon con una versión más nueva de Learny: aquí solo se pueden ver.' };
  if (learningFull()) return { ok: false, why: 'Tus metas ocupan mucho espacio. Borra alguna o descarga una copia antes de crear más.' };
  const l = state.learning, n = { goal: l.goals.length, stage: l.goals.reduce((t, g) => t + g.stages.length, 0), evidence: l.goals.reduce((t, g) => t + g.stages.reduce((u, s) => u + s.evidence.length, 0), 0), resource: l.resources.length, doubt: l.doubts.length }, cap = { goal: LEARN_LIMITS.goals, stage: LEARN_LIMITS.stages, evidence: LEARN_LIMITS.evidence, resource: LEARN_LIMITS.resources, doubt: LEARN_LIMITS.doubts };
  return n[kind] >= cap[kind] ? { ok: false, why: `Llegaste al máximo (${cap[kind]}). Borra alguno para crear otro.` } : { ok: true, why: '' };
}
