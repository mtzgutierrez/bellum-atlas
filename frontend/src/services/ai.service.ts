import { ApiError, getWithStatus } from './api'
import type { AIStory, AIStoryPending, AIStoryState } from './ai.types'

// Pide la historia de IA de una batalla. NUNCA bloquea esperando al LLM:
//   200 → narrativa lista (cache permanente)
//   202 → generación encolada en background; devolvemos "pending"
//   401/403 → el usuario no tiene tier premium / no está logado
export const aiService = {
  async historia(idOrSlug: string): Promise<AIStoryState> {
    try {
      const { status, data } = await getWithStatus<AIStory | AIStoryPending>(
        `/battles/${encodeURIComponent(idOrSlug)}/ai-story`,
      )
      const st = (data as AIStoryPending).status
      if (st === 'unavailable') return { kind: 'unavailable' }
      if (status === 202 || st === 'pending') {
        return { kind: 'pending', queuePosition: (data as AIStoryPending).queuePosition }
      }
      return { kind: 'ready', story: data as AIStory }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return { kind: 'unauthorized' }
        if (err.status === 403) return { kind: 'forbidden' }
      }
      throw err
    }
  },
}
