# Variables de entorno

---

## Backend (`backend/.env`)

```env
# Base de datos
DATABASE_URL="postgresql://ares:password@localhost:5432/arescodex"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="tu-secreto-muy-largo-y-aleatorio"
JWT_EXPIRY="15m"
JWT_REFRESH_SECRET="tu-otro-secreto-diferente"
JWT_REFRESH_EXPIRY="7d"

# Clave interna para el scraper
SCRAPER_API_KEY="clave-interna-para-el-scraper"

# Entorno
NODE_ENV="development"
PORT=3000
```

---

## Scraper (`scraper/.env`)

```env
# URL de la API del backend
BACKEND_URL="http://localhost:3000"

# Misma clave que SCRAPER_API_KEY en el backend
SCRAPER_API_KEY="clave-interna-para-el-scraper"

# Redis para el set de URLs procesadas
REDIS_URL="redis://localhost:6379"
```

---

## Frontend (`frontend/.env`)

```env
# URL base de la API
VITE_API_URL="http://localhost:3000"

# Token público de Mapbox
VITE_MAPBOX_TOKEN="pk.eyJ1Ijoi..."
```

!!! warning "Token de Mapbox"
    El token de Mapbox es público (empieza por `pk.`) pero está ligado a tu cuenta. Restringe los dominios permitidos desde el panel de Mapbox para evitar uso no autorizado.

---

## Producción

En producción (Railway / Fly.io) las variables se configuran en el panel del proveedor, no en archivos `.env`. Nunca subas archivos `.env` al repositorio.

El `.gitignore` ya excluye `*.env` y `.env.*`.
