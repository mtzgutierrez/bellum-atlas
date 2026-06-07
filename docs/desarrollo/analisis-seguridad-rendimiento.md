# Análisis de Seguridad y Rendimiento — ares-codex

> Fecha: 2026-06-08 · Rama analizada: `feat/llm` · Alcance: backend NestJS, frontend
> React, despliegue Docker Compose. Análisis estático del código + revisión de
> configuración. No se ejecutaron pruebas dinámicas todavía (ver plan de pruebas).
>
> **Actualización (2026-06-08):** la aplicación **no tiene cuentas de usuario** (ni
> free ni premium). Se ha **eliminado toda la capa de autenticación** (módulo
> `auth`, JWT, endpoint `dev-token`, dependencia `@nestjs/jwt`, manejo de token en
> el frontend y variables `JWT_*`). Los hallazgos de seguridad asociados (antiguos
> S-1, S-3, S-8, S-9) quedan **resueltos por eliminación** y se documentan abajo
> como tales. La numeración del resto de hallazgos se conserva para trazabilidad.

## Resumen ejecutivo

El sistema es una API de lectura mayoritariamente pública (catálogo de batallas,
mapa, narrativa de IA pre-generada) con un modelo de **"Zero Real-Time
Generation"** para la IA: el LLM nunca se invoca dentro de una request HTTP. Esa
decisión arquitectónica es sólida y elimina la clase de riesgos más cara
(coste/latencia/DoS por inferencia on-demand).

Sin embargo, el análisis revela:

- **1 bug crítico de despliegue** que impide arrancar el contenedor de producción.
- **Varios puntos de seguridad** centrados en la exposición de servicios de
  infraestructura (Redis/Postgres) y endurecimiento ausente (headers, validación,
  CORS). Los riesgos ligados a autenticación desaparecen al no haber cuentas.
- **Puntos de rendimiento** en endpoints públicos sin caché que ejecutan consultas
  no indexables (búsquedas con comodín inicial, agregados de tabla completa) y un
  endpoint que **rompe el principio Zero Real-Time** haciendo un fetch externo
  bloqueante dentro de la request (`/battles/:id/article`).

Prioridad recomendada: **(0)** arreglar el entrypoint de producción → **(1)**
exposición de Redis/Postgres → **(2)** caché + índices en endpoints públicos →
**(3)** endurecimiento general.

---

## 0. Bug crítico de despliegue (bloqueante)

| ID | Descripción | Archivo | Severidad |
|----|-------------|---------|-----------|
| D-1 | El `CMD` de producción ejecuta `node dist/index.js`, pero `nest build` genera el entrypoint en **`dist/main.js`** (no existe `dist/index.js`). El contenedor `production` falla al instante y entra en *crash-loop*. | `backend/Dockerfile` (stage `production`) | 🔴 Crítica |

**Mitigación:** cambiar a `CMD ["node", "dist/main.js"]`. Añadir un *smoke test*
en CI que levante la imagen `production` y haga `GET /health`.

---

## 1. Hallazgos de seguridad

