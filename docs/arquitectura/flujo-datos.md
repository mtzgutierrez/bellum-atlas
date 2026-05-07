# Flujo de datos

Cómo viajan los datos desde Wikipedia hasta la pantalla del usuario.

---

## 1. Extracción (Scraper → API)

```mermaid
sequenceDiagram
    participant SC as Scrapy Spider
    participant WP as Wikipedia
    participant NM as Nominatim
    participant BE as Backend API

    SC->>WP: GET /wiki/Batalla_del_Ebro
    WP-->>SC: HTML con infobox
    SC->>SC: Parsear infobox (BeautifulSoup)
    SC->>SC: Normalizar fechas, bajas, coordenadas

    alt Sin coordenadas en infobox
        SC->>NM: GET /search?q=Batalla+del+Ebro
        NM-->>SC: lat, lon
    end

    SC->>BE: POST /internal/scraper/battle (API_KEY)
    BE->>BE: Validar + deduplicar
    BE->>BE: Persistir en PostgreSQL
    BE-->>SC: 201 Created
```

---

## 2. Consulta (Frontend → API → BD)

```mermaid
sequenceDiagram
    participant US as Usuario
    participant FE as React Frontend
    participant BE as Backend API
    participant RD as Redis Cache
    participant DB as PostgreSQL

    US->>FE: Busca "Waterloo resultado victoria"
    FE->>BE: GET /battles?q=Waterloo&result=victory
    BE->>RD: Cache hit?

    alt Cache hit
        RD-->>BE: Resultados cacheados
    else Cache miss
        BE->>DB: SELECT con tsvector + filtros
        DB-->>BE: Filas resultantes
        BE->>RD: Guardar en cache (TTL 5min)
    end

    BE-->>FE: JSON paginado
    FE-->>US: Tarjetas con resultados
```

---

## 3. Normalización del scraper

El spider aplica estas transformaciones antes de enviar datos a la API:

| Campo | Raw (Wikipedia) | Normalizado |
|---|---|---|
| Fecha | `"18 de junio de 1815"` | `1815-06-18` (ISO 8601) |
| Bajas | `"40.000–45.000"` | `{ min: 40000, max: 45000 }` |
| Coordenadas | `"43°N 2°E"` | `{ lat: 43.0, lon: 2.0 }` (WGS84) |

---

## 4. Deduplicación

El backend evita duplicados en dos niveles:

1. **Redis set**: el scraper registra cada URL procesada. Las URLs ya vistas se saltan sin petición.
2. **Upsert en BD**: el endpoint `/internal/scraper/battle` hace `upsert` por `wikipediaUrl`. Si la batalla ya existe, actualiza los campos en lugar de crear un duplicado.
