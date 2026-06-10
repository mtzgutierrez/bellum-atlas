-- Reset al modelo "Historical Atlas". Eliminamos todas las tablas anteriores
-- (Faction y derivadas) y recreamos el dominio simplificado. Esta migración
-- es destructiva por diseño: el modelo viejo se descarta.

DROP TABLE IF EXISTS "battle_faction_commanders" CASCADE;
DROP TABLE IF EXISTS "battle_factions" CASCADE;
DROP TABLE IF EXISTS "war_factions" CASCADE;
DROP TABLE IF EXISTS "commander_wars" CASCADE;
DROP TABLE IF EXISTS "battle_wars" CASCADE;
DROP TABLE IF EXISTS "battle_media" CASCADE;
DROP TABLE IF EXISTS "commander_ranks" CASCADE;
DROP TABLE IF EXISTS "battles" CASCADE;
DROP TABLE IF EXISTS "wars" CASCADE;
DROP TABLE IF EXISTS "commanders" CASCADE;
DROP TABLE IF EXISTS "factions" CASCADE;
DROP TABLE IF EXISTS "battle_ai_summaries" CASCADE;
DROP TYPE  IF EXISTS "BattleType" CASCADE;
DROP TYPE  IF EXISTS "MediaType" CASCADE;

-- gen_random_uuid() en PostgreSQL 13+ vive en el catálogo por defecto, pero
-- mantenemos pgcrypto explícito para portabilidad.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "BattleType" AS ENUM ('BATTLE', 'SIEGE', 'CAMPAIGN');

CREATE TABLE "battles" (
  "id"               UUID         NOT NULL DEFAULT gen_random_uuid(),
  "wikidataId"       TEXT,
  "name"             TEXT         NOT NULL,
  "slug"             TEXT         NOT NULL,
  "year"             INTEGER,
  "startYear"        INTEGER,
  "endYear"          INTEGER,
  "latitude"         DOUBLE PRECISION,
  "longitude"        DOUBLE PRECISION,
  "imageUrl"         TEXT,
  "wikipediaUrl"     TEXT,
  "summary"          TEXT,
  "type"             "BattleType" NOT NULL DEFAULT 'BATTLE',
  "importanceScore"  INTEGER      NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "battles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "battles_wikidataId_key" ON "battles"("wikidataId");
CREATE UNIQUE INDEX "battles_slug_key"       ON "battles"("slug");
CREATE INDEX        "battles_year_idx"       ON "battles"("year");
CREATE INDEX        "battles_lat_lng_idx"    ON "battles"("latitude", "longitude");
CREATE INDEX        "battles_importance_idx" ON "battles"("importanceScore");

CREATE TABLE "wars" (
  "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
  "wikidataId"   TEXT,
  "name"         TEXT         NOT NULL,
  "slug"         TEXT         NOT NULL,
  "startYear"    INTEGER,
  "endYear"      INTEGER,
  "imageUrl"     TEXT,
  "wikipediaUrl" TEXT,
  "summary"      TEXT,
  "region"       TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wars_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "wars_wikidataId_key" ON "wars"("wikidataId");
CREATE UNIQUE INDEX "wars_slug_key"       ON "wars"("slug");
CREATE INDEX        "wars_startYear_idx"  ON "wars"("startYear");

CREATE TABLE "commanders" (
  "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
  "wikidataId"   TEXT,
  "name"         TEXT         NOT NULL,
  "slug"         TEXT         NOT NULL,
  "birthYear"    INTEGER,
  "deathYear"    INTEGER,
  "imageUrl"     TEXT,
  "wikipediaUrl" TEXT,
  "summary"      TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "commanders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "commanders_wikidataId_key" ON "commanders"("wikidataId");
CREATE UNIQUE INDEX "commanders_slug_key"       ON "commanders"("slug");

CREATE TABLE "battle_wars" (
  "battleId" UUID NOT NULL,
  "warId"    UUID NOT NULL,
  CONSTRAINT "battle_wars_pkey" PRIMARY KEY ("battleId","warId"),
  CONSTRAINT "battle_wars_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "battles"("id") ON DELETE CASCADE,
  CONSTRAINT "battle_wars_warId_fkey"    FOREIGN KEY ("warId")    REFERENCES "wars"("id")    ON DELETE CASCADE
);
CREATE INDEX "battle_wars_warId_idx" ON "battle_wars"("warId");

CREATE TABLE "battle_commanders" (
  "battleId"    UUID NOT NULL,
  "commanderId" UUID NOT NULL,
  "side"        TEXT,
  CONSTRAINT "battle_commanders_pkey" PRIMARY KEY ("battleId","commanderId"),
  CONSTRAINT "battle_commanders_battleId_fkey"    FOREIGN KEY ("battleId")    REFERENCES "battles"("id")    ON DELETE CASCADE,
  CONSTRAINT "battle_commanders_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "commanders"("id") ON DELETE CASCADE
);
CREATE INDEX "battle_commanders_commanderId_idx" ON "battle_commanders"("commanderId");

CREATE TABLE "battle_ai_summaries" (
  "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
  "battleId"    UUID         NOT NULL,
  "summary"     TEXT         NOT NULL,
  "context"     TEXT         NOT NULL,
  "outcome"     TEXT         NOT NULL,
  "curiosities" TEXT         NOT NULL,
  "modelUsed"   TEXT         NOT NULL,
  "promptHash"  TEXT         NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "battle_ai_summaries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "battle_ai_summaries_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "battles"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX "battle_ai_summaries_battleId_key" ON "battle_ai_summaries"("battleId");
