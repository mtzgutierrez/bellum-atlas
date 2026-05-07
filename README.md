# ⚔ AresCodex

> **Atlas histórico interactivo de conflictos militares.**  
> Datos reales + Búsqueda potente + Mapa épico = Producto completo.

AresCodex es una plataforma web que centraliza datos de miles de batallas y conflictos históricos en una experiencia visual moderna: mapas interactivos, fichas detalladas, líneas de tiempo y perfiles de comandantes. Todo lo que Wikipedia tiene, presentado con la claridad y la potencia que merece.

---

## ¿Qué es AresCodex?

Una herramienta que no existe en internet tal y como se plantea: una base de datos estructurada de más de **5.000 batallas reales** con geolocalización, filtros avanzados y visualización en mapa, construida sobre datos scrapeados de Wikipedia y enriquecidos con geocodificación y normalización automática.

El producto se dirige tanto al entusiasta de la historia militar como al investigador o estudiante que necesita referencias rápidas y contextualizadas.

---

## Características del MVP

### Mapa Interactivo
- Mapa Mapbox a pantalla completa con todos los pins georreferenciados
- Clustering automático por zoom
- Popup al clicar: nombre, fecha, resultado y enlace a la ficha completa
- Filtros laterales por era, tipo de batalla y resultado

### Búsqueda y Catálogo
- Búsqueda full-text sobre nombre de batalla, guerra, comandantes y lugar (PostgreSQL `tsvector`)
- Filtros combinables: era histórica, país, resultado, tipo (terrestre / naval / aéreo / asedio)
- Resultados paginados y ordenables por fecha, nombre o número de bajas
- URLs compartibles con parámetros de búsqueda

### Fichas de Batalla
- Cabecera con nombre, fecha, guerra padre y resultado destacado
- Mini-mapa embebido centrado en la ubicación exacta
- Facciones con comandantes, bajas estimadas y resultado por bando
- Batallas relacionadas de la misma guerra ordenadas cronológicamente

### Fichas de Guerra
- Período completo, resultado global y descripción
- Lista cronológica de batallas
- Estadísticas: número de batallas, bajas totales, duración
- Mini-mapa con todos los pins de la guerra

### Timeline Histórica
- Feed cronológico agrupado por siglo
- Filtro por era histórica
- Diseño tipo eje de tiempo con tarjetas laterales

### Perfiles de Comandantes
- Ficha con nombre, país, años de vida y batallas en las que participó
- Ratio de victorias sobre el total de batallas
- Enlace a Wikipedia

### Autenticación
- Registro con email + contraseña
- JWT con refresh token en `httpOnly` cookie
- Base lista para construir features personalizadas encima

---

## Stack Tecnológico

| Capa | Tecnología | Nota |
|---|---|---|
| Frontend | React 18 + Vite + TailwindCSS + React Query | SPA sin SSR en MVP |
| Backend | NestJS + Prisma + PostgreSQL + PostGIS | API REST, módulos por dominio |
| Scraper | Python · Scrapy + BeautifulSoup | Servicio independiente, comunica por HTTP |
| Queue / Cache | BullMQ + Redis | Jobs del scraper, caché de búsquedas |
| Mapas | Mapbox GL JS | Plan gratuito suficiente para MVP |
| Auth | JWT + Passport.js | Sin OAuth en MVP |
| Infra | Docker Compose (dev) + Railway / Fly.io (prod) | Deploy sencillo, coste bajo |

---

## Arquitectura del Scraper

El scraper es un servicio Python independiente que extrae datos de Wikipedia y los envía a la API NestJS:

1. **Punto de entrada**: categorías de Wikipedia (`Battles by century`, `Naval battles`, `Battles of World War II`…)
2. **Extracción**: infobox con BeautifulSoup — nombre, fecha, lugar, facciones, comandantes, resultado, bajas
3. **Normalización**: fechas a ISO 8601, bajas a enteros o rangos, coordenadas a WGS84 decimal
4. **Geocodificación**: si la infobox no incluye coordenadas → Nominatim (OpenStreetMap, gratuito)
5. **Push**: `POST /internal/scraper/battle` con API key interna; NestJS valida, desduplicita y persiste

El scraper nunca escribe directamente en PostgreSQL. Toda inserción pasa por la API para mantener las validaciones centralizadas.

---

## Modelo de Datos (Prisma)

