import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import { CurrencyConversionService } from 'src/utils/currency-conversion.utils';

@Injectable()
export class IndodaxBrokerService {
  private readonly baseUrl = `${process.env.BASE_URL_INDODAX}/tapi`;
  private apiKey = `${process.env.API_KEY_INDODAX}`;
  private secretKey = `${process.env.SECRET_KEY_INDODAX}`;
  private nonce = Date.now(); // Pastikan nonce selalu bertambah

  constructor(private readonly currencyConversionService: CurrencyConversionService) {}

  private createSignature(params: string): string {
    return crypto.createHmac('sha512', this.secretKey).update(params).digest('hex');
  }

  private async postRequest(params: Record<string, any>) {
    this.nonce += 1; // Pastikan nonce selalu bertambah
    params.nonce = this.nonce.toString();
    const paramString = new URLSearchParams(params).toString();
    const signature = this.createSignature(paramString);
    const response = await axios.post(this.baseUrl, paramString, {
      headers: { Key: this.apiKey, Sign: signature },
    });
    if (response.data.success !== 1) {
      throw new Error(response.data.error || 'API request failed');
    }
    return response.data.return;
  }

  async getOrderHistory(pair?: string) {
    return this.postRequest({ method: 'orderHistory', ...(pair ? { pair } : {}) });
  }

  /**
   * Mendapatkan order ID terbaru dari riwayat order.
   */
  async getLatestOrderId(pair: string): Promise<string | null> {
    try {
      const orderHistory = await this.getOrderHistory(pair);
      const orders = orderHistory.orders;

      if (!orders || orders.length === 0) {
        console.warn('Tidak ada order dalam riwayat.');
        return null;
      }

      // Ambil order terbaru (berdasarkan submit_time)
      const latestOrder = orders.reduce((prev, current) => {
        return prev.submit_time > current.submit_time ? prev : current;
      });

      return latestOrder.order_id;
    } catch (error) {
      console.error(`Error fetching order history: ${error.message}`);
      return null;
    }
  }

  async getBalance() {
    return this.postRequest({ method: 'getInfo' });
  }

  /**
   * Membuat order dengan konversi IDR ke quote currency jika diperlukan.
   */
  async createOrder(pair: string, type: 'buy' | 'sell', price: number, amount: number) {
    // Parsing pair currency
    const baseCurrency = pair.slice(0, 3); // Misalnya BTC
    const quoteCurrency = pair.slice(3); // Misalnya IDR atau USD
  
    // Ambil balance
    const balance = await this.getBalance();
  
    // Jika quote currency bukan IDR, konversi IDR ke quote currency
    let convertedAmount = amount;
    if (quoteCurrency !== 'IDR') {
      const currencyConversionService = new CurrencyConversionService();
      const exchangeRate = await currencyConversionService.getExchangeRate('IDR', quoteCurrency);
      const idrAmount = balance.idr; // Saldo IDR
      const convertedIdr = idrAmount / exchangeRate; // Konversi IDR ke quote currency
      convertedAmount = Math.min(convertedIdr, amount); // Gunakan jumlah yang lebih kecil
    }
  
    // Buat order dengan jumlah yang telah dikonversi
    // return this.postRequest({
    //   method: 'trade',
    //   pair,
    //   type,
    //   price: price.toString(),
    //   amount: convertedAmount.toString(),
    // });
  }

  async getTransactionHistory() {
    return this.postRequest({ method: 'transHistory' });
  }

  async getTradeHistory(pair: string) {
    return this.postRequest({ method: 'tradeHistory', pair });
  }

  async getOpenOrders(pair?: string) {
    return this.postRequest({ method: 'openOrders', ...(pair ? { pair } : {}) });
  }

  async getOrder(orderId: string, pair: string) {
    return this.postRequest({ method: 'getOrder', order_id: orderId, pair });
  }

  async cancelOrder(orderId: string, pair: string, type: 'buy' | 'sell') {
    return this.postRequest({ method: 'cancelOrder', order_id: orderId, pair, type });
  }

  async withdrawCoin(currency: string, address: string, amount: number, memo?: string) {
    return this.postRequest({
      method: 'withdrawCoin',
      currency,
      withdraw_address: address,
      withdraw_amount: amount.toString(),
      ...(memo ? { withdraw_memo: memo } : {}),
    });
  }
}