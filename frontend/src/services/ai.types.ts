// Respuestas del endpoint Premium GET /battles/:id/ai-story.

export interface AIStory {
  summary: string
  context: string
  outcome: string
  curiosities: string
  modelUsed: string
  generatedAt: string
}

export interface AIStoryPending {
  status: 'pending' | 'unavailable'
  queuePosition?: number
}

// Estado consolidado que consume la UI.
export type AIStoryState =
  | { kind: 'ready'; story: AIStory }
  | { kind: 'pending'; queuePosition?: number }
  | { kind: 'unavailable' } // aún no pre-generada (a-demanda bloqueado)
  | { kind: 'forbidden' } // requiere premium
  | { kind: 'unauthorized' } // requiere login
