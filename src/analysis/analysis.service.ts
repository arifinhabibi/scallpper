import { Injectable } from '@nestjs/common';
import { StrategyAnalysisService } from './strategy-analysis.service';
import { SentimentAnalysisService } from './sentiment-analysis.service';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly sentimentAnalysisService: SentimentAnalysisService,
    private readonly strategyAnalysisService: StrategyAnalysisService,
  ) {}

  /**
   * Menganalisis pasangan mata uang.
   * @param pair Pasangan mata uang yang akan dianalisis.
   * @returns Hasil analisis lengkap dalam format standar.
   */
  async analyze(pair: string) {
    try {
      // Dapatkan data teknikal dari StrategyAnalysisService
      const strategyResult = await this.strategyAnalysisService.strategyAnalysis(pair);

      // Analisis sentimen menggunakan AI (Ollama)
      const sentimentSignal = await this.sentimentAnalysisService.analyzeSentiment(pair);


      return {
        signal: strategyResult.signal,
        sentiment: sentimentSignal,
        score_signal: strategyResult.score_signal,
        reason: strategyResult.reason,
      };
    } catch (error) {
      console.error(`Error during analysis for pair ${pair}:`, error.message);
      throw new Error('Failed to analyze the market.');
    }
  }
}