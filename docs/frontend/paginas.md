# Páginas

Cada página existe en dos variantes: `Desktop` y `Mobile`. El componente raíz detecta `window.innerWidth < 768` y renderiza la variante correspondiente.

---

## Home (`/`)

El hero ocupa 540px de altura, fondo de grabado con soldados-silueta SVG y degradado de humo. La batalla del día (Lepanto) se muestra con tipografía Cinzel a 96px en dos líneas, con el nombre final en dorado.

```
┌─────────────────────────────────────────────────────────┐
│  TopBar (compact, blur)                                 │
├─────────────────────────────────────────────────────────┤
│  [HERO 540px — engraving + siluetas + humo]             │
│  · Despacho del día stamp                               │
│  · ResultBadge + metadata mono                          │
│  · BATALLA DE / LEPANTO (96px Cinzel, gold)             │
│  · Descripción · CTA primario · stats inline            │
│  · Flechas de paginación                                │
├─────────────────────────────────────────────────────────┤
│  [CONTADORES — 88px Cinzel: 5.247 / 412 / 193 / 3.235] │
├─────────────────────────────────────────────────────────┤
│  [ENTRY POINTS — grid 1.4fr / 1fr / 1fr]               │
│  · Map Explorer (MapBackdrop + pins)                    │
│  · Catálogo (preview de búsquedas)                      │
│  · Cronología (preview de siglos)                       │
└─────────────────────────────────────────────────────────┘
```

---

## Catálogo (`/battles`)

Búsqueda full-text reactiva (sin debounce, filtra sobre los datos mock) con sidebar de filtros por era, tipo y resultado.

- Input de búsqueda: filtra `name`, `war`, `place`
- Sidebar 240px: checkboxes con contadores (sin bordes redondeados)
- Resultados: columna de `BattleCard` completas con borde izquierdo de color
- Estados: lista vacía con mensaje de orientación

---

## Ficha de batalla (`/battles/:id`)

Carga la batalla por `id` del array mock. Si no existe, muestra Stalingrado como fallback.

**Secciones:**

1. **Breadcrumb** → Batallas → [guerra] → [batalla]
2. **Hero** (2 col): título 64px + metadata | mini-mapa MapBackdrop con pin central
3. **Stats strip** (5 col): efectivos, bajas, ubicación, era, resultado
4. **Facciones** (3 col): FactionColumn izquierda | divider con VS | FactionColumn derecha alineada a la derecha
5. **Batallas relacionadas**: grid 3 col de BattleCard compact, filtradas por `war`

---

## Guerras (`/wars` y `/wars/:id`)

**Lista:** tabla con columnas nombre / periodo | batallas | bajas | chevron. Clickable a la ficha.

**Ficha:** header 2 col (título + tabla de stats) + sección de batallas filtradas por `war.name`.

---

## Cronología (`/timeline`)

Línea dorada vertical con grupos por siglo. Cada grupo tiene:

- Dot dorado en la línea
- Header: siglo + línea divisoria + contador de batallas
- Grid 3 col de BattleCard compact

Siglos incluidos: s. V a. C., s. III a. C., s. VIII, s. XV, s. XVI, s. XIX, s. XX.

---

## Comandantes (`/commanders` y `/commanders/:id`)

**Lista:** grid 4 col con tarjetas: retrato (ax-engraving placeholder), nombre, país, años, stats V/D/Total.

**Perfil:** layout 2 col — retrato 200px | datos completos con ratio de efectividad + arco de carrera (puntos sobre línea). Grid de batallas relacionadas abajo.

---

## Map Explorer (`/map`)

Mapa full-screen `MapBackdrop` con:

- Pins posicionados manualmente mediante `pinPositions` (coordenadas % del viewport)
- Clusters fijos decorativos (x2)
- Barra de filtros flotante centrada en la parte superior (Todos / Victorias / Derrotas / Indeciso)
- Stats flotantes en esquina superior derecha
- Leyenda flotante en esquina inferior izquierda
- Popup al hacer clic en un pin: nombre, fecha, lugar, fuerzas, ResultBadge, tail triangular
- Click fuera del popup para cerrarlo
