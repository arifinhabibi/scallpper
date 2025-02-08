import { Injectable } from '@nestjs/common';
import { StrategyAnalysisService } from 'src/analysis/strategy-analysis.service';

@Injectable()
export class TradingStrategyService {
  constructor(private readonly strategyAnalysisService: StrategyAnalysisService) {}

  /**
   * Mengevaluasi strategi trading untuk pasangan mata uang tertentu.
   * @param pair Pasangan mata uang (contoh: 'BTCUSDT').
   * @returns Keputusan trading dan alasan di balik keputusan tersebut.
   */
  async evaluateStrategy(pair: string): Promise<{
    signal: 'BUY' | 'SELL' | 'HOLD';
    reason: string;
    score_signal: number;
  }> {
    try {
      // Dapatkan analisis pasar dari StrategyAnalysisService
      const analysisResult = await this.strategyAnalysisService.strategyAnalysis(pair);

      // Logika strategi trading
      const { signal, score_signal, reason } = analysisResult;

      // Tambahkan logika tambahan jika diperlukan
      if (score_signal > 80) {
        return {
          signal: 'BUY',
          reason: 'Strong buy signal detected with high confidence.',
          score_signal,
        };
      } else if (score_signal < 20) {
        return {
          signal: 'SELL',
          reason: 'Strong sell signal detected with high confidence.',
          score_signal,
        };
      }

      // Default jika tidak ada sinyal kuat
      return {
        signal: 'HOLD',
        reason: 'No strong signal detected. Holding position is recommended.',
        score_signal,
      };
    } catch (error) {
      console.error(`Error evaluating trading strategy for pair ${pair}:`, error.message);
      throw new Error('Failed to evaluate trading strategy.');
    }
  }

  /**
   * Menghitung risiko dan reward berdasarkan harga saat ini dan target.
   * @param currentPrice Harga saat ini.
   * @param targetPrice Target harga.
   * @param stopLoss Harga stop-loss.
   * @returns Rasio risiko-reward.
   */
  calculateRiskReward(currentPrice: number, targetPrice: number, stopLoss: number): number {
    const potentialProfit = Math.abs(targetPrice - currentPrice);
    const potentialLoss = Math.abs(currentPrice - stopLoss);

    if (potentialLoss === 0) {
      console.warn('Potential loss is zero. Risk-reward ratio cannot be calculated.');
      return 0;
    }

    return potentialProfit / potentialLoss;
  }

  /**
   * Memeriksa apakah kondisi pasar sesuai dengan strategi tertentu.
   * @param indicators Indikator teknikal.
   * @returns Apakah kondisi pasar mendukung strategi.
   */
  isMarketConditionFavorable(indicators: any): boolean {
    const { ema20, ema50, rsi, macd } = indicators;

    // Contoh strategi: Golden Cross + RSI oversold + MACD bullish
    const isGoldenCross = ema20 > ema50; // EMA 20 melintasi EMA 50 dari bawah
    const isRsiOversold = rsi < 30; // RSI di bawah 30 (oversold)
    const isMacdBullish = macd > 0; // MACD positif

    return isGoldenCross && isRsiOversold && isMacdBullish;
  }
}