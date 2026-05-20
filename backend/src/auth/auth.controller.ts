import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import { AuthService } from './auth.service';
import type { UserTier } from './auth.types';

// Endpoint de "login" de desarrollo: firma un token con el tier pedido sin
// validar nada. Sólo se activa cuando NODE_ENV=development. En producción
// este controller no debe servir nada hasta que conectemos un IdP / Stripe.
class DevLoginDto {
  @ApiProperty({ example: 'demo@local' })
  email?: string;
  @ApiProperty({ enum: ['free', 'premium'], example: 'premium' })
  tier!: UserTier;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('dev-token')
  @ApiOperation({
    summary: 'Solo dev: emite un JWT con el tier pedido (free|premium).',
  })
  devToken(@Body() body: DevLoginDto): { token: string; tier: UserTier } {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('Endpoint deshabilitado en producción.');
    }
    if (body.tier !== 'free' && body.tier !== 'premium') {
      throw new BadRequestException('tier debe ser "free" o "premium"');
    }
    const userId = body.email ?? `dev-${randomUUID()}`;
    return {
      token: this.auth.signDevToken({
        userId,
        email: body.email,
        tier: body.tier,
      }),
      tier: body.tier,
    };
  }
}
