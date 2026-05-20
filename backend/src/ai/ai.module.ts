import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AiController } from './ai.controller';
import { AiProcessor } from './ai.processor';
import { AiQueueService } from './ai-queue.service';
import { AI_QUEUE_NAME } from './ai.types';
import { LlmService } from './llm.service';

// La conexión a Redis se configura una sola vez aquí (forRootAsync) y luego
// se reutiliza para registrar la cola concreta `ai-generation`.
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') ?? 'localhost',
          port: Number(config.get<string>('REDIS_PORT') ?? 6379),
        },
      }),
    }),
    BullModule.registerQueue({ name: AI_QUEUE_NAME }),
  ],
  controllers: [AiController],
  providers: [LlmService, AiQueueService, AiProcessor],
  exports: [AiQueueService, LlmService],
})
export class AiModule {}
