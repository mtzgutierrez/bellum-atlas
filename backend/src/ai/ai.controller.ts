import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import {
  BattleAIStoryDto,
  BattleAIStoryPendingDto,
} from '../battle/dto/battle.dto';

@ApiTags('IA')
@Controller('battles/:id/ai-story')
export class AiController {
  constructor(private readonly prisma: PrismaService) {}

  // Narrativa por IA, ABIERTA a todos (modelo free + ads). NO se genera a
  // demanda del usuario: si no existe todavía, se devuelve "unavailable". El
  // contenido se pre-genera/actualiza por procesos propios (pregen + job
  // diario), nunca desde esta petición.
  @Get()
  @ApiOperation({ summary: 'Narrativa por IA (solo pre-generada; nunca on-demand).' })
  @ApiOkResponse({ type: BattleAIStoryDto })
  @ApiResponse({ status: HttpStatus.OK, type: BattleAIStoryPendingDto })
  @HttpCode(HttpStatus.OK)
  async aiStory(
    @Param('id') id: string,
  ): Promise<BattleAIStoryDto | BattleAIStoryPendingDto> {
    const battle = await this.prisma.battle.findFirst({
      where: { OR: [{ slug: id }, ...(isUuid(id) ? [{ id }] : [])] },
      select: { id: true, aiSummary: true },
    });
    if (!battle) throw new NotFoundException(`Batalla "${id}" no encontrada`);

    if (battle.aiSummary) {
      const s = battle.aiSummary;
      return {
        summary: s.summary,
        context: s.context,
        outcome: s.outcome,
        curiosities: s.curiosities,
        modelUsed: s.modelUsed,
        generatedAt: s.createdAt,
      };
    }

    // Aún no pre-generada: no se encola nada.
    return { status: 'unavailable' };
  }
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
