import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SidesPairDto {
  @ApiPropertyOptional()
  side1?: string;

  @ApiPropertyOptional()
  side2?: string;
}

class CoordinatesDto {
  @ApiProperty()
  lat?: number;

  @ApiProperty()
  lon?: number;
}

/** Bajas de un bando con valores numéricos normalizados. */
class CasualtiesSideDto {
  @ApiPropertyOptional({ description: 'Texto raw extraído de la infobox.' })
  raw?: string;

  @ApiPropertyOptional({ description: 'Bajas mínimas (extremo inferior del rango).', example: 40000 })
  min?: number;

  @ApiPropertyOptional({ description: 'Bajas máximas (extremo superior del rango).', example: 45000 })
  max?: number;
}

class CasualtiesDto {
  @ApiPropertyOptional({ type: CasualtiesSideDto })
  side1?: CasualtiesSideDto;

  @ApiPropertyOptional({ type: CasualtiesSideDto })
  side2?: CasualtiesSideDto;
}

/** Payload enviado por el scraper para crear o actualizar una batalla. */
export class ScraperBattleDto {
  @ApiProperty({ description: 'Siempre "battle" en MVP.', example: 'battle' })
  type!: string;

  @ApiProperty({ description: 'Nombre de la batalla extraído del <h1>.', example: 'Battle of Waterloo' })
  title!: string;

  @ApiProperty({ description: 'URL canónica del artículo de Wikipedia. Clave de upsert.' })
  wikipediaUrl!: string;

  @ApiPropertyOptional({ description: 'URL absoluta de la imagen principal de la infobox.' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Fecha raw (ej: "18 de junio de 1815").', example: '18 June 1815' })
  dateText?: string;

  @ApiPropertyOptional({ description: 'Fecha en ISO 8601 normalizada por el pipeline.', example: '1815-06-18' })
  date?: string;

  @ApiPropertyOptional({ description: 'Lugar raw.', example: 'Waterloo, Belgium' })
  place?: string;

  @ApiPropertyOptional({ description: 'Coordenadas WGS84 decimal (normalizadas por el pipeline).', type: CoordinatesDto })
  coordinates?: CoordinatesDto;

  @ApiPropertyOptional({ description: 'Resultado raw.' })
  result?: string;

  @ApiPropertyOptional({ description: 'Beligerantes por bando.', type: SidesPairDto })
  belligerents?: SidesPairDto;

  @ApiPropertyOptional({ description: 'Comandantes por bando.', type: SidesPairDto })
  commanders?: SidesPairDto;

  @ApiPropertyOptional({ description: 'Efectivos por bando (texto raw).', type: SidesPairDto })
  strength?: SidesPairDto;

  @ApiPropertyOptional({ description: 'Bajas normalizadas por bando.', type: CasualtiesDto })
  casualties?: CasualtiesDto;
}
