import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Bellum Atlas API')
    .setDescription(
      'Atlas histórico interactivo de conflictos militares.\n\n' +
        'La narrativa por IA (`GET /battles/:id/ai-story`) es abierta a todos: ' +
        'devuelve el contenido pre-generado o `unavailable` si aún no existe.',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
