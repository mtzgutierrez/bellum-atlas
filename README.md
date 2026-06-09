<<<<<<< HEAD
<div align="center">

# ⚔ Bellum Atlas

**Atlas histórico interactivo de batallas sobre un mapa.**

Geografía e Historia del conflicto: cada batalla, situada en el mapa, con su ficha,
su contexto de Wikipedia y —en las más relevantes— una narrativa ampliada por IA.

`NestJS` · `Prisma` · `PostgreSQL` · `BullMQ + Redis` · `React + Vite` · `Leaflet` · `Docker`

</div>

---

## ¿Qué es?

Bellum Atlas toma datos abiertos de **Wikidata** y **Wikipedia** y los convierte en
un atlas navegable de batallas históricas: un mapa a pantalla completa, un catálogo
con filtros, fichas ricas por batalla, una cronología por siglos y efemérides del
día. Sobre ese contenido gratuito, una capa de **IA pre-generada** añade narrativa
divulgativa a las batallas más importantes, a modo de vitrina curada.

No hay cuentas ni login: todo el contenido es público.

### Características

- 🗺️ **Mapa interactivo** (Leaflet) con *clustering* y ventana temporal de 150 años.
- 🔎 **Catálogo** paginado con filtros por tipo (batalla/asedio/campaña) y orden
  (importancia, año, nombre) y búsqueda por nombre.
- 📄 **Ficha de batalla**: imagen y resumen de Wikipedia, mini-mapa de ubicación,
  “batallas de la misma época”, **contexto histórico** (artículo completo de
  Wikipedia con *backfill* perezoso) y, si existe, **narrativa ampliada por IA**.
- 📅 **Un día como hoy**: efemérides por día/mes actual.
- 🕰️ **Cronología** agrupada por siglo.
- 📊 **Estadísticas** del catálogo (por tipo, por siglo, cobertura de imagen/IA…).

---

## Arquitectura

```
┌─────────────┐      HTTP/JSON      ┌──────────────────────┐      ┌────────────┐
│  Frontend   │ ─────────────────▶ │  Backend (NestJS)     │ ───▶ │ PostgreSQL │
│ React+Vite  │                    │  REST API + Prisma    │      └────────────┘
│  + Leaflet  │ ◀───────────────── │                       │ ───▶ ┌────────────┐
└─────────────┘                    │  Colas BullMQ ───────────────│   Redis    │
                                   └──────────┬────────────┘      └────────────┘
                                              │ workers (background)
                                              ▼
                                   Wikidata (SPARQL) · Wikipedia (REST) · LLM (Claude)
```

- **Una sola entidad de dominio**: `Battle` (+ `BattleAISummary`). Guerras y
  comandantes se retiraron por baja fiabilidad de los datos.
- **Ingesta**: pipeline en TypeScript que consulta Wikidata (SPARQL) para los datos
  estructurados y Wikipedia (REST) para imagen y resumen renderizables. Upsert
  idempotente por `wikidataId`.
- **Sin PostGIS**: las consultas por *bounding box* usan un índice compuesto
  `(latitude, longitude)`.

### IA — regla central: *Zero Real-Time Generation*

El LLM **nunca** se invoca dentro de una petición HTTP. El endpoint
`GET /battles/:id/ai-story` es abierto y devuelve la narrativa **pre-generada** o
`{ status: "unavailable" }` si aún no existe. El contenido lo producen procesos en
segundo plano (cron diario, `pregen`, ingesta) mediante *workers* BullMQ que
persisten el resultado en `BattleAISummary` (caché permanente).

`LlmService` soporta dos proveedores vía `AI_PROVIDER`:
- `mock` (por defecto) — plantilla local, sin coste ni red.
- `anthropic` — Claude con *prompt caching* y, opcionalmente, búsqueda web.

---

## Puesta en marcha (desarrollo)

Requisitos: Docker + Docker Compose. (El host no necesita Node 20+: todo corre en
contenedores.)

```bash
# 1. Configura el entorno
cp .env.example .env        # ajusta POSTGRES_*, AI_PROVIDER, etc.

# 2. Levanta la base de datos, Redis y el backend (con hot-reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis backend

# 3. (Opcional) levanta también el frontend
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d frontend
```

| Servicio | URL |
|----------|-----|
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |
| Frontend | http://localhost:5173 |
| Docs (mkdocs) | http://localhost:8000 |

