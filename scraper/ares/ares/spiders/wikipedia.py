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

        image_url = response.css("table.infobox a.mw-file-description img::attr(src)").get()

        item = WikipediaItem()
        item["type"]         = "battle"
        item["title"]        = response.css("h1 span.mw-page-title-main::text").get()
        item["wikipediaUrl"] = response.url
        item["imageUrl"]     = f"https:{image_url}" if image_url and image_url.startswith("//") else image_url
        item["dateText"]     = datos.get("Fecha")
        item["place"]        = datos.get("Lugar")
        item["coordinates"]  = datos.get("Coordenadas")
        item["result"]       = datos.get("Resultado")
        item["belligerents"] = self._extract_two_column_section(response, "Beligerantes")
        item["commanders"]   = self._extract_two_column_section(response, "Comandantes")
        item["strength"]     = self._extract_two_column_section(response, "Fuerzas")
        item["casualties"]   = self._extract_two_column_section(response, "Bajas")

        yield item
