# API Reference

Base URL: `http://localhost:3000` (desarrollo) / `https://api.bellumatlas.com` (producción)

---

## Batallas

### `GET /battles`

Listado paginado con búsqueda y filtros.

**Query params**:

| Param | Tipo | Descripción |
|---|---|---|
| `search` | string | Búsqueda por nombre (substring) |
| `yearMin` / `yearMax` | number | Rango de años (Int) |
| `minImportance` | number | `importanceScore` mínimo (0-100) |
| `bboxN`/`bboxS`/`bboxE`/`bboxW` | number | Bounding box geográfico |
| `page` | number | Página (default: 1) |
| `pageSize` | number | Items por página (default: 20, max: 50) |

!!! warning "Límite de rango: 150 años"
    Si se envían **ambos** `yearMin` y `yearMax`, el lapso no puede superar
    **150 años**; en otro caso la API responde `400 Bad Request`. Evita
    consultas que devuelvan miles de batallas y ralenticen el cliente.

**Ejemplo**:
```
GET /battles?search=Waterloo&yearMin=1750&yearMax=1850&page=1&pageSize=20
```

**Respuesta** `200 OK`: `{ data: BattleSummary[], meta: { total, page, pageSize, totalPages } }`.

---

### `GET /battles/points`

Puntos ligeros para el mapa (sin paginar, capado a 10.000). Mismos filtros que
`GET /battles` y **el mismo límite de 150 años** en el rango. Pensado para que
el mapa cargue siempre una ventana temporal acotada.

```
GET /battles/points?yearMin=1850&yearMax=2000
```

---

### `GET /battles/:id`

Ficha de una batalla por id o slug.

**Respuesta** `200 OK`:
```json
{
  "id": "uuid",
  "name": "Batalla de Trafalgar",
  "slug": "batalla-de-trafalgar",
  "year": 1805,
  "startYear": null,
  "endYear": null,
  "latitude": 36.28,
  "longitude": -6.27,
  "imageUrl": "https://upload.wikimedia.org/.../800px-Trafalgar-Auguste_Mayer.jpg",
  "wikipediaUrl": "https://es.wikipedia.org/wiki/Batalla_de_Trafalgar",
  "summary": "La batalla de Trafalgar fue una batalla naval…",
  "type": "BATTLE",
  "importanceScore": 78,
  "hasAiStory": false
}
```

---

## IA (Premium)

### `GET /battles/:id/ai-story`

Narrativa generada por IA. Requiere **JWT con tier premium** (`Authorization:
Bearer …`). Ver [IA (LLM)](ia.md).

- `200 OK` → `{ summary, context, outcome, curiosities, modelUsed, generatedAt }`
- `202 Accepted` → `{ status: "pending", queuePosition? }` (se encoló; nunca
  llama al LLM en línea)
- `401` sin token · `403` con tier free

---

## Autenticación

### `POST /auth/dev-token`

Sólo en `NODE_ENV=development`. Emite un JWT con el tier pedido para probar el
gating Premium.

```json
{ "tier": "premium" }   // o "free"
```
Respuesta: `{ "token": "eyJ…", "tier": "premium" }`.

---

## Health

### `GET /health`

Estado del servicio y conectividad con la base de datos.
