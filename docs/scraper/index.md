# Scraper — Visión general

El scraper es un servicio Python independiente basado en **Scrapy 2.15** que extrae datos de batallas históricas de Wikipedia y los envía a la API del backend.

---

## Estructura del proyecto

```
scraper/
├── Dockerfile
├── requirements.txt
└── ares/
    ├── scrapy.cfg
    └── ares/
        ├── settings.py        # Configuración de Scrapy
        ├── items.py           # Definición del WikipediaItem
        ├── pipelines.py       # Post-procesamiento de items
        ├── middlewares.py     # Middlewares custom
        └── spiders/
            └── wikipedia.py   # Spider principal
```

---

## Flujo de extracción

1. **Punto de entrada**: lista de artículos o categorías de Wikipedia (`Battles by century`, `Naval battles`, `Battles of World War II`…)
2. **Parsing**: la infobox de cada artículo se parsea con BeautifulSoup para extraer nombre, fecha, lugar, facciones, comandantes, resultado y bajas
3. **Normalización**: fechas a ISO 8601, bajas a enteros o rangos, coordenadas a WGS84 decimal
4. **Geocodificación**: si la infobox no incluye coordenadas → llamada a Nominatim (OpenStreetMap, gratuito)
5. **Push**: `POST /internal/scraper/battle` con API key interna; NestJS valida, desduplicita y persiste

!!! warning "El scraper nunca escribe directamente en PostgreSQL"
    Toda inserción pasa por la API del backend para mantener las validaciones centralizadas y facilitar el testing.

---

## Ejecutar el scraper

```bash
cd scraper
pip install -r requirements.txt

cd ares
# Crawl de una sola página (prueba)
scrapy crawl wikipedia

# Exportar resultados a JSON (sin enviar a la API)
scrapy crawl wikipedia -o output.json
```

---

## Secciones del scraper

- [Spider de Wikipedia](spider.md) — Lógica de parsing de infoboxes
- [Items y campos](items.md) — Estructura del `WikipediaItem`
- [Configuración](configuracion.md) — Rate limiting, concurrencia, Redis
