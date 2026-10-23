/* Learny · parte 16 (arte) · Lumi con la apariencia «Yor Forger»
   Dibujo SVG en pixel art (19×22 celdas, colocadas en una rejilla 24×24), copiado celda a celda de la imagen aportada (rejilla de 22,58 px por celda).
   Autorización: el responsable del proyecto indica contar con el permiso del autor del pixel art (ver CONTINUIDAD.md). Se copió solo el dibujo: sin marcas de agua, sin textos y sin las guías de la rejilla.
   Solo contiene el arte: el controlador es LumiCompanion (16-lumi.js), que decide estados, mensajes y reglas. Se carga con <script defer> ANTES de 16-lumi.js
   (init() se ejecuta al final de 16-lumi.js y necesita encontrar lumiYorSvg). Sin librerías, sin recursos externos, sin degradados y SIN id (hay varias copias: dock y miniaturas).
   Letras del mapa → clase .y-* (variables --yr-* en style.css):
   k contorno negro · h pelo · s piel · p mejilla rosa · t dorado oscuro · j dorado · l dorado claro · y dorado brillante · r rojo oscuro (ojos) · R rojo (ojos) · D rojo profundo · w blanco.
   Grupos para las poses (Bloque 2, solo CSS): .yor-body (cabeza, pelo y cuello), .yor-eyes (iris rojos), .yor-gem-l y .yor-gem-r (adornos dorados de cada lado);
   .yor-rim es un contorno de 1 celda que solo se ve en alto contraste. */
'use strict';

const YOR_MAP = Object.freeze([
  '.......kkkkk.......',
  '.....kkhhhhhkkk....',
  '...kkhhhhhhhhhhk...',
  '..khhhhhhhhhhhhhk..',
  '.khhhhtlljjljhhhhk.',
  '.khhtthhhhhhhtthhk.',
  'khhthhhhhhhhhhhthhk',
  'khthhhhhhhhhhhhhthk',
  'kyyhhhhhhhhhhhhhyyk',
  'yyyyhhhhhhhhhhhyyyy',
  'yyyhhhhhhhshhhhhyyy',
  'yhhhhhhshhsshhhhhhy',
  'khhhhkkkhsskkkhhhhk',
  '.khphsrrsssrrshphk.',
  '.khshsRRsssRRshshk.',
  '..klhpsssssssphlk..',
  '...jhkkkhhhkkkhj...',
  '...hhwkshshskwhh...',
  '...hhkskhhhkskhh...',
  '...hhwkhhhhhkwhh...',
  '....hwDkskskDwh....',
  '.......kkwkk.......'
]);
const YOR_CELL = Object.freeze({ k: 'ink', h: 'hair', s: 'skin', p: 'blush', t: 'tan', j: 'gold', l: 'pale', y: 'shine', r: 'eyed', R: 'eye', D: 'deep', w: 'white' });
function lumiYorSvg() {
  const N = 24, OX = 3, OY = 1; // posición del sprite en la rejilla (margen para los movimientos del Bloque 2)
  const H = YOR_MAP.length, W = YOR_MAP[0].length, MID = (W - 1) / 2;
  const groupOf = (x, y, ch) => (ch === 'r' || ch === 'R' ? 'eyes' : y >= 8 && y <= 15 && 'tjly'.includes(ch) && ch !== 'h' && y !== 8 ? (x < MID ? 'gemL' : 'gemR') : y >= 16 && y <= 17 && 'jl'.includes(ch) ? (x < MID ? 'gemL' : 'gemR') : 'body');
  const L = { body: {}, eyes: {}, gemL: {}, gemR: {} }, rect = (x, y, w) => `<rect x="${x + OX}" y="${y + OY}" width="${w}" height="1"/>`;
  YOR_MAP.forEach((row, y) => {
    for (let x = 0; x < W;) { // tramos horizontales del mismo color y grupo → un rect
      const ch = row[x], cls = YOR_CELL[ch]; if (!cls) { x++; continue; }
      const g = groupOf(x, y, ch); let w = 1;
      while (x + w < W && row[x + w] === ch && groupOf(x + w, y, ch) === g) w++;
      (L[g][cls] ||= []).push(rect(x, y, w)); x += w;
    }
  });
  const solid = (x, y) => !!YOR_CELL[YOR_MAP[y]?.[x]], rim = [];
  for (let y = -1; y <= H; y++) {
    for (let x = -1; x <= W;) { // contorno exterior de 1 celda: celdas vacías pegadas al sprite
      if (solid(x, y) || !(solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) { x++; continue; }
      let w = 1; while (x + w <= W && !solid(x + w, y) && (solid(x + w - 1, y) || solid(x + w + 1, y) || solid(x + w, y - 1) || solid(x + w, y + 1))) w++;
      rim.push(rect(x, y, w)); x += w;
    }
  }
  const emit = (g) => Object.entries(g).map(([c, r]) => `<g class="y-${c}">${r.join('')}</g>`).join('');
  return `<svg class="lumi-svg lumi-svg--yor" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" aria-hidden="true" focusable="false">`
    + `<g class="yor-rim y-rim">${rim.join('')}</g><g class="yor-gem yor-gem-l">${emit(L.gemL)}</g><g class="yor-gem yor-gem-r">${emit(L.gemR)}</g><g class="yor-body">${emit(L.body)}</g><g class="yor-eyes">${emit(L.eyes)}</g></svg>`;
}
