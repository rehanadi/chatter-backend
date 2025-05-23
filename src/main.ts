import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from "@nestjs/common";
import { Logger } from "nestjs-pino";
import * as cookieParser from 'cookie-parser';
import { ConfigService } from "@nestjs/config";
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useGlobalPipes(new ValidationPipe());
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.enableCors();
  app.setGlobalPrefix('/api');

  const configService = app.get(ConfigService);
  await app.listen(configService.getOrThrow('PORT'));
}
bootstrap();
