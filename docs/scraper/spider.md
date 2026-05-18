# Spider de Wikipedia

**Archivo**: `scraper/ares/ares/spiders/wikipedia.py`

El spider `wikipedia` extrae datos de batallas, guerras y comandantes históricos navegando categorías de Wikipedia de forma recursiva. Soporta artículos en español e inglés.

---

## Modo de operación

El spider tiene dos modos según el tipo de URL de entrada:

| Tipo de URL | Comportamiento |
|---|---|
| URL de artículo (`/wiki/Batalla_del_Ebro`) | Parsea el artículo directamente |
| URL de categoría (`/wiki/Categoría:Batallas`) | Navega todos los artículos y subcategorías recursivamente |

El tipo de entidad (`battle` / `war` / `commander`) lo determina la lista en la que aparece la URL, **no** el contenido de la página.

---

## Puntos de entrada

```python
battle_start_urls = [
    # Categorías españolas
    'https://es.wikipedia.org/wiki/Categor%C3%ADa:Batallas',
    # Categorías inglesas
    'https://en.wikipedia.org/wiki/Category:Battles_by_century',
    'https://en.wikipedia.org/wiki/Category:Naval_battles',
]

war_start_urls = [
    'https://es.wikipedia.org/wiki/Categor%C3%ADa:Conflictos_armados',
    'https://en.wikipedia.org/wiki/Category:Wars_by_century',
]

commander_start_urls = [
    'https://es.wikipedia.org/wiki/Categor%C3%ADa:Militares_de_Espa%C3%B1a',
    'https://en.wikipedia.org/wiki/Category:Military_commanders',
]
```

`start_requests()` detecta automáticamente si cada URL es una categoría o un artículo y la enruta al callback correspondiente.

---

## Rastreo de categorías

### `parse_category(response)`

Navega una página de categoría de Wikipedia siguiendo tres patrones:

```
┌─────────────────────────────────────────────────────────┐
│  Categoría:Batallas                                     │
│                                                         │
│  Subcategorías                          ← #mw-subcategories
│  ├── Batallas del siglo XVIII                           │
│  ├── Batallas de la Segunda Guerra Mundial              │
│  └── Batallas navales                                   │
│                                                         │
│  Artículos                              ← #mw-pages    │
│  ├── Batalla de Lepanto                                 │
│  ├── Batalla de Trafalgar                               │
│  └── ...                                               │
│                                                         │
│  [página siguiente]                     ← paginación   │
└─────────────────────────────────────────────────────────┘
```

1. **Artículos** — Sigue todos los enlaces en `#mw-pages .mw-category a`, filtrando namespaces no-artículo.
2. **Subcategorías** — Sigue `#mw-subcategories .mw-category a` hasta `MAX_SUBCATEGORY_DEPTH = 2` niveles.
3. **Paginación** — Sigue el enlace "página siguiente" / "next page" del bloque `#mw-pages`.

El `item_callback` (qué parser usar) y la profundidad actual se propagan a través del dict `meta` de Scrapy:

```python
yield response.follow(
    href,
    callback=self.parse_category,
    meta={'item_callback': item_callback, 'depth': depth + 1},
)
```

### Filtrado de namespaces

Para evitar seguir páginas de administración de Wikipedia:

```python
_SKIP_PREFIXES = (
    'Wikipedia:', 'Ayuda:', 'Help:', 'Portal:', 'Especial:', 'Special:',
    'Usuario:', 'User:', 'Discusión:', 'Talk:', 'Archivo:', 'File:',
    'MediaWiki:', 'Plantilla:', 'Template:', 'Módulo:', 'Module:',
)
```

`_is_article_url(path)` devuelve `True` solo si el path comienza con `/wiki/` y el título no empieza por ninguno de estos prefijos.

---

## Soporte bilingüe (ES / EN)

El spider detecta el idioma por dominio y usa el mapa de claves correcto para extraer campos de la infobox:

