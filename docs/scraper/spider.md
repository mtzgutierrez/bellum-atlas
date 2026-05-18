# Spider de Wikipedia

**Archivo**: `scraper/ares/ares/spiders/wikipedia.py`

El spider `wikipedia` extrae datos de artículos de batallas, guerras y comandantes de Wikipedia. Tiene un método de parseo especializado para cada tipo de entidad.

---

## Puntos de entrada

```python
battle_start_urls = [
    'https://es.wikipedia.org/wiki/Batalla_del_Ebro',
]

war_start_urls = [
    'https://es.wikipedia.org/wiki/Guerra_Civil_Espa%C3%B1ola',
]

commander_start_urls = [
    'https://es.wikipedia.org/wiki/Francisco_Franco',
]
```

Cada lista usa el callback correspondiente (`parse_battle`, `parse_war`, `parse_commander`), por lo que el spider puede mezclar los tres tipos en el mismo crawl.

---

## Soporte bilingüe (ES / EN)

El spider detecta el idioma por dominio y usa el mapa de claves correcto para la infobox:

```python
_ES = {
    'date':         ['Fecha'],
    'place':        ['Lugar'],
    'result':       ['Resultado'],
    'belligerents': ['Beligerantes'],
    'commanders':   ['Comandantes'],
    'birth':        ['Nacimiento', 'Fecha de nacimiento'],
    'death':        ['Fallecimiento', 'Fecha de fallecimiento'],
    'allegiance':   ['Lealtad', 'País'],
    ...
}

_EN = {
    'date':         ['Date'],
    'place':        ['Location', 'Place'],
    'result':       ['Result', 'Outcome'],
    'belligerents': ['Belligerents', 'Combatants'],
    'commanders':   ['Commanders', 'Leaders'],
    'birth':        ['Born', 'Birth date'],
    'death':        ['Died', 'Death date'],
    'allegiance':   ['Allegiance', 'Country'],
    ...
}
```

---

## Métodos de parseo

### `parse_battle(response)` → `BattleItem`

Extrae los campos de una infobox de batalla:

```python
item['type']         = 'battle'
item['title']        = response.css('h1 span.mw-page-title-main::text').get()
item['wikipediaUrl'] = response.url
item['imageUrl']     = self._image(response)          # normalizada a https://
item['dateText']     = self._get(data, k['date'])
item['place']        = self._get(data, k['place'])
item['belligerents'] = self._two_columns(response, k['belligerents'])
item['commanders']   = self._two_columns(response, k['commanders'])
item['strength']     = self._two_columns(response, k['strength'])
item['casualties']   = self._two_columns(response, k['casualties'])
```

### `parse_war(response)` → `WarItem`

Similar a `parse_battle` pero sin `strength` y añade `description` (primer párrafo del artículo):

```python
item['type']        = 'war'
item['description'] = self._first_paragraph(response)
# El resto igual que parse_battle (sin strength)
```

### `parse_commander(response)` → `CommanderItem`

Extrae el perfil del comandante desde la infobox de persona:

```python
item['type']      = 'commander'
item['name']      = response.css('h1 span.mw-page-title-main::text').get()
item['country']   = self._get(data, k['allegiance'])   # "Lealtad" en ES
item['birthYear'] = _extract_year(self._get(data, k['birth']))   # 1892
item['deathYear'] = _extract_year(self._get(data, k['death']))   # 1975
item['description'] = self._first_paragraph(response)
```

---

## Helpers internos

### `_two_columns(response, section_keys)` → `{side1, side2} | None`

Las infoboxes tienen secciones de dos columnas para beligerantes y comandantes:

```
┌─────────────────────────────────────────┐
│             Beligerantes                │  ← th.section
├──────────────────────┬──────────────────┤
│  República Española  │  Bando sublevado │  ← td td (i+2)
└──────────────────────┴──────────────────┘
```

Acepta una lista de claves para buscar la sección en cualquier idioma.

### `_first_paragraph(response)` → `str | None`

Extrae el primer párrafo del cuerpo del artículo con más de 80 caracteres. Trunca a 500 caracteres para no sobrecargar el payload.

### `_extract_year(text)` → `int | None`

Extrae el primer año de 4 dígitos del texto de nacimiento/fallecimiento. Ejemplo: `"17 de diciembre de 1892, El Ferrol"` → `1892`.

---

## Ampliar el crawl por categorías

En el MVP los spiders arrancan con una sola URL por tipo. Para un seed masivo, basta con añadir URLs de categorías y usar los callbacks correctos:

```python
battle_start_urls = [
    'https://es.wikipedia.org/wiki/Categor%C3%ADa:Batallas_de_Espa%C3%B1a',
    'https://en.wikipedia.org/wiki/Category:Battles_by_century',
]

war_start_urls = [
    'https://es.wikipedia.org/wiki/Categor%C3%ADa:Guerras_de_Espa%C3%B1a',
    'https://en.wikipedia.org/wiki/Category:Wars_by_century',
]

commander_start_urls = [
    'https://es.wikipedia.org/wiki/Categor%C3%ADa:Militares_de_Espa%C3%B1a',
]
```

Y añadir un método que navegue por la paginación de la categoría:

```python
def parse_category(self, response, item_callback):
    for link in response.css('div.mw-category a::attr(href)').getall():
        yield response.follow(link, callback=item_callback)

    next_page = response.css("a:contains('página siguiente')::attr(href)").get()
    if next_page:
        yield response.follow(next_page, callback=lambda r: self.parse_category(r, item_callback))
```
