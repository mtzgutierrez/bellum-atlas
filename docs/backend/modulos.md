# Módulos NestJS

Cada módulo encapsula un dominio del negocio. Los módulos no se llaman entre sí directamente: usan el módulo `PrismaModule` como única fuente de acceso a la base de datos.

---

## `PrismaModule`

Wrapper singleton del cliente Prisma. Se importa en todos los módulos que necesiten acceso a la base de datos.

```typescript
// prisma/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
```

---

## `BattlesModule`

Gestiona las batallas históricas.

| Endpoint | Método | Descripción |
|---|---|---|
| `/battles` | GET | Listado paginado con filtros y búsqueda full-text |
| `/battles/:id` | GET | Ficha completa de una batalla |

**Filtros disponibles** en `GET /battles`:

- `q` — texto libre (nombre, guerra, comandante, lugar)
- `era` — slug de `HistoricalEra`
- `country` — país involucrado
- `result` — `victory`, `defeat`, `draw`, `inconclusive`
- `type` — `land`, `naval`, `air`, `siege`
- `page`, `limit` — paginación

---

## `WarsModule`

Gestiona los conflictos padre.

| Endpoint | Método | Descripción |
|---|---|---|
| `/wars` | GET | Listado paginado de guerras |
| `/wars/:id` | GET | Ficha de guerra con lista de batallas |

---

## `CommandersModule`

Gestiona los perfiles de comandantes.

| Endpoint | Método | Descripción |
|---|---|---|
| `/commanders` | GET | Listado paginado |
| `/commanders/:id` | GET | Perfil con historial de batallas y ratio de victorias |

---

## `AuthModule`

Gestiona registro, login y tokens JWT.

| Endpoint | Método | Descripción |
|---|---|---|
| `/auth/register` | POST | Crear cuenta con email + password |
| `/auth/login` | POST | Devuelve `access_token` y `refresh_token` |
| `/auth/refresh` | POST | Renovar `access_token` |

El `refresh_token` se almacena en una `httpOnly` cookie. El `access_token` tiene TTL de 15 minutos.

---

## `MediaModule`

Gestiona el ciclo de vida de todos los recursos multimedia (imágenes de batallas, guerras y comandantes). Centraliza la lógica de vinculación y desvinculación para mantener la integridad del campo `isPrimary`.

### Endpoints

| Endpoint | Método | Descripción |
|---|---|---|
| `/media` | POST | Registra un nuevo ítem de media (URL + metadatos) |
| `/media` | GET | Lista paginada con filtro opcional `?source=WIKIMEDIA\|CUSTOM\|EXTERNAL` |
| `/media/:id` | GET | Devuelve un ítem por su id |
| `/media/:id` | PATCH | Actualiza metadatos |
| `/media/:id` | DELETE | Elimina el ítem y sus vinculaciones en cascada |
| `/media/:id/attach/:entityType/:entityId` | POST | Vincula el media a una entidad (`battle`, `war`, `commander`) |
| `/media/:id/attach/:entityType/:entityId` | DELETE | Desvincula el media de una entidad |
| `/media/entity/:entityType/:entityId` | GET | Lista todos los ítems vinculados a una entidad, ordenados por `order` |
| `/media/entity/:entityType/:entityId/primary` | GET | Devuelve el ítem marcado como primario, o `null` |

### Lógica de `isPrimary`

Solo puede existir **un** ítem primario por entidad. Al hacer `attach` con `isPrimary: true`, el servicio ejecuta una transacción que:

1. Pone `isPrimary = false` en todos los registros de esa entidad.
2. Crea el nuevo registro con `isPrimary = true`.

Esto garantiza consistencia incluso ante llamadas concurrentes.

### Fuentes de media (`MediaSource`)

| Valor | Descripción |
|---|---|
| `WIKIMEDIA` | URL directa a Wikimedia Commons. Uso por defecto — licencias libres, sin storage propio. |
| `CUSTOM` | Archivo subido a bucket propio (Supabase Storage / R2). Para imágenes editoriales futuras. |
| `EXTERNAL` | URL de terceros. Uso provisional; evitar en producción (depende de disponibilidad externa). |

---

## `InternalScraperModule`

Endpoint exclusivo para el scraper. Protegido con API key interna (header `x-api-key`), no con JWT.

| Endpoint | Método | Descripción |
|---|---|---|
| `/internal/scraper/battle` | POST | Recibe un `WikipediaItem`, valida, desduplicita y persiste |

La deduplicación se hace con `upsert` por `wikipediaUrl`. Si la batalla ya existe, actualiza los campos; no crea un duplicado.
