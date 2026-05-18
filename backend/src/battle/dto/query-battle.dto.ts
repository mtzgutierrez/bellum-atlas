import { ApiPropertyOptional } from '@nestjs/swagger';
import { BattleType } from '@prisma/client';

export class QueryBattleDto {
  @ApiPropertyOptional({ description: 'Búsqueda full-text: nombre, guerra o lugar.' })
  q?: string;

  @ApiPropertyOptional({ description: 'Slug de HistoricalEra (ej: "ancient", "medieval").' })
  era?: string;

  @ApiPropertyOptional({
    description: 'Resultado de la batalla.',
    enum: ['victory', 'defeat', 'draw', 'inconclusive'],
  })
  result?: string;

  @ApiPropertyOptional({ description: 'Tipo de batalla.', enum: BattleType })
  type?: BattleType;

  @ApiPropertyOptional({ description: 'País involucrado (busca en location.country).' })
  country?: string;

  @ApiPropertyOptional({ description: 'Número de página.', default: 1 })
  page?: number;

  @ApiPropertyOptional({ description: 'Ítems por página (máx. 100).', default: 20 })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Campo de ordenación.',
    enum: ['date', 'name'],
    default: 'date',
  })
  sortBy?: 'date' | 'name';
}
