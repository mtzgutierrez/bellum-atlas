// Tipos compartidos por el módulo de IA. Mantenemos los contratos del LLM
// y de la cola en un solo sitio para evitar drift.

// Resultado parseado del LLM. La narrativa se trocea en 4 campos finos para
// que el frontend pueda pestañear (Story / Strategy / Outcome / Curiosities)
// sin que el modelo tenga que devolver una sola pared de texto.
export interface AIStory {
  summary: string;     // narrativa principal
  context: string;     // contexto estratégico
  outcome: string;     // resultado y consecuencias
  curiosities: string; // anécdotas / datos curiosos
}

// Datos que el worker pasa al LLM. Vienen de la base de datos en el momento
// del job, no se serializan grandes (el job sólo lleva el id).
export interface BattleAIInput {
  name: string;
  year: number | null;
  startYear: number | null;
  endYear: number | null;
  date: string | null; // "YYYY-MM-DD" si hay día exacto
  startDate: string | null;
  endDate: string | null;
  type: 'BATTLE' | 'SIEGE' | 'CAMPAIGN';
  latitude: number | null;
  longitude: number | null;
  // Material de referencia: el artículo completo de Wikipedia (o el extract
  // corto como fallback).
  sourceText: string | null;
}

// Payload del job de la cola BullMQ. Sólo id + tier; el worker re-lee la BD.
export interface GenerateAIJobData {
  battleId: string;
  reason: 'auto-ingest' | 'on-demand-request' | 'daily-enrichment';
  // true = generar con búsqueda web (tier rico); false/omitido = básica.
  webSearch?: boolean;
}

export const AI_QUEUE_NAME = 'ai-generation';
export const AI_DAILY_QUEUE_NAME = 'ai-daily';
