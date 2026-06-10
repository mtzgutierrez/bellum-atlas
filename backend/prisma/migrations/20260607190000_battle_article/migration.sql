-- Texto completo (extracto) del artículo de Wikipedia, cacheado en BD la
-- primera vez que se solicita una batalla (backfill perezoso). Da contenido rico
-- a TODAS las batallas sin depender de la IA. Aditiva y no destructiva.

ALTER TABLE "battles" ADD COLUMN IF NOT EXISTS "article" TEXT;