| Campo lógico | Clave ES | Clave EN |
|---|---|---|
| `date` | `Fecha` | `Date` |
| `place` | `Lugar` | `Location`, `Place` |
| `result` | `Resultado` | `Result`, `Outcome` |
| `belligerents` | `Beligerantes` | `Belligerents`, `Combatants` |
| `commanders` | `Comandantes` | `Commanders`, `Leaders` |
| `strength` | `Fuerzas en combate`, `Fuerzas` | `Strength`, `Forces` |
| `casualties` | `Bajas`, `Víctimas` | `Casualties`, `Losses` |
| `birth` | `Nacimiento`, `Fecha de nacimiento` | `Born`, `Birth date` |
| `death` | `Fallecimiento`, `Fecha de fallecimiento` | `Died`, `Death date` |
| `allegiance` | `Lealtad`, `País` | `Allegiance`, `Country` |

---

## Métodos de parseo

### `parse_battle(response)` → `BattleItem`

```python
item['type']         = 'battle'
item['title']        = response.css('h1 span.mw-page-title-main::text').get()
item['wikipediaUrl'] = response.url
item['imageUrl']     = self._image(response)
item['dateText']     = self._get(data, k['date'])
item['place']        = self._get(data, k['place'])
item['coordinates']  = self._get(data, k['coordinates'])
item['result']       = self._get(data, k['result'])
item['belligerents'] = self._two_columns(response, k['belligerents'])
item['commanders']   = self._two_columns(response, k['commanders'])
item['strength']     = self._two_columns(response, k['strength'])
item['casualties']   = self._two_columns(response, k['casualties'])
```

### `parse_war(response)` → `WarItem`

Igual que `parse_battle` pero sin `strength` y añade `description` (primer párrafo del artículo):

```python
item['type']        = 'war'
item['description'] = self._first_paragraph(response)
# El resto igual que parse_battle, sin strength
```

### `parse_commander(response)` → `CommanderItem`

```python
item['type']      = 'commander'
item['name']      = response.css('h1 span.mw-page-title-main::text').get()
item['country']   = self._get(data, k['allegiance'])
item['birthYear'] = _extract_year(self._get(data, k['birth']))
item['deathYear'] = _extract_year(self._get(data, k['death']))
item['description'] = self._first_paragraph(response)
```

---

## Helpers internos

### `_two_columns(response, section_keys)` → `{side1, side2} | None`

Las infoboxes de batallas y guerras tienen secciones de dos columnas para beligerantes y comandantes:

```
┌─────────────────────────────────────────┐
│             Beligerantes                │  ← th.section
├──────────────────────┬──────────────────┤
│  República Española  │  Bando sublevado │  ← td td (fila i+2)
└──────────────────────┴──────────────────┘
```

Acepta una lista de claves para buscar la sección en cualquier idioma.

### `_infobox_data(response)` → `dict`

Itera todas las filas `<tr>` de `table.infobox` y construye un dict `{th_text: td_text}`. Esto cubre las filas simples de clave-valor.

### `_first_paragraph(response)` → `str | None`

Extrae el primer párrafo del cuerpo del artículo con más de 80 caracteres. Trunca a 500 caracteres.

### `_image(response)` → `str | None`

Extrae la URL de la imagen principal de la infobox y la normaliza a `https://` (Wikipedia sirve algunas URLs como `//upload.wikimedia.org/...`).

### `_extract_year(text)` → `int | None`

Extrae el primer año de 4 dígitos. Ejemplo: `"17 de diciembre de 1892, El Ferrol"` → `1892`.

---

## Ejecutar el spider

```bash
# Crawl completo de categorías
cd scraper/ares
BACKEND_URL=http://localhost:3000 SCRAPER_API_KEY=secret scrapy crawl wikipedia

# Artículo individual (sin modificar start_urls)
scrapy crawl wikipedia -s CLOSESPIDER_ITEMCOUNT=1 \
  -a start_urls=https://es.wikipedia.org/wiki/Batalla_del_Ebro

# Con caché HTTP (no re-descarga páginas ya vistas)
SCRAPY_HTTPCACHE=1 scrapy crawl wikipedia

# Ver ajuste de throttle en tiempo real
scrapy crawl wikipedia --loglevel DEBUG 2>&1 | grep Crawled
```

!!! tip "Prueba con una sola categoría"
    Añade `CLOSESPIDER_PAGECOUNT=50` para limitar el crawl durante desarrollo:
    ```bash
    scrapy crawl wikipedia -s CLOSESPIDER_PAGECOUNT=50
    ```
