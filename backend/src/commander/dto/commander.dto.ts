import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/pagination.dto';

// ─── DTOs auxiliares ───────────────────────────────────────────────────────

export class CommanderRankDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiPropertyOptional({ nullable: true })
  wikidataId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: Date })
  dateStart!: Date | null;
  @ApiPropertyOptional({ nullable: true, type: Date })
  dateEnd!: Date | null;
}

export class CommanderWarRefDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  slug!: string;
}

export class CommanderBattleRefDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  slug!: string;
  @ApiPropertyOptional({ nullable: true, type: Date })
  date!: Date | null;
  @ApiPropertyOptional({ nullable: true })
  factionName!: string | null;
}

// ─── Detalle completo ──────────────────────────────────────────────────────

/**
 * Detalle completo de un comandante: biografía, aliases, rangos militares,
 * guerras en las que participó (P607) y batallas concretas en las que comandó.
 */
export class CommanderDto {
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
  @ApiProperty({ type: [String] })
  aliases!: string[];
  @ApiPropertyOptional({ nullable: true, type: Date })
  birthDate!: Date | null;
  @ApiPropertyOptional({ nullable: true })
  birthPlace!: string | null;
  @ApiPropertyOptional({ nullable: true, type: Date })
  deathDate!: Date | null;
  @ApiPropertyOptional({ nullable: true })
  deathPlace!: string | null;
  @ApiPropertyOptional({ nullable: true })
  causeOfDeath!: string | null;
  @ApiPropertyOptional({ nullable: true })
  nationality!: string | null;
  @ApiPropertyOptional({ nullable: true })
  imageUrl!: string | null;
  @ApiPropertyOptional({ nullable: true })
  wikipediaUrl!: string | null;

  @ApiProperty({ type: [CommanderRankDto] })
  ranks!: CommanderRankDto[];
  @ApiProperty({ type: [CommanderWarRefDto] })
  wars!: CommanderWarRefDto[];
  @ApiProperty({ type: [CommanderBattleRefDto] })
  battles!: CommanderBattleRefDto[];
}

// ─── Listado simplificado ──────────────────────────────────────────────────

export class SimplifiedCommanderDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  slug!: string;
  @ApiPropertyOptional({ nullable: true, type: Date })
  birthDate!: Date | null;
  @ApiPropertyOptional({ nullable: true, type: Date })
  deathDate!: Date | null;
  @ApiPropertyOptional({ nullable: true })
  nationality!: string | null;
  @ApiPropertyOptional({ nullable: true })
  imageUrl!: string | null;
  @ApiPropertyOptional({ nullable: true })
  wikipediaUrl!: string | null;
}

export class PaginatedCommandersDto {
  @ApiProperty({ type: [SimplifiedCommanderDto] })
  data!: SimplifiedCommanderDto[];
  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

// ─── Inputs ────────────────────────────────────────────────────────────────

export class GetCommandersByYearsDto {
  @ApiProperty({
    description: 'Año inicial. Se devuelven comandantes vivos en ese año o después.',
  })
  startYear!: number;
  @ApiProperty({
    description: 'Año final. Se devuelven comandantes nacidos en ese año o antes.',
  })
  endYear!: number;
}
