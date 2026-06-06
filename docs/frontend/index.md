# Frontend — Visión general

SPA con **React 19 + Vite + TypeScript**. Consume la API REST del backend a
través del proxy `/api` (ver `vite.config.ts`).

---

## Stack

| Librería | Uso |
|---|---|
| React 19 | UI con hooks |
| Vite | Bundler y dev server |
| react-router-dom | Enrutado SPA |
| Leaflet | Mapa y mini-mapas |
| CSS custom properties | Design system (sin frameworks) |

---

## Estructura de directorios

```
frontend/src/
├── components/
│   ├── Icon.tsx          # iconos SVG inline
│   ├── TopBar.tsx        # navegación + toggle Free/Premium
│   ├── BattleCard.tsx    # tarjeta de batalla (imagen, tipo, año)
│   ├── TypeIcon.tsx      # icono por tipo (BATTLE/SIEGE/CAMPAIGN)
│   ├── SmartImage.tsx    # imagen con fallback temático
│   └── BattleMiniMap.tsx # mini-mapa Leaflet de una batalla
├── pages/
│   ├── Home.tsx          # hero + batallas destacadas
│   ├── Battles.tsx       # catálogo paginado
│   ├── BattleDetail.tsx  # ficha rica + narrativa IA (Premium)
│   └── MapExplorer.tsx   # mapa a pantalla completa
├── services/             # cliente API: battle, ai, auth
├── hooks/                # useApiFetch, useDebounce…
├── data/eras.ts          # presets de época (<=150 años)
├── App.tsx               # rutas
└── main.tsx
```

---

## Rutas

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `Home` | Hero + batallas destacadas |
| `/battles` | `Battles` | Catálogo con búsqueda y filtro de época |
| `/battles/:id` | `BattleDetail` | Ficha rica + narrativa IA (Premium) |
| `/map` | `MapExplorer` | Mapa con ventana temporal de 150 años |

---

## Secciones

- [Páginas](paginas.md)
- [Map Explorer](mapa.md)