| ID | Hallazgo | Ubicación | Severidad |
|----|----------|-----------|-----------|
| S-2 | **Redis sin contraseña y expuesto al host** (`ports: 6379:6379`). Redis sin auth es un objetivo conocido de RCE/exfiltración. `docker-compose.prod.yml` no elimina el mapeo de puertos de `docker-compose.yml`, así que en producción Postgres (`5432`) y Redis (`6379`) quedan publicados. | `docker-compose.yml` (redis, postgres) | 🔴 Alta (en prod) |
| S-4 | **Sin `ValidationPipe` global** (ni `whitelist`/`forbidNonWhitelisted`). Los DTOs no se validan con class-validator; los query params se parsean a mano. Inputs no declarados pasan al handler. | `main.ts` (ausente) | 🟠 Media |
| S-5 | **Sin cabeceras de seguridad (helmet).** Faltan `X-Content-Type-Options`, `X-Frame-Options`/CSP, HSTS, etc. | `main.ts` (ausente) | 🟠 Media |
| S-6 | **CORS no se habilita en código** pese a existir `CORS_ORIGIN` en compose. O bien el frontend no puede llamar cross-origin (bug funcional latente), o se confía en el proxy de nginx. Si se habilita, evitar `origin: '*'`. | `main.ts` vs `docker-compose.yml` | 🟡 Baja |
| S-7 | **Swagger (`/api/docs`) expuesto incondicionalmente,** también en producción → enumeración de toda la superficie de API. | `main.ts` | 🟡 Baja |
| S-10 | **Fetch externo con título sin codificar** en la URL (`titleOf`/`titles=${title}`). El valor proviene de Wikidata (no del usuario) y el dominio está restringido por regex a `*.wikipedia.org`, pero conviene `encodeURIComponent` para evitar inyección de parámetros. | `ai/wikipedia-source.ts:22`, `ingestion/wikidata.client.ts:182` | 🟡 Baja |

### Hallazgos resueltos por eliminación de la capa de auth (2026-06-08)
La app no tiene cuentas, así que se borró todo el código de autenticación. Esto
**cierra** los siguientes hallazgos sin necesidad de mitigarlos:

| ID | Hallazgo original | Estado |
|----|-------------------|--------|
| S-1 | JWT_SECRET con default inseguro (`'dev-insecure-change-me'`) | ✅ Eliminado (módulo `auth` y `@nestjs/jwt` borrados) |
| S-3 | `POST /auth/dev-token` emitía tokens premium | ✅ Endpoint eliminado |
| S-8 | Token JWT (30 días) en `localStorage` | ✅ Manejo de token borrado del frontend |
| S-9 | Superficie de auth "muerta" (JWT/tier que no protegía nada) | ✅ Eliminada |

> Nota: el término "tier" sigue apareciendo en `ai-export.ts`, `pregen.ts` y
> `llm.service.ts`, pero ahí designa el **nivel de generación de IA** (con/ sin
> búsqueda web), no cuentas de usuario. Es código vigente, no se toca.

### Notas positivas de seguridad
- **Sin SQL injection:** todo va por Prisma; el único `$queryRaw` (facetas por
  siglo) es una plantilla sin interpolar input de usuario.
- **Zero Real-Time Generation** bien implementado en `ai.controller.ts`: nunca
  encola ni invoca el LLM desde la request.
- El contenedor de backend corre como usuario `node` (no root) y poda
  devDependencies en producción.
- Rate limiting global presente (`ThrottlerModule`).

---

## 2. Hallazgos de rendimiento

