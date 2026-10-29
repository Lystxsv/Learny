/* Learny · parte 8 de 15 · Análisis
   Estadísticas por materia y exportación del informe.
   Se carga con <script defer> en el orden de index.html y comparte el ámbito global con las demás partes
   (los const/let/function de nivel superior son visibles entre archivos; no hay import/export). */
'use strict';

/* =========================================================
   Análisis
   ========================================================= */
function subjectStats(list = state.reviews) {
  const map = Object.create(null); // sin prototipo: una materia llamada «constructor» ya no rompe nada
  list.forEach((r) => {
    const k = r.subject || 'Sin materia';
    map[k] ||= { total: 0, easy: 0, ok: 0, again: 0, cards: new Set() };
    map[k].total++;
    if (r.rating === 'easy') map[k].easy++;
    if (r.rating !== 'again') map[k].ok++;
    else map[k].again++;
    if (r.cardId) map[k].cards.add(r.cardId);
  });
  return map;
}

const periodDays = () => ({ '7': 7, '30': 30 }[state.settings.statsPeriod] || null);
const inPeriod = (date) => { const n = periodDays(); return !n || date >= addDays(today(), -(n - 1)); };
const periodLabel = () => ({ '7': 'últimos 7 días', '30': 'últimos 30 días' }[state.settings.statsPeriod] || 'todo el historial guardado');
const sampleNote = (a, b, what) => (b ? `${a} de ${b} ${what}${b < 10 ? ' · muestra pequeña' : ''}` : 'Sin datos en este periodo');
const pctOf = (a, b) => (b ? `${Math.round((a * 100) / b)}%` : '—');

function renderAnalysis() {
  $('#stats-period').value = state.settings.statsPeriod;
  $('#stats-period-note').textContent = `Periodo: ${periodLabel()}.`;
  const reviews = state.reviews.filter((r) => inPeriod(r.date));
  const easy = reviews.filter((r) => r.rating === 'easy').length;
  const correct = reviews.filter((r) => r.rating !== 'again').length;
  $('#retention-stat').textContent = pctOf(easy, reviews.length);
  $('#retention-note').textContent = sampleNote(easy, reviews.length, 'repasos marcados «Fácil»');
  $('#accuracy-stat').textContent = pctOf(correct, reviews.length);
  $('#accuracy-note').textContent = sampleNote(correct, reviews.length, 'repasos sin «No lo sabía»');
  const exams = state.exams.filter((e) => inPeriod(e.date)), exScore = exams.reduce((t, e) => t + e.score, 0), exTotal = exams.reduce((t, e) => t + e.total, 0);
  $('#exam-stat').textContent = pctOf(exScore, exTotal);
  $('#exam-note').textContent = exTotal ? `${exScore} de ${exTotal} respuestas «Fácil» en ${plural(exams.length, 'examen', 'exámenes')}${exTotal < 10 ? ' · muestra pequeña' : ''}` : 'Sin exámenes en este periodo';
  const activeDays = new Set([...state.sessions.filter((x) => !x.abandon), ...reviews].filter((x) => inPeriod(x.date)).map((x) => x.date));
  const span = periodDays() || Math.max(1, ...[...activeDays].map((d) => 1 - daysUntil(d)));
  $('#consistency-stat').textContent = `${activeDays.size} ${activeDays.size === 1 ? 'día' : 'días'}`;
  $('#consistency-note').textContent = `de ${span} días del periodo${calcStreak().graceUsed ? ' · día de gracia usado' : ' · día de gracia disponible'}`;
  const mins = state.sessions.filter((x) => !x.abandon && inPeriod(x.date)).reduce((t, x) => t + Number(x.minutes || 0), 0);
  $('#time-stat').textContent = `${mins} min`;
  $('#time-note').textContent = `de ${plural(state.sessions.filter((x) => !x.abandon && inPeriod(x.date)).length, 'bloque', 'bloques')} · tiempo en sesión, no aprendizaje`;
  $('#overdue-stat').textContent = overdueCards().length;
  safe(renderForecast, 'previsión de repasos'); safe(renderRetention, 'retención real'); safe(renderLeeches, 'tarjetas difíciles'); safe(renderClass, 'resultados de alumnos');

  const days = [], names = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today(), -i);
    days.push({ date, label: names[new Date(`${date}T12:00:00`).getDay()], mins: state.sessions.filter((s) => s.date === date && !s.abandon).reduce((t, s) => t + Number(s.minutes || 0), 0) });
  }
  const max = Math.max(30, ...days.map((d) => d.mins));
  $('#focus-chart').innerHTML = days.map((d) => `<div class="bar-col" title="${d.date}: ${d.mins} min"><div class="bar-area"><div class="bar" style="height:${d.mins ? Math.max(4, (d.mins / max) * 100) : 0}%"></div></div><span>${d.label}<br>${d.mins}</span></div>`).join('');
  const weekMin = days.reduce((t, d) => t + d.mins, 0), goalMin = state.settings.dailyGoal * state.settings.focus * 7;
  $('#focus-summary').textContent = state.sessions.some((x) => !x.abandon)
    ? `Esta semana: ${weekMin} min de ${goalMin} min.${weekMin >= goalMin ? ' ¡Meta cumplida!' : ` Te faltan ${goalMin - weekMin} min.`}`
    : 'Completa tu primer Pomodoro para ver tu progreso.';

  const stats = subjectStats(reviews);
  const areas = Object.entries(stats).map(([name, v]) => ({ name, pct: Math.round((v.ok * 100) / v.total), ok: v.ok, total: v.total, again: v.again })).sort((a, b) => a.pct - b.pct);
  if (!areas.length) {
    $('#weak-topics').innerHTML = '<p class="empty">Aún no hay repasos en este periodo. Repasa tus primeras tarjetas para ver qué materias reforzar.</p>';
    return;
  }
  $('#weak-topics').innerHTML = areas.map((a) => {
    const weakCards = state.cards.filter((c) => c.subject === a.name && (c.history || []).some((h) => h.rating === 'again')).slice(0, 5);
    const extra = weakCards.length ? `<small>Revisa: ${weakCards.map((c) => esc(c.question.slice(0, 40))).join(' · ')}</small>` : '';
    const tip = a.total < MIN_SAMPLE ? `${esc(a.name)}: pocos datos todavía. Repasa más para saber cómo vas.`
      : a.pct < 60 ? `${esc(a.name)}: ${a.pct}% sin fallar; priorízala mañana.` : `${esc(a.name)}: ${a.pct}% sin fallar.`;
    return `<div class="weak-topic"><span>${tip}<br>${extra}<button class="text-button" data-quiz-subject="${esc(a.name)}" type="button">Mini quiz de ${esc(a.name)}</button></span><b>${a.ok} de ${a.total}</b></div>`;
  }).join('');
}

