# Ingesta de datos (Wikidata + Wikipedia)

La base de datos se puebla de dos formas complementarias:

| Vía | Comando | Cuándo |
|-----|---------|--------|
| **Seed offline** | `npm run seed` | Arranque rápido / tests / sin red. Inserta 3 batallas famosas escritas a mano. |
| **Ingesta Wikidata** | `npm run ingest -- ...` | Poblado real desde Wikidata + Wikipedia. |

Las dos **conviven**: si ingieres una batalla que ya estaba en el seed, la
ingesta **adopta** esa fila (no duplica) y la completa con datos reales.

---

## El pipeline (instrucción 4.2)

```mermaid
flowchart LR
    A[Paso 1<br/>Query Wikidata SPARQL<br/>+ Wikipedia REST] --> B[Paso 2<br/>Normalización<br/>años · coords · score · slug]
    B --> C[Paso 3<br/>Postgres / Prisma<br/>upsert por wikidataId]
    C --> D[Paso 4<br/>Encola IA en BullMQ<br/>si importanceScore > umbral]
```

| Paso | Implementación |
|------|----------------|
| 1. Query | `src/ingestion/wikidata.client.ts` — SPARQL a `query.wikidata.org` (datos de la batalla) + REST de Wikipedia (`/page/summary`) para el *extract* y la **imagen**. |
| 2. Normalización | `IngestionService` — años desde fechas ISO, coords válidas, `importanceScore` = nº de sitelinks (0-100), `slug`, imagen renderizable. |
| 3. Almacenamiento | `prisma.battle.upsert/create` con clave `wikidataId` (idempotente). |
| 4. IA | `AiQueueService.enqueue()` para batallas con `importanceScore > AI_AUTO_QUEUE_MIN_SCORE` (80). |

### Mapeo Wikidata/Wikipedia → modelo

| Dato | Fuente |
|------|--------|
| Nombre | `rdfs:label` (es/en) |
| Año | `P585` (point in time) / `P580`–`P582` (start/end) |
| Fecha exacta (día) | `P585`/`P580`/`P582` con `timePrecision` = 11 (día). Si no, sólo año. |
| Coordenadas | `P625` |
| Tipo (BATTLE/SIEGE/CAMPAIGN) | `P31` (instance of) clasificado |
| Importancia | nº de `sitelinks` |
| **Imagen** | **Wikipedia REST** (`thumbnail`/`originalimage`, es→en); `P18` sólo si es jpg/png |
| **Resumen** | **Wikipedia REST** `extract` (es→en) |

!!! note "Por qué la imagen sale de Wikipedia"
    La `P18` de Wikidata a veces es un `.tiff`/`.svg` que el navegador no
    renderiza (p. ej. Trafalgar). La REST de Wikipedia siempre devuelve una
    imagen web (jpg/png), y normalmente mejor. Por eso es la fuente primaria,
    con fallback al artículo en inglés si el español no tiene.

---

## Comandos

Todos se lanzan **dentro del contenedor backend**. Tienes un wrapper:
`./backend/scripts/ingest.sh`.

```bash
# Una batalla por su QID de Wikidata
./backend/scripts/ingest.sh battle:Q165425        # Lepanto

# Bulk: las N batallas más relevantes del mundo (por sitelinks)
TOP_LIMIT=100 ./backend/scripts/ingest.sh top-battles

# Bulk: TODAS las batallas (paginado)
./backend/scripts/ingest.sh all-battles                  # con tope por defecto
MAX_PAGES=0 ./backend/scripts/ingest.sh all-battles      # de verdad TODAS

# Varios objetivos a la vez
./backend/scripts/ingest.sh battle:Q165425 battle:Q171416
```

### `top-battles` vs `all-battles`

| | `top-battles` | `all-battles` |
|---|---|---|
| Qué trae | Las N más relevantes | TODAS (paginado) |
| Orden | Por importancia (sitelinks) | Por importancia, paginado |
| Uso | Catálogo curado | Poblado masivo |

Ambos traen los mismos campos por batalla (datos + imagen + resumen de Wikipedia).

O directamente con npm dentro del contenedor:

```bash
docker exec bellum_atlas-backend-1 npm run ingest -- battle:Q165425
```

### Variables de entorno (modo bulk)

| Variable | Defecto | Aplica a | Significado |
|----------|---------|----------|-------------|
| `TOP_LIMIT` | 50 | top-battles | Nº de batallas a traer. |
| `TOP_OFFSET` | 0 | top-battles | Desplazamiento. |
| `PAGE_SIZE` | 200 | all-battles | Batallas por página de la query. |
| `MAX_PAGES` | 5 | all-battles | Tope de páginas. **`0` = sin límite** (todas). |
| `START_OFFSET` | 0 | all-battles | Offset inicial, para **reanudar** una ingesta cortada. |
| `DELAY_MS` | 1000 | bulk | Pausa entre páginas/entidades (cortesía con la API). |

!!! warning "Ingerir 'todas' de verdad"
    `MAX_PAGES=0 ./backend/scripts/ingest.sh all-battles` recorre TODAS las
    batallas con coordenadas (decenas de miles). Es reanudable: si se corta,
    relánzalo con `START_OFFSET=<última página * PAGE_SIZE>`. La paginación con
    offsets muy profundos puede ralentizarse o dar timeouts puntuales de la
    API; el cliente reintenta con backoff.

---

## Cómo encontrar un QID

Busca la entidad en [wikidata.org](https://www.wikidata.org) y copia el
identificador `Q…` de la URL. Ejemplos útiles:

| Entidad | QID |
|---------|-----|
| Batalla de Lepanto | `Q165425` |
| Segunda Guerra Mundial | `Q362` |
| Guerras Napoleónicas | `Q78994` |
| Napoleón Bonaparte | `Q517` |

---

## Idempotencia y colisiones

- **Reingerir** la misma entidad **actualiza** (clave `wikidataId`), no duplica.
- Una fila del **seed** (sin `wikidataId`) con el mismo slug se **adopta**: se
  actualiza y se le asigna el `wikidataId`.
- Dos entidades **distintas** con el mismo nombre (homónimos) reciben un slug
  desambiguado con sufijo (`-qNNN`).

---

## Relación con la IA

La ingesta sólo **encola** la generación; nunca llama al LLM en línea (ver
[IA (LLM)](ia.md)). Las batallas con `importanceScore > 80` se pre-generan en
background tras la ingesta. El resto se generan a demanda cuando un usuario
Premium abre su ficha.

!!! warning "Requiere red"
    La ingesta llama a las APIs públicas de Wikidata y Wikipedia. Necesita
    salida a Internet desde el contenedor. El modo bulk puede tardar (hay un
    `DELAY_MS` entre entidades para no saturar la API).
