<div align="center">

# ⚔️ Bellum Atlas

### *Atlas histórico interactivo de batallas sobre un mapa.*

Geografía e Historia del conflicto: cada batalla, situada en el mapa, con su ficha,
su contexto de Wikipedia y —en las más relevantes— una narrativa ampliada por IA.

<br/>

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?style=flat-square&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?style=flat-square&logo=redis&logoColor=white)](https://docs.bullmq.io/)
[![Claude](https://img.shields.io/badge/Claude-Anthropic-D97757?style=flat-square&logo=anthropic&logoColor=white)](https://www.anthropic.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Dev Container](https://img.shields.io/badge/Dev_Container-ready-0db7ed?style=flat-square&logo=visualstudiocode&logoColor=white)](.devcontainer/devcontainer.json)
[![Node](https://img.shields.io/badge/Node-24-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)

[**Características**](#características) ·
[**Arquitectura**](#arquitectura) ·
[**Empezar**](#puesta-en-marcha-desarrollo) ·
[**Endpoints**](#endpoints-principales) ·
[**Contribuir**](CONTRIBUTING.md)

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
```

---

## Variables de entorno principales

| Variable | Descripción | Por defecto |
|---|---|---|
| `DATABASE_URL` | Conexión PostgreSQL | — |
| `REDIS_HOST` / `REDIS_PORT` | BullMQ / Redis | `localhost` / `6379` |
| `AI_PROVIDER` | `mock` o `anthropic` | `mock` |
| `ANTHROPIC_API_KEY` | Clave de Claude (solo si `AI_PROVIDER=anthropic`) | — |
| `AI_MODEL` | Modelo a usar | `claude-sonnet-4-6` |
| `AI_AUTO_QUEUE_MIN_SCORE` | Umbral de auto-encolado de IA | `80` |
| `CORS_ORIGIN` | Origen permitido | `http://localhost:5173` |

Lista completa en [`.env.example`](.env.example).

---

## 🧰 Scripts

<table>
<tr><th>Backend (<code>backend/</code>)</th><th>Frontend (<code>frontend/</code>)</th></tr>
<tr><td>

| Script | Acción |
|---|---|
| `npm run start:dev` | Hot-reload |
| `npm test` | Tests (Jest, mockeados) |
| `npm run lint` | ESLint + fix |
| `npm run build` | Compila a `dist/` |
| `npm run seed` | Seed offline (3 batallas) |
| `npm run ingest -- <spec>` | Ingesta desde Wikidata |
| `npm run pregen` | Pre-genera narrativas de IA |

</td><td>

| Script | Acción |
|---|---|
| `npm run dev` | Servidor Vite |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run preview` | Previsualiza el build |

</td></tr>
</table>

---

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

## 🤝 Contribuir

Las contribuciones son bienvenidas. El entorno está empaquetado en un
**DevContainer** para que arranques sin fricción: lee
[`CONTRIBUTING.md`](CONTRIBUTING.md) para el flujo de ramas, convenciones y
comandos.

## 🚢 Despliegue

Guía paso a paso en Hetzner en
[`DESPLIEGUE-HETZNER.md`](DESPLIEGUE-HETZNER.md).

## 📄 Licencia

Ver [`LICENSE.md`](LICENSE.md).

---

<div align="center">
<sub>Bellum Atlas — proyecto divulgativo y educativo. Datos de Wikipedia/Wikidata bajo sus respectivas licencias.</sub>
</div>