/* Fase 5 (v67): repasos ya programados para los próximos 7 días. Solo lee las fechas de las tarjetas (no cambia nada). «Hoy» usa dueCards() (incluye lo vencido), igual que el contador de Practicar.
   No es una predicción: lo que falles o repases antes volverá antes y no está contado. */
const FORECAST_DAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
function renderForecast() {
  const chart = $('#forecast-chart'); if (!chart) return;
  const live = state.cards.filter((c) => !c.archived && !c.corrupt), dates = Array.from({ length: 7 }, (_, i) => addDays(today(), i)), counts = dates.map(() => 0);
  let later = 0;
  live.forEach((c) => { const i = dates.indexOf(c.nextReview); if (i > 0) counts[i]++; else if (c.nextReview > dates[6]) later++; });
  counts[0] = dueCards().length;
  const total = counts.reduce((t, n) => t + n, 0);
  $('#forecast-total').textContent = plural(total, 'repaso', 'repasos');
  chart.hidden = !live.length;
  if (!live.length) { chart.innerHTML = ''; $('#forecast-note').textContent = 'Crea tarjetas para ver cuántos repasos te esperan.'; return; }
  const max = Math.max(5, ...counts);
  chart.innerHTML = dates.map((d, i) => `<div class="bar-col" title="${d}: ${plural(counts[i], 'repaso', 'repasos')}"><div class="bar-area"><div class="bar" aria-hidden="true" style="height:${counts[i] ? Math.max(4, (counts[i] / max) * 100) : 0}%"></div></div><span>${i === 0 ? 'hoy' : FORECAST_DAYS[new Date(`${d}T12:00:00`).getDay()]}<br>${counts[i]}</span></div>`).join('');
  $('#forecast-note').textContent = `${later ? `Más adelante: ${plural(later, 'tarjeta', 'tarjetas')}. ` : ''}Solo cuenta lo que ya está programado; si fallas una tarjeta, volverá antes.`;
}

