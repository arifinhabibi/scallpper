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
  
      // Ambil balance
      const balance = await this.brokerService.getBalance();
      const asset = pair.slice(0, 3); // Misalnya BTC dari BTCUSDT
      const currentPrice = analysis.marketData.price;
  
      // Hitung profit/loss
      const assetBalance = balance[asset.toLowerCase()] || 0; // Misalnya balance.btc
      const buyPrice = balance[`buyPrice${asset}`] || currentPrice; // Harga beli terakhir
      const profitLossPercent = ((currentPrice - buyPrice) / buyPrice) * 100;
  
      // Parsing pair currency
      const baseCurrency = pair.slice(0, 3); // Misalnya BTC
      const quoteCurrency = pair.slice(3); // Misalnya IDR atau USD
  
      // Logika trading baru
      if (profitLossPercent > 3) {
        // Aset untung > 3%
        if (analysis.marketData.signal === 'SELL') {
          this.logger.log(`Selling ${asset} because profit > 3% and signal is SELL.`);
          await this.brokerService.createOrder(pair, 'sell', currentPrice, assetBalance);
        } else {
          this.logger.log(`Holding ${asset} because profit > 3% and signal is ${analysis.marketData.signal}.`);
        }
      } else if (profitLossPercent < -2) {
        // Aset rugi > 2%
        if (analysis.marketData.signal === 'SELL') {
          this.logger.log(`Selling ${asset} because loss > 2% and signal is SELL.`);
          await this.brokerService.createOrder(pair, 'sell', currentPrice, assetBalance);
        } else {
          this.logger.log(`Holding ${asset} because loss > 2% and signal is ${analysis.marketData.signal}.`);
        }
      } else {
        // Stop-loss atau kondisi normal
        if (analysis.marketData.signal === 'BUY') {
          const amount = balance.idr / currentPrice;
          if (amount > 0) {
            // Kurangi 20% dari jumlah pembelian
            const reducedAmount = amount * 0.8;
            this.logger.log(`Executing BUY order for ${pair} with reduced amount ${reducedAmount}`);
            await this.brokerService.createOrder(pair, 'buy', currentPrice, reducedAmount);
          } else {
            this.logger.warn('Insufficient IDR balance to execute BUY order.');
          }
        } else if (analysis.marketData.signal === 'SELL') {
          if (assetBalance > 0) {
            this.logger.log(`Executing SELL order for ${pair} with amount ${assetBalance}`);
            await this.brokerService.createOrder(pair, 'sell', currentPrice, assetBalance);
          } else {
            this.logger.warn('Insufficient BTC balance to execute SELL order.');
          }
        } else {
          this.logger.log('No action taken (HOLD).');
        }
      }
    } catch (error) {
      this.logger.error(`Failed to execute trade: ${error.message}`);
    }
  }
}