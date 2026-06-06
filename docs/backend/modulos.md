# Módulos NestJS

El dominio se centra en **batallas**. Cada módulo accede a la base de datos a
través de `PrismaModule`.

---

## `PrismaModule`

Wrapper singleton del cliente Prisma (`prisma/prisma.service.ts`), global.

## `BattleModule`

Lectura de batallas.

| Endpoint | Método | Descripción |
|---|---|---|
| `/battles` | GET | Listado paginado con búsqueda y filtros (años, importancia, bbox) |
| `/battles/points` | GET | Puntos ligeros para el mapa (capado a 10.000) |
| `/battles/:id` | GET | Ficha de una batalla por id o slug |

El rango de años (`yearMin`/`yearMax`) está limitado a **150 años** (ver
[API Reference](api.md)).

## `AiModule`

Narrativa por IA (Premium), precomputada en background. Ver [IA (LLM)](ia.md).

| Endpoint | Método | Descripción |
|---|---|---|
| `/battles/:id/ai-story` | GET | Historia IA (200 si existe, 202 si se encola). Requiere JWT premium. |

Incluye el worker BullMQ (`AiProcessor`), la cola (`AiQueueService`) y el
servicio de LLM (`LlmService`, mock o Anthropic).

## `AuthModule`

Auth ligera basada en JWT con claim `tier` (`free`/`premium`). Sin gestión de
usuarios todavía.

| Endpoint | Método | Descripción |
|---|---|---|
| `/auth/dev-token` | POST | Sólo dev: emite un JWT con el tier pedido |

## `IngestionModule`

Pipeline de ingesta desde Wikidata + Wikipedia (no expone HTTP; se usa por CLI
`npm run ingest`). Ver [Ingesta](ingesta.md).

## `HealthController`

`GET /health` — estado del servicio y conectividad con la base de datos.
