import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class BinanceService {
  private readonly baseUrl = `${process.env.BASE_URL_BINANCE}/api/v3`;

  /**
   * Mendapatkan harga terkini dari pasangan mata uang tertentu.
   * @param pair Pasangan mata uang (contoh: 'BTCUSDT').
   * @returns Harga terkini.
   */
  async getCurrentPrice(pair: string): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/ticker/price`, {
        params: { symbol: pair.toUpperCase() },
      });
      return parseFloat(response.data.price);
    } catch (error) {
      console.error(`Error fetching current price from Binance: ${error.message}`);
      throw new Error('Failed to fetch current price from Binance');
    }
  }

  /**
   * Mendapatkan data historis candlestick dengan format lengkap.
   * @param pair Pasangan mata uang (contoh: 'BTCUSDT').
   * @param interval Interval waktu (misalnya '15m', '1h').
   * @param limit Jumlah candlestick yang diambil.
   * @returns Data candlestick dalam format standar.
   */
  async getHistoricalData(pair: string, interval: string = '15m', limit: number = 50) {
    try {
      const response = await axios.get(`${this.baseUrl}/klines`, {
        params: {
          symbol: pair.toUpperCase(),
          interval,
          limit,
        },
      });

      // Parsing data candlestick
      const klines = response.data.map((kline: any) => ({
        openTime: kline[0], // Waktu pembukaan dalam timestamp (ms)
        open: parseFloat(kline[1]), // Harga pembukaan
        high: parseFloat(kline[2]), // Harga tertinggi
        low: parseFloat(kline[3]), // Harga terendah
        close: parseFloat(kline[4]), // Harga penutupan
        volume: parseFloat(kline[5]), // Volume trading
        closeTime: kline[6], // Waktu penutupan dalam timestamp (ms)
        quoteAssetVolume: parseFloat(kline[7]), // Volume dalam quote asset (misalnya USDT)
        numberOfTrades: parseInt(kline[8], 10), // Jumlah trade
        takerBuyBaseAssetVolume: parseFloat(kline[9]), // Volume beli oleh taker dalam base asset
        takerBuyQuoteAssetVolume: parseFloat(kline[10]), // Volume beli oleh taker dalam quote asset
      }));

      return klines;
    } catch (error) {
      console.error(`Error fetching historical data from Binance: ${error.message}`);
      throw new Error('Failed to fetch historical data from Binance');
    }
  }
}