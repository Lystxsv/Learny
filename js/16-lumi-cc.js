/* Learny · parte 16 (arte) · Lumi con la apariencia «Miku Nakano» (id interno: cc)
   Dibujo SVG en pixel art (56×84 celdas, colocadas en una rejilla 88×88): una chica de pelo castaño y ojos azules con un disfraz de dinosaurio azul, trazada celda a celda de la imagen aportada
   (la imagen es del responsable del proyecto; se omitieron el huevo, las palmeras y la montaña del fondo, y el fondo blanco es transparente).
   Solo contiene el arte: el controlador es LumiCompanion (16-lumi.js), que decide estados, mensajes y reglas. Se carga con <script defer> ANTES de 16-lumi.js
   (init() se ejecuta al final de 16-lumi.js y necesita encontrar lumiCcSvg). Sin librerías, sin recursos externos, sin degradados y SIN id (hay varias copias: dock y miniaturas).
   Letras del mapa → clase .cc-* (variables --cc-* en style.css):
   k contorno azul marino · b capucha · d capucha en sombra · e azul oscuro · h pelo · H pelo oscuro · m pelo muy oscuro · o reflejo naranja del flequillo · y dorado (púas) · Y dorado oscuro
   s piel · p mejilla · w blanco (dientes, ojos, barriga) · i azul marino de los ojos.
   Grupos para las poses (solo CSS): .cc-head (capucha, pelo y cara) con .cc-eyes dentro, .cc-arm-l, .cc-arm-r, .cc-tail y .cc-body (barriga, patas y el resto); .cc-rim es un contorno de 1 celda que solo se ve en alto contraste. */
'use strict';

