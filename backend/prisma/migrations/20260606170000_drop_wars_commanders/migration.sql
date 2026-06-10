-- Simplificación del modelo: el dominio queda solo en Battle (+ BattleAISummary).
-- Guerras y comandantes se descartan (datos poco fiables desde Wikidata).
-- Migración destructiva por diseño.

DROP TABLE IF EXISTS "battle_commanders" CASCADE;
DROP TABLE IF EXISTS "battle_wars" CASCADE;
DROP TABLE IF EXISTS "commanders" CASCADE;
DROP TABLE IF EXISTS "wars" CASCADE;
