#!/usr/bin/env sh
# Restaura un backup (.dump de db-backup.sh) en la base de datos Postgres.
# DESTRUCTIVO: reemplaza el contenido actual por el del dump (--clean).
#
# Uso:
#   ./scripts/db-restore.sh backups/bellumatlas_20260607_120000.dump
#   ./scripts/db-restore.sh                 # usa el backup más reciente
#   FORCE=1 ./scripts/db-restore.sh <file>  # sin confirmación interactiva
set -e

CONTAINER="${POSTGRES_CONTAINER:-bellum_atlas-postgres-1}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"

FILE="$1"
if [ -z "$FILE" ]; then
  # shellcheck disable=SC2012
  FILE=$(ls -1t "$BACKUP_DIR"/bellumatlas_*.dump 2>/dev/null | head -n1 || true)
  [ -n "$FILE" ] && echo "Sin argumento: uso el más reciente → $FILE"
fi

if [ -z "$FILE" ] || [ ! -s "$FILE" ]; then
  echo "ERROR: no encuentro un dump válido ('$FILE')." >&2
  exit 1
fi
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "ERROR: el contenedor '$CONTAINER' no está en marcha." >&2
  exit 1
fi

if [ "${FORCE:-0}" != "1" ]; then
  printf "Esto REEMPLAZARÁ el contenido actual de la BD por '%s'.\n" "$FILE"
  printf "Escribe 'restaurar' para continuar: "
  read -r ans
  [ "$ans" = "restaurar" ] || { echo "Cancelado."; exit 1; }
fi

echo "Restaurando $FILE → $CONTAINER …"
docker exec -i "$CONTAINER" sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < "$FILE"
echo "✓ Restauración completada."
