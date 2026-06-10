-- Clave de orden cronológico estable: año exacto si existe, si no el inicio del
-- rango. Permite ordenar la cronología "de más antigua a más moderna" sin que
-- las batallas con `year` nulo (solo `startYear`) caigan al final por NULL.
-- Es aditiva y no destructiva.

ALTER TABLE "battles" ADD COLUMN IF NOT EXISTS "sortYear" INTEGER;

-- Backfill de las filas existentes.
UPDATE "battles" SET "sortYear" = COALESCE("year", "startYear");

-- Mantenimiento automático en INSERT/UPDATE. Hecho con trigger (no columna
-- GENERATED) para que Prisma pueda seguir tratándola como columna normal: si la
-- ingesta no la envía, el trigger la calcula igualmente.
CREATE OR REPLACE FUNCTION set_battle_sort_year() RETURNS trigger AS $$
BEGIN
  NEW."sortYear" := COALESCE(NEW."year", NEW."startYear");
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_battle_sort_year ON "battles";
CREATE TRIGGER trg_battle_sort_year
  BEFORE INSERT OR UPDATE ON "battles"
  FOR EACH ROW EXECUTE FUNCTION set_battle_sort_year();

CREATE INDEX IF NOT EXISTS "battles_sortYear_idx" ON "battles"("sortYear");
