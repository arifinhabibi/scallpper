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
      // Dapatkan hasil analisis dari AnalysisService
      const analysis = await this.analysisService.analyze(pair);

      // Validasi struktur data hasil analisis
      if (
        !analysis ||
        typeof analysis !== 'object' ||
        !['BUY', 'SELL', 'HOLD'].includes(analysis.signal) ||
        !['positif', 'negative'].includes(analysis.sentiment) ||
        typeof analysis.score_signal !== 'number' ||
        analysis.score_signal < 1 ||
        analysis.score_signal > 100
      ) {
        this.logger.error('Invalid analysis data or missing required fields.');
        return;
      }

      // Log hasil analisis
      this.logger.log(
        `Signal received: ${analysis.signal}, Sentiment: ${analysis.sentiment}, Score: ${analysis.score_signal}`,
      );

      // Periksa order terbaru
      const latestOrderId = await this.brokerService.getLatestOrderId(pair);
      if (latestOrderId) {
        this.logger.log(`Latest order ID: ${latestOrderId}`);
        const orderStatus = await this.brokerService.getOrder(latestOrderId, pair);

        // Jika order belum berhasil, batalkan order
        if (orderStatus.status !== 'filled') {
          this.logger.warn(`Order ${latestOrderId} not filled. Attempting to cancel...`);
          await this.brokerService.cancelOrder(latestOrderId, pair, orderStatus.type);
        }
      }

      // Periksa saldo aset
      const balance = await this.brokerService.getBalance();
      const marketPrice = await this.brokerService.getPriceBTCIndodax(); // Ambil harga pasar terkini
      const currentPrice = marketPrice.data.last;

      // Hitung profit/loss jika ada aset BTC
      let profitLossPercentage = 0;
      if (balance.btc > 0) {
        const buyPrice = await this.brokerService.getBuyPrice(pair); // Ambil harga beli terakhir
        profitLossPercentage = ((currentPrice - buyPrice) / buyPrice) * 100;
      }

      // Eksekusi trading berdasarkan sinyal
      if (analysis.signal === 'BUY') {
        // Jika saldo IDR cukup, beli BTC
        if (balance.idr > 0) {
          const amount = balance.idr / currentPrice || 0;
          if (amount > 0) {
            this.logger.log(`Executing BUY order for ${pair} with amount ${amount}`);
            await this.brokerService.createOrder(pair, 'buy', currentPrice, amount);
          } else {
            this.logger.warn('Insufficient IDR balance to execute BUY order.');
          }
        } else {
          this.logger.warn('No IDR balance available for BUY order.');
        }
      } else if (analysis.signal === 'SELL') {
        // Jika ada BTC dan rugi > 3%, jual
        if (balance.btc > 0 && profitLossPercentage < -3) {
          this.logger.log(`Executing SELL order due to loss > 3%. Profit/Loss: ${profitLossPercentage}%`);
          await this.brokerService.createOrder(pair, 'sell', currentPrice, balance.btc);
        }
        // Jika profit > 2%, jual
        else if (balance.btc > 0 && profitLossPercentage > 2) {
          this.logger.log(`Executing SELL order due to profit > 2%. Profit/Loss: ${profitLossPercentage}%`);
          await this.brokerService.createOrder(pair, 'sell', currentPrice, balance.btc);
        } else {
          this.logger.log('No action taken (HOLD).');
        }
      } else {
        // HOLD: Tidak melakukan apa-apa
        this.logger.log('No action taken (HOLD).');
      }
    } catch (error) {
      this.logger.error(`Failed to execute trade: ${error.message}`);
    }
  }
}