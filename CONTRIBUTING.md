# Contribuir a Battle Atlas

¡Gracias por colaborar! Esta guía explica cómo poner en marcha el proyecto con
**DevContainers** y las convenciones que seguimos. El entorno recomendado y
soportado es el DevContainer: garantiza que todo el equipo trabaje con las mismas
versiones de Node, PostgreSQL y Redis sin tener que instalar nada en el host.

---

## 1. Requisitos previos

Solo necesitas tres cosas en tu máquina:

| Herramienta | Para qué |
|---|---|
| [Docker](https://docs.docker.com/get-docker/) (o Docker Desktop) | Ejecutar los contenedores |
| [VS Code](https://code.visualstudio.com/) | Editor con soporte de DevContainers |
| Extensión [**Dev Containers**](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) | Abrir el proyecto dentro del contenedor |

> ¿Usas otro editor? El DevContainer también funciona con la CLI
> [`@devcontainers/cli`](https://github.com/devcontainers/cli) y con los IDE de
> JetBrains (Gateway). VS Code es el camino mejor probado.

---

## 2. Arrancar el DevContainer

1. Clona el repositorio:

   ```bash
   git clone https://github.com/tu-usuario/battle-atlas.git
   cd battle-atlas
   ```

2. Ábrelo en VS Code:

   ```bash
   code .
   ```

3. Cuando VS Code detecte la configuración, haz clic en
   **"Reopen in Container"** (o abre la paleta de comandos →
   *Dev Containers: Reopen in Container*).

La primera vez, VS Code:

- Levanta los servicios de Compose: `postgres`, `redis`, `backend`, `frontend`,
  `docs`.
- Ejecuta [`.devcontainer/post-create.sh`](.devcontainer/post-create.sh), que:
  - crea tu `.env` a partir de `.env.example` (si no existe),
  - instala dependencias de `backend/` y `frontend/`,
  - genera el cliente de Prisma,
  - aplica las migraciones de la base de datos.

Esto puede tardar unos minutos la primera vez. Las siguientes son casi
instantáneas.

### Cómo está montado

El DevContainer se conecta al servicio **`backend`**, que monta el repo completo
en `/workspace` y se mantiene vivo. La configuración vive en:

```
.devcontainer/
├── devcontainer.json            # Definición del DevContainer (puertos, extensiones…)
├── docker-compose.extend.yml    # Overrides de Compose solo para el DevContainer
└── post-create.sh               # Provisión inicial del entorno
```

Se combina con `docker-compose.yml` + `docker-compose.dev.yml` de la raíz, así
que el DevContainer usa exactamente la misma definición de servicios que el resto
del equipo.

---

## 3. Trabajar dentro del contenedor

El **frontend** arranca solo (servicio Compose `frontend`). El **backend** lo
levantas tú desde una terminal integrada de VS Code:

```bash
cd backend
npm run start:dev      # hot-reload en http://localhost:3000
```

Siembra datos de demostración para tener con qué trabajar:

```bash
cd backend
npx ts-node src/cli.ts demo
```

### Puertos publicados

| Servicio | URL | Notas |
|---|---|---|
| Frontend | http://localhost:5173 | Vite, hot-reload |
| Backend API | http://localhost:3000 | NestJS |
| Swagger | http://localhost:3000/api/docs | Documentación de la API |
| PostgreSQL | `localhost:5432` | |
| Redis | `localhost:6379` | |
| Docs (MkDocs) | http://localhost:8000 | |

> pgAdmin y SonarQube están en el perfil `manual` de Compose y no se levantan por
> defecto. Para usarlos: `docker compose --profile manual up -d pgadmin`.

---

## 4. Comandos habituales

Backend (`backend/`):

| Comando | Acción |
|---|---|
| `npm run start:dev` | Servidor con hot-reload |
| `npm test` | Tests unitarios (Jest, mockeados — no necesitan DB) |
| `npm run lint` | ESLint con `--fix` |
| `npm run format` | Prettier |
| `npm run build` | Compila a `dist/` |
| `npx prisma migrate dev --name <nombre>` | Crea y aplica una migración |
| `npx prisma studio` | Explorador visual de la base de datos |
| `npx ts-node src/cli.ts <spec>` | Ingestión de datos (ver abajo) |

Frontend (`frontend/`):

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor Vite |
| `npm run build` | Build de producción (type-check + Vite) |
| `npm run lint` | ESLint |

### CLI de ingestión

Los datos provienen de **Wikidata**/**Wikipedia** (no hay scraper). Ejemplos:

```bash
npx ts-node src/cli.ts demo                    # conjunto de demostración
npx ts-node src/cli.ts battle:Q48314           # una batalla por su QID
npx ts-node src/cli.ts war:Q362 --with-battles # guerra + sus batallas
npx ts-node src/cli.ts commander:Q517          # un comandante
```

Las batallas con un *importance score* alto se encolan automáticamente para
generar su narrativa de IA.

### IA / Story Mode

Por defecto `AI_PROVIDER=mock`: la IA genera plantillas locales, **sin coste ni
red**. Para probar con Claude de verdad, en tu `.env`:

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
AI_MODEL=claude-sonnet-4-6
```

La generación corre siempre en background (cola `ai-generation` de BullMQ); nunca
se invoca de forma síncrona en una petición de usuario.

---

## 5. Flujo de trabajo con Git

1. Crea una rama desde `main`:

   ```bash
   git checkout -b feat/mi-feature
   ```

   Prefijos: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`.

2. Haz commits pequeños y descriptivos. Recomendamos
   [Conventional Commits](https://www.conventionalcommits.org/):

   ```
   feat(battle): añade filtro por era en el mapa
   fix(ai): evita re-encolar narrativas ya generadas
   docs: actualiza la guía de despliegue
   ```

3. Antes de abrir el PR, asegúrate de que pasa lo mismo que la CI:

   ```bash
   cd backend && npm run lint && npm test
   cd ../frontend && npm run lint && npm run build
   ```

4. Abre un Pull Request contra `main`. La
   [CI de GitHub Actions](.github/workflows/ci.yml) ejecuta los tests del backend
   automáticamente.

---

## 6. Convenciones de código

- **TypeScript estricto** en backend y frontend.
- **Lint y formato**: ESLint + Prettier. El DevContainer ya formatea al guardar
  (`editor.formatOnSave`) y aplica fixes de ESLint.
- **Backend**: arquitectura modular de NestJS por dominio
  (`battle/`, `war/`, `commander/`, `ai/`, `ingestion/`, `auth/`). Cada módulo
  con su `controller` / `service` / `repository` / `dto`.
- **Base de datos**: todo cambio de esquema pasa por una **migración de Prisma**
  (`npx prisma migrate dev`). No edites la base de datos a mano.
- **IA**: la IA siempre es **pre-computada y cacheada** (`BattleAISummary`).
  Mantén ese principio: nada de llamadas síncronas a la IA en el camino de una
  request.
- **Comentarios**: en español, breves y centrados en el *por qué*, siguiendo el
  estilo existente del repositorio.
- **Tests**: los unitarios del backend están mockeados y no requieren base de
  datos; mantenlos así para que la CI sea rápida y determinista.

---

## 7. Variables de entorno

Tu `.env` se crea automáticamente desde `.env.example`. Revisa estas claves:

| Variable | Necesaria para | Por defecto |
|---|---|---|
| `POSTGRES_*` | Conexión a la base de datos | ver `.env.example` |
| `JWT_SECRET` | Firmar tokens | — |
| `AI_PROVIDER` | `mock` o `anthropic` | `mock` |
| `ANTHROPIC_API_KEY` | Solo si `AI_PROVIDER=anthropic` | — |
| `AI_AUTO_QUEUE_MIN_SCORE` | Umbral de auto-encolado de IA | `80` |

Nunca subas tu `.env` (está en `.gitignore`).

---

## 8. Reconstruir el entorno

Si algo se rompe o cambian las dependencias:

- **Paleta de comandos → *Dev Containers: Rebuild Container*** reconstruye desde
  cero (vuelve a ejecutar `post-create.sh`).
- Para empezar con base de datos limpia, elimina los volúmenes de Compose:

  ```bash
  docker compose down -v
  ```

---

## 9. ¿Dudas?

- Documentación funcional: servida por MkDocs en http://localhost:8000.
- Despliegue: [`DESPLIEGUE-HETZNER.md`](DESPLIEGUE-HETZNER.md).
- API: Swagger en http://localhost:3000/api/docs.

Abre un *issue* si encuentras algo que no cuadra. ¡Gracias por contribuir! ⚔
