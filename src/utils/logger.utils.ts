import { Injectable } from '@nestjs/common';

@Injectable()
export class DailyFileLogger {
  log(message: string) {
    console.log(`[LOG] ${new Date().toISOString()} - ${message}`);
  }

  error(message: string) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
  }
}