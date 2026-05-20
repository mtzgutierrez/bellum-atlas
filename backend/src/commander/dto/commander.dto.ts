import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/pagination.dto';

export class CommanderBattleRefDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ nullable: true }) year!: number | null;
  @ApiPropertyOptional({ nullable: true }) side!: string | null;
}

export class CommanderSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ nullable: true }) birthYear!: number | null;
  @ApiPropertyOptional({ nullable: true }) deathYear!: number | null;
  @ApiPropertyOptional({ nullable: true }) imageUrl!: string | null;
}

export class CommanderDto extends CommanderSummaryDto {
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
  @ApiPropertyOptional({ nullable: true }) wikipediaUrl!: string | null;
  @ApiProperty({ type: [CommanderBattleRefDto] }) battles!: CommanderBattleRefDto[];
}

export class PaginatedCommandersDto {
  @ApiProperty({ type: [CommanderSummaryDto] }) data!: CommanderSummaryDto[];
  @ApiProperty({ type: PaginationMetaDto })    meta!: PaginationMetaDto;
}

export class CommandersQueryDto {
  @ApiPropertyOptional() search?: string;
  @ApiPropertyOptional() page?: string;
  @ApiPropertyOptional() pageSize?: string;
}
