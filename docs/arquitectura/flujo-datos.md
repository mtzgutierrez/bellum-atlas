# Flujo de datos

Cómo viajan los datos desde Wikidata/Wikipedia hasta la pantalla.

---

## 1. Ingesta (Wikidata/Wikipedia → BD)

```mermaid
sequenceDiagram
    participant CLI as npm run ingest
    participant WD as Wikidata SPARQL
    participant WP as Wikipedia REST
    participant BE as IngestionService
    participant DB as PostgreSQL

    CLI->>BE: battle:Qxxx / all-battles
    BE->>WD: datos (años, coords, tipo, sitelinks)
    BE->>WP: extract + imagen (es->en)
    BE->>DB: upsert Battle (por wikidataId)
    BE->>BE: encola IA si importanceScore > 80
```

---

## 2. Consulta (Frontend → API → BD)

```mermaid
sequenceDiagram
    participant US as Usuario
    participant FE as React
    participant BE as Backend
    participant DB as PostgreSQL

    US->>FE: Mueve el timeline / busca
    FE->>BE: GET /battles/points?yearMin&yearMax
    BE->>DB: SELECT con filtros (ventana <=150 anios)
    DB-->>BE: puntos
    BE-->>FE: JSON
    FE-->>US: pins en el mapa
```

---

## 3. Narrativa por IA (background)

El usuario Premium pide `GET /battles/:id/ai-story`: si existe, 200; si no, 202
y se **encola**. El worker genera con el LLM y guarda en `BattleAISummary`
(cache permanente). Detalle en [IA (LLM)](../backend/ia.md).
