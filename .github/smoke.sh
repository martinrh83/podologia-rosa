#!/usr/bin/env bash
# Que un deploy termine no significa que el sitio ande.
#
# No previene un deploy malo —para eso habría que probar una URL de preview y
# recién después promoverla— pero deja el job en rojo, que es la diferencia
# entre enterarte vos y enterarte porque un paciente no pudo sacar turno.
set -euo pipefail
U="$1"

code() { curl -s -o /dev/null -w '%{http_code}' "$1"; }
check() { # check <url> <esperado> <qué es>
  local got; got=$(code "$1")
  if [ "$got" != "$2" ]; then echo "FALLA  $3: esperaba $2, dio $got"; exit 1; fi
  echo "ok     $3 ($2)"
}

check "$U/turnos"             200 "la lista de profesionales"
check "$U/no-existe"          404 "el 404"
check "$U/api/cron/retencion" 401 "el cron sin secreto"

curl -s "$U/sitemap.xml" | grep -q "${U#https://}" \
  && echo "ok     el sitemap apunta a $U" \
  || { echo "FALLA  el sitemap no apunta a $U"; exit 1; }
