import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { REDIS } from '@/redis/redis.tokens';
import { RedisIoAdapter } from '@/realtime/redis-io.adapter';
import type Redis from 'ioredis';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const redis = app.get<Redis>(REDIS);
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  const ioAdapter = new RedisIoAdapter(app, pubClient, subClient);
  await ioAdapter.connect();
  app.useWebSocketAdapter(ioAdapter);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`HydroRage API :${port} · WS /realtime · Bull Board /api/admin/queues`);
}
bootstrap();
