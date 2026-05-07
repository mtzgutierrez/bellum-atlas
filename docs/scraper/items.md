# Items y campos

**Archivo**: `scraper/ares/ares/items.py`

---

## `WikipediaItem`

```python
class WikipediaItem(scrapy.Item):
    type         = scrapy.Field()  # "battle" | "war" (futuro)
    title        = scrapy.Field()  # Nombre de la batalla
    imageUrl     = scrapy.Field()  # URL de la imagen de la infobox
    date         = scrapy.Field()  # Fecha en texto raw
    place        = scrapy.Field()  # Lugar en texto raw
    coordinates  = scrapy.Field()  # Coordenadas en texto raw
    result       = scrapy.Field()  # Resultado en texto raw
    belligerents = scrapy.Field()  # { side1: str, side2: str }
    commanders   = scrapy.Field()  # { side1: str, side2: str }
    strength     = scrapy.Field()  # { side1: str, side2: str }
    casualties   = scrapy.Field()  # { side1: str, side2: str }
```

---

## Descripción de campos

| Campo | Tipo | Descripción |
|---|---|---|
| `type` | `string` | Tipo de entidad. `"battle"` en MVP. |
| `title` | `string` | Nombre extraído de `<h1>`. |
| `imageUrl` | `string \| null` | URL relativa de la imagen principal. |
| `date` | `string \| null` | Fecha raw. Ej: `"18 de junio de 1815"`. |
| `place` | `string \| null` | Lugar raw. Ej: `"Waterloo, Bélgica"`. |
| `coordinates` | `string \| null` | Coordenadas raw. Ej: `"50°41′N 4°25′E"`. |
| `result` | `string \| null` | Resultado raw. Ej: `"Victoria de la Séptima Coalición"`. |
| `belligerents` | `object \| null` | Bandos enfrentados por lado. |
| `commanders` | `object \| null` | Comandantes de cada bando. |
| `strength` | `object \| null` | Efectivos de cada bando. |
| `casualties` | `object \| null` | Bajas de cada bando. |

---

## Normalización en pipeline

Los campos raw se normalizan antes de enviarse al backend:

- **`date`** → `DateTime` ISO 8601
- **`coordinates`** → `{ lat: float, lon: float }` WGS84 decimal
- **`casualties.side1/side2`** → `{ min: int, max: int }` o `int`

Si la normalización falla, el campo se envía como `null` y el backend lo marca para revisión manual.
