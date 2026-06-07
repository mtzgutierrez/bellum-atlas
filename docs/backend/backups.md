# Copias de seguridad de la base de datos

> El contenido de `battle_ai_summaries` (narrativas de IA) es **caro de
> regenerar** (se paga a la API de Claude o cuesta trabajo del agente). Tratar la
> BD como desechable ya costó una pérdida total una vez. Esta es la red de
> seguridad para que no vuelva a pasar.

## Qué protege y qué no

El volumen de Postgres es **nombrado** (`postgres_data` en `docker-compose.yml`),
así que los datos **sobreviven** a:

- `docker compose restart` / `stop` / `up` / `down` (sin `-v`).
- Reinicios de la máquina.

Pero se **PIERDEN IRRECUPERABLEMENTE** con:

- `docker compose down -v` (la `-v` borra los volúmenes).
- `docker volume rm ares_codex_app_postgres_data`.
- `prisma migrate reset` (re-aplica `atlas_reset`, que hace `DROP TABLE`).
- Cualquier `migrate dev` que detecte "drift" y proponga resetear.

Para esos casos, la única salvaguarda es tener un **backup reciente fuera del
volumen**.

## Hacer una copia

```sh
cd backend
./scripts/db-backup.sh            # → <repo>/backups/arescodex_<timestamp>.dump
KEEP=60 ./scripts/db-backup.sh    # conserva las últimas 60 (por defecto 30)
```

- Usa `pg_dump -Fc` (formato custom, comprimido) dentro del contenedor y escribe
  el fichero en el **host**, en `<repo>/backups/` (gitignored).
- Verifica que el dump no esté vacío y rota los antiguos.
- **Importante:** `backups/` está en la misma máquina. Para protección real,
  copia periódicamente esos `.dump` a otro sitio (otro disco, nube, etc.).

## Restaurar

```sh
cd backend
./scripts/db-restore.sh                                  # el backup más reciente
./scripts/db-restore.sh ../backups/arescodex_<ts>.dump   # uno concreto
FORCE=1 ./scripts/db-restore.sh <file>                   # sin confirmación
```

Es **destructivo** (`pg_restore --clean --if-exists`): reemplaza el contenido
actual por el del dump. Pide confirmación salvo `FORCE=1`.

## Comprobar un dump sin restaurar

```sh
cat backups/arescodex_<ts>.dump | docker exec -i ares_codex_app_postgres pg_restore -l | grep -i battle
```

Debe listar `TABLE DATA public battle_ai_summaries` y `battles`.

## Automatizar (recomendado)

`db-backup.sh` es idempotente y rota solo. Para copias periódicas, un cron del
host, p. ej. diario a las 3:00:

```cron
0 3 * * * cd /home/raul/Workspaces/ares-codex/backend && ./scripts/db-backup.sh >> /tmp/arescodex-backup.log 2>&1
```

## Regla de oro

Antes de cualquier operación que toque migraciones o volúmenes
(`migrate reset`, `down -v`, recrear el stack), **haz primero
`./scripts/db-backup.sh`**.
