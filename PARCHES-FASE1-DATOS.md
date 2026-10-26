# Fase 1 · capa de datos: parches a los archivos existentes

Archivo nuevo: `js/01c-metas-datos.js` (se carga ANTES de `01-base.js`).
Pruebas: `tests/metas-datos.spec.js` (Playwright) y `tests/run-node.js` (rápidas, sin navegador: `node tests/run-node.js`).

1. **index.html**: antes de `<script src="js/01-base.js" defer>` añade `<script src="js/01c-metas-datos.js" defer></script>`.
2. **sw.js**: añade `'./js/01c-metas-datos.js'` a `CORE` en el mismo orden que index.html (antes de 01-base.js). `CACHE = 'learny-v85'`.
3. **01-base.js**
   - `defaults()`: añade `learning: emptyLearning(),`
   - `hasUserData()`: añade `|| learningCount() > 0`
4. **02-datos.js**
   - `hydrate()`, justo después de sanitizeSettings: `state.learning = sanitizeLearning(state.learning);`
   - `ROUTINE`: añade `'delete-goal'` (para la interfaz; ya queda previsto).
   - Comprueba que `adoptRemoteState` pasa por `hydrate`.
5. **06-hoy.js**: `isNewUser()` añade `&& !learningCount()`.
6. **12-copias-e-importacion.js**: `validateBackup` exige que `learning`, si existe, sea objeto; la vista previa añade «metas (ahora: N)» con `learningGoalsOf(data.learning)`.
7. **15-inicio.js**: avisos con `queueToast` si `learningStatus.bad`, `learningStatus.omitted > 0` o `learningStatus.newer`.
8. **fase0-modelo-metas.md §9**: corregir el orden: 01c va antes de 01-base.js, no entre 01b y 02.

SCHEMA no cambia (sigue en 4); el contenedor lleva su propia versión `learning.v`.
