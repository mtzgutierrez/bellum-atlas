# ⚔ Bellum Atlas

> **Atlas histórico interactivo de batallas.**

Bellum Atlas centraliza datos de batallas históricas en una experiencia visual:
un mapa interactivo, fichas detalladas con imagen y resumen, y una narrativa
generada por IA (Premium) precomputada en background.

---

## ¿Por qué existe Bellum Atlas?

Wikipedia y Wikidata contienen información extraordinaria sobre historia
militar, pero fragmentada. Bellum Atlas la **ingiere**, la estructura y la presenta
como un producto coherente:

- **Mapa global** de batallas georreferenciadas, filtrable por periodo.
- **Fichas atractivas** con imagen (de Wikipedia), resumen, ubicación en
  mini-mapa y batallas de la misma época — útiles incluso sin cuenta.
- **Narrativa por IA (Premium)**: Story Mode, contexto, resultado y
  curiosidades, generadas por un LLM y cacheadas de forma permanente.

---

## Servicios

| Servicio | Tecnología | Rol |
|---|---|---|
| **Backend** | NestJS + Prisma + PostgreSQL + Redis/BullMQ | API REST, ingesta y workers de IA |
| **Frontend** | React + Vite + Leaflet | Interfaz web |

Los datos se cargan con la **ingesta** desde Wikidata/Wikipedia (no hay
scraper): ver [Ingesta](backend/ingesta.md).

---

## Inicio rápido

```bash
git clone https://github.com/tu-usuario/bellum-atlas.git
cd bellum-atlas
cp .env.example .env
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
# poblar la BD:
./backend/scripts/seed.sh                 # 3 batallas offline
./backend/scripts/ingest.sh all-battles   # desde Wikidata/Wikipedia
```

Detalle en [Entorno local](desarrollo/local.md).

---

## Navegación de la documentación

- **[Arquitectura](arquitectura/index.md)** — Diseño, stack y modelo de datos
- **[Backend](backend/index.md)** — Módulos, API, Ingesta e IA
- **[Frontend](frontend/index.md)** — Páginas y mapa interactivo
- **[Desarrollo](desarrollo/local.md)** — Entorno local, Docker y variables
- **[Roadmap](roadmap.md)** — Features planificadas
