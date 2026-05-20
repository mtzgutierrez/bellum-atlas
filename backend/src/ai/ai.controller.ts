import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PremiumGuard } from '../auth/premium.guard';
import { PrismaService } from '../prisma/prisma.service';
import {
  BattleAIStoryDto,
  BattleAIStoryPendingDto,
} from '../battle/dto/battle.dto';
import { AiQueueService } from './ai-queue.service';

@ApiTags('IA')
@Controller('battles/:id/ai-story')
@UseGuards(PremiumGuard)
export class AiController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: AiQueueService,
  ) {}

  // Endpoint Premium. Si la historia existe → 200 con el contenido.
  // Si no existe → 202 + encola y devuelve "pending" para que el front
  // muestre estado de generación. NUNCA llama al LLM en línea.
  @Get()
  @ApiOperation({
    summary: 'Historia narrativa generada por IA (cache permanente).',
  })
  @ApiOkResponse({ type: BattleAIStoryDto })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    type: BattleAIStoryPendingDto,
    description: 'Generación en curso',
  })
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

    await this.queue.enqueue({
      battleId: battle.id,
      reason: 'on-demand-request',
    });
    const position = await this.queue.queuePosition(battle.id);
    return { status: 'pending', queuePosition: position };
  }
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
