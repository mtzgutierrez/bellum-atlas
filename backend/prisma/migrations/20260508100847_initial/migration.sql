-- CreateEnum
CREATE TYPE "BattleType" AS ENUM ('LAND', 'NAVAL', 'AIR', 'SIEGE', 'COMBINED');

-- CreateEnum
CREATE TYPE "MediaSource" AS ENUM ('WIKIMEDIA', 'CUSTOM', 'EXTERNAL');

-- CreateTable
CREATE TABLE "historical_eras" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historical_eras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wars" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "result" TEXT,
    "wikipediaUrl" TEXT,
    "eraId" TEXT,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3),
    "dateText" TEXT,
    "result" TEXT,
    "type" "BattleType",
    "wikipediaUrl" TEXT,
    "eraId" TEXT,
    "locationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "battles_pkey" PRIMARY KEY ("id")
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
    "side" INTEGER NOT NULL,
    "belligerents" TEXT,
    "result" TEXT,
    "strengthRaw" TEXT,
    "casualtiesRaw" TEXT,
    "casualtiesMin" INTEGER,
    "casualtiesMax" INTEGER,
    "battleId" TEXT NOT NULL,

    CONSTRAINT "battle_factions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "war_factions" (
    "id" TEXT NOT NULL,
    "side" INTEGER NOT NULL,
    "belligerents" TEXT,
    "result" TEXT,
    "warId" TEXT NOT NULL,

    CONSTRAINT "war_factions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commanders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "birthYear" INTEGER,
    "deathYear" INTEGER,
    "description" TEXT,
    "wikipediaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commanders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commander_battle_factions" (
    "commanderId" TEXT NOT NULL,
    "battleFactionId" TEXT NOT NULL,

    CONSTRAINT "commander_battle_factions_pkey" PRIMARY KEY ("commanderId","battleFactionId")
);

-- CreateTable
CREATE TABLE "commander_war_factions" (
    "commanderId" TEXT NOT NULL,
    "warFactionId" TEXT NOT NULL,

    CONSTRAINT "commander_war_factions_pkey" PRIMARY KEY ("commanderId","warFactionId")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" "MediaSource" NOT NULL DEFAULT 'WIKIMEDIA',
    "license" TEXT,
    "caption" TEXT,
    "altText" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "mimeType" TEXT,
    "wikiTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "battle_media" (
    "mediaId" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "battle_media_pkey" PRIMARY KEY ("mediaId","battleId")
);

-- CreateTable
CREATE TABLE "war_media" (
    "mediaId" TEXT NOT NULL,
    "warId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "war_media_pkey" PRIMARY KEY ("mediaId","warId")
);

-- CreateTable
CREATE TABLE "commander_media" (
    "mediaId" TEXT NOT NULL,
    "commanderId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "commander_media_pkey" PRIMARY KEY ("mediaId","commanderId")
);

-- CreateIndex
CREATE UNIQUE INDEX "historical_eras_name_key" ON "historical_eras"("name");

-- CreateIndex
CREATE UNIQUE INDEX "historical_eras_slug_key" ON "historical_eras"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "wars_slug_key" ON "wars"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "wars_wikipediaUrl_key" ON "wars"("wikipediaUrl");

-- CreateIndex
CREATE UNIQUE INDEX "battles_slug_key" ON "battles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "battles_wikipediaUrl_key" ON "battles"("wikipediaUrl");

-- CreateIndex
CREATE UNIQUE INDEX "battle_factions_battleId_side_key" ON "battle_factions"("battleId", "side");

-- CreateIndex
CREATE UNIQUE INDEX "war_factions_warId_side_key" ON "war_factions"("warId", "side");

-- CreateIndex
CREATE UNIQUE INDEX "commanders_wikipediaUrl_key" ON "commanders"("wikipediaUrl");

-- CreateIndex
CREATE UNIQUE INDEX "media_url_key" ON "media"("url");

-- AddForeignKey
ALTER TABLE "wars" ADD CONSTRAINT "wars_eraId_fkey" FOREIGN KEY ("eraId") REFERENCES "historical_eras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wars" ADD CONSTRAINT "wars_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_eraId_fkey" FOREIGN KEY ("eraId") REFERENCES "historical_eras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battles" ADD CONSTRAINT "battles_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_wars" ADD CONSTRAINT "battle_wars_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_wars" ADD CONSTRAINT "battle_wars_warId_fkey" FOREIGN KEY ("warId") REFERENCES "wars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_factions" ADD CONSTRAINT "battle_factions_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "war_factions" ADD CONSTRAINT "war_factions_warId_fkey" FOREIGN KEY ("warId") REFERENCES "wars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commander_battle_factions" ADD CONSTRAINT "commander_battle_factions_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "commanders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commander_battle_factions" ADD CONSTRAINT "commander_battle_factions_battleFactionId_fkey" FOREIGN KEY ("battleFactionId") REFERENCES "battle_factions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commander_war_factions" ADD CONSTRAINT "commander_war_factions_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "commanders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commander_war_factions" ADD CONSTRAINT "commander_war_factions_warFactionId_fkey" FOREIGN KEY ("warFactionId") REFERENCES "war_factions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_media" ADD CONSTRAINT "battle_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "battle_media" ADD CONSTRAINT "battle_media_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "war_media" ADD CONSTRAINT "war_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "war_media" ADD CONSTRAINT "war_media_warId_fkey" FOREIGN KEY ("warId") REFERENCES "wars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commander_media" ADD CONSTRAINT "commander_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commander_media" ADD CONSTRAINT "commander_media_commanderId_fkey" FOREIGN KEY ("commanderId") REFERENCES "commanders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
