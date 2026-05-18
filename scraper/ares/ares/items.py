import scrapy


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


class CommanderItem(scrapy.Item):
    type         = scrapy.Field()  # "commander"
    name         = scrapy.Field()  # nombre completo
    wikipediaUrl = scrapy.Field()  # URL canónica — clave de upsert
    imageUrl     = scrapy.Field()  # URL absoluta del retrato
    country      = scrapy.Field()  # lealtad o país principal
    birthYear    = scrapy.Field()  # año de nacimiento (int)
    deathYear    = scrapy.Field()  # año de fallecimiento (int)
    description  = scrapy.Field()  # primer párrafo del artículo
