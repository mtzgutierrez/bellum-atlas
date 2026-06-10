# Map Explorer

**Ruta**: `/map` · Componente: `pages/MapExplorer.tsx`

Mapa interactivo con **Leaflet** y tiles oscuros de **CARTO** (sin token ni
coste). Muestra las batallas como marcadores dentro de una ventana temporal.

---

## Cómo funciona

- **Datos**: `GET /battles/points` (puntos ligeros, capado a 10.000 en backend).
  Se piden filtrando por una **ventana de 150 años** (por defecto, los últimos
  150) y, opcionalmente, por nombre.
- **Ventana temporal**: un slider doble (`DualRange`) que **nunca abre más de
  150 años** — desliza la ventana en vez de ampliarla. Esto evita cargas
  masivas (ver [límite de años](../backend/api.md)).
- **Marcadores**: un pin por batalla; al hacer clic se abre un popup con
  nombre, año y tipo, y un enlace a la ficha.
- **Lista lateral**: resultados de la ventana actual; doble clic abre la ficha.
- **Foco**: `/map?focus=<slug>` centra el mapa en una batalla concreta (lo usa
  el botón "Ver en el mapa" de la ficha).

---

## Mini-mapa de la ficha

`components/BattleMiniMap.tsx` reutiliza Leaflet y los mismos tiles para
mostrar, dentro de la ficha de cada batalla, un mapa pequeño no interactivo
centrado en su ubicación.

---

## Roadmap del mapa

| Feature | Estado |
|---|---|
| Mapa Leaflet + tiles CARTO | ✓ |
| Ventana temporal de 150 años | ✓ |
| Popup + enlace a ficha | ✓ |
| Foco por slug (`?focus=`) | ✓ |
| Clustering (markercluster) al hacer zoom out | pendiente |
| Carga por bounding box al mover el mapa | pendiente |
