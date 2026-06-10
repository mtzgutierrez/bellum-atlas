import Anthropic from '@anthropic-ai/sdk';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AIStory, BattleAIInput } from './ai.types';

// Servicio único de cara al worker. Internamente decide:
//   - AI_PROVIDER=mock      → genera plantilla local, cero coste.
//   - AI_PROVIDER=anthropic → llama a Claude con prompt caching y, si está
//     habilitado (AI_WEB_SEARCH), la herramienta de búsqueda web para ampliar
//     y verificar con fuentes externas.
@Injectable()
export class LlmService implements OnModuleInit {
  private readonly logger = new Logger(LlmService.name);
  private provider: 'mock' | 'anthropic' = 'mock';
  private anthropic?: Anthropic;
  private model = 'claude-sonnet-4-6';
  // Kill-switch global: si AI_WEB_SEARCH=false, ninguna generación usa búsqueda
  // web aunque el job la pida. El tier (web vs básica) lo decide cada job.
  private webSearchAllowed = true;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const provider = (this.config.get<string>('AI_PROVIDER') ?? 'mock').toLowerCase();
    this.model = this.config.get<string>('AI_MODEL') ?? 'claude-sonnet-4-6';
    this.webSearchAllowed =
      (this.config.get<string>('AI_WEB_SEARCH') ?? 'true').toLowerCase() !== 'false';
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
      this.logger.log(
        `LLM listo: anthropic (${this.model})${this.webSearchAllowed ? ' + web search disponible' : ' (web search desactivada)'}`,
      );
    } else {
      this.logger.log('LLM listo: mock (sin coste, sin red)');
    }
  }

  modelId(): string {
    return this.provider === 'mock' ? 'mock' : this.model;
  }

  // ¿Usa un proveedor real (no mock)? Lo usa el worker para marcar usedWebSearch.
  isReal(): boolean {
    return this.provider === 'anthropic';
  }

  // `webSearch` lo decide cada job (tier). El env AI_WEB_SEARCH puede vetarlo.
  async generate(
    input: BattleAIInput,
    opts: { webSearch?: boolean } = {},
  ): Promise<AIStory> {
    if (this.provider !== 'anthropic') return this.mock(input);
    const useSearch = (opts.webSearch ?? false) && this.webSearchAllowed;
    return this.callAnthropic(input, useSearch);
  }

  // ─── Mock ──────────────────────────────────────────────────────────────
  private mock(input: BattleAIInput): AIStory {
    const when = input.year ?? input.startYear ?? '?';
    const base = input.sourceText?.slice(0, 280) ?? '';
    return {
      summary:
        `${input.name} (${when}) — relato breve generado en modo demo. ` +
        (base ? `Contexto base: ${base}` : ''),
      context: `Contexto estratégico (demo). La batalla tuvo lugar hacia ${when}.`,
      outcome:
        `Resultado (demo). Activa AI_PROVIDER=anthropic para una narrativa real.`,
      curiosities: `Curiosidades (demo). Plantilla mock; IA real deshabilitada.`,
    };
  }

  // ─── Anthropic ─────────────────────────────────────────────────────────
  private async callAnthropic(input: BattleAIInput, useSearch: boolean): Promise<AIStory> {
    const userMsg = buildUserPrompt(input);
    try {
      return await this.callOnce(userMsg, useSearch);
    } catch (err) {
      // Si la búsqueda web no está disponible en la cuenta/SDK, reintentamos
      // sin ella: el artículo completo ya da una buena base.
      if (useSearch) {
        this.logger.warn(
          `Generación con web search falló (${(err as Error).message}); reintento sin búsqueda.`,
        );
        return this.callOnce(userMsg, false);
      }
      throw err;
    }
  }

  private async callOnce(userMsg: string, useSearch: boolean): Promise<AIStory> {
    const messages: Anthropic.Messages.MessageParam[] = [
      { role: 'user', content: userMsg },
    ];
    let res: Anthropic.Messages.Message | undefined;
    // La búsqueda web puede devolver `pause_turn`: hay que continuar el turno.
    for (let i = 0; i < 5; i++) {
      res = await this.anthropic!.messages.create(this.buildParams(messages, useSearch));
      if (res.stop_reason !== 'pause_turn') break;
      messages.push({ role: 'assistant', content: res.content });
    }
    const text = (res?.content ?? [])
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('\n')
      .trim();
    return parseStoryJson(text);
  }

  private buildParams(
    messages: Anthropic.Messages.MessageParam[],
    useSearch: boolean,
  ): Anthropic.Messages.MessageCreateParamsNonStreaming {
    const params: Anthropic.Messages.MessageCreateParamsNonStreaming = {
      model: this.model,
      max_tokens: 4096,
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      messages,
    };
    if (useSearch) {
      // Herramienta de servidor de Anthropic; el tipado exacto varía entre
      // versiones del SDK, de ahí el cast.
      (params as unknown as { tools: unknown[] }).tools = [
        { type: 'web_search_20250305', name: 'web_search', max_uses: 5 },
      ];
    }
    return params;
  }
}

