# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class WikipediaItem(scrapy.Item):
    type = scrapy.Field()
    title = scrapy.Field()
    imageUrl = scrapy.Field()
    date = scrapy.Field()
    place = scrapy.Field()
    coordinates = scrapy.Field()
    result = scrapy.Field()
    belligerents = scrapy.Field()
    commanders = scrapy.Field()
    strength = scrapy.Field()
    casualties = scrapy.Field()
