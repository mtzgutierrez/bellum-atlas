# Páginas

La app (React + Vite) tiene cuatro vistas. La navegación superior es:
**Inicio · Mapa · Batallas**, más el toggle Free/Premium.

---

## Inicio (`/`)

Hero de entrada + rejilla de batallas destacadas (las de mayor
`importanceScore`), cada una con su imagen. CTA al mapa y al catálogo.

## Catálogo (`/battles`)

Listado paginado de batallas con:
- Búsqueda por nombre (con debounce).
- Filtro por época (presets de ≤150 años).
- Tarjetas `BattleCard` con imagen, tipo y año.

## Ficha de batalla (`/battles/:id`)

La vista más rica, pensada para enganchar al invitado **sin** cuenta:
1. **Cabecera**: tipo, título, año/rango, coordenadas y enlace "Ver en el mapa".
2. **Imagen** grande (de Wikipedia).
3. **Síntesis**: el extract de Wikipedia.
4. **Ubicación**: mini-mapa Leaflet centrado en la batalla.
5. **Narrativa por IA (Premium)**: si el usuario es premium, pestañas
   *Story Mode / Contexto / Resultado / Curiosidades*; si es invitado/free, un
   teaser atractivo con CTA "Activar Premium". Ver [IA (LLM)](../backend/ia.md).
6. **Batallas de la misma época**: rejilla de batallas en ±20 años.
7. Enlace al artículo completo de Wikipedia.

## Map Explorer (`/map`)

Mapa Leaflet a pantalla completa con tiles oscuros de Carto:
- Carga puntos ligeros (`/battles/points`) dentro de una **ventana temporal de
  150 años** (por defecto, los últimos 150).
- Slider de periodo (doble) que nunca abre más de 150 años.
- Búsqueda por nombre y lista de resultados; doble clic abre la ficha.
- Popups con nombre, año y tipo.
