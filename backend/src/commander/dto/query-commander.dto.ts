import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryCommanderDto {
  @ApiPropertyOptional({ description: 'Búsqueda por nombre de comandante.' })
  q?: string;

  @ApiPropertyOptional({ description: 'Número de página.', default: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Ítems por página (máx. 100).', default: 20 })
  limit?: number;
}
