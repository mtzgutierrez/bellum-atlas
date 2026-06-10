-- Marca si la narrativa IA se generó con búsqueda web (tier "premium") o sin
-- ella (tier "básico"). Ausencia de fila = aún no generada.

ALTER TABLE "battle_ai_summaries"
  ADD COLUMN "usedWebSearch" BOOLEAN NOT NULL DEFAULT false;
