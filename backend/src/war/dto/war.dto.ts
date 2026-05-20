import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/pagination.dto';

export class WarBattleRefDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ nullable: true }) year!: number | null;
  @ApiPropertyOptional({ nullable: true }) latitude!: number | null;
  @ApiPropertyOptional({ nullable: true }) longitude!: number | null;
}

export class WarSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional({ nullable: true }) startYear!: number | null;
  @ApiPropertyOptional({ nullable: true }) endYear!: number | null;
  @ApiPropertyOptional({ nullable: true }) imageUrl!: string | null;
  @ApiPropertyOptional({ nullable: true }) region!: string | null;
}

export class WarDto extends WarSummaryDto {
  @ApiPropertyOptional({ nullable: true }) summary!: string | null;
  @ApiPropertyOptional({ nullable: true }) wikipediaUrl!: string | null;
  @ApiProperty({ type: [WarBattleRefDto] }) battles!: WarBattleRefDto[];
}

export class PaginatedWarsDto {
  @ApiProperty({ type: [WarSummaryDto] }) data!: WarSummaryDto[];
  @ApiProperty({ type: PaginationMetaDto })  meta!: PaginationMetaDto;
}

export class WarsQueryDto {
  @ApiPropertyOptional() search?: string;
  @ApiPropertyOptional() yearMin?: string;
  @ApiPropertyOptional() yearMax?: string;
  @ApiPropertyOptional() page?: string;
  @ApiPropertyOptional() pageSize?: string;
}