const SYSTEM_PROMPT = `Eres un historiador militar y divulgador experto. A partir del
material de referencia proporcionado y de tu conocimiento (y, si dispones de la
herramienta de búsqueda web, úsala para verificar datos y añadir detalles
relevantes de fuentes fiables), redacta una pieza divulgativa RICA, DETALLADA y
amena sobre la batalla, del tipo por el que un lector pagaría.

Devuelve SIEMPRE un objeto JSON válido con EXACTAMENTE estas claves:
"summary", "context", "outcome", "curiosities".

Contenido de cada campo (en español, varios párrafos separados por saltos de línea):
- "summary": el relato de la batalla — cómo se desarrolló, fases, maniobras,
  momentos decisivos. 250-400 palabras. Que enganche, como una buena crónica.
- "context": contexto estratégico y geopolítico — qué la provocó, qué estaba en
  juego, las fuerzas y comandantes enfrentados, planes de cada bando. 200-350 palabras.
- "outcome": desenlace, bajas y cifras, consecuencias inmediatas y a largo plazo,
  y por qué es históricamente importante. 200-350 palabras.
- "curiosities": 3 a 5 anécdotas o datos curiosos CONCRETOS y verificables, cada
  uno desarrollado en un par de frases.

Reglas:
- Sé específico: nombres propios, cifras, lugares y fechas reales. Nada de
  generalidades vacías ("fue una batalla importante que cambió la historia").
- Rigor: no inventes. Si un dato es incierto o se debate, dilo en condicional.
- Texto plano, sin markdown ni encabezados, sin notas al pie ni citas con corchetes.
- Devuelve SOLO el JSON, sin texto antes ni después, sin code fences.`;

const TYPE_LABEL: Record<BattleAIInput['type'], string> = {
  BATTLE: 'Batalla',
  SIEGE: 'Asedio',
  CAMPAIGN: 'Campaña militar',
};

function buildUserPrompt(i: BattleAIInput): string {
  const lines = [
    `Nombre: ${i.name}`,
    `Tipo: ${TYPE_LABEL[i.type]}`,
    fechaLine(i),
    i.latitude != null && i.longitude != null
      ? `Ubicación (coordenadas lat, lon): ${i.latitude.toFixed(4)}, ${i.longitude.toFixed(4)}`
      : null,
    i.sourceText
      ? `\nMaterial de referencia (artículo de Wikipedia; puede tener errores u omisiones):\n${i.sourceText}`
      : null,
  ].filter((l): l is string => l != null);
  return lines.join('\n');
}

// Prioriza la fecha exacta (día) si la tenemos; si no, el año o el rango.
function fechaLine(i: BattleAIInput): string | null {
  if (i.startDate && i.endDate) return `Fechas: del ${i.startDate} al ${i.endDate}`;
  if (i.date) return `Fecha: ${i.date}`;
  if (i.startDate) return `Inicio: ${i.startDate}`;
  if (i.year != null) return `Año: ${i.year}`;
  if (i.startYear != null && i.endYear != null) return `Rango: ${i.startYear}-${i.endYear}`;
  return null;
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
