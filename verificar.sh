#!/usr/bin/env bash
# Verifica Learny de punta a punta y dice qué falló. Ejecútalo en la carpeta del proyecto:  bash verificar.sh
# Pasos: sintaxis JS → pruebas en Node → suite completa de Playwright → pruebas nuevas e intermitentes repetidas 20 veces.
cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null; [ -f index.html ] || { echo "Ejecútalo dentro de la carpeta de Learny."; exit 1; }
FALLOS=()
paso() { echo; echo "━━ $1"; }
ok()   { echo "   ✔ $1"; }
mal()  { echo "   ✘ $1"; FALLOS+=("$1"); }

paso "1/5 Sintaxis de todos los JS"
malos=0
while IFS= read -r f; do
  if grep -qE '^(import|export) ' "$f" || [[ "$f" == */js/firebase/* ]]; then node --input-type=module --check < "$f" 2>/dev/null; else node --check "$f" 2>/dev/null; fi || { echo "   error de sintaxis: $f"; malos=1; }   # los módulos de Firebase se revisan como módulos
done < <(find . -name '*.js' -not -path './node_modules/*' -not -path './.git/*')
[ $malos -eq 0 ] && ok "sin errores de sintaxis" || mal "sintaxis JS"

paso "2/5 Pruebas en Node (sin navegador)"
node tests/run-node.js >/tmp/learny-n1.txt 2>&1 && ok "metas (run-node.js)" || { tail -5 /tmp/learny-n1.txt; mal "run-node.js"; }
[ -f tests/run-node-errores.js ] && { node tests/run-node-errores.js >/tmp/learny-n2.txt 2>&1 && ok "red de errores (run-node-errores.js)" || { tail -5 /tmp/learny-n2.txt; mal "run-node-errores.js"; }; }
[ -f tests/run-node-csp.js ] && { node tests/run-node-csp.js >/tmp/learny-n3.txt 2>&1 && ok "política de seguridad de contenido (run-node-csp.js)" || { grep FAIL /tmp/learny-n3.txt | head -5; mal "run-node-csp.js"; }; }
[ -f tests/run-node-nube.js ] && { node tests/run-node-nube.js >/tmp/learny-n4.txt 2>&1 && ok "nube aislada (run-node-nube.js)" || { grep FAIL /tmp/learny-n4.txt | head -5; mal "run-node-nube.js"; }; }
[ -f tests/run-node-aviso.js ] && { node tests/run-node-aviso.js >/tmp/learny-n5.txt 2>&1 && ok "aviso de personajes (run-node-aviso.js)" || { grep FAIL /tmp/learny-n5.txt | head -5; mal "run-node-aviso.js"; }; }

paso "3/5 Preparar Playwright"
[ -d node_modules/@playwright ] || npm install >/dev/null 2>&1 || { mal "npm install"; }
npx playwright install chromium >/dev/null 2>&1 && ok "Chromium listo" || mal "instalar Chromium (¿sin internet?)"

paso "4/5 Suite completa (esperado: todo en verde)"
npx playwright test --reporter=line >/tmp/learny-suite.txt 2>&1; rc=$?
tail -25 /tmp/learny-suite.txt
[ $rc -eq 0 ] && ok "suite completa" || mal "suite completa de Playwright"

paso "5/5 Las nuevas e intermitentes, 20 repeticiones cada una (tarda unos minutos)"
for t in tests/contraste-bienvenida.spec.js tests/service-worker.spec.js tests/errores.spec.js tests/csp.spec.js; do
  [ -f "$t" ] || { echo "   (no está $t, se omite)"; continue; }
  npx playwright test "$t" --repeat-each=20 --reporter=dot >/tmp/learny-rep.txt 2>&1 && ok "$t ×20" || { tail -15 /tmp/learny-rep.txt; mal "$t ×20"; }
done

echo; echo "━━━━━━━━ RESULTADO ━━━━━━━━"
if [ ${#FALLOS[@]} -eq 0 ]; then echo "Todo en verde. Ya puedes commitear y etiquetar."; exit 0
else echo "Fallaron ${#FALLOS[@]} paso(s):"; printf '  - %s\n' "${FALLOS[@]}"; echo "Pásame esas líneas (y el mensaje de error) y lo corrijo."; exit 1; fi
