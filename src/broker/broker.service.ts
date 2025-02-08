import { Injectable, Logger } from '@nestjs/common';
import { IndodaxBrokerService } from './indodax-broker.service';

@Injectable()
export class BrokerService {
    private readonly logger = new Logger(BrokerService.name);
  constructor(private readonly indodaxBrokerService: IndodaxBrokerService) {}

  async createOrder(pair: string, type: 'buy' | 'sell', price: number, amount: number) {
    // Tambahkan stop-loss dan take-profit
    const stopLoss = price * (type === 'buy' ? 0.95 : 1.05); // 5% stop-loss
    const takeProfit = price * (type === 'buy' ? 1.1 : 0.9); // 10% take-profit

    this.logger.log(`Creating ${type.toUpperCase()} order with stop-loss at ${stopLoss} and take-profit at ${takeProfit}`);
    return this.indodaxBrokerService.createOrder(pair, type, price, amount);
  }

  async getLatestOrderId(pair: string): Promise<string | null> {
    return this.indodaxBrokerService.getLatestOrderId(pair);
  }

  async getOrder(orderId: string, pair: string) {
    return this.indodaxBrokerService.getOrder(orderId, pair);
  }
  async cancelOrder(orderId: string, pair: string, type: 'buy' | 'sell') {
    return this.indodaxBrokerService.cancelOrder(orderId, pair, type);
  }

  async getBalance() {
    return this.indodaxBrokerService.getBalance();
  }
  async getPriceBTCIndodax() {
    return this.indodaxBrokerService.getTicker("btc_idr");
  }
}