import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthMiddleware } from './auth.middleware';
import { AuthService } from './auth.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-insecure-change-me',
        // expiresIn acepta string tipo "7d"; el tipado de jsonwebtoken lo
        // modela como union estrecha (ms.StringValue|number), de ahí el cast.
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRATION') ??
            '7d') as `${number}d`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule implements NestModule {
  // Se aplica a todas las rutas para que cualquier endpoint pueda leer
  // req.auth si está presente. No bloquea nada por sí solo.
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
