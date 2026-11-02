// Vigila que el aviso de los personajes de terceros de Lumi siga en la app y en el README (sin navegador).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const AVISO = 'no afiliado a los titulares de los personajes de Lumi';
const DUENOS = 'pertenecen a sus dueños';
let fallos = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fallos++; };

const html = read('index.html');
const foot = (html.match(/<footer class="landing-foot">[\s\S]*?<\/footer>/) || [''])[0];
const side = (html.match(/<div class="sidebar-footer">[\s\S]*?<\/div>/) || [''])[0];
ok(foot.includes(AVISO) && foot.includes(DUENOS), 'aviso en el pie de la pantalla de inicio');
ok(side.includes(AVISO) && side.includes(DUENOS), 'aviso en el menú lateral');
const ajustes = read('js/13-ajustes.js');
const bloque = (ajustes.match(/<legend>Apariencia de Lumi<\/legend>[\s\S]*?<\/fieldset>/) || [''])[0];
ok(bloque.includes(AVISO) && bloque.includes(DUENOS), 'aviso dentro de «Apariencia de Lumi» (Ajustes), visible también en móvil');
const readme = read('README.md');
ok(readme.includes(AVISO) && readme.includes(DUENOS), 'aviso en el README');
// control: un texto sin el aviso debe detectarse como faltante
ok(!'<footer class="landing-foot">Comentarios</footer>'.includes(AVISO), 'control: un pie sin aviso → falla la comprobación');
process.exit(fallos ? 1 : 0);
