import { Injectable } from '@nestjs/common';
import { MarketDataService } from 'src/market-data/market-data.service';

@Injectable()
export class StrategyAnalysisService {
  constructor(private readonly marketDataService: MarketDataService) {}

  /**
   * Mendapatkan indikator teknikal berdasarkan frame time 15 menit.
   * @param pair Pasangan mata uang (contoh: 'BTCUSDT').
   * @returns Data indikator teknikal.
   */
  async getTechnicalIndicators(pair: string) {
    // Ambil data candlestick dari pasar
    const marketData = await this.marketDataService.getMarketData(pair);
    const binanceData = marketData.binance;

    // Hitung indikator teknikal
    const ema20 = this.calculateEMA(binanceData, 20);
    const ema50 = this.calculateEMA(binanceData, 50);
    const rsi = this.calculateRSI(binanceData, 14);
    const macd = this.calculateMACD(binanceData);

    // Ambil harga penutupan terakhir dan volume
    const lastCandle = binanceData[binanceData.length - 1];
    const avgVolume = this.calculateAverageVolume(binanceData, 20);

    // Kembalikan data indikator teknikal tanpa sinyal
    return {
      price: lastCandle.close, // Harga penutupan terakhir
      indicators: {
        ema20,
        ema50,
        rsi,
        macd,
        volume: lastCandle.volume,
        avgVolume,
      },
    };
  }

  /**
   * Menghitung Exponential Moving Average (EMA).
   * @param data Data candlestick.
   * @param period Periode EMA.
   * @returns Nilai EMA.
   */
  private calculateEMA(data: any[], period: number): number {
    const closes = data.map((candle) => candle.close);
    const multiplier = 2 / (period + 1);
    let ema = closes[0];
    for (let i = 1; i < closes.length; i++) {
      ema = (closes[i] - ema) * multiplier + ema;
    }
    return parseFloat(ema.toFixed(2));
  }

  /**
   * Menghitung Relative Strength Index (RSI).
   * @param data Data candlestick.
   * @param period Periode RSI.
   * @returns Nilai RSI.
   */
  private calculateRSI(data: any[], period: number): number {
    const closes = data.map((candle) => candle.close);
    if (closes.length < period + 1) {
      console.warn(`Not enough data to calculate RSI for period ${period}`);
      return 50; // Nilai default RSI jika data tidak cukup
    }
    const gains: number[] = [];
    const losses: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    const avgGain =
      gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const avgLoss =
      losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);
    return parseFloat(rsi.toFixed(2));
  }

  /**
   * Menghitung Moving Average Convergence Divergence (MACD).
   * @param data Data candlestick.
   * @returns Nilai MACD.
   */
  private calculateMACD(data: any[]): number {
    const ema12 = this.calculateEMA(data, 12);
    const ema26 = this.calculateEMA(data, 26);
    return ema12 - ema26;
  }

  /**
   * Menghitung rata-rata volume.
   * @param data Data candlestick.
   * @param period Periode rata-rata.
   * @returns Rata-rata volume.
   */
  private calculateAverageVolume(data: any[], period: number): number {
    const volumes = data.map((candle) => candle.volume);
    const totalVolume = volumes.slice(-period).reduce((a, b) => a + b, 0);
    return parseFloat((totalVolume / period).toFixed(2));
  }
}