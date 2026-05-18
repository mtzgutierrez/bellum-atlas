import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MediaSource } from '@prisma/client';

export class CreateMediaDto {
  @ApiProperty({ description: 'URL pública del recurso multimedia. Debe ser única.' })
  url: string;

  @ApiPropertyOptional({
    description: 'Origen del recurso.',
    enum: MediaSource,
    default: MediaSource.WIKIMEDIA,
  })
  source?: MediaSource;

  @ApiPropertyOptional({ description: 'Identificador SPDX de licencia, ej: "CC-BY-SA-4.0".' })
  license?: string;

  @ApiPropertyOptional({ description: 'Pie de foto tal como aparece en la fuente original.' })
  caption?: string;

  @ApiPropertyOptional({ description: 'Texto alternativo para accesibilidad (alt).' })
  altText?: string;

  @ApiPropertyOptional({ description: 'Ancho en píxeles de la imagen original.' })
  width?: number;

  @ApiPropertyOptional({ description: 'Alto en píxeles de la imagen original.' })
  height?: number;

  @ApiPropertyOptional({ description: 'Tipo MIME, ej: "image/jpeg", "image/webp".' })
  mimeType?: string;

  @ApiPropertyOptional({
    description: 'Nombre del archivo en Wikimedia Commons, ej: "Battle_of_Stalingrad.jpg".',
  })
  wikiTitle?: string;
}
