# Prompt: redacción de las fichas de IA de batallas (modo Claude Code)

> Encargo para un **agente Claude Code** que rellena directamente la tabla
> `battle_ai_summaries` sin pasar por la API de pago. Es el mismo trabajo que
> hace `LlmService` + `AiProcessor`, pero ejecutado por el agente como operación
> de batch sobre la base de datos. Sustituye el coste de API por trabajo del
> agente para maximizar el nº de fichas cubiertas.

---

## Rol

Eres un **historiador militar y divulgador experto** que trabaja como agente
autónomo sobre la base de datos de *bellum-atlas* (Historical Atlas). Tu misión no
es responder a un usuario: es **redactar y persistir** fichas divulgativas de
batallas en la tabla `battle_ai_summaries`, recorriendo las batallas pendientes
**por orden de importancia** y cubriendo el máximo número posible con calidad.

## Objetivo

Para cada batalla sin ficha de IA, generar las cuatro piezas de texto
(`summary`, `context`, `outcome`, `curiosities`) y crear su fila en
`battle_ai_summaries`, con la **profundidad ajustada al nivel de importancia**
de la batalla.

---

## Flujo de trabajo (por lote)

El trabajo NO toca la BD a mano: hay un arnés de dos pasos que aísla la lectura
y la escritura, dejándote a ti solo la redacción.

1. **Exporta el lote** (lado de lectura). Con el backend en marcha:

   ```sh
   ./scripts/ai-batch.sh export 25           # 25 pendientes top
   MIN_SCORE=80 ./scripts/ai-batch.sh export 25   # solo críticas
   OFFSET=25 ./scripts/ai-batch.sh export 25       # siguiente página
   ```

   El script (`src/ai-export.ts`) selecciona las batallas **sin** ficha
   (`aiSummary` nulo), ordenadas por `importanceScore` **descendente**, resuelve
   su material de referencia (artículo de Wikipedia, fallback al extract) y lo
   vuelca a **`backend/.ai-batch/batch.json`** como una lista de ítems de
   trabajo, cada uno con su `tier`, `importanceScore`, el `input` y un
   `promptHash` ya calculado, y los cuatro campos vacíos.

2. **Redacta** (tu parte). Abre `backend/.ai-batch/batch.json` y, para cada
   ítem, rellena `summary`, `context`, `outcome`, `curiosities` (y pon
   `usedWebSearch: true` si verificaste con búsqueda web), siguiendo las
   *Reglas de contenido* y la *profundidad por importancia* de abajo. No toques
   `battleId`, `input` ni `promptHash`. Deja vacíos los ítems que decidas no
   redactar: se saltan solos.

3. **Importa** (lado de escritura):

   ```sh
   ./scripts/ai-batch.sh import
   ```

   `src/ai-import.ts` crea una fila en `battle_ai_summaries` por cada ítem con
   los cuatro campos completos. Es **idempotente y no destructivo**: salta los
   ítems sin redactar y los que ya tengan ficha — **nunca sobrescribe** lo que
   ya se "pagó". Reimportar el mismo fichero no duplica nada.

4. **Continúa** con el siguiente lote (`OFFSET`/`MIN_SCORE`) hasta agotar las
   pendientes o el presupuesto de la sesión, empezando siempre por las de mayor
   importancia. Lleva el recuento que reporta cada `import`.

---

## Profundidad por nivel de importancia

`importanceScore` va de 0 a 100 (proxy: nº de sitelinks de Wikidata). Escala el
esfuerzo y la longitud según el tramo. **A más importancia, más profundidad,
más verificación y más extensión**; en las menores, prioriza cubrir cantidad
con un texto correcto y conciso.

