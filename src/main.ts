import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  // app.use('/public', express.static(join(__dirname, '..', 'public')));
  await app.listen(3001);
}
bootstrap();
