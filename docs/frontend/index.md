# Frontend — Visión general

El frontend es una SPA construida con **React 18 + Vite + TailwindCSS**. Consume la API del backend mediante **React Query** y renderiza el mapa con **Mapbox GL JS**.

---

## Stack

| Librería | Versión | Uso |
|---|---|---|
| React | 18.x | UI |
| Vite | 5.x | Bundler y dev server |
| TailwindCSS | 3.x | Estilos |
| React Query | 5.x | Caché y fetching de datos |
| React Router | 6.x | Enrutado |
| Mapbox GL JS | 3.x | Mapa interactivo |

---

## Estructura de páginas

| Ruta | Página | Descripción |
|---|---|---|
| `/` | Home | Contadores animados, barra de búsqueda, accesos directos |
| `/battles` | Catálogo | Búsqueda full-text con filtros y paginación |
| `/battles/:id` | Ficha de batalla | Detalle completo con mini-mapa y facciones |
| `/wars/:id` | Ficha de guerra | Lista de batallas, estadísticas y mini-mapa |
| `/map` | Map Explorer | Mapa a pantalla completa con clustering |
| `/timeline` | Timeline | Feed cronológico agrupado por siglo |
| `/commanders/:id` | Perfil de comandante | Historial y ratio de victorias |
| `/login` | Login | Formulario de autenticación |
| `/register` | Registro | Creación de cuenta |

---

## Secciones del frontend

- [Páginas](paginas.md) — Descripción detallada de cada página
- [Map Explorer](mapa.md) — Arquitectura del mapa interactivo
