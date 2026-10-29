# Learny · Autodidacta · Fase 0 · Modelo de datos de las metas

Estado: **propuesta cerrada para implementar en la Fase 1**. No hay código en esta fase.
Base leída: `01-base.js`, `02-datos.js`, `03-interfaz.js` (`save`), `12-copias-e-importacion.js`, `06-hoy.js`, más el paquete de la Etapa 4.

## 1. Decisiones

**Aprobadas por ti**
1. Todo se guarda dentro de **un contenedor único**: `state.learning`.
2. **La meta agrupa materias** (las materias de las tarjetas); **el ritmo semanal sigue siendo global**.
3. Las **evidencias** son solo texto y enlaces (sin archivos).
4. Esta Fase 0 termina en este documento.

**Tomadas por mí (revísalas)**
- A. **No se sube `SCHEMA`** (sigue en 4). Corrige lo que dije al plantear la fase (ver §2).
- B. El contenedor lleva **su propia versión** (`learning.v`, empieza en 1).
- C. **Una materia puede estar en varias metas a la vez** (corregido a petición tuya: una meta como «polímata y autodidacta» abarca muchas materias que otras metas también usan). No hay restricción ni «gana la primera»; ver §5.
- D. **Una práctica por etapa.** Si hacen falta más, se divide la etapa (ya estaba en la propuesta: «añadir, mover, dividir»).
- E. Importar una copia **sin** metas reemplaza las metas actuales (como reemplaza todo lo demás), pero la vista previa lo dice con cifras y siempre hay copia automática previa.
- F. Límites y presupuesto de espacio de §8.
- G. **Metas con submetas (combinando las dos formas de usar «polímata»).** Una meta puede ser una sola con muchas áreas **o** una meta madre con submetas, y se pueden mezclar: la madre tiene sus propias materias y etapas y, además, hijas con las suyas. Un solo campo opcional, `parentId`, y **dos niveles como máximo** (madre → submeta). Reglas en §4 y §5.

## 2. Corrección: no hace falta subir el esquema

Antes dije que las metas obligaban a pasar a la v5 y a que una app vieja viera los datos en solo lectura. Con un contenedor eso no ocurre, por cómo está el código:

- `hydrate()` hace `Object.assign(state, base, src)`: **cualquier clave de primer nivel desconocida se conserva**.
- `save()` guarda `JSON.stringify(state)` entero; `exportData()` y `snapshot()` también copian todo `state` salvo `apiKey` (y `chats` en el snapshot).
- Por tanto una versión anterior (≤ v83) **conserva y reescribe `learning` sin tocarlo**, y las copias lo incluyen.
- `newerFrom` (solo lectura) solo salta con `version > SCHEMA`; no se activa, y los usuarios con metas no pierden nada al abrir la app en otra versión.

Lo que se pierde: la protección automática por versión. La sustituye `learning.v` (§7).
**Cómo comprobarlo antes de la Fase 1:** cargar en la v83 una copia con `"learning": {"v":1,"goals":[]}`, guardar y comprobar que la clave sigue en `learny.v3`.

## 3. El contenedor

```json
"learning": {
  "v": 1,
  "goals": [ { "id": "…", "title": "…", "stages": [ … ] } ],
  "resources": [],
  "doubts": [],
  "log": []
}
```

Ausente o vacío = igual que hoy. `defaults()` añade `learning: emptyLearning()`.

### 3.1 Meta (`goals[]`) — Fase 1
| Campo | Tipo / límite | Notas |
|---|---|---|
| `id` | cadena única | `idOf` / `uniqueIds` |
| `parentId` | id de otra meta o `''` | **Opcional.** `''` = meta de primer nivel. Solo puede apuntar a una meta que a su vez sea de primer nivel (máximo 2 niveles) |
| `title` | ≤ 120, obligatorio | «¿Qué quieres aprender?» |
| `why` | ≤ 200 | «¿Para qué?» |
| `current` | ≤ 300 | «¿Qué sabes ahora?» |
| `outcome` | ≤ 200 | «¿Qué serás capaz de hacer?» (el resultado concreto) |
| `weeklyMin` | 0 o 15–2400 | «¿Cuánto tiempo por semana?» 0 = sin definir. Solo informativo; el ritmo global no cambia |
| `targetDate` | día válido o `''` | Opcional. **Sin cuenta regresiva**: no genera tareas atrasadas ni plan inverso |
| `subjects` | ≤ 30 cadenas ≤ 60 | Materias de las tarjetas (§5). Una misma materia puede estar en varias metas |
| `status` | `active` · `paused` · `done` · `archived` | |
| `created` | día | |
| `stages` | ≤ 30 por meta | |

