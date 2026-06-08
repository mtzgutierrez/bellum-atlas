# Roadmap

---

## Estado actual

| Bloque | Estado |
|---|---|
| Infraestructura (Docker, Postgres, Redis) | ✓ |
| Ingesta Wikidata + Wikipedia (imagen/resumen) | ✓ |
| API de batallas + mapa | ✓ |
| Narrativa por IA (Premium, BullMQ) | ✓ |
| Frontend (Home, Catálogo, Ficha, Mapa) | ✓ |
| Deploy en producción | Pendiente |

**Próximos criterios**:

- Poblar la BD con un `all-battles` completo.
- Clustering en el mapa y carga por bounding box.
- Deploy en producción con dominio y HTTPS.

---

## Post-MVP: Features por prioridad

### Alta prioridad

| Feature | Descripción |
|---|---|
| **AI Insights (Claude API)** | ✓ Implementado: narrativa por IA (Premium) precomputada. Falta afinar prompts y activar Claude en prod. |
| **Statistics Dashboard** | Gráficas interactivas: batallas por siglo, por tipo, mapa de densidad. Muy compartible. |
| **Battle Comparator** | Comparativa side-by-side de dos batallas: año, tipo, importancia, narrativa. |

### Prioridad media

| Feature | Descripción |
|---|---|
| **Timeline visual animada** | Eje cronológico navegable tipo `vis-timeline` o `d3-timeline`. |
| **Research Workspace** | Notas personales del usuario vinculadas a batallas y guerras. Conexiones entre eventos. |
| **Colecciones de usuario** | "Mis batallas favoritas", listas temáticas compartibles por URL. |
| **Citation Export** | Citas en formato Chicago/APA/MLA. Muy útil para universitarios. |

### Prioridad baja

| Feature | Descripción |
|---|---|
| **What-if Simulator** | Contrafactuales con IA: "¿qué hubiera pasado si Napoleón no hubiera atacado en Waterloo?" La feature más espectacular pero también la más compleja. |
| **Heatmap histórico** | Capa de densidad de conflictos por región y época. |
| **PWA / modo offline** | Acceso sin conexión para investigadores de campo. |
| **OAuth** | Login con Google y GitHub. |
| **i18n** | Internacionalización: inglés, francés, alemán. |
| **API pública** | Endpoint documentado para que terceros consuman los datos de Bellum Atlas. |

---

## Modelo de negocio

Una vez completado el MVP, Bellum Atlas puede monetizarse con tres fuentes compatibles:

### 1. Publicidad contextual (AdSense / Ezoic)
Tráfico orgánico SEO sobre búsquedas de nicho histórico-militar. Con **15.000–20.000 visitas/mes** se alcanzan ~100 €/mes.

### 2. Afiliados Amazon
Libros de historia militar recomendados en cada ficha (comisión 3–10%). El usuario que lee sobre Waterloo tiene alta intención de compra de bibliografía relacionada.

### 3. Tier premium (Patreon / Stripe)
**~5 €/mes** para entusiastas y estudiantes. Acceso a:

- Mapas animados de movimientos de tropas
- Exportación (PDF, CSV, citas académicas)
- Sin anuncios
- Acceso anticipado a features nuevas

Con **20 suscriptores premium** se superan los 100 €/mes.

### Proyección
Con SEO de nicho bien trabajado y 20–30 páginas de batallas optimizadas, **100 €/mes es alcanzable en 6–12 meses** prácticamente sin mantenimiento activo una vez completado el seed inicial.

### Comunidades para distribución
- [r/WarHistory](https://reddit.com/r/WarHistory), [r/HistoryMaps](https://reddit.com/r/HistoryMaps)
- Canales de YouTube de historia militar
- Foros de wargames y simulación histórica
- Estudiantes universitarios de Historia y Ciencias Militares
