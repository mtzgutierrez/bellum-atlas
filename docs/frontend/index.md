# Frontend — Visión general

El frontend es una SPA construida con **React 19 + Vite + TypeScript**. Consume datos de un módulo de mock tipado y está preparado para conectar con la API REST del backend.

---

## Stack

| Librería | Versión | Uso |
|---|---|---|
| React | 19.x | UI con hooks |
| Vite | 8.x | Bundler y dev server |
| TypeScript | 5.x | Tipado estático |
| react-router-dom | 7.x | Enrutado SPA |
| CSS Custom Properties | — | Design system (sin frameworks) |

---

## Estructura de directorios

```
frontend/src/
├── components/          # Componentes reutilizables
│   ├── Icon.tsx         # 40+ iconos SVG inline (sword, anchor, plane…)
│   ├── Logo.tsx         # Logotipo ARES·CODEX con espada dorada
│   ├── TopBar.tsx       # TopBarDesktop + TopBarMobile
│   ├── BottomNav.tsx    # Barra de navegación móvil (5 items)
│   ├── BattleCard.tsx   # Tarjeta de batalla con badge de resultado
│   ├── ResultBadge.tsx  # Badge Victoria / Derrota / Empate / Indeciso
│   ├── TypeIcon.tsx     # Icono según tipo de batalla (terrestre/naval…)
│   ├── MapBackdrop.tsx  # Fondo de mapa topográfico SVG
│   ├── MapPin.tsx       # Pin de batalla con color por resultado
│   ├── MapCluster.tsx   # Cluster circular con contador
│   ├── FactionColumn.tsx# Columna de bando (comandantes, efectivos, bajas)
│   └── StatBlock.tsx    # Bloque estadístico (número grande + etiqueta)
│
├── pages/               # Páginas (funciones)
│   ├── Home.tsx         # HomeDesktop (Variante B cinematic) + HomeMobile
│   ├── Catalog.tsx      # CatalogDesktop + CatalogMobile
│   ├── BattleDetail.tsx # BattleDetailDesktop + BattleDetailMobile
│   ├── Wars.tsx         # WarsListDesktop + WarDetailDesktop + WarsMobile
│   ├── Timeline.tsx     # TimelineDesktop + TimelineMobile
│   ├── Commanders.tsx   # CommandersListDesktop + CommanderDetailDesktop + CommandersMobile
│   └── MapExplorer.tsx  # MapExplorerDesktop + MapExplorerMobile
│
├── data/
│   └── mock.ts          # Datos históricos tipados (18 batallas, 8 comandantes, 3 guerras)
│
├── App.tsx              # Router principal (BrowserRouter + Routes)
├── main.tsx             # Entry point
└── index.css            # Design tokens + clases utilitarias ax-*
```

---

## Páginas

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `Home` | Hero cinematográfico (Lepanto), contadores, 3 entry points |
| `/battles` | `Catalog` | Búsqueda full-text, sidebar de filtros, lista de batallas |
| `/battles/:id` | `BattleDetail` | Hero con breadcrumb, stats strip, facciones VS, batallas relacionadas |
| `/wars` | `Wars` | Lista de guerras con tabla de estadísticas |
| `/wars/:id` | `WarDetailDesktop` | Detalle de guerra con batallas asociadas |
| `/commanders` | `Commanders` | Grid de comandantes con retrato engraving |
| `/commanders/:id` | `CommanderDetailDesktop` | Perfil con arco de carrera y ratio W/L |
| `/timeline` | `Timeline` | Feed cronológico con línea de oro, agrupado por siglo |
| `/map` | `MapExplorer` | Mapa full-screen con pins filtrados, clusters, popup de batalla |

---

## Design system

El sistema visual se basa en CSS custom properties definidas en `index.css`. Sin Tailwind. Sin border-radius > 4px. Paleta oscura con crimson y gold como colores de acento.

Ver [Guía de estilos](../guia-estilos.md) para la documentación completa.

---

## Secciones

- [Páginas](paginas.md) — Descripción detallada de cada página
- [Map Explorer](mapa.md) — Arquitectura del mapa interactivo
