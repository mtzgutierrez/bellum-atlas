# API Reference

Base URL: `http://localhost:3000` (desarrollo) / `https://api.arescodex.com` (producción)

---

## Batallas

### `GET /battles`

Listado paginado con búsqueda y filtros.

**Query params**:

| Param | Tipo | Descripción |
|---|---|---|
| `q` | string | Búsqueda full-text |
| `era` | string | Slug de era (`ancient`, `medieval`, `modern`…) |
| `result` | string | `victory` \| `defeat` \| `draw` \| `inconclusive` |
| `type` | string | `land` \| `naval` \| `air` \| `siege` |
| `country` | string | País involucrado |
| `page` | number | Página (default: 1) |
| `limit` | number | Items por página (default: 20, max: 100) |
| `sortBy` | string | `date` \| `name` \| `casualties` (default: `date`) |

**Ejemplo**:
```
GET /battles?q=Waterloo&result=victory&page=1&limit=20
```

**Respuesta** `200 OK`:
```json
{
  "data": [
    {
      "id": "clx...",
      "name": "Batalla de Waterloo",
      "date": "1815-06-18",
      "result": "victory",
      "war": { "id": "...", "name": "Guerra de los Cien Días" },
      "location": { "name": "Waterloo", "country": "Bélgica", "lat": 50.68, "lon": 4.41 }
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
}
```

---

### `GET /battles/:id`

Ficha completa de una batalla.

**Respuesta** `200 OK`:
```json
{
  "id": "clx...",
  "name": "Batalla de Waterloo",
  "date": "1815-06-18",
  "result": "victory",
  "description": "...",
  "wikipediaUrl": "https://es.wikipedia.org/wiki/Batalla_de_Waterloo",
  "war": { "id": "...", "name": "Guerra de los Cien Días" },
  "location": { "lat": 50.68, "lon": 4.41, "name": "Waterloo", "country": "Bélgica" },
  "factions": [
    {
      "name": "Séptima Coalición",
      "role": "attacker",
      "result": "victory",
      "estimatedCasualties": 22000,
      "commanders": [{ "id": "...", "name": "Arthur Wellesley" }]
    }
  ],
  "relatedBattles": [...]
}
```

---

## Guerras

### `GET /wars`

```
GET /wars?q=napoleonicas&page=1&limit=20
```

### `GET /wars/:id`

Devuelve la ficha de guerra con la lista de batallas ordenadas cronológicamente y estadísticas agregadas (`totalBattles`, `totalCasualties`, `durationDays`).

---

## Comandantes

### `GET /commanders/:id`

```json
{
  "id": "...",
  "name": "Arthur Wellesley",
  "country": "Reino Unido",
  "birthYear": 1769,
  "deathYear": 1852,
  "battles": [
    { "id": "...", "name": "Batalla de Waterloo", "date": "1815-06-18", "personalResult": "victory" }
  ],
  "stats": { "total": 24, "victories": 19, "winRate": 0.79 }
}
```

---

## Autenticación

### `POST /auth/register`

```json
{ "email": "user@example.com", "password": "password123" }
```

### `POST /auth/login`

```json
{ "email": "user@example.com", "password": "password123" }
```

Respuesta:
```json
{ "access_token": "eyJ..." }
```

El `refresh_token` se establece automáticamente en una cookie `httpOnly`.

---

## Internal (solo scraper)

### `POST /internal/scraper/battle`

**Headers**: `x-api-key: <SCRAPER_API_KEY>`

**Body**: objeto `WikipediaItem` normalizado. Hace `upsert` por `wikipediaUrl`.
