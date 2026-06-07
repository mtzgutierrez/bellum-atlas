import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/pagination.dto';

// ─── Punto en el mapa (mínimo posible, ojo a payload size) ─────────────────

/**
 * Representación ligera de una batalla para pintar en el mapa. Sólo lo
 * imprescindible para un marker: coords, tipo, importancia y handle.
 */
export class BattlePointDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() latitude!: number;
  @ApiProperty() longitude!: number;
  @ApiPropertyOptional({ nullable: true }) year!: number | null;
  @ApiPropertyOptional({ nullable: true }) startYear!: number | null;
  @ApiPropertyOptional({ nullable: true }) endYear!: number | null;
  @ApiPropertyOptional({ nullable: true }) date!: string | null;
  @ApiPropertyOptional({ nullable: true }) startDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) endDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) imageUrl!: string | null;
  @ApiProperty() type!: string;
  @ApiProperty() importanceScore!: number;
}

// ─── Card de la sidebar (un pelín más de información, sin payload de IA) ───

export class BattleSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ nullable: true }) year!: number | null;
  @ApiPropertyOptional({ nullable: true }) startYear!: number | null;
  @ApiPropertyOptional({ nullable: true }) endYear!: number | null;
  @ApiPropertyOptional({ nullable: true }) date!: string | null;
  @ApiPropertyOptional({ nullable: true }) startDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) endDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) latitude!: number | null;
  @ApiPropertyOptional({ nullable: true }) longitude!: number | null;
  @ApiPropertyOptional({ nullable: true }) imageUrl!: string | null;
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
  @ApiProperty() type!: string;
  @ApiProperty() importanceScore!: number;
}

// ─── Detalle (sin IA — la IA vive en otro endpoint) ─────────────────────────

export class BattleDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ nullable: true }) year!: number | null;
  @ApiPropertyOptional({ nullable: true }) startYear!: number | null;
  @ApiPropertyOptional({ nullable: true }) endYear!: number | null;
  @ApiPropertyOptional({ nullable: true }) date!: string | null;
  @ApiPropertyOptional({ nullable: true }) startDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) endDate!: string | null;
  @ApiPropertyOptional({ nullable: true }) latitude!: number | null;
  @ApiPropertyOptional({ nullable: true }) longitude!: number | null;
  @ApiPropertyOptional({ nullable: true }) imageUrl!: string | null;
  @ApiPropertyOptional({ nullable: true }) wikipediaUrl!: string | null;
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
  @ApiProperty() type!: string;
  @ApiProperty() importanceScore!: number;
  @ApiProperty() hasAiStory!: boolean; // si BattleAISummary existe ya
}

// ─── Listado paginado ──────────────────────────────────────────────────────

export class PaginatedBattlesDto {
  @ApiProperty({ type: [BattleSummaryDto] }) data!: BattleSummaryDto[];
  @ApiProperty({ type: PaginationMetaDto })  meta!: PaginationMetaDto;
}

// ─── Query params ──────────────────────────────────────────────────────────

export class BattlesQueryDto {
  @ApiPropertyOptional({ description: 'Año mínimo (incluido)' })
  yearMin?: string;

  @ApiPropertyOptional({ description: 'Año máximo (incluido)' })
  yearMax?: string;

  @ApiPropertyOptional({ description: 'Bbox: latitud norte (máx)' })
  bboxN?: string;
  @ApiPropertyOptional({ description: 'Bbox: latitud sur (mín)' })
  bboxS?: string;
  @ApiPropertyOptional({ description: 'Bbox: longitud este (máx)' })
  bboxE?: string;
  @ApiPropertyOptional({ description: 'Bbox: longitud oeste (mín)' })
  bboxW?: string;

  @ApiPropertyOptional({ description: 'Búsqueda por nombre (substring)' })
  search?: string;

  @ApiPropertyOptional({ description: 'Importancia mínima (0-100)' })
  minImportance?: string;

  @ApiPropertyOptional({
    description: 'Tipo: BATTLE | SIEGE | CAMPAIGN',
    enum: ['BATTLE', 'SIEGE', 'CAMPAIGN'],
  })
  type?: string;

  @ApiPropertyOptional({
    description: 'Orden: importance | year | name',
    enum: ['importance', 'year', 'name'],
  })
  sort?: string;

  @ApiPropertyOptional({ description: 'Página' }) page?: string;
  @ApiPropertyOptional({ description: 'Tamaño página' }) pageSize?: string;
}

// ─── IA (respuestas del endpoint Premium) ───────────────────────────────────

export class BattleAIStoryDto {
  @ApiProperty() summary!: string;
  @ApiProperty() context!: string;
  @ApiProperty() outcome!: string;
  @ApiProperty() curiosities!: string;
  @ApiProperty() modelUsed!: string;
  @ApiProperty({ type: Date }) generatedAt!: Date;
}

export class BattleAIStoryPendingDto {
  @ApiProperty({ enum: ['pending', 'unavailable'] })
  status!: 'pending' | 'unavailable';
  @ApiProperty({ description: 'Posición aproximada en cola, si conocida' })
  queuePosition?: number;
}
