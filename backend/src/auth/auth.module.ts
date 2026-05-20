import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthMiddleware } from './auth.middleware';
import { AuthService } from './auth.service';
import { PremiumGuard } from './premium.guard';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-insecure-change-me',
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRATION') ?? '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PremiumGuard],
  exports: [AuthService, PremiumGuard, JwtModule],
})
export class AuthModule implements NestModule {
  // Se aplica a todas las rutas para que cualquier endpoint pueda leer
  // req.auth si está presente. No bloquea nada por sí solo.
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
