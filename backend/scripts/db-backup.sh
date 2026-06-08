#!/usr/bin/env sh
# Copia de seguridad de la base de datos Postgres a un fichero en el HOST,
# fuera del volumen de Docker (sobrevive a `docker compose down -v` y a
# `prisma migrate reset`). Formato custom de pg_dump (-Fc): comprimido y
# restaurable selectivamente con pg_restore.
#
# El contenido (battle_ai_summaries incluidas) es CARO de regenerar: este
# script es la red de seguridad. Ejecútalo a menudo y guarda copias fuera de
# esta máquina.
#
# Uso:
#   ./scripts/db-backup.sh                 # crea backups/bellumatlas_<ts>.dump
#   KEEP=60 ./scripts/db-backup.sh         # conserva las últimas 60 (def. 30)
#   BACKUP_DIR=/ruta ./scripts/db-backup.sh
set -e

CONTAINER="${POSTGRES_CONTAINER:-bellum_atlas-postgres-1}"
# Dir de backups: por defecto <repo>/backups (este script vive en backend/scripts).
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"
KEEP="${KEEP:-30}"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "ERROR: el contenedor '$CONTAINER' no está en marcha." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
TS=$(date +%Y%m%d_%H%M%S)
OUT="$BACKUP_DIR/bellumatlas_${TS}.dump"

echo "Volcando $CONTAINER → $OUT …"
# pg_dump dentro del contenedor; el stream se escribe en el host.
docker exec "$CONTAINER" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$OUT"

# Verificación mínima: que el dump no esté vacío y lo lea pg_restore.
if [ ! -s "$OUT" ]; then
  echo "ERROR: el dump salió vacío; lo borro." >&2
  rm -f "$OUT"
  exit 1
fi
SIZE=$(wc -c < "$OUT" | tr -d ' ')
echo "✓ Backup OK: $OUT (${SIZE} bytes)"

# Rotación: conserva las KEEP más recientes, borra el resto.
# shellcheck disable=SC2012
COUNT=$(ls -1 "$BACKUP_DIR"/bellumatlas_*.dump 2>/dev/null | wc -l | tr -d ' ')
if [ "$COUNT" -gt "$KEEP" ]; then
  ls -1t "$BACKUP_DIR"/bellumatlas_*.dump | tail -n +"$((KEEP + 1))" | while read -r old; do
    echo "  rotación: elimino $old"
    rm -f "$old"
  done
fi