| ID | Hallazgo | Ubicación | Severidad |
|----|----------|-----------|-----------|
| P-1 | **`/battles/:id/article` rompe Zero Real-Time:** hace un `fetch` externo a Wikipedia **dentro de la request** (hasta 9000 chars, con reintento de +1.5 s en 429) y **sin timeout/AbortController**. Una ráfaga de primeras visitas o un Wikimedia lento puede acumular requests colgadas y agotar el *pool* de conexiones. | `battle/battle.service.ts:62-71`, `ai/wikipedia-source.ts` | 🟠 Media-Alta |
| P-2 | **Consultas no indexables en endpoints públicos.** Búsqueda por nombre `contains` + `mode:insensitive` (ILIKE `%x%`, comodín inicial → *full scan*) y efemérides `date/startDate endsWith` (sufijo → *full scan*). Hoy con ~1k filas es tolerable; escala mal. | `battle/battle.repository.ts:115,243` | 🟠 Media |
| P-3 | **Faltan índices** en columnas usadas en `orderBy`/`where`: `importanceScore` (ordena casi todo), `sortYear`, `type`, `latitude/longitude` (filtro bbox y `/points`). | esquema Prisma | 🟠 Media |
| P-4 | **`/battles/points` devuelve hasta 10 000 filas** sin caché, con payload grande, en endpoint público (throttle 120/min). Sin filtro de año/bbox puede ser una respuesta enorme en cada *pan/zoom* del mapa. | `battle/battle.repository.ts:85` | 🟠 Media |
| P-5 | **`/battles/stats` ejecuta 8 consultas** (incluida una raw con `CEIL/COALESCE` sobre la tabla completa) **en cada petición, sin caché.** Datos que cambian muy rara vez. | `battle/battle.repository.ts:177` | 🟡 Baja-Media |
| P-6 | **Throttler en memoria (no Redis).** Con varias réplicas de backend el límite se multiplica por instancia y es esquivable; no hay almacén compartido. | `app.module.ts:22` | 🟡 Baja-Media |
| P-7 | **Sin cabeceras de caché HTTP** (`Cache-Control`/ETag) en endpoints de lectura (`points`, `stats`, `timeline`, `on-this-day`, `article`, `:id`). Todo se recalcula en cada hit; sin posibilidad de CDN. | controllers | 🟡 Baja |
| P-8 | **Riesgo de coste/latencia en ingesta masiva con IA real.** `ingestAllBattles`/`ingestTopBattles` encolan IA para cada batalla con `score>80`; con `AI_PROVIDER=anthropic` + web search (5 búsquedas/llamada, bucle `pause_turn`) eso es exactamente el coste que motivó el pivote. El default `mock` lo mitiga, pero no hay tope de gasto/día efectivo. | `ingestion.service.ts:64,113` · `ai/llm.service.ts` | 🟡 Baja-Media |
| P-9 | **Sin timeouts en ningún `fetch`** (Wikipedia/Wikidata/SPARQL). En *background* sólo retiene un job, pero combinado con P-1 afecta a requests de usuario. | `wikipedia-source.ts`, `wikidata.client.ts` | 🟡 Baja |

---

## 3. Plan de pruebas

Pirámide propuesta: **muchas unitarias** (lógica pura, sin red ni BD, *mocks* de
Prisma/colas/`fetch`), **integración media** contra una **Postgres real efímera**
(sin mockear el repositorio) y una capa fina de **seguridad/carga**.

### 3.1 Pruebas unitarias exhaustivas (Jest, ya configurado)

Aisladas, sin BD ni red. Para servicios que dependen de Prisma/BullMQ/`fetch`, se
inyectan dobles (`jest.fn()`); para los `fetch` externos, mockear `global.fetch`.

**Módulo `battle`**
- `battle.controller` → `parseFilters`:
  - rango de años `yearMax - yearMin > 150` **sin** bbox → `BadRequestException`;
    **con** bbox → permitido (cualquier rango).
  - `type`/`sort` inválidos → `undefined` (no rompen); válidos → se respetan.
  - bbox parcial (falta un borde) → `undefined`; bbox completo → objeto.
  - valores no numéricos en `yearMin`/`minImportance` → `undefined`.
  - `toSummary`/`toDto`/`pad2` mapean todos los campos y `hasAiStory` refleja
    presencia de `aiSummary`.
  - `timeline`: `limit` se capa a 300; no numérico/≤0 → 150.
- `battle.repository` → `buildWhere` (probar el objeto Prisma generado, sin BD):
  solapamiento de rangos `year`/`startYear`-`endYear`; `requireCoords`;
  `search` con `mode:insensitive` y `trim`; `minImportance`; `type`; combinación
  AND vacía → `{}`. `orderByFor` para cada `sort`. `isUuid` (válido/ inválido).
- `battle.service`: `getArticle` devuelve `cached:true` si ya hay `article`; si no,
  llama a `fetchArticleText` (mockeado) y persiste sólo si hay texto; 404 si no
  existe la batalla. `list` calcula `skip` y arma `meta`.

**Módulo `common`**
- `normalizePagination` / `normalisePagination`: `page≥1`, `pageSize ∈ [1,50/100]`,
  no numérico → defaults, cálculo de `skip`/`take`. `buildMeta` y `totalPages`
  (incluido `total=0`).
