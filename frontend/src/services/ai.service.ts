import { getWithStatus } from './api'
import type { AIStory, AIStoryPending, AIStoryState } from './ai.types'

// Pide la historia de IA de una batalla. Abierta a todos; nunca bloquea
// esperando al LLM:
//   200 → narrativa lista (cache permanente)
//   202 / status 'pending' → generación encolada en background
//   status 'unavailable' → aún no pre-generada (no se genera a demanda)
export const aiService = {
  async historia(idOrSlug: string): Promise<AIStoryState> {
    const { status, data } = await getWithStatus<AIStory | AIStoryPending>(
      `/battles/${encodeURIComponent(idOrSlug)}/ai-story`,
    )
    const st = (data as AIStoryPending).status
    if (st === 'unavailable') return { kind: 'unavailable' }
    if (status === 202 || st === 'pending') {
      return { kind: 'pending', queuePosition: (data as AIStoryPending).queuePosition }
    }
    return { kind: 'ready', story: data as AIStory }
  },
}
