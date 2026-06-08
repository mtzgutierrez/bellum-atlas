#!/usr/bin/env sh
# Arnés de redacción de fichas de IA por un agente Claude Code (sin coste de API).
# Round-trip sobre .ai-batch/batch.json (montado: backend/.ai-batch en el host).
#
#   1) export → vuelca el lote pendiente (por importancia) con su material.
#   2) el agente rellena summary/context/outcome/curiosities en el JSON.
#   3) import → persiste lo redactado en battle_ai_summaries.
#
# Uso:
#   ./scripts/ai-batch.sh export [count]      # p.ej. export 25
#   ./scripts/ai-batch.sh import
#
# Variables propagadas al contenedor:
#   export: MIN_SCORE, OFFSET, OUT
#   import: IN, AI_BATCH_MODEL
set -e

CONTAINER="${BACKEND_CONTAINER:-bellum_atlas-backend-1}"
CMD="${1:-}"
shift 2>/dev/null || true

ENV_FLAGS=""
for var in MIN_SCORE OFFSET OUT IN AI_BATCH_MODEL; do
  eval "val=\${$var:-}"
  if [ -n "$val" ]; then
    ENV_FLAGS="$ENV_FLAGS -e $var=$val"
  fi
done

case "$CMD" in
  export)
    # shellcheck disable=SC2086
    exec docker exec $ENV_FLAGS "$CONTAINER" npm run ai:export -- "$@"
    ;;
  import)
    # shellcheck disable=SC2086
    exec docker exec $ENV_FLAGS "$CONTAINER" npm run ai:import
    ;;
  *)
    echo "Uso: $0 {export [count]|import}" >&2
    exit 1
    ;;
esac
