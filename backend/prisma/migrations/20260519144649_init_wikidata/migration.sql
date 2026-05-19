-- CreateEnum
CREATE TYPE "BattleType" AS ENUM ('LAND', 'NAVAL', 'AIR', 'SIEGE', 'MIXED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'MAP');

-- CreateTable
CREATE TABLE "wars" (
    "id" TEXT NOT NULL,
    "wikidataId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "summary" TEXT,
    "dateStart" TIMESTAMP(3),
    "dateEnd" TIMESTAMP(3),
    "locations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deaths" INTEGER,
    "imageUrl" TEXT,
    "wikipediaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battles" (
    "id" TEXT NOT NULL,
    "wikidataId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "summary" TEXT,
    "date" TIMESTAMP(3),
    "dateStart" TIMESTAMP(3),
    "dateEnd" TIMESTAMP(3),
    "locationName" TEXT,
    "country" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "deaths" INTEGER,
    "casualties" INTEGER,
    "imageUrl" TEXT,
    "mapImageUrl" TEXT,
    "wikipediaUrl" TEXT,
    "type" "BattleType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "battles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factions" (
    "id" TEXT NOT NULL,
    "wikidataId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "flagUrl" TEXT,
    "imageUrl" TEXT,
    "wikipediaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commanders" (
    "id" TEXT NOT NULL,
    "wikidataId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "summary" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "birthDate" TIMESTAMP(3),
    "birthPlace" TEXT,
    "deathDate" TIMESTAMP(3),
    "deathPlace" TEXT,
    "causeOfDeath" TEXT,
    "nationality" TEXT,
    "imageUrl" TEXT,
    "wikipediaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commanders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commander_ranks" (
    "id" TEXT NOT NULL,
    "commanderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wikidataId" TEXT,
    "dateStart" TIMESTAMP(3),
    "dateEnd" TIMESTAMP(3),

    CONSTRAINT "commander_ranks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battle_wars" (
    "battleId" TEXT NOT NULL,
    "warId" TEXT NOT NULL,

    CONSTRAINT "battle_wars_pkey" PRIMARY KEY ("battleId","warId")
);

-- CreateTable
CREATE TABLE "battle_factions" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "factionId" TEXT NOT NULL,
    "side" INTEGER,
    "outcome" TEXT,

    CONSTRAINT "battle_factions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battle_faction_commanders" (
    "commanderId" TEXT NOT NULL,
    "battleFactionId" TEXT NOT NULL,

    CONSTRAINT "battle_faction_commanders_pkey" PRIMARY KEY ("commanderId","battleFactionId")
);

-- CreateTable
CREATE TABLE "war_factions" (
    "warId" TEXT NOT NULL,
    "factionId" TEXT NOT NULL,
    "side" INTEGER,
    "outcome" TEXT,

    CONSTRAINT "war_factions_pkey" PRIMARY KEY ("warId","factionId")
);

-- CreateTable
CREATE TABLE "commander_wars" (
    "commanderId" TEXT NOT NULL,
    "warId" TEXT NOT NULL,

    CONSTRAINT "commander_wars_pkey" PRIMARY KEY ("commanderId","warId")
);

-- CreateTable
CREATE TABLE "battle_media" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "caption" TEXT,

    CONSTRAINT "battle_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wars_wikidataId_key" ON "wars"("wikidataId");

-- CreateIndex
CREATE UNIQUE INDEX "wars_slug_key" ON "wars"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "wars_wikipediaUrl_key" ON "wars"("wikipediaUrl");

-- CreateIndex
CREATE INDEX "wars_dateStart_idx" ON "wars"("dateStart");

-- CreateIndex
CREATE UNIQUE INDEX "battles_wikidataId_key" ON "battles"("wikidataId");

-- CreateIndex
CREATE UNIQUE INDEX "battles_slug_key" ON "battles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "battles_wikipediaUrl_key" ON "battles"("wikipediaUrl");

-- CreateIndex
CREATE INDEX "battles_date_idx" ON "battles"("date");

-- CreateIndex
CREATE INDEX "battles_country_idx" ON "battles"("country");

-- CreateIndex
CREATE UNIQUE INDEX "factions_wikidataId_key" ON "factions"("wikidataId");

-- CreateIndex
CREATE UNIQUE INDEX "factions_slug_key" ON "factions"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "factions_wikipediaUrl_key" ON "factions"("wikipediaUrl");

-- CreateIndex
CREATE UNIQUE INDEX "commanders_wikidataId_key" ON "commanders"("wikidataId");

-- CreateIndex
CREATE UNIQUE INDEX "commanders_slug_key" ON "commanders"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "commanders_wikipediaUrl_key" ON "commanders"("wikipediaUrl");

-- CreateIndex
CREATE INDEX "commander_ranks_commanderId_idx" ON "commander_ranks"("commanderId");

-- CreateIndex
CREATE INDEX "battle_wars_warId_idx" ON "battle_wars"("warId");

-- CreateIndex
CREATE INDEX "battle_factions_battleId_idx" ON "battle_factions"("battleId");

-- CreateIndex
CREATE INDEX "battle_factions_factionId_idx" ON "battle_factions"("factionId");

-- CreateIndex
CREATE UNIQUE INDEX "battle_factions_battleId_factionId_key" ON "battle_factions"("battleId", "factionId");

-- CreateIndex
CREATE INDEX "battle_faction_commanders_battleFactionId_idx" ON "battle_faction_commanders"("battleFactionId");

-- CreateIndex
CREATE INDEX "war_factions_factionId_idx" ON "war_factions"("factionId");

-- CreateIndex
CREATE INDEX "commander_wars_warId_idx" ON "commander_wars"("warId");

-- CreateIndex
CREATE INDEX "battle_media_battleId_idx" ON "battle_media"("battleId");

-- AddForeignKey
ALTER TABLE "commander_ranks" ADD CONSTRAINT "commander_ranks_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "commanders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_wars" ADD CONSTRAINT "battle_wars_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_wars" ADD CONSTRAINT "battle_wars_warId_fkey" FOREIGN KEY ("warId") REFERENCES "wars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_factions" ADD CONSTRAINT "battle_factions_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_factions" ADD CONSTRAINT "battle_factions_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "factions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_faction_commanders" ADD CONSTRAINT "battle_faction_commanders_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "commanders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_faction_commanders" ADD CONSTRAINT "battle_faction_commanders_battleFactionId_fkey" FOREIGN KEY ("battleFactionId") REFERENCES "battle_factions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "war_factions" ADD CONSTRAINT "war_factions_warId_fkey" FOREIGN KEY ("warId") REFERENCES "wars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "war_factions" ADD CONSTRAINT "war_factions_factionId_fkey" FOREIGN KEY ("factionId") REFERENCES "factions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commander_wars" ADD CONSTRAINT "commander_wars_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "commanders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commander_wars" ADD CONSTRAINT "commander_wars_warId_fkey" FOREIGN KEY ("warId") REFERENCES "wars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_media" ADD CONSTRAINT "battle_media_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
