-- AlterTable
ALTER TABLE "battle_factions" ADD COLUMN     "deaths" INTEGER,
ADD COLUMN     "injured" INTEGER,
ADD COLUMN     "strength" INTEGER;

-- AlterTable
ALTER TABLE "war_factions" ADD COLUMN     "deaths" INTEGER,
ADD COLUMN     "injured" INTEGER,
ADD COLUMN     "strength" INTEGER;
