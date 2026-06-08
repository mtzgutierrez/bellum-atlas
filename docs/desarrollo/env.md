# Variables de entorno

Hay **un solo** fichero `.env` en la raíz del proyecto (cópialo de
`.env.example`). Docker Compose lo inyecta a los servicios.

```env
# General
NODE_ENV=development
COMPOSE_PROJECT_NAME=bellum_atlas

# PostgreSQL
POSTGRES_DB=bellum_db
POSTGRES_USER=bellum_user
POSTGRES_PASSWORD=bellum_pass
POSTGRES_PORT=5432
POSTGRES_HOST=postgres
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"

# Backend
BACKEND_PORT=3000
JWT_SECRET=genera_un_secreto_aleatorio_aqui
JWT_EXPIRATION=7d

# Redis (caché + colas BullMQ)
REDIS_HOST=redis
REDIS_PORT=6379

# IA / LLM (ver backend/ia.md)
AI_PROVIDER=mock            # mock | anthropic
ANTHROPIC_API_KEY=          # sólo si AI_PROVIDER=anthropic
AI_MODEL=claude-sonnet-4-6
AI_AUTO_QUEUE_MIN_SCORE=80

# Frontend
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:3000
```

| Variable | Para qué |
|----------|----------|
| `AI_PROVIDER` | `mock` (sin coste) o `anthropic` (Claude). |
| `ANTHROPIC_API_KEY` | Clave de Anthropic si usas Claude. |
| `AI_MODEL` | Modelo de Claude. |
| `AI_AUTO_QUEUE_MIN_SCORE` | Umbral de `importanceScore` para pre-generar IA. |
| `JWT_SECRET` | Firma de los JWT (tier free/premium). |

!!! warning "Secretos"
    Nunca subas tu `.env` al repositorio. El `.gitignore` ya excluye `.env`.
    Para usar Claude de verdad, pon `AI_PROVIDER=anthropic` y tu
    `ANTHROPIC_API_KEY`, y reinicia el backend.
