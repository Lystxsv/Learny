# Gato oscuro · Bloque 1 (aspecto) — parche para Learny

Archivo nuevo: `js/16-lumi-gato.js` (ya está en el proyecto como `16-lumi-gato.js`). Cambios en los demás archivos:

## 1. `js/01-base.js`
Buscar:
`const MASCOT_AVATARS = ['bee', 'eevee', 'walle', 'daniel'];`
Poner:
`const MASCOT_AVATARS = ['bee', 'eevee', 'walle', 'daniel', 'gato'];`

## 2. `js/16-lumi.js`
a) En la línea de cabecera «Apariencias: …» añadir: `, 'gato' (arte en 16-lumi-gato.js)` después de `'daniel' (arte en 16-lumi-daniel.js)`.
b) En `const ART = { … }` añadir al final, tras la entrada `daniel`:
`, gato: ['Gato oscuro', typeof lumiGatoSvg === 'function' ? () => lumiGatoSvg() : null]`

## 3. `index.html`
Después de `<script src="js/16-lumi-daniel.js" defer></script>` (y antes de `16-lumi.js`) añadir:
`<script src="js/16-lumi-gato.js" defer></script>`

## 4. `sw.js`
- `const CACHE = 'learny-v47';` → `'learny-v48'`
- En `CORE`, tras `'./js/16-lumi-daniel.js',` añadir `'./js/16-lumi-gato.js',`

## 5. `style.css` (añadir al final)
```css
/* ===== Lumi · avatar Gato oscuro (bloque 1) =====
   Quinta apariencia, elegible en Ajustes → Apariencia de Lumi (settings.mascotAvatar = 'gato'). El arte es el SVG de js/16-lumi-gato.js (pixel art propio, 48×56 celdas en una rejilla 64×64).
   Pelaje casi negro: para que la silueta no se pierda sobre los temas oscuros lleva un contorno de 1 celda (--gt-rim) gris azulado; en Claro no hace falta, en Alto contraste es blanco.
   Caja propia: 96 px (1,5 px por celda) en escritorio, 64 px (1 px por celda) en móvil y 48 px en sesión de enfoque. Sus poses (Bloque 2) irán en un bloque aparte. */
.lumi .lumi-svg--gato { display: none; }
.lumi[data-avatar="gato"] .lumi-svg--gato { display: block; }
.lumi[data-avatar="gato"] .lumi-svg--bee { display: none; }
.lumi { --gt-ink: #0c0c10; --gt-gy: #8c8c8c; --gt-wh: #ffffff; --gt-rim: #50556e; }
.theme-light .lumi { --gt-rim: transparent; }
.theme-chrome .lumi { --gt-rim: #6a6a6a; }
.theme-contrast .lumi { --gt-rim: #fff; }
.g-rim { fill: var(--gt-rim); } .g-ink { fill: var(--gt-ink); } .g-gy { fill: var(--gt-gy); } .g-wh { fill: var(--gt-wh); }
.lumi[data-avatar="gato"] { --lumi-size: 96px; }
@media (max-width: 820px) { .lumi[data-avatar="gato"] { --lumi-size: 64px; } }
body.session-study .lumi[data-avatar="gato"] { --lumi-size: 48px; }
.lumi-svg--gato { transform-origin: 50% 90%; }
.lumi[data-pose="focus"] .lumi-svg--gato, .lumi[data-pose="focus"] .lumi-svg--gato * { animation: none !important; } /* enfoque: pose estática */
body .lumi.lumi-thumb[data-avatar="gato"] { --lumi-size: 64px; }
```

## 6. `CONTINUIDAD.md` y `README.md`
Añadir `js/16-lumi-gato.js` a la lista de archivos, «v48» en la versión del service worker y «Gato oscuro» a la lista de apariencias de Lumi (arte original; Bloque 2 de animaciones pendiente).
