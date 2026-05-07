# Guía de Estilos — AresCodex

> La guerra no es gloriosa. Pero tampoco es solo desolación. Es las dos cosas a la vez, y esa tensión es lo que AresCodex debe transmitir.

Esta guía no es una lista de tokens de diseño. Es un sistema de decisiones visuales que nace de una pregunta central: **¿cómo se siente pararse delante de un mapa de batallas históricas?**

Se siente peso. Se siente escala. Se siente el frío de las cifras de bajas y también la grandeza de los que las protagonizaron. AresCodex debe capturar exactamente eso.

---

## Filosofía visual

### La metáfora del cuartel general

La interfaz es una sala de mando en la oscuridad. Mesas de mapas iluminadas por lámparas frías. Cables de campo. Documentos con sellos de tinta roja. Chinchetas sobre acetatos. Todo tiene un propósito. Nada es decorativo.

No es un videojuego. No es una enciclopedia. Es un instrumento de análisis histórico con la gravedad que eso merece.

### Los dos tonos de la guerra

El diseño debe sostenerse en la tensión entre dos verdades simultáneas:

| La crudeza | La grandeza |
|---|---|
| Gris grafito, negro profundo | Dorado bronce, rojo carmín |
| Tipografía condensada, sin gracia | Mayúsculas monumentales en titulares |
| Datos fríos: 74.000 bajas | "La Guardia Muere pero no se Rinde" |
| Bordes afilados, sin redondear | Medallas, laureles, iconografía épica |
| Silencio visual, densidad informacional | Momentos de contraste y respiración |

Ninguno de los dos tonos domina al otro. Cuando uno aparece, el otro está implícito.

---

## Paleta de colores

### Colores base (oscuros)

Estos son los tonos del campo de batalla al anochecer, del metal oxidado, del barro seco.

```css
--color-background:      #0D0D0D;  /* negro carbón — fondo de la aplicación */
--color-surface:         #141414;  /* carbón — cards, paneles laterales */
--color-surface-raised:  #1C1C1C;  /* grafito oscuro — hover, modales */
--color-border:          #2A2A2A;  /* línea de trinchera — separadores */
--color-border-subtle:   #1F1F1F;  /* borde casi invisible para estructura */
```

### Colores de texto

Inspirados en documentos militares impresos sobre papel envejecido.

```css
--color-text-primary:    #E8E0D0;  /* pergamino — texto principal */
--color-text-secondary:  #8A8278;  /* tinta desgastada — texto secundario */
--color-text-muted:      #4A4540;  /* barely legible — metadatos, timestamps */
--color-text-inverse:    #0D0D0D;  /* negro sobre fondos claros */
```

### Colores de acento

El rojo de la sangre y el dorado de las medallas. Usarlos con contención.

```css
/* Rojo carmín — victoria, acción, peligro */
--color-crimson:         #8B1A1A;
--color-crimson-bright:  #C0392B;  /* solo para CTAs y badges de victoria */
--color-crimson-subtle:  #2D0A0A;  /* fondo de alerts destructivos */

/* Dorado bronce — valor, mérito, destacado */
--color-gold:            #B8860B;
--color-gold-bright:     #D4A017;  /* titulares épicos, badges de comandante */
--color-gold-subtle:     #1A1200;  /* fondo de elementos premium */

/* Verde oliva militar — neutro cálido, mapa, datos */
--color-olive:           #4A5240;
--color-olive-bright:    #6B7A5A;  /* iconos de mapa, indicadores de era */
--color-olive-subtle:    #1A1E16;  /* fondo del mapa, paneles de filtros */
```

### Semántica de resultados

Las fichas de batalla usan color para comunicar el desenlace de cada bando de un vistazo.

```css
--result-victory:        #1A3A1A;  /* verde oscuro — victoria */
--result-victory-text:   #4CAF50;
--result-defeat:         #3A0A0A;  /* rojo oscuro — derrota */
--result-defeat-text:    #EF5350;
--result-draw:           #1A1A2A;  /* azul petróleo — empate */
--result-draw-text:      #64B5F6;
--result-inconclusive:   #2A2010;  /* ámbar oscuro — indeciso */
--result-inconclusive-text: #FFA726;
```

!!! warning "Sobre el uso del rojo"
    El rojo brillante (`--color-crimson-bright`) está reservado exclusivamente para llamadas a la acción primarias y badges de victoria decisiva. Usarlo en más sitios lo vacía de significado. Si todo es urgente, nada lo es.

---

## Tipografía

### Sistema tipográfico

Tres fuentes, tres roles distintos. Ninguna es intercambiable.

| Rol | Fuente | Uso |
|---|---|---|
| **Display** | `Cinzel` | Títulos de página, nombres de batallas y guerras en fichas |
| **Body** | `Inter` | Todo el texto corrido, UI, labels, descripiciones |
| **Data / Mono** | `JetBrains Mono` | Fechas, coordenadas, estadísticas, código |

