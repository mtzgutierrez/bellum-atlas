import os

BOT_NAME = 'ares'

SPIDER_MODULES = ['ares.spiders']
NEWSPIDER_MODULE = 'ares.spiders'

ADDONS = {}

# Identificación — requerido por Wikipedia para crawlers
USER_AGENT = 'AresCodexBot/1.0 (https://github.com/tu-usuario/ares-codex; raulmartinezz402@gmail.com) Scrapy/2.15'

# Respetar robots.txt de Wikipedia
ROBOTSTXT_OBEY = True

# ── Concurrencia y throttling ─────────────────────────────────────────────────
# Wikipedia permite 1 petición simultánea por IP. No bajar estos valores.
CONCURRENT_REQUESTS = 8
CONCURRENT_REQUESTS_PER_DOMAIN = 1
DOWNLOAD_DELAY = 1.5  # segundos mínimos entre peticiones al mismo dominio

# AutoThrottle: ajusta el delay según la latencia real de Wikipedia.
# Se activa siempre — es la forma correcta de crawlear en producción.
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1.5
AUTOTHROTTLE_MAX_DELAY = 15
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0
AUTOTHROTTLE_DEBUG = False  # True para ver el delay ajustado en cada petición

# ── Caché HTTP (útil en desarrollo para no re-descargar páginas) ──────────────
# Activar con la variable de entorno SCRAPY_HTTPCACHE=1
if os.environ.get('SCRAPY_HTTPCACHE') == '1':
    HTTPCACHE_ENABLED = True
    HTTPCACHE_EXPIRATION_SECS = 86_400  # 24 horas
    HTTPCACHE_DIR = '/tmp/scrapy_httpcache'
    HTTPCACHE_IGNORE_HTTP_CODES = [500, 502, 503, 504]

# ── Pipeline ──────────────────────────────────────────────────────────────────
ITEM_PIPELINES = {
    'ares.pipelines.BackendPipeline': 300,
}

# ── Variables de entorno leídas por BackendPipeline ───────────────────────────
#   BACKEND_URL      → URL base de la API NestJS  (default: http://localhost:3000)
#   SCRAPER_API_KEY  → Clave para el header x-api-key

FEED_EXPORT_ENCODING = 'utf-8'