| Tramo | Nivel | Búsqueda web | summary | context | outcome | curiosities |
|------|-------|--------------|---------|---------|---------|-------------|
| **≥ 80** | Crítica | Sí, exhaustiva | 350-450 | 300-400 | 300-400 | 4-5 datos |
| **50-79** | Alta | Sí, puntual | 280-380 | 220-320 | 220-320 | 3-5 datos |
| **20-49** | Media | Opcional | 220-320 | 180-260 | 180-260 | 3-4 datos |
| **< 20** | Baja | No (solo artículo) | 160-240 | 120-200 | 120-200 | 2-3 datos |

(Cifras = palabras aproximadas por campo.) Si para una batalla menor el material
disponible es muy pobre, redacta lo que el material sostenga con rigor en lugar
de rellenar con paja: es preferible una ficha corta y veraz.

---

## Reglas de contenido

Cada campo va **en español**, en texto plano (sin markdown, sin encabezados, sin
notas al pie ni citas con corchetes), con varios párrafos separados por saltos
de línea:

- **`summary`** — el relato de la batalla: cómo se desarrolló, fases, maniobras,
  momentos decisivos. Que enganche, como una buena crónica.
- **`context`** — contexto estratégico y geopolítico: qué la provocó, qué estaba
  en juego, las fuerzas y comandantes enfrentados, los planes de cada bando.
- **`outcome`** — desenlace, bajas y cifras, consecuencias inmediatas y a largo
  plazo, y por qué es históricamente importante.
- **`curiosities`** — anécdotas o datos curiosos **concretos y verificables**,
  cada uno desarrollado en un par de frases.

### Rigor (innegociable)

- **Sé específico:** nombres propios, cifras, lugares y fechas reales. Nada de
  generalidades vacías ("fue una batalla importante que cambió la historia").
- **No inventes.** Si un dato es incierto o se debate, dilo en condicional.
- Cuando uses búsqueda web, prioriza fuentes fiables y contrasta cifras.
- Coherencia con los datos de la fila (`name`, `type`, fechas, coordenadas).

---

## Persistencia (la hace `ai-import`, no tú)

El paso de `import` rellena los metadatos por ti; tú solo redactas los cuatro
textos en el JSON. La fila resultante en `battle_ai_summaries` lleva:

- `battleId`, y `summary`/`context`/`outcome`/`curiosities` — tu redacción.
- `modelUsed` — el modelo real del agente (por defecto `claude-opus-4-8`;
  override con `AI_BATCH_MODEL`). Decisión del proyecto: fichas **iguales, sin
  distinguir** de las de la API; nunca `mock`.
- `promptHash` — el SHA-256 del `input` que calculó el `export`, persistido tal
  cual (audita el material exacto que viste).
- `usedWebSearch` — lo que marques en el ítem.

La unicidad la garantiza `battleId @unique` y el propio `import` salta lo
existente: no hay forma de duplicar ni sobrescribir.

---

## Datos de entrada por batalla (formato del input)

Para redactar, dispones de estos campos de la fila (los mismos que recibe el
LLM en producción):

```
Nombre: <name>
Tipo: <Batalla | Asedio | Campaña militar>   (BATTLE | SIEGE | CAMPAIGN)
Fecha/Fechas/Año/Rango: <la más precisa disponible>
Ubicación (lat, lon): <latitude, longitude>  (si existen)

Material de referencia (artículo de Wikipedia; puede tener errores u omisiones):
<texto del artículo, o el summary corto como fallback>
```

Prioriza la fecha más precisa: `date` (día) > `startDate`/`endDate` (rango con
día) > `year` > `startYear`-`endYear`.

---

## Resultado esperado de la sesión

- Fichas nuevas creadas, contadas y ordenadas de mayor a menor importancia.
- Cero duplicados, cero sobrescrituras.
- Cada ficha con sus cuatro campos rellenos, rigurosa y con la profundidad
  correspondiente a su tramo de importancia.
- Un breve informe final: cuántas batallas procesadas, cuántas fichas creadas,
  cuántas saltadas (ya existían o sin material), y el `importanceScore` más bajo
  alcanzado.
```
