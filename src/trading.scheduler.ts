import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TradingService } from './trading/trading.service';

@Injectable()
export class TradingScheduler {
  private readonly logger = new Logger(TradingScheduler.name);

  constructor(private readonly tradingService: TradingService) {}

  @Cron('0 */15 * * * *')
  async handleShortTermAnalysis() {
    try {
      this.logger.log('Memulai analisis pasar...');
      await this.tradingService.executeTrade('BTCUSDT');
      this.logger.log('Analisis selesai.');
    } catch (error) {
      this.logger.error(`Gagal menjalankan analisis: ${error.message}`);
    }
  }
}