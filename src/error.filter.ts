import { ExceptionFilter, Catch, HttpException, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { LogService } from './log/log.service';

@Catch()
export class ErrorFilter implements ExceptionFilter {
  constructor(
    private readonly logService: LogService,
  ) {}

  catch(error: Error, host: ArgumentsHost) {
    const status = (error instanceof HttpException) ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    this.logService.error(
      `Global error with status ${status}`, {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
  }
}
