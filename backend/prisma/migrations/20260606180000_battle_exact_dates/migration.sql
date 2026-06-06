-- Fechas exactas (precisión de día) cuando Wikidata las tiene. Se guardan como
-- texto ISO ("YYYY-MM-DD", con signo para a.C.) para soportar fechas antiguas
-- sin las limitaciones de los tipos timestamp.

ALTER TABLE "battles" ADD COLUMN "date"      TEXT;
ALTER TABLE "battles" ADD COLUMN "startDate" TEXT;
ALTER TABLE "battles" ADD COLUMN "endDate"   TEXT;