```html
<!-- Google Fonts — añadir al <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Justificación de `Cinzel`

`Cinzel` es una tipografía romana clásica de mayúsculas con proporciones de inscripción lapidaria. Su origen en el alfabeto monumental romano la conecta directamente con la historia militar occidental. No es decorativa: es estructural. Transmite permanencia, la sensación de que los eventos que nombra están grabados en piedra.

### Escala tipográfica

```css
/* Display — solo Cinzel, solo para nombres propios y títulos épicos */
--text-display-xl: 4rem    / 64px  — nombre de batalla en ficha principal
--text-display-lg: 2.5rem  / 40px  — título de sección en hero
--text-display-md: 1.75rem / 28px  — nombre de guerra en card

/* Body — Inter */
--text-body-lg:   1.125rem / 18px  — descripción principal
--text-body-md:   1rem     / 16px  — texto estándar
--text-body-sm:   0.875rem / 14px  — metadatos, labels
--text-body-xs:   0.75rem  / 12px  — timestamps, coordenadas en mapa

/* Mono — JetBrains Mono */
--text-mono-md:   0.9375rem / 15px — fechas, coordenadas
--text-mono-sm:   0.8125rem / 13px — IDs, referencias técnicas
```

### Reglas de uso tipográfico

**Cinzel solo en mayúsculas o title case, nunca en minúsculas.** Las letras romanas no tienen minúsculas: forzarlas rompe la coherencia histórica de la fuente.

**No mezclar Cinzel con negrita en cuerpo de texto.** La gravedad de Cinzel ya porta suficiente peso. En contextos de mucho texto, su uso masivo cansa. Reservarlo para el nombre del elemento, no para la descripción.

**El monoespaciado para datos, siempre.** Cuando el usuario ve `1815-06-18` en Inter, es información. Cuando lo ve en JetBrains Mono, es un dato de archivo, un registro, algo que fue verificado y catalogado. El cambio de fuente añade significado sin añadir palabras.

---

## Espaciado y layout

### Grid base

```css
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-6:   24px
--space-8:   32px
--space-12:  48px
--space-16:  64px
--space-24:  96px
```

### Principio de densidad controlada

Los documentos militares son densos. Un despacho de campo no tiene márgenes generosos. AresCodex hereda parte de esa densidad: la información debe estar presente, disponible, sin desperdiciar espacio.

Pero hay momentos de silencio. El mapa a pantalla completa. El nombre de la batalla en solitario sobre el fondo negro antes de que cargue el resto de la ficha. Esos momentos de vacío son intencionales y dan más peso a lo que los rodea.

**Regla práctica**: compacto en listas y tablas, generoso en fichas de detalle y en el mapa.

### Border radius

Los elementos de AresCodex no son redondeados. Las esquinas cuadradas reflejan el metal, la piedra, el ángulo recto de los planos de batalla.

```css
--radius-none: 0px    /* cards, badges de resultado, botones primarios */
--radius-sm:   2px    /* inputs, tooltips — apenas perceptible */
--radius-md:   4px    /* modales — la única excepción justificada */
```

Nada de `border-radius: 8px` en elementos de la UI principal. Eso es lenguaje de apps de consumo, no de archivos de guerra.

---

## Iconografía

### Sistema de iconos: `Lucide`

Lucide ofrece iconos de trazo fino y estilo minimalista. Se adaptan al tono sobrio sin añadir ruido visual.

Los iconos se usan para **orientar**, no para decorar. Cada icono cumple una función informacional:

| Contexto | Icono sugerido | Uso |
|---|---|---|
| Tipo de batalla terrestre | `sword` / `shield` | Badge en card y ficha |
| Tipo naval | `anchor` | Badge en card y ficha |
| Tipo aéreo | `plane` | Badge en card y ficha |
| Asedio | `castle` | Badge en card y ficha |
| Comandante | `user-round` | Perfil y lista de comandantes |
| Ubicación | `map-pin` | Coordenadas y mapa |
| Fecha / cronología | `calendar` | Metadatos de batalla |
| Bajas | `skull` | Con discreción — solo en ficha detallada |
| Victoria | `trophy` | Badge de resultado en ficha |
| Búsqueda | `search` | Barra global |
| Filtros | `sliders-horizontal` | Panel de filtros |

!!! note "El icono `skull`"
    Usarlo únicamente en la sección de bajas dentro de la ficha de batalla, nunca en listas o cards. El contexto de detalle le da dignidad. En una lista de tarjetas sería morboso y trivializaría las cifras.

### Tamaños

```css
--icon-sm:  16px  /* inline en texto, metadatos */
--icon-md:  20px  /* botones, labels de filtro */
--icon-lg:  24px  /* navegación principal */
--icon-xl:  32px  /* hero, estados vacíos */
```

---

## Componentes clave

### Card de batalla

La unidad de información más repetida en la aplicación. Debe comunicar en un vistazo: ¿qué? ¿cuándo? ¿quién ganó?

```
┌──────────────────────────────────────────────────────┐
│ [VICTORIA]  LAND                      18 Jun 1815    │  ← banda superior: resultado | tipo | fecha
├──────────────────────────────────────────────────────┤
│                                                      │
│  BATALLA DE WATERLOO                                 │  ← Cinzel 700, texto primario
│  Guerra de los Cien Días                             │  ← Inter 400, texto secundario
│                                                      │
│  📍 Waterloo, Bélgica          ⚔ 72.000 vs 118.000  │  ← mono sm, texto muted
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Especificaciones**:
- Fondo: `--color-surface`
- Borde: `1px solid --color-border`
- Borde izquierdo: `3px solid` con color según resultado (rojo/verde/azul/ámbar)
- Hover: `background: --color-surface-raised`, transición `150ms ease`
- Sin `border-radius`

