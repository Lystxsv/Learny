/* Learny · parte 1b · Textos según el perfil (Perfiles · Etapa 2)
   Una sola tabla con las frases más cargadas de «presión de examen», en tres variantes (settings.profile: 'exam' | 'self' | 'teach'; '' o desconocido = 'exam', como siempre).
   Cada variante es [español, inglés]. La LÓGICA no cambia: solo cambia lo que se lee.
   Quién la usa:
   · JS: ptxt('clave') devuelve el español del perfil activo (06-hoy, 04-planificador, 08-analisis, extras.js vía window.Learny.ptxt). La traducción al inglés de esas frases la hace 18-idioma.js, que construye su diccionario
     a partir de ESTA tabla (así perfil e idioma no se multiplican y no hay que repetir frases en EX).
   · HTML estático: cualquier elemento con data-ptxt="clave" (el texto escrito en el HTML es la variante «exam»). applyProfileTexts() lo reescribe al cambiar el perfil o el idioma.
   Para añadir una frase: una entrada aquí con las tres variantes, y data-ptxt o ptxt(). No hay que tocar 18-idioma.js (salvo PROFILE_NO_EX si la palabra es corta o ambigua).
   Se carga con <script defer> justo después de 01-base.js (15-inicio.js ya usa ptxt al arrancar). */
'use strict';

const PROFILE_IDS = ['exam', 'self', 'teach'];
const PROFILE_TEXT = Object.freeze({
  stuck: Object.freeze({
    exam: ['Hoy me cuesta arrancar', "I'm struggling to start today"],
    self: ['Hoy me cuesta empezar', "I'm finding it hard to start today"],
    teach: ['Hoy me cuesta ponerme con el material', "I'm finding it hard to start on my material today"]
  }),
  realExam: Object.freeze({
    exam: ['Examen real', 'Real exam'],
    self: ['Prueba cronometrada', 'Timed test'],
    teach: ['Prueba cronometrada', 'Timed test']
  }),
  missOne: Object.freeze({ exam: ['fallo', 'mistake'], self: ['tropiezo', 'slip-up'], teach: ['error', 'error'] }),
  missMany: Object.freeze({ exam: ['fallos', 'mistakes'], self: ['tropiezos', 'slip-ups'], teach: ['errores', 'errors'] }),
  recoveryTitle: Object.freeze({
    exam: ['Informe de examen', 'Exam report'],
    self: ['Cuando algo no salió bien', 'When something did not go well'],
    teach: ['Informe de una prueba', 'Test report']
  }),
  recoverySub: Object.freeze({
    exam: ['registra qué falló y crea un plan de recuperación', 'record what went wrong and create a recovery plan'],
    self: ['anota qué se te resistió y crea un plan para retomarlo', 'note what felt hard and create a plan to pick it back up'],
    teach: ['anota qué falló en una prueba y crea un plan de refuerzo', 'record what went wrong in a test and create a reinforcement plan']
  }),
  recoveryLead: Object.freeze({
    exam: ['Registra qué falló en un parcial y Learny arma un plan de recuperación.', 'Record what went wrong in an exam and Learny builds a recovery plan.'],
    self: ['Anota qué se te resistió y Learny arma un plan para retomarlo.', 'Note what felt hard and Learny builds a plan to pick it back up.'],
    teach: ['Anota qué falló en una prueba y Learny arma un plan de refuerzo.', 'Record what went wrong in a test and Learny builds a reinforcement plan.']
  }),
  recoveryMiss: Object.freeze({
    exam: ['Qué falló', 'What went wrong'],
    self: ['Qué se te resistió', 'What felt hard'],
    teach: ['Qué falló', 'What went wrong']
  }),
  recoveryBtn: Object.freeze({
    exam: ['Crear plan de recuperación', 'Create recovery plan'],
    self: ['Crear plan para retomarlo', 'Create a plan to pick it back up'],
    teach: ['Crear plan de refuerzo', 'Create reinforcement plan']
  }),
  recoveryPlan: Object.freeze({
    exam: ['un plan de recuperación', 'a recovery plan'],
    self: ['un plan para retomarlo', 'a plan to pick it back up'],
    teach: ['un plan de refuerzo', 'a reinforcement plan']
  }),
  recoveryToast: Object.freeze({
    exam: ['Plan de recuperación creado para 7 días.', 'Recovery plan created for 7 days.'],
    self: ['Plan para retomarlo creado para 7 días.', 'Plan to pick it back up created for 7 days.'],
    teach: ['Plan de refuerzo creado para 7 días.', 'Reinforcement plan created for 7 days.']
  }),
  recoveryName: Object.freeze({ exam: ['Recuperación', 'Recovery'], self: ['Retomar', 'Pick back up'], teach: ['Refuerzo', 'Reinforcement'] }) // prefijo del título de la fecha que crea el plan (se guarda en los datos)
});
/* Claves que 18-idioma.js NO añade a su diccionario global (palabras sueltas o que se guardan en los datos): se traducen solo donde una regla lo pide. */
const PROFILE_NO_EX = Object.freeze(['missOne', 'missMany', 'recoveryName']);

const profileOf = (s = state.settings) => (s && PROFILE_IDS.includes(s.profile) ? s.profile : 'exam');
/* El español de la clave para el perfil activo (o para el de `s`). Una clave desconocida devuelve la propia clave: se nota enseguida en pantalla. */
const ptxt = (key, s) => { const v = PROFILE_TEXT[key]; return v ? (v[profileOf(s)] || v.exam)[0] : key; };

/* Reescribe los elementos con data-ptxt. En español: la variante del perfil. En inglés: lo traduce 18-idioma.js a partir de la misma tabla, salvo dentro de un bloque translate="no"
   (la guía en inglés), donde se escribe directamente el inglés. Se recuerda lo ya escrito por elemento (WeakMap) para no tocar el DOM si nada cambió. */
const ptxtApplied = new WeakMap();
function applyProfileTexts(s = state.settings) {
  const p = profileOf(s), en = !s || s.lang !== 'es';
  document.querySelectorAll('[data-ptxt]').forEach((el) => {
    const v = PROFILE_TEXT[el.dataset.ptxt]; if (!v) return;
    const pair = v[p] || v.exam, direct = en && !!el.closest('[translate="no"]'), val = direct ? pair[1] : pair[0], k = `${p}|${direct ? 'en' : 'es'}|${val}`;
    if (ptxtApplied.get(el) === k) return;
    ptxtApplied.set(el, k); el.textContent = val;
  });
}
