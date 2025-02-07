import { Injectable } from '@nestjs/common';
import { StrategyAnalysisService } from './analysis/strategy-analysis.service';

@Injectable()
export class BacktestService {
  constructor(private readonly strategyAnalysisService: StrategyAnalysisService) {}

  async runBacktest(pair: string, startDate: Date, endDate: Date) {
    const results = [];
    let balance = 10000; // Modal awal
    let btcBalance = 0;

    // Ambil data historis
    const historicalData = await this.strategyAnalysisService.getHistoricalData(pair, startDate, endDate);

    for (const candle of historicalData) {
      const indicators = this.calculateIndicators(historicalData.slice(0, historicalData.indexOf(candle)));
      const signal = this.generateSignal(indicators);

      if (signal === 'BUY' && balance > 0) {
        btcBalance = balance / candle.close;
        balance = 0;
        results.push({ date: candle.openTime, action: 'BUY', price: candle.close, balance });
      } else if (signal === 'SELL' && btcBalance > 0) {
        balance = btcBalance * candle.close;
        btcBalance = 0;
        results.push({ date: candle.openTime, action: 'SELL', price: candle.close, balance });
      }
    }

    return { results, finalBalance: balance + btcBalance * historicalData[historicalData.length - 1].close };
  }

  private calculateIndicators(data: any[]) {
    // Hitung indikator teknikal seperti EMA, RSI, MACD, dll.
    const ema20 = this.calculateEMA(data, 20);
    const ema50 = this.calculateEMA(data, 50);
    const rsi = this.calculateRSI(data, 14);
    const macd = this.calculateMACD(data);

    return { ema20, ema50, rsi, macd };
  }

  private generateSignal(indicators: any) {
    // Logika sederhana untuk menghasilkan sinyal
    if (indicators.ema20 > indicators.ema50 && indicators.rsi < 70) {
      return 'BUY';
    } else if (indicators.ema20 < indicators.ema50 && indicators.rsi > 30) {
      return 'SELL';
    }
    return 'HOLD';
  }

  private calculateEMA(data: any[], period: number): number {
    // Implementasi EMA (sama seperti di StrategyAnalysisService)
    const closes = data.map((candle) => candle.close);
    const multiplier = 2 / (period + 1);
    let ema = closes[0];
    for (let i = 1; i < closes.length; i++) {
      ema = (closes[i] - ema) * multiplier + ema;
    }
    return parseFloat(ema.toFixed(2));
  }

  private calculateRSI(data: any[], period: number): number {
    // Implementasi RSI (sama seperti di StrategyAnalysisService)
    const closes = data.map((candle) => candle.close);
    if (closes.length < period + 1) return 50;

    const gains = [];
    const losses = [];
    for (let i = 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const rs = avgLoss === 0 ? 0 : avgGain / avgLoss;
    return parseFloat((100 - 100 / (1 + rs)).toFixed(2));
  }

  private calculateMACD(data: any[]): number {
    const ema12 = this.calculateEMA(data, 12);
    const ema26 = this.calculateEMA(data, 26);
    return ema12 - ema26;
  }
}