# Entorno local

Todo el stack corre en **Docker** (backend, frontend, base de datos, colas y
docs). No necesitas Node ni Python instalados en el host.

## Requisitos previos

- **Docker** y **Docker Compose** (v2).
- Salida a Internet (para descargar imágenes y, si usas la ingesta, para
  llamar a Wikidata/Wikipedia).

---

## Paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/ares-codex.git
cd ares-codex
```

### 2. Crear el `.env`

```bash
cp .env.example .env
```

Los valores por defecto ya funcionan para desarrollo. Si quieres usar el LLM
real (Claude), edita la sección IA — ver [IA (LLM)](../backend/ia.md).

### 3. Levantar todo el stack

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

Esto arranca:

| Servicio | Puerto | Qué es |
|----------|--------|--------|
| `postgres` | 5432 | Base de datos (PostgreSQL 18) |
| `redis` | 6379 | Caché + colas BullMQ (IA) |
| `backend` | 3000 | API NestJS (modo watch). Aplica migraciones al arrancar. |
| `frontend` | 5173 | App React (Vite, hot reload) |
| `docs` | 8000 | Esta documentación (MkDocs) |

!!! tip "Las migraciones se aplican solas"
    El contenedor `backend` ejecuta `prisma generate && prisma migrate deploy`
    antes de `start:dev`, así que la BD queda lista sin pasos manuales.

Comprueba que el backend está arriba:

```bash
curl http://localhost:3000/health
```

### 4. Poblar la base de datos

Dos opciones (ver detalle en [Ingesta](../backend/ingesta.md)):

```bash
# Opción A — seed offline: 3 batallas famosas a mano (sin red)
./backend/scripts/seed.sh

# Opción B — ingesta real desde Wikidata/Wikipedia
./backend/scripts/ingest.sh battle:Q165425        # una batalla
./backend/scripts/ingest.sh war-tree:Q362         # una guerra y sus batallas
TOP_LIMIT=100 ./backend/scripts/ingest.sh top-battles
```

(Equivalen a `docker exec ares_codex_app_backend npm run seed` / `npm run ingest -- ...`.)

---

## Accesos

| URL | Qué |
|-----|-----|
| <http://localhost:5173> | Frontend |
| <http://localhost:3000> | API |
| <http://localhost:3000/api/docs> | Swagger (OpenAPI) |
| <http://localhost:8000> | Documentación |

---

## Tier Premium (IA)

La narrativa por IA es Premium. En el frontend pulsa **"Activar Premium"** en
la barra superior, o consigue un token a mano:

```bash
curl -X POST http://localhost:3000/auth/dev-token \
  -H 'Content-Type: application/json' -d '{"tier":"premium"}'
```

---

## Comandos útiles

```bash
# Ver logs del backend
docker logs -f ares_codex_app_backend

# Reiniciar solo el backend (p.ej. tras cambiar el .env)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --force-recreate backend

# Parar todo (conserva los datos)
docker compose -f docker-compose.yml -f docker-compose.dev.yml stop

# Parar y BORRAR datos (volúmenes incluidos)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

!!! note "Atajo"
    Como casi todos los comandos llevan los dos `-f`, puedes exportar
    `COMPOSE_FILE=docker-compose.yml:docker-compose.dev.yml` y luego usar
    `docker compose up -d` a secas.