### 3.2 Etapa (`goals[].stages[]`) — Fase 1 (campos de práctica y evidencia se usan desde la Fase 2)
| Campo | Tipo / límite | Notas |
|---|---|---|
| `id` | cadena única | |
| `title` | ≤ 100, obligatorio | |
| `learn` | ≤ 200 | Qué aprender |
| `practice` | ≤ 200 | Práctica / reto (una por etapa, decisión D) |
| `check` | ≤ 200 | Cómo comprobarlo |
| `status` | `todo` · `doing` · `done` · `skipped` · `known` | `known` = «esto ya lo sé», **sin** comprobar |
| `level` | `''` · `explore` · `help` · `alone` · `transfer` · `review` | **Autoevaluación** (§6) |
| `subject` | `''` o una de `goal.subjects` | Para crear tarjetas / mini quiz de la etapa |
| `checked` | boolean | Hubo una comprobación (§6) |
| `checkedHow` | `''` · `practice` · `feynman` · `cards` | |
| `checkedAt` | día o `''` | |
| `evidence` | ≤ 5 por etapa | Ver 3.3 |
| `origin` | `''` · `template` · `ia` | Procedencia; la IA es una ampliación posterior |

El orden de la ruta es el orden del arreglo (no hay campo `order`: mover = reordenar).

### 3.3 Evidencia (`stage.evidence[]`) — Fase 2
`{ id, date, kind: 'text'|'link'|'feynman', text ≤ 500, url ≤ 200 }`.
`kind: 'feynman'` registra que se hizo una explicación (fecha y tema en `text`): `state.feynman` solo guarda fechas, no tema, así que **no se puede vincular automáticamente** y se anota a mano al terminarla.
`url` solo `http:` o `https:`; se muestra como enlace con `target="_blank" rel="noopener noreferrer"`, nunca se descarga ni se consulta.

### 3.4 Recurso (`resources[]`) — Fase 3
`{ id, goalId, stageId|'', type: 'link'|'book'|'video'|'course'|'note', title ≤ 120, url ≤ 200, status: 'pending'|'using'|'consulted'|'dropped', why ≤ 200, next: ''|'practice'|'explain'|'cards'|'apply' }`.

### 3.5 Duda (`doubts[]`) — Fase 4
`{ id, goalId, stageId|'', date, text ≤ 300, status: 'open'|'researching'|'solved'|'help', answer ≤ 300 }`.

### 3.6 Bitácora (`log[]`) — Fase 4
`{ id, goalId, date, understood ≤ 240, stuck ≤ 240, next ≤ 240 }`. Las tres son opcionales (una entrada con las tres vacías no se guarda).

### 3.7 Campos fuera del contenedor (Fase 3)
`sessions[]` gana `goalId` y `stageId` **opcionales** (cadenas ≤ 100). `hydrate` ya conserva campos extra en las sesiones (`...s`); en la Fase 3 se sanean. Sin ellos la sesión cuenta igual para el ritmo global.

## 4. Reglas de integridad
- **Ids**: `idOf` + `uniqueIds` por lista y por etapas dentro de cada meta.
- **Submetas**: `parentId` debe existir y la meta madre debe tener `parentId: ''`; si no (madre inexistente, o que a su vez es hija), la meta pasa a primer nivel. Con solo dos niveles **no puede haber ciclos**. Tope de 12 submetas por madre. Las submetas se ordenan por su posición en `goals[]`.
- **Borrar una madre** pregunta qué hacer con sus submetas: «Borrar también las submetas» o «Conservarlas como metas independientes» (`parentId` pasa a `''`); ambas con «Deshacer». Archivar, pausar o completar una madre **no** cambia el estado de sus hijas (y al revés), para no marcar nada como hecho por arrastre.
- **Referencias**: `resource/doubt/log.goalId` debe existir; si no, se descarta el elemento (como las tareas sin fecha). `stageId` inexistente pasa a `''`.
- **Enumerados**: valor desconocido → el valor por defecto de la columna (nunca se rechaza el archivo).
- **Texto**: `clean`/`cleanMl` y recorte por campo; todo se pinta con `esc()`; los textos del usuario van con `translate="no"` (no se traducen).
- **Fechas**: `isDay`; inválida → `''`.
- **Borrar una meta** borra en cascada sus recursos, dudas y bitácora, con «Deshacer» y una copia rutinaria (`'delete-goal'`, que se añade a `ROUTINE` en `02-datos.js`).
- **Topes**: en la interfaz se **rechaza crear** por encima de ellos, así que una persona nunca los alcanza por error. Al cargar, `sanitizeLearning` solo recorta campos de texto y la bitácora (`slice(-80)`, como `planLog`); lo que sobre de los demás topes (solo posible con un archivo editado a mano) se omite **y se avisa** con un aviso de arranque, con la copia automática como respaldo.

