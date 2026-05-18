"""
Spider de Wikipedia para batallas, guerras y comandantes históricos.

Modos de operación:
  1. URL directa de artículo → parsea el artículo inmediatamente.
  2. URL de categoría        → navega todos los artículos y subcategorías
                               hasta MAX_SUBCATEGORY_DEPTH niveles.

El tipo de entidad (battle / war / commander) se determina por la lista
de start_urls en la que aparece la URL, no por el contenido de la página.
"""

import re
import scrapy
from ares.items import BattleItem, WarItem, CommanderItem

# ── Claves de infobox por idioma ──────────────────────────────────────────────

_ES = {
    'date':         ['Fecha'],
    'place':        ['Lugar'],
    'coordinates':  ['Coordenadas'],
    'result':       ['Resultado'],
    'belligerents': ['Beligerantes'],
    'commanders':   ['Comandantes'],
    'strength':     ['Fuerzas en combate', 'Fuerzas'],
    'casualties':   ['Bajas', 'Víctimas'],
    'birth':        ['Nacimiento', 'Fecha de nacimiento'],
    'death':        ['Fallecimiento', 'Fecha de fallecimiento'],
    'allegiance':   ['Lealtad', 'País'],
}

_EN = {
    'date':         ['Date'],
    'place':        ['Location', 'Place'],
    'coordinates':  ['Coordinates'],
    'result':       ['Result', 'Outcome'],
    'belligerents': ['Belligerents', 'Combatants'],
    'commanders':   ['Commanders', 'Leaders'],
    'strength':     ['Strength', 'Forces'],
    'casualties':   ['Casualties', 'Losses'],
    'birth':        ['Born', 'Birth date'],
    'death':        ['Died', 'Death date'],
    'allegiance':   ['Allegiance', 'Country'],
}

# Profundidad máxima de recursión en subcategorías
MAX_SUBCATEGORY_DEPTH = 2

# Prefijos de namespace de Wikipedia que NO son artículos
_SKIP_PREFIXES = (
    'Wikipedia:', 'Ayuda:', 'Help:', 'Portal:', 'Especial:', 'Special:',
    'Usuario:', 'User:', 'Discusión:', 'Talk:', 'Archivo:', 'File:',
    'MediaWiki:', 'Plantilla:', 'Template:', 'Módulo:', 'Module:',
)


def _abs_url(url: str | None) -> str | None:
    if url and url.startswith('//'):
        return f'https:{url}'
    return url


def _extract_year(text: str | None) -> int | None:
    if not text:
        return None
    m = re.search(r'\b(1[0-9]{3}|20[0-9]{2})\b', text)
    return int(m.group()) if m else None


def _is_category_url(url: str) -> bool:
    return bool(re.search(r'/(?:Categor[ií]a|Category):', url, re.IGNORECASE)
                or '/Categor%C3%ADa:' in url
                or '/Categor%C3%A9a:' in url)


def _is_article_url(path: str) -> bool:
    """Devuelve True si el path de Wikipedia es un artículo válido."""
    if not path.startswith('/wiki/'):
        return False
    title = path[len('/wiki/'):]
    return not any(title.startswith(p) for p in _SKIP_PREFIXES)


class WikipediaSpider(scrapy.Spider):
    name = 'wikipedia'
    allowed_domains = ['es.wikipedia.org', 'en.wikipedia.org']

    # ── Puntos de entrada ─────────────────────────────────────────────────────
    # Pueden ser URLs de artículo o de categoría.
    # Las categorías se rastrean recursivamente (hasta MAX_SUBCATEGORY_DEPTH).

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

    # ── Bootstrap ─────────────────────────────────────────────────────────────

    def start_requests(self):
        entries = [
            (self.battle_start_urls,    self.parse_battle),
            (self.war_start_urls,       self.parse_war),
            (self.commander_start_urls, self.parse_commander),
        ]
        for urls, item_cb in entries:
            for url in urls:
                if _is_category_url(url):
                    yield scrapy.Request(
                        url,
                        callback=self.parse_category,
                        meta={'item_callback': item_cb, 'depth': 0},
                    )
                else:
                    yield scrapy.Request(url, callback=item_cb)

    # ── Rastreo de categorías ─────────────────────────────────────────────────

    def parse_category(self, response):
        """
        Navega una página de categoría de Wikipedia:
          - Sigue todos los artículos listados en #mw-pages.
          - Sigue subcategorías en #mw-subcategories hasta MAX_SUBCATEGORY_DEPTH.
          - Sigue la paginación ("página siguiente" / "next page").
        """
        item_callback = response.meta['item_callback']
        depth = response.meta.get('depth', 0)

        # 1. Artículos de la categoría
        for href in response.css('#mw-pages .mw-category a::attr(href)').getall():
            if _is_article_url(href):
                yield response.follow(href, callback=item_callback)

        # 2. Subcategorías (recursión limitada)
        if depth < MAX_SUBCATEGORY_DEPTH:
            for href in response.css('#mw-subcategories .mw-category a::attr(href)').getall():
                if _is_category_url(response.urljoin(href)):
                    yield response.follow(
                        href,
                        callback=self.parse_category,
                        meta={'item_callback': item_callback, 'depth': depth + 1},
                    )

        # 3. Paginación de la categoría
        for a in response.css('#mw-pages a'):
            text = (a.css('::text').get() or '').strip().lower()
            if 'siguiente' in text or 'next' in text:
                yield response.follow(
                    a.attrib['href'],
                    callback=self.parse_category,
                    meta={'item_callback': item_callback, 'depth': depth},
                )
                break

    # ── Helpers comunes ───────────────────────────────────────────────────────

    def _lang_keys(self, response) -> dict:
        return _EN if 'en.wikipedia.org' in response.url else _ES

    def _infobox_data(self, response) -> dict:
        data = {}
        for row in response.css('table.infobox tbody tr'):
            key = ' '.join(row.css('th *::text, th::text').getall()).strip()
            val = ' '.join(row.css('td *::text, td::text').getall()).strip()
            if key and val:
                data[key] = val
        return data

    def _get(self, data: dict, keys: list[str]) -> str | None:
        for k in keys:
            if k in data:
                return data[k]
        return None

    def _two_columns(self, response, section_keys: list[str]) -> dict | None:
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
        for p in response.css('#mw-content-text .mw-parser-output > p'):
            text = ' '.join(p.css('*::text').getall()).strip()
            if len(text) > 80:
                return text[:500]
        return None

    # ── Parsers de entidad ────────────────────────────────────────────────────

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

    # Alias para compatibilidad con el comando `scrapy crawl wikipedia`
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

        item = CommanderItem()
        item['type']         = 'commander'
        item['name']         = response.css('h1 span.mw-page-title-main::text').get()
        item['wikipediaUrl'] = response.url
        item['imageUrl']     = self._image(response)
        item['country']      = self._get(data, k['allegiance'])
        item['birthYear']    = _extract_year(self._get(data, k['birth']))
        item['deathYear']    = _extract_year(self._get(data, k['death']))
        item['description']  = self._first_paragraph(response)
        yield item
