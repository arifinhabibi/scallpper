import { Injectable, Logger } from '@nestjs/common';
import { BrokerService } from '../broker/broker.service';
import { AnalysisService } from '../analysis/analysis.service';

@Injectable()
export class TradingService {
  private readonly logger = new Logger(TradingService.name);

  constructor(
    private readonly brokerService: BrokerService,
    private readonly analysisService: AnalysisService,
  ) {}

  async executeTrade(pair: string) {
    try {
      const analysis = await this.analysisService.analyze(pair);

      // Validasi struktur data
      if (!analysis || !analysis.marketData || !['BUY', 'SELL', 'HOLD'].includes(analysis.marketData.signal)) {
        this.logger.error('Invalid analysis data or missing signal.');
        return;
      }

      // Log hasil analisis
      this.logger.log(`Signal received: ${analysis.marketData.signal}`);

      // Eksekusi trading berdasarkan sinyal
      if (analysis.marketData.signal === 'BUY') {
        const balance = await this.brokerService.getBalance();
        const amount = balance.idr / analysis.marketData.price;

        if (amount > 0) {
          this.logger.log(`Executing BUY order for ${pair} with amount ${amount}`);
          await this.brokerService.createOrder(pair, 'buy', analysis.marketData.price, amount);
        } else {
          this.logger.warn('Insufficient IDR balance to execute BUY order.');
        }
      } else if (analysis.marketData.signal === 'SELL') {
        const balance = await this.brokerService.getBalance();

        if (balance.btc > 0) {
          this.logger.log(`Executing SELL order for ${pair} with amount ${balance.btc}`);
          await this.brokerService.createOrder(pair, 'sell', analysis.marketData.price, balance.btc);
        } else {
          this.logger.warn('Insufficient BTC balance to execute SELL order.');
        }
      } else {
        this.logger.log('No action taken (HOLD).');
      }
    } catch (error) {
      this.logger.error(`Failed to execute trade: ${error.message}`);
    }
  }
}