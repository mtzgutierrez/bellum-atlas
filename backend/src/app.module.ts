import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { BattleModule } from './battle/battle.module';
import { HealthController } from './health/health.controller';
import { IngestionModule } from './ingestion/ingestion.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '.env'),
    }),
    // Rate limiting (regla 4.3). El límite global es generoso para el Free
    // Tier (listados, puntos del mapa). El endpoint Premium de IA lo endurece
    // localmente con @Throttle(...) en su propio controller.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    BattleModule,
    AiModule,
    IngestionModule,
  ],
  controllers: [HealthController],
  providers: [
    // Throttling global. Cada ruta usa el throttler "default" salvo que se
    // anote explícitamente otro.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
