-- Pasa strength/deaths/injured de INT a TEXT en battle_factions y war_factions.
-- Los datos previos (parseados como números desde Wikipedia) se descartan;
-- el nuevo seed los repuebla con el texto bruto del infobox.

ALTER TABLE "battle_factions"
  DROP COLUMN "strength",
  DROP COLUMN "deaths",
  DROP COLUMN "injured",
  ADD COLUMN "strength" TEXT,
  ADD COLUMN "deaths" TEXT,
  ADD COLUMN "injured" TEXT;

ALTER TABLE "war_factions"
  DROP COLUMN "strength",
  DROP COLUMN "deaths",
  DROP COLUMN "injured",
  ADD COLUMN "strength" TEXT,
  ADD COLUMN "deaths" TEXT,
  ADD COLUMN "injured" TEXT;
