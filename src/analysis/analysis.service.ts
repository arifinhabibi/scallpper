import { Injectable } from '@nestjs/common';
import { AiAnalysisService } from './ai-analysis.service';
import { StrategyAnalysisService } from './strategy-analysis.service';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly aiAnalysisService: AiAnalysisService,
    private readonly strategyAnalysisService: StrategyAnalysisService,
  ) {}

  /**
   * Menganalisis pasangan mata uang.
   * @param pair Pasangan mata uang yang akan dianalisis.
   * @returns Hasil analisis lengkap.
   */
  async analyze(pair: string) {
    // Dapatkan data teknikal dari StrategyAnalysisService
    const marketData = await this.strategyAnalysisService.getTechnicalIndicators(pair);
  
    // Analisis sentimen menggunakan AI (Ollama)
    const sentimentSignal = await this.aiAnalysisService.analyzeSentiment(pair);
  
    // Analisis data pasar menggunakan 4 model AI
    const marketSignal = await this.aiAnalysisService.analyzeMarketWithMultipleAI(marketData);
  
    // Tentukan sinyal akhir berdasarkan hasil analisis AI
    let finalSignal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let reason = 'No strong signal from AI models.';
  
    if (marketSignal === 'STRONG_BUY') {
      finalSignal = 'BUY';
      reason = 'Strong buy signal detected by multiple AI models based on market indicators.';
    } else if (marketSignal === 'STRONG_SELL') {
      finalSignal = 'SELL';
      reason = 'Strong sell signal detected by multiple AI models based on market indicators.';
    }
  
    return {
      marketData: {
        signal: finalSignal || 'HOLD', // Pastikan signal selalu ada
        price: marketData.price,
        indicators: marketData.indicators,
      },
      sentimentAnalysis: sentimentSignal,
      marketAnalysis: marketSignal,
      reason: reason, // Alasan kuat dari salah satu AI
    };
  }
}