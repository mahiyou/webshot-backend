import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    allowedHeaders: ['content-type'],
    origin: '*',
    credentials: true,
  });
  // app.use('/public', express.static(join(__dirname, '..', 'public')));
  await app.listen(3001);
}
bootstrap();