### Badge de resultado

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌──────────────┐
│  VICTORIA   │   │   DERROTA   │   │    EMPATE   │   │  INDECISO    │
└─────────────┘   └─────────────┘   └─────────────┘   └──────────────┘
  verde oscuro      rojo oscuro       azul petróleo      ámbar oscuro
  texto verde       texto rojo        texto azul          texto ámbar
```

Fuente: `Inter 600`, `letter-spacing: 0.08em`, `text-transform: uppercase`, tamaño `11px`.

### Ficha de batalla — sección de facciones

La sección más crítica de la interfaz. Debe transmitir la oposición de dos fuerzas.

```
┌─────────────────────────┬─────────────────────────┐
│   BANDO 1               │   BANDO 2               │
│                         │                         │
│  Francia                │  Séptima Coalición      │
│  Guardia Imperial       │  Reino Unido             │
│  ─────────────────      │  Prusia                  │
│  Napoleón Bonaparte     │  ─────────────────       │
│  Michel Ney             │  Arthur Wellesley        │
│                         │  Gebhard von Blücher     │
│  ─────────────────      │  ─────────────────       │
│  72.000 efectivos       │  118.000 efectivos       │
│  40.000 bajas           │  22.000 bajas            │
│                         │                         │
│  ✗ DERROTA              │  ✓ VICTORIA              │
└─────────────────────────┴─────────────────────────┘
```

La línea central de separación debe ser fina y sutil. El contraste viene del color de resultado en el pie de cada columna, no de la división física.

### Contadores animados (Home)

Los cuatro contadores del home deben tener una animación de cuenta ascendente al entrar en viewport. La tipografía usa `Cinzel 900` para el número y `Inter 400` para la etiqueta.

```
    64.892                 4.211               193              −3000 a 2024
  BATALLAS              GUERRAS            NACIONES            AÑOS CUBIERTOS
```

La animación es de 1.2 segundos con `easing: cubic-bezier(0.25, 0.46, 0.45, 0.94)`. No añadir sonido ni efectos adicionales. La cifra sola ya impacta.

### Mapa

- **Estilo base**: Mapbox `mapbox://styles/mapbox/dark-v11` o equivalente oscuro customizado
- **Color de pins**: `--color-crimson-bright` para batallas estándar
- **Pin de victoria**: dorado `--color-gold-bright`
- **Cluster**: círculo con borde `--color-border`, fondo `--color-surface`, número en `JetBrains Mono`
- **Popup**: fondo `--color-surface`, sin sombra difusa — borde fino `--color-border`, tipografía compacta

El mapa nunca debe tener un fondo blanco ni pastel. Si el estilo Mapbox oscuro no está disponible, usar filtro CSS `invert(1) hue-rotate(180deg)` como fallback de emergencia.

---

## Voz y tono

El diseño visual solo es la mitad. El texto también porta la sensación.

### Principios de redacción

**Exacto, no aproximado.** No "muchas bajas" sino "74.000 bajas estimadas". No "duró varios años" sino "1936–1939 (2 años, 8 meses, 14 días)". La precisión es respeto por los hechos y por quien los lee.

**Sobrio, no frío.** Los datos se presentan sin dramatismo artificial, pero tampoco se deshumanizan. Una cifra de bajas no es un número de filas en una base de datos: es una consecuencia histórica.

**Sin jerga de producto.** AresCodex no tiene "features", tiene capacidades. No hay "onboarding", hay una primera visita. El vocabulario es el de un archivo histórico, no el de una startup.

### Ejemplos de microcopy

