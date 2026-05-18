import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScraperCommanderDto {
  @ApiProperty({ description: 'Siempre "commander".', example: 'commander' })
  type!: string;

  @ApiProperty({
    description: 'Nombre completo del comandante.',
    example: 'Francisco Franco',
  })
  name!: string;

  @ApiProperty({
    description: 'URL canónica del artículo de Wikipedia. Clave de upsert.',
  })
  wikipediaUrl!: string;

  @ApiPropertyOptional({ description: 'URL absoluta del retrato principal.' })
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'País o lealtad principal.',
    example: 'España',
  })
  country?: string;

  @ApiPropertyOptional({ description: 'Año de nacimiento.', example: 1892 })
  birthYear?: number;

  @ApiPropertyOptional({ description: 'Año de fallecimiento.', example: 1975 })
  deathYear?: number;

  @ApiPropertyOptional({
    description: 'Breve descripción o extracto del artículo.',
  })
  description?: string;
}
