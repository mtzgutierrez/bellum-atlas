# Items y campos

**Archivo**: `scraper/ares/ares/items.py`

---

## `WikipediaItem`

```python
class WikipediaItem(scrapy.Item):
    type         = scrapy.Field()  # siempre "battle" en MVP
    title        = scrapy.Field()  # nombre extraído del <h1>
    wikipediaUrl = scrapy.Field()  # URL canónica del artículo — clave de upsert
    imageUrl     = scrapy.Field()  # URL absoluta de la imagen principal de la infobox
    dateText     = scrapy.Field()  # fecha raw, ej: "18 de junio de 1815"
    place        = scrapy.Field()  # lugar raw, ej: "Waterloo, Bélgica"
    coordinates  = scrapy.Field()  # coordenadas raw, ej: "50°41′N 4°25′E"
    result       = scrapy.Field()  # resultado raw
    belligerents = scrapy.Field()  # { side1: str, side2: str }
    commanders   = scrapy.Field()  # { side1: str, side2: str }
    strength     = scrapy.Field()  # { side1: str, side2: str }
    casualties   = scrapy.Field()  # { side1: str, side2: str }
```

---

## Descripción de campos

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `type` | `string` | Sí | Tipo de entidad. `"battle"` en MVP. |
| `title` | `string` | Sí | Nombre extraído del `<h1>` del artículo. |
| `wikipediaUrl` | `string` | Sí | URL canónica. Es la **clave de upsert** en el backend — si ya existe una batalla con esa URL, se actualiza en lugar de crear un duplicado. |
| `imageUrl` | `string \| None` | No | URL absoluta (`https://`) de la imagen principal de la infobox. El spider normaliza las URLs relativas `//upload.wikimedia.org/…`. |
| `dateText` | `string \| None` | No | Fecha raw tal como aparece en la infobox, ej: `"25 de julio-16 de noviembre de 1938"`. |
| `place` | `string \| None` | No | Lugar raw, ej: `"Tierra Alta y río Ebro, Tarragona, España"`. |
| `coordinates` | `string \| None` | No | Coordenadas raw en formato DMS, ej: `"41°09′50″N 0°28′30″E"`. Pendiente de normalización a WGS84 decimal. |
| `result` | `string \| None` | No | Resultado raw, ej: `"Victoria decisiva sublevada"`. |
| `belligerents` | `object \| None` | No | Bandos enfrentados. `{ side1, side2 }` con los nombres separados por `\|`. |
| `commanders` | `object \| None` | No | Comandantes de cada bando. `{ side1, side2 }`. |
| `strength` | `object \| None` | No | Efectivos de cada bando. `{ side1, side2 }`. |
| `casualties` | `object \| None` | No | Bajas de cada bando. `{ side1, side2 }`. |

---

## Ejemplo de item completo

```json
{
  "type": "battle",
  "title": "Batalla del Ebro",
  "wikipediaUrl": "https://es.wikipedia.org/wiki/Batalla_del_Ebro",
  "imageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Forces_of_the_Spanish_Government_Crossing_the_Ebro.jpg/330px-Forces.jpg",
  "dateText": "25 de julio-16 de noviembre de 1938",
  "place": "Tierra Alta y río Ebro, Tarragona, España",
  "coordinates": "41°09′50″N 0°28′30″E",
  "result": "Victoria inicial republicana / Victoria decisiva sublevada",
  "belligerents": {
    "side1": "República Española | Brigadas Internacionales",
    "side2": "Bando sublevado | Alemania nazi | Reino de Italia"
  },
  "commanders": {
    "side1": "Vicente Rojo Lluch | Juan Modesto | Enrique Líster",
    "side2": "Francisco Franco | Fidel Dávila | Juan Yagüe"
  },
  "strength": {
    "side1": "100.000-130.000 hombres | 250 piezas de artillería",
    "side2": "98.000-185.000 hombres | 550 piezas de artillería"
  },
  "casualties": {
    "side1": "46.713 bajas totales",
    "side2": "41.500 bajas totales"
  }
}
```

---

## Normalización pendiente

Los siguientes campos se envían raw al backend por ahora. En futuras iteraciones se normalizarán en el pipeline antes del envío:

| Campo | Estado | Transformación pendiente |
|---|---|---|
| `dateText` | Raw → backend | Parsear a ISO 8601 para poblar el campo `date` |
| `coordinates` | Raw → backend | Convertir DMS a `{ lat, lon }` WGS84 decimal |
| `casualties` | Raw → backend | Extraer rangos numéricos `{ min, max }` |
