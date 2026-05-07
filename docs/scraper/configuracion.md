# Configuración del scraper

**Archivo**: `scraper/ares/ares/settings.py`

---

## Parámetros actuales

```python
BOT_NAME = "ares"
SPIDER_MODULES = ["ares.spiders"]

CONCURRENT_REQUESTS = 8
CONCURRENT_REQUESTS_PER_DOMAIN = 1  # 1 peticion simultanea a Wikipedia
DOWNLOAD_DELAY = 1                  # 1 segundo entre peticiones

ROBOTSTXT_OBEY = True
FEED_EXPORT_ENCODING = "utf-8"
```

!!! warning "Respetar los límites de Wikipedia"
    `CONCURRENT_REQUESTS_PER_DOMAIN = 1` y `DOWNLOAD_DELAY = 1` son obligatorios. Reducirlos puede resultar en bloqueo de IP por Wikimedia.

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|---|---|---|
| `BACKEND_URL` | URL base de la API NestJS | `http://localhost:3000` |
| `SCRAPER_API_KEY` | Clave interna para `/internal/scraper/*` | `super-secret-key` |
| `REDIS_URL` | Redis para el set de URLs procesadas | `redis://localhost:6379` |

---

## AutoThrottle (recomendado para producción)

```python
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1
AUTOTHROTTLE_MAX_DELAY = 10
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0
```

Ajusta el delay automáticamente según la latencia de respuesta. Ideal para el seed masivo.

---

## Dependencias

```
Scrapy==2.15.1
psycopg2-binary==2.9.10
itemadapter==0.10.0
```

```bash
cd scraper && pip install -r requirements.txt
```