- `slug.util` (`toSlug`): acentos, símbolos, espacios múltiples, cadena vacía.

**Módulo `ingestion`**
- `wikidata.client` helpers puros: `parseCoords` (válido, malformado, signo),
  `yearFrom` (a.C. `-0218`, ceros a la izquierda, nulo), `dayDate` (precisión <11 →
  null; =11 → `YYYY-MM-DD`; fechas a.C.), `titleOf`, `qidOf`, `upscaleThumb`,
  `classifyBattle` (cada QID conocido + fallback BATTLE), `mergeBattle` (prioriza
  no-nulos y tipo específico), `isWebImage`.
- `ingestion.service`: `clampScore` (0/100/negativos), `validLat`/`validLng`
  (fuera de rango → null). `resolvePlacement` con un `prisma` mockeado: las 4 ramas
  (update por qid, adopción de fila del seed sin qid, homónimo con sufijo qid,
  create limpio). `tryEnqueueAi` traga el error si la cola falla (Redis caído).

**Módulo `ai`**
- `llm.service`: en modo `mock` devuelve los 4 campos; `onModuleInit` cae a `mock`
  si falta `ANTHROPIC_API_KEY`; `webSearchAllowed=false` veta la búsqueda aunque el
  job la pida; `generate` con provider mock ignora `webSearch`.
- `parseStoryJson`: tolera *code fences*/texto alrededor, recorta `{...}`, campos
  faltantes → `''`, JSON inválido → lanza (documentar el comportamiento esperado).
- `buildUserPrompt` / `fechaLine`: prioridad fecha exacta > rango > año; incluye
  coords sólo si existen.
- `ai-queue.service`: `enqueue` hace `remove(battleId)` previo y `add` con el
  `jobId` estable y los `attempts`/`backoff` esperados (cola mockeada).
- `daily-enrichment.service` → `pickTarget` con `prisma` mockeado: efeméride del día
  sin narrativa → `source:'efeméride de hoy'`; si no hay → top global; si nada →
  `null`. `run` encola con `webSearch:true`.
- `ai.processor`: idempotencia (si ya existe summary → *skip*, no llama al LLM);
  batalla inexistente → descarta; cálculo de `promptHash` y `usedWebSearch`.
- `ai.controller`: `isUuid`; devuelve `unavailable` si no hay summary y **no encola**.

**Cobertura:** objetivo ≥ 80 % en `*.service.ts`, `*.repository.ts` y helpers
puros; activar `--coverage` en CI con umbral que falle el build por debajo.

### 3.2 Pruebas de integración con Postgres real

> **Decisión:** las pruebas de integración corren contra una **PostgreSQL real**,
> no contra mocks ni SQLite, para ejercitar las consultas Prisma tal cual
> (índices, tipos, `ILIKE`, `endsWith`, agregados raw). Se levanta con el nuevo
> **`docker-compose.test.yml`**, que contiene **únicamente** el servicio
> `postgres-test` (sin backend, frontend ni Redis).

**Infraestructura (`docker-compose.test.yml`):**
- Postgres 18.1-alpine, BD `ares_test`, usuario/clave `test/test`.
- Puerto host **5433** (no colisiona con la BD de desarrollo en 5432).
- Datos en **tmpfs** (RAM): arranque rápido y estado efímero entre ejecuciones.
- `healthcheck` con `pg_isready` para esperar a que esté lista.

**Flujo de ejecución (local y CI):**
```bash
docker compose -f docker-compose.test.yml up -d --wait
export DATABASE_URL="postgresql://test:test@localhost:5433/ares_test?schema=public"
cd backend
npx prisma migrate deploy          # aplica el esquema real (migraciones + triggers)
npm run test:e2e                   # Jest + Supertest sobre la app Nest
docker compose -f docker-compose.test.yml down -v
```

