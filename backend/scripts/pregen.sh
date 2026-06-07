#!/usr/bin/env sh
# Pre-genera la base de narrativas por tramos: top <web> con búsqueda web y las
# siguientes <basic> en básica. Encola; el worker del backend las genera.
#
# Uso:
#   ./scripts/pregen.sh            # 100 web + 900 básica (defecto)
#   ./scripts/pregen.sh 100 900
set -e

CONTAINER="${BACKEND_CONTAINER:-ares_codex_app_backend}"
WEB="${1:-100}"
BASIC="${2:-900}"

exec docker exec "$CONTAINER" npm run pregen -- "$WEB" "$BASIC"