| Contexto | ✗ Evitar | ✓ Usar |
|---|---|---|
| Estado vacío en búsqueda | "¡Ups! No encontramos resultados" | "Sin registros para esta consulta." |
| Error de carga del mapa | "Algo salió mal 😅" | "No se pudo cargar el mapa. Intenta de nuevo." |
| Página 404 | "Esta página se perdió en el tiempo" | "Registro no encontrado." |
| CTA principal | "¡Explora el mapa!" | "Explorar el mapa" |
| Bajas desconocidas | "N/A" | "Cifra no documentada" |
| Resultado indeciso | "Empate" | "Resultado indeciso" o "Sin vencedor claro" |

---

## Animaciones y transiciones

La guerra no es fluida. Pero la interfaz debe ser usable.

### Principios

**Ninguna animación por encima de 300ms en interacciones de UI.** Los hover, focus y transiciones de estado son `150ms ease`. Las animaciones de entrada de página son `300ms ease-out`.

**Sin bounce, sin spring.** El `cubic-bezier` por defecto para todo: `0.25, 0.46, 0.45, 0.94`. Las físicas de rebote son lenguaje de apps de consumo infantil.

**Las animaciones comunican estado, no belleza.** El único caso justificado para una animación larga (>400ms) son los contadores del home y la aparición progresiva de pins en el mapa.

### Tokens de transición

```css
--transition-fast:   150ms ease          /* hover, focus */
--transition-base:   250ms ease-out      /* aparición de elementos */
--transition-slow:   400ms ease-out      /* modales, paneles laterales */
--transition-count:  1200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)  /* contadores */
```

---

## Accesibilidad

El peso visual de este diseño no puede sacrificar legibilidad.

- **Contraste mínimo**: WCAG AA en texto normal (4.5:1), WCAG AAA en texto de bajas y datos críticos (7:1)
- `--color-text-primary: #E8E0D0` sobre `--color-background: #0D0D0D` → ratio **15.3:1** ✓
- `--color-crimson-bright: #C0392B` sobre `--color-background: #0D0D0D` → ratio **4.7:1** ✓
- `--color-gold-bright: #D4A017` sobre `--color-background: #0D0D0D` → ratio **8.2:1** ✓
- Todos los iconos informativos tienen `aria-label` o texto alternativo visible
- El mapa tiene un modo de lista accesible para usuarios con lector de pantalla
- Los badges de resultado no comunican información solo por color: siempre llevan texto

---

## Lo que este diseño rechaza

Explicitarlo es tan importante como lo que acepta.

| Rechazado | Por qué |
|---|---|
| Bordes redondeados > 4px | Lenguaje de apps de consumo, incompatible con el tono |
| Animaciones con bounce o spring | Infantilizan la interfaz |
| Colores saturados y brillantes como primario | Restan seriedad; la saturación se reserva para momentos de impacto |
| Ilustraciones o iconos caricaturescos | El contenido es suficientemente gráfico |
| Gradientes de fondo complejos | El diseño oscuro plano ya tiene profundidad por contraste |
| Tipografía en minúsculas para titulares | Cinzel requiere mayúsculas; las minúsculas rompen la coherencia |
| Emojis en la interfaz de datos | Los emojis en números de bajas son una falta de respeto al contenido |
| Texto motivacional o gamificación | AresCodex no da puntos ni logros; documenta la historia |

---

## Resumen de tokens

```css
:root {
  /* Backgrounds */
  --color-background:      #0D0D0D;
  --color-surface:         #141414;
  --color-surface-raised:  #1C1C1C;
  --color-border:          #2A2A2A;
  --color-border-subtle:   #1F1F1F;

  /* Text */
  --color-text-primary:    #E8E0D0;
  --color-text-secondary:  #8A8278;
  --color-text-muted:      #4A4540;

  /* Crimson */
  --color-crimson:         #8B1A1A;
  --color-crimson-bright:  #C0392B;
  --color-crimson-subtle:  #2D0A0A;

  /* Gold */
  --color-gold:            #B8860B;
  --color-gold-bright:     #D4A017;
  --color-gold-subtle:     #1A1200;

  /* Olive */
  --color-olive:           #4A5240;
  --color-olive-bright:    #6B7A5A;
  --color-olive-subtle:    #1A1E16;

  /* Results */
  --result-victory:        #1A3A1A;
  --result-victory-text:   #4CAF50;
  --result-defeat:         #3A0A0A;
  --result-defeat-text:    #EF5350;
  --result-draw:           #1A1A2A;
  --result-draw-text:      #64B5F6;
  --result-inconclusive:   #2A2010;
  --result-inconclusive-text: #FFA726;

  /* Typography */
  --font-display: 'Cinzel', serif;
  --font-body:    'Inter', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* Radius */
  --radius-none: 0px;
  --radius-sm:   2px;
  --radius-md:   4px;

  /* Transitions */
  --transition-fast:  150ms ease;
  --transition-base:  250ms ease-out;
  --transition-slow:  400ms ease-out;
}
```
