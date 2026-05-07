# Entorno local

## Requisitos previos

- **Node.js** 20+ y **npm** 10+
- **Python** 3.11+
- **Docker** y **Docker Compose** (para PostgreSQL y Redis)

---

## Paso a paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/ares-codex.git
cd ares-codex
```

### 2. Levantar la infraestructura

```bash
docker compose up -d
```

Esto levanta:

- **PostgreSQL** con la extensión PostGIS en el puerto `5432`
- **Redis** en el puerto `6379`

### 3. Backend

```bash
cd backend
npm install

# Crear el archivo de variables de entorno
cp .env.example .env

# Ejecutar migraciones de Prisma
npx prisma migrate dev

# Generar el cliente Prisma
npx prisma generate

# Iniciar en modo desarrollo
npm run start:dev
```

La API queda disponible en `http://localhost:3000`.

### 4. Frontend

```bash
# En otra terminal
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

### 5. Scraper (seed inicial)

```bash
# En otra terminal
cd scraper
pip install -r requirements.txt

cd ares
scrapy crawl wikipedia -o output.json
```

!!! tip "Desarrollo sin scraper"
    Si solo quieres desarrollar el frontend o el backend, puedes importar los datos de muestra directamente:
    ```bash
    # Desde la raíz del proyecto
    cat scraper/ares/output.json | npx ts-node backend/scripts/seed.ts
    ```

---

## Verificar que todo funciona

```bash
# Health check del backend
curl http://localhost:3000/health

# Primera petición de batallas
curl "http://localhost:3000/battles?limit=5"
```
