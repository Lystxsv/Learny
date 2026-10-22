/* Learny · parte 16 (arte) · Lumi con la apariencia «Daniel Carreon»
   Dibujo SVG del personaje en pixel art (56×74 celdas, colocadas en una rejilla 76×76), a partir de la imagen aportada.
   Autorización: el responsable del proyecto indica contar con el permiso del artista del pixel art para usar esta imagen (ver CONTINUIDAD.md).
   Solo contiene el arte: el controlador es LumiCompanion (16-lumi.js), que decide estados, mensajes y reglas. Se carga con <script defer> ANTES de 16-lumi.js
   (init() se ejecuta al final de 16-lumi.js y necesita encontrar lumiDanielSvg). Sin librerías, sin recursos externos, sin degradados y SIN id (hay varias copias: dock y miniaturas).
   Letras del mapa → clase .d-* (variables --dn-* en style.css):
   k contorno casi negro · h pelo oscuro · H pelo · s piel · S piel en sombra · g verde (camiseta) · G verde oscuro · u azul (pantalón) · U azul oscuro · q gris (zapatillas) · w blanco (zapatillas).
   Grupos para las poses (Bloque 2, solo CSS): .daniel-head (pelo y cara), .daniel-eyes (ojos, dentro de la cara), .daniel-arm-l, .daniel-arm-r y .daniel-body (torso, piernas y zapatillas);
   .daniel-rim es un contorno de 1 celda que solo se ve en alto contraste. */
'use strict';

