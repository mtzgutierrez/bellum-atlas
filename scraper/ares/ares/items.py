import scrapy


class WikipediaItem(scrapy.Item):
    type         = scrapy.Field()  # siempre "battle" en MVP
    title        = scrapy.Field()  # nombre extraído del <h1>
    wikipediaUrl = scrapy.Field()  # URL canónica del artículo — clave de upsert
    imageUrl     = scrapy.Field()  # URL de la imagen principal de la infobox
    dateText     = scrapy.Field()  # fecha raw, ej: "18 de junio de 1815"
    place        = scrapy.Field()  # lugar raw, ej: "Waterloo, Bélgica"
    coordinates  = scrapy.Field()  # coordenadas raw, ej: "50°41′N 4°25′E"
    result       = scrapy.Field()  # resultado raw
    belligerents = scrapy.Field()  # { side1: str, side2: str }
    commanders   = scrapy.Field()  # { side1: str, side2: str }
    strength     = scrapy.Field()  # { side1: str, side2: str }
    casualties   = scrapy.Field()  # { side1: str, side2: str }
