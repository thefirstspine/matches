import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorFilter } from './error.filter';
import { LogService } from './log/log.service';
import env from './@shared/env-shared/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new ErrorFilter(new LogService()));
  await app.listen(env.dist ? env.config.ARENA_PORT : 2105);
}
bootstrap();
