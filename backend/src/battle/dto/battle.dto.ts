import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/pagination.dto';

// ─── DTOs auxiliares ────────────────────────────────────────────────────────

export class BattleWarRefDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  slug!: string;
}

export class BattleCommanderRefDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  name!: string;
  @ApiProperty()
  slug!: string;
}

export class BattleFactionDto {
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
  strength!: string | null;
  @ApiPropertyOptional({ nullable: true })
  deaths!: string | null;
  @ApiPropertyOptional({ nullable: true })
  injured!: string | null;
  @ApiProperty({ type: [BattleCommanderRefDto] })
  commanders!: BattleCommanderRefDto[];
}

export class BattleMediaDto {
  @ApiProperty()
  id!: string;
  @ApiProperty()
  url!: string;
  @ApiProperty()
  type!: string;
  @ApiPropertyOptional({ nullable: true })
  caption!: string | null;
}

// ─── Detalle completo ──────────────────────────────────────────────────────

/**
 * Todos los datos que se devuelven de una batalla, incluyendo guerras,
 * facciones (con sus comandantes) y medios.
 */
export class BattleDto {
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
  date!: Date | null;
  @ApiPropertyOptional({ nullable: true, type: Date })
  dateStart!: Date | null;
  @ApiPropertyOptional({ nullable: true, type: Date })
  dateEnd!: Date | null;
  @ApiPropertyOptional({ nullable: true })
  locationName!: string | null;
  @ApiPropertyOptional({ nullable: true })
  country!: string | null;
  @ApiPropertyOptional({ nullable: true })
  latitude!: number | null;
  @ApiPropertyOptional({ nullable: true })
  longitude!: number | null;
  @ApiPropertyOptional({ nullable: true })
  deaths!: number | null;
  @ApiPropertyOptional({ nullable: true })
  casualties!: number | null;
  @ApiPropertyOptional({ nullable: true })
  imageUrl!: string | null;
  @ApiPropertyOptional({ nullable: true })
  mapImageUrl!: string | null;
  @ApiPropertyOptional({ nullable: true })
  wikipediaUrl!: string | null;
  @ApiPropertyOptional({ nullable: true })
  type!: string | null;

  @ApiProperty({ type: [BattleWarRefDto] })
  wars!: BattleWarRefDto[];
  @ApiProperty({ type: [BattleFactionDto] })
  factions!: BattleFactionDto[];
  @ApiProperty({ type: [BattleMediaDto] })
  media!: BattleMediaDto[];
}

// ─── Listado simplificado ──────────────────────────────────────────────────

/**
 * Datos simplificados de una batalla, para listados y vistas previas.
 * Incluye `lat`/`lng` y `type` para que el mapa pueda pintar los pines
 * y la card pueda mostrar el icono de tipo sin pedir el detalle.
 */
export class SimplifiedBattleDto {
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
  @ApiPropertyOptional({ nullable: true })
  locationName!: string | null;
  @ApiPropertyOptional({ nullable: true })
  country!: string | null;
  @ApiPropertyOptional({ nullable: true })
  latitude!: number | null;
  @ApiPropertyOptional({ nullable: true })
  longitude!: number | null;
  @ApiPropertyOptional({ nullable: true })
  type!: string | null;
  @ApiPropertyOptional({ nullable: true })
  imageUrl!: string | null;
  @ApiPropertyOptional({ nullable: true })
  wikipediaUrl!: string | null;
}

// ─── Inputs ────────────────────────────────────────────────────────────────

export class PaginatedBattlesDto {
  @ApiProperty({ type: [SimplifiedBattleDto] })
  data!: SimplifiedBattleDto[];
  @ApiProperty({ type: PaginationMetaDto })
  meta!: PaginationMetaDto;
}

export class GetBattlesByCoordinatesDto {
  @ApiProperty({ description: 'Latitud del centro de búsqueda (WGS84)' })
  latitude!: number;
  @ApiProperty({ description: 'Longitud del centro de búsqueda (WGS84)' })
  longitude!: number;
  @ApiProperty({ description: 'Radio en kilómetros' })
  radius!: number;
}

export class GetBattlesByTimePeriodDto {
  @ApiProperty({ type: Date })
  startDate!: Date;
  @ApiProperty({ type: Date })
  endDate!: Date;
}
