# Configuración del scraper

**Archivo**: `scraper/ares/ares/settings.py`

---

## Parámetros de Scrapy

```python
BOT_NAME = "ares"
SPIDER_MODULES = ["ares.spiders"]

# Respetar robots.txt de Wikipedia
ROBOTSTXT_OBEY = True

# Concurrencia y throttling
CONCURRENT_REQUESTS = 8
CONCURRENT_REQUESTS_PER_DOMAIN = 1  # 1 petición simultánea a Wikipedia
DOWNLOAD_DELAY = 1                   # 1 segundo entre peticiones

# Pipeline activo
ITEM_PIPELINES = {
    "ares.pipelines.BackendPipeline": 300,
}

FEED_EXPORT_ENCODING = "utf-8"
```

!!! warning "Respetar los límites de Wikipedia"
    `CONCURRENT_REQUESTS_PER_DOMAIN = 1` y `DOWNLOAD_DELAY = 1` son obligatorios.
    Reducirlos puede resultar en bloqueo de IP por Wikimedia.

---

## Variables de entorno

El pipeline lee estas variables en tiempo de ejecución:

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `BACKEND_URL` | URL base de la API NestJS | `http://localhost:3000` |
| `SCRAPER_API_KEY` | Clave para el header `x-api-key` del endpoint interno | — |

Están definidas en el fichero `.env` de la raíz del proyecto:

```bash
# .env (raíz del proyecto)
BACKEND_URL=http://backend:3000       # dentro de Docker usa el nombre del servicio
SCRAPER_API_KEY=tu-clave-secreta
```

!!! danger "SCRAPER_API_KEY es obligatoria"
    Sin ella el backend rechaza todas las peticiones con HTTP 401.
    Si el scraper arranca sin esta variable, verás un warning en los logs.

---

## AutoThrottle (recomendado para el seed masivo)

```python
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1
AUTOTHROTTLE_MAX_DELAY = 10
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0
```

Ajusta el delay automáticamente según la latencia de respuesta de Wikipedia. Actívalo antes de ejecutar un crawl masivo por categorías.

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

!!! note "Sin dependencias HTTP adicionales"
    El pipeline usa `urllib` de la librería estándar de Python para hacer las peticiones al backend. No es necesario instalar `requests`.
