import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class WarSidesPairDto {
  @ApiPropertyOptional()
  side1?: string;

  @ApiPropertyOptional()
  side2?: string;
}

class WarCoordinatesDto {
  @ApiProperty()
  lat!: number;

  @ApiProperty()
  lon!: number;
}

export class ScraperWarDto {
  @ApiProperty({ description: 'Siempre "war".', example: 'war' })
  type!: string;

  @ApiProperty({ description: 'Nombre de la guerra extraído del <h1>.', example: 'Guerra Civil Española' })
  title!: string;

  @ApiProperty({ description: 'URL canónica del artículo de Wikipedia. Clave de upsert.' })
  wikipediaUrl!: string;

  @ApiPropertyOptional({ description: 'URL absoluta de la imagen principal de la infobox.' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Rango de fechas raw (ej: "1936–1939").', example: '1936–1939' })
  dateText?: string;

  @ApiPropertyOptional({ description: 'Fecha de inicio en ISO 8601.', example: '1936-07-17' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin en ISO 8601.', example: '1939-04-01' })
  endDate?: string;

  @ApiPropertyOptional({ description: 'Lugar raw (ej: "España").', example: 'España' })
  place?: string;

  @ApiPropertyOptional({ description: 'Coordenadas WGS84 decimal.', type: WarCoordinatesDto })
  coordinates?: WarCoordinatesDto;

  @ApiPropertyOptional({ description: 'Resultado raw.' })
  result?: string;

  @ApiPropertyOptional({ description: 'Descripción o resumen del conflicto.' })
  description?: string;

  @ApiPropertyOptional({ description: 'Beligerantes por bando.', type: WarSidesPairDto })
  belligerents?: WarSidesPairDto;

  @ApiPropertyOptional({ description: 'Comandantes por bando.', type: WarSidesPairDto })
  commanders?: WarSidesPairDto;

  @ApiPropertyOptional({ description: 'Bajas por bando.', type: WarSidesPairDto })
  casualties?: WarSidesPairDto;
}
