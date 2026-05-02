import scrapy
from ares.items import AresItem


class WikipediaSpider(scrapy.Spider):
    name = "wikipedia"
    allowed_domains = ["es.wikipedia.org"]
    start_urls = ["https://es.wikipedia.org/wiki/Batalla_del_Ebro"]

    def parse(self, response):
        tabla = response.css("table[class*='infobox']")
        item = AresItem()
        item["title"] = tabla.css("tr th::text").get()
        yield item
        return item