## 5. Relación con lo que ya existe
- **Materias.** Las tarjetas guardan la materia como texto (`card.subject`). `goal.subjects` guarda esos mismos textos y se compara con `norm()`. **Una materia puede pertenecer a varias metas**: las tarjetas de una meta son la unión de las de sus materias, y la misma tarjeta cuenta en todas las metas que la incluyen (nada se duplica ni se reparte). Dos consecuencias: (1) el tiempo se atribuye por **sesión** (`goalId`, una sola meta por sesión), no por materia, así que el reloj de una meta nunca se cuenta dos veces; (2) «Hoy» (Fase 4) no repite una acción de la misma materia aunque dos metas la tengan: se muestra una vez, indicando a qué metas sirve. Si cambias el nombre de una materia en tus tarjetas, el vínculo se pierde; la ficha de la meta muestra «materia sin tarjetas» para que se note.
- **Ritmo.** `settings.weeklyGoal` y «Tu ritmo de esta semana» (Etapa 4) no cambian: cuentan todas las sesiones. `weeklyMin` de una meta es informativo y solo se compara con las sesiones etiquetadas con esa meta (Fase 3).
- **Progreso por tema** (Etapa 4) sigue por materia; la meta se suma, no lo sustituye.
- **Hoy (`actionCandidates`)**: en la Fase 4 `selfCandidates` añade acciones nuevas (`goalNext`, `doubts`); el modo examen y el resto de perfiles no cambian.
- **Madre y submetas (cálculo, nunca guardado).** Para evitar datos que se desincronizan, el progreso de una madre **no se almacena**: se calcula al pintar.
  - *Materias efectivas* de la madre = las suyas ∪ las de sus submetas.
  - *Tiempo* de la madre = sesiones con su `goalId` + sesiones de sus submetas (cada sesión tiene una sola meta, así que no se cuenta dos veces).
  - *Etapas*: la madre muestra sus etapas propias y un resumen por submeta («3 de 7 etapas con actividad»); el recuento por estado nunca mezcla `known` con comprobadas.
  - *Recursos, dudas y bitácora* de una submeta se ven también en la ficha de la madre, filtrables por submeta.
  - `weeklyMin` es por meta y **no se suma solo**: la madre muestra su propio valor y, aparte, lo registrado esta semana (suma de sus submetas), como dato informativo.
  - Una **meta sola con muchas áreas** y una **madre con submetas** son el mismo modelo: se empieza con una sola y se puede «dividir en submetas» más adelante (crea una submeta por cada materia o etapa elegida, sin perder nada).
- **Perfiles.** Las metas existen aunque el perfil no sea `self`; solo se **ven** en `self`. Cambiar de perfil no las borra ni las duplica. Cuentan en `hasUserData()` y en `isNewUser()` (quien solo tiene una meta no es «usuario nuevo»).
- **SM-2, Pomodoro, Feynman y estadísticas** no se tocan.

## 6. Qué significa «avanzar» (sin certificar nada)
Tres capas distintas, nunca fusionadas en un «dominado»:
1. **Recurso consultado**: `resource.status`. Ver un video no marca nada más.
2. **Actividad realizada**: la etapa tiene ≥ 1 evidencia.
3. **Comprobación**: `checked: true` con `checkedHow` (una práctica sin ayuda con evidencia, una explicación Feynman, o tarjetas acertadas). Sigue siendo autodeclarada: la interfaz dice «comprobada con una actividad», no «dominada» ni «certificada».

`level` es siempre **autoevaluación** y se rotula así donde se muestre. «Esto ya lo sé» (`known`) ofrece comprobarlo o continuar; no cuenta como comprobación.

## 7. Compatibilidad y migración
| Caso | Qué pasa |
|---|---|
| Usuario actual, sin `learning` | Contenedor vacío; sin aviso, sin copia de migración, `version` sigue en 4 |
| App ≤ v83 abre datos con `learning` | La clave se conserva y se reescribe tal cual (§2) |
| `learning.v` mayor que el soportado | El contenedor se guarda **intacto** y las metas quedan **de solo lectura** con un aviso («creadas con una versión más nueva»); el resto de la app funciona normal |
| `learning` no es un objeto | Se ignora y se avisa (hay copia automática); no bloquea el arranque |
| Importar copia con `learning` | `validateBackup` exige que sea objeto (como las listas de `BACKUP_LISTS`); la vista previa añade «metas (ahora: N)» |
| Importar / restaurar copia sin `learning` | Reemplaza las metas por un contenedor vacío (decisión E); antes se guarda copia automática |
| Compartir mazo | Sin cambios (no incluye metas) |
| «Borrar todo» | Borra también las metas |
| Otra pestaña | `adoptRemoteState` pasa por `hydrate`; **a verificar en la Fase 1** que sanea el contenedor igual |
| Futuro (rutas compartibles, Pro) | Cambios de forma → `learning.v = 2` con su propia función de migración dentro de `sanitizeLearning`, sin tocar `SCHEMA` |