function weekSlice() {
  const from = addDays(today(), -6);
  return {
    from, to: today(),
    minutes: state.sessions.filter((s) => s.date >= from && !s.abandon).map((s) => ({ date: s.date, minutes: s.minutes, label: s.label, intention: s.intention })),
    reviews: state.reviews.filter((r) => r.date >= from),
    overdue: overdueCards().map((c) => ({ subject: c.subject, question: c.question, nextReview: c.nextReview })),
    recuerdoDeclarado: { facil: state.reviews.filter((r) => r.rating === 'easy').length, repasos: state.reviews.length, nota: 'Autoevaluación: porcentaje de repasos marcados «Fácil», no una medida de retención.' }
  };
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportReport() {
  if (DEMO) return toast('En la demostración no se descargan informes.', 'error');
  modal(`<h2>Informe semanal</h2><p>Elige formato. Incluye minutos, etiquetas, intenciones y preguntas de tarjetas vencidas; no incluye tu clave.</p>
      <div class="actions"><button id="rep-json" class="primary-button" type="button">JSON</button>
      <button id="rep-csv" class="outline-button" type="button">CSV</button></div>`, () => closeModal());
  $('#rep-json').onclick = () => { download(`learny-semana-${today()}.json`, JSON.stringify(weekSlice(), null, 2), 'application/json'); closeModal(); toast('Informe JSON descargado.'); };
  $('#rep-csv').onclick = () => {
    const w = weekSlice();
    const rows = [['fecha', 'minutos', 'etiqueta']].concat(w.minutes.map((s) => [s.date, s.minutes, s.label]));
    download(`learny-semana-${today()}.csv`, rows.map((r) => r.map((x) => { const v = String(x); return `"${(/^[=+\-@\t\r]/.test(v) ? "'" : '') + v.replace(/"/g, '""')}"`; }).join(',')).join('\n'), 'text/csv');
    closeModal(); toast('Informe CSV descargado.');
  };
}

/* Fase 8 (v71): retención REAL frente a un objetivo. A diferencia de «Recuerdo declarado» (todo lo marcado «Fácil»), aquí solo cuentan los repasos de tarjetas que ya se habían visto antes
   y se mide si se recordó (no «No lo sabía»). El intervalo real de cada repaso sale del historial de la propia tarjeta: días entre ese repaso y el anterior (sin tocar datos ni algoritmo).
   «Jóvenes»: volvían en menos de MATURE_DAYS días; «maduras»: en MATURE_DAYS o más. El objetivo es una referencia fija del 90 % (no cambia el repaso). El historial guarda 40 repasos por tarjeta. */
const TARGET_RETENTION = 90, MATURE_DAYS = 21;
function retentionReal(inRange = inPeriod) {
  const out = { young: { ok: 0, n: 0 }, mature: { ok: 0, n: 0 } };
  state.cards.forEach((c) => {
    const h = (c.history || []).filter((x) => isDay(x.date));
    for (let i = 1; i < h.length; i++) {
      if (!inRange(h[i].date)) continue;
      const gap = Math.round((new Date(`${h[i].date}T12:00:00`) - new Date(`${h[i - 1].date}T12:00:00`)) / 86400000);
      if (gap < 1) continue; // dos repasos el mismo día no miden memoria
      const b = gap >= MATURE_DAYS ? out.mature : out.young;
      b.n++; if (h[i].rating !== 'again') b.ok++;
    }
  });
  return out;
}
function renderRetention() {
  const box = $('#retention-real'); if (!box) return;
  const r = retentionReal(), row = (label, b) => {
    const pct = b.n ? Math.round((b.ok * 100) / b.n) : null, gap = pct == null ? '' : pct >= TARGET_RETENTION ? ' · en el objetivo' : ` · ${TARGET_RETENTION - pct} puntos por debajo`;
    return `<div class="weak-topic"><span>${label}<br><small>${pct == null ? 'Sin datos en este periodo' : `${b.ok} de ${b.n} recordadas${b.n < 10 ? ' · muestra pequeña' : ''}${gap}`}</small></span><b>${pct == null ? '—' : `${pct}%`}</b></div>`;
  };
  $('#retention-real-tag').textContent = `Objetivo ${TARGET_RETENTION}%`;
  box.innerHTML = row(`Tarjetas jóvenes (volvían en menos de ${MATURE_DAYS} días)`, r.young) + row(`Tarjetas maduras (volvían en ${MATURE_DAYS} días o más)`, r.mature);
  $('#retention-real-note').textContent = r.young.n + r.mature.n >= 10 ? 'Si pasas semanas por debajo del objetivo, repasa con más frecuencia o reescribe las tarjetas que se te resisten.' : 'Con pocos repasos esta cifra aún no es fiable: se afina a medida que repasas.';
}

function renderLeeches() {
  const box = $('#leech-list'); if (!box) return;
  const list = leechCards();
  $('#leech-count').textContent = plural(list.length, 'tarjeta', 'tarjetas');
  box.innerHTML = list.length
    ? list.slice(0, 5).map((c) => `<div class="weak-topic"><span><b translate="no">${esc(c.question.slice(0, 80))}</b><br><small><span translate="no">${esc(c.subject)}</span> · ${plural(leechCount(c), 'fallo', 'fallos')}</small><br><button class="text-button" type="button" data-leech-open="${esc(c.id)}">Reescribir o dividir</button></span><b>${leechCount(c)}×</b></div>`).join('') + (list.length > 5 ? `<p class="hint">… y ${list.length - 5} más.</p>` : '')
    : `<p class="empty">Ninguna tarjeta acumula ${LEECH_AT} fallos. Si alguna lo hace, aparecerá aquí con una propuesta para reescribirla o dividirla.</p>`;
}
