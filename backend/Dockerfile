# Development stage
FROM node:24 AS development

RUN mkdir -p /app && chown -R node:node /app

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

# Develop with hot reload
CMD ["npm", "run", "start:dev"]

# Build stage
FROM node:24 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Genera el cliente de Prisma ANTES de podar: la CLI `prisma` es devDependency,
# pero el cliente generado vive en node_modules/.prisma + @prisma/client (que es
# dependency) y sobrevive al prune. Sin esto, la imagen de producción crashea al
# arrancar con "Cannot find module '.prisma/client'".
RUN npx prisma generate
RUN npm run build

# Delete development dependencies
RUN npm prune --production

# Production stage
# node:24-slim (Debian) en vez de alpine: comparte libc (glibc) con la etapa
# `build`, así el schema-engine nativo de Prisma —el que usa `migrate deploy`—
# copiado en node_modules es compatible y funciona. Prisma necesita openssl.
FROM node:24-slim AS production

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --chown=node:node: en producción arrancamos como USER node, y comandos como
# `prisma migrate deploy` necesitan escribir en node_modules/@prisma/engines.
# Sin esto los archivos quedan en propiedad de root y Prisma crashea con
# "Can't write to /app/node_modules/@prisma/engines".
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package*.json ./
# Necesarios para `prisma migrate deploy` en el deploy: schema + migraciones y la
# config (que aporta datasource.url desde DATABASE_URL; el schema.prisma no la
# define). Sin esto Prisma falla con "Could not find Prisma Schema".
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

USER node

# El entrypoint de Nest es dist/main.js (nest build compila src/main.ts).
CMD ["node", "dist/main.js"]