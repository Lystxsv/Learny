/* Learny · parte 16 (arte) · Lumi con la apariencia «Alisa Kujou»
   Dibujo SVG en pixel art (62×96 celdas, colocadas en una rejilla 100×100), trazado de la imagen aportada por el responsable del proyecto
   (una chica chibi de pelo plateado con ahoge, lazo rojo, ojos azules y uniforme escolar). Se muestreó en celdas de ≈10,3 px de la imagen original, con una paleta de 18 colores;
   se omitieron el fondo y la sombra proyectada (transparentes). Es una aproximación: la fuente no es pixel art de rejilla exacta (celdas de ≈4,3 px), así que parte del detalle fino del pelo y de los ojos se simplificó.
   Solo contiene el arte: el controlador es LumiCompanion (16-lumi.js), que decide estados, mensajes y reglas. Se carga con <script defer> ANTES de 16-lumi.js
   (init() se ejecuta al final de 16-lumi.js y necesita encontrar lumiAlisaSvg). Sin librerías, sin recursos externos, sin degradados y SIN id (hay varias copias: dock y miniaturas).
   Letras del mapa → clase .al-* (variables --al-* en style.css):
   k tinta (contorno) · n tinta 2 · R rojo oscuro (lazo) · r rojo (lazo) · p rojo claro (lazo) · d gris oscuro (medias, sombra) · g gris (falda y chaleco) · s pelo muy sombreado · m pelo sombreado · h pelo medio · c pelo claro 2 · H pelo
   l pelo claro · e azul (ojos) · E azul claro (ojos) · b rubor · f piel · w blanco.
   Grupos para las poses (solo CSS): .alisa-ahoge (el mechón de arriba), .alisa-ribbon (lazo rojo), .alisa-head (pelo y cara hasta la barbilla) con .alisa-eyes (ojos y pestañas) encima, .alisa-arm-r (brazo extendido) y .alisa-body (el resto: pelo largo, torso, falda y piernas);
   .alisa-rim es un contorno de 1 celda que solo se ve en alto contraste. */
'use strict';