**Demo (`?demo`)**: `seedDemo` añade una meta de ejemplo (para la demostración de la feria) con una etapa y una evidencia. Como el contenido del usuario no se traduce, el texto de ejemplo irá en español en ambas lenguas, salvo que se decida duplicarlo.

## 8. Presupuesto de almacenamiento
`localStorage` guarda el estado completo y `MAX_BACKUPS = 3` copias que también lo incluyen: **cada carácter del contenedor ocupa unas 4 veces**.

Topes globales (no solo por meta): 40 metas (contando submetas) · 150 etapas en total · 100 evidencias · 100 recursos · 80 dudas · 80 entradas de bitácora.
- **Peor caso teórico** (todo al máximo y con todos los campos llenos): ≈ 556 000 caracteres (≈ 2,2 M con las copias). Medido con cadenas del largo máximo, no estimado a ojo.
- **Uso realista** (3 metas, 8 etapas cada una, algo de evidencia): ≈ 95 000.
- **Límite blando**: si `JSON.stringify(state.learning)` pasa de 250 000, no se permite crear más hasta borrar o descargar una copia, con aviso. Así `save()` no llega a fallar por esto (si fallara, ya suelta copias antiguas, como hoy).

## 9. Dónde va cada cosa (para la Fase 1)
- `js/01c-metas-datos.js` (nuevo, **antes de `01-base.js`** en `index.html` y `CORE`): constantes, topes, `emptyLearning()`, `sanitizeLearning(raw)`, `learningSize()`, `learningCount()`. Va antes de `01-base.js` porque `defaults()` llama a `emptyLearning()` al cargar ese archivo (y `load()`, en `02-datos.js`, llama a `hydrate()`).
- `js/01-base.js`: `learning: emptyLearning()` en `defaults()` y `learningCount()` en `hasUserData()`.
- `js/02-datos.js`: `state.learning = sanitizeLearning(state.learning)` en `hydrate`; `'delete-goal'` en `ROUTINE`.
- `js/12-copias-e-importacion.js`: `learning` en `validateBackup` y filas en la vista previa de importar.
- `js/06-hoy.js`: `isNewUser()` también mira las metas.
- `js/22-metas.js` (nuevo, después de `21-quiz.js` y antes de `extras.js`): interfaz de metas. (Esta nota decía `js/20-metas.js` y «después de `14b`»; al implementarse, los números 20 y 21 ya estaban ocupados por Pro y el quiz.)
- `js/18-idioma.js`, `sw.js` (`CORE` + caché), `index.html`, `tests/metas-datos.spec.js` y `tests/metas-ui.spec.js` (antes previsto como `tests/metas.spec.js`).

## 10. Pruebas de la Fase 1 (a escribir con el código)
1. La clave `learning` sobrevive a un ciclo cargar → guardar en la v83 (comprobación manual de §2).
2. `sanitizeLearning`: tipos erróneos, enumerados inválidos, ids repetidos, referencias rotas, topes, `__proto__`, URL `javascript:`.
3. `learning.v` mayor: se conserva byte a byte y la interfaz queda en solo lectura.
4. Exportar → importar conserva metas; importar una copia sin metas muestra las cifras y avisa.
5. Cascada al borrar una meta y «Deshacer».
6. Submetas: `parentId` roto o de tercer nivel pasa a primer nivel; tope de 12; borrar una madre en sus dos variantes; la madre no se marca hecha al completar una hija; el cálculo de la madre no cuenta dos veces una sesión ni una tarjeta de materia compartida.
7. Perfil `exam` / `teach` / vacío: `actionCandidates()` idéntico al de siempre y sin pestaña de metas; cambiar de perfil no pierde metas.
8. Límite blando de 250 000 impide crear más y no rompe el guardado.
9. Accesibilidad: formularios con `modal()`, foco, avisos con `announce()`, y textos nuevos en `EX`.

## 11. Preguntas que quedan para fases posteriores
- Con submetas, la pantalla «Hoy» (Fase 4) debe decidir cuántas acciones muestra por meta madre para no saturar (propuesta: la madre ofrece la más urgente entre sus hijas, no una por hija).
- «Dividir en submetas» (§5): hasta la Fase 1 se queda como idea; se implementa si hace falta tras probar la ficha.
- ¿Se pueden **compartir rutas** entre personas (plantillas exportables)? Hoy no: sería otra función, cercana al modo profesor (6a).
- Apariencia y nombres en inglés de los estados (`level`, `status`), que se traducen como el resto de la interfaz.
- Si las dudas deben poder convertirse en tarjeta sola, o abrir siempre el formulario de tarjeta con el texto precargado (propuesta: lo segundo, para no crear tarjetas sin revisar).
- Pro: qué campos de la propuesta (hitos, entregables, rúbricas) se añadirían en `learning.v = 2`.
