import os

BOT_NAME = "ares"

SPIDER_MODULES = ["ares.spiders"]
NEWSPIDER_MODULE = "ares.spiders"

ADDONS = {}

# Respetar robots.txt de Wikipedia
ROBOTSTXT_OBEY = True

# Concurrencia y throttling — no bajar estos valores para no ser baneado por Wikimedia
CONCURRENT_REQUESTS = 8
CONCURRENT_REQUESTS_PER_DOMAIN = 1
DOWNLOAD_DELAY = 1

# Pipeline activo: envía cada item al backend via HTTP
ITEM_PIPELINES = {
    "ares.pipelines.BackendPipeline": 300,
}

# Variables de entorno leídas en tiempo de ejecución por BackendPipeline:
#   BACKEND_URL      → URL base de la API NestJS  (default: http://localhost:3000)
#   SCRAPER_API_KEY  → Clave para el header x-api-key

FEED_EXPORT_ENCODING = "utf-8"
