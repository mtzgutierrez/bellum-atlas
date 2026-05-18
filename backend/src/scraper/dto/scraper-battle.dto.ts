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

/** Payload enviado por el scraper para crear o actualizar una batalla. */
export class ScraperBattleDto {
  @ApiProperty({ description: 'Siempre "battle" en MVP.', example: 'battle' })
  type!: string;

  @ApiProperty({
    description: 'Nombre de la batalla extraído del <h1>.',
    example: 'Battle of Waterloo',
  })
  title!: string;

  @ApiProperty({
    description: 'URL canónica del artículo de Wikipedia. Clave de upsert.',
    example: 'https://en.wikipedia.org/wiki/Battle_of_Waterloo',
  })
  wikipediaUrl!: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen principal de la infobox.',
  })
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Fecha raw (ej: "18 de junio de 1815").',
    example: '18 June 1815',
  })
  dateText?: string;

  @ApiPropertyOptional({
    description: 'Fecha en ISO 8601 tras normalización.',
    example: '1815-06-18',
  })
  date?: string;

  @ApiPropertyOptional({
    description: 'Lugar raw (ej: "Waterloo, Bélgica").',
    example: 'Waterloo, Belgium',
  })
  place?: string;

  @ApiPropertyOptional({
    description: 'Coordenadas en WGS84 decimal.',
    type: CoordinatesDto,
  })
  coordinates?: CoordinatesDto;

  @ApiPropertyOptional({
    description: 'Resultado raw (ej: "Victoria de la Séptima Coalición").',
  })
  result?: string;

  @ApiPropertyOptional({
    description: 'Beligerantes por bando, separados por "|".',
    type: SidesPairDto,
  })
  belligerents?: SidesPairDto;

  @ApiPropertyOptional({
    description: 'Nombres de comandantes por bando, separados por "|".',
    type: SidesPairDto,
  })
  commanders?: SidesPairDto;

  @ApiPropertyOptional({
    description: 'Efectivos por bando (texto raw).',
    type: SidesPairDto,
  })
  strength?: SidesPairDto;

  @ApiPropertyOptional({
    description: 'Bajas por bando (texto raw).',
    type: SidesPairDto,
  })
  casualties?: SidesPairDto;
}
