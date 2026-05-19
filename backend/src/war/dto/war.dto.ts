import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/pagination.dto';

// ─── DTOs auxiliares ───────────────────────────────────────────────────────

export class WarBattleRefDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  slug!: string;
  @ApiPropertyOptional({ nullable: true, type: Date })
  date!: Date | null;
  @ApiPropertyOptional({ nullable: true, type: Date })
  dateStart!: Date | null;
  @ApiPropertyOptional({ nullable: true, type: Date })
  dateEnd!: Date | null;
}

export class WarCommanderRefDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  slug!: string;
}

export class WarFactionDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  slug!: string;
  @ApiPropertyOptional({ nullable: true })
  flagUrl!: string | null;
  @ApiPropertyOptional({ nullable: true })
  side!: number | null;
  @ApiPropertyOptional({ nullable: true })
  outcome!: string | null;
  @ApiPropertyOptional({ nullable: true })
  strength!: number | null;
  @ApiPropertyOptional({ nullable: true })
  deaths!: number | null;
  @ApiPropertyOptional({ nullable: true })
  injured!: number | null;
}

// ─── Detalle completo ──────────────────────────────────────────────────────

/**
 * Detalle completo de una guerra: datos enriquecidos + batallas, facciones
 * (con sus fuerzas/bajas) y comandantes que participaron.
 */
export class WarDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  slug!: string;
  @ApiPropertyOptional({ nullable: true })
  description!: string | null;
  @ApiPropertyOptional({ nullable: true })
  summary!: string | null;
  @ApiPropertyOptional({ nullable: true, type: Date })
  dateStart!: Date | null;
  @ApiPropertyOptional({ nullable: true, type: Date })
  dateEnd!: Date | null;
  @ApiProperty({ type: [String] })
  locations!: string[];
  @ApiPropertyOptional({ nullable: true })
  deaths!: number | null;
  @ApiPropertyOptional({ nullable: true })
  imageUrl!: string | null;
  @ApiPropertyOptional({ nullable: true })
  wikipediaUrl!: string | null;

  @ApiProperty({ type: [WarBattleRefDto] })
  battles!: WarBattleRefDto[];
  @ApiProperty({ type: [WarFactionDto] })
  factions!: WarFactionDto[];
  @ApiProperty({ type: [WarCommanderRefDto] })
  commanders!: WarCommanderRefDto[];
}

// ─── Listado simplificado ──────────────────────────────────────────────────

export class SimplifiedWarDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  slug!: string;
  @ApiPropertyOptional({ nullable: true, type: Date })
  dateStart!: Date | null;
  @ApiPropertyOptional({ nullable: true, type: Date })
  dateEnd!: Date | null;
  @ApiPropertyOptional({ nullable: true })
  imageUrl!: string | null;
  @ApiPropertyOptional({ nullable: true })
  wikipediaUrl!: string | null;
}

export class PaginatedWarsDto {
  @ApiProperty({ type: [SimplifiedWarDto] })
  data!: SimplifiedWarDto[];
  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

// ─── Inputs ────────────────────────────────────────────────────────────────

export class GetWarsByTimePeriodDto {
  @ApiProperty({ type: Date })
  startDate!: Date;
  @ApiProperty({ type: Date })
  endDate!: Date;
}
