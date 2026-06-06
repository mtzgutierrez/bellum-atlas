#!/usr/bin/env sh
# Wrapper para lanzar el seed dentro del contenedor backend sin tener que
# recordar el `docker exec ...`. El seed inserta 3 batallas famosas con sus
# relaciones (ver src/seed.ts) y encola la IA de las más relevantes.
#
# Uso:
#   ./scripts/seed.sh
set -e

CONTAINER="${BACKEND_CONTAINER:-ares_codex_app_backend}"

# shellcheck disable=SC2086
exec docker exec "$CONTAINER" npm run seed
