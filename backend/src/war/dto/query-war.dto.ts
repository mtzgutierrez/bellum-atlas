import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryWarDto {
  @ApiPropertyOptional({ description: 'Búsqueda por nombre o descripción de guerra.' })
  q?: string;

  @ApiPropertyOptional({ description: 'Número de página.', default: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Ítems por página (máx. 100).', default: 20 })
  limit?: number;
}
