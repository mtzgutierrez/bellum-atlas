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
import { BattleFilters, BattleWithRelations } from './battle.repository';
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
        latitude: b.latitude as number,
        longitude: b.longitude as number,
        type: b.type,
        importanceScore: b.importanceScore,
      }));
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
      data: result.data.map(
        (b): BattleSummaryDto => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          year: b.year,
          startYear: b.startYear,
          endYear: b.endYear,
          latitude: b.latitude,
          longitude: b.longitude,
          imageUrl: b.imageUrl,
          type: b.type,
          importanceScore: b.importanceScore,
        }),
      ),
      meta: result.meta,
    };
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

  if (
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
  const n = num(q.bboxN);
  const s = num(q.bboxS);
  const e = num(q.bboxE);
  const w = num(q.bboxW);
  const bbox =
    [n, s, e, w].every((v) => v != null && Number.isFinite(v as number))
      ? { north: n!, south: s!, east: e!, west: w! }
      : undefined;
  return {
    yearMin: Number.isFinite(yearMin) ? yearMin : undefined,
    yearMax: Number.isFinite(yearMax) ? yearMax : undefined,
    minImportance: Number.isFinite(minImportance) ? minImportance : undefined,
    bbox,
    search: q.search,
  };
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
