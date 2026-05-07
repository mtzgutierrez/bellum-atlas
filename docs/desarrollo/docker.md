# Docker Compose

El archivo `docker-compose.yml` define los servicios de infraestructura para desarrollo local.

---

## Servicios definidos

| Servicio | Imagen | Puerto | Propósito |
|---|---|---|---|
| `postgres` | `postgis/postgis:16-3.4` | `5432` | Base de datos principal con extensión PostGIS |
| `redis` | `redis:7-alpine` | `6379` | Cola de jobs (BullMQ) y caché de búsquedas |

---

## Comandos útiles

```bash
# Levantar todos los servicios en background
docker compose up -d

# Levantar solo servicios manuales cuando se necesiten
docker compose --profile manual up -d pgadmin sonarqube scraper

# Ver logs en tiempo real
docker compose logs -f

# Parar los servicios (conserva los datos)
docker compose stop

# Eliminar los contenedores y volúmenes (borra los datos)
docker compose down -v

# Conectarse directamente a PostgreSQL
docker compose exec postgres psql -U ares -d arescodex

# Conectarse a Redis CLI
docker compose exec redis redis-cli
```

---

## Persistencia de datos

Los datos de PostgreSQL y Redis se persisten en volúmenes Docker nombrados, por lo que sobreviven a `docker compose stop`. Solo se borran con `docker compose down -v`.

---

## Dockerfiles de los servicios

Cada servicio tiene su propio `Dockerfile` para producción:

- `backend/Dockerfile` — Build de NestJS con multi-stage
- `scraper/Dockerfile` — Imagen Python con Scrapy

En desarrollo se usan directamente con `npm run start:dev` y `scrapy crawl`, sin construir la imagen.