**Aislamiento entre tests:** `TRUNCATE` de las tablas (o transacción con *rollback*)
en `beforeEach`; *seed* mínimo por test con datos deterministas. Las dependencias
externas que NO son BD (cola BullMQ/Redis, `fetch` a Wikipedia) se **mockean**
(p. ej. `overrideProvider(AiQueueService)`), para que la integración valide la ruta
HTTP→servicio→**BD real** sin red externa.

**Casos (Supertest sobre la app Nest real + BD real):**
- `GET /battles` con datos sembrados: paginación (`page`/`pageSize` capado a 50),
  filtros `type`/`sort`, `search` insensible a mayúsculas/acentos, `meta` correcto.
- `GET /battles/points`: filtra filas sin coordenadas, respeta bbox y el tope.
- `GET /battles` y `/points` → **400** si `yearMax-yearMin>150` sin bbox.
- `GET /battles/:id` por **id** y por **slug**; 404 si no existe.
- `GET /battles/on-this-day`: siembra fechas con el `-MM-DD` de hoy y verifica el
  match contra `date` y `startDate` (ejercita el `endsWith` real).
- `GET /battles/stats` y `/centuries`: agregados correctos contra un dataset
  conocido (valida la query raw `CEIL/COALESCE` y `sortYear`).
- `GET /battles/:id/article`: con `article` ya cacheado → `cached:true` sin tocar
  la red; sin cachear → con `fetchArticleText` mockeado, persiste y devuelve
  `cached:false` (comprueba el *write-back* en la BD real).
- `GET /battles/:id/ai-story`: 200 con summary sembrado; `unavailable` si no existe;
  confirmar que **no** se encola job (espía sobre la cola mockeada).
- Verificar que las respuestas **no filtran campos** fuera del `select` (p. ej.
  `wikidataId`, `promptHash`).

**(Opcional) Integración del pipeline de ingesta:** con `WikidataClient` mockeado
(datos SPARQL/REST falsos) y BD real, validar `storeBattle`/`resolvePlacement`:
upsert por `wikidataId`, adopción de fila del seed por slug, y sufijo en homónimos.

### 3.3 Pruebas de seguridad
- **DAST básico:** OWASP ZAP baseline contra la API; comprobar headers (helmet),
  ausencia de Swagger en prod, manejo de errores sin *stack traces*.
- **Escaneo de exposición:** `nmap`/`docker ps` confirmando que 5432/6379 **no**
  quedan publicados en el perfil de producción; Redis con `requirepass`.
- **Inyección de parámetros vía título de Wikipedia (S-10):** test unitario que
  verifique que el título se codifica (`encodeURIComponent`) tras la mitigación.
- **Dependencias:** `npm audit` (backend y frontend) en CI; `trivy image` sobre las
  imágenes Docker.
- **Secret scanning:** `gitleaks` para asegurar que `.env`/claves no se commitean
  (`.env.example` no debe contener valores reales).

### 3.4 Pruebas de rendimiento / carga
- **k6 o autocannon** contra `/battles/points` (sin filtro, peor caso),
  `/battles/stats` y `/battles?search=…`: medir p95/p99 y throughput a 50/100/200 RPS.
- **Prueba de la trampa P-1:** N peticiones concurrentes a `/battles/:id/article`
  de batallas **sin** `article` cacheado (fuerza fetch externo); observar saturación
  del *pool* y latencia de cola. Repetir simulando Wikipedia con 429/lento.
- **EXPLAIN ANALYZE** de las consultas de P-2/P-3 antes y después de añadir índices,
  con un dataset ampliado (p. ej. 50k filas) para ver el escalado.
- **Carga de la cola de IA** (`mock`): encolar miles de jobs y verificar que la
  concurrencia 4 y los reintentos no saturan Redis ni la BD.

### 3.5 Pruebas de despliegue (CI)
- Construir la imagen `production` y validar arranque + `GET /health` (cubre D-1).
- *Healthcheck* de Postgres/Redis y orden de `depends_on`.
- Levantar `docker-compose.test.yml`, aplicar `prisma migrate deploy` y correr la
  suite de integración como *gate* del pipeline.

