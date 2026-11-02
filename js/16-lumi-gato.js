/* Learny · parte 16 (arte) · Lumi con la apariencia «Cat Black»
   Dibujo SVG propio del personaje (un gato negro de ojos blancos) en pixel art: 50×58 celdas, colocadas en una rejilla 64×64 (celdas de 8 px en la imagen de referencia; se copió celda a celda, 5 colores exactos).
   Solo contiene el arte: el controlador es LumiCompanion (16-lumi.js), que decide estados, mensajes y reglas. Se carga con <script defer> ANTES de 16-lumi.js
   (init() se ejecuta al final de 16-lumi.js y necesita encontrar lumiGatoSvg). Sin librerías, sin recursos externos, sin degradados y SIN id (hay varias copias: dock y miniaturas).
   Letras del mapa → clase .g-* (variables --gt-* en style.css):
   k pelaje casi negro · w blanco (ojos) · g gris (interior de la oreja y marcas de las patas) · r contorno gris azulado de 1 celda (forma parte del dibujo; en el tema Claro es transparente, en Alto contraste blanco).
   Grupos para las poses (Bloque 2, solo CSS; el contorno r acompaña a la parte a la que pertenece): .gato-eyes (aros blancos y pupilas: se comprimen juntos al parpadear), .gato-ear-r (oreja derecha, con su interior gris),
   .gato-tail (cola: el bucle de abajo a la derecha) y .gato-body (el resto: cabeza, cuerpo, patas y marcas, más pelaje oscuro bajo los ojos para que el parpadeo no deje ver el fondo). */
'use strict';