### Poblar la base de datos

```bash
# Seed offline: 3 batallas famosas a mano (arranque sin red / tests)
./backend/scripts/seed.sh

# Ingesta real desde Wikidata
./backend/scripts/ingest.sh battle:Q165425     # una batalla (Lepanto)
./backend/scripts/ingest.sh top-battles        # top por sitelinks
./backend/scripts/ingest.sh all-battles        # bulk paginado
```

> 💾 Los datos (sobre todo `battle_ai_summaries`) son caros de regenerar. Usa
> `./backend/scripts/db-backup.sh` con frecuencia. Ver `docs/backend/backups.md`.

---

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/battles` | Listado paginado con filtros (`type`, `sort`, `search`, años, bbox). |
| `GET` | `/battles/points` | Puntos para el mapa (filtrables por año/bbox). |
| `GET` | `/battles/on-this-day` | Efemérides del día actual. |
| `GET` | `/battles/timeline` | Top batallas para la cronología. |
| `GET` | `/battles/centuries` | Recuento por siglo. |
| `GET` | `/battles/stats` | Agregados del catálogo. |
| `GET` | `/battles/:id` | Detalle por id o slug. |
| `GET` | `/battles/:id/article` | Artículo de Wikipedia (cacheado en BD). |
| `GET` | `/battles/:id/ai-story` | Narrativa por IA (solo pre-generada). |
| `GET` | `/health` | Estado del servicio + conectividad con la BD. |

---

## Tests y calidad

```bash
# Unitarios (mockeados, sin BD)
cd backend && npm test

# Integración contra una PostgreSQL real y efímera
docker compose -f docker-compose.test.yml up -d --wait
DATABASE_URL=postgresql://test:test@localhost:5433/bellum_test?schema=public \
  npx prisma migrate deploy && npm run test:e2e
docker compose -f docker-compose.test.yml down -v
```

CI (GitHub Actions, `.github/workflows/`):

- **`ci.yml`** (gate de PR): unitarias, e2e con Postgres real, **gate de build**
  (typecheck + build + smoke de la imagen de producción contra `/health`) y
  escaneos de seguridad (`npm audit`, gitleaks, CodeQL, Trivy).
- **`security-dast.yml`** (nightly): OWASP ZAP baseline contra la app.
- **`perf.yml`** (nightly): pruebas de carga con k6 y umbrales p95.

Análisis de seguridad/rendimiento y plan de pruebas:
[`docs/desarrollo/analisis-seguridad-rendimiento.md`](docs/desarrollo/analisis-seguridad-rendimiento.md).

---

## Estructura del repositorio

```
backend/      API NestJS + Prisma + colas BullMQ + pipeline de ingesta
frontend/     SPA React + Vite + Leaflet
docs/         Documentación (mkdocs-material)
docker-compose.yml          base (postgres, redis, backend, frontend)
docker-compose.dev.yml      overrides de desarrollo (hot-reload, pgadmin, docs…)
docker-compose.test.yml     PostgreSQL efímera para tests de integración
=======
# ⚔ Battle Atlas

> **Atlas histórico interactivo de conflictos militares.**
> Datos reales de Wikidata + Mapa interactivo + Narrativas generadas con IA.

**Battle Atlas** es una plataforma web que centraliza miles de batallas, guerras y
comandantes históricos en una experiencia visual moderna: un mapa interactivo,
fichas detalladas, una línea de tiempo y narrativas estratégicas generadas con
Claude. Todo lo que está disperso en Wikipedia, presentado con la claridad y la
potencia que merece.

---

## ¿Qué es Battle Atlas?

Una base de datos estructurada de batallas reales con geolocalización, búsqueda y
visualización en mapa, construida sobre datos abiertos de **Wikidata** y
**Wikipedia**, y enriquecida con resúmenes históricos pre-generados mediante la
API de **Claude (Anthropic)**.

Se dirige tanto al entusiasta de la historia militar como al investigador o
estudiante que necesita referencias rápidas y contextualizadas.

---

## Características

### Mapa interactivo
- Mapa **Leaflet** a pantalla completa con todos los pins georreferenciados.
- Carga de puntos optimizada vía endpoint dedicado (`GET /battles/points`).
- Filtros laterales por era histórica y tipo de batalla.
- Panel/drawer lateral al clicar un pin con el resumen de la batalla.