---

## 4. Estrategia de mitigación (priorizada)

### Fase 0 — Bloqueante (inmediato)
1. **D-1:** `CMD ["node", "dist/main.js"]` en el stage de producción + smoke test en CI.

### Fase 1 — Seguridad crítica (esta semana)
2. **S-2:** En producción, **no publicar** los puertos 5432/6379 al host (quitar el
   `ports` o exponer sólo en la red interna `app-network`). Activar
   `requirepass`/ACL en Redis y pasar la credencial por la `REDIS_URL`/conexión BullMQ.

> ✅ **Resuelto:** los antiguos S-1 (JWT_SECRET) y S-3 (`dev-token`) desaparecen al
> eliminarse la capa de auth (no hay cuentas). No requieren mitigación.

### Fase 2 — Rendimiento de endpoints públicos (corto plazo)
5. **P-1:** Sacar el *backfill* de artículos de la request. Opciones: (a) servir
   sólo lo cacheado y disparar el fetch en un **job BullMQ** (coherente con
   Zero Real-Time); (b) si se mantiene en request, añadir `AbortController` con
   timeout corto (~3 s) y devolver `null`/202 en vez de bloquear.
6. **P-3 / P-2:** Añadir índices Prisma: `@@index([importanceScore])`,
   `@@index([sortYear])`, `@@index([type])`, `@@index([latitude, longitude])`.
   Para la búsqueda por nombre, índice **GIN `pg_trgm`** (migración SQL manual);
   para efemérides, columna/índice funcional del sufijo `-MM-DD`.
7. **P-4:** Bajar el tope de `/points` o exigir bbox/año; añadir paginación o
   *clustering* server-side. Reducir el `select` a lo mínimo del marker.
8. **P-5 / P-7:** Cachear `stats`/`timeline`/`centuries` (TTL en memoria o Redis,
   minutos) y añadir `Cache-Control` a los GET de lectura.

### Fase 3 — Endurecimiento general (medio plazo)
9. **S-4:** `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`
   y decorar los DTOs con class-validator.
10. **S-5:** `app.use(helmet())`.
11. **S-6:** Habilitar CORS explícito con `origin` desde `CORS_ORIGIN` (sin `*`).
12. **S-7:** Montar Swagger sólo si `NODE_ENV!=='production'` (o tras auth).
13. **P-6:** Mover el Throttler a almacenamiento Redis y afinar límites por endpoint
    (más estrictos en `points`/`stats`).
14. **P-8:** Tope de gasto diario real para IA (contador en Redis) y/o reusar
    `AI_DAILY_WEB_BUDGET` como límite duro; mantener `mock` por defecto.
15. **P-9 / S-10:** `AbortController` + timeout en todos los `fetch`;
    `encodeURIComponent` en los títulos de URL.
16. **Higiene de XSS (resto del antiguo S-8):** ya no se guarda token en
    `localStorage`, pero conviene prohibir `dangerouslySetInnerHTML` por regla de
    lint para el contenido de Wikipedia/IA (hoy se renderiza como texto, mantenerlo).

---

## 5. Trazabilidad rápida (hallazgo → archivo)

- `main.ts` — S-4, S-5, S-6, S-7
- `docker-compose.yml` / `docker-compose.prod.yml` — S-2
- `backend/Dockerfile` — D-1
- `battle/battle.repository.ts` — P-2, P-3, P-4, P-5
- `battle/battle.service.ts` + `ai/wikipedia-source.ts` — P-1, P-9, S-10
- `app.module.ts` — P-6
- `ingestion/ingestion.service.ts` + `ai/llm.service.ts` — P-8

**Resueltos (auth eliminado):** S-1, S-3, S-8, S-9 — el módulo `auth`,
`@nestjs/jwt`, `dev-token` y el manejo de token del frontend ya no existen.
</content>
</invoke>
