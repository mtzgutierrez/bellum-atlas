# Spider de Wikipedia

**Archivo**: `scraper/ares/ares/spiders/wikipedia.py`

---

## Código actual

```python
import scrapy
from ares.items import WikipediaItem


class WikipediaSpider(scrapy.Spider):
    name = "wikipedia"
    allowed_domains = ["es.wikipedia.org"]
    start_urls = ["https://es.wikipedia.org/wiki/Batalla_del_Ebro"]

    def _extract_two_column_section(self, response, section_text):
        trs = response.css("table.infobox tr")
        for i, tr in enumerate(trs):
            th_text = tr.css("th.section::text").get()
            if th_text and section_text.lower() in th_text.lower():
                if i + 2 < len(trs):
                    celdas = trs[i + 2].css("td")
                    if len(celdas) >= 2:
                        return {
                            "side1": " | ".join(celdas[0].css("*::text").getall()).strip(),
                            "side2": " | ".join(celdas[1].css("*::text").getall()).strip(),
                        }
        return None

    def parse(self, response):
        datos = {}
        for fila in response.css("table.infobox tbody tr"):
            clave = " ".join(fila.css("th *::text, th::text").getall()).strip()
            valor = " ".join(fila.css("td *::text, td::text").getall()).strip()
            if clave and valor:
                datos[clave] = valor

        item = WikipediaItem()
        item["title"]        = response.css("h1 span.mw-page-title-main::text").get()
        item["imageUrl"]     = response.css("table.infobox a.mw-file-description img::attr(src)").get()
        item["date"]         = datos.get("Fecha")
        item["place"]        = datos.get("Lugar")
        item["coordinates"]  = datos.get("Coordenadas")
        item["result"]       = datos.get("Resultado")
        item["belligerents"] = self._extract_two_column_section(response, "Beligerantes")
        item["commanders"]   = self._extract_two_column_section(response, "Comandantes")
        item["strength"]     = self._extract_two_column_section(response, "Fuerzas")
        item["casualties"]   = self._extract_two_column_section(response, "Bajas")

        yield item
```

---

## Método `_extract_two_column_section`

Las infoboxes de Wikipedia tienen secciones de dos columnas (bando 1 / bando 2) para beligerantes, comandantes, fuerzas y bajas. Este método localiza esas filas por el texto del encabezado y devuelve un diccionario con `side1` y `side2`.

**Ejemplo de salida**:

```json
{
  "belligerents": {
    "side1": "República Española | Ejército Popular",
    "side2": "España Nacional | Legión Cóndor"
  }
}
```

---

## Extender a múltiples páginas (seed masivo)

En el MVP el spider arranca con una sola URL de prueba. Para el seed masivo se amplía con categorías:

```python
start_urls = [
    "https://en.wikipedia.org/wiki/Category:Battles_by_century",
    "https://en.wikipedia.org/wiki/Category:Naval_battles",
    "https://en.wikipedia.org/wiki/Category:Battles_of_World_War_II",
]

def parse_category(self, response):
    for link in response.css("div.mw-category a::attr(href)").getall():
        yield response.follow(link, self.parse)

    next_page = response.css("a:contains('next page')::attr(href)").get()
    if next_page:
        yield response.follow(next_page, self.parse_category)
```

!!! note "Wikipedia en español vs inglés"
    El spider actual apunta a `es.wikipedia.org`. Las infoboxes en inglés usan claves distintas (`Date`, `Location`, `Result`). Para el seed masivo conviene apuntar a la versión en inglés, que tiene más batallas documentadas.
