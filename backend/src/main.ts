import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('AresCodex API')
    .setDescription(
      'Atlas histórico interactivo de conflictos militares.\n\n' +
        'El endpoint Premium `GET /battles/:id/ai-story` requiere un JWT ' +
        '(Bearer) con tier `premium`. Consíguelo en `POST /auth/dev-token`.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
