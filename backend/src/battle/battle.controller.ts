import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { normalizePagination } from '../common/pagination.dto';
import {
  BattleFilters,
  BattleSort,
  BattleSummary,
  BattleWithRelations,
} from './battle.repository';
import { BattleService } from './battle.service';
import {
  BattleDto,
  BattlePointDto,
  BattleSummaryDto,
  BattlesQueryDto,
  PaginatedBattlesDto,
} from './dto/battle.dto';

@ApiTags('Batallas')
@Controller('battles')
export class BattleController {
  constructor(private readonly service: BattleService) {}

  // ─── /battles/points: todos los puntos del mapa (capado) ───────────────
  @Get('points')
  @ApiOperation({
    summary: 'Devuelve los puntos para el mapa (filtrables por año y bbox).',
  })
  @ApiOkResponse({ type: [BattlePointDto] })
  async points(@Query() q: BattlesQueryDto): Promise<BattlePointDto[]> {
    const filters = parseFilters(q);
    const rows = await this.service.points(filters);
    return rows
      .filter((b) => b.latitude != null && b.longitude != null)
      .map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        year: b.year,
        startYear: b.startYear,
        endYear: b.endYear,
        date: b.date,
        startDate: b.startDate,
        endDate: b.endDate,
        latitude: b.latitude as number,
        longitude: b.longitude as number,
        imageUrl: b.imageUrl,
        type: b.type,
        importanceScore: b.importanceScore,
      }));
  }

  // ─── /battles/on-this-day: efemérides (un día como hoy) ─────────────────
  @Get('on-this-day')
  @ApiOperation({ summary: 'Batallas cuyo día y mes coinciden con hoy.' })
  @ApiOkResponse({ type: [BattleSummaryDto] })
  async onThisDay(): Promise<BattleSummaryDto[]> {
    const now = new Date();
    const mmdd = `-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    const rows = await this.service.onThisDay(mmdd);
    return rows.map(toSummary);
  }

  // ─── /battles/timeline: top batallas para la cronología ────────────────
  @Get('timeline')
  @ApiOperation({ summary: 'Top batallas por importancia (para el timeline).' })
  @ApiOkResponse({ type: [BattleSummaryDto] })
  async timeline(@Query('limit') limit?: string): Promise<BattleSummaryDto[]> {
    const n = Number(limit);
    const take = Number.isFinite(n) && n > 0 ? Math.min(n, 300) : 150;
    const rows = await this.service.timeline(take);
    return rows.map(toSummary);
  }

  // ─── /battles/centuries: nº de batallas por siglo (selector timeline) ──
  @Get('centuries')
  @ApiOperation({ summary: 'Recuento de batallas por siglo (con datos).' })
  async centuries(): Promise<{ century: number; count: number }[]> {
    return this.service.centuries();
  }

  // ─── /battles/stats: agregados para la página de estadísticas ──────────
  @Get('stats')
  @ApiOperation({ summary: 'Recuentos y agregados del catálogo de batallas.' })
  async stats() {
    return this.service.stats();
  }

  // ─── /battles: listado paginado para la sidebar ────────────────────────
  @Get()
  @ApiOperation({ summary: 'Listado paginado de batallas con filtros.' })
  @ApiOkResponse({ type: PaginatedBattlesDto })
  async list(@Query() q: BattlesQueryDto): Promise<PaginatedBattlesDto> {
    const filters = parseFilters(q);
    const { page, pageSize } = normalizePagination(q);
    const result = await this.service.list(filters, { page, pageSize });
    return {
      data: result.data.map(toSummary),
      meta: result.meta,
    };
  }

  // ─── /battles/:id/article: extracto de Wikipedia (backfill perezoso) ───
  @Get(':id/article')
  @ApiOperation({
    summary: 'Extracto completo de Wikipedia de la batalla (cacheado en BD).',
  })
  @ApiNotFoundResponse({ description: 'Batalla no encontrada' })
  async article(@Param('id') id: string) {
    return this.service.getArticle(id);
  }

  // ─── /battles/:id: detalle (sin payload de IA) ─────────────────────────
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una batalla por id o slug.' })
  @ApiOkResponse({ type: BattleDto })
  @ApiNotFoundResponse({ description: 'Batalla no encontrada' })
  async detail(@Param('id') id: string): Promise<BattleDto> {
    return toDto(await this.service.findOne(id));
  }
}

// Máximo lapso de años permitido en una consulta. Limita la carga: sin esto,
// un rango amplio (o sin filtrar) podría devolver miles de batallas y ralentizar
// el mapa. El frontend nunca pide más de esto; aquí lo validamos por si acaso.
const MAX_YEAR_SPAN = 150;

function parseFilters(q: BattlesQueryDto): BattleFilters {
  const num = (s: string | undefined) => (s !== undefined ? Number(s) : undefined);
  const yearMin = num(q.yearMin);
  const yearMax = num(q.yearMax);
  const minImportance = num(q.minImportance);

  const n = num(q.bboxN);
  const s = num(q.bboxS);
  const e = num(q.bboxE);
  const w = num(q.bboxW);
  const bbox =
    [n, s, e, w].every((v) => v != null && Number.isFinite(v as number))
      ? { north: n!, south: s!, east: e!, west: w! }
      : undefined;

  // El tope de 150 años acota el nº de resultados. Si se filtra por área
  // (bbox), la propia zona los limita: permitimos cualquier rango temporal
  // (búsqueda "en esta zona, todas las épocas").
  if (
    !bbox &&
    Number.isFinite(yearMin) &&
    Number.isFinite(yearMax) &&
    (yearMax as number) - (yearMin as number) > MAX_YEAR_SPAN
  ) {
    throw new BadRequestException(
      `El rango de años no puede superar ${MAX_YEAR_SPAN} años (recibido: ${
        (yearMax as number) - (yearMin as number)
      }).`,
    );
  }
  const type =
    q.type === 'BATTLE' || q.type === 'SIEGE' || q.type === 'CAMPAIGN'
      ? q.type
      : undefined;
  const sort: BattleSort | undefined =
    q.sort === 'year' || q.sort === 'name' || q.sort === 'importance'
      ? q.sort
      : undefined;
  return {
    yearMin: Number.isFinite(yearMin) ? yearMin : undefined,
    yearMax: Number.isFinite(yearMax) ? yearMax : undefined,
    minImportance: Number.isFinite(minImportance) ? minImportance : undefined,
    bbox,
    search: q.search,
    type,
    sort,
  };
}

// Mapea la fila de BD a la DTO de resumen (lista, efemérides, timeline).
function toSummary(b: BattleSummary): BattleSummaryDto {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    year: b.year,
    startYear: b.startYear,
    endYear: b.endYear,
    date: b.date,
    startDate: b.startDate,
    endDate: b.endDate,
    latitude: b.latitude,
    longitude: b.longitude,
    imageUrl: b.imageUrl,
    summary: b.summary,
    type: b.type,
    importanceScore: b.importanceScore,
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toDto(b: BattleWithRelations): BattleDto {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    year: b.year,
    startYear: b.startYear,
    endYear: b.endYear,
    date: b.date,
    startDate: b.startDate,
    endDate: b.endDate,
    latitude: b.latitude,
    longitude: b.longitude,
    imageUrl: b.imageUrl,
    wikipediaUrl: b.wikipediaUrl,
    summary: b.summary,
    type: b.type,
    importanceScore: b.importanceScore,
    hasAiStory: b.aiSummary != null,
  };
}
