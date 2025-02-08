import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class IndodaxBrokerService {
  private readonly baseUrl = `https://indodax.com/tapi`;
  private readonly baseUrlPublic = `https://indodax.com/api`;
  private apiKey = process.env.API_KEY_INDODAX;
  private secretKey = process.env.SECRET_KEY_INDODAX || '';
  private nonce = Date.now();

  private createSignature(params: string): string {
    return crypto.createHmac('sha512', this.secretKey).update(params).digest('hex');
  }

  private async postRequest(params: Record<string, any>) {
    this.nonce += 1;
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

  // PUBLIC API METHODS
  async getTicker(pair: string) {
    return axios.get(`${this.baseUrlPublic}/${pair}/ticker`);
  }

  async getAllTickers() {
    return axios.get(`${this.baseUrlPublic}/tickers`);
  }

  async getTrades(pair: string) {
    return axios.get(`${this.baseUrlPublic}/${pair}/trades`);
  }

  async getDepth(pair: string) {
    return axios.get(`${this.baseUrlPublic}/${pair}/depth`);
  }

  // PRIVATE API METHODS
  async getBalance() {
    return this.postRequest({ method: 'getInfo' });
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

  async getOrderHistory(pair?: string) {
    return this.postRequest({ method: 'orderHistory', ...(pair ? { pair } : {}) });
  }
  
  // mesti di check
  async getLatestOrderId(pair: string){
    const getOrderHistory = await this.getOrderHistory(pair);
    return getOrderHistory[getOrderHistory.length - 1].order_id;
  }

  async getOrder(orderId: string, pair: string) {
    return this.postRequest({ method: 'getOrder', order_id: orderId, pair });
  }

  async createOrder(pair: string, type: 'buy' | 'sell', price: number, amount: number) {
    return this.postRequest({
      method: 'trade',
      pair,
      type,
      price: price.toString(),
      amount: amount.toString(),
    });
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