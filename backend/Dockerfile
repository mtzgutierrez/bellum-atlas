# Development stage
FROM node:24 AS development

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
RUN npm run build

# Delete development dependencies
RUN npm prune --production

# Production stage
FROM node:24-alpine AS production

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

EXPOSE 3000

USER node

CMD ["node", "dist/index.js"]