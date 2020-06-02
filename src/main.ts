import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorFilter } from './error.filter';
import { LogService } from './@shared/log-shared/log.service';

async function bootstrap() {
  // Load dotev config
  require('dotenv').config();

  // Launch app
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new ErrorFilter(new LogService('arena')));
  await app.listen(process.env.PORT);
}
bootstrap();