### Búsqueda y catálogo
- Búsqueda sobre batallas, guerras y comandantes.
- Filtros combinables por era histórica y tipo (batalla / asedio / campaña).
- Resultados paginados y ordenables.
- URLs compartibles con los parámetros de búsqueda (sincronización con la query string).

### Fichas de batalla
- Cabecera con nombre, años, guerras asociadas y tipo.
- Mini-mapa centrado en la ubicación.
- Comandantes implicados, agrupados por bando.
- Imagen e enlace a Wikipedia.

### Story Mode (IA)
- Narrativa histórica generada con Claude, **pre-computada** y cacheada de forma
  permanente (`BattleAISummary`). Nunca se invoca la IA de forma síncrona en una
  petición de usuario.
- Cuatro secciones: narrativa principal, contexto estratégico, resultado y
  curiosidades.
- Si una batalla todavía no tiene narrativa, el endpoint responde `202` y encola
  la generación.

### Fichas de guerra y comandantes
- Guerras con su periodo, región y batallas asociadas.
- Comandantes con años de vida y batallas en las que participaron.

### Timeline histórica
- Feed cronológico de batallas agrupadas por era.

### Autenticación (base)
- JWT con tiers `free` / `premium` y guard `PremiumGuard` para features de pago.
- En desarrollo, endpoint `POST /auth/dev-token` para emitir tokens sin IdP.

---

## Stack tecnológico

| Capa | Tecnología | Nota |
|---|---|---|
| Frontend | React 19 + Vite 8 + React Router 7 + Leaflet | SPA, mapa con Leaflet/TopoJSON |
| Backend | NestJS 11 + Prisma 7 + PostgreSQL | API REST, módulos por dominio, Swagger |
| Colas / Caché | BullMQ + Redis (ioredis) | Generación de IA en background |
| IA | Anthropic SDK (`@anthropic-ai/sdk`) | Claude con *prompt caching*; provider `mock` por defecto |
| Datos | Wikidata + Wikipedia REST | Ingestión vía CLI, sin scraper |
| Auth | JWT (`@nestjs/jwt`) + Throttler | Tiers free/premium |
| Infra | Docker Compose (dev) + Node 24 | DevContainer disponible |

---

## Arquitectura de la ingestión

El antiguo scraper en Python ha sido **eliminado**. Los datos se obtienen ahora
desde fuentes abiertas estructuradas a través de un **CLI de ingestión** que vive
dentro del propio backend (`src/ingestion`):

1. **Origen**: identificadores de Wikidata (`Qxxx`) para batallas, guerras y
   comandantes.
2. **Extracción**: `WikidataClient` consulta Wikidata y el *summary* de Wikipedia.
3. **Normalización**: coordenadas válidas (WGS84), años, *importance score*
   (proxy: nº de sitelinks de Wikidata normalizado a 0-100).
4. **Persistencia**: `upsert` en PostgreSQL vía Prisma.
5. **IA**: si el *importance score* ≥ umbral (`AI_AUTO_QUEUE_MIN_SCORE`), se
   encola la generación de la narrativa en la cola `ai-generation`.

```bash
# Ejemplos del CLI de ingestión (se ejecuta dentro del backend)
npx ts-node src/cli.ts demo
npx ts-node src/cli.ts battle:Q48314 battle:Q12169
npx ts-node src/cli.ts war:Q362 --with-battles
npx ts-node src/cli.ts commander:Q517
```

El worker de IA (`AiProcessor`) consume la cola y decide el proveedor según
`AI_PROVIDER`:

- `mock` (por defecto) → genera una plantilla local, **cero coste y sin red**.
- `anthropic` → llama a Claude con `cache_control` sobre el system prompt para
  abaratar colas largas. Requiere `ANTHROPIC_API_KEY`.

---

## Modelo de datos (Prisma)

```
War ──< BattleWar >── Battle ──< BattleCommander >── Commander
                         └── BattleAISummary (1:1, caché permanente de IA)
```

- `Battle`: nombre, años (timeline), lat/lng (sin PostGIS, índice compuesto),
  tipo (`BATTLE` / `SIEGE` / `CAMPAIGN`), `importanceScore`, summary de Wikipedia.
- `BattleAISummary`: narrativa, contexto, resultado y curiosidades + `modelUsed`
  y `promptHash` para auditoría. Nunca se invalida automáticamente.

