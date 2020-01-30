import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ErrorFilter } from './error.filter';
import env from './@shared/env-shared/env';
import { LogService } from './@shared/log-shared/log.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new ErrorFilter(new LogService('arena')));
  await app.listen(env.dist ? env.config.PORT : 2105);
}
bootstrap();
