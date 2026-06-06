import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AIStory, BattleAIInput } from './ai.types';

// Servicio único de cara al worker. Internamente decide:
//   - AI_PROVIDER=mock      → genera plantilla local, cero coste.
//   - AI_PROVIDER=anthropic → llama a Claude con prompt caching.
//
// El system prompt es estable (no cambia entre batallas) por lo que activamos
// `cache_control` para que Anthropic reutilice los tokens. Reduce coste
// drásticamente cuando procesamos colas largas.
@Injectable()
export class LlmService implements OnModuleInit {
  private readonly logger = new Logger(LlmService.name);
  private provider: 'mock' | 'anthropic' = 'mock';
  private anthropic?: Anthropic;
  private model = 'claude-sonnet-4-6';

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const provider = (this.config.get<string>('AI_PROVIDER') ?? 'mock').toLowerCase();
    this.model = this.config.get<string>('AI_MODEL') ?? 'claude-sonnet-4-6';
    if (provider === 'anthropic') {
      const key = this.config.get<string>('ANTHROPIC_API_KEY');
      if (!key) {
        this.logger.warn(
          'AI_PROVIDER=anthropic pero ANTHROPIC_API_KEY no está set. Fallback a mock.',
        );
        return;
      }
      this.anthropic = new Anthropic({ apiKey: key });
      this.provider = 'anthropic';
      this.logger.log(`LLM listo: anthropic (${this.model})`);
    } else {
      this.logger.log('LLM listo: mock (sin coste, sin red)');
    }
  }

  modelId(): string {
    return this.provider === 'mock' ? 'mock' : this.model;
  }

  async generate(input: BattleAIInput): Promise<AIStory> {
    return this.provider === 'anthropic'
      ? this.callAnthropic(input)
      : this.mock(input);
  }

  // ─── Mock ──────────────────────────────────────────────────────────────
  // Plantilla útil para desarrollar UI sin depender de la API.
  private mock(input: BattleAIInput): AIStory {
    const when = input.year ?? input.startYear ?? '?';
    const baseSummary = input.wikipediaSummary?.slice(0, 280) ?? '';
    return {
      summary:
        `${input.name} (${when}) — relato breve generado en modo demo. ` +
        (baseSummary ? `Contexto base: ${baseSummary}` : ''),
      context:
        `Contexto estratégico (demo). La batalla tuvo lugar hacia ${when} y ` +
        `marcó su época.`,
      outcome:
        `Resultado (demo). Cambió la dinámica del frente y reconfiguró las ` +
        `fuerzas implicadas. Genera tu propia narrativa activando AI_PROVIDER=anthropic.`,
      curiosities:
        `Curiosidades (demo). Este texto es una plantilla mock; el provider real ` +
        `de IA está deshabilitado en este entorno.`,
    };
  }

  // ─── Anthropic ─────────────────────────────────────────────────────────
  // Una sola llamada que devuelve JSON estructurado. Pedimos JSON-only para
  // evitar parsing frágil, y mantenemos el system prompt fijo + cache.
  private async callAnthropic(input: BattleAIInput): Promise<AIStory> {
    const sys = SYSTEM_PROMPT;
    const userMsg = buildUserPrompt(input);
    const res = await this.anthropic!.messages.create({
      model: this.model,
      max_tokens: 1200,
      system: [{ type: 'text', text: sys, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMsg }],
    });
    const text = res.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('\n')
      .trim();
    return parseStoryJson(text);
  }
}

const SYSTEM_PROMPT = `Eres un divulgador histórico riguroso pero accesible. Recibirás
datos estructurados de una batalla y devolverás SIEMPRE un objeto JSON válido
con exactamente estas claves: "summary", "context", "outcome", "curiosities".

Reglas:
- Idioma: español.
- Tono: divulgativo, cercano, sin ser sensacionalista.
- Longitud: 100-200 palabras por campo.
- No inventes nombres, lugares o fechas que no estén en los datos o sean ampliamente conocidos.
- Si dudas, escribe en condicional. Mejor reconocer incertidumbre que afirmar incorrectamente.
- No incluyas markdown ni etiquetas, sólo texto plano.

Devuelve SOLO el JSON, sin texto antes ni después, sin code fences.`;

function buildUserPrompt(i: BattleAIInput): string {
  const lines = [
    `Batalla: ${i.name}`,
    i.year != null ? `Año: ${i.year}` : null,
    i.startYear != null && i.endYear != null
      ? `Rango: ${i.startYear}-${i.endYear}`
      : null,
    i.wikipediaSummary
      ? `\nResumen de Wikipedia (referencia, puede tener errores):\n${i.wikipediaSummary}`
      : null,
  ].filter((l): l is string => l != null);
  return lines.join('\n');
}

function parseStoryJson(text: string): AIStory {
  // Robustez: si el modelo añade fences o texto antes/después, recortamos.
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  const candidate = start >= 0 && end > start ? text.slice(start, end + 1) : text;
  const parsed = JSON.parse(candidate) as Partial<AIStory>;
  return {
    summary: String(parsed.summary ?? ''),
    context: String(parsed.context ?? ''),
    outcome: String(parsed.outcome ?? ''),
    curiosities: String(parsed.curiosities ?? ''),
  };
}
