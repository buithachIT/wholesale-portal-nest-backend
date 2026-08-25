import { LoggerService } from '@nestjs/common';
export class MyLogger implements LoggerService {
  log(message: string) {
    console.log(message);
  }
  error(message: string) {
    console.error(message);
  }
  warn(message: string) {
    console.warn(message);
  }
}
