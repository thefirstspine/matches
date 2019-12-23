import { Injectable } from '@nestjs/common';

@Injectable()
export class LogService {

  private static readonly LOG_LEVEL__INFO: string = 'info';
  private static readonly LOG_LEVEL__WARNING: string = 'warning';
  private static readonly LOG_LEVEL__ERROR: string = 'error';

  private readonly directory: string = 'logs';
  protected logger: any;

  constructor() {
    const winston = require('winston');
    this.logger = winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((i: any) => `${i.timestamp}\t${i.level}\t${i.message}`),
      ),
      transports: [
        new winston.transports.File({ filename: '/var/log/arena-error.log', level: 'error' }),
        new winston.transports.File({ filename: '/var/log/arena-warning.log', level: 'warning' }),
        new winston.transports.File({ filename: '/var/log/arena-info.log', level: 'info' }),
        new winston.transports.File({ filename: '/var/log/arena-combined.log' }),
        new winston.transports.Console(),
      ],
      exceptionHandlers: [
        new winston.transports.File({ filename: '/var/log/arena-exceptions.log' }),
      ],
    });
  }

  info(message: string, data?: any): void {
    this.log(LogService.LOG_LEVEL__INFO, message, data);
  }

  warning(message: string, data?: any): void {
    this.log(LogService.LOG_LEVEL__ERROR, message, data);
  }

  error(message: string, data?: any): void {
    this.log(LogService.LOG_LEVEL__ERROR, message, data);
  }

  protected log(level: string, message: string, data?: any): void {
    this.logger.log(level, JSON.stringify({
      message,
      data,
    }));
  }
}
