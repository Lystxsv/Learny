/* Learny · parte 16 (arte) · Lumi con la apariencia «WALL·E»
   Dibujo SVG propio del personaje, trazado en pixel art a partir de la imagen de referencia aportada (36×36 celdas, en una rejilla 40×40: misma caja que la abeja).
   Solo contiene el arte: el controlador es LumiCompanion (16-lumi.js), que decide estados, mensajes y reglas. Se carga con <script defer> ANTES de 16-lumi.js
   (init() se ejecuta al final de 16-lumi.js y necesita encontrar lumiWalleSvg). Sin librerías, sin recursos externos, sin degradados y SIN id (hay varias copias: Inicio y miniaturas).
   Alcance de uso: personaje de terceros. NO está en el precaché de sw.js hasta confirmar la autorización (ver CONTINUIDAD.md). No se añaden logos ni se sugiere una colaboración oficial.
   Letras del mapa → clase .w-* (variables --wl-* en style.css):
   k tinta casi negra · d gris oscuro · m gris medio · l gris claro · t beige gris · y amarillo del cuerpo · b contorno marrón · w blanco (interior del detalle bajo el ojo izquierdo).
   Grupos para las poses (solo CSS, bloque posterior): .walle-head (ojos y cuello), .walle-arm-l, .walle-arm-r y .walle-body (cuerpo y orugas); .walle-rim es un contorno de 1 celda que solo se ve en alto contraste. */
'use strict';

const WALLE_MAP = Object.freeze([
  '................dddd.dddd...........',
  '...........mmdddllldmdlllddd........',
  '........mmmddlkkklldtdllkkkldd......',
  '......mmttdllkkttkldtdlkkttklld.....',
  '....mmmttdlllkkkmkldtdlkkkmkllld....',
  '...mttmttdlllkkkmkldtdlkkkmkllld....',
  '...mttmttdlllkkmkkldtdlkkmkkllld....',
  '...mttmttdllllkkkldtttdlkkklllld....',
  '...mttmtttdllllllddttttdlllllld.....',
  '....mmmmtttdlllddyybttttddllld......',
  '........mmmmdddbyyyybmmmmmddd.......',
  '.........mwwwm.byyyyb...............',
  '..........mmm...byyyyb..............',
  '................byyyyb..............',
  '...............bbbbbbb..............',
  '..............byyyyyb...............',
  '......bbbbbbbbbbbbbbbbbbbbbb........',
  '.....byyyyyyktttktttttttkttb........',
  '....bbbbttttklltklllkkkkktlbb.......',
  '...byytldddtklltktttkyykktlbldd.....',
  '...bytllllldklltktttkkykktlbllld....',
  '...bbblldddddddtklllkkkkktlbddddddd.',
  '....kykkdlldlldmmmmmmmmmmmmbdlldlld.',
  '...kkkkkdlldlldyyyyytyyyyyybdlldlld.',
  '..kkkmmmmdlldlldyyyytyyyyyybmdlldlld',
  '..kddkddddlldlldyyyytyyyyyybddlldlld',
  '..kddkmmmdlldlldyyyytyyyyyybmdlldlld',
  '.kkkkkkddddddddyyyyytyyyyyybddkdddd.',
  '.kkkddkmmmmkbyyyyykykykybbybmmmk....',
  '.kkkddkkdddkbtyyyykykykybbtbdddk....',
  'kddkkkkkmmmmkttttttttttttttbmmmmk...',
  'kdddkkddkdddkbbbbbbbbbbbbbbbkdddk...',
  'kdddkkddkmmmmk......kdddkkddkmmmmk..',
  'kdddkkddkddddk......kdddkkddkddddk..',
  'kddkkkkkmmmmmd......kddkkkkkmmmmmk..',
  '.kkkkkkkkkkkk........kkkkkkkkkkkk...'
]);
const WALLE_CELL = Object.freeze({ k: 'ink', d: 'dark', m: 'mid', l: 'light', t: 'tan', y: 'gold', b: 'line', w: 'white' });
function lumiWalleSvg() {
  const N = 40, OX = 2, OY = 2; // posición del sprite en la rejilla (margen para el movimiento de cabeza y brazos)
  const H = WALLE_MAP.length, W = WALLE_MAP[0].length;
  const groupOf = (x, y) => (y <= 15 ? 'head' : (y >= 16 && y <= 21 && x <= 11) || (y >= 22 && y <= 27 && x >= 8 && x <= 14) ? 'armL' : y >= 18 && y <= 27 && x >= 28 && !(y >= 24 && x <= 29) ? 'armR' : 'body');
  const L = { body: {}, head: {}, armL: {}, armR: {} }, rect = (x, y, w) => `<rect x="${x + OX}" y="${y + OY}" width="${w}" height="1"/>`;
  WALLE_MAP.forEach((row, y) => {
    for (let x = 0; x < W;) { // tramos horizontales del mismo color y grupo → un rect
      const ch = row[x], cls = WALLE_CELL[ch]; if (!cls) { x++; continue; }
      const g = groupOf(x, y); let w = 1;
      while (x + w < W && row[x + w] === ch && groupOf(x + w, y) === g) w++;
      (L[g][cls] ||= []).push(rect(x, y, w)); x += w;
    }
  });
  const solid = (x, y) => !!WALLE_CELL[WALLE_MAP[y]?.[x]], rim = [];
  for (let y = -1; y <= H; y++) {
    for (let x = -1; x <= W;) { // contorno exterior de 1 celda: celdas vacías pegadas al sprite
      if (solid(x, y) || !(solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) { x++; continue; }
      let w = 1; while (x + w <= W && !solid(x + w, y) && (solid(x + w - 1, y) || solid(x + w + 1, y) || solid(x + w, y - 1) || solid(x + w, y + 1))) w++;
      rim.push(rect(x, y, w)); x += w;
    }
  }
  const emit = (g) => Object.entries(g).map(([c, r]) => `<g class="w-${c}">${r.join('')}</g>`).join('');
  return `<svg class="lumi-svg lumi-svg--walle" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">`
    + `<g class="walle-rim w-rim">${rim.join('')}</g><g class="walle-body">${emit(L.body)}</g>`
    + `<g class="walle-arm walle-arm-l">${emit(L.armL)}</g><g class="walle-arm walle-arm-r">${emit(L.armR)}</g><g class="walle-head">${emit(L.head)}</g></svg>`;
}
