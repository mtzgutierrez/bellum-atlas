# Páginas

---

## Home (`/`)

Primera impresión del producto. Sencilla pero impactante.

- **Contadores animados** al cargar: total de batallas, guerras, países involucrados, rango de años
- **Barra de búsqueda** global prominente (navega a `/battles?q=...`)
- **Accesos directos**: Explorar mapa, Ver timeline, Batallas más conocidas

---

## Catálogo de batallas (`/battles`)

El núcleo funcional. Búsqueda rápida y filtros combinables.

- Búsqueda full-text sobre nombre, guerra, comandantes y lugar
- Filtros: era histórica, país, resultado, tipo (terrestre/naval/aéreo/asedio)
- Resultados paginados con tarjetas: nombre, fecha, guerra padre, bando ganador, lugar
- Ordenación por fecha, nombre o número de bajas
- **URL con parámetros** para que los resultados sean compartibles (`/battles?q=Waterloo&result=victory`)

---

## Ficha de batalla (`/battles/:id`)

Página central de la aplicación.

- Cabecera: nombre, fecha, guerra padre, resultado destacado
- **Mini-mapa embebido** (Mapbox) centrado en la ubicación exacta
- Sección de facciones: cada bando con comandantes, bajas estimadas y resultado
- Descripción extraída de Wikipedia con enlace al artículo original
- **Batallas relacionadas**: otras batallas de la misma guerra, ordenadas cronológicamente

---

## Ficha de guerra (`/wars/:id`)

- Nombre, período completo, resultado global y descripción
- Lista completa de batallas ordenadas cronológicamente
- Estadísticas básicas: número de batallas, total de bajas, duración en días
- **Mini-mapa** con todos los pins de las batallas de esa guerra

---

## Timeline (`/timeline`)

Feed histórico cronológico. No es un eje animado (eso es v2): es un listado navegable.

- Batallas y guerras agrupadas por siglo
- Filtro por era histórica
- Diseño tipo feed con línea vertical de tiempo y tarjetas laterales
- Cada ítem: nombre, fecha, resultado y enlace a la ficha

---

## Perfil de comandante (`/commanders/:id`)

- Nombre, país, años de vida, descripción breve
- Lista de batallas en las que participó con resultado personal (victoria/derrota)
- Ratio de victorias: `victorias / total batallas`
- Enlace a Wikipedia