const DANIEL_MAP = Object.freeze([
  '.......................k................................',
  '......................kkk...............................',
  '......................khk..kkkkk........................',
  '....................HkhhHk.kkhHHkk......................',
  '...................HhhhhHkhkkhHHhhHH....................',
  '...................khhhhHhkkkhHHHHkkk...................',
  '................kkkhhhhhHHkkhhHHHHHHHk..................',
  '.............kkkhhhhhhhHHHHHHHHHHHHHHHkkk...............',
  '...........kkhhhhhhhHHHHHHHHHHHHHHHHHHHHHkk.............',
  '..........kkkhhhhhhHHHHHHHHHHHHHHHHHHHHHHkk.............',
  '.........kkhhhhhhHHHHHHHHHHHHHHHHHHHHHHHHHHkk...........',
  '........khhhhhhhHHHHHHHHHHHHHHHHHHHHHHHHHHHHkk..........',
  '.......khhhhhhhHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHk.........',
  '......khhhhhhhHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHk........',
  '......khhhhhhHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHk........',
  '.....khhhhhhHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHkk......',
  '....khhhhhhHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHk......',
  '...khhhhhhhHHHHHHHHHHHHHHhkkkkkkkkkkkHHHHHHHHHHHHHk.....',
  '..kkhhhhhhHHHHHHHHHHhkkkkhSSSSSSSSSSSkkkkkhHHHHHHHHk....',
  '..kkhhhhhhHHHHHHHHHHhkkkkSSSSSSSSSSSSkkkkkhHHHHHHHHk....',
  '..khhhhhhHHHHHHHHkkkHSSSSSSssssssssssssssSkkkHHHHHHhk...',
  '.khhhhhhhHHHHhkkkSSSssssssssssssssssssssssssskkkkHHHk...',
  '.khhhhhhhhhHkkSSSsssssssssssssssssssssssssssssssSkHHHk..',
  '.khhhhhhhhhkSSSssssssssssssssssssssssssssssssssssskHHkk.',
  '.khhhhhhhhhkSSSssssssssssssssssssssssssssssssssssskhHkk.',
  'khhhhhhhhkkSSSsssssssssssssssssssssssssssssssssssssSkHk.',
  'khhhhhhhkSSSSsssssssssssssssssssssssssssssssssssssssskk.',
  'khhhhhhkkSSSssssssssssssssssssssssssssssssssskkksssssSk.',
  'khhhhhhkSSSssssssssssssskkkkHssssssssssssssskkkkksssssk.',
  'khhhhhhkSSSssssssssssssskkkkkssssssssssssssskkkkksssssk.',
  'khhhhhkSSSSssssssssssssskkkkkssssssssssssssskkkkkkssssSk',
  'khhhhhkHSSSssssssssssssskkkkkksssssssssssssskkkkkksssssk',
  '.khhhhkHSSSssssssssssssskkkkkksssskssskssskskkkkkksssssk',
  '.khhhhkHSSSssssssssssssskkkkkkssssksskskkkksskkkkksssssk',
  '.khhhhkSSSSssssssssssssskkkkkksssskkkksskhssskkkkssssssk',
  '..khhhhkSSSssssssssssssssHkkksssssssssssssssssssssssssk.',
  '..kkhhhkkSSssssssssssssssskkksssssssssssssssssssssssssk.',
  '...kkhhhkSSSsssssssssssssssssssssssssssssssssssssssssSk.',
  '....kkkhhkSSSsssssssssssssssssssssssssssssssssssssssSk..',
  '....kkkhhkSSSsssssssssssssssssssssssssssssssssssssssSk..',
  '.....kShkkSSSSsssssssssssssssssssssssssssssssssssssSkk..',
  '......kHSSSSSSSsssssssssssssssssssssssssssssssssssSk....',
  '.......HkSSSSSSSssssssssssssssssssssssssssssssssSkk.....',
  '.........kkSSSSSSSSssssssssssssssssssssssssssSSkk.......',
  '...........kkkSSSSSSSSsssssssssssssssssssssSkkk.........',
  '.............kkkkkSSSSSSSSSSSSSSSSSSSSSSkkkkk...........',
  '..............kkGGkkkkkkkkkkkkkkkkkkkkkkGGkgkk..........',
  '.............kkGGGGGGkGGkkkSSSSSSSSSSkkggkgggGk.........',
  '............kkGGGgggggkkggkkkksssssHkkggkgggggGk........',
  '............kGGGggggggggGggggGkSsskGgggkgggggggGk.......',
  '...........kGGGgggggggggkkGgggGksskggGkgggggGkgGk.......',
  '...........kGGggggggggggggkkkggkSskggkgggggggkggkk......',
  '..........kGGGgggggggGgggggggggGkSkggggggggggkGkgGk.....',
  '..........kkGgggggggGkggggggggggkkgggggggggggkkgkkk.....',
  '..........kGkkkGggggGkgggggggggggkgggggggggggGkkkskk....',
  '.........kkGGggkkkkkkkggggggggggggggggggggggggkSssSk....',
  '.........kkkkkggggggGkggggggggggggggggggggggggkSsssk....',
  '.........kSSsskkkkkkkkggggggggggggggggggggggggGkSssk....',
  '.........kSSsssssssSkGgggggggggggggggggggggggggkSskk....',
  '.........kSSsssssssSkGgggggggggggggggggggggggggkSkk.....',
  '..........kSssssssSkGggggggggggggggggggggggggggGkk......',
  '..........kkSssssSkkGggggggggggggggggggggggggggGk.......',
  '...........kkSSSSkkGggggggggggggggggggggggggGkkkk.......',
  '............kkkkkkGgggggggggggggggggggggGkkkkkuUk.......',
  '............kkGGGGgggggggggggggggGGkkkkkkkUuuuUUk.......',
  '............kUkkkkkkkkkkkkkkkkkkkkkkUuuuuuuuuuuUk.......',
  '............kUUUUUUuuuuuuuuuuuuuuuuuuuuuuuuuuuuUk.......',
  '...........kkUUUUUuuuuuuuuuuuuUkUuuuuuuuuuUUUkqkq.......',
  '............kkkkkkUuuuuuuuuuuukkUuuuukkkkkkwwwwk........',
  '............kqqqwqkkkkkkkkkkkkkkkkkkkkqwwwwwwwqk........',
  '............kqwwwwwwwwwwwwwqk...kqqwwwwwwwwwkkkk........',
  '............kkkqwwwwwwwwwwwkk...kkkkkkkkkkkkkkk.........',
  '.............kkkkkkkkkkkkkkk.....kkkkkkkkkkk............',
  '..............kkkkkkkkkkkkk.............................'
]);
const DANIEL_CELL = Object.freeze({ k: 'ink', h: 'hd', H: 'hl', s: 'sk', S: 'ss', g: 'gr', G: 'gd', u: 'bl', U: 'bd', q: 'gy', w: 'wh' });
function lumiDanielSvg() {
  const N = 76, OX = 10, OY = 1; // posición del sprite en la rejilla (margen lateral para los movimientos del Bloque 2)
  const H = DANIEL_MAP.length, W = DANIEL_MAP[0].length;
  const inEye = (x, y) => y >= 27 && y <= 37 && ((x >= 23 && x <= 30) || (x >= 42 && x <= 50));
  const groupOf = (x, y, ch) => (y <= 46 ? (ch === 'k' && inEye(x, y) ? 'eyes' : 'head') : y >= 52 && y <= 62 && x <= 19 ? 'armL' : y >= 49 && y <= 60 && x >= 45 ? 'armR' : 'body');
  const L = { body: {}, head: {}, eyes: {}, armL: {}, armR: {} }, rect = (x, y, w) => `<rect x="${x + OX}" y="${y + OY}" width="${w}" height="1"/>`;
  DANIEL_MAP.forEach((row, y) => {
    for (let x = 0; x < W;) { // tramos horizontales del mismo color y grupo → un rect
      const ch = row[x], cls = DANIEL_CELL[ch]; if (!cls) { x++; continue; }
      const g = groupOf(x, y, ch); let w = 1;
      while (x + w < W && row[x + w] === ch && groupOf(x + w, y, ch) === g) w++;
      (L[g][cls] ||= []).push(rect(x, y, w)); x += w;
    }
  });
  const solid = (x, y) => !!DANIEL_CELL[DANIEL_MAP[y]?.[x]], rim = [];
  for (let y = -1; y <= H; y++) {
    for (let x = -1; x <= W;) { // contorno exterior de 1 celda: celdas vacías pegadas al sprite
      if (solid(x, y) || !(solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) { x++; continue; }
      let w = 1; while (x + w <= W && !solid(x + w, y) && (solid(x + w - 1, y) || solid(x + w + 1, y) || solid(x + w, y - 1) || solid(x + w, y + 1))) w++;
      rim.push(rect(x, y, w)); x += w;
    }
  }
  const emit = (g) => Object.entries(g).map(([c, r]) => `<g class="d-${c}">${r.join('')}</g>`).join('');
  return `<svg class="lumi-svg lumi-svg--daniel" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">`
    + `<g class="daniel-rim d-rim">${rim.join('')}</g><g class="daniel-body">${emit(L.body)}</g>`
    + `<g class="daniel-arm daniel-arm-l">${emit(L.armL)}</g><g class="daniel-arm daniel-arm-r">${emit(L.armR)}</g>`
    + `<g class="daniel-head">${emit(L.head)}<g class="daniel-eyes">${emit(L.eyes)}</g></g></svg>`;
}
