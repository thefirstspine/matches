import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorFilter } from './error.filter';
import { LogsService } from '@thefirstspine/logs-nest';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Load dotev config
  require('dotenv').config();

  // Launch app
  const app = await NestFactory.create(AppModule.register());
  app.enableCors();
  app.useGlobalFilters(new ErrorFilter(new LogsService()));
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT);
}
bootstrap();
