-- Migration: add_media_table
-- Adds the `media` table plus the three join tables (battle_media, war_media,
-- commander_media) and removes the denormalised imageUrl columns from wars,
-- battles and commanders.

-- ─── 1. Enum ──────────────────────────────────────────────────────────────────
CREATE TYPE "MediaSource" AS ENUM ('WIKIMEDIA', 'CUSTOM', 'EXTERNAL');

-- ─── 2. media ─────────────────────────────────────────────────────────────────
CREATE TABLE "media" (
    "id"         TEXT        NOT NULL,
    "url"        TEXT        NOT NULL,
    "source"     "MediaSource" NOT NULL DEFAULT 'WIKIMEDIA',
    "license"    TEXT,
    "caption"    TEXT,
    "altText"    TEXT,
    "width"      INTEGER,
    "height"     INTEGER,
    "mimeType"   TEXT,
    "wikiTitle"  TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "media_url_key" ON "media"("url");

-- ─── 3. battle_media ──────────────────────────────────────────────────────────
CREATE TABLE "battle_media" (
    "mediaId"   TEXT    NOT NULL,
    "battleId"  TEXT    NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order"     INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "battle_media_pkey" PRIMARY KEY ("mediaId", "battleId")
);

ALTER TABLE "battle_media"
    ADD CONSTRAINT "battle_media_mediaId_fkey"
        FOREIGN KEY ("mediaId")  REFERENCES "media"("id")   ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "battle_media"
    ADD CONSTRAINT "battle_media_battleId_fkey"
        FOREIGN KEY ("battleId") REFERENCES "battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── 4. war_media ─────────────────────────────────────────────────────────────
CREATE TABLE "war_media" (
    "mediaId"   TEXT    NOT NULL,
    "warId"     TEXT    NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order"     INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "war_media_pkey" PRIMARY KEY ("mediaId", "warId")
);

ALTER TABLE "war_media"
    ADD CONSTRAINT "war_media_mediaId_fkey"
        FOREIGN KEY ("mediaId") REFERENCES "media"("id")  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "war_media"
    ADD CONSTRAINT "war_media_warId_fkey"
        FOREIGN KEY ("warId")   REFERENCES "wars"("id")   ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── 5. commander_media ───────────────────────────────────────────────────────
CREATE TABLE "commander_media" (
    "mediaId"     TEXT    NOT NULL,
    "commanderId" TEXT    NOT NULL,
    "isPrimary"   BOOLEAN NOT NULL DEFAULT false,
    "order"       INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "commander_media_pkey" PRIMARY KEY ("mediaId", "commanderId")
);

ALTER TABLE "commander_media"
    ADD CONSTRAINT "commander_media_mediaId_fkey"
        FOREIGN KEY ("mediaId")     REFERENCES "media"("id")       ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commander_media"
    ADD CONSTRAINT "commander_media_commanderId_fkey"
        FOREIGN KEY ("commanderId") REFERENCES "commanders"("id")  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── 6. Remove denormalised imageUrl columns ──────────────────────────────────
-- Guarded with IF EXISTS so re-running on a fresh DB is idempotent.
ALTER TABLE "wars"        DROP COLUMN IF EXISTS "imageUrl";
ALTER TABLE "battles"     DROP COLUMN IF EXISTS "imageUrl";
ALTER TABLE "commanders"  DROP COLUMN IF EXISTS "imageUrl";
