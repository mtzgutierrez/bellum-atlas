# Docker Compose

El stack se compone con dos ficheros:

- `docker-compose.yml` — definición base de todos los servicios.
- `docker-compose.dev.yml` — overrides de desarrollo (bind-mounts del código,
  hot reload, puertos, comando con migraciones, servicio de docs).

Para desarrollo se usan **siempre los dos juntos**:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

!!! tip "Atajo con COMPOSE_FILE"
    ```bash
    export COMPOSE_FILE=docker-compose.yml:docker-compose.dev.yml
    docker compose up -d   # ya usa ambos ficheros
    ```

---

## Servicios

| Servicio | Imagen | Puerto | Propósito |
|---|---|---|---|
| `postgres` | `postgres:18.1-alpine` | 5432 | Base de datos principal |
| `redis` | `redis:7.4-alpine` | 6379 | Colas BullMQ (IA) y caché |
| `backend` | build `backend/` (node:24) | 3000 | API NestJS (watch + migraciones) |
| `frontend` | build `frontend/` (node:24) | 5173 | App React (Vite) |
| `docs` | `python:3.13-slim` | 8000 | MkDocs |

Servicios bajo perfil `manual` (no arrancan por defecto): `pgadmin` (5051),
`sonarqube` (9000) + `sonar-db`.

```bash
# Levantar un servicio manual cuando lo necesites
docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile manual up -d pgadmin
```

---

## Comandos útiles

```bash
CF="-f docker-compose.yml -f docker-compose.dev.yml"

# Levantar todo en background
docker compose $CF up -d

# Ver logs en tiempo real
docker compose $CF logs -f backend

# Reconstruir tras cambiar dependencias (package.json)
docker compose $CF up -d --build backend

# Parar (conserva datos)
docker compose $CF stop

# Eliminar contenedores y volúmenes (BORRA los datos)
docker compose $CF down -v

# Conectarse a PostgreSQL (usuario/BD por defecto del .env)
docker exec -it bellum_atlas-postgres-1 psql -U bellum_user -d bellum_db

# Conectarse a Redis
docker exec -it bellum_atlas-redis-1 redis-cli

# Poblar la BD
docker exec bellum_atlas-backend-1 npm run seed
docker exec bellum_atlas-backend-1 npm run ingest -- battle:Q165425
```

---

## Persistencia de datos

PostgreSQL y Redis persisten en volúmenes Docker nombrados
(`bellum_atlas_postgres_data`, `bellum_atlas_redis_data`), por lo que
sobreviven a `stop`. Solo se borran con `down -v`.

---

## Notas

- El código se monta con bind-mount (`./backend:/app`, `./frontend:/app`), así
  que los cambios se recargan en caliente; `node_modules` vive en un volumen
  anónimo para no pisar el de la imagen.
- El `backend` aplica `prisma migrate deploy` en cada arranque.
- También existe un **devcontainer** (`backend/.devcontainer`) para abrir el
  backend en VS Code, pero la vía recomendada para arrancar todo es el compose
  de arriba.
