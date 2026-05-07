# Stack tecnológico

## Resumen

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Frontend | React + Vite | 18.x | SPA clásica, sin SSR en MVP |
| Estilos | TailwindCSS | 3.x | Utility-first, rápido de iterar |
| Estado servidor | React Query | 5.x | Caché y sincronización de datos de la API |
| Backend | NestJS | 10.x | Módulos por dominio, DI nativa, TypeScript |
| ORM | Prisma | 5.x | Migraciones tipadas, cliente generado |
| Base de datos | PostgreSQL + PostGIS | 16.x | Full-text search nativo, datos geoespaciales |
| Cola / Caché | BullMQ + Redis | 7.x | Jobs del scraper, caché de búsquedas |
| Mapas | Mapbox GL JS | 3.x | Plan gratuito suficiente para MVP |
| Auth | JWT + Passport.js | — | Sin OAuth en MVP |
| Scraper | Scrapy + BeautifulSoup | 2.15 | Crawling robusto con rate limiting automático |
| Infra (dev) | Docker Compose | — | Un comando para levantar todo el entorno |
| Infra (prod) | Railway / Fly.io | — | Deploy sencillo, coste bajo |

---

## Decisiones relevantes

### PostgreSQL con PostGIS
La extensión PostGIS permite almacenar coordenadas como tipos `GEOMETRY(Point, 4326)` y realizar consultas geoespaciales nativas (ej: "batallas en un radio de 50km de París"). En el MVP se usa para los pins del mapa; en versiones futuras habilitará búsquedas por área.

### React Query en lugar de Redux
Los datos del servidor son el estado principal de la aplicación. React Query gestiona caché, revalidación y estados de carga sin necesidad de un store global. Elimina una capa de complejidad innecesaria para este tipo de aplicación.

### Scrapy como servicio independiente
Scrapy corre como un proceso Python completamente separado del backend. Esto permite:

- Ajustar el rate limiting sin tocar el servidor
- Escalar el scraper independientemente
- Ejecutar crawls programados sin afectar la disponibilidad de la API

### BullMQ + Redis para jobs
Los jobs del scraper (geocodificación, reintentos, deduplicación) se encolan en Redis vía BullMQ. Esto evita bloquear el proceso principal y permite visibilidad del estado de cada job.
