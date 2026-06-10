# Despliegue AresCodex en Hetzner — guía ejecutable

> Guía operativa con los **comandos exactos** para desplegar la app (NestJS + Prisma/Postgres + Redis/BullMQ + frontend React/Vite, IA de Anthropic) en un VPS de Hetzner con dominio en Namecheap, HTTPS automático y despliegue continuo desde `main`.
>
> Complementa a [`DESPLIEGUE-HETZNER.md`](./DESPLIEGUE-HETZNER.md) (el plan original). Aquí se reflejan las decisiones reales tomadas sobre el código.

---

## Resumen de lo que ya está hecho en el repo

Estos cambios ya están aplicados y validados — **no tienes que tocarlos**, solo mergearlos:

| Archivo | Qué |
|---|---|
| `frontend/nginx.conf` *(nuevo)* | SPA fallback + cache de assets. Antes faltaba y rompía el build de prod. |
| `Caddyfile` *(nuevo)* | Reverse proxy con HTTPS automático (Let's Encrypt). Validado con `caddy validate`. |
| `docker-compose.prod.yml` *(reescrito)* | Añade Caddy (80/443), cierra puertos de backend/frontend al host y **deja de exponer Postgres/Redis a internet**. |
| `.env.example` | Añadidas `APP_DOMAIN` y `ACME_EMAIL`. |
| `.github/workflows/deploy.yml` *(nuevo)* | CD: despliega a Hetzner en cada push a `main`, solo si el CI pasa. |

### Decisiones de arquitectura (difieren de la nota original)

- **Un solo dominio (same-origin).** El frontend (`frontend/src/services/api.ts`) usa rutas **relativas** `/api/...`, no `VITE_API_URL`. Por eso se sirve la SPA en `/` y la API en `/api/*`, y Caddy le quita el prefijo `/api` (igual que el proxy de Vite en desarrollo). Ventaja: **cero CORS, cero cambios de código, un solo certificado** y **no necesitas el subdominio `api.`**.
- **`VITE_API_URL` como build arg (§1.3 de la nota): innecesario.** No lo usa el código.
- **Entrypoint del backend (§1.2): ya estaba bien** (`CMD ["node", "dist/main.js"]`).
- **`.gitignore`: ya contiene `.env`.**

---

## 0. Decisiones previas

- Dominio: ej. `arescodex.com` (un único dominio; sin `api.`).
- Región Hetzner cercana a tus usuarios (Nuremberg/Falkenstein/Helsinki en EU).
- Tamaño: **CX22** (2 vCPU / 4 GB / 40 GB).
- Clave SSH local. Si no la tienes:

```bash
ssh-keygen -t ed25519 -C "raulmartinezz402@gmail.com"
cat ~/.ssh/id_ed25519.pub   # esto es lo que subes a Hetzner
```

---

## 1. Mergear los cambios del repo a `main`

Verifica primero en local que el artefacto de producción compila:

```bash
cd ~/Workspaces/bellum-atlas
APP_DOMAIN=ejemplo.com docker compose -f docker-compose.yml -f docker-compose.prod.yml build
```

Commit y PR:

```bash
git add -A
git commit -m "feat: stack de producción (Caddy/HTTPS) + CD a Hetzner"
git push -u origin feat/llm
# Abre el PR feat/llm -> main y mergea (o, si trabajas directo en main):
# git checkout main && git merge feat/llm && git push
```

---

## 2. Comprar el dominio (Namecheap)

1. Crea cuenta en [namecheap.com](https://www.namecheap.com) y activa **2FA**.
2. Compra el dominio. Deja activado **WhoisGuard / Domain Privacy** (gratis).
3. **No configures los DNS todavía** — primero necesitas la IP del servidor (paso 4).

---

## 3. Crear y asegurar el servidor Hetzner

### 3.1 Crear el servidor (consola web)

1. Cuenta en [console.hetzner.cloud](https://console.hetzner.cloud) → nuevo proyecto `arescodex`.
2. **Security → SSH Keys** → pega el contenido de tu `~/.ssh/id_ed25519.pub`.
3. **Add Server**: imagen **Ubuntu 24.04**, tipo **CX22**, tu región, selecciona tu SSH key (sin contraseña).
4. (Recomendado) activa **Backups**.
5. Anota la **IP pública (IPv4)**.

### 3.2 Hardening inicial (primer login como `root`)

```bash
ssh root@TU_IP
```

Dentro del servidor:

```bash
# Actualizar el sistema
apt update && apt upgrade -y

# Usuario no-root con sudo y tu clave SSH
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# fail2ban (bloquea fuerza bruta SSH)
apt install -y fail2ban
```

Endurecer SSH:

```bash
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

> ⚠️ **Antes de cerrar esta sesión de root**, abre OTRA terminal y comprueba que entras como `deploy`:
> ```bash
> ssh deploy@TU_IP
> ```

Firewall — solo 22/80/443 (NO 5432/6379):

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22 && ufw allow 80 && ufw allow 443
ufw enable
```

### 3.3 Instalar Docker + Compose (como `root`)

```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy
apt install -y docker-compose-plugin
```

Verifica como `deploy` (re-loguéate para que aplique el grupo `docker`):

```bash
ssh deploy@TU_IP
docker compose version    # debe ser v2.24 o superior (por el !reset del compose)
```

---

## 4. Apuntar el dominio al servidor (DNS)

Solo necesitas **dos registros A** (no hace falta `api.`):

| Tipo | Host | Valor |
|---|---|---|
| `A` | `@`   | `TU_IP` |
| `A` | `www` | `TU_IP` |

Configúralos en **Namecheap → Advanced DNS**, o usa los nameservers de Hetzner DNS.

Verifica la propagación desde tu máquina local:

```bash
dig +short arescodex.com
dig +short www.arescodex.com
# Ambos deben devolver TU_IP (puede tardar de minutos a 48 h).
```

---

## 5. Despliegue inicial (en el servidor, como `deploy`)

### 5.1 Clonar y configurar

```bash
ssh deploy@TU_IP
cd ~ && git clone https://github.com/TU_USUARIO/bellum-atlas.git
cd bellum-atlas
cp .env.example .env
```

Genera los secretos (cópialos a tu gestor de contraseñas):

```bash
openssl rand -base64 48   # -> JWT_SECRET
openssl rand -base64 48   # -> SCRAPER_API_KEY
openssl rand -base64 32   # -> POSTGRES_PASSWORD
```

Edita el `.env` de producción:

```bash
nano .env
```

Valores mínimos a poner:

```dotenv
NODE_ENV=production
BUILD_TARGET=production

POSTGRES_DB=arescodex
POSTGRES_USER=arescodex
POSTGRES_PASSWORD=<openssl rand -base64 32>

AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...          # ¡pon límite de gasto en console.anthropic.com!
AI_MODEL=claude-sonnet-4-6

APP_DOMAIN=arescodex.com               # tu dominio, SIN https:// ni www
ACME_EMAIL=raulmartinezz402@gmail.com  # avisos de Let's Encrypt
```

Restringe la lectura del fichero:

```bash
chmod 600 .env
```

### 5.2 Arrancar el stack de producción

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Comprobar estado y logs:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend caddy
```

### 5.3 Migraciones de base de datos (Prisma)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec -T backend npx prisma migrate deploy
```

### 5.4 Seed inicial (opcional — consume crédito de Anthropic)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  exec -T backend node dist/seed.js
```

### 5.5 Smoke test

```bash
# Desde tu máquina local (o el propio servidor):
curl -fsS https://arescodex.com/api/health        # -> {"status":"ok"}
curl -fsSI https://arescodex.com | head -n1        # -> HTTP/2 200
```

Y en el navegador:
- `https://arescodex.com` carga el frontend con candado HTTPS válido.
- La pestaña Network muestra llamadas a `/api/...` (mismo dominio), no a `localhost`.

> Swagger queda accesible (si lo necesitas) en `https://arescodex.com/api/api/docs` por el strip del prefijo `/api`. En producción puedes ignorarlo.

---

## 6. Activar el despliegue continuo (GitHub Actions)

El workflow `.github/workflows/deploy.yml` ya está creado. Solo le faltan los secrets.

### 6.1 Crear un par de claves DEDICADO al deploy (en tu máquina local)

```bash
ssh-keygen -t ed25519 -C "github-deploy-arescodex" -f ~/.ssh/arescodex_deploy -N ""
```

### 6.2 Autorizar la clave pública en el servidor

```bash
ssh-copy-id -i ~/.ssh/arescodex_deploy.pub deploy@TU_IP
# Alternativa manual:
# cat ~/.ssh/arescodex_deploy.pub | ssh deploy@TU_IP 'cat >> ~/.ssh/authorized_keys'
```

Verifica que la clave dedicada entra:

```bash
ssh -i ~/.ssh/arescodex_deploy deploy@TU_IP 'echo OK'
```

### 6.3 Cargar los secrets en GitHub

Con la GitHub CLI (rápido):

```bash
cd ~/Workspaces/bellum-atlas
gh secret set SSH_HOST --body "TU_IP"
gh secret set SSH_USER --body "deploy"
gh secret set SSH_PRIVATE_KEY < ~/.ssh/arescodex_deploy
# gh secret set SSH_PORT --body "22"   # solo si cambiaste el puerto SSH
```

O por la web: **Settings → Secrets and variables → Actions → New repository secret**:
- `SSH_HOST` = IP del servidor
- `SSH_USER` = `deploy`
- `SSH_PRIVATE_KEY` = contenido de `~/.ssh/arescodex_deploy` (la **privada**)
- `SSH_PORT` = *(opcional)*

### 6.4 Probarlo

Haz cualquier push a `main`. El flujo es: **CI** (tests + build gate) → si pasa → **Deploy** (SSH al servidor → `git reset --hard origin/main` → rebuild → `prisma migrate deploy` → `docker image prune`).

```bash
gh run watch        # sigue la ejecución en vivo
```

> Los secrets de la app (`ANTHROPIC_API_KEY`, `POSTGRES_PASSWORD`, etc.) viven **solo en el `.env` del servidor**, nunca en GitHub.

---

## 7. Operación: backups, logs y seguridad

### 7.1 Backup diario de Postgres (en el servidor, como `deploy` con sudo)

Crea el script:

```bash
sudo tee /etc/cron.daily/pg-backup >/dev/null <<'EOF'
#!/bin/bash
set -euo pipefail
cd /home/deploy/bellum-atlas
mkdir -p /home/deploy/backups
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U arescodex arescodex | gzip > /home/deploy/backups/db-$(date +\%F).sql.gz
find /home/deploy/backups -name 'db-*.sql.gz' -mtime +14 -delete
EOF
sudo chmod +x /etc/cron.daily/pg-backup
```

Pruébalo manualmente una vez:

```bash
sudo /etc/cron.daily/pg-backup && ls -lh ~/backups
```

> Un backup sin restore probado no es un backup. Prueba un restore al menos una vez.

### 7.2 Rotación de logs de Docker

```bash
sudo tee /etc/docker/daemon.json >/dev/null <<'EOF'
{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }
EOF
sudo systemctl restart docker
```

### 7.3 Actualizaciones de seguridad automáticas del SO

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 7.4 Checklist final de seguridad

- [ ] SSH solo con clave, root deshabilitado, `fail2ban` activo.
- [ ] Firewall: solo 22/80/443 abiertos; **5432 y 6379 cerrados**.
- [ ] `.env` con `chmod 600` y fuera de git.
- [ ] Secrets de producción distintos de los de desarrollo.
- [ ] HTTPS forzado (Caddy redirige 80→443 por defecto).
- [ ] Endpoints `/api/internal/*` protegidos por `SCRAPER_API_KEY`.
- [ ] Límite de gasto configurado en Anthropic.
- [ ] Backup de BD verificado con un restore de prueba.

---

## Apéndice: comandos de operación habituales

```bash
# Atajo: exporta las flags de compose para no repetirlas
cd ~/bellum-atlas
export COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

$COMPOSE ps                 # estado de los servicios
$COMPOSE logs -f backend    # logs en vivo
$COMPOSE restart backend    # reiniciar un servicio
$COMPOSE down               # parar todo (sin borrar volúmenes)
$COMPOSE up -d --build      # reconstruir y levantar (lo que hace el CD)
```

Despliegue manual (si quieres forzar uno sin pasar por GitHub):

```bash
cd ~/bellum-atlas
git fetch --all --prune && git reset --hard origin/main
$COMPOSE up -d --build
$COMPOSE exec -T backend npx prisma migrate deploy
docker image prune -f
```
