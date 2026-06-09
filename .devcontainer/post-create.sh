#!/usr/bin/env bash
# Se ejecuta una vez tras crear el DevContainer.
set -euo pipefail

echo "▶ Battle Atlas · configurando el entorno de desarrollo…"

# .env a partir de la plantilla si todavía no existe.
if [ ! -f /workspace/.env ]; then
  echo "  · creando .env desde .env.example"
  cp /workspace/.env.example /workspace/.env
fi

echo "▶ Instalando dependencias del backend…"
cd /workspace/backend
npm install
npx prisma generate

echo "▶ Instalando dependencias del frontend…"
cd /workspace/frontend
npm install

echo "▶ Aplicando migraciones de la base de datos…"
cd /workspace/backend
# Espera a que Postgres acepte conexiones antes de migrar.
npx prisma migrate deploy || echo "  ⚠ migrate deploy falló (¿Postgres aún arrancando?). Ejecútalo a mano más tarde."

echo "✅ Entorno listo."
echo "   Backend:  cd backend && npm run start:dev   → http://localhost:3000"
echo "   Frontend: ya corriendo en                   → http://localhost:5173"
echo "   Seed:     cd backend && npx ts-node src/cli.ts demo"