```
HistoricalEra  ──< War ──< Battle ──< BattleFaction ──< CommanderFaction >── Commander
                                  └── Location
User
```

Diseñado para que las features futuras (IA, colecciones, workspace) se añadan como modelos nuevos o campos opcionales, sin migraciones destructivas.

---

## Plan de Desarrollo (4 semanas)

| Semana | Bloque | Entregable |
|---|---|---|
| 1 | Infraestructura + Scraper | Docker Compose, schema Prisma, endpoint interno, seed ~1.000 batallas |
| 2 | API + datos completos | Endpoints REST, búsqueda full-text, auth, seed ~5.000 batallas |
| 3 | Frontend core | Home, búsqueda, fichas, Map Explorer, responsivo |
| 4 | Pulido + Deploy | Timeline, perfiles, login UI, deploy en producción con dominio y HTTPS |

---

## Modelo de Negocio

Tres fuentes compatibles entre sí:

### 1. Publicidad Contextual (AdSense / Ezoic)
Tráfico orgánico SEO sobre búsquedas de nicho histórico-militar (`"mapa batalla de Stalingrado"`, `"comandantes Guerra de Sucesión Española"`…). Con **15.000–20.000 visitas/mes** se alcanzan ~100 €/mes sin esfuerzo adicional.

### 2. Afiliados Amazon
Libros de historia militar recomendados en cada ficha de batalla y guerra (comisión 3–10%). Integración natural: el usuario que lee sobre Waterloo tiene alta intención de compra de bibliografía relacionada.

### 3. Tier Premium (Patreon / Stripe)
~5 €/mes para entusiastas y estudiantes. Da acceso a:
- Mapas animados de movimientos de tropas
- Exportación de datos (PDF, CSV, citas en Chicago/APA/MLA)
- Sin anuncios
- Acceso anticipado a features nuevas

Con **20 suscriptores premium** se superan los 100 €/mes. La mezcla de ads + afiliados + suscripciones hace el objetivo más alcanzable y diversifica el riesgo.

### Proyección realista
Con SEO de nicho histórico bien trabajado y 20–30 páginas de batallas optimizadas para búsquedas concretas, el objetivo de **100 €/mes es alcanzable en 6–12 meses** prácticamente sin mantenimiento activo una vez completado el seed inicial.

---

## Roadmap Post-MVP

Ordenado por impacto esperado:

| Prioridad | Feature | Valor |
|---|---|---|
| Alta | AI Insights (Claude API) | Análisis estratégico por batalla — diferencial frente a Wikipedia |
| Alta | Statistics Dashboard | Gráficas de bajas, naciones, siglos — muy compartible en redes |
| Alta | Battle Comparator | Comparativa side-by-side — útil para investigadores |
| Media | Timeline visual animada | Eje cronológico navegable tipo `vis-timeline` |
| Media | Research Workspace | Notas + conexiones entre batallas — herramienta académica |
| Media | Colecciones de usuario | "Mis batallas favoritas", listas compartibles |
| Media | Citation Export | Citas en Chicago/APA/MLA — útil para universitarios |
| Baja | What-if Simulator | Contrafactuales con IA — la feature más espectacular |
| Baja | Heatmap histórico | Densidad de conflictos por región y época |
| Baja | PWA / modo offline | Acceso sin conexión |

---

## Criterios de Éxito del MVP

- Base de datos con al menos **3.000 batallas** con localización geográfica
- Búsqueda con resultados relevantes en menos de **500ms**
- Mapa con todos los pins en menos de **3 segundos** con conexión estándar
- Fichas de batalla con: nombre, fecha, facciones, comandantes y ubicación
- Aplicación funcional en móvil (responsive completo)
- Deploy en producción con dominio propio y HTTPS

---

## Comunidades objetivo

- [r/WarHistory](https://reddit.com/r/WarHistory), [r/HistoryMaps](https://reddit.com/r/HistoryMaps)
- Canales de YouTube de historia militar
- Foros de wargames y simulación histórica
- Estudiantes universitarios de Historia y Ciencias Militares

---

## Desarrollo local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/ares-codex.git
cd ares-codex

# Levantar servicios
docker compose up -d

# Backend
cd backend && npm install && npm run start:dev

# Frontend
cd frontend && npm install && npm run dev

# Scraper
cd scraper && pip install -r requirements.txt && scrapy crawl battles
```

---

*AresCodex MVP · Plan v2.0 · 4 semanas*
