# nube

Todo lo que hacía que Learny tuviera cuentas, plan Pro por cuenta y clase en la nube con Firebase. **Congelado y retirado de la app el 1-11-2026 (v109): nada de esto se carga ni se precachea.** Learny funciona solo en local. La carpeta existe para que un fallo de Firebase, de la CDN o de las cuentas no pueda tocar a la app, y para poder reactivarla sin reconstruirla.

| Qué | Dónde |
|---|---|
| Cuenta: botón «Entrar», inicio de sesión, «Tu cuenta», sección `#pro` (expone `window.LearnyAccount`) | `js/23-cuenta.js` |
| Clase en la nube: informes de alumnos y mazos recibidos en tu cuenta (expone `window.LearnyClassCloud`) | `js/24-clase-nube.js` |
| Módulos de Firebase (SDK 10.14.1 desde la CDN de Google; exponen `window.LearnyCloud`) | `js/firebase/` (`firebase-config.js` tiene `CLOUD_ENABLED = false`) |
| Reglas e índices de Firestore (pruebas escritas, **aún sin ejecutar**: ver «Probar las reglas») | `firebase/firestore.rules`, `firebase/firestore.indexes.json` |
| Configuración de la CLI de Firebase | `firebase.json` (las rutas son relativas a esta carpeta) |
| Pruebas de la cuenta y de la clase en la nube (25) | `tests/cuenta-perfil.spec.js`, `tests/clase-nube.spec.js` |
| Pruebas de las reglas contra el emulador de Firestore (13 pruebas) | `tests/reglas-emulador.js`, `package.json` |
| Cambios hechos en el resto de la app | `restaurar-nube.patch` |

## Qué cambió en la app
- `index.html`: se quitaron los tres `<script>` de la nube (`23-cuenta.js`, `24-clase-nube.js` y el módulo `firebase-teaching.js`) y el comentario de la CSP apunta aquí.
- `sw.js`: se quitaron de `CORE` los siete archivos. `CACHE` quedó en `learny-v109` y luego pasó a `learny-v110` (el parche no toca esa línea).
- `tests/bloque-3.spec.js`: la prueba «cuentas y nube congeladas» ahora comprueba que `LearnyCloud`, `LearnyAccount` y `LearnyClassCloud` no existen.
- Dos comentarios (`js/02-datos.js`, `js/12b-profesor.js`) con la ruta nueva.
- Sin cambios: `js/20-pro.js` ya usaba `window.LearnyCloud || {}` y `window.LearnyAccount?.`, y `isPro()` devuelve siempre `true`; por eso la app no necesita la nube. El botón «Entrar» y la sección Pro ya estaban `hidden` en el HTML.

`node tests/run-node-nube.js` vigila todo esto (y se apaga solo cuando restauras la nube).

## Probar las reglas
Se prueban **aquí, en `nube/`, antes de restaurar nada** (el script lee `firebase/firestore.rules` de al lado). Necesitas Node, **Java 21 o más nuevo** y conexión (la primera vez se descarga el emulador, unos 60 MB).

```
cd nube
npm install --save-dev firebase-tools @firebase/rules-unit-testing firebase
npm run test:reglas
```

Qué comprueba (con los mismos datos que envía el código real): cada persona solo lee y escribe lo suyo; nadie puede crearse un perfil Pro ni cambiar `plan`, `proStatus`, `email` o `createdAt`; el nombre admite de 0 a 40 caracteres; los informes y mazos respetan sus formas y límites (en el límite pasa, uno más falla); el borrado del perfil y todas las demás rutas están cerradas. Mezcla casos que deben pasar con otros que deben fallar a propósito.

Si algo falla, el mensaje dice qué línea de la prueba; pásamelo con el nombre de la prueba. Si todo pasa, anota en `ESTADO.md` que las reglas se probaron y la fecha. `node_modules/` ya está en `.gitignore`.

## Cómo volver a activarla
Desde la raíz del repositorio:

```
git apply -R nube/restaurar-nube.patch
git mv nube/js/23-cuenta.js js/23-cuenta.js
git mv nube/js/24-clase-nube.js js/24-clase-nube.js
git mv nube/js/firebase js/firebase
git mv nube/firebase firebase
git mv nube/firebase.json firebase.json
git mv nube/tests/cuenta-perfil.spec.js nube/tests/clase-nube.spec.js tests/
```

Después (puedes borrar la carpeta `nube/` cuando termines; si la dejas, quedan en ella este README, el parche y carpetas vacías), a mano:
1. **`js/firebase/firebase-config.js`:** pon `CLOUD_ENABLED = true`.
2. **Amplía la CSP en `index.html`** (la actual no permite Firebase; esta lista sale de cómo funciona el SDK y **no se ha probado**):
   - `script-src`: añade `https://www.gstatic.com` (el SDK se importa de ahí) y, si el acceso usa ventana emergente o redirección de Google, `https://apis.google.com`.
   - `frame-src`: cambia `'none'` por `https://*.firebaseapp.com`.
   - `connect-src` ya admite `https:`.
3. **Pruebas:** en `tests/run-node-csp.js` la política deja de ser «solo `'self'`» en `script-src`: ajusta esa comprobación a lo que añadiste. Quita `tests/run-node-nube.js` de `verificar.sh` (se apaga solo, pero sobra) y vuelve a poner `tests/cuenta-perfil.spec.js` en la lista de repeticiones de `verificar.sh`.
4. **`sw.js`:** sube `CACHE` (ahora está en `learny-v111`; el parche no toca esa línea), y `npm test`. Confirma `cuenta-perfil` con `npx playwright test tests/cuenta-perfil.spec.js --repeat-each=20`: es una de las dos pruebas que eran intermitentes y su corrección nunca se vio pasar.
5. **Firebase:** las reglas (`nube/firebase/firestore.rules`, o `firebase/` ya restaurada) **hay que probarlas con el emulador antes de publicarlas** (sección «Probar las reglas»; hazlo antes de mover nada, porque `tests/reglas-emulador.js` busca `firebase/` junto a `nube/`). Los pasos de la consola están en «Publicar las reglas de Firestore» del `README.md` de la raíz. Si usas la CLI: `firebase deploy --only firestore:rules` desde la carpeta donde esté `firebase.json`.

Si `git apply -R` falla porque `index.html`, `sw.js` o `tests/bloque-3.spec.js` cambiaron después, usa `git apply -R --reject nube/restaurar-nube.patch` y resuelve a mano los `.rej` (son solo los tres `<script>`, la lista de `CORE` y una línea de prueba); bórralos al terminar.

## Si vas a restaurar también el inglés
Restaura **primero el inglés** (`idioma-ingles/README.md`) y **después** la nube. El parche del inglés apunta ahora a `nube/js/23-cuenta.js`, `nube/tests/cuenta-perfil.spec.js` y `nube/tests/clase-nube.spec.js`; si ya moviste la nube de vuelta a `js/` y `tests/`, cambia esas tres rutas en `idioma-ingles/restaurar-ingles.patch` antes de aplicarlo.
