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
