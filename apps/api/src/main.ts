import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // El frontend vive en otro proyecto de Vercel, así que necesita CORS.
  // La API es pública y de solo lectura; las escrituras van protegidas por CRON_SECRET.
  app.enableCors();

  await app.listen(env.PORT);
}

void bootstrap();
