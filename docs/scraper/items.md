# Items y campos

**Archivo**: `scraper/ares/ares/items.py`

El scraper define tres clases de item, una por tipo de entidad. El campo `type` identifica el item y el pipeline lo usa para enrutar al endpoint correcto del backend.

---

## `BattleItem`

```python
class BattleItem(scrapy.Item):
    type         = scrapy.Field()  # "battle"
    title        = scrapy.Field()  # nombre extraído del <h1>
    wikipediaUrl = scrapy.Field()  # URL canónica — clave de upsert
    imageUrl     = scrapy.Field()  # URL absoluta de la imagen principal
    dateText     = scrapy.Field()  # fecha raw, ej: "18 de junio de 1815"
    place        = scrapy.Field()  # lugar raw
    coordinates  = scrapy.Field()  # coordenadas raw DMS
    result       = scrapy.Field()  # resultado raw
    belligerents = scrapy.Field()  # { side1: str, side2: str }
    commanders   = scrapy.Field()  # { side1: str, side2: str }
    strength     = scrapy.Field()  # { side1: str, side2: str }
    casualties   = scrapy.Field()  # { side1: str, side2: str }
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `type` | `"battle"` | Sí | Discriminador de tipo. |
| `title` | `string` | Sí | Nombre de la batalla. |
| `wikipediaUrl` | `string` | Sí | **Clave de upsert** en el backend. |
| `imageUrl` | `string\|None` | No | URL absoluta `https://` de la imagen de la infobox. |
| `dateText` | `string\|None` | No | Fecha raw. Ej: `"25 de julio-16 de noviembre de 1938"`. |
| `place` | `string\|None` | No | Lugar raw. Ej: `"Tierra Alta, Tarragona, España"`. |
| `coordinates` | `string\|None` | No | Coordenadas raw DMS (pendiente de normalizar). |
| `result` | `string\|None` | No | Resultado raw. |
| `belligerents` | `{side1,side2}\|None` | No | Beligerantes por bando, separados por `\|`. |
| `commanders` | `{side1,side2}\|None` | No | Comandantes por bando. |
| `strength` | `{side1,side2}\|None` | No | Efectivos por bando. |
| `casualties` | `{side1,side2}\|None` | No | Bajas por bando. |

---

## `WarItem`

```python
class WarItem(scrapy.Item):
    type         = scrapy.Field()  # "war"
    title        = scrapy.Field()  # nombre extraído del <h1>
    wikipediaUrl = scrapy.Field()  # URL canónica — clave de upsert
    imageUrl     = scrapy.Field()  # URL absoluta de la imagen principal
    dateText     = scrapy.Field()  # rango de fechas raw, ej: "1936–1939"
    place        = scrapy.Field()  # lugar raw
    coordinates  = scrapy.Field()  # coordenadas raw DMS
    result       = scrapy.Field()  # resultado raw
    description  = scrapy.Field()  # primer párrafo del artículo
    belligerents = scrapy.Field()  # { side1: str, side2: str }
    commanders   = scrapy.Field()  # { side1: str, side2: str }
    casualties   = scrapy.Field()  # { side1: str, side2: str }
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `type` | `"war"` | Sí | Discriminador de tipo. |
| `title` | `string` | Sí | Nombre de la guerra. |
| `wikipediaUrl` | `string` | Sí | **Clave de upsert** en el backend. |
| `dateText` | `string\|None` | No | Rango raw. Ej: `"1936–1939"`. |
| `description` | `string\|None` | No | Primer párrafo del artículo (máx. 500 caracteres). |
| `belligerents` | `{side1,side2}\|None` | No | Bandos enfrentados. |
| `commanders` | `{side1,side2}\|None` | No | Comandantes por bando. |
| `casualties` | `{side1,side2}\|None` | No | Bajas por bando. |

!!! note "Sin `strength`"
    Las guerras no tienen campo de efectivos en el modelo de datos — ese nivel de detalle se registra en cada batalla individual.

---

## `CommanderItem`

```python
class CommanderItem(scrapy.Item):
    type         = scrapy.Field()  # "commander"
    name         = scrapy.Field()  # nombre completo
    wikipediaUrl = scrapy.Field()  # URL canónica — clave de upsert
    imageUrl     = scrapy.Field()  # URL absoluta del retrato
    country      = scrapy.Field()  # lealtad o país principal
    birthYear    = scrapy.Field()  # año de nacimiento (int)
    deathYear    = scrapy.Field()  # año de fallecimiento (int)
    description  = scrapy.Field()  # primer párrafo del artículo
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `type` | `"commander"` | Sí | Discriminador de tipo. |
| `name` | `string` | Sí | Nombre completo extraído del `<h1>`. |
| `wikipediaUrl` | `string` | Sí | **Clave de upsert** en el backend. |
| `imageUrl` | `string\|None` | No | URL absoluta del retrato. |
| `country` | `string\|None` | No | Campo "Lealtad" o "País" de la infobox. |
| `birthYear` | `int\|None` | No | Primer año de 4 dígitos extraído del campo "Nacimiento". |
| `deathYear` | `int\|None` | No | Primer año de 4 dígitos extraído del campo "Fallecimiento". |
| `description` | `string\|None` | No | Primer párrafo del artículo (máx. 500 caracteres). |

---

## Normalización pendiente

| Campo | Estado | Transformación pendiente |
|---|---|---|
| `dateText` (batalla/guerra) | Raw | Parsear a ISO 8601 para poblar `date` / `startDate` + `endDate` |
| `coordinates` | Raw DMS | Convertir a `{ lat, lon }` WGS84 decimal |
| `casualties` | Raw texto | Extraer rangos numéricos `{ min, max }` |
| `country` (comandante) | Raw texto | Normalizar a país canónico |
