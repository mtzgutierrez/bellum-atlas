import re
import scrapy
from ares.items import BattleItem, WarItem, CommanderItem

# ── Claves de infobox por idioma ──────────────────────────────────────────────
# Español
_ES = {
    'date':         ['Fecha'],
    'place':        ['Lugar'],
    'coordinates':  ['Coordenadas'],
    'result':       ['Resultado'],
    'belligerents': ['Beligerantes'],
    'commanders':   ['Comandantes'],
    'strength':     ['Fuerzas en combate', 'Fuerzas'],
    'casualties':   ['Bajas', 'Víctimas'],
    # Commander
    'birth':        ['Nacimiento', 'Fecha de nacimiento'],
    'death':        ['Fallecimiento', 'Fecha de fallecimiento'],
    'allegiance':   ['Lealtad', 'País'],
}

# Inglés
_EN = {
    'date':         ['Date'],
    'place':        ['Location', 'Place'],
    'coordinates':  ['Coordinates'],
    'result':       ['Result', 'Outcome'],
    'belligerents': ['Belligerents', 'Combatants'],
    'commanders':   ['Commanders', 'Leaders'],
    'strength':     ['Strength', 'Forces'],
    'casualties':   ['Casualties', 'Losses'],
    # Commander
    'birth':        ['Born', 'Birth date'],
    'death':        ['Died', 'Death date'],
    'allegiance':   ['Allegiance', 'Country'],
}


def _abs_url(url: str | None) -> str | None:
    """Convierte URLs relativas de Wikimedia a absolutas."""
    if url and url.startswith('//'):
        return f'https:{url}'
    return url


def _extract_year(text: str | None) -> int | None:
    """Extrae el primer año de 4 dígitos que encuentre en el texto."""
    if not text:
        return None
    match = re.search(r'\b(1[0-9]{3}|20[0-9]{2})\b', text)
    return int(match.group()) if match else None


class WikipediaSpider(scrapy.Spider):
    name = 'wikipedia'
    allowed_domains = ['es.wikipedia.org', 'en.wikipedia.org']

    # ── Puntos de entrada ─────────────────────────────────────────────────────

    # Batallas
    battle_start_urls = [
        'https://es.wikipedia.org/wiki/Batalla_del_Ebro',
    ]

    # Guerras
    war_start_urls = [
        'https://es.wikipedia.org/wiki/Guerra_Civil_Espa%C3%B1ola',
    ]

    # Comandantes
    commander_start_urls = [
        'https://es.wikipedia.org/wiki/Francisco_Franco',
    ]

    def start_requests(self):
        for url in self.battle_start_urls:
            yield scrapy.Request(url, callback=self.parse_battle)
        for url in self.war_start_urls:
            yield scrapy.Request(url, callback=self.parse_war)
        for url in self.commander_start_urls:
            yield scrapy.Request(url, callback=self.parse_commander)

    # ── Helpers comunes ───────────────────────────────────────────────────────

    def _infobox_data(self, response) -> dict:
        """Extrae pares clave→valor de la infobox como texto plano."""
        data = {}
        for row in response.css('table.infobox tbody tr'):
            key = ' '.join(row.css('th *::text, th::text').getall()).strip()
            val = ' '.join(row.css('td *::text, td::text').getall()).strip()
            if key and val:
                data[key] = val
        return data

    def _get(self, data: dict, keys: list[str]) -> str | None:
        """Devuelve el primer valor encontrado para cualquiera de las claves."""
        for k in keys:
            if k in data:
                return data[k]
        return None

    def _two_columns(self, response, section_keys: list[str]) -> dict | None:
        """Extrae una sección de dos columnas (bando1 / bando2) de la infobox."""
        trs = response.css('table.infobox tr')
        for i, tr in enumerate(trs):
            th = tr.css('th.section::text').get()
            if th and any(k.lower() in th.lower() for k in section_keys):
                if i + 2 < len(trs):
                    cells = trs[i + 2].css('td')
                    if len(cells) >= 2:
                        return {
                            'side1': ' | '.join(cells[0].css('*::text').getall()).strip(),
                            'side2': ' | '.join(cells[1].css('*::text').getall()).strip(),
                        }
        return None

    def _image(self, response) -> str | None:
        return _abs_url(
            response.css('table.infobox a.mw-file-description img::attr(src)').get()
        )

    def _first_paragraph(self, response) -> str | None:
        """Extrae el primer párrafo del cuerpo del artículo como descripción."""
        for p in response.css('#mw-content-text .mw-parser-output > p'):
            text = ' '.join(p.css('*::text').getall()).strip()
            if len(text) > 80:
                return text[:500]
        return None

    def _lang_keys(self, response) -> dict:
        """Devuelve el mapa de claves según el dominio."""
        return _EN if 'en.wikipedia.org' in response.url else _ES

    # ── Parsers ───────────────────────────────────────────────────────────────

    def parse_battle(self, response):
        k = self._lang_keys(response)
        data = self._infobox_data(response)

        item = BattleItem()
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
        yield item

    # Alias para compatibilidad con el spider original
    parse = parse_battle

    def parse_war(self, response):
        k = self._lang_keys(response)
        data = self._infobox_data(response)

        item = WarItem()
        item['type']         = 'war'
        item['title']        = response.css('h1 span.mw-page-title-main::text').get()
        item['wikipediaUrl'] = response.url
        item['imageUrl']     = self._image(response)
        item['dateText']     = self._get(data, k['date'])
        item['place']        = self._get(data, k['place'])
        item['coordinates']  = self._get(data, k['coordinates'])
        item['result']       = self._get(data, k['result'])
        item['description']  = self._first_paragraph(response)
        item['belligerents'] = self._two_columns(response, k['belligerents'])
        item['commanders']   = self._two_columns(response, k['commanders'])
        item['casualties']   = self._two_columns(response, k['casualties'])
        yield item

    def parse_commander(self, response):
        k = self._lang_keys(response)
        data = self._infobox_data(response)

        birth_text = self._get(data, k['birth'])
        death_text = self._get(data, k['death'])

        item = CommanderItem()
        item['type']         = 'commander'
        item['name']         = response.css('h1 span.mw-page-title-main::text').get()
        item['wikipediaUrl'] = response.url
        item['imageUrl']     = self._image(response)
        item['country']      = self._get(data, k['allegiance'])
        item['birthYear']    = _extract_year(birth_text)
        item['deathYear']    = _extract_year(death_text)
        item['description']  = self._first_paragraph(response)
        yield item
