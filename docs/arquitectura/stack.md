# Stack tecnológico

## Resumen

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend | React + Vite | SPA, sin SSR |
| Mapas | Leaflet + tiles CARTO/OSM | Ligero, sin coste ni token |
| Backend | NestJS | Módulos por dominio, DI nativa, TypeScript |
| ORM | Prisma | Migraciones tipadas, cliente generado |
| Base de datos | PostgreSQL | Coordenadas como `Float`; filtros por bbox |
| Cola / Caché | BullMQ + Redis | Jobs de generación de IA |
| IA | Anthropic Claude (o mock) | Narrativa precomputada por workers |
| Auth | JWT (`@nestjs/jwt`) | Claim `tier` free/premium |
| Ingesta | Wikidata SPARQL + Wikipedia REST | Datos, imagen y resumen |
| Infra (dev) | Docker Compose | Un comando levanta todo |

---

## Decisiones relevantes

### Coordenadas como `Float` (sin PostGIS)
El modelo simplificado no necesita geometría: las búsquedas del mapa son por
*bounding box* sobre un índice `(latitude, longitude)`. Suficiente para los pins
y mucho más simple de operar.

### BullMQ + Redis para la IA
La narrativa por IA se genera en background (nunca en una request) y se cachea
de forma permanente. Las colas dan reintentos y visibilidad. Ver
[IA (LLM)](../backend/ia.md).

### Imagen y resumen desde Wikipedia
La `P18` de Wikidata puede ser un `.tiff`/`.svg` no renderizable; la REST de
Wikipedia siempre da una imagen web y el `extract`. Ver
[Ingesta](../backend/ingesta.md).

### Leaflet en vez de Mapbox
Sin token ni límites de plan; los tiles oscuros de CARTO encajan con el diseño.
