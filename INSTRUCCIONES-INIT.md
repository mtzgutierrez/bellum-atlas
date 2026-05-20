🗺️ PROJECT BLUEPRINT: HISTORICAL ATLAS APP
1. CONTEXTO Y OBJETIVO DEL PROYECTO

Vas a desarrollar una aplicación web de exploración histórica interactiva. El objetivo es crear un "Atlas Histórico" visual donde los usuarios puedan explorar batallas, guerras y comandantes a través de un mapa interactivo (Mapbox/Leaflet) y un timeline.

Regla de Negocio Principal: La aplicación se divide en un Free Tier (datos estructurados y navegación visual) y un Premium Tier (narrativas, contexto estratégico y curiosidades generadas por IA).
Regla de Arquitectura Principal: Minimizar el coste de la IA. NUNCA se llama a la IA en tiempo real durante una petición del usuario. Todo el contenido generado por IA debe precomputarse en background mediante workers (BullMQ) y almacenarse permanentemente.

Nota importante sobre el modelo de datos: Venimos de un modelo altamente complejo basado en grafos de Wikidata (con Facciones, Rangos temporales, qualifiers, etc.). ESTE MODELO SE DESCART<A. Vamos a usar un modelo intencionadamente simplificado donde importan los años (no fechas exactas), las coordenadas y las relaciones directas (Batalla-Guerra, Batalla-Comandante).
2. STACK TECNOLÓGICO

    Backend: NestJS (TypeScript).

    Base de Datos: PostgreSQL con extensión PostGIS (crucial para clustering y búsquedas por bounding box en el mapa).

    ORM: Prisma.

    Caché & Colas: Redis + BullMQ (para el Ingestion Pipeline y los AI Jobs).

    Frontend: React.js, Mapbox GL JS (o Leaflet), Zustand (estado global), TailwindCSS.

    IA: Integración con LLM API (OpenAI/Anthropic/Google) usada solo por los background workers.

3. NUEVO MODELO DE DATOS (PRISMA SCHEMA)

Este es el esquema exacto que debes implementar. Fíjate en cómo hemos eliminado la tabla Faction y simplificado las fechas a Int (años) para facilitar la representación en el timeline.
Fragmento de código

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"

}

// ─── ENTIDADES PRINCIPALES ──────────────────────────────────────────────────

model Battle {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  wikidataId       String?  @unique
  name             String
  year             Int?
  startYear        Int?
  endYear          Int?
  
  // Coordenadas (PostGIS se usará a nivel de query RAW si es necesario)
  latitude         Float?
  longitude        Float?
  
  imageUrl         String?
  wikipediaUrl     String?
  type             BattleType @default(BATTLE)
  importanceScore  Int        @default(0)

  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt

  // Relaciones
  wars             BattleWar[]
  commanders       BattleCommander[]
  aiSummary        BattleAISummary?

  @@index([year])
  @@index([latitude, longitude])
  @@map("battles")
}

model War {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  wikidataId   String?  @unique
  name         String
  startYear    Int?
  endYear      Int?
  imageUrl     String?
  region       String?

  createdAt    DateTime @default(now())

  // Relaciones
  battles      BattleWar[]

  @@index([startYear])
  @@map("wars")
}

model Commander {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  wikidataId   String?  @unique
  name         String
  birthYear    Int?
  deathYear    Int?
  imageUrl     String?

  createdAt    DateTime @default(now())

  // Relaciones
  battles      BattleCommander[]

  @@map("commanders")
}

// ─── RELACIONES SIMPLIFICADAS ───────────────────────────────────────────────

model BattleWar {
  battleId String @db.Uuid
  warId    String @db.Uuid

  battle   Battle @relation(fields: [battleId], references: [id], onDelete: Cascade)
  war      War    @relation(fields: [warId], references: [id], onDelete: Cascade)

  @@id([battleId, warId])
  @@map("battle_wars")
}

model BattleCommander {
  battleId    String  @db.Uuid
  commanderId String  @db.Uuid
  side        String? // Opcional y simplificado (ej: "Allies", "Axis", "1", "2")

  battle      Battle    @relation(fields: [battleId], references: [id], onDelete: Cascade)
  commander   Commander @relation(fields: [commanderId], references: [id], onDelete: Cascade)

  @@id([battleId, commanderId])
  @@map("battle_commanders")
}

