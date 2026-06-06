#!/usr/bin/env sh
# Wrapper para lanzar la ingesta desde Wikidata/Wikipedia dentro del
# contenedor backend. Pasa los argumentos tal cual a `npm run ingest`.
#
# Uso:
#   ./scripts/ingest.sh battle:Q165425
#   ./scripts/ingest.sh war-tree:Q362
#   TOP_LIMIT=100 ./scripts/ingest.sh top-battles
#   MAX_PAGES=0 ./scripts/ingest.sh all-battles        # todas (sin límite)
set -e

CONTAINER="${BACKEND_CONTAINER:-ares_codex_app_backend}"

# Propaga variables de entorno opcionales de la ingesta bulk al contenedor.
ENV_FLAGS=""
for var in TOP_LIMIT TOP_OFFSET PAGE_SIZE MAX_PAGES START_OFFSET DELAY_MS; do
  eval "val=\${$var:-}"
  if [ -n "$val" ]; then
    ENV_FLAGS="$ENV_FLAGS -e $var=$val"
  fi
done

# shellcheck disable=SC2086
exec docker exec $ENV_FLAGS "$CONTAINER" npm run ingest -- "$@"
