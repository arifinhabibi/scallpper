import { Injectable } from '@nestjs/common';
import { BinanceService } from './binance.service';
import { IndodaxService } from './indodax.service';

@Injectable()
export class MarketDataService {
  constructor(
    private readonly binanceService: BinanceService,
    private readonly indodaxService: IndodaxService,
  ) {}

  async getMarketData(pair: string) {
    const binanceData = await this.binanceService.getHistoricalData(pair);
    const indodaxData = await this.indodaxService.getMarketData(pair);
    return { binance: binanceData, indodax: indodaxData };
  }
}