Esquema completo en [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

---

## API

Documentación Swagger en `http://localhost:3000/api/docs` con el backend levantado.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/battles` | Listado paginado y filtrable de batallas |
| `GET` | `/battles/points` | Puntos georreferenciados para el mapa |
| `GET` | `/battles/:id` | Detalle de batalla |
| `GET` | `/battles/:id/ai-story` | Narrativa IA (o `202` si se encola) |
| `GET` | `/wars`, `/wars/:id` | Guerras |
| `GET` | `/commanders`, `/commanders/:id` | Comandantes |
| `POST` | `/auth/dev-token` | Solo dev: emite un JWT con tier `free`/`premium` |

---

## Puesta en marcha

La forma recomendada de trabajar es mediante **DevContainers**. Consulta
[`CONTRIBUTING.md`](CONTRIBUTING.md) para la guía completa.

### Arranque rápido con Docker Compose

```bash
# 1. Clonar
git clone https://github.com/tu-usuario/battle-atlas.git
cd battle-atlas

# 2. Configurar variables
cp .env.example .env
# edita .env con tus valores (POSTGRES_*, JWT_SECRET, ANTHROPIC_API_KEY opcional)

# 3. Levantar el stack (postgres + redis + backend + frontend)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 4. Sembrar datos de demostración
docker compose exec backend npx ts-node src/cli.ts demo
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend (API) | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |
| Docs (MkDocs) | http://localhost:8000 |
| pgAdmin (perfil `manual`) | http://localhost:5051 |

### Sin Docker (servicios locales)

Necesitas **Node 24**, PostgreSQL y Redis en local.

```bash
# Backend
cd backend && npm install
npx prisma generate && npx prisma migrate deploy
npm run start:dev

# Frontend
cd frontend && npm install
npm run dev
>>>>>>> 0514cbb (feat: add deployment guide for Hetzner and Namecheap integration)
```

---

<<<<<<< HEAD
## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 · Vite · React Router · Leaflet |
| Backend | NestJS 11 · Prisma 7 · PostgreSQL 18 |
| Colas / caché | BullMQ · Redis |
| IA | Anthropic Claude (vía workers; `mock` por defecto) |
| Datos | Wikidata (SPARQL) · Wikipedia (REST) |
| Infra | Docker Compose · GitHub Actions |

---

<div align="center">
<sub>Bellum Atlas — proyecto divulgativo y educativo. Datos de Wikipedia/Wikidata bajo sus respectivas licencias.</sub>
</div>
=======
## Variables de entorno principales

| Variable | Descripción | Por defecto |
|---|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL | — |
| `REDIS_HOST` / `REDIS_PORT` | Conexión a Redis (BullMQ) | `localhost` / `6379` |
| `JWT_SECRET` / `JWT_EXPIRATION` | Firma de tokens | — / `7d` |
| `AI_PROVIDER` | `mock` o `anthropic` | `mock` |
| `ANTHROPIC_API_KEY` | Clave de la API de Claude | — |
| `AI_MODEL` | Modelo a usar | `claude-sonnet-4-6` |
| `AI_AUTO_QUEUE_MIN_SCORE` | Umbral de *importance* para auto-encolar IA | `80` |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:5173` |

Ver [`.env.example`](.env.example) para la lista completa.

---

## Scripts útiles

**Backend** (`backend/`):

| Script | Acción |
|---|---|
| `npm run start:dev` | Servidor con hot-reload |
| `npm run build` | Compila a `dist/` |
| `npm test` | Tests unitarios (Jest, mockeados) |
| `npm run lint` | ESLint + fix |
| `npx prisma migrate dev` | Crea/aplica migraciones en dev |

**Frontend** (`frontend/`):

| Script | Acción |
|---|---|
| `npm run dev` | Servidor Vite |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |

---

## Despliegue

La guía de despliegue en Hetzner está en
[`DESPLIEGUE-HETZNER.md`](DESPLIEGUE-HETZNER.md).

---

## Contribuir

Lee [`CONTRIBUTING.md`](CONTRIBUTING.md) para configurar el entorno con
DevContainers, el flujo de ramas y las convenciones del proyecto.

---

## Licencia

Ver [`LICENSE.md`](LICENSE.md).

---

*Battle Atlas · Atlas histórico interactivo de conflictos militares*
>>>>>>> 0514cbb (feat: add deployment guide for Hetzner and Namecheap integration)