// ─── SISTEMA DE IA (CACHÉ PERMANENTE) ───────────────────────────────────────

model BattleAISummary {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  battleId    String   @unique @db.Uuid
  
  summary     String   @db.Text
  context     String   @db.Text
  outcome     String   @db.Text
  curiosities String   @db.Text
  modelUsed   String

  createdAt   DateTime @default(now())

  battle      Battle   @relation(fields: [battleId], references: [id], onDelete: Cascade)

  @@map("battle_ai_summaries")
}

enum BattleType {
  BATTLE
  SIEGE
  CAMPAIGN
}

4. REGLAS CORE DE LA APLICACIÓN (NO NEGOCIABLES)
4.1. Estrategia de IA (Zero Real-Time Generation)

    Nunca llames a la API de IA en un controlador HTTP directo al usuario.

    Si un usuario Premium entra en una batalla y no existe registro en BattleAISummary, se le muestra un mensaje ("Narrativa generándose...") y se encola un job en BullMQ, pero el request no espera a la IA.

    El worker en background consolida los datos (extracto de Wikipedia, metadatos de la base de datos) y construye el prompt. La respuesta del LLM se parsea e inserta en BattleAISummary.

    El caché es permanente. Solo se invalida o regenera si se lanza un batch job administrativo.

4.2. Ingestion Pipeline

Debes crear un módulo o script de NestJS (comandos CLI) que procese datos por pasos:

    Paso 1: Query a Wikidata o lectura de un JSON estático. Extrae nombre, coordenadas, años, imágenes y relaciones.

    Paso 2: Normalización. Limpia los nulos, formatea los años, asegura coordenadas válidas.

    Paso 3: Almacenamiento en Postgres usando Prisma.

    Paso 4: Encolar en BullMQ (opcionalmente) la generación de la IA basándose en el importanceScore. (Ejemplo: pre-generar la IA para las batallas con score > 80).

4.3. Monetización y API Protection

Implementa Guards/Middleware en NestJS:

    Free Tier: GET /api/battles (tiles de mapa, listados, metadata básica). Rate limit alto.

    Premium Tier: GET /api/battles/:id/ai-story. Requiere token JWT con rol Premium. Rate limit controlado (ej: 1000/mes).

5. EXPERIENCIA FRONTEND (REACT)

El frontend debe ser fluido, similar a un "Netflix de la historia". Implementa lo siguiente:

    Vista Principal (Mapa + Timeline):

        Un mapa a pantalla completa ocupando el fondo. Usa clusters para agrupar puntos cuando se hace zoom out.

        Un slider (Timeline) en la parte inferior. Al moverlo (ej. 1939 - 1945), el mapa filtra los puntos en tiempo real usando los campos year/startYear de las batallas.

    Modo Explorar (Sidebar):

        Cards pequeñas de batallas que cambian según el viewport del mapa (búsqueda geoespacial). Cada card muestra: Imagen, Nombre, Año, y un botón de "Detalle".

    Battle Detail Page:

        Una modal o drawer lateral que se abre al hacer clic.

        Muestra metadata estructurada (Comandantes, Guerra a la que pertenece).

        Si es Premium y la IA está generada: Muestra tabs para "Story Mode", "Strategic Context" y "Curiosities" leyendo de BattleAISummary.

6. INSTRUCCIONES DE EJECUCIÓN PARA EL LLM

Por favor, comienza el desarrollo en este orden:

    Inicializa el proyecto backend en NestJS y configura Prisma con el esquema proporcionado arriba.

    Desarrolla los DTOs y los Controladores básicos de lectura (/battles, /wars, /commanders).

    Implementa la infraestructura de BullMQ + Redis en NestJS, creando el AiGenerationWorker que consuma trabajos, llame a un servicio de LLM simulado y guarde en BattleAISummary.

    Crea un script de Seed básico que inserte 3 batallas famosas con sus relaciones para poder probar.

Espero tu confirmación con la configuración inicial de NestJS, Prisma y Redis.