const ALISA_MAP = Object.freeze([
  '..........................nkknhhn.............................',
  '........................kkllghhlllk...........................',
  '.......................nlll...kllllk..........................',
  '......................klll.....nlllk..........................',
  '.....................nlllk......kllk..........................',
  '....................nllll.......kllk..........................',
  '....................kllln.......nlk...........................',
  '....................kllln.......nk............................',
  '.....................klln.....................................',
  '......................kllk....................................',
  '.......................llk....nkkkn...........................',
  '.......................nnlnnnwwcccwwk.........................',
  '......................kwwcchcccccccHHwkk......................',
  '....................kwcccccHHcccccHHwHHwsn....................',
  '...................nwHccccchHHHhhhHHHHHHwhcn..................',
  '.................kwHwHcchsHshwHHHHggHHHHHHwck.................',
  '................kwccHHhhHHHHsHgHwHHHHHHHHHwwckk...............',
  '...............kwHHHHHslHHHHgHHHHHHHHhHHHHwHwckk..............',
  '...............wHHHHHgHHHHHHHHHHHHHHHHhHHwwwwgHkk.............',
  '..............kHHHHHsHHHHHHHHHHHHHHHHHwhHHwwwHHHw.............',
  '.............kwHwHHHgHHHHHHHHHwHHHHHwHwhHwHwHwHllk............',
  '.............wHHwHHHHHHHHHHHHHwHHHHHHHHwhHHHHHllllk...........',
  '............nwHwwHHHHHHwHHHHHHwwHHHwwwHHhhHHllllllk...........',
  '............kwHwwwHsHHHwHHHHwHwwHwHwwwHHHhlllllllllk..........',
  '...........nwHHwwHHwwwwwHHHwwHlHHHHHHHwlllhllllllllk..........',
  '...........nwHwwwHHwwwwwHHHwwwlHHHHgllllllhllllllllw..........',
  '...........klHwHwHHwHHHwHHHwHHlHllllllllllhhllllbbbbk.........',
  '..........nwlHwlllsHHHlhlHHllllgllllgllllllhllbbbbbbk.........',
  '..........nwlwllllhllllhlllllllhllllgllllllhbbbbbbbbw.........',
  '..........klllllllhllllhgllllllhllllggbsbbllhbbbbbbbw.........',
  '..........klllllllsllllhclllllhhbbbbcbbsgbbbgbbbbbbbbn........',
  '..........wbbbblllgllslgcblglbhbbbbbcfbbcbbbhbbbbbbbbn........',
  '..........wbbbbbblgllgbbfsbbghbbbbbbffbffgbbhbbbbbbbbk........',
  '..........wbmbbbbbhlgfbbffbbgbbbbbbbffbfffcbbbbbbbbbbk........',
  '..........wbmbbbbbgbcfbbffbbgbbbbbbbffsffffghbbblllllk........',
  '.....nkkkkwbdbbbbbhgfffbfffbgbbbbbbfffsffffnhslllllllw........',
  '..kpppppppwbgbbbbbhmffffffffbcbhbbffffnnnnnnRllllllllk........',
  'kppppnkkppnhsbbbbbhcffffgffffgghbbfffnnnewdHRnlllllllk........',
  'rrrkcckppkmhmbbbbbsffffffffffffgbfffnneeeedlHrlllllkll........',
  'rrkHcpppnkRhwlllllgbnnnddnnnfffmlcffHweedeewwnllllckll........',
  'krkcpppkRRRhwllllllfRnneewnnfffHfffffweeEeewwllgllfklw........',
  'krrkppkkRRRhwglllllRHHeeeedlffffffffffwEbEdwfllmllclll........',
  'krrrppkRRRRRhgllllRrHweeeeewfffffffffffffffbblglllllllk.......',
  '.krrrrRRrRRRdwlllllnwwdeEEefffffffffffffbbbbblglldllllk.......',
  '..rrrrRrRRRrksclllldwwwElffffffffffffffbbbbbbbcllhllllw.......',
  '..krRrrrRRkrkgclllllfffbbbfffffffffffffbbbbbgflldhllwww.......',
  '...kkRrrRRkrkfccHlllfbbbbbbfffffffffffffbbbfffllhhhlwwwk......',
  '....krRrrkrrkwfcgllllbbbbbbffffffffffffffffffdlhhhhllllw......',
  '....rrrkkkprkwwwwllllbbbbbbfffffncccffffffffddhhhhhlllllk.....',
  '...krrr...pplwwlhndlllbfffffffffcccffffffffhdhhhhhhllllllk....',
  '...krrk..kppllllhhhglllffffffffffffffffffksshhlhhhhllllllk....',
  '....krk..kppllllhhhghdlffffffffffffffffkssshhhldhhhllllllll...',
  '........kpppllllhhhhhhhddkffffffffffknssssshhllhhhhlllllhlllk.',
  '.......kllnpllllhhhhhhhhdsssnkndhcccwnssssshhlwhhhhlllllnnnlkk',
  '.....kkllmklllllhhhllhhhssskkkskhcccclckksdlhlwhhhhhlllll.....',
  '.....kkkk.klllllhhhwlhhhsskHmfnRrwdwRRHdHHldllwhhhhllllll.....',
  '..........lllllbhhhwlhhdsshHcnrrrRRRrrnHHgdklwHhhhhllllllk....',
  '..........llllllhhhwlhmdssHdcRrrRkkRrrnhgdHkllhhhhhlnllllk....',
  '..........llllllhhhwwlddssHlcmnRRwwkRnnhHHlllshhhhhlnllllk....',
  '..........llllkllhhhwldlslnHcmkrkwwkRrhhHHnlhshhhhhhnllllk....',
  '..........llllnklhhhllssllHHhfrpggggkrkmHmnHHhhhhhhlhlllhk....',
  '..........llllknlhhhllsssdHHHdkggggggkmHHHHHHHnhhhhlccllh.....',
  '..........klllk.lhhhhlnssHhHHhkkgggggkdHHHHHHHHhhhhkcdlmc.....',
  '..........khllk.klhhhhdssHHhHHknngggnnHHHhHHHHHHhhhccklhk.....',
  '...........hllk..khhhhddmHkHHHdgggggnnHHHhkHHHHHHhkHHglk......',
  '...........kmlk..khhhhhdklkHhHdggggggnhlHHmkHHHHHHkkwnlk......',
  '............klk....hhhhgkHHHhHkhggggkcHHHHkskHHHHHHkkk........',
  '.............kk.....khhhmHkHHHkggggggklHHkssdmHHHHHchk........',
  '..............k......khhkHdkHnkkdkkkdnkHknklmhkHHHchwwkkk.....',
  '.......................kkkkgggggnggngggnggdk...khkcwwwffcfk...',
  '.......................ckgkgggggnggggggkggkn....kmcwwkfffcc...',
  '.......................kgkggngggkgggdggggggdk...kkccwfffkk....',
  '.......................kgkggkgggggggkgggkggkdk....kk..kkk.....',
  '......................kgkggngggkggggkgggggggkd................',
  '......................ggkggkgggkggggkggggkgggkk...............',
  '.....................kgndggngggkggggkggggkgggkk...............',
  '......................kngggkgggkgggggkggggnggnk...............',
  '......................kkkggdgwwkgwwwwkfgggkkk.................',
  '.......................bckkkgggkgggggkggkkk...................',
  '.......................kk.kcccckckckkcccck....................',
  '...........................kbbbbckcffffffk....................',
  '............................kkkkgkgkffffk.....................',
  '............................kggggdgmmsggk.....................',
  '.............................kgggdgmsmgk......................',
  '..............................gggdgsssg.......................',
  '..............................ddddgssgk.......................',
  '..............................ddddggggk.......................',
  '..............................ddddggggk.......................',
  '..............................kdddggggk.......................',
  '..............................kdddgggg........................',
  '...............................kdkgggk........................',
  '...............................kkkkkgk........................',
  '...............................kkkkkk.........................',
  '...............................kkkggk.........................',
  '................................kkkkk.........................',
  '.................................kkkk.........................'
]);
const ALISA_CELL = Object.freeze({ k: 'ink', n: 'ink2', R: 'ribD', r: 'rib', p: 'ribL', d: 'dark', g: 'gray', s: 'hairDD', m: 'hairD', h: 'hairM', c: 'hairL2', H: 'hair', l: 'hairL', e: 'eye', E: 'eyeL', b: 'blush', f: 'skin', w: 'white' });
function lumiAlisaSvg() {
  const N = 100, OX = 19, OY = 2; // posición del sprite en la rejilla (margen lateral y superior para los movimientos de las poses)
  const H = ALISA_MAP.length, W = ALISA_MAP[0].length;
  const inEye = (x, y) => ((x >= 17 && x <= 29 && y >= 37 && y <= 46) || (x >= 35 && x <= 48 && y >= 34 && y <= 44)) && 'kneE'.includes(ALISA_MAP[y][x]); // ojos y pestañas (en el pelo no hay azul: solo la tinta de dentro de las cajas)
  const groupOf = (x, y, ch) => (y <= 11 ? 'ahoge' : x <= 12 && y >= 33 && y <= 56 && 'RrpnkdE'.includes(ch) && x <= 11 ? 'ribbon'
    : inEye(x, y) ? 'eyes' : y >= 66 && y <= 76 && x >= 46 ? 'armR' : y <= 52 ? 'head' : 'body');
  const L = { body: {}, head: {}, eyes: {}, armR: {}, ribbon: {}, ahoge: {} }, rect = (x, y, w) => `<rect x="${x + OX}" y="${y + OY}" width="${w}" height="1"/>`;
  ALISA_MAP.forEach((row, y) => {
    for (let x = 0; x < W;) { // tramos horizontales del mismo color y grupo → un rect
      const ch = row[x], cls = ALISA_CELL[ch]; if (!cls) { x++; continue; }
      const g = groupOf(x, y, ch); let w = 1;
      while (x + w < W && row[x + w] === ch && groupOf(x + w, y, ch) === g) w++;
      (L[g][cls] ||= []).push(rect(x, y, w));
      if (g === 'eyes') (L.head.skin ||= []).push(rect(x, y, w)); // piel bajo los ojos: al parpadear no asoma el fondo (en reposo queda tapada por los ojos)
      x += w;
    }
  });
  const solid = (x, y) => !!ALISA_CELL[ALISA_MAP[y]?.[x]], rim = [];
  for (let y = -1; y <= H; y++) {
    for (let x = -1; x <= W;) { // contorno exterior de 1 celda: celdas vacías pegadas al sprite
      if (solid(x, y) || !(solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) { x++; continue; }
      let w = 1; while (x + w <= W && !solid(x + w, y) && (solid(x + w - 1, y) || solid(x + w + 1, y) || solid(x + w, y - 1) || solid(x + w, y + 1))) w++;
      rim.push(rect(x, y, w)); x += w;
    }
  }
  const emit = (g) => Object.entries(g).map(([c, r]) => `<g class="al-${c}">${r.join('')}</g>`).join('');
  return `<svg class="lumi-svg lumi-svg--alisa" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">`
    + `<g class="alisa-rim al-rim">${rim.join('')}</g><g class="alisa-body">${emit(L.body)}</g><g class="alisa-arm alisa-arm-r">${emit(L.armR)}</g>`
    + `<g class="alisa-ribbon">${emit(L.ribbon)}</g><g class="alisa-ahoge">${emit(L.ahoge)}</g>`
    + `<g class="alisa-head">${emit(L.head)}<g class="alisa-eyes">${emit(L.eyes)}</g></g></svg>`;
}