const CC_MAP = Object.freeze([
  '..........................kkk...........................',
  '.........................kyyyk..........................',
  '........................kyyyyy..........................',
  '........................kyyyyyk.........................',
  '.......................kyyyyyyyk........................',
  '.......................kyyyyyyyk........................',
  '....................kkkyyyyyyyYkkkk.....................',
  '.................kkkbbbyyyyyyYYbbbbbkk..................',
  '...............kbbbbbbbyyyyyYYbbbbbbbbbkk...............',
  '.............kbbbbbbbbbkyyyyYbbbbbbbbbbbbk..............',
  '...........kbbbbbbbbbbbbyyyykbbbbbbbbbbbbbbk............',
  '..........kbbbbbbbbbbbbbkyyYbbbbbbbbbbbbbbbbk...........',
  '.........kbbbbbbbbbbbbbbbyykbbbbbbbbbbbbbbbbbbk.........',
  '........kbbbbbbbbbbbbbbbbbybbbbbbbbbbbbbbbbbbbbk........',
  '.......kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk.......',
  '......kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk......',
  '.....kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb......',
  '.....bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk.....',
  '....kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk....',
  '...kbbbbbbbbbbbbbwwbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb....',
  '...kbbbbbbbbbbbbwwwbbbbbbbbbbbbbbbbbwwwbbbbbbbbbbbbbk...',
  '...bbbbbbbbbbbbwwwwbbbbbbbbbbbbbbbbbwwwbbbbbbbbbbbbbk...',
  '..kbbbbbbbbbbbbwwwwbbbbbbbbbbbbbbbbbwwwwbbbbbbbbbbbbbk..',
  '..kbbbbbbbbbbbbbwwwbbbbbbbbbbbbbbbbbwwwbbbbbbbbbbbbbbk..',
  '.kbbbbbbbbbbbbbbbbbbbbbkkkkkkkkkkbbbbwwbbbbbbbbbbbbbbk..',
  '.kbbbbbbbbbbbbbbbbbbkkwwwwwHwwwwwkkkbbbbbbbbbbbbbbbbbb..',
  '.kbbbbbbbbbbbbbbbkwwkHkwwwHhHwwwkkHwwwbbbbbbbbbbbbbbbbk.',
  '.bbbbbbbbbbbbbbkwwwwHhhHHHhhhHkHHhhkwwwkbbbbbbbbbbbbbbk.',
  '.bbbbbbbbbbbbbkkwwwkhhhhhhhhhhhhhhhHwwwkkbbbbbbbbbbbbbk.',
  'kbbbbbbbbbbbbwwHhHHhhhhhhhhhhhhhhhhhHHhHwkbbbbbbbbbbbbk.',
  'bbbbbbbbbbbbwwwhhhhhhhhhhhhhhhhhhhhhhhhHwwkbbbbbbbbbbbb.',
  'kbbbbbbbbbbkwwHhhhhhhhhhhhhhhhhhhhhhhhhhkwwbbbbbbbbbbbb.',
  'kbbbbbbbbbkkHhhhhhhhhhhhhhhhhhhhhhhhhhhhHkwwbbbbbbbbbbb.',
  'kbbbbbbbbbwHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHkkbbbbbbbbbb.',
  'kbbbbbbbbbwkhhhhhhhhhhhhhhmhhhhhhhhhhhhhhhhwwbbbbbbbbbb.',
  'kbbbbbbbbkwkhhhhHhhhhhhhhhmhhhhhmhhhhhhhHhHwwbbbbbbbbbk.',
  'kbbbbbbbbwkHohhhhhhhhhhhhmphhhhhphhhhhhoohowwkbbbbbbbbk.',
  'kbbbbbbbbkHhohomhhhhhhhhhphhhhhpphhhohooomhHwkbbbbbbbbk.',
  'kbbbbbbbbwHhohohooooohoopsooooopshhhhhhhhHhhHkbbbbbbbb..',
  '.bbbbbbbkwkhhhmhhhhohoopssooohossmhhhhhhhHhhHkbbbbbbbk..',
  '.dbbbbbbkwkhhhHhhhhhhhmssshhhhHsssHhhhhhhHhhwkbbbbbbbk..',
  '.kbbbbbbkkhhhhhhhhhhhHsssmhhhhssssshhhhhhhhhkkbbbbbbb...',
  '.kdbbbbbkHhhhHhhhhhhpssssmhhhhsssssmhhhhhhHhhkbbbbbbk...',
  '..ddbbbbkHhhhHhhhhHpssssshhhhsssssssmkhhhhmhhkbbbbbd....',
  '..kddbbbbHhhhHhhkkksssssshhhhssssskkkkkhhhmhhkbbbddk....',
  '...dddbbbHhhhkkkkkkkkssshhhhssssHkkkkkkkkkmhkbbdddd.....',
  '...kddbbbkhhkkkkiiewwmsshhhssssHwieiewwwwkmhkbddddk.....',
  '....dddbbbhhkkwkiiiiwiwhhhmssssswiiiiiiwwkmhkddidk......',
  '....kdddbbkhhkwwiebbeiwhhhsssssssieebeiwkkkkkdbbi.......',
  '.....kdddbkhhpsppkkkkkhhhssssssssskpppppkbbbbkbbb.......',
  '......kddddhhsppppppmhhsssssssssssppppppbbbbbbbbk.......',
  '......kddddkhkppppphhhsssssssssssspppppkbbbbbbbbk.......',
  '.......kkddkbbkpphhmsssssssssssssssppppkbbbbbbbbk.......',
  '........bbbbbbbkppssssssssssssssssssssskbbbbbbbbk.......',
  '........bbbbbbbkssssssssssssssssssssssskdbbbbbbbk.......',
  '........kbbbbbbbmssssssssssssssssssssmmibbbbbbbbk.......',
  '........bbbbbbbbHidkssssssssssssssskkHkbbbbbbbbbk.......',
  '........bbbbbbbbihkddkkkkskkkkskkdddhhibbbbbbbbb........',
  '........kbbbbbbbihhidbddkddddddddddhhkbbbbbbbbbk........',
  '........kbbbbbbbbkhhkbbbdddddddddbhhhdbbbbbbbbk.........',
  '.........bbbbbbbbdihhmbbbbbbbbbbbbhhidbbbbbbbk..........',
  '.........kbbbbbbbddhhhbbbbwwwwbbbbhhdbbbbbbbk...........',
  '..........kbbbbbkdbhhhbbwwwwwwwwbbhhdbbbbbkyk...........',
  '...........bbbbddbbhhhwwwwwwwwwwwbhhdbbbbbdyy...........',
  '............kddkdbbhhhwwwwwwwwwwwwwhhbbbbbbkk...........',
  '...............kbbbhhwwwwwwwwwwwwwwbhibbbbbkk...........',
  '...............kbbimwwwwwwwwwwwwwwwbbbbbbbbkk...........',
  '...............kbbbbwwwwwwwwwwwwwwwwbbbbbbbbyyk.........',
  '..............kbbbbbwwwwwwwwwwwwwwwwbbbbbbbbkyy.........',
  '..............kbbbbbbwwwwwwwwwwwwwwbbbbbbbbbbkYkkkk.....',
  '..............iddbbbbbwwwwwwwwwwwwbbbbbbbbbbbbkkyyYk.kkk',
  '..............kbbbbbbbbwwwwwwwwbbbbbbbbbbbbbbbbbbkbkbbbk',
  '..........kkikkbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbddk',
  '.........kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbddddddddddk',
  '........kbbbbbbbbbbbbbbbbbbbbbbkbbbbbbbbbbbbbddddddddddi',
  '........dbbbbbbbbbbbbbbbdbbbbbdbbbbbbbbbbbbbbdddddddddk.',
  '........dbbbbbbbbbbbbbbbbdbbbddbbbbbbbbbbbbbkddddddddk..',
  '........dbbbbbbbbbbbbbbbbddddddbbbbbbbbbbbbbkdddddddk...',
  '........ddbbbbbbbbbbbbbbbdddddibbbbbbbbbbbbbdkddddk.....',
  '........ddbbbbbbbbbbbbbbbkkkkkkbbbbbbbbbbbbbdkkk........',
  '........ddkbbbddbbbbbbbbdk.....bbbbbbbbbbbbddk..........',
  '.........dddddddddddddddi......kbbbbbbbbbbddk...........',
  '.........iddkikkdddddddk........kkbbbbbddddk............',
  '..........kk............................................'
]);
const CC_CELL = Object.freeze({ k: 'ink', b: 'hood', d: 'hoodS', e: 'hoodD', h: 'hair', H: 'hairD', m: 'hairX', o: 'hl', y: 'gold', Y: 'goldD', s: 'skin', p: 'blush', w: 'white', i: 'eye' });
function lumiCcSvg() {
  const N = 88, OX = 16, OY = 2; // posición del sprite en la rejilla (margen lateral para los movimientos de las poses)
  const H = CC_MAP.length, W = CC_MAP[0].length;
  const inEye = (x, y) => y >= 44 && y <= 49 && ((x >= 12 && x <= 25) || (x >= 31 && x <= 43)) && 'kiwebd'.includes(CC_MAP[y][x]);
  const groupOf = (x, y, ch) => ((ch === 'y' || ch === 'Y') && x >= 44 && y >= 55) || (x >= 44 && y >= 63) ? 'tail'
    : inEye(x, y) ? 'eyes' : y <= 52 ? 'head' : y <= 66 && x <= 17 ? 'armL' : y <= 62 && x >= 40 && x <= 47 ? 'armR' : 'body';
  const L = { body: {}, head: {}, eyes: {}, armL: {}, armR: {}, tail: {} }, rect = (x, y, w) => `<rect x="${x + OX}" y="${y + OY}" width="${w}" height="1"/>`;
  CC_MAP.forEach((row, y) => {
    for (let x = 0; x < W;) { // tramos horizontales del mismo color y grupo → un rect
      const ch = row[x], cls = CC_CELL[ch]; if (!cls) { x++; continue; }
      const g = groupOf(x, y, ch); let w = 1;
      while (x + w < W && row[x + w] === ch && groupOf(x + w, y, ch) === g) w++;
      (L[g][cls] ||= []).push(rect(x, y, w)); x += w;
    }
  });
  const solid = (x, y) => !!CC_CELL[CC_MAP[y]?.[x]], rim = [];
  for (let y = -1; y <= H; y++) {
    for (let x = -1; x <= W;) { // contorno exterior de 1 celda: celdas vacías pegadas al sprite
      if (solid(x, y) || !(solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) { x++; continue; }
      let w = 1; while (x + w <= W && !solid(x + w, y) && (solid(x + w - 1, y) || solid(x + w + 1, y) || solid(x + w, y - 1) || solid(x + w, y + 1))) w++;
      rim.push(rect(x, y, w)); x += w;
    }
  }
  const emit = (g) => Object.entries(g).map(([c, r]) => `<g class="cc-${c}">${r.join('')}</g>`).join('');
  return `<svg class="lumi-svg lumi-svg--cc" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">`
    + `<g class="cc-rim cc-r">${rim.join('')}</g><g class="cc-tail">${emit(L.tail)}</g><g class="cc-body">${emit(L.body)}</g>`
    + `<g class="cc-arm cc-arm-l">${emit(L.armL)}</g><g class="cc-arm cc-arm-r">${emit(L.armR)}</g>`
    + `<g class="cc-head">${emit(L.head)}<g class="cc-eyes">${emit(L.eyes)}</g></g></svg>`;
}
