# Plan de despliegue — AresCodex en Hetzner + dominio Namecheap

> Guía operativa paso a paso para poner esta aplicación (NestJS + Prisma/Postgres + Redis/BullMQ + frontend React/Vite tras Nginx, IA de Anthropic) en un VPS de **Hetzner Cloud**, con dominio comprado en **Namecheap**, HTTPS automático, gestión de secrets y CI/CD.
>
> Marca cada `[ ]` a medida que avances. Las secciones ⚠️ **BLOQUEANTES** corrigen fallos del repo que, tal cual está hoy, impiden que el build de producción arranque — hazlas **antes** de desplegar.

---

## 0. Decisiones previas (5 min)

- [ ] Elegir el **dominio** (ej. `arescodex.com`).
- [ ] Decidir subdominios: `arescodex.com` (frontend) y `api.arescodex.com` (backend). Recomendado separar el API para CORS y certificados limpios.
- [ ] Elegir **región Hetzner** (Nuremberg/Falkenstein/Helsinki en EU; Ashburn/Hillsboro en US). Cercana a tus usuarios.
- [ ] Tamaño de servidor: para esta app (Postgres + Redis + 2 contenedores Node + Nginx) empieza con **CX22** (2 vCPU / 4 GB RAM / 40 GB) o **CPX21** si quieres AMD. El seed con IA y BullMQ agradece la RAM.
- [ ] Tener una **clave SSH** local (`ssh-keygen -t ed25519 -C "tu_email"` si no tienes `~/.ssh/id_ed25519.pub`).

---

## 1. ⚠️ BLOQUEANTE — Corregir el repo para que el build de producción funcione

Estos tres defectos hacen que `docker compose -f docker-compose.yml -f docker-compose.prod.yml up` falle o sirva mal. Arréglalos en una rama y mergea **antes** de desplegar.

### 1.1 Falta `frontend/nginx.conf`
El `frontend/Dockerfile` hace `COPY nginx.conf /etc/nginx/conf.d/default.conf`, pero **ese fichero no existe** → el build de la imagen de producción del frontend falla.

- [ ] Crear `frontend/nginx.conf` con soporte para SPA (React Router usa rutas del lado cliente):

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Las rutas de React Router deben caer en index.html (SPA fallback).
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache agresivo para assets con hash de Vite.
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;
}
```

### 1.2 Entrypoint incorrecto del backend en producción
`backend/Dockerfile` (stage `production`) ejecuta `CMD ["node", "dist/index.js"]`, pero el fichero compilado es **`dist/main.js`** (ver `src/main.ts` y `dist/main.js`). El contenedor arranca y muere con *Cannot find module*.

- [ ] Cambiar el `CMD` del stage de producción a `["node", "dist/main.js"]` (coincide con `start:prod` del `package.json`).

### 1.3 `VITE_API_URL` no llega al build de producción
Vite **inyecta las variables en tiempo de build**, no en runtime. En `docker-compose.yml` se pasa `VITE_API_URL` como `environment:` (runtime), así que en producción la imagen Nginx ignora ese valor y el frontend apuntará a `http://localhost:3000`.

- [ ] Convertir `VITE_API_URL` en **build arg**. En `frontend/Dockerfile`, stage `build`:

```dockerfile
FROM node:24 AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
```

- [ ] Y pasarlo desde compose en `build.args` (ver §7). En producción debe valer `https://api.arescodex.com`.

> Verifica en local: `docker compose -f docker-compose.yml -f docker-compose.prod.yml build` debe completar sin errores antes de tocar el servidor.

---

## 2. Comprar el dominio en Namecheap

