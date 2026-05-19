#!/usr/bin/env sh
# Wrapper para lanzar el seed de Wikidata desde el host sin tener que
# recordar el `docker exec ...`. Pasa los argumentos tal cual al script.
#
# Uso:
#   ./scripts/seed.sh battle:Q165425
#   ./scripts/seed.sh all-battles
#   ./scripts/seed.sh all-commanders all-wars
#   MAX_PAGES=1 ./scripts/seed.sh all-battles            # smoke test
set -e

CONTAINER="${BACKEND_CONTAINER:-ares_codex_app_backend}"

# Propaga variables de entorno opcionales del seed bulk al contenedor.
ENV_FLAGS=""
for var in PAGE_SIZE BATCH_SIZE DELAY_MS MAX_PAGES; do
  eval "val=\${$var:-}"
  if [ -n "$val" ]; then
    ENV_FLAGS="$ENV_FLAGS -e $var=$val"
  fi
done

# shellcheck disable=SC2086
exec docker exec $ENV_FLAGS "$CONTAINER" npm run seed -- "$@"
