# Flujo de datos

Cómo viajan los datos desde Wikipedia hasta la pantalla del usuario.

---

## 1. Extracción (Scraper → Backend)

```mermaid
sequenceDiagram
    participant SP as 🕷️ Spider
    participant WP as Wikipedia
    participant PL as ⚙️ BackendPipeline
    participant BE as 🖥️ Backend API
    participant DB as 🐘 PostgreSQL

    SP->>WP: GET /wiki/Batalla_del_Ebro
    WP-->>SP: HTML con infobox
    SP->>SP: Parsear infobox (CSS selectors)
    SP->>SP: Construir WikipediaItem
    SP->>PL: yield item
    PL->>PL: Construir payload JSON
    PL->>BE: POST /internal/scraper/battle\n(header: x-api-key)
    BE->>BE: Validar + upsert por wikipediaUrl
    BE->>DB: INSERT / UPDATE batalla
    BE-->>PL: 200 OK { id, slug }
```

### Deduplicación

El endpoint `/internal/scraper/battle` hace un **upsert por `wikipediaUrl`**. Si la batalla ya existe en la BD, actualiza sus campos en lugar de crear un duplicado. Esto permite re-ejecutar el scraper sin problemas.

---

## 2. Consulta (Frontend → API → BD)

```mermaid
sequenceDiagram
    participant US as 👤 Usuario
    participant FE as ⚛️ React Frontend
    participant BE as 🖥️ Backend API
    participant DB as 🐘 PostgreSQL

    US->>FE: Busca "Waterloo resultado victoria"
    FE->>BE: GET /battles?q=Waterloo&result=victory
    BE->>DB: SELECT con filtros
    DB-->>BE: Filas resultantes
    BE-->>FE: JSON paginado { data[], meta }
    FE-->>US: Tarjetas con resultados
```

---

## 3. Normalización del scraper

Los datos de Wikipedia llegan en texto libre. El spider hace una primera normalización, y el resto queda pendiente para futuras iteraciones del pipeline:

| Campo | Raw (Wikipedia) | Estado actual | Normalización futura |
|---|---|---|---|
| Fecha | `"18 de junio de 1815"` | Se envía como `dateText` | Parsear a ISO 8601 → campo `date` |
| Coordenadas | `"43°N 2°E"` | Se envía como texto raw | Convertir DMS a `{ lat, lon }` WGS84 |
| Bajas | `"40.000–45.000"` | Se envía como texto raw | Extraer `{ min, max }` enteros |
| Image URL | `//upload.wikimedia.org/…` | Se normaliza a `https://` ✅ | — |

---

## 4. Seguridad del endpoint interno

El endpoint `/internal/scraper/*` está protegido por un guard de API key:

```
POST /internal/scraper/battle
Header: x-api-key: <SCRAPER_API_KEY>
```

Si la cabecera no está presente o no coincide con la variable de entorno `SCRAPER_API_KEY` del backend, la petición se rechaza con HTTP 401.