- [ ] Crear cuenta en [namecheap.com](https://www.namecheap.com) y activar **2FA**.
- [ ] Buscar y comprar el dominio. Desmarca cualquier extra de pago innecesario; **deja activado WhoisGuard / Domain Privacy** (gratis).
- [ ] No configures aún los DNS — primero necesitas la IP del servidor (§3). Volverás en §5.

---

## 3. Crear y asegurar el servidor Hetzner

### 3.1 Crear el servidor
- [ ] Crear cuenta en [Hetzner Cloud Console](https://console.hetzner.cloud) y un **proyecto** (ej. `arescodex`).
- [ ] **Security → SSH Keys**: sube tu `~/.ssh/id_ed25519.pub`.
- [ ] **Add Server**: imagen **Ubuntu 24.04**, tipo CX22, región elegida, y selecciona tu SSH key (no uses contraseña).
- [ ] (Recomendado) Activa **Backups** (+20% precio) — snapshots automáticos diarios del disco.
- [ ] Anota la **IP pública** (IPv4).

### 3.2 Hardening inicial (primer login como `root`)
```bash
ssh root@TU_IP
```
- [ ] Actualizar el sistema: `apt update && apt upgrade -y`
- [ ] Crear usuario no-root con sudo:
```bash
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```
- [ ] Endurecer SSH en `/etc/ssh/sshd_config`: `PermitRootLogin no`, `PasswordAuthentication no`. Luego `systemctl restart ssh`. **Prueba el login como `deploy` en otra terminal antes de cerrar la de root.**
- [ ] Instalar **fail2ban**: `apt install -y fail2ban` (bloquea fuerza bruta SSH).
- [ ] Configurar **firewall**. Usa el **Hetzner Cloud Firewall** (en la consola web, no consume recursos) o `ufw`:
  - Permitir: **22 (SSH)**, **80 (HTTP)**, **443 (HTTPS)**.
  - ⚠️ **NO** expongas 5432 (Postgres) ni 6379 (Redis) a internet (ver §7.3).
  ```bash
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow 22 && ufw allow 80 && ufw allow 443
  ufw enable
  ```

### 3.3 Instalar Docker + Compose
- [ ] Instalar Docker Engine (script oficial) y plugin compose:
```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy
apt install -y docker-compose-plugin
```
- [ ] Re-loguéate como `deploy` y verifica: `docker compose version`.

---

## 4. Apuntar el dominio al servidor (DNS)

Tienes dos opciones. Recomendado: usar los **DNS de Hetzner** (más control, API, TTL bajos), o quedarte con los de Namecheap.

### Opción A (recomendada): Hetzner DNS
- [ ] En [Hetzner DNS Console](https://dns.hetzner.com), crea la zona para tu dominio.
- [ ] Copia los **3 nameservers** que te da Hetzner.
- [ ] En Namecheap → **Domain → Nameservers → Custom DNS**, pega los nameservers de Hetzner.

### Opción B: DNS de Namecheap
- [ ] Namecheap → **Advanced DNS**.

### Registros a crear (en cualquiera de las dos)
- [ ] `A`  `@`    → `TU_IP`
- [ ] `A`  `api`  → `TU_IP`
- [ ] `A`  `www`  → `TU_IP`  (o CNAME `www` → `@`)
- [ ] Verifica propagación: `dig +short arescodex.com` y `dig +short api.arescodex.com` deben devolver tu IP (puede tardar de minutos a 48 h; con Hetzner suele ser rápido).

---

## 5. Reverse proxy + HTTPS automático (Caddy)

En vez de exponer Nginx del frontend en el 80 directamente (como hace `docker-compose.prod.yml`), pon un **reverse proxy con TLS automático** delante. **Caddy** saca certificados Let's Encrypt solo, sin certbot ni cron.

- [ ] Añadir un servicio `caddy` al stack de producción (ver `docker-compose.prod.yml` propuesto en §7) y crear un `Caddyfile`:

```caddyfile
arescodex.com, www.arescodex.com {
    reverse_proxy frontend:80
}

api.arescodex.com {
    reverse_proxy backend:3000
}
```
- [ ] Caddy necesita los puertos 80 y 443 publicados; el `frontend` y `backend` dejan de publicar puertos al host (solo se exponen en la red interna de Docker).
- [ ] (Alternativa si prefieres Nginx+certbot o Traefik: válido, pero Caddy es el camino más corto.)

---

## 6. Secrets y configuración de producción 🔐

> **Nunca** subas `.env` real al repo. Confirma que `.gitignore` incluye `.env` (hoy el `.gitignore` solo tiene 4 bytes — **revísalo**).

- [ ] En el servidor, dentro del directorio del proyecto, crea `.env` de producción a partir de `.env.example`.
- [ ] Genera secretos fuertes y **únicos** (no reutilices los de desarrollo):
```bash
openssl rand -base64 48   # para JWT_SECRET
openssl rand -base64 48   # para SCRAPER_API_KEY
openssl rand -base64 32   # para POSTGRES_PASSWORD (sin caracteres raros para la URL)
```
- [ ] Rellena el `.env` de producción:

| Variable | Valor en producción | Notas |
|---|---|---|
| `NODE_ENV` | `production` | |
| `BUILD_TARGET` | `production` | |
| `POSTGRES_DB` | `arescodex` | |
| `POSTGRES_USER` | `arescodex` | no uses `postgres` |
| `POSTGRES_PASSWORD` | *(openssl)* | 🔐 |
| `DATABASE_URL` | `postgresql://arescodex:PASS@postgres:5432/arescodex?schema=public` | host = `postgres` (red Docker) |
| `JWT_SECRET` | *(openssl)* | 🔐 |
| `JWT_EXPIRATION` | `7d` | |
| `SCRAPER_API_KEY` | *(openssl)* | 🔐 protege `/internal/*` (header `x-api-key`) |
| `AI_PROVIDER` | `anthropic` | en local está `mock` |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | 🔐 desde console.anthropic.com; **ponle límite de gasto** |
| `AI_MODEL` | `claude-sonnet-4-6` | |
| `AI_AUTO_QUEUE_MIN_SCORE` | `80` | |
| `VITE_API_URL` | `https://api.arescodex.com` | **build arg** del frontend (§1.3) |
| `CORS_ORIGIN` | `https://arescodex.com` | ⚠️ ver §7.4 |

- [ ] `chmod 600 .env` para restringir lectura.
- [ ] Guarda una copia de los secrets en tu **gestor de contraseñas** (1Password/Bitwarden), no solo en el servidor.

---

## 7. Ajustar el stack de producción

El `docker-compose.prod.yml` actual publica Postgres/Redis y sirve el frontend directo en el 80. Hay que cerrarlo y meter el proxy.

### 7.1 ⚠️ No publicar Postgres ni Redis al host
El `docker-compose.yml` base mapea `5432:5432` y `6379:6379` → quedarían **abiertos a internet**. En producción no deben publicarse: los servicios se hablan por la red interna `app-network`.

- [ ] En `docker-compose.prod.yml`, sobreescribe para **quitar** los `ports` de postgres y redis (déjalos sin mapeo al host). El firewall (§3.2) es la segunda línea de defensa, pero no publiques de inicio.

### 7.2 Compose de producción propuesto
- [ ] Reescribe `docker-compose.prod.yml` en esta línea:

```yaml
services:
  backend:
    build:
      target: production
    environment:
      NODE_ENV: production
      CORS_ORIGIN: https://arescodex.com   # override del localhost del base
    restart: unless-stopped

  frontend:
    build:
      target: production
      args:
        VITE_API_URL: ${VITE_API_URL}       # build arg (§1.3)
    # sin ports: solo accesible por Caddy en la red interna
    restart: unless-stopped

  postgres:
    ports: []          # no exponer al host
    restart: unless-stopped

  redis:
    ports: []          # no exponer al host
    restart: unless-stopped

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - frontend
      - backend
    networks:
      - app-network
    restart: unless-stopped

volumes:
  caddy_data:
  caddy_config:
```

### 7.3 `CORS_ORIGIN`
En `docker-compose.yml` el backend tiene `CORS_ORIGIN: http://localhost:5173` hardcodeado. El override de producción de §7.2 lo corrige a `https://arescodex.com`. Verifica que `main.ts`/`app.module` lee esa env para `app.enableCors()`.

---

## 8. Primer despliegue

- [ ] Clonar el repo en el servidor como `deploy`:
```bash
cd ~ && git clone https://github.com/TU_USUARIO/ares-codex.git
cd ares-codex
```
- [ ] Copiar tu `.env` de producción (§6) a la raíz del proyecto.
- [ ] Build + arranque:
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
- [ ] Comprobar que todo está `healthy`/`up`: `docker compose ps` y `docker compose logs -f backend`.

### 8.1 Migraciones de base de datos (Prisma)
El backend usa Prisma/Postgres; las tablas no existen hasta migrar.
- [ ] Aplicar migraciones (hay una pendiente: `20260520210000_drop_type_and_score`):
```bash
docker compose exec backend npx prisma migrate deploy
```
> Usa `migrate deploy` en prod (aplica migraciones existentes, no genera nuevas ni resetea datos).

### 8.2 Seed inicial de datos
- [ ] Poblar la base (la app trae `npm run seed` → `node dist/seed.js`):
```bash
docker compose exec backend node dist/seed.js
```
> Ojo: el seed puede invocar la IA y consumir crédito de Anthropic. Revisa `AI_AUTO_QUEUE_MIN_SCORE` y el `seed.log` para controlar el coste.

### 8.3 Smoke test
- [ ] `https://arescodex.com` carga el mapa/frontend.
- [ ] `https://api.arescodex.com/api/docs` muestra Swagger.
- [ ] El frontend consume el API real (no `localhost`): mira la pestaña Network del navegador.
- [ ] HTTPS válido (candado) en ambos dominios.

---

## 9. CI/CD — despliegue automático desde GitHub

Ya existe `.github/workflows/ci.yml` (solo tests). Añade un workflow de **deploy** que, al hacer push a `main` (y tras pasar los tests), entre por SSH al servidor y actualice.

- [ ] En GitHub → **Settings → Secrets and variables → Actions**, crea:
  - `SSH_HOST` = IP del servidor
  - `SSH_USER` = `deploy`
  - `SSH_PRIVATE_KEY` = clave privada de un par **dedicado al deploy** (genera uno nuevo y añade el `.pub` a `~/.ssh/authorized_keys` del `deploy`).
- [ ] Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  workflow_run:
    workflows: ["CI"]
    branches: [main]
    types: [completed]

jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ~/ares-codex
            git pull --ff-only
            docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
            docker compose exec -T backend npx prisma migrate deploy
            docker image prune -f
```

> Alternativa más robusta a medio plazo: **construir imágenes en CI y publicarlas en GHCR**, y que el servidor haga solo `docker compose pull && up -d` (builds fuera del VPS, despliegues atómicos). Empieza con SSH-build y migra a GHCR cuando duela el tiempo de build.

- [ ] Los secrets de la app (`ANTHROPIC_API_KEY`, etc.) viven **solo en el `.env` del servidor**, no en GitHub Actions. CI no los necesita (los tests están mockeados).

---

## 10. Operación: backups, logs y monitorización

- [ ] **Backups de Postgres** (los snapshots de disco de Hetzner no bastan para un restore limpio de BD). Cron diario:
```bash
# /etc/cron.daily/pg-backup  (chmod +x)
docker compose -f ~/ares-codex/docker-compose.yml exec -T postgres \
  pg_dump -U arescodex arescodex | gzip > ~/backups/db-$(date +\%F).sql.gz
find ~/backups -name 'db-*.sql.gz' -mtime +14 -delete
```
- [ ] (Opcional) Subir esos dumps a un **Hetzner Storage Box** o S3 (regla 3-2-1).
- [ ] **Probar un restore** al menos una vez — un backup sin restore probado no es un backup.
- [ ] **Rotación de logs Docker** para que no llenen el disco. En `/etc/docker/daemon.json`:
```json
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }
```
  luego `systemctl restart docker`.
- [ ] **Actualizaciones de seguridad** automáticas del SO: `apt install -y unattended-upgrades`.
- [ ] (Opcional) Monitorización/uptime: [UptimeRobot](https://uptimerobot.com) gratis sobre `https://api.arescodex.com/api/docs`, o Hetzner + Grafana/Netdata.
- [ ] Activa **alertas de gasto** en la consola de Anthropic y en Hetzner.

---

## 11. Checklist final de seguridad

- [ ] SSH solo con clave, root deshabilitado, fail2ban activo.
- [ ] Firewall: solo 22/80/443 abiertos; **5432 y 6379 cerrados**.
- [ ] `.env` con `chmod 600` y **fuera de git** (`.gitignore` revisado).
- [ ] Secrets de producción distintos de los de desarrollo.
- [ ] HTTPS forzado (Caddy redirige 80→443 por defecto).
- [ ] `CORS_ORIGIN` restringido a tu dominio (no `*`).
- [ ] Endpoints `/internal/*` protegidos por `SCRAPER_API_KEY`.
- [ ] Límite de gasto configurado en Anthropic.
- [ ] Backup de BD verificado con un restore de prueba.

---

## Resumen del orden recomendado

1. §1 Corregir bloqueantes del repo (nginx.conf, entrypoint, VITE build arg) y mergear.
2. §2 Comprar dominio → §3 Crear y asegurar servidor → §4 DNS.
3. §5 Caddy/HTTPS + §7 ajustar compose de prod.
4. §6 Secrets en el servidor.
5. §8 Primer deploy + migraciones + seed + smoke test.
6. §9 CI/CD + §10 backups/monitorización + §11 checklist.