const GATO_MAP = Object.freeze([
  '...............rrrrr..............................',
  '.............rrkkkkkr.............................',
  '............rkkkkkkkkr............................',
  '...........rrkkkkkkkkr............................',
  '..........rkkkkkkkkkkkrr..........................',
  '.........rkkkkkkkkkkkkkkr.........................',
  '........rrkkkkkkkkkkkkkkrrr.......................',
  '.......rkkkkkkkkkkkkkkkkkkkrr.....................',
  '......rkkkkkkkkkkkkkkkkkkkkkkrr...................',
  '.....rkkkkkkkkkkkkkkkkkkkkkkkkkr..................',
  '.....rkkkkkkkkkkkkkkkkkkkkkkkkkrrrrrrrr...........',
  '....rkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkrrrr.......',
  '...rkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkrr.....',
  '...rkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkr....',
  '..rkkwwwwwwwkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkr....',
  '..rkwwwwwwwwwkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkr...',
  '..rkwwwkkkkwwwkkkkkkkwwwwwwwwkkkkkkkkkkkkkkkkkr...',
  '.rrkwwwkkkkwwwkkkkkkwwwwwwwwwwkkkkkkkkkkkkggkkr...',
  'rkkwwwkkkkkkwwkkkkkwwwwwwwwwwwwwkkkkkkkggggkkkr...',
  'rkkwkkkkkkkkwwkkkkwwwwkkkkkkwwwwkkkkgggggggkrr....',
  'rkkwkkkkkkkkwwkkkkwwwwkkkkkkwwwwkkkkggggggkkkr....',
  'rkkwkkkkkkkkwwkkkwwwwkkkkkkkkwwwwkkkkgggggkkr.....',
  'rkkwkkkkkkkkwwkkkwwwwkkkkkkkkkkwwkkkkgggkkkr......',
  'rkkwkkkkkkkkwwkkkwwwkkkkkkkkkkkwwkkkkggkkkr.......',
  'rkkwkkkkkkkkwwkkkwwkkkkkkkkkkkkwwkkkkggkkkr.......',
  'rkkwwwkkkkkwwwkkkwwkkkkkkkkkkkkwwkkkggkkrr........',
  'rkkwwwwkkkwwwwkkkwwkkkkkkkkkkkkwwkkkkkkr..........',
  'rkkwwwwkkkwwwwkkkwwwkkkkkkkkkkwwwkkkkkkr..........',
  '.rrkwwwwwwwwwkkkkwwwwkkkkkkkkwwwwkkkkkr...........',
  '..rkkwwwwwwkkkkkkwwwwwkkkkkkwwwwkkkrrr............',
  '...rkkkkkkkkkkkkkkwwwwwwwwwwwwwwkkkr..............',
  '...rkkkkkkkkkkkkkkwwwwwwwwwwwwwwkkkr..............',
  '....rkkkkkkkkkkkkkkwwwwwwwwwwwwkkkkkrrrrrr........',
  '.....rrrkkkkkkkkkkkkkwwwwwwwkkkkkkkkkkkkkkr.......',
  '.......rkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkrr.....',
  '........rrkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkr....',
  '..........rrkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkr.r.',
  '...........rkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkrkr',
  '............rkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkrkr',
  '...........rkkkkkkkkkkkkkkkkkkkkkkkkrrrrrkkkkkkkkr',
  '..........rkkkkkkgkkkkkkkkkkkkkkkkkkr....rkkkkkkkr',
  '.........rkkkkkkkgkkkkkkkkkkkkkkkkkkr....rkkkkkkkr',
  '........rrkkkkkkkgkkkkkkkkkkkkkkkkkr......rkkkkkkr',
  '.......rkkkkkkkkkgkkkkggkkkkkkkkkrr.......rkkkkkkr',
  '.......rkkkkkkkggkkkkkggkkkkkkkkr.........rkkkkkkr',
  '.......rkkkkkkkggkkkkkggkkkkkkkkr.........rkkkkkkr',
  '........rrrkkkrkkkkkkgkkkkkkkkrr........rrkkkkkkkr',
  '...........rrrrkkkkkkgkkrrrrrr.........rkkkkkkkkkr',
  '..............rkkkkkkkkkr............rrkkkkkkkkkkr',
  '...............rrkkkkkrrrrrrrrrrrrrrrkkkkkkkkkkrr.',
  '.................rrrrrrkkkkkkkkkkkkkkkkkkkkkkkr...',
  '....................rkkkkkkkkkkkkkkkkkkkkkkkkr....',
  '....................rkkkkkkkkkkkkkkkkkkkkkkkkr....',
  '....................rkkkkkkkkkkkkkkkkkkkkkkrr.....',
  '.....................rkkkkkkkkkkkkkkkkkrrrr.......',
  '.....................rkkkkkkkkkkkkkkkkkr..........',
  '......................rrkkkkkkkkkkkrrrr...........',
  '........................rrrrrrrrrrr...............'
]);
const GATO_CELL = Object.freeze({ r: 'rim', k: 'ink', g: 'gy', w: 'wh' });
let GATO_PUPILS = null; // pupilas: los componentes de pelaje (k) encerrados por el aro blanco, distintos del cuerpo (que es el mayor); se calcula una vez
function gatoPupils() {
  if (GATO_PUPILS) return GATO_PUPILS;
  const H = GATO_MAP.length, W = GATO_MAP[0].length, seen = new Set(), comps = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (GATO_MAP[y][x] !== 'k' || seen.has(y * W + x)) continue;
    const st = [[x, y]], c = []; seen.add(y * W + x);
    while (st.length) {
      const [a, b] = st.pop(); c.push(b * W + a);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = a + dx, ny = b + dy; if (nx >= 0 && ny >= 0 && nx < W && ny < H && GATO_MAP[ny][nx] === 'k' && !seen.has(ny * W + nx)) { seen.add(ny * W + nx); st.push([nx, ny]); } });
    }
    comps.push(c);
  }
  comps.sort((p, q) => q.length - p.length);
  GATO_PUPILS = new Set(comps.slice(1).filter((c) => c.length >= 50).flat()); // el hueco de pelaje de 20 celdas junto al contorno izquierdo no es una pupila
  return GATO_PUPILS;
}
function lumiGatoSvg() {
  const N = 64, OX = 7, OY = 3; // posición del sprite en la rejilla (la misma que en la imagen de referencia)
  const W = GATO_MAP[0].length, pupils = gatoPupils();
  const groupOf = (x, y, ch) => (ch === 'w' || pupils.has(y * W + x) ? 'eyes' : (x >= 41 && y >= 37) || (y >= 49 && x >= 22) ? 'tail' : x >= 34 && y >= 10 && y <= 27 ? 'earR' : 'body');
  const L = { body: {}, earR: {}, tail: {}, eyes: {} };
  GATO_MAP.forEach((row, y) => {
    for (let x = 0; x < W;) { // tramos horizontales del mismo color y grupo → un rect
      const ch = row[x], cls = GATO_CELL[ch]; if (!cls) { x++; continue; }
      const g = groupOf(x, y, ch); let w = 1;
      while (x + w < W && row[x + w] === ch && groupOf(x + w, y, ch) === g) w++;
      const r = `<rect x="${x + OX}" y="${y + OY}" width="${w}" height="1"/>`;
      (L[g][cls] ||= []).push(r); if (g === 'eyes') (L.body.ink ||= []).push(r); // pelaje bajo los ojos: al parpadear no asoma el fondo (en reposo queda tapado por los ojos)
      x += w;
    }
  });
  const emit = (g) => Object.entries(g).map(([c, r]) => `<g class="g-${c}">${r.join('')}</g>`).join('');
  return `<svg class="lumi-svg lumi-svg--gato" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">`
    + `<g class="gato-body">${emit(L.body)}</g><g class="gato-tail">${emit(L.tail)}</g><g class="gato-ear-r">${emit(L.earR)}</g><g class="gato-eyes">${emit(L.eyes)}</g></svg>`;
}
