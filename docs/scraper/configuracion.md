# Configuración del scraper

**Archivo**: `scraper/ares/ares/settings.py`

---

## Identificación del bot

Wikipedia requiere un `User-Agent` descriptivo para crawlers. Sin él, Wikimedia puede bloquear las peticiones.

```python
USER_AGENT = 'AresCodexBot/1.0 (https://github.com/tu-usuario/ares-codex; raulmartinezz402@gmail.com) Scrapy/2.15'
```

El formato sigue la [política de User-Agent de Wikimedia](https://meta.wikimedia.org/wiki/User-Agent_policy): `NombreBot/versión (URL; contacto) LibreríaHTTP/versión`.

---

## Concurrencia y throttling

```python
ROBOTSTXT_OBEY = True                  # Respetar robots.txt de Wikipedia
CONCURRENT_REQUESTS = 8                # Peticiones simultáneas globales
CONCURRENT_REQUESTS_PER_DOMAIN = 1     # 1 petición simultánea por dominio
DOWNLOAD_DELAY = 1.5                   # Segundos mínimos entre peticiones al mismo dominio
```

!!! warning "Respetar los límites de Wikipedia"
    `CONCURRENT_REQUESTS_PER_DOMAIN = 1` y `DOWNLOAD_DELAY = 1.5` son obligatorios.
    Reducirlos puede resultar en bloqueo de IP por Wikimedia.

---

## AutoThrottle

Ajusta el delay automáticamente según la latencia real de Wikipedia. Siempre activo en producción.

```python
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 1.5    # Delay inicial (segundos)
AUTOTHROTTLE_MAX_DELAY = 15       # Techo del delay (segundos)
AUTOTHROTTLE_TARGET_CONCURRENCY = 1.0  # Peticiones simultáneas objetivo
AUTOTHROTTLE_DEBUG = False        # True → imprime el delay ajustado en cada petición
```

Con `AUTOTHROTTLE_DEBUG = True` puedes ver en los logs cómo evoluciona el delay:

```
2024-01-15 12:34:56 [scrapy.extensions.throttle] DEBUG: slot: es.wikipedia.org ...
  prev/ref/cur latency: 0.45/1.50/0.43, recommended: 0.43/0.43, throttle: 1.50
```

---

## Caché HTTP

Útil en desarrollo para no volver a descargar páginas ya vistas. Se activa con la variable de entorno `SCRAPY_HTTPCACHE=1`.

```python
# Solo se activa si SCRAPY_HTTPCACHE=1
if os.environ.get('SCRAPY_HTTPCACHE') == '1':
    HTTPCACHE_ENABLED = True
    HTTPCACHE_EXPIRATION_SECS = 86_400   # 24 horas
    HTTPCACHE_DIR = '/tmp/scrapy_httpcache'
    HTTPCACHE_IGNORE_HTTP_CODES = [500, 502, 503, 504]
```

```bash
# Uso en desarrollo
SCRAPY_HTTPCACHE=1 scrapy crawl wikipedia
```

!!! note "No usar la caché en producción"
    La caché en disco puede consumir varios GB en un crawl masivo. Solo actívala para iterar sobre el mismo conjunto de páginas durante el desarrollo.

---

## Pipeline activo

```python
ITEM_PIPELINES = {
    'ares.pipelines.BackendPipeline': 300,
}
```

El número `300` es la prioridad de ejecución (menor = primero). Con un solo pipeline, el valor no importa.

---

## Variables de entorno

El pipeline lee estas variables en tiempo de ejecución:

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `BACKEND_URL` | URL base de la API NestJS | `http://localhost:3000` |
| `SCRAPER_API_KEY` | Clave para el header `x-api-key` del endpoint interno | — |
| `SCRAPY_HTTPCACHE` | `1` para activar la caché HTTP en disco | desactivada |

```bash
# .env (raíz del proyecto)
BACKEND_URL=http://backend:3000       # dentro de Docker, usa el nombre del servicio
SCRAPER_API_KEY=tu-clave-secreta
```

!!! danger "SCRAPER_API_KEY es obligatoria"
    Sin ella el backend rechaza todas las peticiones con HTTP 401. Si el scraper arranca sin esta variable, verás un error en los logs por cada item procesado.

---

## Dependencias

```
Scrapy==2.15.1
itemadapter==0.10.0
```

```bash
cd scraper && pip install -r requirements.txt
```

!!! note "Sin dependencias HTTP adicionales"
    El pipeline usa `urllib` de la librería estándar de Python para hacer las peticiones al backend. No es necesario instalar `requests` ni `httpx`.
