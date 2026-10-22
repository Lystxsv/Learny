/* Learny · parte 16 (arte) · Lumi con la apariencia «Eevee»
   Dibujo SVG propio del personaje, trazado en pixel art a partir de la imagen de referencia aportada (47×49 celdas, colocadas en una rejilla 56×56).
   Solo contiene el arte: el controlador es LumiCompanion (16-lumi.js), que decide estados, mensajes y reglas. Se carga con <script defer> ANTES de 16-lumi.js
   (init() se ejecuta al final de 16-lumi.js y necesita encontrar lumiEeveeSvg). Sin librerías, sin recursos externos, sin degradados y SIN id (hay varias copias: Inicio y miniaturas).
   Alcance de uso: el personaje es de terceros; el proyecto declara contar con autorización. No se añaden logos ni se sugiere una colaboración oficial.
   Letras del mapa → clase .e-* (variables --ev-* en style.css):
   k tinta casi negra (interior de orejas, ojos, contornos) · d contorno marrón oscuro · e marrón oscuro · f marrón de sombra · g marrón base · h marrón claro · i marrón medio · t crema sombreado · c crema · w brillo.
   Grupos para las poses (Bloque 2, solo CSS): .eevee-ear-l, .eevee-ear-r, .eevee-tail y .eevee-body (cabeza, collar, cuerpo y patas); .eevee-rim es un contorno de 1 celda que solo se ve en alto contraste. */
'use strict';

const EEVEE_MAP = Object.freeze([
  'ee.............................................',
  'ehe............................................',
  'ehhe...........................................',
  'efehe..........................................',
  'efkfhe.........................................',
  'kgkkfhe............................eeee........',
  'kgkekfhe.......................eeeehhhd........',
  '.ekeekfgd....................eehhhgkkfk........',
  '.kfeeekhe..................eehhfkkkkfk.........',
  '.kfeeekfgd...ee..e........ehhekkeeekfk.........',
  '..dfeddkgd.eeihedhe......dgikkeeeekfk..........',
  '..kfkdkkffdhidhhietdd...dgfkkeeeeeffk..........',
  '...kfkkkkfkdhhfhgggfgd.kggkkkeeeedfk...........',
  '....kfkkkeghhghhhggggfkggkkkddeedfk......ff....',
  '.....kfkighhhhhhhhggggfgkkkkkkkfik.......fcf...',
  '......kfdhhhhhhhgggggggegkkkkffkk........fccf..',
  '.......khhhghhhgggggggggekkffkk.........fcccf..',
  '.......ehhfgggggggggggggfffkk.........ffcccctf.',
  '.......egkgfgggggfggggggkkk.........ffcccccccf.',
  '.......edckgggggfhkkggggfk........ffcccccccccf.',
  '.......ekkkggggggkckkgggfk......eegccgccccccctk',
  '.......ekkkggggggkkkkgggfk.....egggggccgctccctk',
  '.......eekeggggggkkekggffk....dggggggggccgccctk',
  '......egiefghhhggeffeggffk....eggggggggcggctttk',
  '......egggggkeggggddggfffk...dggggggggggggttitk',
  '......dgggigggggggggggffktk..dgggggggggggggtftk',
  '......dfggeiddggeggggfffkttk.dfggggggggggggfftk',
  '.....fcdfggeggedggggfffkttttkkffgggggggggggfffk',
  '....fcccdffgggggggffffkttttttfkffgggggggggfffk.',
  '...fcicccddfffffffffddtttttteffkffggggggfffffk.',
  '....fcccctcdddddddddtttttttttkffdffffggfffffk..',
  '....fccchccccttttttttftttttttkfffdffffffffffk..',
  '....ftcccchcccctttttttttttttikfffdfffffffffk...',
  '....fictcccccccccccfttftttttkfffffdfffffffk....',
  '.....ktfccccccccccctftfttttkffffffdfffffkk.....',
  '......kfcctcccccccttftftttkfffffffkkkkkk.......',
  '.......ktcfcccccccttftfttkffffffffk............',
  '........ktfccctcctttfftkkfffffffffk............',
  '.........ktittttcttftkkffffdffffffk............',
  '..........kkttttttktkffdfkkkfffffffk...........',
  '..........kfkktttkfkfffkkek.kffffffk...........',
  '...........kffktkffffffkeek..kfffffk...........',
  '...........kfffkkgggfffkeek...kffffk...........',
  '............dfffkggggfkeeek...kffffk...........',
  '............dgffkgggggkeek....kggfk............',
  '...........kgggfkhhggfkkk....kgggfk............',
  '...........kfdgkhhhhgk.......kegdfk............',
  '............kkkkhehegk........kkkk.............',
  '................kkkkk..........................'
]);
const EEVEE_CELL = Object.freeze({ k: 'ink', d: 'line', e: 'dark', f: 'shade', g: 'base', h: 'light', i: 'mid', t: 'tan', c: 'cream', w: 'glint' });
function lumiEeveeSvg() {
  const N = 56, OX = 4, OY = 3; // posición del sprite en la rejilla (margen para orejas y cola)
  const H = EEVEE_MAP.length, W = EEVEE_MAP[0].length;
  const groupOf = (x, y) => (x <= 9 && y <= 13 && !(x >= 8 && y >= 12) ? 'earL' : x >= 24 && x <= 38 && y <= 17 ? 'earR' : x >= 29 && y >= 13 && y <= 35 ? 'tail' : 'body');
  const L = { body: {}, earL: {}, earR: {}, tail: {} }, rect = (x, y, w) => `<rect x="${x + OX}" y="${y + OY}" width="${w}" height="1"/>`;
  EEVEE_MAP.forEach((row, y) => {
    for (let x = 0; x < W;) { // tramos horizontales del mismo color y grupo → un rect
      const ch = row[x], cls = EEVEE_CELL[ch]; if (!cls) { x++; continue; }
      const g = groupOf(x, y); let w = 1;
      while (x + w < W && row[x + w] === ch && groupOf(x + w, y) === g) w++;
      (L[g][cls] ||= []).push(rect(x, y, w)); x += w;
    }
  });
  const solid = (x, y) => !!EEVEE_CELL[EEVEE_MAP[y]?.[x]], rim = [];
  for (let y = -1; y <= H; y++) {
    for (let x = -1; x <= W;) { // contorno exterior de 1 celda: celdas vacías pegadas al sprite
      if (solid(x, y) || !(solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) { x++; continue; }
      let w = 1; while (x + w <= W && !solid(x + w, y) && (solid(x + w - 1, y) || solid(x + w + 1, y) || solid(x + w, y - 1) || solid(x + w, y + 1))) w++;
      rim.push(rect(x, y, w)); x += w;
    }
  }
  const emit = (g) => Object.entries(g).map(([c, r]) => `<g class="e-${c}">${r.join('')}</g>`).join('');
  return `<svg class="lumi-svg lumi-svg--eevee" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">`
    + `<g class="eevee-rim e-rim">${rim.join('')}</g><g class="eevee-body">${emit(L.body)}</g>`
    + `<g class="eevee-ear eevee-ear-l">${emit(L.earL)}</g><g class="eevee-ear eevee-ear-r">${emit(L.earR)}</g><g class="eevee-tail">${emit(L.tail)}</g></svg>`;
}
